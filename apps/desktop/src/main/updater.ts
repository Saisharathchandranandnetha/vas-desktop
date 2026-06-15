// ─── VAS Desktop — Auto Updater ───
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import type { UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow } from 'electron';

/** The update channel the user is subscribed to */
export type UpdateChannel = 'stable' | 'beta' | 'nightly';

let mainWindowRef: BrowserWindow | null = null;

/**
 * Initialize the auto-updater and bind events.
 * Should be called once after the main window is created.
 */
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow;

  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  // ─── Event Handlers ───

  autoUpdater.on('checking-for-update', () => {
    console.log('[VAS:Updater] Checking for updates...');
    sendUpdateEvent('checking');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log(`[VAS:Updater] Update available: ${info.version}`);
    sendUpdateEvent('available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
    });

    // Automatically start download
    autoUpdater.downloadUpdate().catch((err) => {
      console.error('[VAS:Updater] Failed to download update:', err);
    });
  });

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log(`[VAS:Updater] No update available. Current: ${info.version}`);
    sendUpdateEvent('not-available', { version: info.version });
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    console.log(`[VAS:Updater] Download progress: ${progress.percent.toFixed(1)}%`);
    sendUpdateEvent('download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log(`[VAS:Updater] Update downloaded: ${info.version}`);
    sendUpdateEvent('downloaded', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
    });
  });

  autoUpdater.on('error', (err: Error) => {
    console.error('[VAS:Updater] Error:', err.message);
    sendUpdateEvent('error', { error: err.message });
  });

  // Do an initial check after a brief delay
  setTimeout(() => {
    checkForUpdates().catch((err) => {
      console.error('[VAS:Updater] Initial check failed:', err);
    });
  }, 10_000);
}

/**
 * Check for updates. Can be called from IPC or automatically.
 */
export async function checkForUpdates(): Promise<void> {
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('[VAS:Updater] Check for updates failed:', error);
  }
}

/**
 * Set the update channel (stable, beta, nightly).
 * This modifies the feed URL to point to the appropriate release channel.
 */
export function setUpdateChannel(channel: UpdateChannel): void {
  autoUpdater.allowPrerelease = channel !== 'stable';
  // electron-updater will use the channel suffix from the version
  // e.g., 1.0.0-beta.1 for beta channel
  autoUpdater.channel = channel === 'stable' ? 'latest' : channel;
  console.log(`[VAS:Updater] Update channel set to: ${channel}`);
}

/**
 * Install a downloaded update and restart the app.
 */
export function installUpdate(): void {
  autoUpdater.quitAndInstall(false, true);
}

/**
 * Send an update event to the renderer process.
 */
function sendUpdateEvent(status: string, data?: Record<string, unknown>): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('app:update-event', { status, ...data });
  }
}
