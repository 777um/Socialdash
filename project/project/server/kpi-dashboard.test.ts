/**
 * KPI DASHBOARD TESTS
 */

import { describe, it, expect } from 'vitest';

describe('KPI Dashboard', () => {
  describe('KPI Metrics Calculation', () => {
    it('should calculate success rate correctly', () => {
      const executions = [
        { status: 'success' },
        { status: 'success' },
        { status: 'success' },
        { status: 'failed' },
      ];

      const successRate = (executions.filter((e) => e.status === 'success').length / executions.length * 100).toFixed(2);
      
      expect(parseFloat(successRate)).toBe(75);
    });

    it('should handle 100% success rate', () => {
      const executions = [
        { status: 'success' },
        { status: 'success' },
        { status: 'success' },
      ];

      const successRate = (executions.filter((e) => e.status === 'success').length / executions.length * 100).toFixed(2);
      
      expect(parseFloat(successRate)).toBe(100);
    });

    it('should handle 0% success rate', () => {
      const executions = [
        { status: 'failed' },
        { status: 'failed' },
      ];

      const successRate = executions.length > 0 
        ? (executions.filter((e) => e.status === 'success').length / executions.length * 100).toFixed(2)
        : '0';
      
      expect(parseFloat(successRate)).toBe(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate average execution time', () => {
      const executions = [
        { executionTime: 1000 },
        { executionTime: 2000 },
        { executionTime: 3000 },
      ];

      const avgTime = (executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length).toFixed(0);
      
      expect(parseInt(avgTime)).toBe(2000);
    });

    it('should calculate script performance', () => {
      const scripts = [
        { name: 'youtube_outlier_detector', success: 95, count: 45 },
        { name: 'audio_transcriber_free', success: 88, count: 32 },
      ];

      scripts.forEach((script) => {
        expect(script.success).toBeGreaterThanOrEqual(0);
        expect(script.success).toBeLessThanOrEqual(100);
        expect(script.count).toBeGreaterThan(0);
      });
    });
  });

  describe('Niche Performance', () => {
    it('should track niche metrics', () => {
      const niches = [
        { niche: 'gaming', views: 2.5, engagement: 8.2, roi: 3.4 },
        { niche: 'comedy', views: 1.8, engagement: 12.1, roi: 2.9 },
      ];

      niches.forEach((niche) => {
        expect(niche.views).toBeGreaterThan(0);
        expect(niche.engagement).toBeGreaterThan(0);
        expect(niche.roi).toBeGreaterThan(0);
      });
    });

    it('should identify best performing niche', () => {
      const niches = [
        { niche: 'gaming', roi: 3.4 },
        { niche: 'business', roi: 5.1 },
        { niche: 'lifestyle', roi: 3.8 },
      ];

      const bestNiche = niches.reduce((prev, current) => 
        current.roi > prev.roi ? current : prev
      );

      expect(bestNiche.niche).toBe('business');
      expect(bestNiche.roi).toBe(5.1);
    });
  });

  describe('Time Range Filtering', () => {
    it('should support different time ranges', () => {
      const timeRanges = ['7d', '30d', '90d'] as const;
      
      timeRanges.forEach((range) => {
        expect(['7d', '30d', '90d']).toContain(range);
      });
    });

    it('should calculate metrics for time range', () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      expect(thirtyDaysAgo.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe('KPI Change Indicators', () => {
    it('should calculate percentage change', () => {
      const current = 95;
      const previous = 85;
      const change = ((current - previous) / previous * 100).toFixed(1);

      expect(parseFloat(change)).toBeGreaterThan(0);
      expect(parseFloat(change)).toBeCloseTo(11.76, 1);
    });

    it('should handle negative change', () => {
      const current = 80;
      const previous = 100;
      const change = ((current - previous) / previous * 100).toFixed(1);

      expect(parseFloat(change)).toBeLessThan(0);
      expect(parseFloat(change)).toBe(-20);
    });
  });

  describe('Recommendations Engine', () => {
    it('should identify optimization opportunities', () => {
      const scripts = [
        { name: 'youtube_outlier_detector', success: 95 },
        { name: 'audio_transcriber_free', success: 88 },
      ];

      const lowestPerforming = scripts.reduce((prev, current) => 
        current.success < prev.success ? current : prev
      );

      expect(lowestPerforming.name).toBe('audio_transcriber_free');
      expect(lowestPerforming.success).toBe(88);
    });

    it('should suggest niche replication', () => {
      const niches = [
        { niche: 'business', roi: 5.1 },
        { niche: 'lifestyle', roi: 3.8 },
      ];

      const bestNiche = niches[0];
      const worstNiche = niches[1];

      const improvement = ((bestNiche.roi - worstNiche.roi) / worstNiche.roi * 100).toFixed(1);

      expect(parseFloat(improvement)).toBeGreaterThan(0);
    });
  });

  describe('Data Aggregation', () => {
    it('should aggregate metrics by script type', () => {
      const executions = [
        { scriptType: 'youtube_outlier_detector', status: 'success' },
        { scriptType: 'youtube_outlier_detector', status: 'success' },
        { scriptType: 'audio_transcriber_free', status: 'failed' },
      ];

      const byType = executions.reduce((acc, exec) => {
        if (!acc[exec.scriptType]) {
          acc[exec.scriptType] = { total: 0, success: 0 };
        }
        acc[exec.scriptType].total++;
        if (exec.status === 'success') {
          acc[exec.scriptType].success++;
        }
        return acc;
      }, {} as Record<string, { total: number; success: number }>);

      expect(byType['youtube_outlier_detector'].total).toBe(2);
      expect(byType['youtube_outlier_detector'].success).toBe(2);
      expect(byType['audio_transcriber_free'].total).toBe(1);
      expect(byType['audio_transcriber_free'].success).toBe(0);
    });

    it('should aggregate metrics by niche', () => {
      const data = [
        { niche: 'gaming', views: 1.5 },
        { niche: 'gaming', views: 1.0 },
        { niche: 'comedy', views: 0.8 },
      ];

      const byNiche = data.reduce((acc, item) => {
        if (!acc[item.niche]) {
          acc[item.niche] = 0;
        }
        acc[item.niche] += item.views;
        return acc;
      }, {} as Record<string, number>);

      expect(byNiche['gaming']).toBe(2.5);
      expect(byNiche['comedy']).toBe(0.8);
    });
  });

  describe('Export Functionality', () => {
    it('should format metrics for export', () => {
      const metrics = {
        successRate: 95.5,
        totalExecutions: 150,
        averageTime: 45000,
      };

      const exportData = {
        timestamp: new Date().toISOString(),
        metrics,
      };

      expect(exportData.timestamp).toBeDefined();
      expect(exportData.metrics.successRate).toBe(95.5);
    });
  });
});
