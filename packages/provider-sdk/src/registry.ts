// ─── Provider Registry ───
// Central registry for managing provider instances and their adapters.

import type { ProviderType } from '@vas/shared';
import type {
  ProviderConfig,
  ProviderAdapter,
  HealthCheckResult,
} from './types.js';
import { ProviderError } from './types.js';
import { OpenAIAdapter } from './adapters/openai.js';
import { AnthropicAdapter } from './adapters/anthropic.js';
import { OpenAICompatAdapter } from './adapters/openai-compat.js';

/**
 * Result of a health check on a single provider.
 */
export interface ProviderHealthEntry {
  providerId: string;
  providerName: string;
  result: HealthCheckResult;
}

/**
 * Factory function type for creating custom adapters.
 */
export type AdapterFactory = (config: ProviderConfig) => ProviderAdapter;

/**
 * ProviderRegistry — manages registered providers and creates appropriate adapters.
 *
 * Usage:
 * ```ts
 * const registry = new ProviderRegistry();
 * registry.register({ id: 'openai-main', type: 'openai', ... });
 * const adapter = registry.get('openai-main');
 * const response = await adapter.chat({ ... });
 * ```
 */
export class ProviderRegistry {
  /** Registered adapters keyed by provider ID */
  private readonly adapters = new Map<string, ProviderAdapter>();
  /** Registered configs keyed by provider ID */
  private readonly configs = new Map<string, ProviderConfig>();
  /** Custom adapter factories keyed by provider type */
  private readonly customFactories = new Map<string, AdapterFactory>();

  /**
   * Register a custom adapter factory for a provider type.
   * This allows extending the registry with new provider types.
   */
  registerFactory(type: string, factory: AdapterFactory): void {
    this.customFactories.set(type, factory);
  }

  /**
   * Register a provider and create its adapter.
   * If a provider with the same ID already exists, it will be replaced.
   */
  register(config: ProviderConfig): ProviderAdapter {
    const adapter = this.createAdapter(config);
    this.adapters.set(config.id, adapter);
    this.configs.set(config.id, config);
    return adapter;
  }

  /**
   * Get a registered adapter by provider ID.
   * @throws ProviderError if the provider is not registered
   */
  get(id: string): ProviderAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new ProviderError(
        `Provider '${id}' is not registered`,
        {
          status: 404,
          provider: id,
          retryable: false,
        },
      );
    }
    return adapter;
  }

  /**
   * Check if a provider is registered.
   */
  has(id: string): boolean {
    return this.adapters.has(id);
  }

  /**
   * Remove a registered provider.
   * @returns true if the provider was removed, false if it wasn't registered
   */
  remove(id: string): boolean {
    this.configs.delete(id);
    return this.adapters.delete(id);
  }

  /**
   * List all registered providers with their configs.
   */
  list(): Array<{ config: ProviderConfig; adapter: ProviderAdapter }> {
    const result: Array<{ config: ProviderConfig; adapter: ProviderAdapter }> = [];
    for (const [id, adapter] of this.adapters) {
      const config = this.configs.get(id);
      if (config) {
        result.push({ config, adapter });
      }
    }
    return result;
  }

  /**
   * List all registered provider configs.
   */
  listConfigs(): ProviderConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get the number of registered providers.
   */
  get size(): number {
    return this.adapters.size;
  }

  /**
   * Remove all registered providers.
   */
  clear(): void {
    this.adapters.clear();
    this.configs.clear();
  }

  /**
   * Run health checks on all registered providers concurrently.
   * Returns results for each provider, including failures.
   */
  async healthCheckAll(): Promise<ProviderHealthEntry[]> {
    const entries = this.list();
    if (entries.length === 0) return [];

    const checks = entries.map(async ({ config, adapter }): Promise<ProviderHealthEntry> => {
      try {
        const result = await adapter.healthCheck();
        return {
          providerId: config.id,
          providerName: config.name,
          result,
        };
      } catch (error) {
        return {
          providerId: config.id,
          providerName: config.name,
          result: {
            status: 'down',
            latencyMs: 0,
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    });

    return Promise.all(checks);
  }

  /**
   * Run a health check on a single provider.
   * @throws ProviderError if the provider is not registered
   */
  async healthCheck(id: string): Promise<ProviderHealthEntry> {
    const adapter = this.get(id);
    const config = this.configs.get(id)!;

    try {
      const result = await adapter.healthCheck();
      return {
        providerId: config.id,
        providerName: config.name,
        result,
      };
    } catch (error) {
      return {
        providerId: config.id,
        providerName: config.name,
        result: {
          status: 'down',
          latencyMs: 0,
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  // ─── Private ───

  /**
   * Create the appropriate adapter based on provider type.
   */
  private createAdapter(config: ProviderConfig): ProviderAdapter {
    // Check custom factories first
    const customFactory = this.customFactories.get(config.type);
    if (customFactory) {
      return customFactory(config);
    }

    const providerType = config.type as ProviderType;

    switch (providerType) {
      case 'openai':
        return new OpenAIAdapter(config);

      case 'anthropic':
        return new AnthropicAdapter(config);

      case 'openai_compat':
        return new OpenAICompatAdapter(config);

      case 'gemini':
        // Gemini uses a significantly different API format.
        // For now, route through OpenAI-compat since Gemini's OpenAI-compatible
        // endpoint is available at /v1beta/openai/
        return new OpenAICompatAdapter({
          ...config,
          baseUrl: config.baseUrl.includes('/openai')
            ? config.baseUrl
            : `${config.baseUrl.replace(/\/+$/, '')}/openai`,
        });

      case 'custom':
        // Custom providers default to OpenAI-compat behavior
        return new OpenAICompatAdapter(config);

      default: {
        // Fallback: try OpenAI-compat for any unknown type
        return new OpenAICompatAdapter(config);
      }
    }
  }
}

/**
 * Create a singleton registry instance for convenience.
 * Individual apps can also create their own instances.
 */
export function createRegistry(): ProviderRegistry {
  return new ProviderRegistry();
}
