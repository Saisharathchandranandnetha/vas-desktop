// ─── VAS Desktop — Secrets IPC Handlers ───
// Uses Electron safeStorage for OS-level encryption (DPAPI on Windows, Keychain on macOS, libsecret on Linux).
import { ipcMain, safeStorage } from 'electron';
import { IPC_CHANNELS } from '@vas/shared';
import { getSettingsStore } from './settings.js';

/**
 * Registers secrets-related IPC handlers.
 * Secrets are encrypted with safeStorage and stored in electron-store.
 */
export function registerSecretsHandlers(): void {
  // ─── Store a secret ───
  ipcMain.handle(IPC_CHANNELS.SECRETS_STORE, async (_event, key: string, value: string) => {
    try {
      if (!key) {
        return { success: false, error: 'Secret key is required' };
      }

      if (!safeStorage.isEncryptionAvailable()) {
        return { success: false, error: 'OS-level encryption is not available on this system' };
      }

      const encrypted = safeStorage.encryptString(value);
      const base64 = encrypted.toString('base64');

      const store = getSettingsStore();
      const secrets = (store.get('secrets') as Record<string, string>) ?? {};
      secrets[key] = base64;
      store.set('secrets', secrets);

      console.log(`[VAS:Secrets] Stored secret: ${key}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Retrieve a secret ───
  ipcMain.handle(IPC_CHANNELS.SECRETS_RETRIEVE, async (_event, key: string) => {
    try {
      if (!key) {
        return { success: false, error: 'Secret key is required' };
      }

      if (!safeStorage.isEncryptionAvailable()) {
        return { success: false, error: 'OS-level encryption is not available on this system' };
      }

      const store = getSettingsStore();
      const secrets = (store.get('secrets') as Record<string, string>) ?? {};
      const base64 = secrets[key];

      if (!base64) {
        return { success: false, error: `Secret not found: ${key}` };
      }

      const buffer = Buffer.from(base64, 'base64');
      const decrypted = safeStorage.decryptString(buffer);

      return { success: true, data: decrypted };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  // ─── Delete a secret ───
  ipcMain.handle(IPC_CHANNELS.SECRETS_DELETE, async (_event, key: string) => {
    try {
      if (!key) {
        return { success: false, error: 'Secret key is required' };
      }

      const store = getSettingsStore();
      const secrets = (store.get('secrets') as Record<string, string>) ?? {};

      if (!(key in secrets)) {
        return { success: false, error: `Secret not found: ${key}` };
      }

      delete secrets[key];
      store.set('secrets', secrets);

      console.log(`[VAS:Secrets] Deleted secret: ${key}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  console.log('[VAS:IPC] Secrets handlers registered.');
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
