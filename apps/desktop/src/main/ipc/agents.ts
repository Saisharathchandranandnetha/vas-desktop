import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@vas/shared';
import { getDatabase, agents } from '@vas/database';
import { eq } from 'drizzle-orm';
import { spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';

// ─── Agent Manager Singleton ───
class AgentManager {
  private static instance: AgentManager;
  private processes = new Map<string, ChildProcess>();

  private constructor() {}

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  async start(id: string): Promise<void> {
    const db = getDatabase();
    const agentRecords = db.select().from(agents).where(eq(agents.id, id)).all();
    if (!agentRecords.length) throw new Error(`Agent ${id} not found`);

    const agent = agentRecords[0];
    if (this.processes.has(id) || agent.isRunning) {
      return; // already running
    }

    // Mock spawning or spawn actual if executablePath is present.
    // For this desktop app implementation, we will spawn a dummy process or the executable if available.
    let proc: ChildProcess;
    if (agent.executablePath) {
      proc = spawn(agent.executablePath, [], { stdio: 'ignore' });
    } else {
      // Dummy process
      proc = spawn(process.platform === 'win32' ? 'cmd.exe' : 'sh', [process.platform === 'win32' ? '/c' : '-c', 'timeout 3600 || sleep 3600'], { stdio: 'ignore' });
    }

    this.processes.set(id, proc);

    const pid = proc.pid ?? Math.floor(Math.random() * 10000);

    // Update DB
    db.update(agents)
      .set({ isRunning: true, pid, lastStarted: new Date() })
      .where(eq(agents.id, id))
      .run();

    proc.on('exit', () => {
      this.processes.delete(id);
      try {
        db.update(agents)
          .set({ isRunning: false, pid: null })
          .where(eq(agents.id, id))
          .run();
      } catch (err) {
        console.error(`[VAS:AgentManager] failed to update status on exit for ${id}:`, err);
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
    db.update(agents)
      .set({ isRunning: false, pid: null })
      .where(eq(agents.id, id))
      .run();
  }
}

export function registerAgentsHandlers(): void {
  const manager = AgentManager.getInstance();

  ipcMain.handle(IPC_CHANNELS.AGENTS_LIST, async () => {
    try {
      const db = getDatabase();
      const allAgents = db.select().from(agents).all();
      return { success: true, data: allAgents };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AGENTS_DETECT, async () => {
    try {
      // Simulate detection
      const db = getDatabase();
      // Look for e.g. claude-code or a dummy agent
      const detected = [
        {
          id: crypto.randomUUID(),
          name: 'claude-code-detected',
          displayName: 'Claude Code',
          type: 'claude_code' as const,
          executablePath: 'claude',
          isInstalled: true,
          isRunning: false,
        }
      ];
      
      for (const d of detected) {
        db.insert(agents).values(d).onConflictDoNothing().run();
      }
      
      const allAgents = db.select().from(agents).all();
      return { success: true, data: allAgents };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AGENTS_START, async (_event, id: string, _options?: Record<string, unknown>) => {
    try {
      await manager.start(id);
      const db = getDatabase();
      const updated = db.select().from(agents).where(eq(agents.id, id)).get();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AGENTS_STOP, async (_event, id: string) => {
    try {
      await manager.stop(id);
      const db = getDatabase();
      const updated = db.select().from(agents).where(eq(agents.id, id)).get();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AGENTS_RESTART, async (_event, id: string) => {
    try {
      await manager.stop(id);
      await manager.start(id);
      const db = getDatabase();
      const updated = db.select().from(agents).where(eq(agents.id, id)).get();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
