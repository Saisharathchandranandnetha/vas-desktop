// ─── VAS Desktop — IPC Handler Registry ───
// Registers all IPC handlers from sub-modules.
import { ipcMain, app } from 'electron';
import { IPC_CHANNELS } from '@vas/shared';
import { registerProviderHandlers } from './providers.js';
import { registerSettingsHandlers } from './settings.js';
import { registerSecretsHandlers } from './secrets.js';

/**
 * Registers ALL IPC handlers for the main process.
 * Must be called once before creating any BrowserWindow.
 */
export function registerAllIpcHandlers(): void {
  console.log('[VAS:IPC] Registering all IPC handlers...');

  // ─── Provider handlers ───
  registerProviderHandlers();

  // ─── Settings handlers ───
  registerSettingsHandlers();

  // ─── Secrets handlers ───
  registerSecretsHandlers();

  // ─── Model handlers (placeholder until full DB) ───
  ipcMain.handle(IPC_CHANNELS.MODELS_LIST, async (_event, providerId?: string) => {
    try {
      // Will be fully implemented when @vas/database is ready
      console.log(`[VAS:IPC] models:list called, providerId=${providerId ?? 'all'}`);
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MODELS_SEARCH, async (_event, query: string) => {
    try {
      console.log(`[VAS:IPC] models:search called, query="${query}"`);
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Agent handlers ───
  ipcMain.handle(IPC_CHANNELS.AGENTS_LIST, async () => {
    try {
      console.log('[VAS:IPC] agents:list called');
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AGENTS_DETECT, async () => {
    try {
      console.log('[VAS:IPC] agents:detect called');
      // Detect installed agents on the system
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AGENTS_START, async (_event, id: string, options?: Record<string, unknown>) => {
    try {
      console.log(`[VAS:IPC] agents:start called, id=${id}`, options);
      return { success: true, data: { id, status: 'starting' } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AGENTS_STOP, async (_event, id: string) => {
    try {
      console.log(`[VAS:IPC] agents:stop called, id=${id}`);
      return { success: true, data: { id, status: 'stopped' } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AGENTS_RESTART, async (_event, id: string) => {
    try {
      console.log(`[VAS:IPC] agents:restart called, id=${id}`);
      return { success: true, data: { id, status: 'starting' } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AGENTS_LOGS, async (_event, id: string, lines?: number) => {
    try {
      console.log(`[VAS:IPC] agents:logs called, id=${id}, lines=${lines ?? 100}`);
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── MCP handlers ───
  ipcMain.handle(IPC_CHANNELS.MCP_LIST, async () => {
    try {
      console.log('[VAS:IPC] mcp:list called');
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_INSTALL, async (_event, config: Record<string, unknown>) => {
    try {
      console.log('[VAS:IPC] mcp:install called', config);
      return { success: true, data: { id: crypto.randomUUID(), ...config, status: 'installed' } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_START, async (_event, id: string) => {
    try {
      console.log(`[VAS:IPC] mcp:start called, id=${id}`);
      return { success: true, data: { id, status: 'running' } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_STOP, async (_event, id: string) => {
    try {
      console.log(`[VAS:IPC] mcp:stop called, id=${id}`);
      return { success: true, data: { id, status: 'stopped' } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_INSPECT_TOOLS, async (_event, id: string) => {
    try {
      console.log(`[VAS:IPC] mcp:inspect-tools called, id=${id}`);
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Routing handlers ───
  ipcMain.handle(IPC_CHANNELS.ROUTING_LIST, async () => {
    try {
      console.log('[VAS:IPC] routing:list called');
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ROUTING_CREATE, async (_event, rule: Record<string, unknown>) => {
    try {
      console.log('[VAS:IPC] routing:create called', rule);
      return { success: true, data: { id: crypto.randomUUID(), ...rule } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ROUTING_UPDATE, async (_event, id: string, data: Record<string, unknown>) => {
    try {
      console.log(`[VAS:IPC] routing:update called, id=${id}`, data);
      return { success: true, data: { id, ...data } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ROUTING_DELETE, async (_event, id: string) => {
    try {
      console.log(`[VAS:IPC] routing:delete called, id=${id}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Workspace handlers ───
  ipcMain.handle(IPC_CHANNELS.WORKSPACES_LIST, async () => {
    try {
      console.log('[VAS:IPC] workspaces:list called');
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACES_CREATE, async (_event, data: Record<string, unknown>) => {
    try {
      console.log('[VAS:IPC] workspaces:create called', data);
      return { success: true, data: { id: crypto.randomUUID(), ...data } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACES_ACTIVATE, async (_event, id: string) => {
    try {
      console.log(`[VAS:IPC] workspaces:activate called, id=${id}`);
      return { success: true, data: { id, active: true } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Observability handlers ───
  ipcMain.handle(IPC_CHANNELS.OBSERVABILITY_STATS, async () => {
    try {
      return {
        success: true,
        data: {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          avgLatencyMs: 0,
          requestsPerMinute: 0,
          activeProviders: 0,
          activeAgents: 0,
          activeMcpServers: 0,
        },
      };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.OBSERVABILITY_RECENT, async (_event, limit?: number) => {
    try {
      console.log(`[VAS:IPC] observability:recent called, limit=${limit ?? 50}`);
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Gateway handlers ───
  ipcMain.handle(IPC_CHANNELS.GATEWAY_STATUS, async () => {
    try {
      return {
        success: true,
        data: {
          status: 'running',
          port: 16324,
          uptime: process.uptime(),
        },
      };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GATEWAY_RESTART, async () => {
    try {
      console.log('[VAS:IPC] gateway:restart called');
      // Import dynamically to avoid circular deps
      const { restartGateway } = await import('../../gateway/server.js');
      await restartGateway();
      return { success: true };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── App handlers ───
  ipcMain.handle(IPC_CHANNELS.APP_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(IPC_CHANNELS.APP_PLATFORM, () => {
    return {
      platform: process.platform,
      arch: process.arch,
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    };
  });

  ipcMain.handle(IPC_CHANNELS.APP_CHECK_UPDATES, async () => {
    try {
      const { checkForUpdates } = await import('../updater.js');
      await checkForUpdates();
      return { success: true };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
    app.quit();
  });

  console.log('[VAS:IPC] All IPC handlers registered.');
}

/**
 * Format an error into a serializable string.
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
