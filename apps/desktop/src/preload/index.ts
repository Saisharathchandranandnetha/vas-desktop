// ─── VAS Desktop — Preload Script ───
// Exposes a secure `window.vas` API via contextBridge.
// All communication goes through typed IPC channels.
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@vas/shared';

/**
 * The VAS API exposed to the renderer via window.vas
 */
const vasApi = {
  // ─── Providers ───
  providers: {
    list: () =>
      ipcRenderer.invoke(IPC_CHANNELS.PROVIDERS_LIST),
    create: (data: {
      name: string;
      type: string;
      baseUrl: string;
      apiKey: string;
      headers?: Record<string, string>;
      rateLimitRpm?: number;
      rateLimitTpm?: number;
    }) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROVIDERS_CREATE, data),
    update: (id: string, data: {
      name?: string;
      baseUrl?: string;
      apiKey?: string;
      headers?: Record<string, string>;
      rateLimitRpm?: number;
      rateLimitTpm?: number;
      isEnabled?: boolean;
    }) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROVIDERS_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROVIDERS_DELETE, id),
    test: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROVIDERS_TEST, id),
    discoverModels: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROVIDERS_DISCOVER_MODELS, id),
  },

  // ─── Agents ───
  agents: {
    list: () =>
      ipcRenderer.invoke(IPC_CHANNELS.AGENTS_LIST),
    detect: () =>
      ipcRenderer.invoke(IPC_CHANNELS.AGENTS_DETECT),
    start: (id: string, options?: {
      workingDirectory?: string;
      extraArgs?: string[];
      envOverrides?: Record<string, string>;
    }) =>
      ipcRenderer.invoke(IPC_CHANNELS.AGENTS_START, id, options),
    stop: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.AGENTS_STOP, id),
    restart: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.AGENTS_RESTART, id),
    logs: (id: string, lines?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.AGENTS_LOGS, id, lines),
    onLog: (callback: (event: {
      agentId: string;
      stream: 'stdout' | 'stderr';
      data: string;
      timestamp: number;
    }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: unknown) => {
        callback(data as Parameters<typeof callback>[0]);
      };
      ipcRenderer.on(IPC_CHANNELS.AGENTS_LOG_EVENT, handler);
      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.AGENTS_LOG_EVENT, handler);
      };
    },
  },

  // ─── MCP Servers ───
  mcp: {
    list: () =>
      ipcRenderer.invoke(IPC_CHANNELS.MCP_LIST),
    install: (config: {
      name: string;
      displayName: string;
      command: string;
      args: string[];
      env?: Record<string, string>;
      transport?: 'stdio' | 'http';
      autoStart?: boolean;
    }) =>
      ipcRenderer.invoke(IPC_CHANNELS.MCP_INSTALL, config),
    start: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.MCP_START, id),
    stop: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.MCP_STOP, id),
    inspectTools: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.MCP_INSPECT_TOOLS, id),
  },

  // ─── Models ───
  models: {
    list: (providerId?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.MODELS_LIST, providerId),
    search: (query: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.MODELS_SEARCH, query),
  },

  // ─── Routing Rules ───
  routing: {
    list: () =>
      ipcRenderer.invoke(IPC_CHANNELS.ROUTING_LIST),
    create: (rule: {
      name: string;
      pattern: string;
      providerId: string;
      modelId: string;
      priority?: number;
    }) =>
      ipcRenderer.invoke(IPC_CHANNELS.ROUTING_CREATE, rule),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke(IPC_CHANNELS.ROUTING_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ROUTING_DELETE, id),
  },

  // ─── Workspaces ───
  workspaces: {
    list: () =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACES_LIST),
    create: (data: { name: string; path: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACES_CREATE, data),
    activate: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACES_ACTIVATE, id),
  },

  // ─── Secrets ───
  secrets: {
    store: (key: string, value: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SECRETS_STORE, key, value),
    retrieve: (key: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SECRETS_RETRIEVE, key),
    delete: (key: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SECRETS_DELETE, key),
  },

  // ─── Observability ───
  observability: {
    getStats: () =>
      ipcRenderer.invoke(IPC_CHANNELS.OBSERVABILITY_STATS),
    getRecentRequests: (limit?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.OBSERVABILITY_RECENT, limit),
    onLiveUpdate: (callback: (event: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: unknown) => {
        callback(data);
      };
      ipcRenderer.on(IPC_CHANNELS.OBSERVABILITY_LIVE, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.OBSERVABILITY_LIVE, handler);
      };
    },
  },

  // ─── Settings ───
  settings: {
    get: (key: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
    set: (key: string, value: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),
  },

  // ─── Gateway ───
  gateway: {
    status: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GATEWAY_STATUS),
    restart: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GATEWAY_RESTART),
  },

  // ─── App ───
  app: {
    getVersion: () =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_VERSION),
    getPlatform: () =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_PLATFORM),
    checkUpdates: () =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_CHECK_UPDATES),
    quit: () =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_QUIT),
  },
};

// ─── Expose to renderer ───
contextBridge.exposeInMainWorld('vas', vasApi);

// ─── Type declaration for renderer ───
export type VasApi = typeof vasApi;
