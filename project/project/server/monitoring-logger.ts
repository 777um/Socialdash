/**
 * Sistema de Logging e Monitoramento Estruturado
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  requestId?: string;
  duration?: number;
}

export interface MonitoringMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  uptime: number;
}

// ============================================================================
// 1. STRUCTURED LOGGING
// ============================================================================

const logs: LogEntry[] = [];
const MAX_LOGS = 10000;

/**
 * Logger estruturado
 */
export class StructuredLogger {
  private requestId: string;
  private userId?: string;
  private startTime: number;

  constructor(requestId: string, userId?: string) {
    this.requestId = requestId;
    this.userId = userId;
    this.startTime = Date.now();
  }

  /**
   * Log genérico
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId: this.requestId,
      userId: this.userId,
      duration: Date.now() - this.startTime,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Adicionar ao array
    logs.push(entry);

    // Limitar tamanho
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }

    // Também logar no console em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify(entry, null, 2));
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Log de auditoria
   */
  audit(action: string, resource: string, details?: Record<string, any>) {
    this.info(`AUDIT: ${action} on ${resource}`, {
      action,
      resource,
      ...details,
    });
  }

  /**
   * Log de performance
   */
  performance(operation: string, duration: number, success: boolean) {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.log(level, `Performance: ${operation}`, {
      operation,
      duration,
      success,
    });
  }
}

// ============================================================================
// 2. METRICS COLLECTION
// ============================================================================

interface RequestMetric {
  timestamp: number;
  duration: number;
  success: boolean;
  endpoint: string;
}

const metrics: RequestMetric[] = [];
const MAX_METRICS = 1000;

/**
 * Registrar métrica de requisição
 */
export function recordRequestMetric(
  endpoint: string,
  duration: number,
  success: boolean
): void {
  metrics.push({
    timestamp: Date.now(),
    duration,
    success,
    endpoint,
  });

  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }
}

/**
 * Obter métricas agregadas
 */
export function getMetrics(): MonitoringMetrics {
  if (metrics.length === 0) {
    return {
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      uptime: process.uptime(),
    };
  }

  const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
  const errorCount = metrics.filter(m => !m.success).length;

  return {
    requestCount: metrics.length,
    errorCount,
    avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
    p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
    p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
    uptime: process.uptime(),
  };
}

// ============================================================================
// 3. LOG RETRIEVAL
// ============================================================================

/**
 * Obter logs por filtro
 */
export function getLogs(filter?: {
  level?: LogLevel;
  userId?: string;
  requestId?: string;
  limit?: number;
}): LogEntry[] {
  let result = [...logs];

  if (filter?.level) {
    result = result.filter(l => l.level === filter.level);
  }

  if (filter?.userId) {
    result = result.filter(l => l.userId === filter.userId);
  }

  if (filter?.requestId) {
    result = result.filter(l => l.requestId === filter.requestId);
  }

  const limit = filter?.limit || 100;
  return result.slice(-limit);
}

/**
 * Obter logs de erro
 */
export function getErrorLogs(limit: number = 100): LogEntry[] {
  return getLogs({
    level: LogLevel.ERROR,
    limit,
  });
}

/**
 * Obter logs de auditoria
 */
export function getAuditLogs(userId?: string, limit: number = 100): LogEntry[] {
  const auditLogs = logs.filter(l => l.message.startsWith('AUDIT:'));

  if (userId) {
    return auditLogs.filter(l => l.userId === userId).slice(-limit);
  }

  return auditLogs.slice(-limit);
}

// ============================================================================
// 4. PERFORMANCE MONITORING
// ============================================================================

/**
 * Gerar relatório de performance
 */
export function generatePerformanceReport(): {
  metrics: MonitoringMetrics;
  topEndpoints: Array<{ endpoint: string; count: number; avgDuration: number }>;
  errorRate: number;
} {
  const metricsData = getMetrics();

  // Endpoints mais chamados
  const endpointStats = new Map<string, { count: number; totalDuration: number }>();

  metrics.forEach(m => {
    const stat = endpointStats.get(m.endpoint) || { count: 0, totalDuration: 0 };
    stat.count++;
    stat.totalDuration += m.duration;
    endpointStats.set(m.endpoint, stat);
  });

  const topEndpoints = Array.from(endpointStats.entries())
    .map(([endpoint, stat]) => ({
      endpoint,
      count: stat.count,
      avgDuration: stat.totalDuration / stat.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const errorRate =
    metricsData.requestCount > 0
      ? (metricsData.errorCount / metricsData.requestCount) * 100
      : 0;

  return {
    metrics: metricsData,
    topEndpoints,
    errorRate,
  };
}

// ============================================================================
// 5. HEALTH CHECK
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  errorRate: number;
  avgResponseTime: number;
  issues: string[];
}

/**
 * Verificar saúde do sistema
 */
export function getHealthStatus(): HealthStatus {
  const metricsData = getMetrics();
  const errorRate =
    metricsData.requestCount > 0
      ? (metricsData.errorCount / metricsData.requestCount) * 100
      : 0;

  const issues: string[] = [];

  if (errorRate > 5) {
    issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
  }

  if (metricsData.avgResponseTime > 1000) {
    issues.push(`Slow average response time: ${metricsData.avgResponseTime.toFixed(0)}ms`);
  }

  if (metricsData.p99ResponseTime > 5000) {
    issues.push(`High P99 response time: ${metricsData.p99ResponseTime.toFixed(0)}ms`);
  }

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (issues.length > 0) {
    status = issues.length > 2 ? 'unhealthy' : 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: metricsData.uptime,
    errorRate,
    avgResponseTime: metricsData.avgResponseTime,
    issues,
  };
}

// ============================================================================
// 6. CLEANUP
// ============================================================================

/**
 * Limpar logs antigos
 */
export function cleanOldLogs(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const cutoffTime = Date.now() - maxAgeMs;
  const initialLength = logs.length;

  for (let i = logs.length - 1; i >= 0; i--) {
    const logTime = new Date(logs[i].timestamp).getTime();
    if (logTime < cutoffTime) {
      logs.splice(i, 1);
    }
  }

  if (logs.length < initialLength) {
    console.log(`Cleaned ${initialLength - logs.length} old logs`);
  }
}

/**
 * Iniciar limpeza periódica
 */
export function startLogCleanup(intervalMs: number = 60 * 60 * 1000): void {
  setInterval(() => {
    cleanOldLogs();
  }, intervalMs);
}

/**
 * Exportar logs para arquivo
 */
export function exportLogs(): string {
  return JSON.stringify(logs, null, 2);
}

/**
 * Limpar todos os logs
 */
export function clearLogs(): void {
  logs.length = 0;
}

export function clearMetrics(): void {
  metrics.length = 0;
}
