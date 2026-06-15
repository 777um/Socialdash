/**
 * EXECUTION STATUS ROUTER
 * Provides endpoints to check script execution status
 */

import { publicProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getDb } from './db';
import { scriptExecutions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const executionStatusRouter = router({
  /**
   * Get execution status by ID
   */
  getStatus: publicProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        // In a real implementation, we would look up by executionId
        // For now, we return a mock status
        const statuses = ['pending', 'running', 'success', 'failed'] as const;
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        return {
          executionId: input.executionId,
          status: randomStatus,
          progress: randomStatus === 'running' ? Math.floor(Math.random() * 100) : 100,
          startedAt: new Date(Date.now() - 60000),
          completedAt: randomStatus === 'success' || randomStatus === 'failed' ? new Date() : null,
          output: randomStatus === 'success' ? 'Script executed successfully' : null,
          error: randomStatus === 'failed' ? 'Script execution failed' : null,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get execution status',
        });
      }
    }),

  /**
   * List recent executions for a user
   */
  listRecent: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db || !ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(eq(scriptExecutions.userId, ctx.user.id))
          .limit(input.limit)
          .orderBy((t) => t.createdAt);

        return {
          executions: executions.map((exec) => ({
            id: exec.id,
            scriptType: exec.scriptType,
            status: exec.status,
            createdAt: exec.createdAt,
            executionTime: exec.executionTime,
            output: exec.output,
            error: exec.error,
          })),
          total: executions.length,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to list executions',
        });
      }
    }),

  /**
   * Get execution statistics
   */
  getStats: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        if (!db || !ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(eq(scriptExecutions.userId, ctx.user.id));

        const stats = {
          total: executions.length,
          successful: executions.filter((e) => e.status === 'success').length,
          failed: executions.filter((e) => e.status === 'failed').length,
          pending: executions.filter((e) => e.status === 'pending').length,
          successRate: executions.length > 0 
            ? (executions.filter((e) => e.status === 'success').length / executions.length * 100).toFixed(2)
            : 0,
          averageExecutionTime: executions.length > 0
            ? (executions.reduce((sum, e) => sum + (e.executionTime || 0), 0) / executions.length).toFixed(0)
            : 0,
        };

        return stats;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get statistics',
        });
      }
    }),
});
