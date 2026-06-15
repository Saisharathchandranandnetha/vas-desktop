// ─── VAS Desktop — Main Window ───
import { BrowserWindow, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Whether we're running in development mode */
const isDev = !app.isPackaged;

import { app } from 'electron';

// CSP policy — strict but allows localhost dev server and self
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*`,
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "media-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Creates and returns the main application BrowserWindow.
 */
export function createMainWindow(): BrowserWindow {
  const preloadPath = path.join(__dirname, '..', 'preload', 'index.js');

  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    titleBarOverlay: process.platform === 'win32'
      ? {
          color: '#09090B',
          symbolColor: '#A1A1AA',
          height: 36,
        }
      : undefined,
    backgroundColor: '#09090B',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: preloadPath,
      devTools: isDev,
      spellcheck: false,
    },
    icon: getAppIcon(),
  });

  // ─── CSP Headers ───
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP_POLICY],
      },
    });
  });

  // ─── Load content ───
  if (isDev) {
    // In dev, load from the Next.js dev server
    mainWindow.loadURL('http://localhost:3000').catch((err) => {
      console.error('[VAS] Failed to load dev server:', err);
      console.log('[VAS] Make sure the Next.js dev server is running on port 3000');
    });
  } else {
    // In production, load the packaged Next.js static export
    const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[VAS] Failed to load production build:', err);
    });
  }

  // ─── Show when ready ───
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // ─── Open external links in default browser ───
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      import('electron').then(({ shell }) => shell.openExternal(url));
    }
    return { action: 'deny' };
  });

  // ─── Prevent navigation away from the app ───
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Allow navigation to localhost (dev server) and file:// (production)
    if (parsedUrl.protocol !== 'file:' && parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') {
      event.preventDefault();
    }
  });

  return mainWindow;
}

/**
 * Returns the appropriate app icon path for the current platform.
 */
function getAppIcon(): string | undefined {
  if (process.platform === 'win32') {
    return path.join(__dirname, '..', '..', 'build', 'icon.ico');
  }
  if (process.platform === 'linux') {
    return path.join(__dirname, '..', '..', 'build', 'icon.png');
  }
  // macOS uses icns set in electron-builder config
  return undefined;
}
