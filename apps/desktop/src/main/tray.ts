// ─── VAS Desktop — System Tray ───
import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;

/**
 * Creates the system tray icon with context menu.
 */
export function createTray(mainWindow: BrowserWindow): Tray {
  const iconPath = getTrayIconPath();
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('VAS Desktop — Universal AI Runtime');

  const contextMenu = buildTrayMenu(mainWindow);
  tray.setContextMenu(contextMenu);

  // Click to show/hide window
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return tray;
}

/**
 * Rebuilds the tray context menu. Call this when gateway status changes.
 */
export function updateTrayMenu(mainWindow: BrowserWindow): void {
  if (!tray) return;
  const contextMenu = buildTrayMenu(mainWindow);
  tray.setContextMenu(contextMenu);
}

function buildTrayMenu(mainWindow: BrowserWindow): Menu {
  return Menu.buildFromTemplate([
    {
      label: mainWindow.isVisible() ? 'Hide Window' : 'Show Window',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: '● Gateway Running',
      enabled: false,
      icon: undefined,
    },
    { type: 'separator' },
    {
      label: 'Quick Launch Agents',
      submenu: [
        {
          label: 'Claude Code',
          click: () => {
            mainWindow.show();
            mainWindow.webContents.send('navigate', '/agents');
          },
        },
        {
          label: 'Codex CLI',
          click: () => {
            mainWindow.show();
            mainWindow.webContents.send('navigate', '/agents');
          },
        },
        {
          label: 'Gemini CLI',
          click: () => {
            mainWindow.show();
            mainWindow.webContents.send('navigate', '/agents');
          },
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate', '/settings');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit VAS Desktop',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      click: () => {
        app.quit();
      },
    },
  ]);
}

function getTrayIconPath(): string {
  const iconName = process.platform === 'win32' ? 'tray-icon.ico' : 'tray-iconTemplate.png';
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'build', iconName);
  }
  return path.join(__dirname, '..', '..', 'build', iconName);
}
