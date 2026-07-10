import { Effect } from 'effect';
import { ILLMProviderAdapter, LLMMessage, ToolDefinition } from '../types.js';
import { PermissionGatingEngine, SecurityPolicy } from '../permissions/index.js';
import { ContextCompressor } from './context.js';
import { logger } from '../logger/index.js';

export interface LoopContext {
  provider: ILLMProviderAdapter;
  permissions: PermissionGatingEngine;
  compressor: ContextCompressor;
  tools: ToolDefinition[];
  budget: {
    maxIterations: number;
    maxTokens: number;
  };
}

export class AgentExecutionError extends Error {
  readonly _tag = "AgentExecutionError";
  constructor(public override message: string) {
    super(message);
  }
}

// Effect wrapper for the provider stream
const executeTurn = (messages: LLMMessage[], ctx: LoopContext) => 
  Effect.tryPromise({
    try: () => ctx.provider.streamText(messages, ctx.tools),
    catch: (unknownError) => new AgentExecutionError(`Provider failed: ${String(unknownError)}`)
  });

// Effect wrapper for context compression
const manageContext = (messages: LLMMessage[], currentUsage: number, ctx: LoopContext) =>
  Effect.tryPromise({
    try: () => ctx.compressor.manageContext(messages, currentUsage),
    catch: (unknownError) => new AgentExecutionError(`Compression failed: ${String(unknownError)}`)
  });

export const runAgentLoop = (
  initialMessages: LLMMessage[],
  ctx: LoopContext
) => {
  return Effect.gen(function* (_) {
    let messages = [...initialMessages];
    let iteration = 0;
    let totalTokens = 0;

    logger.info("Starting AGI Agent Loop");

    while (iteration < ctx.budget.maxIterations) {
      iteration++;
      logger.debug({ iteration, totalTokens }, "Loop iteration starting");

      // 1. Context Compression Check
      messages = yield* _(manageContext(messages, totalTokens, ctx));

      // 2. LLM Turn
      const response = yield* _(executeTurn(messages, ctx));
      
      let fullResponse = "";
      
      // We consume the AsyncIterable stream inside a Promise wrapper
      yield* _(Effect.tryPromise({
        try: async () => {
          for await (const chunk of response.textStream) {
            fullResponse += chunk;
            // Write to stdout directly to avoid Ink "Scroll Storm"
            process.stdout.write(chunk);
          }
        },
        catch: (e) => new AgentExecutionError(`Stream read failed: ${String(e)}`)
      }));

      // 3. Update Token Usage
      const usage = yield* _(Effect.promise(() => response.usage));
      totalTokens += (usage.completionTokens + usage.promptTokens);

      messages.push({
        role: "assistant",
        content: fullResponse
      });

      // 4. Tool Execution & Permissions Check (Stubbed for now)
      // If the LLM returned a JSON tool call (e.g. parsed from fullResponse),
      // we would use ctx.permissions.evaluateCommand() here.
      // For now, if there is no tool call, we break the loop (the agent is done).
      
      const hasToolCall = fullResponse.includes('{"tool":'); // naive check for prototype
      if (!hasToolCall) {
        logger.info("Agent concluded task.");
        break;
      }

      // If it has a tool call, we would execute it and append the result to messages
      // ...
    }

    if (iteration >= ctx.budget.maxIterations) {
      logger.warn("Agent reached max iterations budget.");
    }

    return messages;
  });
};
