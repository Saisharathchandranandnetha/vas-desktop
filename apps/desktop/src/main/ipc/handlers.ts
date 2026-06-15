// ─── VAS Desktop — IPC Handler Registry ───
// Registers all IPC handlers from sub-modules.
import { ipcMain, app } from 'electron';
import { IPC_CHANNELS } from '@vas/shared';
import { registerProviderHandlers } from './providers.js';
import { registerSettingsHandlers } from './settings.js';
import { registerSecretsHandlers } from './secrets.js';
import { registerAgentsHandlers } from './agents.js';
import { registerMcpHandlers } from './mcp.js';
import { registerRoutingHandlers } from './routing.js';
import { registerWorkspacesHandlers } from './workspaces.js';
import { registerObservabilityHandlers } from './observability.js';

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
  registerAgentsHandlers();

  // ─── MCP handlers ───
  registerMcpHandlers();

  // ─── Routing handlers ───
  registerRoutingHandlers();

  // ─── Workspace handlers ───
  registerWorkspacesHandlers();

  // ─── Observability handlers ───
  registerObservabilityHandlers();

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
