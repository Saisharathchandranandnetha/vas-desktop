// ─── Application Constants ───

export const APP_NAME = 'VAS Desktop';
export const APP_ID = 'com.vas.desktop';
export const APP_PROTOCOL = 'vas';

export const GATEWAY_DEFAULT_PORT = 16324;
export const GATEWAY_HOST = '127.0.0.1';

// Database
export const DB_FILENAME = 'vas.db';

// Provider defaults
export const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; name: string }> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
  },
  mistral: {
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
  },
  lmstudio: {
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
  },
  vllm: {
    name: 'vLLM',
    baseUrl: 'http://localhost:8000/v1',
  },
};

// Well-known models with cost data (per 1K tokens, USD)
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
  'claude-opus-4-20250514': { input: 0.015, output: 0.075 },
  'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 },
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'gemini-2.5-pro-preview': { input: 0.00125, output: 0.01 },
  'deepseek-chat': { input: 0.00014, output: 0.00028 },
  'deepseek-reasoner': { input: 0.00055, output: 0.0022 },
};

// Timing
export const HEALTH_CHECK_INTERVAL_MS = 60_000;
export const REQUEST_LOG_RETENTION_DAYS = 30;
export const MAX_LOG_BUFFER_SIZE = 1000;
