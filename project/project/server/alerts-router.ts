import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { alertSystem } from './_core/alerts';
import { TRPCError } from '@trpc/server';

/**
 * ALERTAS ROUTER
 * Fornece acesso ao sistema de alertas técnicos
 */

export const alertsRouter = router({
  /**
   * Obter alertas recentes
   */
  listar: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(['erro', 'aviso', 'info', 'crítico']).optional(),
        horas: z.number().min(1).max(168).default(24),
        resolvido: z.boolean().optional(),
      })
    )
    .query(({ input }) => {
      try {
        const alertas = alertSystem.obterAlertas({
          tipo: input.tipo,
          horas: input.horas,
          resolvido: input.resolvido,
        });

        return {
          success: true,
          alertas,
          total: alertas.length,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao buscar alertas',
        });
      }
    }),

  /**
   * Obter estatísticas de alertas
   */
  stats: protectedProcedure.query(() => {
    try {
      const stats = alertSystem.obterEstatisticas();

      return {
        success: true,
        stats,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Falha ao buscar estatísticas',
      });
    }
  }),

  /**
   * Resolver alerta
   */
  resolver: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      try {
        alertSystem.resolverAlerta(input.id);

        return {
          success: true,
          message: 'Alerta resolvido',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao resolver alerta',
        });
      }
    }),

  /**
   * Limpar alertas antigos
   */
  limpar: protectedProcedure
    .input(z.object({ horas: z.number().min(1).default(24) }))
    .mutation(({ input }) => {
      try {
        alertSystem.limparAlertas(input.horas);

        return {
          success: true,
          message: 'Alertas antigos removidos',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao limpar alertas',
        });
      }
    }),

  /**
   * Obter alertas críticos
   */
  criticos: protectedProcedure.query(() => {
    try {
      const alertas = alertSystem.obterAlertas({
        tipo: 'crítico',
        resolvido: false,
      });

      return {
        success: true,
        alertas,
        total: alertas.length,
        temCriticos: alertas.length > 0,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Falha ao buscar alertas críticos',
      });
    }
  }),

  /**
   * Webhook para alertas externos
   */
  webhook: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(['erro', 'aviso', 'info', 'crítico']),
        titulo: z.string(),
        mensagem: z.string(),
        dados: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ input }) => {
      try {
        const id = alertSystem.registrarAlerta({
          tipo: input.tipo,
          titulo: input.titulo,
          mensagem: input.mensagem,
          dados: input.dados,
        });

        return {
          success: true,
          alertaId: id,
          message: 'Alerta registrado',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao registrar alerta',
        });
      }
    }),
});
