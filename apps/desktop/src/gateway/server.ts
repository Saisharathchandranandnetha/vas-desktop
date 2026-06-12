// ─── VAS Desktop — Fastify Gateway Server ───
// The local gateway that proxies OpenAI-compatible requests to configured providers.
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { GATEWAY_DEFAULT_PORT, GATEWAY_HOST } from '@vas/shared';
import { registerChatRoutes } from './routes/chat.js';
import { registerModelRoutes } from './routes/models.js';
import { registerHealthRoutes } from './routes/health.js';
import { requestLoggingMiddleware } from './middleware/logging.js';

let server: FastifyInstance | null = null;
let startTime: number = 0;
let requestCount = 0;

/**
 * Returns the current total request count (for health/observability).
 */
export function getRequestCount(): number {
  return requestCount;
}

/**
 * Increments the global request counter.
 */
export function incrementRequestCount(): void {
  requestCount++;
}

/**
 * Returns the gateway start time.
 */
export function getStartTime(): number {
  return startTime;
}

/**
 * Creates, configures, and starts the Fastify gateway server.
 */
export async function startGateway(): Promise<FastifyInstance> {
  if (server) {
    console.log('[VAS:Gateway] Server is already running.');
    return server;
  }

  server = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss',
        },
      },
    },
    trustProxy: false,
    requestTimeout: 120_000, // 2 minutes for long LLM requests
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  // ─── Register Plugins ───

  // CORS — only allow localhost origins
  await server.register(cors, {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:16324',
      'http://127.0.0.1:16324',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });

  // Rate limiting — 200 requests per minute
  await server.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Max ${context.max} requests per ${context.after}.`,
      statusCode: 429,
    }),
  });

  // WebSocket support
  await server.register(websocket);

  // ─── Register Middleware ───
  requestLoggingMiddleware(server);

  // ─── Register Routes ───
  await registerChatRoutes(server);
  await registerModelRoutes(server);
  await registerHealthRoutes(server);

  // ─── Start Listening ───
  const port = GATEWAY_DEFAULT_PORT;
  const host = GATEWAY_HOST;

  try {
    await server.listen({ port, host });
    startTime = Date.now();
    console.log(`[VAS:Gateway] Listening on http://${host}:${port}`);
    return server;
  } catch (err) {
    console.error('[VAS:Gateway] Failed to start:', err);
    server = null;
    throw err;
  }
}

/**
 * Gracefully stops the gateway server.
 */
export async function stopGateway(): Promise<void> {
  if (!server) {
    console.log('[VAS:Gateway] Server is not running.');
    return;
  }

  try {
    await server.close();
    console.log('[VAS:Gateway] Server stopped.');
  } catch (err) {
    console.error('[VAS:Gateway] Error stopping server:', err);
  } finally {
    server = null;
    startTime = 0;
  }
}

/**
 * Restarts the gateway by stopping and starting again.
 */
export async function restartGateway(): Promise<void> {
  console.log('[VAS:Gateway] Restarting...');
  await stopGateway();
  await startGateway();
  console.log('[VAS:Gateway] Restarted successfully.');
}

/**
 * Returns the current Fastify instance (or null if not running).
 */
export function getGatewayInstance(): FastifyInstance | null {
  return server;
}
