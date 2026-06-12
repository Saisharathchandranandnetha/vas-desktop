// ─── Typed IPC Client ───
// Wraps window.vas.* (Electron preload) with fallback mock data for dev

import type {
  ProviderType,
  HealthStatus,
  AgentType,
  McpTransport,
} from '@vas/shared';

// ─── Domain Types (UI layer) ───

export interface UIProvider {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  status: HealthStatus;
  modelsCount: number;
  isEnabled: boolean;
  createdAt: number;
}

export interface UIModel {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
}

export interface UIAgent {
  id: string;
  name: string;
  type: AgentType;
  status: 'running' | 'stopped' | 'error' | 'starting';
  version: string;
  pid?: number;
  uptime: number;
  lastStarted?: number;
}

export interface UIMcpServer {
  id: string;
  name: string;
  displayName: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  transport: McpTransport;
  toolsCount: number;
  command: string;
}

export interface UIGatewayStatus {
  status: 'running' | 'stopped' | 'error' | 'starting';
  port: number;
  uptime: number;
  requestsTotal: number;
  activeConnections: number;
}

export interface UIObservabilityStats {
  totalRequests: number;
  avgLatencyMs: number;
  totalCost: number;
  errorRate: number;
}

export interface UIRequestLog {
  id: string;
  model: string;
  providerName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  status: number;
  timestamp: number;
}

// ─── Mock Data (development fallback) ───

const MOCK_PROVIDERS: UIProvider[] = [
  {
    id: 'openai-1',
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    status: 'healthy',
    modelsCount: 12,
    isEnabled: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'anthropic-1',
    name: 'Anthropic',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    status: 'healthy',
    modelsCount: 6,
    isEnabled: true,
    createdAt: Date.now() - 72000000,
  },
  {
    id: 'ollama-1',
    name: 'Ollama Local',
    type: 'openai_compat',
    baseUrl: 'http://localhost:11434/v1',
    status: 'degraded',
    modelsCount: 3,
    isEnabled: true,
    createdAt: Date.now() - 36000000,
  },
];

const MOCK_MODELS: UIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    providerId: 'openai-1',
    providerName: 'OpenAI',
    contextWindow: 128000,
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    providerId: 'openai-1',
    providerName: 'OpenAI',
    contextWindow: 128000,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    providerId: 'anthropic-1',
    providerName: 'Anthropic',
    contextWindow: 200000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    providerId: 'anthropic-1',
    providerName: 'Anthropic',
    contextWindow: 200000,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: 'llama3.3-70b',
    name: 'Llama 3.3 70B',
    providerId: 'ollama-1',
    providerName: 'Ollama Local',
    contextWindow: 131072,
    inputCostPer1k: 0,
    outputCostPer1k: 0,
    supportsTools: true,
    supportsVision: false,
    supportsStreaming: true,
  },
];

const MOCK_AGENTS: UIAgent[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    type: 'claude_code',
    status: 'running',
    version: '1.0.16',
    pid: 12345,
    uptime: 3600,
    lastStarted: Date.now() - 3600000,
  },
  {
    id: 'aider',
    name: 'Aider',
    type: 'aider',
    status: 'stopped',
    version: '0.72.1',
    uptime: 0,
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    type: 'codex',
    status: 'stopped',
    version: '0.1.0',
    uptime: 0,
  },
];

const MOCK_MCP_SERVERS: UIMcpServer[] = [
  {
    id: 'filesystem',
    name: 'filesystem',
    displayName: 'Filesystem',
    status: 'running',
    transport: 'stdio',
    toolsCount: 11,
    command: 'npx @modelcontextprotocol/server-filesystem',
  },
  {
    id: 'github',
    name: 'github',
    displayName: 'GitHub',
    status: 'running',
    transport: 'stdio',
    toolsCount: 18,
    command: 'npx @modelcontextprotocol/server-github',
  },
];

const MOCK_GATEWAY_STATUS: UIGatewayStatus = {
  status: 'running',
  port: 16324,
  uptime: 7200,
  requestsTotal: 1847,
  activeConnections: 3,
};

const MOCK_OBS_STATS: UIObservabilityStats = {
  totalRequests: 1847,
  avgLatencyMs: 342,
  totalCost: 12.47,
  errorRate: 0.02,
};

const MOCK_REQUEST_LOGS: UIRequestLog[] = [
  {
    id: 'req-1',
    model: 'claude-sonnet-4-20250514',
    providerName: 'Anthropic',
    promptTokens: 1200,
    completionTokens: 800,
    totalTokens: 2000,
    estimatedCost: 0.0156,
    latencyMs: 2340,
    status: 200,
    timestamp: Date.now() - 5000,
  },
  {
    id: 'req-2',
    model: 'gpt-4o',
    providerName: 'OpenAI',
    promptTokens: 500,
    completionTokens: 300,
    totalTokens: 800,
    estimatedCost: 0.0043,
    latencyMs: 890,
    status: 200,
    timestamp: Date.now() - 12000,
  },
  {
    id: 'req-3',
    model: 'gpt-4o-mini',
    providerName: 'OpenAI',
    promptTokens: 2000,
    completionTokens: 1500,
    totalTokens: 3500,
    estimatedCost: 0.0012,
    latencyMs: 450,
    status: 200,
    timestamp: Date.now() - 25000,
  },
  {
    id: 'req-4',
    model: 'claude-sonnet-4-20250514',
    providerName: 'Anthropic',
    promptTokens: 3000,
    completionTokens: 200,
    totalTokens: 3200,
    estimatedCost: 0.012,
    latencyMs: 5100,
    status: 500,
    timestamp: Date.now() - 45000,
  },
  {
    id: 'req-5',
    model: 'llama3.3-70b',
    providerName: 'Ollama Local',
    promptTokens: 800,
    completionTokens: 600,
    totalTokens: 1400,
    estimatedCost: 0,
    latencyMs: 1200,
    status: 200,
    timestamp: Date.now() - 60000,
  },
];

// ─── Client Functions ───

function isElectron(): boolean {
  return typeof window !== 'undefined' && window.vas !== undefined;
}

export const ipc = {
  providers: {
    async list(): Promise<UIProvider[]> {
      if (isElectron()) {
        return window.vas.providers.list();
      }
      return MOCK_PROVIDERS;
    },

    async create(data: {
      name: string;
      type: ProviderType;
      baseUrl: string;
      apiKey: string;
    }): Promise<UIProvider> {
      if (isElectron()) {
        return window.vas.providers.create(data);
      }
      const provider: UIProvider = {
        id: `${data.type}-${Date.now()}`,
        name: data.name,
        type: data.type,
        baseUrl: data.baseUrl,
        status: 'unknown',
        modelsCount: 0,
        isEnabled: true,
        createdAt: Date.now(),
      };
      MOCK_PROVIDERS.push(provider);
      return provider;
    },

    async delete(id: string): Promise<void> {
      if (isElectron()) {
        return window.vas.providers.delete(id);
      }
      const idx = MOCK_PROVIDERS.findIndex((p) => p.id === id);
      if (idx !== -1) MOCK_PROVIDERS.splice(idx, 1);
    },

    async test(id: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
      if (isElectron()) {
        return window.vas.providers.test(id);
      }
      return { success: true, latencyMs: Math.round(Math.random() * 500 + 100) };
    },
  },

  models: {
    async list(): Promise<UIModel[]> {
      if (isElectron()) {
        return window.vas.models.list();
      }
      return MOCK_MODELS;
    },
  },

  agents: {
    async list(): Promise<UIAgent[]> {
      if (isElectron()) {
        return window.vas.agents.list();
      }
      return MOCK_AGENTS;
    },

    async start(id: string): Promise<void> {
      if (isElectron()) {
        return window.vas.agents.start(id);
      }
      const agent = MOCK_AGENTS.find((a) => a.id === id);
      if (agent) {
        agent.status = 'running';
        agent.lastStarted = Date.now();
      }
    },

    async stop(id: string): Promise<void> {
      if (isElectron()) {
        return window.vas.agents.stop(id);
      }
      const agent = MOCK_AGENTS.find((a) => a.id === id);
      if (agent) {
        agent.status = 'stopped';
        agent.uptime = 0;
      }
    },

    async restart(id: string): Promise<void> {
      if (isElectron()) {
        return window.vas.agents.restart(id);
      }
      const agent = MOCK_AGENTS.find((a) => a.id === id);
      if (agent) {
        agent.status = 'running';
        agent.lastStarted = Date.now();
      }
    },

    async detect(): Promise<UIAgent[]> {
      if (isElectron()) {
        return window.vas.agents.detect();
      }
      return MOCK_AGENTS;
    },
  },

  mcp: {
    async list(): Promise<UIMcpServer[]> {
      if (isElectron()) {
        return window.vas.mcp.list();
      }
      return MOCK_MCP_SERVERS;
    },

    async start(id: string): Promise<void> {
      if (isElectron()) {
        return window.vas.mcp.start(id);
      }
      const server = MOCK_MCP_SERVERS.find((s) => s.id === id);
      if (server) server.status = 'running';
    },

    async stop(id: string): Promise<void> {
      if (isElectron()) {
        return window.vas.mcp.stop(id);
      }
      const server = MOCK_MCP_SERVERS.find((s) => s.id === id);
      if (server) server.status = 'stopped';
    },
  },

  gateway: {
    async status(): Promise<UIGatewayStatus> {
      if (isElectron()) {
        return window.vas.gateway.status();
      }
      return MOCK_GATEWAY_STATUS;
    },
  },

  observability: {
    async stats(): Promise<UIObservabilityStats> {
      if (isElectron()) {
        return window.vas.observability.stats();
      }
      return MOCK_OBS_STATS;
    },

    async recent(limit = 50): Promise<UIRequestLog[]> {
      if (isElectron()) {
        return window.vas.observability.recent(limit);
      }
      return MOCK_REQUEST_LOGS;
    },
  },

  app: {
    async version(): Promise<string> {
      if (isElectron()) {
        return window.vas.app.version();
      }
      return '1.0.0-dev';
    },

    async platform(): Promise<string> {
      if (isElectron()) {
        return window.vas.app.platform();
      }
      return 'win32';
    },
  },

  window: {
    minimize(): void {
      if (isElectron()) {
        window.vas.window.minimize();
      }
    },
    maximize(): void {
      if (isElectron()) {
        window.vas.window.maximize();
      }
    },
    close(): void {
      if (isElectron()) {
        window.vas.window.close();
      }
    },
  },
};
