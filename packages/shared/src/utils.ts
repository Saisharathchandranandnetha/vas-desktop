// ─── Shared Utilities ───
import { randomUUID } from 'crypto';

/** Generate a unique ID */
export function generateId(): string {
  return randomUUID();
}

/** Format bytes into human-readable string */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/** Format milliseconds into human-readable duration */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

/** Format a cost in USD */
export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

/** Estimate token count from text (rough: 1 token ≈ 4 chars) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Calculate cost from token counts and model pricing */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  inputCostPer1k: number,
  outputCostPer1k: number,
): number {
  return (promptTokens / 1000) * inputCostPer1k + (completionTokens / 1000) * outputCostPer1k;
}

/** Truncate string with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/** Safe JSON parse with fallback */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/** Delay utility */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry with exponential backoff */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await delay(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}
