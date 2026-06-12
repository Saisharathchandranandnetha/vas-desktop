// ─── VAS Desktop — Health Route ───
// GET /health — Returns gateway health status with provider/agent/mcp counts.
import type { FastifyInstance } from 'fastify';
import type { GatewayHealthResponse } from '@vas/shared';
import { GATEWAY_DEFAULT_PORT } from '@vas/shared';
import { getRequestCount, getStartTime } from '../server.js';

/**
 * Registers the health check route.
 */
export async function registerHealthRoutes(server: FastifyInstance): Promise<void> {
  server.get('/health', async (_request, reply) => {
    try {
      // ─── Gather provider statistics ───
      let providerStats = { total: 0, healthy: 0, degraded: 0, down: 0 };

      try {
        const { getSettingsStore } = await import('../main/ipc/settings.js');
        const store = getSettingsStore();
        const providers = (store.get('providers') as Array<{
          isEnabled: boolean;
          healthStatus: string;
        }>) ?? [];

        const enabled = providers.filter((p) => p.isEnabled);
        providerStats = {
          total: enabled.length,
          healthy: enabled.filter((p) => p.healthStatus === 'healthy').length,
          degraded: enabled.filter((p) => p.healthStatus === 'degraded').length,
          down: enabled.filter((p) => p.healthStatus === 'down').length,
        };
      } catch {
        // Settings store may not be available
      }

      // ─── Calculate uptime ───
      const startTime = getStartTime();
      const uptime = startTime > 0 ? (Date.now() - startTime) / 1000 : 0;

      // ─── Determine overall status ───
      let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
      if (providerStats.down > 0 && providerStats.healthy === 0) {
        overallStatus = 'error';
      } else if (providerStats.degraded > 0 || providerStats.down > 0) {
        overallStatus = 'degraded';
      }

      // ─── Get app version ───
      let version = '1.0.0-alpha.1';
      try {
        const { app } = await import('electron');
        version = app.getVersion();
      } catch {
        // Running outside Electron context
      }

      const response: GatewayHealthResponse = {
        status: overallStatus,
        version,
        uptime,
        gateway: {
          port: GATEWAY_DEFAULT_PORT,
          requestsTotal: getRequestCount(),
          activeConnections: 0,
        },
        providers: providerStats,
        agents: {
          total: 0,
          running: 0,
        },
        mcp: {
          total: 0,
          running: 0,
        },
      };

      return reply.status(200).send(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({
        error: {
          message: `Health check failed: ${message}`,
          type: 'server_error',
          code: 'internal_error',
        },
      });
    }
  });

  // ─── Simple liveness probe ───
  server.get('/healthz', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  // ─── Readiness probe ───
  server.get('/readyz', async (_request, reply) => {
    const startTime = getStartTime();
    if (startTime === 0) {
      return reply.status(503).send({ status: 'not ready' });
    }
    return reply.status(200).send({ status: 'ready' });
  });

  console.log('[VAS:Gateway] Health routes registered.');
}
