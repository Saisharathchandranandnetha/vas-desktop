import { 
  ILLMProviderAdapter, 
  LLMMessage, 
  ToolDefinition, 
  StreamTextResponse 
} from '../types.js';

// A mock provider adapter to demonstrate the AsyncIterable interface
// This will eventually wrap Anthropic, OpenAI, or Ollama SDKs
export class MockLLMProvider implements ILLMProviderAdapter {
  async streamText(messages: LLMMessage[], tools: ToolDefinition[]): Promise<StreamTextResponse> {
    
    // Simulate streaming chunks
    const textStream = (async function* () {
      const chunks = [
        "I ", "have ", "analyzed ", "your ", "request.\n",
        "Executing ", "the ", "necessary ", "tools ", "now..."
      ];
      for (const chunk of chunks) {
        // simulate network latency
        await new Promise(r => setTimeout(r, 50));
        yield chunk;
      }
    })();

    // Simulate usage stats resolving after stream finishes
    const usage = new Promise<{promptTokens: number, completionTokens: number}>((resolve) => {
      setTimeout(() => {
        resolve({ promptTokens: 120, completionTokens: 45 });
      }, 600);
    });

    return {
      textStream,
      usage
    };
  }
}
