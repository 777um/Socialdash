/**
 * CUSTOMIZABLE ALERTS ROUTER - Sistema de Alertas Inteligentes
 */

import { protectedProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// In-memory storage for alerts (in production, use database)
const userAlerts: Map<string, any[]> = new Map() as Map<string, any[]>;

// Helper to ensure userId is string
function getUserId(userId: string | number): string {
  return String(userId);
}

export const alertsCustomizableRouter = router({
  /**
   * Create a custom alert rule
   */
  createAlert: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      type: z.enum(['performance', 'failure', 'threshold', 'trend'] as const),
      condition: z.string(),
      threshold: z.number().optional(),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = getUserId(ctx.user.id);
        const alert = {
          id: `alert_${Date.now()}`,
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (!userAlerts.has(userId)) {
          userAlerts.set(userId, []);
        }
        userAlerts.get(userId)!.push(alert);

        return alert;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to create alert',
        });
      }
    }),

  /**
   * Get all alerts for user
   */
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = getUserId(ctx.user.id);
      return userAlerts.get(userId) || [];
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to get alerts',
      });
    }
  }),

  /**
   * Update alert rule
   */
  updateAlert: protectedProcedure
    .input(z.object({
      alertId: z.string(),
      name: z.string().optional(),
      enabled: z.boolean().optional(),
      threshold: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = getUserId(ctx.user.id);
        const alerts = userAlerts.get(userId) || [];
        const alertIndex = alerts.findIndex((a) => a.id === input.alertId);

        if (alertIndex === -1) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Alert not found',
          });
        }

        const updated = {
          ...alerts[alertIndex],
          ...input,
          updatedAt: new Date(),
        };

        alerts[alertIndex] = updated;
        userAlerts.set(userId, alerts);

        return updated;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to update alert',
        });
      }
    }),

  /**
   * Delete alert rule
   */
  deleteAlert: protectedProcedure
    .input(z.object({
      alertId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = getUserId(ctx.user.id);
        const alerts = userAlerts.get(userId) || [];
        const filtered = alerts.filter((a) => a.id !== input.alertId);

        if (filtered.length === alerts.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Alert not found',
          });
        }

        userAlerts.set(userId, filtered);

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to delete alert',
        });
      }
    }),

  /**
   * Check if alert conditions are met
   */
  checkAlertConditions: protectedProcedure
    .input(z.object({
      successRate: z.number(),
      failureCount: z.number(),
      averageExecutionTime: z.number(),
      totalExecutions: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const userId = getUserId(ctx.user.id);
        const alerts = userAlerts.get(userId) || [];
        const triggeredAlerts: any[] = [];

        alerts.forEach((alert) => {
          if (!alert.enabled) return;

          let shouldTrigger = false;

          switch (alert.type) {
            case 'performance':
              // Trigger if success rate drops below threshold
              if (alert.threshold && input.successRate < alert.threshold) {
                shouldTrigger = true;
              }
              break;

            case 'failure':
              // Trigger if failure count exceeds threshold
              if (alert.threshold && input.failureCount > alert.threshold) {
                shouldTrigger = true;
              }
              break;

            case 'threshold':
              // Trigger if execution time exceeds threshold
              if (alert.threshold && input.averageExecutionTime > alert.threshold) {
                shouldTrigger = true;
              }
              break;

            case 'trend':
              // Trigger if trend changes significantly
              if (input.totalExecutions > 0) {
                const failureRate = (input.failureCount / input.totalExecutions) * 100;
                if (alert.threshold && failureRate > alert.threshold) {
                  shouldTrigger = true;
                }
              }
              break;
          }

          if (shouldTrigger) {
            triggeredAlerts.push({
              ...alert,
              triggeredAt: new Date(),
              metrics: input,
            });
          }
        });

        return triggeredAlerts;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to check alert conditions',
        });
      }
    }),

  /**
   * Get alert templates
   */
  getAlertTemplates: protectedProcedure.query(async () => {
    return [
      {
        id: 'template_low_performance',
        name: 'Taxa de Sucesso Baixa',
        type: 'performance' as const,
        description: 'Alerta quando taxa de sucesso cai abaixo de 80%',
        condition: 'successRate < 80',
        threshold: 80,
      },
      {
        id: 'template_high_failures',
        name: 'Muitas Falhas',
        type: 'failure',
        description: 'Alerta quando há mais de 5 falhas consecutivas',
        condition: 'failureCount > 5',
        threshold: 5,
      },
      {
        id: 'template_slow_execution',
        name: 'Execução Lenta',
        type: 'threshold',
        description: 'Alerta quando tempo médio de execução > 60 segundos',
        condition: 'averageExecutionTime > 60000',
        threshold: 60000,
      },
      {
        id: 'template_trend_change',
        name: 'Mudança de Tendência',
        type: 'trend',
        description: 'Alerta quando taxa de falha sobe acima de 20%',
        condition: 'failureRate > 20',
        threshold: 20,
      },
    ];
  }),

  /**
   * Create alert from template
   */
  createFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const templates = [
          {
            id: 'template_low_performance',
            name: 'Taxa de Sucesso Baixa',
            type: 'performance' as const,
            threshold: 80,
          },
          {
            id: 'template_high_failures',
            name: 'Muitas Falhas',
            type: 'failure' as const,
            threshold: 5,
          },
          {
            id: 'template_slow_execution',
            name: 'Execução Lenta',
            type: 'threshold' as const,
            threshold: 60000,
          },
          {
            id: 'template_trend_change',
            name: 'Mudança de Tendência',
            type: 'trend' as const,
            threshold: 20,
          },
        ];

        const template = templates.find((t) => t.id === input.templateId);

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          });
        }

        const userId = getUserId(ctx.user.id);
        const alert = {
          id: `alert_${Date.now()}`,
          name: template.name,
          type: template.type,
          condition: '',
          threshold: template.threshold,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (!userAlerts.has(userId)) {
          userAlerts.set(userId, []);
        }
        userAlerts.get(userId)!.push(alert);

        return alert;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to create alert from template',
        });
      }
    }),
});
