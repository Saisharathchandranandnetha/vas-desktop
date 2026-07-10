import { z } from 'zod';

// ==========================================
// Part 1 Boundary: Config & Plugins
// ==========================================

export const ConfigSchema = z.object({
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  pluginsDir: z.string().default('./plugins'),
  workspaceRules: z.array(z.string()).default([]),
});

export type Config = z.infer<typeof ConfigSchema>;

export interface CommandArgs {
  [key: string]: unknown;
}

export interface SystemCommand {
  name: string;
  description: string;
  execute: (args: CommandArgs, config: Config) => Promise<void>;
}

export interface SystemPlugin {
  name: string;
  version: string;
  commands: SystemCommand[];
}

// ==========================================
// Part 2 Boundary: LLM & Orchestration 
// (For the other developer)
// ==========================================

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
}

export interface StreamTextResponse {
  textStream: AsyncIterable<string>;
  usage: Promise<{
    promptTokens: number;
    completionTokens: number;
  }>;
}

export interface ILLMProviderAdapter {
  streamText(messages: LLMMessage[], tools: ToolDefinition[]): Promise<StreamTextResponse>;
}
