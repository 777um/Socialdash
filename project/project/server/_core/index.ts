import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { WebSocketServerManager } from "../websocket-server";
import { initSentry, sentryMiddleware } from "./sentry";
import { initRedisClient, closeRedisClient } from "../redis-client";
import { sessionMiddleware, rateLimitMiddleware } from "../security-middleware-redis";
import { initLogger, expressLoggerMiddleware, closeLogger } from "../async-logger";
import { printDirectoryStructure } from "../path-manager";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize Sentry for error tracking
  initSentry();
  
  // Initialize Logger
  initLogger();
  
  // Initialize Redis
  try {
    initRedisClient();
    console.log('[Redis] Inicializado com sucesso');
  } catch (error) {
    console.error('[Redis] Erro ao inicializar:', error);
  }
  
  // Print directory structure
  if (process.env.NODE_ENV === 'development') {
    printDirectoryStructure();
  }
  
  const app = express();
  const server = createServer(app);
  
  // Initialize WebSocket server
  const wsManager = new WebSocketServerManager();
  await wsManager.initialize(server);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Sentry middleware for request tracking
  app.use(...sentryMiddleware());
  
  // Logger middleware for request tracking
  app.use(expressLoggerMiddleware);
  
  // Session middleware (Redis-backed)
  app.use(sessionMiddleware);
  
  // Rate limiting middleware (Redis-backed)
  app.use(rateLimitMiddleware);
  
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // Make WebSocket manager available in context
  (app as any).wsManager = wsManager;
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
  
  // Graceful shutdown
  const gracefulShutdown = async () => {
    console.log("Shutting down gracefully");
    server.close(async () => {
      console.log("Server closed");
      try {
        await closeRedisClient();
        console.log('[Redis] Conexão fechada');
      } catch (error) {
        console.error('[Redis] Erro ao fechar conexão:', error);
      }
      try {
        await closeLogger();
        console.log('[Logger] Fechado com sucesso');
      } catch (error) {
        console.error('[Logger] Erro ao fechar:', error);
      }
      process.exit(0);
    });
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGHUP", gracefulShutdown);
}

startServer().catch(console.error);
