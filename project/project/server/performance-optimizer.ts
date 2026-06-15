import { Response } from 'express';
import zlib from 'zlib';

/**
 * Performance Optimizer - Caching, Compressão e Otimização
 */

// ============================================================================
// 1. RESPONSE CACHING
// ============================================================================

interface CacheEntry {
  data: string;
  timestamp: number;
  ttl: number;
}

const responseCache = new Map<string, CacheEntry>();

export interface CacheConfig {
  ttl?: number; // Time to live em segundos
  key: string;
}

/**
 * Gerar chave de cache
 */
export function generateCacheKey(
  userId: string,
  endpoint: string,
  params?: Record<string, any>
): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${userId}:${endpoint}:${paramStr}`;
}

/**
 * Obter valor do cache
 */
export function getFromCache(key: string): string | null {
  const entry = responseCache.get(key);

  if (!entry) {
    return null;
  }

  // Verificar se expirou
  if (Date.now() - entry.timestamp > entry.ttl * 1000) {
    responseCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Armazenar no cache
 */
export function setInCache(key: string, data: string, ttl: number = 300): void {
  if (ttl <= 0) {
    responseCache.delete(key);
    return;
  }

  responseCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Invalidar cache
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear();
    return;
  }

  const regex = new RegExp(pattern);
  responseCache.forEach((_, key) => {
    if (regex.test(key)) {
      responseCache.delete(key);
    }
  });
}

/**
 * Limpar cache expirado
 */
export function cleanExpiredCache(): void {
  const now = Date.now();

  responseCache.forEach((entry, key) => {
    if (now - entry.timestamp > entry.ttl * 1000) {
      responseCache.delete(key);
    }
  });
}

// ============================================================================
// 2. RESPONSE COMPRESSION
// ============================================================================

/**
 * Comprimir response com gzip
 */
export async function compressResponse(data: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.gzip(data, (err, compressed) => {
      if (err) reject(err);
      else resolve(compressed);
    });
  });
}

/**
 * Middleware de compressão
 */
export async function compressionMiddleware(data: string, res: Response): Promise<void> {
  const acceptEncoding = res.req?.headers['accept-encoding'] || '';

  if (acceptEncoding.includes('gzip')) {
    try {
      const compressed = await compressResponse(data);
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Length', compressed.length);
      res.send(compressed);
      return;
    } catch {
      // Fallback para uncompressed
    }
  }

  res.setHeader('Content-Length', Buffer.byteLength(data));
  res.send(data);
}

// ============================================================================
// 3. QUERY OPTIMIZATION
// ============================================================================

/**
 * Índices de banco de dados recomendados
 */
export const RECOMMENDED_INDEXES = [
  // Notifications
  'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)',

  // Jobs
  'CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)',
  'CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)',

  // Webhooks
  'CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON webhooks(event_type)',

  // Alerts
  'CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_alerts_enabled ON alerts(enabled)',

  // Execution Status
  'CREATE INDEX IF NOT EXISTS idx_execution_status_job_id ON execution_status(job_id)',
  'CREATE INDEX IF NOT EXISTS idx_execution_status_created_at ON execution_status(created_at)',
];

/**
 * Query optimization hints
 */
export const QUERY_OPTIMIZATION_HINTS = {
  notifications: {
    selectFields: ['id', 'user_id', 'title', 'content', 'is_read', 'created_at'],
    limit: 50,
    orderBy: 'created_at DESC',
  },
  jobs: {
    selectFields: ['id', 'user_id', 'type', 'status', 'progress', 'created_at'],
    limit: 100,
    orderBy: 'created_at DESC',
  },
  webhooks: {
    selectFields: ['id', 'user_id', 'event_type', 'url', 'enabled', 'created_at'],
    limit: 50,
    orderBy: 'created_at DESC',
  },
};

// ============================================================================
// 4. LAZY LOADING & PAGINATION
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Calcular offset e limit
 */
export function calculatePagination(page: number = 1, limit: number = 20): PaginationParams {
  const validLimit = Math.min(Math.max(limit, 1), 100); // 1-100
  const validPage = Math.max(page, 1);
  const offset = (validPage - 1) * validLimit;

  return {
    page: validPage,
    limit: validLimit,
    offset,
  };
}

/**
 * Gerar headers de paginação
 */
export function generatePaginationHeaders(
  total: number,
  page: number,
  limit: number
): Record<string, string> {
  const totalPages = Math.ceil(total / limit);

  return {
    'X-Total-Count': total.toString(),
    'X-Page': page.toString(),
    'X-Page-Size': limit.toString(),
    'X-Total-Pages': totalPages.toString(),
    'X-Has-Next': (page < totalPages).toString(),
    'X-Has-Prev': (page > 1).toString(),
  };
}

// ============================================================================
// 5. BUNDLE SIZE OPTIMIZATION
// ============================================================================

/**
 * Estatísticas de bundle
 */
export interface BundleStats {
  size: number;
  gzipSize: number;
  modules: number;
}

/**
 * Calcular tamanho do bundle
 */
export async function calculateBundleSize(data: string): Promise<BundleStats> {
  const size = Buffer.byteLength(data);
  const compressed = await compressResponse(data);
  const gzipSize = compressed.length;

  return {
    size,
    gzipSize,
    modules: 0, // Será preenchido pelo webpack
  };
}

/**
 * Recomendações de otimização
 */
export function getBundleOptimizationTips(stats: BundleStats): string[] {
  const tips: string[] = [];

  if (stats.size > 500 * 1024) {
    tips.push('Bundle muito grande (> 500KB). Considere code splitting.');
  }

  if (stats.gzipSize > 200 * 1024) {
    tips.push('Bundle gzipped muito grande (> 200KB). Remova dependências não utilizadas.');
  }

  const ratio = stats.gzipSize / stats.size;
  if (ratio > 0.5) {
    tips.push(`Compressão baixa (${(ratio * 100).toFixed(1)}%). Verifique se há código duplicado.`);
  }

  return tips;
}

// ============================================================================
// 6. PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetrics {
  responseTime: number;
  cacheHit: boolean;
  compressed: boolean;
  bundleSize: number;
}

/**
 * Coletar métricas de performance
 */
export function collectMetrics(
  startTime: number,
  cacheHit: boolean,
  compressed: boolean,
  bundleSize: number
): PerformanceMetrics {
  return {
    responseTime: Date.now() - startTime,
    cacheHit,
    compressed,
    bundleSize,
  };
}

/**
 * Gerar relatório de performance
 */
export function generatePerformanceReport(metrics: PerformanceMetrics[]): {
  avgResponseTime: number;
  cacheHitRate: number;
  compressionRate: number;
  avgBundleSize: number;
} {
  if (metrics.length === 0) {
    throw new Error('No performance metrics provided');
  }

  const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
  const cacheHitRate =
    (metrics.filter(m => m.cacheHit).length / metrics.length) * 100;
  const compressionRate =
    (metrics.filter(m => m.compressed).length / metrics.length) * 100;
  const avgBundleSize = metrics.reduce((sum, m) => sum + m.bundleSize, 0) / metrics.length;

  return {
    avgResponseTime,
    cacheHitRate,
    compressionRate,
    avgBundleSize,
  };
}

// ============================================================================
// 7. CLEANUP
// ============================================================================

/**
 * Iniciar limpeza periódica de cache
 */
export function startCacheCleanup(intervalMs: number = 60000): void {
  setInterval(() => {
    cleanExpiredCache();
  }, intervalMs);
}

/**
 * Obter estatísticas do cache
 */
export function getCacheStats(): {
  size: number;
  entries: number;
  memoryUsage: string;
} {
  let memoryUsage = 0;

  responseCache.forEach(entry => {
    memoryUsage += entry.data.length;
  });

  return {
    size: responseCache.size,
    entries: responseCache.size,
    memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)} MB`,
  };
}
