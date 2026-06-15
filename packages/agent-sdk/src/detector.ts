import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';

const execAsync = promisify(exec);

export interface DetectedAgent {
  name: string;
  version: string;
  path: string;
}

export class AgentDetector {
  private knownAgents = [
    { name: 'claude', command: 'claude --version' },
    { name: 'codex', command: 'codex --version' },
    { name: 'aider', command: 'aider --version' },
    { name: 'cline', command: 'cline --version' }
  ];

  async detectAll(): Promise<DetectedAgent[]> {
    const detected: DetectedAgent[] = [];
    
    for (const agent of this.knownAgents) {
      const result = await this.detectAgent(agent.name, agent.command);
      if (result) {
        detected.push(result);
      }
    }
    
    return detected;
  }

  private async detectAgent(name: string, versionCommand: string): Promise<DetectedAgent | null> {
    try {
      // Find the path using where on Windows, which on others
      const isWindows = os.platform() === 'win32';
      const whichCommand = isWindows ? `where ${name}` : `which ${name}`;
      
      const { stdout: pathStdout } = await execAsync(whichCommand);
      const executablePath = pathStdout.split('\n')[0]?.trim();
      
      if (!executablePath) {
        return null;
      }

      // Get the version
      let version = 'unknown';
      try {
        const { stdout: versionStdout } = await execAsync(versionCommand);
        version = versionStdout.trim() || 'unknown';
      } catch (err) {
        // Ignored, version stays 'unknown'
      }

      return {
        name,
        version,
        path: executablePath
      };
    } catch (error) {
      return null;
    }
  }
}
