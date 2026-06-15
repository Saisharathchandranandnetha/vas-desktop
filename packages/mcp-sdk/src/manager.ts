import { McpClientWrapper, McpClientConfig } from './client.js';

export interface McpServerRecord {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  enabled: boolean;
}

export class McpManager {
  private clients: Map<string, McpClientWrapper> = new Map();

  constructor() {}

  /**
   * Initializes multiple MCP clients based on database configuration or records.
   */
  async initializeServers(servers: McpServerRecord[]): Promise<void> {
    for (const server of servers) {
      if (server.enabled) {
        await this.startClient(server);
      }
    }
  }

  async startClient(config: McpServerRecord): Promise<McpClientWrapper> {
    if (this.clients.has(config.id)) {
      throw new Error(`Client ${config.id} is already running`);
    }

    const clientConfig: McpClientConfig = {
      id: config.id,
      command: config.command,
      args: config.args,
      env: config.env,
    };

    const wrapper = new McpClientWrapper(clientConfig);
    
    try {
      await wrapper.connect();
      this.clients.set(config.id, wrapper);
      return wrapper;
    } catch (error) {
      console.error(`Failed to connect MCP client ${config.id}:`, error);
      throw error;
    }
  }

  async stopClient(id: string): Promise<void> {
    const wrapper = this.clients.get(id);
    if (wrapper) {
      await wrapper.disconnect();
      this.clients.delete(id);
    }
  }

  async restartClient(id: string, config?: McpServerRecord): Promise<void> {
    const wrapper = this.clients.get(id);
    let serverConfig: McpServerRecord | undefined = config;
    
    if (wrapper && !config) {
      // Recreate config from existing wrapper
      serverConfig = {
        id: wrapper.config.id,
        name: `Server ${wrapper.config.id}`, // Fallback name
        command: wrapper.config.command,
        args: wrapper.config.args || [],
        env: wrapper.config.env || {},
        enabled: true,
      };
    }

    await this.stopClient(id);

    if (serverConfig) {
      await this.startClient(serverConfig);
    } else {
      throw new Error(`Cannot restart client ${id}: no configuration provided or found`);
    }
  }

  getClient(id: string): McpClientWrapper | undefined {
    return this.clients.get(id);
  }

  getAllClients(): McpClientWrapper[] {
    return Array.from(this.clients.values());
  }

  async stopAll(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map(id => this.stopClient(id));
    await Promise.all(promises);
  }
}
