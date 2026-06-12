// ─── @vas/provider-sdk ───
// Universal AI provider abstraction layer for VAS Desktop.
// Provides a unified interface to interact with OpenAI, Anthropic, and
// OpenAI-compatible providers (Groq, DeepSeek, Mistral, Ollama, etc.)

// ─── Core Types ───
export type {
  ProviderConfig,
  ProviderAdapter,
  ModelInfo,
  ModelCapabilities,
  HealthCheckResult,
  // Anthropic types (for advanced use)
  AnthropicRequest,
  AnthropicResponse,
  AnthropicMessage,
  AnthropicContentBlock,
  AnthropicTextBlock,
  AnthropicImageBlock,
  AnthropicToolUseBlock,
  AnthropicToolResultBlock,
  AnthropicTool,
  AnthropicToolChoice,
  AnthropicSystemBlock,
  AnthropicStreamEvent,
  AnthropicDelta,
  // Gemini types (for advanced use)
  GeminiContent,
  GeminiPart,
  GeminiFunctionDeclaration,
} from './types.js';

export { ProviderError } from './types.js';

// ─── Registry ───
export {
  ProviderRegistry,
  createRegistry,
  type ProviderHealthEntry,
  type AdapterFactory,
} from './registry.js';

// ─── Adapters ───
export { OpenAIAdapter } from './adapters/openai.js';
export { AnthropicAdapter } from './adapters/anthropic.js';
export { OpenAICompatAdapter } from './adapters/openai-compat.js';

// ─── Normalizers ───
export {
  extractSystemMessage,
  convertToAnthropicMessages,
  convertToGeminiContents,
  type ExtractedSystem,
} from './normalizers/messages.js';

export {
  convertToolsToAnthropic,
  convertToolsToGemini,
  convertAnthropicToolCalls,
  convertToolChoiceToAnthropic,
} from './normalizers/tools.js';

export {
  parseSSEStream,
  parseAnthropicStream,
} from './normalizers/streaming.js';

export {
  normalizeProviderError,
  normalizeHttpError,
  isRetryableStatus,
  extractRetryAfterMs,
} from './normalizers/errors.js';

// ─── Utilities ───
export {
  getModelPricing,
  estimateCost,
  formatCostEstimate,
  type ModelPricing,
} from './utils/cost-calculator.js';
