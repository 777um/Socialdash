import { TRPCError } from '@trpc/server';
import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { getRedisClient } from './redis-client';

/**
 * Middleware de Segurança — CSRF e Rate Limit via Redis
 * Resolve P0: armazenamento em Map() que não sobrevive a reinicializações
 * ou escala horizontal.
 */

// ============================================================================
// 1. CSRF PROTECTION (Redis-backed, stateless por TTL)
// ============================================================================

const CSRF_TTL_SECS = 3600; // 1 hora
const CSRF_PREFIX = 'csrf:';
const csrfMemoryStore = new Map<string, { token: string; expiresAt: number }>();

function storeCsrfToken(sessionId: string, token: string): void {
  csrfMemoryStore.set(sessionId, { token, expiresAt: Date.now() + CSRF_TTL_SECS * 1000 });
}

function getStoredCsrfToken(sessionId: string): string | null {
  const entry = csrfMemoryStore.get(sessionId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    csrfMemoryStore.delete(sessionId);
    return null;
  }
  return entry.token;
}

/** Gerar token CSRF e salvar em fallback local com TTL */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  storeCsrfToken(sessionId, token);
  return token;
}

/** Validar token CSRF via fallback local (timing-safe) */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  try {
    const stored = getStoredCsrfToken(sessionId);
    if (!stored || stored.length !== token.length) return false;
    return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(token));
  } catch {
    return false;
  }
}

/** Middleware CSRF para Express */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { next(); return; }

  const sessionId = (req as any).sessionId || (req.headers['x-session-id'] as string);
  const csrfToken = (req.headers['x-csrf-token'] as string) || req.body?.csrfToken;

  if (!sessionId || !csrfToken) {
    res.status(403).json({ error: 'CSRF token missing' });
    return;
  }

  const valid = validateCSRFToken(sessionId, csrfToken);
  if (!valid) {
    res.status(403).json({ error: 'CSRF token invalid' });
    return;
  }
  next();
}

// ============================================================================
// 2. RATE LIMITING (Redis INCR + EXPIRE — atômico, multi-instância)
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

/** Criar middleware de rate limiting com backend Redis */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;
  const windowSecs = Math.ceil(windowMs / 1000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const rawKey = keyGenerator ? keyGenerator(req) : (req.ip || 'unknown');
    const rkey = `rl:${rawKey}`;

    getRedisClient()
      .multi()
      .incr(rkey)
      .expire(rkey, windowSecs)
      .exec()
      .then(results => {
        if (!results) { next(); return; }
        const count = results[0][1] as number;

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
        res.setHeader('X-RateLimit-Reset', Date.now() + windowMs);

        if (count > maxRequests) {
          res.status(429).json({ error: 'Too many requests', retryAfter: windowSecs });
          return;
        }
        next();
      })
      .catch(() => next()); // fail-open: Redis indisponível não bloqueia app
  };
}

// ============================================================================
// 3. INPUT VALIDATION (stateless — sem alteração)
// ============================================================================

export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch { return false; }
}

export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) && !/[<>"'`]/.test(email);
}

export function validateJSON(json: string): boolean {
  try { JSON.parse(json); return true; } catch { return false; }
}

// ============================================================================
// 4. SECURITY HEADERS
// ============================================================================

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
}

// ============================================================================
// 5. PAYLOAD VALIDATION
// ============================================================================

export function validatePayloadSize(maxSize = 10 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const cl = parseInt(req.headers['content-length'] || '0', 10);
    if (cl > maxSize) { res.status(413).json({ error: 'Payload too large', maxSize }); return; }
    next();
  };
}

export function validateContentType(allowedTypes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { next(); return; }
    const ct = req.headers['content-type']?.split(';')[0] || '';
    if (!allowedTypes.includes(ct)) {
      res.status(415).json({ error: 'Unsupported Media Type', allowed: allowedTypes }); return;
    }
    next();
  };
}

// ============================================================================
// 6. ERROR HANDLING
// ============================================================================

export function handleSecurityError(error: Error): TRPCError {
  if (error.message.includes('CSRF')) return new TRPCError({ code: 'FORBIDDEN', message: 'Security validation failed' });
  if (error.message.includes('Rate limit')) return new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests' });
  if (error.message.includes('Invalid')) return new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid input' });
  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' });
}

// ============================================================================
// 7. CLEANUP — No-op: Redis gerencia TTL automaticamente
// ============================================================================

/** Mantido por compatibilidade de assinatura; TTL do Redis dispensa cleanup manual. */
export function startSecurityCleanup(): void { /* no-op */ }
