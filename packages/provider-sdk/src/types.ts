// ─── Provider SDK Types ───
// Core interfaces for the universal AI provider abstraction layer.

import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderType,
} from '@vas/shared';

// ─── Provider Configuration ───

export interface ProviderConfig {
  /** Unique identifier for this provider instance */
  id: string;
  /** Display name */
  name: string;
  /** Provider type (openai, anthropic, gemini, openai_compat, custom) */
  type: ProviderType;
  /** Base URL for the API */
  baseUrl: string;
  /** API key or token (may be empty for local providers) */
  apiKey?: string;
  /** Additional headers to include in every request */
  headers?: Record<string, string>;
  /** Rate limit configuration */
  rateLimits?: {
    /** Max requests per minute */
    requestsPerMinute?: number;
    /** Max tokens per minute */
    tokensPerMinute?: number;
  };
  /** Whether this provider is enabled */
  enabled?: boolean;
}

// ─── Provider Adapter Interface ───

export interface ProviderAdapter {
  /** The config for this provider instance */
  readonly config: ProviderConfig;

  /** Send a non-streaming chat completion request */
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  /** Send a streaming chat completion request, yielding chunks */
  chatStream(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk, void, undefined>;

  /** List available models from the provider */
  listModels(): Promise<ModelInfo[]>;

  /** Generate embeddings (optional — not all providers support this) */
  embeddings?(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /** Health check — verify provider is reachable and responsive */
  healthCheck(): Promise<HealthCheckResult>;

  /** Normalize a canonical (OpenAI-format) request into the provider's native format */
  normalizeRequest(request: ChatCompletionRequest): unknown;

  /** Normalize the provider's native response into canonical (OpenAI) format */
  normalizeResponse(raw: unknown): ChatCompletionResponse;

  /** Normalize a single stream chunk from the provider into canonical format */
  normalizeStreamChunk(raw: unknown): ChatCompletionChunk;
}

// ─── Model Info ───

export interface ModelInfo {
  /** Model identifier (e.g. 'gpt-4o', 'claude-sonnet-4-20250514') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Maximum context window in tokens */
  contextWindow?: number;
  /** Provider that owns this model */
  ownedBy?: string;
  /** Model capabilities */
  capabilities?: ModelCapabilities;
}

export interface ModelCapabilities {
  chat: boolean;
  completion?: boolean;
  embeddings?: boolean;
  vision?: boolean;
  tools?: boolean;
  streaming?: boolean;
}

// ─── Health Check ───

export interface HealthCheckResult {
  /** Overall status */
  status: 'healthy' | 'degraded' | 'down';
  /** Round-trip latency in milliseconds */
  latencyMs: number;
  /** Error message if status is not healthy */
  error?: string;
  /** Number of models discovered (if applicable) */
  modelsCount?: number;
}

// ─── Provider Error ───

export class ProviderError extends Error {
  /** HTTP status code from the provider (0 for network errors) */
  public readonly status: number;
  /** Provider identifier */
  public readonly provider: string;
  /** Whether this error is retryable */
  public readonly retryable: boolean;
  /** Retry-after seconds (from 429 responses) */
  public readonly retryAfterMs?: number;
  /** Raw error body from the provider */
  public readonly rawBody?: unknown;

  constructor(
    message: string,
    options: {
      status?: number;
      provider: string;
      retryable?: boolean;
      retryAfterMs?: number;
      rawBody?: unknown;
      cause?: Error;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = 'ProviderError';
    this.status = options.status ?? 0;
    this.provider = options.provider;
    this.retryable = options.retryable ?? false;
    this.retryAfterMs = options.retryAfterMs;
    this.rawBody = options.rawBody;
  }
}

// ─── Anthropic-Specific Types (internal) ───

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  system?: string | AnthropicSystemBlock[];
  tools?: AnthropicTool[];
  tool_choice?: AnthropicToolChoice;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  metadata?: Record<string, unknown>;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

export type AnthropicContentBlock =
  | AnthropicTextBlock
  | AnthropicImageBlock
  | AnthropicToolUseBlock
  | AnthropicToolResultBlock;

export interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

export interface AnthropicImageBlock {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    media_type?: string;
    data?: string;
    url?: string;
  };
}

export interface AnthropicToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AnthropicToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | AnthropicContentBlock[];
  is_error?: boolean;
}

export interface AnthropicSystemBlock {
  type: 'text';
  text: string;
}

export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
}

export type AnthropicToolChoice =
  | { type: 'auto' }
  | { type: 'any' }
  | { type: 'tool'; name: string };

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ─── Anthropic Streaming Event Types ───

export type AnthropicStreamEvent =
  | { type: 'message_start'; message: AnthropicResponse }
  | { type: 'content_block_start'; index: number; content_block: AnthropicContentBlock }
  | { type: 'content_block_delta'; index: number; delta: AnthropicDelta }
  | { type: 'content_block_stop'; index: number }
  | { type: 'message_delta'; delta: { stop_reason: string | null; stop_sequence: string | null }; usage: { output_tokens: number } }
  | { type: 'message_stop' }
  | { type: 'ping' }
  | { type: 'error'; error: { type: string; message: string } };

export type AnthropicDelta =
  | { type: 'text_delta'; text: string }
  | { type: 'input_json_delta'; partial_json: string };

// ─── Gemini Types (for normalizer) ───

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } }
  | { inlineData: { mimeType: string; data: string } };

export interface GeminiFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}
