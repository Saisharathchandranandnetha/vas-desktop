// ─── Event Types ───
// Events emitted across the application via IPC and WebSocket

export interface AgentLogEvent {
  agentId: string;
  stream: 'stdout' | 'stderr';
  data: string;
  timestamp: number;
}

export interface AgentStatusEvent {
  agentId: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  pid?: number;
  exitCode?: number;
  error?: string;
  timestamp: number;
}

export interface McpStatusEvent {
  serverId: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  pid?: number;
  toolsCount?: number;
  timestamp: number;
}

export interface RequestLogEvent {
  id: string;
  providerId: string;
  model: string;
  method: 'chat' | 'embeddings';
  status: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  hasStreaming: boolean;
  toolCalls: number;
  error?: string;
  timestamp: number;
}

export interface ProviderHealthEvent {
  providerId: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latencyMs?: number;
  error?: string;
  timestamp: number;
}

export interface GatewayStatusEvent {
  status: 'starting' | 'running' | 'stopped' | 'error';
  port: number;
  timestamp: number;
}

// ─── WebSocket Message Types ───

export type WsMessageType =
  | 'agent:status'
  | 'agent:log'
  | 'mcp:status'
  | 'request:log'
  | 'provider:health'
  | 'gateway:status';

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  data: T;
  timestamp: number;
}
