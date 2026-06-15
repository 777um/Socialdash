/**
 * REDIS CLIENT - Gerenciador centralizado de conexão Redis
 * Usado para CSRF, Rate Limit, Sessões e Cache
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Inicializar cliente Redis
 */
export function initRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Conectado com sucesso');
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Erro de conexão:', err);
  });

  return redisClient;
}

/**
 * Obter cliente Redis
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    return initRedisClient();
  }
  return redisClient;
}

/**
 * Fechar conexão Redis
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
