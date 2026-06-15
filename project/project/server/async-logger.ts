/**
 * ASYNC LOGGER - Logger assíncrono com Winston
 * Resolve problema P1: Possível gargalo de logs (fs.appendFileSync)
 * 
 * Usa Winston para logging não-bloqueante com múltiplos transports
 */

import winston from 'winston';
import path from 'path';
import { getLogsDir } from './path-manager';

let logger: winston.Logger | null = null;

/**
 * Inicializar logger assíncrono
 */
export function initLogger(): winston.Logger {
  if (logger) {
    return logger;
  }

  const logsDir = getLogsDir();

  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'social-media-ai' },
    transports: [
      // Console transport (síncrono, mas apenas para desenvolvimento)
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${level}] ${message} ${metaStr}`;
          })
        ),
      }),

      // File transport para erros (assíncrono)
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),

      // File transport para todos os logs (assíncrono)
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),

      // Browser console logs
      new winston.transports.File({
        filename: path.join(logsDir, 'browserConsole.log'),
        level: 'debug',
        maxsize: 1048576, // 1MB
        maxFiles: 3,
      }),

      // Network requests
      new winston.transports.File({
        filename: path.join(logsDir, 'networkRequests.log'),
        level: 'debug',
        maxsize: 1048576, // 1MB
        maxFiles: 3,
      }),

      // Session replay
      new winston.transports.File({
        filename: path.join(logsDir, 'sessionReplay.log'),
        level: 'debug',
        maxsize: 1048576, // 1MB
        maxFiles: 3,
      }),
    ],
  });

  console.log('[Logger] Inicializado com sucesso');
  return logger;
}

/**
 * Obter logger
 */
export function getLogger(): winston.Logger {
  if (!logger) {
    return initLogger();
  }
  return logger;
}

/**
 * Log de informação
 */
export function logInfo(message: string, meta?: Record<string, any>): void {
  getLogger().info(message, meta);
}

/**
 * Log de aviso
 */
export function logWarn(message: string, meta?: Record<string, any>): void {
  getLogger().warn(message, meta);
}

/**
 * Log de erro
 */
export function logError(message: string, error?: Error | Record<string, any>): void {
  if (error instanceof Error) {
    getLogger().error(message, { error: error.message, stack: error.stack });
  } else {
    getLogger().error(message, error);
  }
}

/**
 * Log de debug
 */
export function logDebug(message: string, meta?: Record<string, any>): void {
  getLogger().debug(message, meta);
}

/**
 * Log de requisição HTTP
 */
export function logHttpRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  meta?: Record<string, any>
): void {
  getLogger().info('HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    ...meta,
  });
}

/**
 * Log de evento de auditoria
 */
export function logAuditEvent(
  eventType: string,
  userId: number,
  action: string,
  details?: Record<string, any>
): void {
  getLogger().info('Audit Event', {
    eventType,
    userId,
    action,
    ...details,
  });
}

/**
 * Log de erro de segurança
 */
export function logSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  meta?: Record<string, any>
): void {
  const level = severity === 'critical' ? 'error' : 'warn';
  getLogger().log(level, `Security Event: ${eventType}`, {
    severity,
    message,
    ...meta,
  });
}

/**
 * Log de performance
 */
export function logPerformance(
  operation: string,
  duration: number,
  meta?: Record<string, any>
): void {
  const level = duration > 1000 ? 'warn' : 'info';
  getLogger().log(level, `Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...meta,
  });
}

/**
 * Fechar logger
 */
export async function closeLogger(): Promise<void> {
  if (logger) {
    return new Promise((resolve) => {
      logger!.on('finish', resolve);
      logger!.end();
    });
  }
}

/**
 * Express middleware para logging de requisições
 */
export function expressLoggerMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logHttpRequest(req.method, req.originalUrl, res.statusCode, duration, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}
