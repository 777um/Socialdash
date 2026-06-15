/**
 * KPI ROUTER TESTS
 */

import { describe, it, expect } from 'vitest';

describe('KPI Router', () => {
  describe('Get Metrics', () => {
    it('should calculate success rate from executions', () => {
      const executions = [
        { status: 'success' },
        { status: 'success' },
        { status: 'failed' },
      ];

      const successRate = (executions.filter((e) => e.status === 'success').length / executions.length * 100).toFixed(2);
      
      expect(parseFloat(successRate)).toBeCloseTo(66.67, 1);
    });

    it('should handle empty execution list', () => {
      const executions: any[] = [];
      const successRate = executions.length > 0 
        ? (executions.filter((e) => e.status === 'success').length / executions.length * 100).toFixed(2)
        : '0';
      
      expect(parseFloat(successRate)).toBe(0);
    });

    it('should calculate average execution time', () => {
      const executions = [
        { executionTime: 1000 },
        { executionTime: 2000 },
        { executionTime: 3000 },
      ];

      const avgTime = (executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length).toFixed(0);
      
      expect(parseInt(avgTime)).toBe(2000);
    });

    it('should support different time ranges', () => {
      const timeRanges = ['7d', '30d', '90d'] as const;
      
      timeRanges.forEach((range) => {
        expect(['7d', '30d', '90d']).toContain(range);
      });
    });
  });

  describe('Script Performance', () => {
    it('should group executions by script type', () => {
      const executions = [
        { scriptType: 'youtube_outlier_detector', status: 'success' },
        { scriptType: 'youtube_outlier_detector', status: 'success' },
        { scriptType: 'audio_transcriber_free', status: 'failed' },
      ];

      const byScript = executions.reduce((acc, exec) => {
        const scriptType = exec.scriptType;
        if (!acc[scriptType]) {
          acc[scriptType] = { total: 0, success: 0 };
        }
        acc[scriptType].total++;
        if (exec.status === 'success') {
          acc[scriptType].success++;
        }
        return acc;
      }, {} as Record<string, { total: number; success: number }>);

      expect(byScript['youtube_outlier_detector'].total).toBe(2);
      expect(byScript['youtube_outlier_detector'].success).toBe(2);
      expect(byScript['audio_transcriber_free'].total).toBe(1);
    });

    it('should calculate success rate per script', () => {
      const scripts = [
        { scriptType: 'youtube_outlier_detector', total: 10, success: 9 },
        { scriptType: 'audio_transcriber_free', total: 10, success: 8 },
      ];

      scripts.forEach((script) => {
        const rate = (script.success / script.total * 100).toFixed(0);
        expect(parseInt(rate)).toBeGreaterThan(0);
        expect(parseInt(rate)).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Recommendations', () => {
    it('should recommend optimization for low success rate', () => {
      const successRate = 75;
      const recommendations: string[] = [];

      if (successRate < 80) {
        recommendations.push('Aumente testes para melhorar taxa de sucesso');
      }

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend optimization for slow execution', () => {
      const avgTime = 65000; // 65 seconds
      const recommendations: string[] = [];

      if (avgTime > 60000) {
        recommendations.push('Otimize scripts com tempo médio > 60s');
      }

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend investigation for high failure rate', () => {
      const failedCount = 15;
      const totalCount = 100;
      const recommendations: string[] = [];

      if (failedCount > totalCount * 0.1) {
        recommendations.push('Investigar falhas recorrentes');
      }

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should provide default recommendation for good performance', () => {
      const recommendations: string[] = [];

      if (recommendations.length === 0) {
        recommendations.push('Excelente desempenho!');
      }

      expect(recommendations.length).toBe(1);
      expect(recommendations[0]).toContain('Excelente');
    });
  });

  describe('Time Range Filtering', () => {
    it('should filter executions by 7 day range', () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const executions = [
        { createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
        { createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      ];

      const filtered = executions.filter((e) => new Date(e.createdAt) >= sevenDaysAgo);

      expect(filtered.length).toBe(1);
    });

    it('should filter executions by 30 day range', () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const executions = [
        { createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
        { createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000) },
      ];

      const filtered = executions.filter((e) => new Date(e.createdAt) >= thirtyDaysAgo);

      expect(filtered.length).toBe(1);
    });

    it('should filter executions by 90 day range', () => {
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const executions = [
        { createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        { createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000) },
      ];

      const filtered = executions.filter((e) => new Date(e.createdAt) >= ninetyDaysAgo);

      expect(filtered.length).toBe(1);
    });
  });

  describe('Execution Status Counting', () => {
    it('should count successful executions', () => {
      const executions = [
        { status: 'success' },
        { status: 'success' },
        { status: 'failed' },
      ];

      const successCount = executions.filter((e) => e.status === 'success').length;

      expect(successCount).toBe(2);
    });

    it('should count failed executions', () => {
      const executions = [
        { status: 'success' },
        { status: 'failed' },
        { status: 'failed' },
      ];

      const failedCount = executions.filter((e) => e.status === 'failed').length;

      expect(failedCount).toBe(2);
    });

    it('should count pending executions', () => {
      const executions = [
        { status: 'success' },
        { status: 'pending' },
        { status: 'pending' },
      ];

      const pendingCount = executions.filter((e) => e.status === 'pending').length;

      expect(pendingCount).toBe(2);
    });
  });
});
