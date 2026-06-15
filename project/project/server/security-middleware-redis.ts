/**
 * SECURITY MIDDLEWARE - Com Redis para CSRF, Rate Limit e Sessões
 * Resolve problema P0: Segurança baseada em memória RAM
 */

import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { getRedisClient } from './redis-client';

/**
 * ============================================================================
 * 1. CSRF PROTECTION COM REDIS
 * ============================================================================
 */

const CSRF_TOKEN_EXPIRY = 3600; // 1 hora em segundos
const CSRF_TOKEN_PREFIX = 'csrf:';

/**
 * Gerar token CSRF
 */
export async function generateCSRFToken(sessionId: string): Promise<string> {
  const redis = getRedisClient();
  const token = crypto.randomBytes(32).toString('hex');
  const key = `${CSRF_TOKEN_PREFIX}${sessionId}`;

  // Armazenar em Redis com expiração
  await redis.setex(key, CSRF_TOKEN_EXPIRY, token);

  return token;
}

/**
 * Validar token CSRF
 */
export async function validateCSRFToken(
  sessionId: string,
  token: string
): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${CSRF_TOKEN_PREFIX}${sessionId}`;

  try {
    const stored = await redis.get(key);

    if (!stored) {
      return false;
    }

    // Comparação timing-safe
    return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(token));
  } catch (error) {
    console.error('[CSRF] Erro ao validar token:', error);
    return false;
  }
}

/**
 * Middleware CSRF
 */
export async function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // GET requests não precisam de CSRF token
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const sessionId = (req as any).sessionId || (req.headers['x-session-id'] as string);
  const csrfToken = (req.headers['x-csrf-token'] as string) || req.body?.csrfToken;

  if (!sessionId || !csrfToken) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  const isValid = await validateCSRFToken(sessionId, csrfToken);

  if (!isValid) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }

  next();
}

/**
 * ============================================================================
 * 2. RATE LIMITING COM REDIS (Melhorado)
 * ============================================================================
 */

const RATE_LIMIT_PREFIX = 'ratelimit:';
const RATE_LIMIT_WINDOW = 60; // 1 minuto em segundos
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requisições por minuto

/**
 * Gerar chave de rate limit combinando múltiplos fatores
 * Resolve problema P0: Rate limit facilmente burlável
 */
function generateRateLimitKey(req: Request, userId?: number): string {
  // Combinar IP + User ID + JWT + Fingerprint
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userIdPart = userId ? `user:${userId}` : 'anonymous';
  const jwtPart = req.headers.authorization ? 'auth' : 'noauth';
  const fingerprint = req.headers['x-fingerprint'] as string || 'default';

  return `${RATE_LIMIT_PREFIX}${ip}:${userIdPart}:${jwtPart}:${fingerprint}`;
}

/**
 * Verificar rate limit
 */
export async function checkRateLimit(
  req: Request,
  userId?: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const redis = getRedisClient();
  const key = generateRateLimitKey(req, userId);

  try {
    const current = await redis.incr(key);

    // Se for a primeira requisição, definir expiração
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - current);
    const ttl = await redis.ttl(key);
    const resetTime = Date.now() + ttl * 1000;

    return {
      allowed: current <= RATE_LIMIT_MAX_REQUESTS,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error('[RateLimit] Erro ao verificar limite:', error);
    // Falhar aberto (permitir) em caso de erro
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS,
      resetTime: Date.now() + RATE_LIMIT_WINDOW * 1000,
    };
  }
}

/**
 * Middleware Rate Limit
 */
export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req as any).userId;
  const limit = await checkRateLimit(req, userId);

  // Adicionar headers de rate limit
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', limit.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(limit.resetTime / 1000));

  if (!limit.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
    });
  }

  next();
}

/**
 * ============================================================================
 * 3. SESSION MANAGEMENT COM REDIS
 * ============================================================================
 */

const SESSION_PREFIX = 'session:';
const SESSION_EXPIRY = 86400; // 24 horas em segundos

/**
 * Criar sessão
 */
export async function createSession(
  sessionId: string,
  data: Record<string, any>
): Promise<void> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  try {
    await redis.setex(key, SESSION_EXPIRY, JSON.stringify(data));
  } catch (error) {
    console.error('[Session] Erro ao criar sessão:', error);
    throw error;
  }
}

/**
 * Obter sessão
 */
export async function getSession(sessionId: string): Promise<Record<string, any> | null> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Session] Erro ao obter sessão:', error);
    return null;
  }
}

/**
 * Atualizar sessão
 */
export async function updateSession(
  sessionId: string,
  data: Record<string, any>
): Promise<void> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  try {
    await redis.setex(key, SESSION_EXPIRY, JSON.stringify(data));
  } catch (error) {
    console.error('[Session] Erro ao atualizar sessão:', error);
    throw error;
  }
}

/**
 * Deletar sessão
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('[Session] Erro ao deletar sessão:', error);
    throw error;
  }
}

/**
 * Middleware de sessão
 */
export async function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;

  if (!sessionId) {
    // Criar nova sessão
    const newSessionId = crypto.randomBytes(16).toString('hex');
    await createSession(newSessionId, {
      createdAt: Date.now(),
      ip: req.ip,
    });
    res.cookie('sessionId', newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_EXPIRY * 1000,
    });
    (req as any).sessionId = newSessionId;
  } else {
    // Validar sessão existente
    const session = await getSession(sessionId);
    if (!session) {
      // Sessão expirada, criar nova
      const newSessionId = crypto.randomBytes(16).toString('hex');
      await createSession(newSessionId, {
        createdAt: Date.now(),
        ip: req.ip,
      });
      res.cookie('sessionId', newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_EXPIRY * 1000,
      });
      (req as any).sessionId = newSessionId;
    } else {
      (req as any).sessionId = sessionId;
      (req as any).session = session;
    }
  }

  next();
}
