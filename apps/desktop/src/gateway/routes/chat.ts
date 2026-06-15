// ─── VAS Desktop — Chat Completions Route ───
// POST /v1/chat/completions — OpenAI-compatible chat API
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  TokenUsage,
} from '@vas/shared';
import { MODEL_COSTS, calculateCost } from '@vas/shared';
import { incrementRequestCount } from '../server.js';
import { RoutingEngine } from '../engine.js';

const routingEngine = new RoutingEngine();
// (Removed heuristic resolveModelToProvider in favor of RoutingEngine)

/**
 * Builds the appropriate headers for a provider request.
 */
function buildProviderHeaders(provider: { type: string; decryptedApiKey?: string; headers?: Record<string, string> }): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(provider.headers || {}),
  };

  if (provider.decryptedApiKey) {
    if (provider.type === 'anthropic') {
      headers['x-api-key'] = provider.decryptedApiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${provider.decryptedApiKey}`;
    }
  }

  return headers;
}

/**
 * Registers the chat completions route.
 */
export async function registerChatRoutes(server: FastifyInstance): Promise<void> {
  server.post('/v1/chat/completions', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    incrementRequestCount();

    // ─── Parse request body ───
    const body = request.body as ChatCompletionRequest;

    if (!body.model) {
      return reply.status(400).send({
        error: {
          message: 'model is required',
          type: 'invalid_request_error',
          code: 'model_required',
        },
      });
    }

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return reply.status(400).send({
        error: {
          message: 'messages array is required and must not be empty',
          type: 'invalid_request_error',
          code: 'messages_required',
        },
      });
    }

    // ─── Resolve provider ───
    const workspaceId = (request.headers['x-vas-workspace-id'] as string) || undefined;
    const agentId = (request.headers['x-vas-agent-id'] as string) || undefined;
    const route = await routingEngine.resolve(body.model, workspaceId, agentId);

    if (!route) {
      return reply.status(404).send({
        error: {
          message: `No provider found for model: ${body.model}. Configure a provider first.`,
          type: 'invalid_request_error',
          code: 'model_not_found',
        },
      });
    }

    const { provider, model: targetModel } = route;
    
    // Override the model with the resolved modelId if it changed through routing
    if (body.model !== targetModel.modelId) {
      body.model = targetModel.modelId;
    }

    const targetUrl = `${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const headers = buildProviderHeaders(provider);

    try {
      // ─── Forward request to provider ───
      const providerResponse = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });

      if (!providerResponse.ok) {
        const errorBody = await providerResponse.text().catch(() => 'Unknown provider error');
        const latencyMs = Date.now() - startTime;

        // Log failed request
        emitRequestLog({
          providerId: provider.id,
          model: body.model,
          status: providerResponse.status,
          latencyMs,
          error: errorBody.slice(0, 500),
          hasStreaming: !!body.stream,
        });

        return reply.status(providerResponse.status).send({
          error: {
            message: `Provider error: ${errorBody.slice(0, 500)}`,
            type: 'upstream_error',
            code: `provider_${providerResponse.status}`,
          },
        });
      }

      // ─── Handle streaming response ───
      if (body.stream) {
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        });

        const reader = providerResponse.body?.getReader();
        if (!reader) {
          reply.raw.end();
          return;
        }

        const decoder = new TextDecoder();
        let totalChunks = 0;
        let finalUsage: TokenUsage | null = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            reply.raw.write(text);
            totalChunks++;

            // Try to extract usage from the last chunk
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const chunk = JSON.parse(line.slice(6)) as ChatCompletionChunk;
                  if (chunk.usage) {
                    finalUsage = chunk.usage;
                  }
                } catch {
                  // Not all lines are valid JSON
                }
              }
            }
          }
        } catch (streamErr) {
          console.error('[VAS:Chat] Stream error:', streamErr);
        } finally {
          reply.raw.end();

          const latencyMs = Date.now() - startTime;
          emitRequestLog({
            providerId: provider.id,
            model: body.model,
            status: 200,
            latencyMs,
            hasStreaming: true,
            promptTokens: finalUsage?.prompt_tokens,
            completionTokens: finalUsage?.completion_tokens,
            totalTokens: finalUsage?.total_tokens,
          });
        }

        return;
      }

      // ─── Handle non-streaming response ───
      const responseBody = await providerResponse.json() as ChatCompletionResponse;
      const latencyMs = Date.now() - startTime;

      // Log the request
      emitRequestLog({
        providerId: provider.id,
        model: body.model,
        status: 200,
        latencyMs,
        hasStreaming: false,
        promptTokens: responseBody.usage?.prompt_tokens,
        completionTokens: responseBody.usage?.completion_tokens,
        totalTokens: responseBody.usage?.total_tokens,
        toolCalls: responseBody.choices?.[0]?.message?.tool_calls?.length,
      });

      return reply.status(200).send(responseBody);
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      emitRequestLog({
        providerId: provider.id,
        model: body.model,
        status: 502,
        latencyMs,
        error: errorMessage,
        hasStreaming: !!body.stream,
      });

      // Check for specific error types
      if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
        return reply.status(504).send({
          error: {
            message: 'Provider request timed out',
            type: 'timeout_error',
            code: 'provider_timeout',
          },
        });
      }

      return reply.status(502).send({
        error: {
          message: `Failed to reach provider: ${errorMessage}`,
          type: 'upstream_error',
          code: 'provider_unreachable',
        },
      });
    }
  });

  console.log('[VAS:Gateway] Chat routes registered.');
}

/**
 * Emits a request log event for observability.
 */
function emitRequestLog(data: {
  providerId: string;
  model: string;
  status: number;
  latencyMs: number;
  hasStreaming: boolean;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  toolCalls?: number;
  error?: string;
}): void {
  const promptTokens = data.promptTokens ?? 0;
  const completionTokens = data.completionTokens ?? 0;

  // Estimate cost from well-known model pricing
  const modelCost = MODEL_COSTS[data.model];
  const estimatedCost = modelCost
    ? calculateCost(promptTokens, completionTokens, modelCost.input, modelCost.output)
    : 0;

  const logEntry = {
    id: crypto.randomUUID(),
    providerId: data.providerId,
    model: data.model,
    method: 'chat' as const,
    status: data.status,
    promptTokens,
    completionTokens,
    totalTokens: data.totalTokens ?? promptTokens + completionTokens,
    estimatedCost,
    latencyMs: data.latencyMs,
    hasStreaming: data.hasStreaming,
    toolCalls: data.toolCalls ?? 0,
    error: data.error,
    timestamp: Date.now(),
  };

  // Emit to all BrowserWindows for live observability
  try {
    const { BrowserWindow } = require('electron') as typeof import('electron');
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('observability:live', logEntry);
      }
    }
  } catch {
    // Running outside Electron context (tests, etc.)
  }

  console.log(
    `[VAS:Chat] ${data.model} → ${data.status} in ${data.latencyMs}ms` +
      (data.totalTokens ? ` (${data.totalTokens} tokens)` : '') +
      (data.error ? ` [ERROR: ${data.error.slice(0, 80)}]` : ''),
  );
}
