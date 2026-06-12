// ─── VAS Desktop — Provider IPC Handlers ───
import { ipcMain, safeStorage } from 'electron';
import { IPC_CHANNELS, PROVIDER_DEFAULTS } from '@vas/shared';
import type { IpcProviderCreateRequest, IpcProviderUpdateRequest, IpcProviderTestResult, ProviderType } from '@vas/shared';
import { getSettingsStore } from './settings.js';

// ─── In-memory provider registry ───
// Until @vas/database is fully wired, we persist providers in electron-store
// and keep an in-memory registry for quick lookups.

interface StoredProvider {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  apiKeyEncrypted: string; // base64-encoded encrypted buffer
  headers: Record<string, string>;
  rateLimitRpm: number;
  rateLimitTpm: number;
  isEnabled: boolean;
  modelsDiscovered: string[];
  healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
  createdAt: string;
  updatedAt: string;
}

function getProvidersFromStore(): StoredProvider[] {
  const store = getSettingsStore();
  return (store.get('providers') as StoredProvider[] | undefined) ?? [];
}

function saveProvidersToStore(providers: StoredProvider[]): void {
  const store = getSettingsStore();
  store.set('providers', providers);
}

/**
 * Registers all provider-related IPC handlers.
 */
export function registerProviderHandlers(): void {
  // ─── List all providers ───
  ipcMain.handle(IPC_CHANNELS.PROVIDERS_LIST, async () => {
    try {
      const providers = getProvidersFromStore();
      // Strip encrypted keys from response
      const sanitized = providers.map(({ apiKeyEncrypted: _key, ...rest }) => ({
        ...rest,
        hasApiKey: !!_key,
      }));
      return { success: true, data: sanitized };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Create a new provider ───
  ipcMain.handle(IPC_CHANNELS.PROVIDERS_CREATE, async (_event, data: IpcProviderCreateRequest) => {
    try {
      const providers = getProvidersFromStore();

      // Encrypt the API key using Electron's safeStorage
      let apiKeyEncrypted = '';
      if (data.apiKey) {
        if (!safeStorage.isEncryptionAvailable()) {
          return { success: false, error: 'Encryption is not available on this system' };
        }
        const encrypted = safeStorage.encryptString(data.apiKey);
        apiKeyEncrypted = encrypted.toString('base64');
      }

      // Look up defaults for known provider types
      const defaults = PROVIDER_DEFAULTS[data.type] ?? {};

      const newProvider: StoredProvider = {
        id: crypto.randomUUID(),
        name: data.name || defaults.name || data.type,
        type: data.type,
        baseUrl: data.baseUrl || defaults.baseUrl || '',
        apiKeyEncrypted,
        headers: data.headers ?? {},
        rateLimitRpm: data.rateLimitRpm ?? 200,
        rateLimitTpm: data.rateLimitTpm ?? 100_000,
        isEnabled: true,
        modelsDiscovered: [],
        healthStatus: 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      providers.push(newProvider);
      saveProvidersToStore(providers);

      console.log(`[VAS:IPC] Provider created: ${newProvider.name} (${newProvider.id})`);
      return {
        success: true,
        data: {
          id: newProvider.id,
          name: newProvider.name,
          type: newProvider.type,
          baseUrl: newProvider.baseUrl,
          isEnabled: newProvider.isEnabled,
          hasApiKey: !!apiKeyEncrypted,
          createdAt: newProvider.createdAt,
        },
      };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Update an existing provider ───
  ipcMain.handle(IPC_CHANNELS.PROVIDERS_UPDATE, async (_event, id: string, data: IpcProviderUpdateRequest) => {
    try {
      const providers = getProvidersFromStore();
      const index = providers.findIndex((p) => p.id === id);

      if (index === -1) {
        return { success: false, error: `Provider not found: ${id}` };
      }

      const provider = providers[index];

      // Update fields
      if (data.name !== undefined) provider.name = data.name;
      if (data.baseUrl !== undefined) provider.baseUrl = data.baseUrl;
      if (data.headers !== undefined) provider.headers = data.headers;
      if (data.rateLimitRpm !== undefined) provider.rateLimitRpm = data.rateLimitRpm;
      if (data.rateLimitTpm !== undefined) provider.rateLimitTpm = data.rateLimitTpm;
      if (data.isEnabled !== undefined) provider.isEnabled = data.isEnabled;

      // Update API key if provided
      if (data.apiKey !== undefined) {
        if (data.apiKey === '') {
          provider.apiKeyEncrypted = '';
        } else {
          if (!safeStorage.isEncryptionAvailable()) {
            return { success: false, error: 'Encryption is not available on this system' };
          }
          const encrypted = safeStorage.encryptString(data.apiKey);
          provider.apiKeyEncrypted = encrypted.toString('base64');
        }
      }

      provider.updatedAt = new Date().toISOString();
      providers[index] = provider;
      saveProvidersToStore(providers);

      console.log(`[VAS:IPC] Provider updated: ${provider.name} (${id})`);
      return { success: true, data: { id, ...data, updatedAt: provider.updatedAt } };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Delete a provider ───
  ipcMain.handle(IPC_CHANNELS.PROVIDERS_DELETE, async (_event, id: string) => {
    try {
      const providers = getProvidersFromStore();
      const index = providers.findIndex((p) => p.id === id);

      if (index === -1) {
        return { success: false, error: `Provider not found: ${id}` };
      }

      const removed = providers.splice(index, 1)[0];
      saveProvidersToStore(providers);

      console.log(`[VAS:IPC] Provider deleted: ${removed.name} (${id})`);
      return { success: true };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Test provider connection ───
  ipcMain.handle(IPC_CHANNELS.PROVIDERS_TEST, async (_event, id: string) => {
    try {
      const providers = getProvidersFromStore();
      const provider = providers.find((p) => p.id === id);

      if (!provider) {
        return { success: false, error: `Provider not found: ${id}` };
      }

      // Decrypt API key
      let apiKey = '';
      if (provider.apiKeyEncrypted) {
        const buffer = Buffer.from(provider.apiKeyEncrypted, 'base64');
        apiKey = safeStorage.decryptString(buffer);
      }

      // Perform health check by calling the models endpoint
      const startTime = Date.now();
      const modelsUrl = `${provider.baseUrl.replace(/\/+$/, '')}/models`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...provider.headers,
      };

      // Set auth header based on provider type
      if (apiKey) {
        if (provider.type === 'anthropic') {
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(15_000),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        const result: IpcProviderTestResult = {
          success: false,
          latencyMs,
          error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
        };

        // Update health status
        const idx = providers.findIndex((p) => p.id === id);
        if (idx !== -1) {
          providers[idx].healthStatus = 'down';
          saveProvidersToStore(providers);
        }

        return { success: true, data: result };
      }

      const body = await response.json().catch(() => ({ data: [] })) as { data?: unknown[] };
      const modelsCount = Array.isArray(body.data) ? body.data.length : 0;

      const result: IpcProviderTestResult = {
        success: true,
        latencyMs,
        modelsCount,
      };

      // Update health status
      const idx = providers.findIndex((p) => p.id === id);
      if (idx !== -1) {
        providers[idx].healthStatus = 'healthy';
        saveProvidersToStore(providers);
      }

      console.log(`[VAS:IPC] Provider test OK: ${provider.name} — ${latencyMs}ms, ${modelsCount} models`);
      return { success: true, data: result };
    } catch (error) {
      const result: IpcProviderTestResult = {
        success: false,
        latencyMs: 0,
        error: formatError(error),
      };
      return { success: true, data: result };
    }
  });

  // ─── Discover models from provider ───
  ipcMain.handle(IPC_CHANNELS.PROVIDERS_DISCOVER_MODELS, async (_event, id: string) => {
    try {
      const providers = getProvidersFromStore();
      const provider = providers.find((p) => p.id === id);

      if (!provider) {
        return { success: false, error: `Provider not found: ${id}` };
      }

      // Decrypt API key
      let apiKey = '';
      if (provider.apiKeyEncrypted) {
        const buffer = Buffer.from(provider.apiKeyEncrypted, 'base64');
        apiKey = safeStorage.decryptString(buffer);
      }

      const modelsUrl = `${provider.baseUrl.replace(/\/+$/, '')}/models`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...provider.headers,
      };

      if (apiKey) {
        if (provider.type === 'anthropic') {
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        return { success: false, error: `HTTP ${response.status}: ${errorText.slice(0, 200)}` };
      }

      const body = await response.json() as { data?: Array<{ id: string; owned_by?: string; created?: number }> };
      const models = Array.isArray(body.data) ? body.data : [];

      // Store discovered model IDs
      const idx = providers.findIndex((p) => p.id === id);
      if (idx !== -1) {
        providers[idx].modelsDiscovered = models.map((m) => m.id);
        providers[idx].updatedAt = new Date().toISOString();
        saveProvidersToStore(providers);
      }

      const formattedModels = models.map((m) => ({
        id: m.id,
        providerId: id,
        providerName: provider.name,
        ownedBy: m.owned_by ?? provider.type,
        created: m.created ?? Math.floor(Date.now() / 1000),
      }));

      console.log(`[VAS:IPC] Discovered ${formattedModels.length} models from ${provider.name}`);
      return { success: true, data: formattedModels };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  console.log('[VAS:IPC] Provider handlers registered.');
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
