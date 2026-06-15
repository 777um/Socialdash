/**
 * KPI ROUTER - Backend para Dashboard de Métricas
 */

import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getDb } from './db';
import { scriptExecutions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const kpiRouter = router({
  /**
   * Get KPI metrics for dashboard
   */
  getMetrics: protectedProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        // Get date range
        const now = new Date();
        const daysAgo = input.timeRange === '7d' ? 7 : input.timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        // Get executions in time range
        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(eq(scriptExecutions.userId, ctx.user.id));

        const filtered = executions.filter((e) => new Date(e.createdAt) >= startDate);

        const total = filtered.length;
        const successful = filtered.filter((e) => e.status === 'success').length;
        const failed = filtered.filter((e) => e.status === 'failed').length;
        const pending = filtered.filter((e) => e.status === 'pending').length;

        const successRate = total > 0 ? ((successful / total) * 100).toFixed(2) : '0';
        const avgTime = total > 0
          ? (filtered.reduce((sum, e) => sum + (e.executionTime || 0), 0) / total).toFixed(0)
          : '0';

        return {
          successRate: parseFloat(successRate),
          totalExecutions: total,
          successfulExecutions: successful,
          failedExecutions: failed,
          pendingExecutions: pending,
          averageExecutionTime: parseInt(avgTime),
          timeRange: input.timeRange,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get KPI metrics',
        });
      }
    }),

  /**
   * Get performance by script type
   */
  getScriptPerformance: protectedProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        const now = new Date();
        const daysAgo = input.timeRange === '7d' ? 7 : input.timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(eq(scriptExecutions.userId, ctx.user.id));

        const filtered = executions.filter((e) => new Date(e.createdAt) >= startDate);

        // Group by script type
        const byScript = filtered.reduce((acc, exec) => {
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

        return Object.entries(byScript).map(([scriptType, stats]) => ({
          scriptType,
          successRate: stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(0) : '0',
          executionCount: stats.total,
        }));
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get script performance',
        });
      }
    }),

  /**
   * Get recommendations based on performance
   */
  getRecommendations: protectedProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        const now = new Date();
        const daysAgo = input.timeRange === '7d' ? 7 : input.timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(eq(scriptExecutions.userId, ctx.user.id));

        const filtered = executions.filter((e) => new Date(e.createdAt) >= startDate);

        const recommendations: string[] = [];

        // Analyze success rate
        const successRate = filtered.length > 0
          ? (filtered.filter((e) => e.status === 'success').length / filtered.length) * 100
          : 0;

        if (successRate < 80) {
          recommendations.push('Aumente testes para melhorar taxa de sucesso (atual: ' + successRate.toFixed(0) + '%)');
        }

        // Analyze execution time
        const avgTime = filtered.length > 0
          ? filtered.reduce((sum, e) => sum + (e.executionTime || 0), 0) / filtered.length
          : 0;

        if (avgTime > 60000) {
          recommendations.push('Otimize scripts com tempo médio > 60s (atual: ' + (avgTime / 1000).toFixed(0) + 's)');
        }

        // Analyze failure patterns
        const failedCount = filtered.filter((e) => e.status === 'failed').length;
        if (failedCount > filtered.length * 0.1) {
          recommendations.push('Investigar falhas recorrentes (' + failedCount + ' falhas)');
        }

        // Default recommendation
        if (recommendations.length === 0) {
          recommendations.push('Excelente desempenho! Continue monitorando as métricas');
        }

        return recommendations;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get recommendations',
        });
      }
    }),
});
