// ─── Anthropic Adapter ───
// Implements ProviderAdapter for Anthropic's Messages API.
// Handles the significant differences between Anthropic and OpenAI formats:
// - Different auth (x-api-key instead of Bearer)
// - System message is a top-level field, not in the messages array
// - Tools use input_schema instead of parameters
// - Content is block-based (text, tool_use, tool_result)
// - Streaming uses named events instead of generic SSE

import { generateId } from '@vas/shared';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ChatCompletionChunkChoice,
  ChatMessage,
} from '@vas/shared';
import type {
  ProviderAdapter,
  ProviderConfig,
  ModelInfo,
  HealthCheckResult,
  AnthropicRequest,
  AnthropicResponse,
  AnthropicStreamEvent,
  AnthropicTextBlock,
  AnthropicToolUseBlock,
} from '../types.js';
import { ProviderError } from '../types.js';
import { extractSystemMessage, convertToAnthropicMessages } from '../normalizers/messages.js';
import { convertToolsToAnthropic, convertAnthropicToolCalls, convertToolChoiceToAnthropic } from '../normalizers/tools.js';
import { parseAnthropicStream } from '../normalizers/streaming.js';
import { normalizeHttpError, normalizeProviderError } from '../normalizers/errors.js';

/** Known Anthropic models with their capabilities */
const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    contextWindow: 200_000,
    ownedBy: 'anthropic',
    capabilities: { chat: true, streaming: true, vision: true, tools: true },
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    contextWindow: 200_000,
    ownedBy: 'anthropic',
    capabilities: { chat: true, streaming: true, vision: true, tools: true },
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    contextWindow: 200_000,
    ownedBy: 'anthropic',
    capabilities: { chat: true, streaming: true, vision: true, tools: true },
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    contextWindow: 200_000,
    ownedBy: 'anthropic',
    capabilities: { chat: true, streaming: true, vision: true, tools: true },
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    contextWindow: 200_000,
    ownedBy: 'anthropic',
    capabilities: { chat: true, streaming: true, vision: true, tools: true },
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    contextWindow: 200_000,
    ownedBy: 'anthropic',
    capabilities: { chat: true, streaming: true, vision: true, tools: true },
  },
];

const ANTHROPIC_API_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 4096;

export class AnthropicAdapter implements ProviderAdapter {
  public readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  // ─── Auth & Headers ───

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': ANTHROPIC_API_VERSION,
      ...this.config.headers,
      ...extra,
    };

    // Anthropic uses x-api-key, NOT Bearer auth
    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    return headers;
  }

  private buildUrl(path: string): string {
    const base = this.config.baseUrl.replace(/\/+$/, '');
    return `${base}${path}`;
  }

  private async fetchJson<T>(url: string, options: RequestInit): Promise<T> {
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

  private async fetchStream(url: string, options: RequestInit): Promise<Response> {
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
    const normalized = this.normalizeRequest(request) as AnthropicRequest;
    normalized.stream = false;

    const url = this.buildUrl('/messages');
    const raw = await this.fetchJson<AnthropicResponse>(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(normalized),
    });

    return this.normalizeResponse(raw);
  }

  async *chatStream(
    request: ChatCompletionRequest,
  ): AsyncGenerator<ChatCompletionChunk, void, undefined> {
    const normalized = this.normalizeRequest(request) as AnthropicRequest;
    normalized.stream = true;

    const url = this.buildUrl('/messages');
    const response = await this.fetchStream(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(normalized),
    });

    // State for accumulating the streaming response
    const streamId = `chatcmpl-${generateId()}`;
    const model = normalized.model;
    let currentBlockIndex = -1;
    let currentBlockType: string | null = null;
    let _currentToolName = '';

    for await (const event of parseAnthropicStream(response)) {
      const chunk = this.convertStreamEvent(event, streamId, model, {
        getCurrentBlockIndex: () => currentBlockIndex,
        getCurrentBlockType: () => currentBlockType,
        setCurrentBlock: (index: number, type: string) => {
          currentBlockIndex = index;
          currentBlockType = type;
        },
        getCurrentToolName: () => _currentToolName,
        setCurrentToolName: (name: string) => {
          _currentToolName = name;
        },
      });

      if (chunk) yield chunk;
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    // Anthropic does not have a public models endpoint.
    // Return the hardcoded list of known models.
    return [...ANTHROPIC_MODELS];
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      // Send a minimal messages request to verify connectivity
      const url = this.buildUrl('/messages');
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });

      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        return {
          status: 'healthy',
          latencyMs,
          modelsCount: ANTHROPIC_MODELS.length,
        };
      }

      // Auth error or other client error — provider is reachable but degraded
      if (response.status < 500) {
        return {
          status: 'degraded',
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        status: 'down',
        latencyMs,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        status: 'down',
        latencyMs,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ─── Normalization ───

  normalizeRequest(request: ChatCompletionRequest): unknown {
    // Extract system messages from the messages array
    const { systemPrompt, filteredMessages } = extractSystemMessage(request.messages);

    // Convert messages to Anthropic format
    const anthropicMessages = convertToAnthropicMessages(filteredMessages);

    const anthropicRequest: AnthropicRequest = {
      model: request.model,
      messages: anthropicMessages,
      max_tokens: request.max_tokens ?? DEFAULT_MAX_TOKENS,
    };

    // System prompt is a top-level field in Anthropic
    if (systemPrompt) {
      anthropicRequest.system = systemPrompt;
    }

    // Convert tools
    if (request.tools && request.tools.length > 0) {
      anthropicRequest.tools = convertToolsToAnthropic(request.tools);
    }

    // Convert tool_choice
    if (request.tool_choice !== undefined) {
      const converted = convertToolChoiceToAnthropic(request.tool_choice);
      if (converted) {
        anthropicRequest.tool_choice = converted;
      }
    }

    // Optional parameters
    if (request.temperature !== undefined) anthropicRequest.temperature = request.temperature;
    if (request.top_p !== undefined) anthropicRequest.top_p = request.top_p;
    if (request.stop !== undefined) {
      anthropicRequest.stop_sequences = Array.isArray(request.stop) ? request.stop : [request.stop];
    }

    return anthropicRequest;
  }

  normalizeResponse(raw: unknown): ChatCompletionResponse {
    const response = raw as AnthropicResponse;

    // Extract text content from blocks
    const textBlocks = (response.content ?? [])
      .filter((b): b is AnthropicTextBlock => b.type === 'text');
    const textContent = textBlocks.map((b) => b.text).join('');

    // Extract tool calls
    const toolCalls = convertAnthropicToolCalls(response.content ?? []);

    // Map Anthropic stop_reason to OpenAI finish_reason
    const finishReason = this.mapStopReason(response.stop_reason);

    // Build the OpenAI-format message
    const message: ChatMessage = {
      role: 'assistant',
      content: textContent || null,
    };
    if (toolCalls.length > 0) {
      message.tool_calls = toolCalls;
    }

    return {
      id: response.id ?? `chatcmpl-${generateId()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model ?? 'unknown',
      choices: [
        {
          index: 0,
          message,
          finish_reason: finishReason,
        },
      ],
      usage: {
        prompt_tokens: response.usage?.input_tokens ?? 0,
        completion_tokens: response.usage?.output_tokens ?? 0,
        total_tokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
      },
    };
  }

  normalizeStreamChunk(raw: unknown): ChatCompletionChunk {
    // This is called for individual events from the SSE stream.
    // For Anthropic, we handle conversion in convertStreamEvent instead.
    // This method provides a basic fallback.
    const event = raw as AnthropicStreamEvent;
    return {
      id: '',
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'unknown',
      choices: [{
        index: 0,
        delta: {},
        finish_reason: event.type === 'message_stop' ? 'stop' : null,
      }],
    };
  }

  // ─── Private Helpers ───

  /**
   * Convert an Anthropic streaming event into an OpenAI-format chunk.
   * Returns null for events that don't produce a chunk (e.g. ping, message_start metadata).
   */
  private convertStreamEvent(
    event: AnthropicStreamEvent,
    streamId: string,
    model: string,
    state: {
      getCurrentBlockIndex: () => number;
      getCurrentBlockType: () => string | null;
      setCurrentBlock: (index: number, type: string) => void;
      getCurrentToolName: () => string;
      setCurrentToolName: (name: string) => void;
    },
  ): ChatCompletionChunk | null {
    const baseChunk = (choices: ChatCompletionChunkChoice[]): ChatCompletionChunk => ({
      id: streamId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices,
    });

    switch (event.type) {
      case 'message_start': {
        // First event — send the role
        return baseChunk([{
          index: 0,
          delta: { role: 'assistant', content: '' },
          finish_reason: null,
        }]);
      }

      case 'content_block_start': {
        state.setCurrentBlock(event.index, event.content_block.type);

        if (event.content_block.type === 'tool_use') {
          const block = event.content_block as AnthropicToolUseBlock;
          state.setCurrentToolName(block.name);
          // Emit tool call start
          return baseChunk([{
            index: 0,
            delta: {
              tool_calls: [{
                id: block.id,
                type: 'function',
                function: {
                  name: block.name,
                  arguments: '',
                },
              }],
            },
            finish_reason: null,
          }]);
        }

        // Text block start — no content yet
        return null;
      }

      case 'content_block_delta': {
        if (event.delta.type === 'text_delta') {
          return baseChunk([{
            index: 0,
            delta: { content: event.delta.text },
            finish_reason: null,
          }]);
        }

        if (event.delta.type === 'input_json_delta') {
          // Streaming tool arguments
          return baseChunk([{
            index: 0,
            delta: {
              tool_calls: [{
                id: '', // Only first chunk has the ID
                type: 'function',
                function: {
                  name: state.getCurrentToolName(),
                  arguments: event.delta.partial_json,
                },
              }],
            },
            finish_reason: null,
          }]);
        }

        return null;
      }

      case 'content_block_stop': {
        // Block finished — no special action needed
        return null;
      }

      case 'message_delta': {
        // End of message — includes stop_reason and final usage
        const finishReason = this.mapStopReason(event.delta.stop_reason);
        const chunk = baseChunk([{
          index: 0,
          delta: {},
          finish_reason: finishReason,
        }]);

        // Include usage if available
        if (event.usage) {
          chunk.usage = {
            prompt_tokens: 0, // Only output_tokens available in message_delta
            completion_tokens: event.usage.output_tokens,
            total_tokens: event.usage.output_tokens,
          };
        }

        return chunk;
      }

      case 'message_stop':
        // Final event — stream is done
        return null;

      case 'ping':
        // Keepalive — ignore
        return null;

      case 'error': {
        throw new ProviderError(
          `[${this.config.id}] Stream error: ${event.error.message}`,
          {
            status: 0,
            provider: this.config.id,
            retryable: false,
          },
        );
      }

      default:
        return null;
    }
  }

  /**
   * Map Anthropic's stop_reason to OpenAI's finish_reason.
   */
  private mapStopReason(
    stopReason: string | null | undefined,
  ): 'stop' | 'length' | 'tool_calls' | 'content_filter' | null {
    if (!stopReason) return null;
    switch (stopReason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'tool_use':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }
}
