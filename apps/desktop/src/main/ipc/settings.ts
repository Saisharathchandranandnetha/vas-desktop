// ─── VAS Desktop — Settings IPC Handlers ───
import { ipcMain, app } from 'electron';
import { IPC_CHANNELS, DEFAULT_CONFIG } from '@vas/shared';
import ElectronStore from 'electron-store';

// ─── Singleton Store ───
let store: ElectronStore | null = null;

/**
 * Returns the singleton electron-store instance.
 * Lazily initialized on first call.
 */
export function getSettingsStore(): ElectronStore {
  if (!store) {
    store = new ElectronStore({
      name: 'vas-settings',
      defaults: {
        config: DEFAULT_CONFIG,
        providers: [],
        secrets: {},
        windowBounds: {
          width: 1440,
          height: 900,
        },
      },
    });
    console.log(`[VAS:Settings] Store path: ${store.path}`);
  }
  return store;
}

/**
 * Registers settings-related IPC handlers.
 */
export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (_event, key: string) => {
    try {
      const settingsStore = getSettingsStore();

      // If no key provided, return all settings
      if (!key) {
        return { success: true, data: settingsStore.store };
      }

      const value = settingsStore.get(key);
      return { success: true, data: value };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, key: string, value: unknown) => {
    try {
      if (!key) {
        return { success: false, error: 'Settings key is required' };
      }

      const settingsStore = getSettingsStore();
      settingsStore.set(key, value);

      console.log(`[VAS:Settings] Set "${key}"`);
      return { success: true };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  });

  console.log('[VAS:IPC] Settings handlers registered.');
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
