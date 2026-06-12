// ─── VAS Desktop — Application Menu ───
import { Menu, BrowserWindow, app, shell } from 'electron';

const isMac = process.platform === 'darwin';

/**
 * Creates and sets the application menu bar.
 */
export function createApplicationMenu(mainWindow: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    // ─── macOS App Menu ───
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: 'Settings',
                accelerator: 'Cmd+,' as const,
                click: () => {
                  mainWindow.webContents.send('navigate', '/settings');
                },
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          } satisfies Electron.MenuItemConstructorOptions,
        ]
      : []),

    // ─── File Menu ───
    {
      label: 'File',
      submenu: [
        {
          label: 'New Workspace',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('navigate', '/workspaces/new');
          },
        },
        { type: 'separator' },
        ...(!isMac
          ? [
              {
                label: 'Settings',
                accelerator: 'Ctrl+,',
                click: () => {
                  mainWindow.webContents.send('navigate', '/settings');
                },
              },
              { type: 'separator' as const },
            ]
          : []),
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    // ─── Edit Menu ───
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },

    // ─── View Menu ───
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.reload();
          },
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    // ─── Window Menu ───
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },

    // ─── Help Menu ───
    {
      role: 'help',
      submenu: [
        {
          label: 'VAS Documentation',
          click: () => {
            shell.openExternal('https://vas.dev/docs');
          },
        },
        {
          label: 'Report an Issue',
          click: () => {
            shell.openExternal('https://github.com/vas-team/vas-desktop/issues');
          },
        },
        { type: 'separator' },
        {
          label: 'View Logs',
          click: () => {
            mainWindow.webContents.send('navigate', '/settings/logs');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
