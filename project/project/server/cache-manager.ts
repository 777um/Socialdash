/**
 * CACHE MANAGER - Cache com estratégia Cache-Aside
 * Resolve problema P1: Banco sem camada de cache visível
 * 
 * Implementa padrão Cache-Aside (Lazy Loading):
 * 1. Verificar cache
 * 2. Se miss: buscar do banco
 * 3. Atualizar cache
 * 4. Retornar
 */

import { getRedisClient } from './redis-client';
import { logPerformance, logDebug } from './async-logger';

export interface CacheOptions {
  ttl?: number; // Time to live em segundos (default: 3600 = 1 hora)
  prefix?: string; // Prefixo da chave (default: 'cache:')
}

const DEFAULT_TTL = 3600; // 1 hora
const DEFAULT_PREFIX = 'cache:';

/**
 * Gerar chave de cache
 */
function generateCacheKey(prefix: string, key: string): string {
  return `${prefix}${key}`;
}

/**
 * Obter valor do cache
 */
export async function getFromCache<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  const redis = getRedisClient();
  const prefix = options.prefix || DEFAULT_PREFIX;
  const cacheKey = generateCacheKey(prefix, key);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logDebug(`Cache HIT: ${cacheKey}`);
      return JSON.parse(cached) as T;
    }
    logDebug(`Cache MISS: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('[Cache] Erro ao obter do cache:', error);
    return null;
  }
}

/**
 * Armazenar valor no cache
 */
export async function setInCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const redis = getRedisClient();
  const prefix = options.prefix || DEFAULT_PREFIX;
  const ttl = options.ttl || DEFAULT_TTL;
  const cacheKey = generateCacheKey(prefix, key);

  try {
    await redis.setex(cacheKey, ttl, JSON.stringify(value));
    logDebug(`Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('[Cache] Erro ao armazenar no cache:', error);
  }
}

/**
 * Padrão Cache-Aside: obter com fallback para função
 */
export async function getOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const startTime = Date.now();

  // 1. Verificar cache
  const cached = await getFromCache<T>(key, options);
  if (cached !== null) {
    const duration = Date.now() - startTime;
    logPerformance(`Cache HIT: ${key}`, duration);
    return cached;
  }

  // 2. Cache miss: buscar do banco
  const data = await fetchFn();

  // 3. Atualizar cache
  await setInCache(key, data, options);

  const duration = Date.now() - startTime;
  logPerformance(`Cache MISS + FETCH: ${key}`, duration);

  // 4. Retornar
  return data;
}

/**
 * Invalidar cache
 */
export async function invalidateCache(
  key: string,
  options: CacheOptions = {}
): Promise<void> {
  const redis = getRedisClient();
  const prefix = options.prefix || DEFAULT_PREFIX;
  const cacheKey = generateCacheKey(prefix, key);

  try {
    await redis.del(cacheKey);
    logDebug(`Cache INVALIDATED: ${cacheKey}`);
  } catch (error) {
    console.error('[Cache] Erro ao invalidar cache:', error);
  }
}

/**
 * Invalidar múltiplas chaves
 */
export async function invalidateCachePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<number> {
  const redis = getRedisClient();
  const prefix = options.prefix || DEFAULT_PREFIX;
  const fullPattern = generateCacheKey(prefix, pattern);

  try {
    const keys = await redis.keys(fullPattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logDebug(`Cache INVALIDATED: ${keys.length} keys matching ${fullPattern}`);
    }
    return keys.length;
  } catch (error) {
    console.error('[Cache] Erro ao invalidar padrão:', error);
    return 0;
  }
}

/**
 * Limpar todo o cache
 */
export async function clearAllCache(options: CacheOptions = {}): Promise<void> {
  const redis = getRedisClient();
  const prefix = options.prefix || DEFAULT_PREFIX;

  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logDebug(`Cache CLEARED: ${keys.length} keys removed`);
    }
  } catch (error) {
    console.error('[Cache] Erro ao limpar cache:', error);
  }
}

/**
 * Obter estatísticas do cache
 */
export async function getCacheStats(options: CacheOptions = {}): Promise<{
  keys: number;
  memory: string;
  info: Record<string, any>;
}> {
  const redis = getRedisClient();
  const prefix = options.prefix || DEFAULT_PREFIX;

  try {
    const keys = await redis.keys(`${prefix}*`);
    const info = await redis.info('memory');

    return {
      keys: keys.length,
      memory: info,
      info: { prefix, ttl: options.ttl || DEFAULT_TTL },
    };
  } catch (error) {
    console.error('[Cache] Erro ao obter estatísticas:', error);
    return { keys: 0, memory: '', info: {} };
  }
}

/**
 * Exemplo de uso com banco de dados
 */
export async function getTemplatesByUserIdCached(
  userId: number,
  fetchFn: () => Promise<any[]>
): Promise<any[]> {
  const cacheKey = `templates:user:${userId}`;
  return getOrFetch(cacheKey, fetchFn, {
    ttl: 1800, // 30 minutos
    prefix: 'db:',
  });
}

/**
 * Invalidar cache de templates do usuário
 */
export async function invalidateUserTemplatesCache(userId: number): Promise<void> {
  const cacheKey = `templates:user:${userId}`;
  await invalidateCache(cacheKey, { prefix: 'db:' });
}

/**
 * Invalidar cache de todos os templates
 */
export async function invalidateAllTemplatesCache(): Promise<number> {
  return invalidateCachePattern('templates:*', { prefix: 'db:' });
}
