import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { logger } from '../logger/index.js';

export const PermissionLevel = z.enum(["ALLOW", "DENY", "SANDBOX", "PROMPT"]);
export type PermissionLevel = z.infer<typeof PermissionLevel>;

export const SecurityRisk = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type SecurityRisk = z.infer<typeof SecurityRisk>;

export interface ExecutionCommand {
  command: string;
  args: string[];
  workingDirectory: string;
}

export interface SecurityPolicy {
  blockedCommands: RegExp[];
  sandboxRequiredCommands: RegExp[];
  writablePaths: string[];
  networkAllowed: boolean;
}

export interface GatingDecision {
  action: PermissionLevel;
  risk: SecurityRisk;
  reason: string;
}

export class PermissionGatingEngine {
  private policy: SecurityPolicy;

  constructor(policy: SecurityPolicy) {
    this.policy = policy;
  }

  public evaluateCommand(cmd: ExecutionCommand): GatingDecision {
    const rawInput = `${cmd.command} ${cmd.args.join(" ")}`;
    
    logger.debug({ cmd: rawInput, dir: cmd.workingDirectory }, "Evaluating command permissions");

    // 1. Static Command Signature Evaluation
    for (const pattern of this.policy.blockedCommands) {
      if (pattern.test(rawInput)) {
        logger.warn({ cmd: rawInput, pattern: pattern.toString() }, "Command blocked by security policy");
        return {
          action: "DENY",
          risk: "CRITICAL",
          reason: `Instruction violates safety signature policy: ${pattern.toString()}`
        };
      }
    }

    // 2. Sandbox Requirements Mapping
    for (const pattern of this.policy.sandboxRequiredCommands) {
      if (pattern.test(rawInput)) {
        logger.info({ cmd: rawInput }, "Command flagged for sandboxed execution");
        return {
          action: "SANDBOX",
          risk: "HIGH",
          reason: "Instruction requires process isolation boundary."
        };
      }
    }

    // 3. Path Traversal Validation
    try {
      // Use realpathSync to resolve symlinks and ../ sequences
      const resolvedPath = fs.realpathSync(cmd.workingDirectory);
      const isPathAllowed = this.policy.writablePaths.some((allowedPath) => {
        const resolvedAllowed = fs.realpathSync(allowedPath);
        return resolvedPath.startsWith(resolvedAllowed);
      });

      if (!isPathAllowed) {
        logger.warn({ resolvedPath, allowedPaths: this.policy.writablePaths }, "Path traversal prevented");
        return {
          action: "PROMPT",
          risk: "MEDIUM",
          reason: "Execution attempt outside approved workspace directory."
        };
      }
    } catch (e) {
      logger.error({ err: e }, "Failed to resolve working directory for permission check");
      return {
        action: "PROMPT",
        risk: "MEDIUM",
        reason: "Could not safely resolve the execution directory."
      };
    }

    return {
      action: "ALLOW",
      risk: "LOW",
      reason: "Instruction matches standard execution safety baseline."
    };
  }
}

// Sandbox Strategy Interfaces
export interface ISandboxStrategy {
  buildSandboxWrapper(cmd: ExecutionCommand): ExecutionCommand;
}

export class LinuxNsjailStrategy implements ISandboxStrategy {
  public buildSandboxWrapper(cmd: ExecutionCommand): ExecutionCommand {
    return {
      command: "nsjail",
      args: [
        "-B", "/",                 // Read-only root mapping
        "--writable_dir", cmd.workingDirectory, // Isolated write access
        "--cwd", cmd.workingDirectory,
        "--time_limit", "30",      // Timeout limit (seconds)
        "--max_cpus", "2",         // Core containment
        "--",
        cmd.command,
        ...cmd.args
      ],
      workingDirectory: cmd.workingDirectory
    };
  }
}

export class MacOSSeatbeltStrategy implements ISandboxStrategy {
  constructor(private profilePath: string) {}

  public buildSandboxWrapper(cmd: ExecutionCommand): ExecutionCommand {
    return {
      command: "sandbox-exec",
      args: ["-f", this.profilePath, cmd.command, ...cmd.args],
      workingDirectory: cmd.workingDirectory
    };
  }
}
