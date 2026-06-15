import { TRPCError } from '@trpc/server';
import { getFromCache, setInCache, invalidateCache, generateCacheKey } from './performance-optimizer';
import { StructuredLogger } from './monitoring-logger';

/**
 * Integração de Caching com Routers tRPC
 */

export interface CacheableQueryOptions {
  ttl?: number; // Time to live em segundos
  invalidatePatterns?: string[]; // Padrões para invalidar cache
}

/**
 * Decorator para cachear queries
 */
export function cacheableQuery<T>(
  options: CacheableQueryOptions = {}
) {
  const { ttl = 300, invalidatePatterns = [] } = options;

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, userId: string, params: any, logger?: StructuredLogger) {
      const cacheKey = generateCacheKey(userId, propertyKey, params);

      // Tentar obter do cache
      const cached = getFromCache(cacheKey);
      if (cached) {
        logger?.debug('Cache hit', { endpoint: propertyKey, cacheKey });
        return JSON.parse(cached);
      }

      // Executar função original
      const result = await originalMethod.call(this, userId, params);

      // Armazenar no cache
      setInCache(cacheKey, JSON.stringify(result), ttl);
      logger?.debug('Cache set', { endpoint: propertyKey, cacheKey, ttl });

      return result;
    };

    return descriptor;
  };
}

/**
 * Helper para invalidar cache após mutação
 */
export function invalidateCacheAfterMutation(
  userId: string,
  patterns: string[]
): void {
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern.replace('{userId}', userId));
    invalidateCache(regex.source);
  });
}

/**
 * Exemplos de uso com routers tRPC
 */

// ============================================================================
// NOTIFICATIONS CACHE
// ============================================================================

export const NOTIFICATIONS_CACHE_PATTERNS = {
  list: (userId: string) => `${userId}:notifications:list`,
  count: (userId: string) => `${userId}:notifications:count`,
};

export function cacheNotificationsQueries(): void {
  // Invalidar cache quando criar/atualizar/deletar notificação
  const invalidationPatterns = [
    (userId: string) => `${userId}:notifications:.*`,
  ];
}

// ============================================================================
// KPI CACHE
// ============================================================================

export const KPI_CACHE_PATTERNS = {
  metrics: (userId: string) => `${userId}:kpi:metrics`,
  scriptPerformance: (userId: string) => `${userId}:kpi:scriptPerformance`,
  recommendations: (userId: string) => `${userId}:kpi:recommendations`,
};

export function cacheKPIQueries(): void {
  // Invalidar cache quando executar job
  const invalidationPatterns = [
    (userId: string) => `${userId}:kpi:.*`,
  ];
}

// ============================================================================
// JOBS CACHE
// ============================================================================

export const JOBS_CACHE_PATTERNS = {
  list: (userId: string) => `${userId}:jobs:list`,
  status: (userId: string, jobId: string) => `${userId}:jobs:status:${jobId}`,
  stats: (userId: string) => `${userId}:jobs:stats`,
};

export function cacheJobsQueries(): void {
  // Invalidar cache quando criar/atualizar job
  const invalidationPatterns = [
    (userId: string) => `${userId}:jobs:.*`,
  ];
}

// ============================================================================
// WEBHOOKS CACHE
// ============================================================================

export const WEBHOOKS_CACHE_PATTERNS = {
  list: (userId: string) => `${userId}:webhooks:list`,
  executions: (userId: string, webhookId: string) => `${userId}:webhooks:executions:${webhookId}`,
};

export function cacheWebhooksQueries(): void {
  // Invalidar cache quando criar/atualizar webhook
  const invalidationPatterns = [
    (userId: string) => `${userId}:webhooks:.*`,
  ];
}

// ============================================================================
// TREND ANALYSIS CACHE
// ============================================================================

export const TREND_ANALYSIS_CACHE_PATTERNS = {
  viralTrends: (userId: string) => `${userId}:trends:viral`,
  predictions: (userId: string) => `${userId}:trends:predictions`,
  insights: (userId: string) => `${userId}:trends:insights`,
};

export function cacheTrendAnalysisQueries(): void {
  // Invalidar cache quando analisar tendências
  const invalidationPatterns = [
    (userId: string) => `${userId}:trends:.*`,
  ];
}

// ============================================================================
// ALERTS CACHE
// ============================================================================

export const ALERTS_CACHE_PATTERNS = {
  list: (userId: string) => `${userId}:alerts:list`,
  active: (userId: string) => `${userId}:alerts:active`,
};

export function cacheAlertsQueries(): void {
  // Invalidar cache quando criar/atualizar alerta
  const invalidationPatterns = [
    (userId: string) => `${userId}:alerts:.*`,
  ];
}

// ============================================================================
// CACHE INVALIDATION HELPER
// ============================================================================

/**
 * Invalidar cache relacionado a uma ação
 */
export function invalidateCacheForAction(
  userId: string,
  action: 'job_created' | 'job_completed' | 'notification_sent' | 'webhook_triggered' | 'alert_triggered'
): void {
  switch (action) {
    case 'job_created':
    case 'job_completed':
      invalidateCache(`${userId}:jobs:.*`);
      invalidateCache(`${userId}:kpi:.*`);
      break;

    case 'notification_sent':
      invalidateCache(`${userId}:notifications:.*`);
      break;

    case 'webhook_triggered':
      invalidateCache(`${userId}:webhooks:.*`);
      break;

    case 'alert_triggered':
      invalidateCache(`${userId}:alerts:.*`);
      break;
  }
}

// ============================================================================
// CACHE WARMING
// ============================================================================

/**
 * Pré-carregar cache com dados críticos
 */
export async function warmCache(userId: string, loader: (userId: string) => Promise<any>): Promise<void> {
  try {
    const data = await loader(userId);
    setInCache(generateCacheKey(userId, 'warmed', {}), JSON.stringify(data), 3600);
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}

// ============================================================================
// CACHE STATISTICS
// ============================================================================

/**
 * Obter estatísticas de cache por usuário
 */
export function getCacheStatsForUser(userId: string): {
  patterns: string[];
  estimatedSize: number;
} {
  const patterns = [
    NOTIFICATIONS_CACHE_PATTERNS.list(userId),
    NOTIFICATIONS_CACHE_PATTERNS.count(userId),
    KPI_CACHE_PATTERNS.metrics(userId),
    KPI_CACHE_PATTERNS.scriptPerformance(userId),
    JOBS_CACHE_PATTERNS.list(userId),
    JOBS_CACHE_PATTERNS.stats(userId),
    WEBHOOKS_CACHE_PATTERNS.list(userId),
    TREND_ANALYSIS_CACHE_PATTERNS.viralTrends(userId),
    ALERTS_CACHE_PATTERNS.list(userId),
  ];

  return {
    patterns,
    estimatedSize: patterns.length * 1024, // Estimativa
  };
}
