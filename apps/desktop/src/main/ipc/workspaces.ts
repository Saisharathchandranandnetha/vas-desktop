import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@vas/shared';
import { getDatabase, workspaces, settings } from '@vas/database';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

export function registerWorkspacesHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.WORKSPACES_LIST, async () => {
    try {
      const db = getDatabase();
      const allWorkspaces = db.select().from(workspaces).all();
      return { success: true, data: allWorkspaces };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACES_CREATE, async (_event, data: any) => {
    try {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const newWorkspace = {
        id,
        name: data.name || 'New Workspace',
        displayName: data.displayName || data.name || 'New Workspace',
        path: data.path || null,
        description: data.description || null,
      };
      
      db.insert(workspaces).values(newWorkspace).run();
      
      const saved = db.select().from(workspaces).where(eq(workspaces.id, id)).get();
      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACES_ACTIVATE, async (_event, id: string) => {
    try {
      const db = getDatabase();
      const ws = db.select().from(workspaces).where(eq(workspaces.id, id)).get();
      if (!ws) throw new Error(`Workspace ${id} not found`);

      // Update the active workspace in settings
      const settingKey = 'active_workspace_id';
      const existing = db.select().from(settings).where(eq(settings.key, settingKey)).get();
      if (existing) {
        db.update(settings).set({ value: JSON.stringify(id), updatedAt: new Date() }).where(eq(settings.key, settingKey)).run();
      } else {
        db.insert(settings).values({ key: settingKey, value: JSON.stringify(id) }).run();
      }

      return { success: true, data: { ...ws, active: true } };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
