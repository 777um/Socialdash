/**
 * INTEGRAÇÃO SENTRY
 * Rastreamento de erros em tempo real com alertas automáticos
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  enabled: boolean;
}

/**
 * Inicializar Sentry
 */
export function initSentry(config: Partial<SentryConfig> = {}) {
  const sentryConfig: SentryConfig = {
    dsn: config.dsn || process.env.SENTRY_DSN || '',
    environment: config.environment || process.env.NODE_ENV || 'development',
    tracesSampleRate: config.tracesSampleRate ?? 1.0,
    profilesSampleRate: config.profilesSampleRate ?? 1.0,
    enabled: config.enabled ?? !!process.env.SENTRY_DSN,
  };

  if (!sentryConfig.enabled) {
    console.log('[SENTRY] Desabilitado - configure SENTRY_DSN para ativar');
    return;
  }

  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    tracesSampleRate: sentryConfig.tracesSampleRate,
    profilesSampleRate: sentryConfig.profilesSampleRate,
    integrations: [
      nodeProfilingIntegration(),
    ],
  });

  console.log('[SENTRY] Inicializado com sucesso');
}

/**
 * Middleware Sentry para Express
 */
export function sentryMiddleware() {
  return [
    (req: any, res: any, next: any) => {
      Sentry.captureMessage(`${req.method} ${req.url}`, 'info');
      next();
    },
  ];
}

/**
 * Error handler Sentry
 */
export function sentryErrorHandler() {
  return (err: any, req: any, res: any, next: any) => {
    captureException(err, { url: req.url, method: req.method });
    next(err);
  };
}

/**
 * Capturar exceção
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capturar mensagem
 */
export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Adicionar breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: 'fatal' | 'error' | 'warning' | 'info' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Rastrear operação
 */
export async function traceOperation<T>(
  operationName: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  try {
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        setTag(key, value);
      });
    }

    addBreadcrumb(`Starting operation: ${operationName}`, 'operation', 'info');
    const result = await fn();
    addBreadcrumb(`Completed operation: ${operationName}`, 'operation', 'info');
    return result;
  } catch (error) {
    captureException(error as Error, { operation: operationName });
    throw error;
  }
}

/**
 * Configurar usuário para Sentry
 */
export function setUser(userId: number, email?: string, username?: string) {
  Sentry.setUser({
    id: userId.toString(),
    email,
    username,
  });
}

/**
 * Limpar contexto de usuário
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Adicionar contexto customizado
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}

/**
 * Adicionar tag
 */
export function setTag(key: string, value: string | number | boolean) {
  Sentry.setTag(key, value);
}

/**
 * Adicionar extra
 */
export function setExtra(key: string, value: any) {
  Sentry.setExtra(key, value);
}

/**
 * Flush Sentry (aguardar envio de eventos)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  try {
    await Sentry.close(timeout);
    return true;
  } catch (error) {
    console.error('[SENTRY] Erro ao fazer flush:', error);
    return false;
  }
}
