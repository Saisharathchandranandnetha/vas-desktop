import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@vas/shared';
import { getDatabase, routingRules } from '@vas/database';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

export function registerRoutingHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.ROUTING_LIST, async () => {
    try {
      const db = getDatabase();
      const allRules = db.select().from(routingRules).all();
      return { success: true, data: allRules };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ROUTING_CREATE, async (_event, rule: any) => {
    try {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const newRule = {
        id,
        workspaceId: rule.workspaceId,
        name: rule.name || 'New Routing Rule',
        priority: rule.priority || 0,
        matchModelPattern: rule.matchModelPattern,
        matchAgentId: rule.matchAgentId,
        matchTag: rule.matchTag,
        primaryModelId: rule.primaryModelId,
        fallbackModelId: rule.fallbackModelId,
        isEnabled: rule.isEnabled ?? true,
      };
      
      db.insert(routingRules).values(newRule).run();
      
      const saved = db.select().from(routingRules).where(eq(routingRules.id, id)).get();
      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ROUTING_UPDATE, async (_event, id: string, data: any) => {
    try {
      const db = getDatabase();
      db.update(routingRules).set(data).where(eq(routingRules.id, id)).run();
      const updated = db.select().from(routingRules).where(eq(routingRules.id, id)).get();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ROUTING_DELETE, async (_event, id: string) => {
    try {
      const db = getDatabase();
      db.delete(routingRules).where(eq(routingRules.id, id)).run();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
