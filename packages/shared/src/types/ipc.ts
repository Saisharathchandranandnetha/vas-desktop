// ─── IPC Channel Definitions ───
// All IPC channels are defined here to prevent hardcoding across processes.

export const IPC_CHANNELS = {
  // Provider channels
  PROVIDERS_LIST: 'providers:list',
  PROVIDERS_CREATE: 'providers:create',
  PROVIDERS_UPDATE: 'providers:update',
  PROVIDERS_DELETE: 'providers:delete',
  PROVIDERS_TEST: 'providers:test',
  PROVIDERS_DISCOVER_MODELS: 'providers:discover-models',

  // Model channels
  MODELS_LIST: 'models:list',
  MODELS_SEARCH: 'models:search',

  // Agent channels
  AGENTS_LIST: 'agents:list',
  AGENTS_DETECT: 'agents:detect',
  AGENTS_START: 'agents:start',
  AGENTS_STOP: 'agents:stop',
  AGENTS_RESTART: 'agents:restart',
  AGENTS_LOGS: 'agents:logs',
  AGENTS_LOG_EVENT: 'agents:log',

  // MCP channels
  MCP_LIST: 'mcp:list',
  MCP_INSTALL: 'mcp:install',
  MCP_START: 'mcp:start',
  MCP_STOP: 'mcp:stop',
  MCP_INSPECT_TOOLS: 'mcp:inspect-tools',

  // Routing channels
  ROUTING_LIST: 'routing:list',
  ROUTING_CREATE: 'routing:create',
  ROUTING_UPDATE: 'routing:update',
  ROUTING_DELETE: 'routing:delete',

  // Workspace channels
  WORKSPACES_LIST: 'workspaces:list',
  WORKSPACES_CREATE: 'workspaces:create',
  WORKSPACES_ACTIVATE: 'workspaces:activate',

  // Secrets channels
  SECRETS_STORE: 'secrets:store',
  SECRETS_RETRIEVE: 'secrets:retrieve',
  SECRETS_DELETE: 'secrets:delete',

  // Observability channels
  OBSERVABILITY_STATS: 'observability:stats',
  OBSERVABILITY_RECENT: 'observability:recent',
  OBSERVABILITY_LIVE: 'observability:live',

  // Settings channels
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Gateway channels
  GATEWAY_STATUS: 'gateway:status',
  GATEWAY_RESTART: 'gateway:restart',

  // App channels
  APP_VERSION: 'app:version',
  APP_PLATFORM: 'app:platform',
  APP_CHECK_UPDATES: 'app:check-updates',
  APP_QUIT: 'app:quit',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

// ─── IPC Request/Response Types ───

export interface IpcProviderCreateRequest {
  name: string;
  type: ProviderType;
  baseUrl: string;
  apiKey: string;
  headers?: Record<string, string>;
  rateLimitRpm?: number;
  rateLimitTpm?: number;
}

export interface IpcProviderUpdateRequest {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  rateLimitRpm?: number;
  rateLimitTpm?: number;
  isEnabled?: boolean;
}

export interface IpcProviderTestResult {
  success: boolean;
  latencyMs: number;
  error?: string;
  modelsCount?: number;
}

export interface IpcAgentStartOptions {
  workingDirectory?: string;
  extraArgs?: string[];
  envOverrides?: Record<string, string>;
}

export interface IpcMcpInstallConfig {
  name: string;
  displayName: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  transport?: 'stdio' | 'http';
  autoStart?: boolean;
}

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'openai_compat' | 'custom';
export type AgentType =
  | 'claude_code'
  | 'codex'
  | 'gemini_cli'
  | 'opencode'
  | 'aider'
  | 'continue'
  | 'cline'
  | 'custom';
export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type McpTransport = 'stdio' | 'http';
