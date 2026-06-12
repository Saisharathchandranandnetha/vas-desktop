// ─── API Types ───
// Canonical types for the VAS Gateway API (OpenAI-compatible format)

// ─── Chat Completions ───

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  tool_choice?: ToolChoice;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string | string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  n?: number;
  response_format?: { type: 'text' | 'json_object' };
  seed?: number;
  user?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentBlock[] | null;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ContentBlock {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string; detail?: 'auto' | 'low' | 'high' };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export type ToolChoice =
  | 'none'
  | 'auto'
  | 'required'
  | { type: 'function'; function: { name: string } };

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: TokenUsage;
  system_fingerprint?: string;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  logprobs?: unknown;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// ─── Streaming ───

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
  usage?: TokenUsage | null;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: Partial<ChatMessage>;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

// ─── Models ───

export interface ModelListResponse {
  object: 'list';
  data: ModelObject[];
}

export interface ModelObject {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

// ─── Embeddings ───

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  dimensions?: number;
  encoding_format?: 'float' | 'base64';
}

export interface EmbeddingResponse {
  object: 'list';
  data: EmbeddingObject[];
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

export interface EmbeddingObject {
  object: 'embedding';
  index: number;
  embedding: number[];
}

// ─── Health ───

export interface GatewayHealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  gateway: {
    port: number;
    requestsTotal: number;
    activeConnections: number;
  };
  providers: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  agents: {
    total: number;
    running: number;
  };
  mcp: {
    total: number;
    running: number;
  };
}
