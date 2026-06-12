// ─── VAS Desktop — Gateway Logging Middleware ───
// Logs request method, path, status code, and latency for all routes.
import type { FastifyInstance } from 'fastify';

/**
 * Request/response logging middleware.
 * Logs method, path, status, and latency to the console.
 * Also emits request log events for observability dashboard.
 */
export function requestLoggingMiddleware(server: FastifyInstance): void {
  // ─── onRequest: record start time ───
  server.addHook('onRequest', async (request) => {
    (request as Record<string, unknown>).__startTime = Date.now();
  });

  // ─── onResponse: log completed request ───
  server.addHook('onResponse', async (request, reply) => {
    const startTime = (request as Record<string, unknown>).__startTime as number | undefined;
    const latencyMs = startTime ? Date.now() - startTime : 0;
    const statusCode = reply.statusCode;
    const method = request.method;
    const url = request.url;

    // Color-code status for console readability
    const statusStr = formatStatusCode(statusCode);

    console.log(
      `[VAS:Gateway] ${method.padEnd(6)} ${url} → ${statusStr} (${latencyMs}ms)`,
    );

    // Emit to renderer for live observability (only for API routes)
    if (url.startsWith('/v1/')) {
      emitGatewayRequestEvent({
        method,
        path: url,
        statusCode,
        latencyMs,
        timestamp: Date.now(),
      });
    }
  });

  // ─── onError: log errors ───
  server.addHook('onError', async (request, _reply, error) => {
    console.error(
      `[VAS:Gateway] ERROR ${request.method} ${request.url}: ${error.message}`,
    );
  });
}

/**
 * Format status code with visual indicator.
 */
function formatStatusCode(code: number): string {
  if (code >= 500) return `${code} ✗`;
  if (code >= 400) return `${code} ⚠`;
  if (code >= 300) return `${code} ↗`;
  return `${code} ✓`;
}

/**
 * Emit a gateway request event to all BrowserWindows.
 */
function emitGatewayRequestEvent(data: {
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  timestamp: number;
}): void {
  try {
    const { BrowserWindow } = require('electron') as typeof import('electron');
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('gateway:request-log', data);
      }
    }
  } catch {
    // Running outside Electron context (tests, etc.)
  }
}
