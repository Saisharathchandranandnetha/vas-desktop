// ─── OpenAI-Compatible Adapter ───
// Extends OpenAIAdapter for providers that use the OpenAI-compatible API format
// but with different base URLs and optional auth (e.g., Groq, DeepSeek, Mistral,
// OpenRouter, Ollama, LM Studio, vLLM).

import type {
  ChatCompletionRequest,
  EmbeddingRequest,
  EmbeddingResponse,
} from '@vas/shared';
import type { ProviderConfig, ModelInfo } from '../types.js';
import { ProviderError } from '../types.js';
import { OpenAIAdapter } from './openai.js';

/**
 * Provider-specific known limitations and quirks.
 */
interface ProviderQuirks {
  /** If true, skip Authorization header when no apiKey is set */
  optionalAuth: boolean;
  /** Parameters that are NOT supported by this provider */
  unsupportedParams?: Set<string>;
  /** If true, the /v1/embeddings endpoint is not available */
  noEmbeddings?: boolean;
  /** If true, the /v1/models endpoint may not be available */
  noModelsList?: boolean;
  /** Custom model list to return when models endpoint is not available */
  staticModels?: ModelInfo[];
}

/**
 * Known quirks for specific OpenAI-compatible providers.
 */
const PROVIDER_QUIRKS: Record<string, ProviderQuirks> = {
  groq: {
    optionalAuth: false,
    unsupportedParams: new Set(['logprobs', 'top_logprobs', 'n', 'seed']),
    noEmbeddings: true,
  },
  deepseek: {
    optionalAuth: false,
    unsupportedParams: new Set(['logprobs', 'top_logprobs']),
  },
  mistral: {
    optionalAuth: false,
    unsupportedParams: new Set(['logprobs', 'top_logprobs']),
  },
  openrouter: {
    optionalAuth: false,
    // OpenRouter supports most OpenAI params
  },
  ollama: {
    optionalAuth: true,
    // Ollama supports most params but may not support embeddings for all models
  },
  lmstudio: {
    optionalAuth: true,
    noEmbeddings: true,
  },
  vllm: {
    optionalAuth: true,
  },
};

export class OpenAICompatAdapter extends OpenAIAdapter {
  private readonly quirks: ProviderQuirks;

  constructor(config: ProviderConfig) {
    super(config);

    // Determine provider-specific quirks
    this.quirks = PROVIDER_QUIRKS[config.type] ?? {
      optionalAuth: !config.apiKey,
    };
  }

  // ─── Override Auth ───

  protected override buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...extra,
    };

    // Only set Authorization header if apiKey is provided
    // Local providers like Ollama and LM Studio don't need auth
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // OpenRouter requires additional headers
    if (this.config.type === 'openrouter') {
      headers['HTTP-Referer'] = 'https://vas.desktop';
      headers['X-Title'] = 'VAS Desktop';
    }

    return headers;
  }

  // ─── Override Request Normalization ───

  override normalizeRequest(request: ChatCompletionRequest): unknown {
    const normalized = super.normalizeRequest(request) as Record<string, unknown>;

    // Remove unsupported parameters for this provider
    if (this.quirks.unsupportedParams) {
      for (const param of this.quirks.unsupportedParams) {
        delete normalized[param];
      }
    }

    return normalized;
  }

  // ─── Override Embeddings ───

  override async embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (this.quirks.noEmbeddings) {
      throw new ProviderError(
        `[${this.config.id}] Embeddings are not supported by ${this.config.name}`,
        {
          status: 501,
          provider: this.config.id,
          retryable: false,
        },
      );
    }

    return super.embeddings(request);
  }

  // ─── Override Model Listing ───

  override async listModels(): Promise<ModelInfo[]> {
    if (this.quirks.noModelsList && this.quirks.staticModels) {
      return [...this.quirks.staticModels];
    }

    try {
      return await super.listModels();
    } catch (error) {
      // If models endpoint fails for local providers, return an empty list
      // rather than failing hard — models may still work for chat
      if (this.quirks.optionalAuth) {
        return [];
      }
      throw error;
    }
  }
}
