import { Express, Request, Response, NextFunction } from 'express';
import { createRateLimitMiddleware, csrfMiddleware, securityHeadersMiddleware, startSecurityCleanup } from './security-middleware';
import { StructuredLogger } from './monitoring-logger';

/**
 * Integração de Segurança no Servidor Express
 */

export interface SecurityConfig {
  enableCSRF: boolean;
  enableRateLimit: boolean;
  enableSecurityHeaders: boolean;
  rateLimitWindow: number; // ms
  rateLimitMaxRequests: number;
}

const DEFAULT_CONFIG: SecurityConfig = {
  enableCSRF: true,
  enableRateLimit: true,
  enableSecurityHeaders: true,
  rateLimitWindow: 15 * 60 * 1000, // 15 minutos
  rateLimitMaxRequests: 100, // 100 requisições por 15 minutos
};

/**
 * Middleware para adicionar sessionId ao request
 */
function sessionIdMiddleware(req: Request, res: Response, next: NextFunction) {
  (req as any).sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || `session-${Date.now()}`;
  next();
}

/**
 * Middleware para logging de requisições
 */
function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const logger = new StructuredLogger((req as any).sessionId, (req as any).userId);
  (req as any).logger = logger;

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;

    logger.performance(`${req.method} ${req.path}`, duration, success);
  });

  next();
}

/**
 * Aplicar segurança ao servidor Express
 */
export function applySecurity(app: Express, config: Partial<SecurityConfig> = {}): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 1. Headers de segurança
  if (finalConfig.enableSecurityHeaders) {
    app.use(securityHeadersMiddleware);
  }

  // 2. SessionId
  app.use(sessionIdMiddleware);

  // 3. Logging de requisições
  app.use(requestLoggingMiddleware);

  // 4. Rate limiting global
  if (finalConfig.enableRateLimit) {
    app.use(
      createRateLimitMiddleware({
        windowMs: finalConfig.rateLimitWindow,
        maxRequests: finalConfig.rateLimitMaxRequests,
        keyGenerator: (req: Request) => {
          // Rate limit por IP + userId (se autenticado)
          const userId = (req as any).userId || 'anonymous';
          return `${req.ip}:${userId}`;
        },
      })
    );
  }

  // 5. CSRF protection para POST/PUT/DELETE
  if (finalConfig.enableCSRF) {
    app.use(csrfMiddleware);
  }

  // 6. Iniciar limpeza de segurança
  startSecurityCleanup();
}

/**
 * Middleware para validar autenticação
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    // Validação simplificada - em produção usar JWT
    (req as any).userId = token.split('-')[1] || 'unknown';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware para validar role
 */
export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

/**
 * Middleware para tratamento de erros de segurança
 */
export function securityErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const logger = (req as any).logger || new StructuredLogger((req as any).sessionId);

  if (err.message.includes('CSRF')) {
    logger.warn('CSRF validation failed', { path: req.path });
    return res.status(403).json({ error: 'CSRF validation failed' });
  }

  if (err.message.includes('Rate limit')) {
    logger.warn('Rate limit exceeded', { ip: req.ip });
    return res.status(429).json({ error: 'Too many requests' });
  }

  logger.error('Security error', err);
  res.status(500).json({ error: 'Internal server error' });
}

/**
 * Exemplo de integração no servidor
 */
export function setupSecurityExample(app: Express): void {
  // Aplicar segurança global
  applySecurity(app, {
    enableCSRF: true,
    enableRateLimit: true,
    enableSecurityHeaders: true,
    rateLimitWindow: 15 * 60 * 1000,
    rateLimitMaxRequests: 100,
  });

  // Rotas públicas (sem autenticação)
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Rotas protegidas (com autenticação)
  app.use('/api', authMiddleware);

  // Rotas de admin (com role)
  app.use('/api/admin', roleMiddleware(['admin']));

  // Tratamento de erros
  app.use(securityErrorHandler);
}
