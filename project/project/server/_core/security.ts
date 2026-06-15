import { Request, Response, NextFunction } from 'express';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import { getRedisClient } from '../redis-client';

/**
 * ENTERPRISE-GRADE SECURITY MIDDLEWARE
 * Rate limit e CSRF agora usam Redis (não mais Map em memória).
 * Utilitários (sanitize, validate, webhook) permanecem stateless.
 */

// ============================================================================
// 1. RATE LIMITING (Redis INCR + EXPIRE)
// ============================================================================

const RATE_LIMIT_WINDOW_SECS = 15 * 60; // 15 minutos
const RATE_LIMIT_MAX = 100;

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const identifier = `rl:core:${req.ip || 'unknown'}-${(req as any).user?.id || 'anon'}`;

  getRedisClient()
    .multi()
    .incr(identifier)
    .expire(identifier, RATE_LIMIT_WINDOW_SECS)
    .exec()
    .then(results => {
      if (!results) { next(); return; }
      const count = results[0][1] as number;

      res.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
      res.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX - count)));
      res.set('X-RateLimit-Reset', String(Date.now() + RATE_LIMIT_WINDOW_SECS * 1000));

      if (count > RATE_LIMIT_MAX) {
        res.status(429).json({ error: 'Too many requests. Please try again later.', retryAfter: RATE_LIMIT_WINDOW_SECS });
        return;
      }
      next();
    })
    .catch(() => next()); // fail-open
}

// ============================================================================
// 2. INPUT VALIDATION (stateless)
// ============================================================================

export function validateInput(input: any): void {
  if (!input) return;
  const suspicious = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
    /(<script|javascript:|onerror=|onload=)/i,
    /(\$\{|\$\(|`.*`)/g,
  ];
  const str = JSON.stringify(input).toLowerCase();
  for (const p of suspicious) {
    if (p.test(str)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid input detected. Please check your parameters.' });
    }
  }
}

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').trim().slice(0, 10000);
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const h = parsed.hostname.toLowerCase();
    const private_ = [/^localhost$/, /^127\./, /^192\.168\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^::1$/, /^fc00:/];
    return !private_.some(p => p.test(h));
  } catch { return false; }
}

// ============================================================================
// 3. CSRF (Redis-backed, one-time tokens)
// ============================================================================

const CSRF_TTL_SECS = 86400; // 24 horas
const CSRF_PREFIX = 'csrf:core:';

export async function generateCsrfToken(_userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await getRedisClient().setex(`${CSRF_PREFIX}${token}`, CSRF_TTL_SECS, '1');
  return token;
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const key = `${CSRF_PREFIX}${token}`;
    const exists = await redis.get(key);
    if (!exists) return false;
    await redis.del(key); // one-time use
    return true;
  } catch { return false; }
}

// ============================================================================
// 4. UTILITIES (stateless — sem estado)
// ============================================================================

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = generateWebhookSignature(payload, secret);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  next();
}

export function requestTimeoutMiddleware(timeout = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = setTimeout(() => {
      if (!res.headersSent) res.status(408).json({ error: 'Request timeout' });
    }, timeout);
    res.on('finish', () => clearTimeout(id));
    res.on('close', () => clearTimeout(id));
    next();
  };
}

export function logSecurityEvent(eventType: string, userId: string | null, details: Record<string, any>) {
  console.log('[SECURITY]', JSON.stringify({ timestamp: new Date().toISOString(), eventType, userId, ...details }));
}
