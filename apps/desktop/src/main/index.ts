// ─── VAS Desktop — Electron Main Process Entry Point ───
import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMainWindow } from './window.js';
import { createTray } from './tray.js';
import { createApplicationMenu } from './menu.js';
import { initAutoUpdater } from './updater.js';
import { registerAllIpcHandlers } from './ipc/handlers.js';
import { startGateway, stopGateway } from '../gateway/server.js';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Security: enable sandbox for all renderers ───
app.enableSandbox();

// ─── Single Instance Lock ───
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('[VAS] Another instance is already running. Exiting.');
  app.quit();
} else {
  let mainWindow: BrowserWindow | null = null;

  // When a second instance is launched, focus the existing window
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      console.log('[VAS] Starting VAS Desktop...');

      // 1. Register IPC handlers (must happen before window creation)
      console.log('[VAS] Registering IPC handlers...');
      registerAllIpcHandlers();

      // 2. Start the Fastify gateway
      console.log('[VAS] Starting Fastify gateway...');
      await startGateway();

      // 3. Create the main window
      console.log('[VAS] Creating main window...');
      mainWindow = createMainWindow();

      // 4. Create the application menu
      console.log('[VAS] Setting up application menu...');
      createApplicationMenu(mainWindow);

      // 5. Create the system tray
      console.log('[VAS] Creating system tray...');
      createTray(mainWindow);

      // 6. Initialize auto-updater
      console.log('[VAS] Initializing auto-updater...');
      initAutoUpdater(mainWindow);

      // Handle window close
      mainWindow.on('closed', () => {
        mainWindow = null;
      });

      console.log('[VAS] VAS Desktop started successfully.');
    } catch (error) {
      console.error('[VAS] Fatal error during startup:', error);
      app.quit();
    }
  });

  // ─── macOS: recreate window when dock icon is clicked ───
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });

  // ─── Window lifecycle ───
  app.on('window-all-closed', () => {
    // On macOS, keep the app running in the tray/dock
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // ─── Cleanup on quit ───
  app.on('before-quit', async () => {
    console.log('[VAS] Shutting down...');
    try {
      await stopGateway();
      console.log('[VAS] Gateway stopped.');
    } catch (error) {
      console.error('[VAS] Error stopping gateway:', error);
    }
  });

  // ─── Unhandled errors ───
  process.on('uncaughtException', (error) => {
    console.error('[VAS] Uncaught exception:', error);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[VAS] Unhandled rejection:', reason);
  });
}
