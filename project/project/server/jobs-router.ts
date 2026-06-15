import { router, publicProcedure, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getQueueManager, JobType } from './queue-manager';

export const jobsRouter = router({
  /**
   * Submeter novo job para processamento
   */
  submitJob: protectedProcedure
    .input(
      z.object({
        type: z.enum(['youtube_outlier', 'transcription', 'repurpose', 'video_compile', 'seo_metadata']),
        input: z.record(z.string(), z.unknown()),
        priority: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const queueManager = await getQueueManager();
        const userId = typeof ctx.user?.id === 'string' ? ctx.user.id : String(ctx.user?.id || 'unknown');
        const jobId = await queueManager.addJob({
          type: input.type as JobType,
          userId,
          input: input.input,
          priority: input.priority,
        });

        return {
          success: true,
          jobId,
          status: 'queued' as const,
          message: `Job ${input.type} adicionado à fila`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao submeter job',
        });
      }
    }),

  /**
   * Obter status do job
   */
  getJobStatus: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        type: z.enum(['youtube_outlier', 'transcription', 'repurpose', 'video_compile', 'seo_metadata']),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const queueManager = await getQueueManager();
        const status = await queueManager.getJobStatus(input.jobId, input.type as JobType);

        return {
          jobId: input.jobId,
          status,
          timestamp: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao obter status do job',
        });
      }
    }),

  /**
   * Obter resultado do job
   */
  getJobResult: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        type: z.enum(['youtube_outlier', 'transcription', 'repurpose', 'video_compile', 'seo_metadata']),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const queueManager = await getQueueManager();
        const result = await queueManager.getJobResult(input.jobId, input.type as JobType);

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job não encontrado ou ainda não processado',
          });
        }

        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao obter resultado do job',
        });
      }
    }),

  /**
   * Listar jobs do usuário (simulado)
   */
  listUserJobs: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        status: z.enum(['all', 'queued', 'active', 'completed', 'failed']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Simulação: retornar jobs fictícios
      const jobs = [
        {
          id: 'job_1',
          type: 'youtube_outlier',
          status: 'completed',
          createdAt: new Date(Date.now() - 3600000),
          completedAt: new Date(Date.now() - 3000000),
          duration: 600000,
        },
        {
          id: 'job_2',
          type: 'transcription',
          status: 'active',
          createdAt: new Date(Date.now() - 1800000),
          completedAt: null,
          duration: null,
        },
        {
          id: 'job_3',
          type: 'repurpose',
          status: 'queued',
          createdAt: new Date(Date.now() - 600000),
          completedAt: null,
          duration: null,
        },
      ];

      const filtered =
        input.status && input.status !== 'all'
          ? jobs.filter((j) => j.status === input.status)
          : jobs;

      const start = (input.page - 1) * input.limit;
      const paginated = filtered.slice(start, start + input.limit);

      return {
        jobs: paginated,
        total: filtered.length,
        page: input.page,
        limit: input.limit,
        hasMore: start + input.limit < filtered.length,
      };
    }),

  /**
   * Cancelar job
   */
  cancelJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        type: z.enum(['youtube_outlier', 'transcription', 'repurpose', 'video_compile', 'seo_metadata']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Simulação: apenas retornar sucesso
        return {
          success: true,
          jobId: input.jobId,
          message: 'Job cancelado com sucesso',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao cancelar job',
        });
      }
    }),

  /**
   * Obter estatísticas de jobs
   */
  getJobStats: publicProcedure.query(async () => {
    return {
      totalQueued: 5,
      totalActive: 2,
      totalCompleted: 145,
      totalFailed: 3,
      averageProcessingTime: 2500,
      successRate: 97.9,
      lastUpdated: new Date(),
    };
  }),
});
