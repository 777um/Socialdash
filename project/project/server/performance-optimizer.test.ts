import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateCacheKey,
  getFromCache,
  setInCache,
  invalidateCache,
  calculatePagination,
  generatePaginationHeaders,
  collectMetrics,
  generatePerformanceReport,
  getCacheStats,
} from './performance-optimizer';

describe('Performance Optimizer', () => {
  beforeEach(() => {
    invalidateCache();
  });

  describe('Cache Management', () => {
    it('should generate cache key', () => {
      const key = generateCacheKey('user-1', 'notifications', { limit: 10 });

      expect(key).toBeDefined();
      expect(key).toContain('user-1');
      expect(key).toContain('notifications');
    });

    it('should store and retrieve from cache', () => {
      const key = 'test-key';
      const data = '{"test": "data"}';

      setInCache(key, data, 300);
      const cached = getFromCache(key);

      expect(cached).toBe(data);
    });

    it('should return null for non-existent key', () => {
      const cached = getFromCache('non-existent');
      expect(cached).toBeNull();
    });

    it('should handle cache expiry', async () => {
      const key = 'test-key';
      const data = '{"test": "data"}';

      setInCache(key, data, 1); // 1 segundo TTL
      expect(getFromCache(key)).toBe(data);

      // Esperar expiração
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(getFromCache(key)).toBeNull();
    });

    it('should invalidate all cache', () => {
      setInCache('key-1', 'data-1', 300);
      setInCache('key-2', 'data-2', 300);

      invalidateCache();

      expect(getFromCache('key-1')).toBeNull();
      expect(getFromCache('key-2')).toBeNull();
    });

    it('should invalidate cache by pattern', () => {
      setInCache('user-1:notifications', 'data-1', 300);
      setInCache('user-1:jobs', 'data-2', 300);
      setInCache('user-2:notifications', 'data-3', 300);

      invalidateCache('user-1:.*');

      expect(getFromCache('user-1:notifications')).toBeNull();
      expect(getFromCache('user-1:jobs')).toBeNull();
      expect(getFromCache('user-2:notifications')).toBe('data-3');
    });

    it('should get cache stats', () => {
      setInCache('key-1', 'data-1', 300);
      setInCache('key-2', 'data-2', 300);

      const stats = getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toBe(2);
      expect(stats.memoryUsage).toBeDefined();
    });
  });

  describe('Pagination', () => {
    it('should calculate pagination for first page', () => {
      const pagination = calculatePagination(1, 20);

      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(20);
      expect(pagination.offset).toBe(0);
    });

    it('should calculate pagination for second page', () => {
      const pagination = calculatePagination(2, 20);

      expect(pagination.page).toBe(2);
      expect(pagination.limit).toBe(20);
      expect(pagination.offset).toBe(20);
    });

    it('should enforce minimum limit', () => {
      const pagination = calculatePagination(1, 0);

      expect(pagination.limit).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const pagination = calculatePagination(1, 200);

      expect(pagination.limit).toBe(100);
    });

    it('should handle negative page', () => {
      const pagination = calculatePagination(-1, 20);

      expect(pagination.page).toBe(1);
    });

    it('should generate pagination headers', () => {
      const headers = generatePaginationHeaders(100, 1, 20);

      expect(headers['X-Total-Count']).toBe('100');
      expect(headers['X-Page']).toBe('1');
      expect(headers['X-Page-Size']).toBe('20');
      expect(headers['X-Total-Pages']).toBe('5');
      expect(headers['X-Has-Next']).toBe('true');
      expect(headers['X-Has-Prev']).toBe('false');
    });

    it('should generate pagination headers for last page', () => {
      const headers = generatePaginationHeaders(100, 5, 20);

      expect(headers['X-Has-Next']).toBe('false');
      expect(headers['X-Has-Prev']).toBe('true');
    });
  });

  describe('Performance Metrics', () => {
    it('should collect metrics', () => {
      const startTime = Date.now() - 100;
      const metrics = collectMetrics(startTime, true, true, 1024);

      expect(metrics.responseTime).toBeGreaterThanOrEqual(100);
      expect(metrics.cacheHit).toBe(true);
      expect(metrics.compressed).toBe(true);
      expect(metrics.bundleSize).toBe(1024);
    });

    it('should generate performance report', () => {
      const metrics = [
        { responseTime: 100, cacheHit: true, compressed: true, bundleSize: 1024 },
        { responseTime: 200, cacheHit: false, compressed: true, bundleSize: 2048 },
        { responseTime: 150, cacheHit: true, compressed: false, bundleSize: 1536 },
      ];

      const report = generatePerformanceReport(metrics);

      expect(report.avgResponseTime).toBe(150);
      expect(report.cacheHitRate).toBeCloseTo(66.67, 1);
      expect(report.compressionRate).toBeCloseTo(66.67, 1);
      expect(report.avgBundleSize).toBe(1536);
    });

    it('should handle empty metrics', () => {
      const metrics: any[] = [];

      // Deve lançar erro ou retornar valores padrão
      expect(() => generatePerformanceReport(metrics)).toThrow();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent keys', () => {
      const key1 = generateCacheKey('user-1', 'notifications', { limit: 10 });
      const key2 = generateCacheKey('user-1', 'notifications', { limit: 10 });

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different params', () => {
      const key1 = generateCacheKey('user-1', 'notifications', { limit: 10 });
      const key2 = generateCacheKey('user-1', 'notifications', { limit: 20 });

      expect(key1).not.toBe(key2);
    });

    it('should handle undefined params', () => {
      const key = generateCacheKey('user-1', 'notifications');

      expect(key).toBeDefined();
      expect(key).toContain('user-1');
    });
  });

  describe('Cache Expiry', () => {
    it('should not return expired cache', async () => {
      const key = 'test-key';
      const data = '{"test": "data"}';

      setInCache(key, data, 1); // 1 segundo
      expect(getFromCache(key)).toBe(data);

      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(getFromCache(key)).toBeNull();
    });

    it('should handle zero TTL', () => {
      const key = 'test-key';
      const data = '{"test": "data"}';

      setInCache(key, data, 0);
      expect(getFromCache(key)).toBeNull();
    });

    it('should handle very long TTL', async () => {
      const key = 'test-key';
      const data = '{"test": "data"}';

      setInCache(key, data, 3600); // 1 hora
      expect(getFromCache(key)).toBe(data);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(getFromCache(key)).toBe(data);
    });
  });
});
