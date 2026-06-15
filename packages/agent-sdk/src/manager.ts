import { spawn, ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';

export interface AgentConfig {
  id: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  autoRestart?: boolean;
}

export interface AgentStatus {
  id: string;
  pid?: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
  exitCode?: number | null;
}

export declare interface AgentManager {
  on(event: 'stdout', listener: (id: string, data: string) => void): this;
  on(event: 'stderr', listener: (id: string, data: string) => void): this;
  on(event: 'status', listener: (status: AgentStatus) => void): this;
  on(event: 'error', listener: (id: string, error: Error) => void): this;
}

export class AgentManager extends EventEmitter {
  private processes: Map<string, ChildProcess> = new Map();
  private configs: Map<string, AgentConfig> = new Map();
  private statuses: Map<string, AgentStatus> = new Map();

  constructor() {
    super();
  }

  startAgent(config: AgentConfig): void {
    if (this.processes.has(config.id)) {
      throw new Error(`Agent with ID ${config.id} is already running`);
    }

    this.configs.set(config.id, config);
    this.updateStatus(config.id, { id: config.id, status: 'starting' });

    this.spawnProcess(config);
  }

  private spawnProcess(config: AgentConfig): void {
    const env = { ...process.env, ...config.env };
    const args = config.args || [];
    
    const child = spawn(config.command, args, {
      cwd: config.cwd || process.cwd(),
      env,
      shell: true // Useful on Windows to resolve commands in PATH
    });

    this.processes.set(config.id, child);

    if (child.pid !== undefined) {
      this.updateStatus(config.id, { id: config.id, pid: child.pid, status: 'running' });
    }

    child.stdout?.on('data', (data: Buffer) => {
      this.emit('stdout', config.id, data.toString());
    });

    child.stderr?.on('data', (data: Buffer) => {
      this.emit('stderr', config.id, data.toString());
    });

    child.on('error', (error: Error) => {
      this.emit('error', config.id, error);
      this.updateStatus(config.id, { id: config.id, status: 'error' });
    });

    child.on('close', (code: number | null) => {
      this.processes.delete(config.id);
      this.updateStatus(config.id, { id: config.id, status: 'stopped', exitCode: code });

      if (config.autoRestart && code !== 0) {
        setTimeout(() => {
          if (this.configs.has(config.id)) {
            this.updateStatus(config.id, { id: config.id, status: 'starting' });
            this.spawnProcess(config);
          }
        }, 3000); // Wait 3 seconds before restarting
      }
    });
  }

  stopAgent(id: string): void {
    const child = this.processes.get(id);
    if (child) {
      this.configs.delete(id); // Prevent auto-restart
      child.kill();
    }
  }

  restartAgent(id: string): void {
    const config = this.configs.get(id);
    if (!config) {
      throw new Error(`Agent config for ID ${id} not found`);
    }

    this.stopAgent(id);
    
    // Add config back since stopAgent removes it
    this.configs.set(id, config);
    
    setTimeout(() => {
      this.startAgent(config);
    }, 1000);
  }

  getStatus(id: string): AgentStatus | undefined {
    return this.statuses.get(id);
  }

  getAllStatuses(): AgentStatus[] {
    return Array.from(this.statuses.values());
  }

  private updateStatus(id: string, status: AgentStatus): void {
    this.statuses.set(id, status);
    this.emit('status', status);
  }
}
