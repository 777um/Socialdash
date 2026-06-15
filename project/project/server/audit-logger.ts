/**
 * AUDIT LOGGER - Sistema de Auditoria Estruturada
 * Registra eventos críticos com contexto completo para compliance e debugging
 */

// Importar Sentry se disponível
let captureException: any = null;
try {
  const sentry = require('./sentry');
  captureException = sentry.captureException;
} catch (e) {
  // Sentry não disponível
}

export type AuditEventType =
  | 'notification.created'
  | 'notification.deleted'
  | 'notification.marked_as_read'
  | 'webhook.created'
  | 'webhook.deleted'
  | 'webhook.triggered'
  | 'alert.created'
  | 'alert.deleted'
  | 'alert.triggered'
  | 'user.login'
  | 'user.logout'
  | 'user.preferences_updated'
  | 'system.error'
  | 'system.rate_limit_exceeded';

export interface AuditEvent {
  eventType: AuditEventType;
  userId: number;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  resourceId?: string;
  resourceType?: string;
  action: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure';
  errorMessage?: string;
}

// Armazenar auditoria em memória (em produção usar banco de dados)
const auditLog: AuditEvent[] = [];

/**
 * Registrar evento de auditoria
 */
export function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>) {
  const auditEvent: AuditEvent = {
    ...event,
    timestamp: new Date(),
  };

  // Adicionar ao log em memória
  auditLog.push(auditEvent);

  // Manter apenas últimos 10.000 eventos
  if (auditLog.length > 10000) {
    auditLog.shift();
  }

  // Log no console para desenvolvimento
  console.log(`[AUDIT] ${event.eventType} - ${event.action}`, {
    userId: event.userId,
    severity: event.severity,
    status: event.status,
    details: event.details,
  });

  // Se for erro crítico, enviar para Sentry
  if (event.severity === 'critical' && event.status === 'failure' && captureException) {
    captureException(new Error(`Critical audit event: ${event.eventType}`), {
      tags: {
        audit_event: event.eventType,
        user_id: event.userId.toString(),
      },
      extra: auditEvent,
    });
  }

  return auditEvent;
}

/**
 * Obter histórico de auditoria
 */
export function getAuditHistory(options?: {
  userId?: number;
  eventType?: AuditEventType;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  limit?: number;
  offset?: number;
}): AuditEvent[] {
  let filtered = [...auditLog];

  if (options?.userId) {
    filtered = filtered.filter((e) => e.userId === options.userId);
  }

  if (options?.eventType) {
    filtered = filtered.filter((e) => e.eventType === options.eventType);
  }

  if (options?.severity) {
    filtered = filtered.filter((e) => e.severity === options.severity);
  }

  // Ordenar por timestamp descendente
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  return filtered.slice(offset, offset + limit);
}

/**
 * Limpar auditoria (apenas para testes)
 */
export function clearAuditLog() {
  auditLog.length = 0;
}

/**
 * Helpers para eventos específicos
 */

export function auditNotificationCreated(userId: number, notificationId: string, details: any) {
  return logAuditEvent({
    eventType: 'notification.created',
    userId,
    resourceId: notificationId,
    resourceType: 'notification',
    action: `Created notification: ${notificationId}`,
    details,
    severity: 'low',
    status: 'success',
  });
}

export function auditNotificationDeleted(userId: number, notificationId: string) {
  return logAuditEvent({
    eventType: 'notification.deleted',
    userId,
    resourceId: notificationId,
    resourceType: 'notification',
    action: `Deleted notification: ${notificationId}`,
    details: { notificationId },
    severity: 'medium',
    status: 'success',
  });
}

export function auditWebhookCreated(userId: number, webhookId: string, url: string) {
  return logAuditEvent({
    eventType: 'webhook.created',
    userId,
    resourceId: webhookId,
    resourceType: 'webhook',
    action: `Created webhook: ${webhookId}`,
    details: { webhookId, url },
    severity: 'medium',
    status: 'success',
  });
}

export function auditWebhookTriggered(userId: number, webhookId: string, statusCode: number) {
  return logAuditEvent({
    eventType: 'webhook.triggered',
    userId,
    resourceId: webhookId,
    resourceType: 'webhook',
    action: `Triggered webhook: ${webhookId}`,
    details: { webhookId, statusCode },
    severity: 'low',
    status: statusCode >= 200 && statusCode < 300 ? 'success' : 'failure',
  });
}

export function auditAlertCreated(userId: number, alertId: string, condition: string) {
  return logAuditEvent({
    eventType: 'alert.created',
    userId,
    resourceId: alertId,
    resourceType: 'alert',
    action: `Created alert: ${alertId}`,
    details: { alertId, condition },
    severity: 'medium',
    status: 'success',
  });
}

export function auditUserLogin(userId: number, ipAddress?: string, userAgent?: string) {
  return logAuditEvent({
    eventType: 'user.login',
    userId,
    ipAddress,
    userAgent,
    action: `User login: ${userId}`,
    details: { userId },
    severity: 'low',
    status: 'success',
  });
}

export function auditUserLogout(userId: number) {
  return logAuditEvent({
    eventType: 'user.logout',
    userId,
    action: `User logout: ${userId}`,
    details: { userId },
    severity: 'low',
    status: 'success',
  });
}

export function auditRateLimitExceeded(userId: number, endpoint: string) {
  return logAuditEvent({
    eventType: 'system.rate_limit_exceeded',
    userId,
    action: `Rate limit exceeded: ${endpoint}`,
    details: { endpoint },
    severity: 'high',
    status: 'failure',
    errorMessage: 'Rate limit exceeded',
  });
}

export function auditSystemError(userId: number, errorMessage: string, details: any) {
  return logAuditEvent({
    eventType: 'system.error',
    userId,
    action: `System error: ${errorMessage}`,
    details,
    severity: 'critical',
    status: 'failure',
    errorMessage,
  });
}
