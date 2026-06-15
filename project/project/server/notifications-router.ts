/**
 * NOTIFICATIONS ROUTER - Notificações Push em Tempo Real
 */

import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { getWebSocketManager } from './websocket-server';
import { notificationRateLimiter, checkRateLimit } from './rate-limiter';
import { TRPCError } from '@trpc/server';
import { auditNotificationCreated, auditNotificationDeleted, auditRateLimitExceeded } from './audit-logger';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'error' | 'warning' | 'info';
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// Armazenar notificações em memória
const notificationsStore: Map<number, Notification[]> = new Map();

export const notificationsRouter = router({
  /**
   * Enviar notificação para usuário
   */
  sendNotification: protectedProcedure
    .input(
      z.object({
        title: z.string().max(100),
        body: z.string().max(500),
        type: z.enum(['success', 'error', 'warning', 'info'] as const),
        data: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        
        // Aplicar rate limiting
        try {
          await checkRateLimit(notificationRateLimiter, `user-${userId}`);
        } catch (error: any) {
          auditRateLimitExceeded(userId, 'notifications.sendNotification');
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Retry after ${error.retryAfter} seconds`,
          });
        }
        const notification: Notification = {
          id: `${userId}-${Date.now()}`,
          title: input.title,
          body: input.body,
          type: input.type,
          data: input.data,
          read: false,
          createdAt: new Date(),
        };

        if (!notificationsStore.has(userId)) {
          notificationsStore.set(userId, []);
        }

        const userNots = notificationsStore.get(userId);
        if (userNots) {
          userNots.push(notification);
        }

        // Broadcast via WebSocket
        try {
          const wsManager = await getWebSocketManager();
          wsManager.emit('notification', {
            userId,
            notification,
          });
        } catch (wsError) {
          console.warn('Erro ao broadcast via WebSocket:', wsError);
        }

        // Registrar auditoria
        auditNotificationCreated(userId, notification.id, {
          title: input.title,
          type: input.type,
        });

        return {
          success: true,
          message: 'Notificação enviada com sucesso',
        };
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        };
      }
    }),

  /**
   * Listar notificações do usuário
   */
  listNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
        unreadOnly: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        const userNotifications = notificationsStore.get(userId) || [];

        let filtered = userNotifications;
        if (input.unreadOnly) {
          filtered = filtered.filter((n) => !n.read);
        }

        return filtered
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(input.offset, input.offset + input.limit);
      } catch (error) {
        console.error('Erro ao listar notificações:', error);
        return [];
      }
    }),

  /**
   * Marcar notificação como lida
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        
        // Aplicar rate limiting
        try {
          await checkRateLimit(notificationRateLimiter, `user-${userId}-write`);
        } catch (error: any) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Retry after ${error.retryAfter} seconds`,
          });
        }
        const userNotifications = notificationsStore.get(userId) || [];
        const notification = userNotifications.find((n) => n.id === input.notificationId);

        if (notification) {
          notification.read = true;
        }

        return { success: !!notification };
      } catch (error) {
        console.error('Erro ao marcar como lida:', error);
        return { success: false };
      }
    }),

  /**
   * Contar notificações não lidas
   */
  countUnread: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const userNotifications = notificationsStore.get(userId) || [];
      return userNotifications.filter((n) => !n.read).length;
    } catch (error) {
      console.error('Erro ao contar não lidas:', error);
      return 0;
    }
  }),

  /**
   * Deletar notificação
   */
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        
        // Aplicar rate limiting
        try {
          await checkRateLimit(notificationRateLimiter, `user-${userId}-write`);
        } catch (error: any) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Retry after ${error.retryAfter} seconds`,
          });
        }
        const userNotifications = notificationsStore.get(userId) || [];
        const index = userNotifications.findIndex((n) => n.id === input.notificationId);

        if (index !== -1) {
          userNotifications.splice(index, 1);
          auditNotificationDeleted(userId, input.notificationId);
        }

        return { success: index !== -1 };
      } catch (error) {
        console.error('Erro ao deletar notificação:', error);
        return { success: false };
      }
    }),

  /**
   * Limpar todas as notificações
   */
  clearAll: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      
      // Aplicar rate limiting
      try {
        await checkRateLimit(notificationRateLimiter, `user-${userId}-write`);
      } catch (error: any) {
        auditRateLimitExceeded(userId, 'notifications.clearAll');
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Retry after ${error.retryAfter} seconds`,
        });
      }
      notificationsStore.delete(userId);
      return { success: true };
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      return { success: false };
    }
  }),
});
