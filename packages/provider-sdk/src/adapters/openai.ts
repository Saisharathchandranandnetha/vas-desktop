// ─── OpenAI Adapter ───
// Implements ProviderAdapter for OpenAI's API (and serves as base for compatible providers).

import { generateId } from '@vas/shared';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  EmbeddingRequest,
  EmbeddingResponse,
} from '@vas/shared';
import type {
  ProviderAdapter,
  ProviderConfig,
  ModelInfo,
  HealthCheckResult,
} from '../types.js';
import { ProviderError } from '../types.js';
import { parseSSEStream } from '../normalizers/streaming.js';
import { normalizeHttpError, normalizeProviderError } from '../normalizers/errors.js';

export class OpenAIAdapter implements ProviderAdapter {
  public readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  // ─── Auth & Headers ───

  /**
   * Build the headers for an API request.
   * Subclasses can override this for different auth schemes.
   */
  protected buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...extra,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * Build the full URL for an API endpoint.
   */
  protected buildUrl(path: string): string {
    const base = this.config.baseUrl.replace(/\/+$/, '');
    return `${base}${path}`;
  }

  /**
   * Execute a fetch request with error handling.
   */
  protected async fetchJson<T>(
    url: string,
    options: RequestInit,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      throw normalizeProviderError(error, this.config.id);
    }

    if (!response.ok) {
      throw await normalizeHttpError(response, this.config.id);
    }

    try {
      return await response.json() as T;
    } catch (error) {
      throw normalizeProviderError(error, this.config.id);
    }
  }

  /**
   * Execute a fetch request for streaming with error handling.
   */
  protected async fetchStream(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      throw normalizeProviderError(error, this.config.id);
    }

    if (!response.ok) {
      throw await normalizeHttpError(response, this.config.id);
    }

    return response;
  }

  // ─── ProviderAdapter Methods ───

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const normalized = this.normalizeRequest(request) as Record<string, unknown>;
    // Ensure stream is false for non-streaming
    normalized.stream = false;

    const url = this.buildUrl('/chat/completions');
    const raw = await this.fetchJson<unknown>(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(normalized),
    });

    return this.normalizeResponse(raw);
  }

  async *chatStream(
    request: ChatCompletionRequest,
  ): AsyncGenerator<ChatCompletionChunk, void, undefined> {
    const normalized = this.normalizeRequest(request) as Record<string, unknown>;
    normalized.stream = true;
    // Request usage in the final chunk (OpenAI supports this)
    normalized.stream_options = { include_usage: true };

    const url = this.buildUrl('/chat/completions');
    const response = await this.fetchStream(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(normalized),
    });

    for await (const raw of parseSSEStream(response)) {
      try {
        yield this.normalizeStreamChunk(raw);
      } catch {
        // Skip malformed chunks
        continue;
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const url = this.buildUrl('/models');

    interface OpenAIModelsResponse {
      data: Array<{
        id: string;
        owned_by?: string;
        created?: number;
      }>;
    }

    const raw = await this.fetchJson<OpenAIModelsResponse>(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    return (raw.data ?? []).map((m) => ({
      id: m.id,
      name: m.id,
      ownedBy: m.owned_by,
      capabilities: {
        chat: true,
        streaming: true,
      },
    }));
  }

  async embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const url = this.buildUrl('/embeddings');
    return this.fetchJson<EmbeddingResponse>(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(request),
    });
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      const models = await this.listModels();
      const latencyMs = Math.round(performance.now() - start);
      return {
        status: 'healthy',
        latencyMs,
        modelsCount: models.length,
      };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - start);
      const message = error instanceof Error ? error.message : String(error);

      // If we got a response (even an error), the provider is at least reachable
      if (error instanceof ProviderError && error.status > 0 && error.status < 500) {
        return {
          status: 'degraded',
          latencyMs,
          error: message,
        };
      }

      return {
        status: 'down',
        latencyMs,
        error: message,
      };
    }
  }

  // ─── Normalization ───
  // OpenAI format is our canonical format, so normalization is minimal.

  normalizeRequest(request: ChatCompletionRequest): unknown {
    // OpenAI format is canonical — pass through with only minor cleanup
    const normalized: Record<string, unknown> = {
      model: request.model,
      messages: request.messages,
    };

    // Only include optional fields if they're defined
    if (request.tools && request.tools.length > 0) normalized.tools = request.tools;
    if (request.tool_choice !== undefined) normalized.tool_choice = request.tool_choice;
    if (request.temperature !== undefined) normalized.temperature = request.temperature;
    if (request.max_tokens !== undefined) normalized.max_tokens = request.max_tokens;
    if (request.top_p !== undefined) normalized.top_p = request.top_p;
    if (request.stop !== undefined) normalized.stop = request.stop;
    if (request.frequency_penalty !== undefined) normalized.frequency_penalty = request.frequency_penalty;
    if (request.presence_penalty !== undefined) normalized.presence_penalty = request.presence_penalty;
    if (request.n !== undefined) normalized.n = request.n;
    if (request.response_format !== undefined) normalized.response_format = request.response_format;
    if (request.seed !== undefined) normalized.seed = request.seed;
    if (request.stream !== undefined) normalized.stream = request.stream;
    if (request.user !== undefined) normalized.user = request.user;

    return normalized;
  }

  normalizeResponse(raw: unknown): ChatCompletionResponse {
    // The raw response should already be in OpenAI format.
    // We validate and cast with minimal transformation.
    const response = raw as Record<string, unknown>;

    return {
      id: (response.id as string) ?? `chatcmpl-${generateId()}`,
      object: 'chat.completion',
      created: (response.created as number) ?? Math.floor(Date.now() / 1000),
      model: (response.model as string) ?? 'unknown',
      choices: (response.choices as ChatCompletionResponse['choices']) ?? [],
      usage: (response.usage as ChatCompletionResponse['usage']) ?? {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
      system_fingerprint: response.system_fingerprint as string | undefined,
    };
  }

  normalizeStreamChunk(raw: unknown): ChatCompletionChunk {
    const chunk = raw as Record<string, unknown>;

    return {
      id: (chunk.id as string) ?? '',
      object: 'chat.completion.chunk',
      created: (chunk.created as number) ?? Math.floor(Date.now() / 1000),
      model: (chunk.model as string) ?? 'unknown',
      choices: (chunk.choices as ChatCompletionChunk['choices']) ?? [],
      usage: (chunk.usage as ChatCompletionChunk['usage']) ?? undefined,
    };
  }
}
