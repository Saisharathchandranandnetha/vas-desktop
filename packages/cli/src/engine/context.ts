import { ILLMProviderAdapter, LLMMessage } from '../types.js';
import { logger } from '../logger/index.js';

export class ContextCompressor {
  private provider: ILLMProviderAdapter;
  private maxContextTokens: number;
  private bufferThreshold: number;

  constructor(provider: ILLMProviderAdapter, maxContextTokens = 100000, bufferThreshold = 13000) {
    this.provider = provider;
    this.maxContextTokens = maxContextTokens;
    this.bufferThreshold = bufferThreshold;
  }

  public async manageContext(messages: LLMMessage[], currentUsage: number): Promise<LLMMessage[]> {
    if (currentUsage < (this.maxContextTokens - this.bufferThreshold)) {
      return messages;
    }

    logger.info({ currentUsage, maxContextTokens: this.maxContextTokens }, "Token limit approaching, initiating context compression");

    // Isolate system-level instructions
    const systemPrompt = messages.find(m => m.role === "system")?.content || "";
    
    // Generate structured summary of conversation history
    const summaryPrompt: LLMMessage[] = [
      { role: "system", content: "You are an internal system optimizer. Summarize this conversation, preserving key decisions, files edited, and pending tasks." },
      { role: "user", content: JSON.stringify(messages.filter(m => m.role !== "system")) }
    ];

    try {
      const response = await this.provider.streamText(summaryPrompt, []);
      let summaryText = "";
      for await (const chunk of response.textStream) {
        summaryText += chunk;
      }

      logger.debug("Context successfully compressed");

      // Pruning and context assembly
      const prunedMessages: LLMMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "assistant", content: `Context Summary: ${summaryText}` },
        ...messages.slice(-10) // Keep sliding window of latest messages
      ];

      return prunedMessages;
    } catch (e) {
      logger.error({ err: e }, "Context compression failed");
      throw new Error("Failed to compress context to fit within token limits.");
    }
  }
}
