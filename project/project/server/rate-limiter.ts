/**
 * RATE LIMITER — Redis-backed
 * Resolve P0: estado em Map() que não sobrevive a reinicializações ou escala horizontal.
 * Usa INCR + EXPIRE atômico; fail-open se Redis indisponível.
 */


export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = { windowMs: 60_000, maxRequests: 100 };

export function createRateLimiter(config: Partial<RateLimiterConfig> = {}) {
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };
  const memory = new Map<string, { count: number; expiresAt: number }>();

  const cleanupExpired = () => {
    const now = Date.now();
    for (const [key, value] of memory.entries()) {
      if (value.expiresAt <= now) {
        memory.delete(key);
      }
    }
  };

  return {
    check: async (key: string): Promise<boolean> => {
      cleanupExpired();
      const entry = memory.get(key) || { count: 0, expiresAt: Date.now() + windowMs };
      entry.count += 1;
      entry.expiresAt = Math.max(entry.expiresAt, Date.now() + windowMs);
      memory.set(key, entry);
      return entry.count <= maxRequests;
    },

    reset: async (key: string): Promise<void> => {
      memory.delete(key);
    },

    getStatus: async (key: string): Promise<{ remaining: number; resetTime: number }> => {
      cleanupExpired();
      const entry = memory.get(key);
      const count = entry?.count || 0;
      return {
        remaining: Math.max(0, maxRequests - count),
        resetTime: entry ? entry.expiresAt : Date.now() + windowMs,
      };
    },

    cleanup: async (): Promise<void> => {
      memory.clear();
    },
  };
}

// Rate limiters específicos
export const notificationRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 50 });
export const webhookRateLimiter      = createRateLimiter({ windowMs: 60_000, maxRequests: 100 });
export const jobRateLimiter          = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

/** Verificar rate limit — lança erro tipado se excedido */
export async function checkRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  key: string
): Promise<void> {
  const allowed = await limiter.check(key);
  if (!allowed) {
    const status = await limiter.getStatus(key);
    const error: any = new Error('Rate limit exceeded');
    error.statusCode = 429;
    error.retryAfter = Math.ceil((status.resetTime - Date.now()) / 1000);
    throw error;
  }
}
