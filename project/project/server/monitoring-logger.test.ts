import { describe, it, expect, beforeEach } from 'vitest';
import {
  StructuredLogger,
  LogLevel,
  recordRequestMetric,
  getMetrics,
  getLogs,
  getErrorLogs,
  generatePerformanceReport,
  getHealthStatus,
  clearLogs,
  clearMetrics,
} from './monitoring-logger';

describe('Monitoring & Logging', () => {
  beforeEach(() => {
    clearLogs();
    clearMetrics();
  });

  describe('StructuredLogger', () => {
    it('should create logger instance', () => {
      const logger = new StructuredLogger('req-1', 'user-1');
      expect(logger).toBeDefined();
    });

    it('should log debug message', () => {
      const logger = new StructuredLogger('req-1');
      logger.debug('Debug message', { key: 'value' });

      const logs = getLogs({ limit: 1 });
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
    });

    it('should log info message', () => {
      const logger = new StructuredLogger('req-1');
      logger.info('Info message');

      const logs = getLogs({ limit: 1 });
      expect(logs[0].level).toBe(LogLevel.INFO);
    });

    it('should log warning message', () => {
      const logger = new StructuredLogger('req-1');
      logger.warn('Warning message');

      const logs = getLogs({ limit: 1 });
      expect(logs[0].level).toBe(LogLevel.WARN);
    });

    it('should log error message', () => {
      const logger = new StructuredLogger('req-1');
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      const logs = getLogs({ limit: 1 });
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].error?.message).toBe('Test error');
    });

    it('should log audit action', () => {
      const logger = new StructuredLogger('req-1', 'user-1');
      logger.audit('DELETE', 'webhook', { webhookId: '123' });

      const logs = getLogs({ limit: 1 });
      expect(logs[0].message).toContain('AUDIT');
    });

    it('should log performance', () => {
      const logger = new StructuredLogger('req-1');
      logger.performance('database_query', 150, true);

      const logs = getLogs({ limit: 1 });
      expect(logs[0].message).toContain('Performance');
    });

    it('should include requestId in logs', () => {
      const logger = new StructuredLogger('req-123');
      logger.info('Test message');

      const logs = getLogs({ limit: 1 });
      expect(logs[0].requestId).toBe('req-123');
    });

    it('should include userId in logs', () => {
      const logger = new StructuredLogger('req-1', 'user-456');
      logger.info('Test message');

      const logs = getLogs({ limit: 1 });
      expect(logs[0].userId).toBe('user-456');
    });

    it('should include duration in logs', () => {
      const logger = new StructuredLogger('req-1');
      logger.info('Test message');

      const logs = getLogs({ limit: 1 });
      expect(logs[0].duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metrics Collection', () => {
    it('should record request metric', () => {
      recordRequestMetric('/api/users', 100, true);

      const metrics = getMetrics();
      expect(metrics.requestCount).toBe(1);
    });

    it('should track successful requests', () => {
      recordRequestMetric('/api/users', 100, true);
      recordRequestMetric('/api/users', 150, true);

      const metrics = getMetrics();
      expect(metrics.requestCount).toBe(2);
      expect(metrics.errorCount).toBe(0);
    });

    it('should track failed requests', () => {
      recordRequestMetric('/api/users', 100, true);
      recordRequestMetric('/api/users', 150, false);

      const metrics = getMetrics();
      expect(metrics.requestCount).toBe(2);
      expect(metrics.errorCount).toBe(1);
    });

    it('should calculate average response time', () => {
      recordRequestMetric('/api/users', 100, true);
      recordRequestMetric('/api/users', 200, true);

      const metrics = getMetrics();
      expect(metrics.avgResponseTime).toBe(150);
    });

    it('should calculate percentiles', () => {
      for (let i = 1; i <= 100; i++) {
        recordRequestMetric('/api/users', i * 10, true);
      }

      const metrics = getMetrics();
      expect(metrics.p95ResponseTime).toBeGreaterThan(0);
      expect(metrics.p99ResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Log Retrieval', () => {
    it('should get all logs', () => {
      const logger = new StructuredLogger('req-1');
      logger.info('Message 1');
      logger.info('Message 2');

      const logs = getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter logs by level', () => {
      const logger = new StructuredLogger('req-1');
      logger.info('Info message');
      logger.error('Error message', new Error('test'));

      const errorLogs = getLogs({ level: LogLevel.ERROR });
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs.every(l => l.level === LogLevel.ERROR)).toBe(true);
    });

    it('should get error logs', () => {
      const logger = new StructuredLogger('req-1');
      logger.error('Error 1', new Error('test1'));
      logger.error('Error 2', new Error('test2'));

      const errorLogs = getErrorLogs();
      expect(errorLogs.length).toBeGreaterThanOrEqual(2);
    });

    it('should limit log results', () => {
      const logger = new StructuredLogger('req-1');
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = getLogs({ limit: 5 });
      expect(logs.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Performance Report', () => {
    it('should generate performance report', () => {
      recordRequestMetric('/api/users', 100, true);
      recordRequestMetric('/api/posts', 200, true);

      const report = generatePerformanceReport();

      expect(report.metrics).toBeDefined();
      expect(report.topEndpoints).toBeDefined();
      expect(report.errorRate).toBeDefined();
    });

    it('should calculate error rate', () => {
      recordRequestMetric('/api/users', 100, true);
      recordRequestMetric('/api/users', 150, false);

      const report = generatePerformanceReport();
      expect(report.errorRate).toBe(50);
    });

    it('should identify top endpoints', () => {
      recordRequestMetric('/api/users', 100, true);
      recordRequestMetric('/api/users', 150, true);
      recordRequestMetric('/api/posts', 200, true);

      const report = generatePerformanceReport();
      expect(report.topEndpoints.length).toBeGreaterThan(0);
      expect(report.topEndpoints[0].endpoint).toBe('/api/users');
    });
  });

  describe('Health Status', () => {
    it('should return healthy status', () => {
      recordRequestMetric('/api/users', 100, true);

      const health = getHealthStatus();
      expect(health.status).toBe('healthy');
      expect(health.issues.length).toBe(0);
    });

    it('should detect high error rate', () => {
      for (let i = 0; i < 100; i++) {
        recordRequestMetric('/api/users', 100, i < 10);
      }

      const health = getHealthStatus();
      expect(health.errorRate).toBeGreaterThan(5);
    });

    it('should detect slow response time', () => {
      recordRequestMetric('/api/users', 2000, true);

      const health = getHealthStatus();
      expect(health.avgResponseTime).toBeGreaterThan(1000);
    });

    it('should include uptime', () => {
      const health = getHealthStatus();
      expect(health.uptime).toBeGreaterThan(0);
    });
  });
});
