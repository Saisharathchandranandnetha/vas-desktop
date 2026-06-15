import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface McpClientConfig {
  id: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export class McpClientWrapper {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  public readonly config: McpClientConfig;

  constructor(config: McpClientConfig) {
    this.config = config;
    this.client = new Client(
      {
        name: `vas-mcp-client-${config.id}`,
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  async connect(): Promise<void> {
    if (this.transport) {
      throw new Error(`MCP Client ${this.config.id} is already connected`);
    }

    const env = { ...process.env, ...this.config.env } as Record<string, string>;
    
    this.transport = new StdioClientTransport({
      command: this.config.command,
      args: this.config.args || [],
      env,
    });

    await this.client.connect(this.transport);
  }

  async disconnect(): Promise<void> {
    if (!this.transport) {
      return;
    }

    await this.client.close();
    await this.transport.close();
    this.transport = null;
  }

  async listTools() {
    return this.client.listTools();
  }
  
  async callTool(name: string, args: Record<string, any>) {
    return this.client.callTool({
      name,
      arguments: args,
    });
  }

  async listResources() {
    return this.client.listResources();
  }

  async readResource(uri: string) {
    return this.client.readResource({ uri });
  }

  async listPrompts() {
    return this.client.listPrompts();
  }

  async getPrompt(name: string, args?: Record<string, string>) {
    return this.client.getPrompt({ name, arguments: args });
  }

  getClient(): Client {
    return this.client;
  }
}
