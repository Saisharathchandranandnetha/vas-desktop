import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@vas/shared';
import { getDatabase, mcpServers, mcpTools } from '@vas/database';
import { eq } from 'drizzle-orm';
import { spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';

// ─── MCP Manager Singleton ───
class McpManager {
  private static instance: McpManager;
  private processes = new Map<string, ChildProcess>();

  private constructor() {}

  static getInstance(): McpManager {
    if (!McpManager.instance) {
      McpManager.instance = new McpManager();
    }
    return McpManager.instance;
  }

  async start(id: string): Promise<void> {
    const db = getDatabase();
    const serverRecords = db.select().from(mcpServers).where(eq(mcpServers.id, id)).all();
    if (!serverRecords.length) throw new Error(`MCP Server ${id} not found`);

    const server = serverRecords[0];
    if (this.processes.has(id) || server.isRunning) {
      return; // already running
    }

    let args: string[] = [];
    try {
      if (server.argsJson) {
        args = JSON.parse(server.argsJson);
      }
    } catch {}

    const proc = spawn(server.command, args, { stdio: 'ignore' });
    this.processes.set(id, proc);

    const pid = proc.pid ?? Math.floor(Math.random() * 10000);

    // Update DB
    db.update(mcpServers)
      .set({ isRunning: true, pid })
      .where(eq(mcpServers.id, id))
      .run();

    proc.on('exit', () => {
      this.processes.delete(id);
      try {
        db.update(mcpServers)
          .set({ isRunning: false, pid: null })
          .where(eq(mcpServers.id, id))
          .run();
      } catch (err) {
        console.error(`[VAS:McpManager] failed to update status on exit for ${id}:`, err);
      }
    });
  }

  async stop(id: string): Promise<void> {
    const proc = this.processes.get(id);
    if (proc) {
      proc.kill();
      this.processes.delete(id);
    }

    const db = getDatabase();
    db.update(mcpServers)
      .set({ isRunning: false, pid: null })
      .where(eq(mcpServers.id, id))
      .run();
  }
}

export function registerMcpHandlers(): void {
  const manager = McpManager.getInstance();

  ipcMain.handle(IPC_CHANNELS.MCP_LIST, async () => {
    try {
      const db = getDatabase();
      const allServers = db.select().from(mcpServers).all();
      return { success: true, data: allServers };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_INSTALL, async (_event, config: any) => {
    try {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const newServer = {
        id,
        name: config.name || 'unnamed-mcp',
        displayName: config.displayName || config.name || 'Unnamed MCP',
        command: config.command,
        argsJson: JSON.stringify(config.args || []),
        envJson: JSON.stringify(config.env || {}),
        transport: config.transport || 'stdio',
        isEnabled: true,
        isRunning: false,
      };
      
      db.insert(mcpServers).values(newServer as any).run();
      
      const saved = db.select().from(mcpServers).where(eq(mcpServers.id, id)).get();
      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_START, async (_event, id: string) => {
    try {
      await manager.start(id);
      const db = getDatabase();
      const updated = db.select().from(mcpServers).where(eq(mcpServers.id, id)).get();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_STOP, async (_event, id: string) => {
    try {
      await manager.stop(id);
      const db = getDatabase();
      const updated = db.select().from(mcpServers).where(eq(mcpServers.id, id)).get();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_INSPECT_TOOLS, async (_event, id: string) => {
    try {
      const db = getDatabase();
      const tools = db.select().from(mcpTools).where(eq(mcpTools.serverId, id)).all();
      return { success: true, data: tools };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
