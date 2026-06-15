import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ============================================================================
// COMPRESSION — gzip nativo (sem pacote extra)
// ============================================================================

function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip')) { next(); return; }

  const originalEnd  = res.end.bind(res);
  const originalWrite = res.write.bind(res);

  const gz = zlib.createGzip();
  const chunks: Buffer[] = [];

  res.setHeader('Content-Encoding', 'gzip');
  res.removeHeader('Content-Length'); // inválido após compressão

  (res as any).write = (chunk: any, ...args: any[]) => {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return true;
  };

  (res as any).end = (chunk?: any, ...args: any[]) => {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    const body = Buffer.concat(chunks);
    gz.end(body);
    gz.on('data', (d: Buffer) => originalWrite(d));
    gz.on('end', () => originalEnd());
    gz.on('error', () => originalEnd());
  };

  next();
}

// ============================================================================
// SECURITY HEADERS (inline, sem pacote helmet)
// ============================================================================

function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';");
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
}

// ============================================================================
// CACHE CONTROL
// ============================================================================

function cacheControl(req: Request, res: Response, next: NextFunction) {
  const ext = path.extname(req.path);
  // Assets com hash → cache longo; HTML sempre revalidar
  if (['.js', '.css', '.woff2', '.woff', '.ttf', '.ico', '.png', '.jpg', '.svg'].includes(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (ext === '.html' || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
}

// ============================================================================
// SERVER
// ============================================================================

async function startServer() {
  const app    = express();
  const server = createServer(app);

  // 1. Security headers (antes de tudo)
  app.use(securityHeaders);

  // 2. Compression (respostas HTTP)
  app.use(compressionMiddleware);

  // 3. Cache control
  app.use(cacheControl);

  // 4. Healthcheck (antes do static — resposta sem I/O)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
  });

  // 5. Arquivos estáticos
  const staticPath =
    process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, 'public')
      : path.resolve(__dirname, '..', 'dist', 'public');

  app.use(express.static(staticPath, {
    etag: true,
    lastModified: true,
    maxAge: 0, // Cache-Control já setado acima por tipo
  }));

  // 6. SPA fallback
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`[Server] Rodando em http://localhost:${port}/`);
    console.log(`[Server] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(console.error);
