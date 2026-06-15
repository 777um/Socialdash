import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from './db';
import { scriptExecutions } from '../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * ANALYTICS ROUTER
 * Provides insights into script execution patterns and performance
 * Tracks metrics for optimization and monitoring
 */

export const analyticsRouter = router({
  /**
   * Get execution statistics for a time period
   * Returns aggregated metrics and trends
   */
  stats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        scriptType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const conditions = [
          eq(scriptExecutions.userId, ctx.user.id),
          gte(scriptExecutions.createdAt, startDate),
        ];

        if (input.scriptType) {
          conditions.push(eq(scriptExecutions.scriptType, input.scriptType));
        }

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(and(...conditions));

        // Calculate statistics
        const stats = {
          totalExecutions: executions.length,
          successCount: executions.filter((e: any) => e.status === 'success').length,
          failureCount: executions.filter((e: any) => e.status === 'failed').length,
          pendingCount: executions.filter((e: any) => e.status === 'pending').length,
          successRate: 0,
          averageExecutionTime: 0,
          byScript: {} as Record<string, any>,
          timeline: [] as any[],
        };

        if (stats.totalExecutions > 0) {
          stats.successRate = (stats.successCount / stats.totalExecutions) * 100;
        }

        const executionTimes = executions
          .filter((e: any) => e.executionTime)
          .map((e: any) => e.executionTime);

        if (executionTimes.length > 0) {
          stats.averageExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
        }

        // Group by script type
        (executions as any[]).forEach(exec => {
          if (!stats.byScript[exec.scriptType]) {
            stats.byScript[exec.scriptType] = {
              count: 0,
              success: 0,
              failed: 0,
              avgTime: 0,
            };
          }

          stats.byScript[exec.scriptType].count++;
          if (exec.status === 'success') stats.byScript[exec.scriptType].success++;
          if (exec.status === 'failed') stats.byScript[exec.scriptType].failed++;
        });

        // Create daily timeline
        const timeline: Record<string, number> = {};
        (executions as any[]).forEach(exec => {
          const date = new Date(exec.createdAt).toISOString().split('T')[0];
          timeline[date] = (timeline[date] || 0) + 1;
        });

        stats.timeline = Object.entries(timeline)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return {
          success: true,
          stats,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch statistics',
        });
      }
    }),

  /**
   * Get performance metrics for optimization
   * Shows which scripts are most efficient
   */
  performance: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(
            and(
              eq(scriptExecutions.userId, ctx.user.id),
              gte(scriptExecutions.createdAt, startDate)
            )
          );

        // Calculate performance metrics
        const performance: Record<string, any> = {};

        (executions as any[]).forEach(exec => {
          if (!performance[exec.scriptType]) {
            performance[exec.scriptType] = {
              scriptType: exec.scriptType,
              executions: 0,
              successRate: 0,
              avgTime: 0,
              minTime: Infinity,
              maxTime: 0,
              errors: [],
            };
          }

          const perf = performance[exec.scriptType];
          perf.executions++;

          if (exec.status === 'success' && exec.executionTime) {
            perf.avgTime = (perf.avgTime * (perf.executions - 1) + exec.executionTime) / perf.executions;
            perf.minTime = Math.min(perf.minTime, exec.executionTime);
            perf.maxTime = Math.max(perf.maxTime, exec.executionTime);
          }

          if (exec.status === 'failed' && exec.error) {
            perf.errors.push({
              timestamp: exec.createdAt,
              message: exec.error.slice(0, 200),
            });
          }
        });

        // Calculate success rates
        Object.values(performance).forEach((perf: any) => {
          const successCount = (executions as any[]).filter(
            e => e.scriptType === perf.scriptType && e.status === 'success'
          ).length;
          perf.successRate = (successCount / perf.executions) * 100;
        });

        // Sort by efficiency (success rate * speed)
        const sorted = Object.values(performance)
          .sort((a: any, b: any) => {
            const scoreA = (a.successRate / 100) * (1000 / (a.avgTime || 1000));
            const scoreB = (b.successRate / 100) * (1000 / (b.avgTime || 1000));
            return scoreB - scoreA;
          })
          .slice(0, input.limit);

        return {
          success: true,
          performance: sorted,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch performance metrics',
        });
      }
    }),

  /**
   * Get recent executions with details
   * For debugging and monitoring
   */
  recent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(['pending', 'success', 'failed']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const conditions = [eq(scriptExecutions.userId, ctx.user.id)];

        if (input.status) {
          conditions.push(eq(scriptExecutions.status, input.status));
        }

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(and(...conditions))
          .limit(input.limit);

        return {
          success: true,
          executions: executions || [],
          total: executions?.length || 0,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch recent executions',
        });
      }
    }),

  /**
   * Get execution trends
   * Shows usage patterns over time
   */
  trends: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        interval: z.enum(['day', 'week', 'month']).default('day'),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(
            and(
              eq(scriptExecutions.userId, ctx.user.id),
              gte(scriptExecutions.createdAt, startDate)
            )
          );

        // Group by interval
        const trends: Record<string, any> = {};

        (executions as any[]).forEach(exec => {
          const date = new Date(exec.createdAt);
          let key: string;

          if (input.interval === 'day') {
            key = date.toISOString().split('T')[0];
          } else if (input.interval === 'week') {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = `Week of ${weekStart.toISOString().split('T')[0]}`;
          } else {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }

          if (!trends[key]) {
            trends[key] = {
              period: key,
              total: 0,
              success: 0,
              failed: 0,
              pending: 0,
            };
          }

          trends[key].total++;
          trends[key][exec.status]++;
        });

        const sorted = Object.values(trends)
          .sort((a: any, b: any) => a.period.localeCompare(b.period));

        return {
          success: true,
          trends: sorted,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch trends',
        });
      }
    }),

  /**
   * Get health check
   * Monitors system status
   */
  health: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          status: 'unhealthy',
          message: 'Database unavailable',
        };
      }

      // Check recent executions
      const recentExecutions = await db
        .select()
        .from(scriptExecutions)
        .where(eq(scriptExecutions.userId, ctx.user.id))
        .limit(100);

      const successCount = (recentExecutions as any[]).filter(e => e.status === 'success').length;
      const failureCount = (recentExecutions as any[]).filter(e => e.status === 'failed').length;

      const healthScore = recentExecutions.length > 0 ? (successCount / recentExecutions.length) * 100 : 100;

      return {
        success: true,
        status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy',
        healthScore,
        recentExecutions: recentExecutions.length,
        successCount,
        failureCount,
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'error',
        message: error.message,
      };
    }
  }),
});
