// ─── Cost Calculator ───
// Calculate estimated costs for API calls using MODEL_COSTS from @vas/shared.

import { MODEL_COSTS, calculateCost } from '@vas/shared';

/**
 * Lookup result for model pricing.
 */
export interface ModelPricing {
  /** Cost per 1K input tokens (USD) */
  inputCostPer1k: number;
  /** Cost per 1K output tokens (USD) */
  outputCostPer1k: number;
}

/**
 * Lookup model pricing from the known costs table.
 * Falls back to fuzzy matching for versioned model identifiers.
 *
 * @param modelId - The model identifier (e.g. 'gpt-4o', 'claude-sonnet-4-20250514')
 * @returns Pricing info or undefined if model is not in the cost table
 */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  // Direct lookup
  const directMatch = MODEL_COSTS[modelId];
  if (directMatch) {
    return {
      inputCostPer1k: directMatch.input,
      outputCostPer1k: directMatch.output,
    };
  }

  // Fuzzy match: strip date suffixes, version numbers, preview tags
  // e.g. 'gpt-4o-2024-05-13' → 'gpt-4o'
  // e.g. 'claude-sonnet-4-20250514-latest' → 'claude-sonnet-4-20250514'
  const normalized = modelId
    .replace(/-\d{4}-\d{2}-\d{2}$/, '') // Remove trailing YYYY-MM-DD
    .replace(/-latest$/, '')            // Remove -latest suffix
    .replace(/-preview$/, '');          // Remove -preview suffix

  const fuzzyMatch = MODEL_COSTS[normalized];
  if (fuzzyMatch) {
    return {
      inputCostPer1k: fuzzyMatch.input,
      outputCostPer1k: fuzzyMatch.output,
    };
  }

  // Try prefix matching — find the longest key that is a prefix of the model ID
  let bestMatch: { key: string; pricing: { input: number; output: number } } | undefined;
  for (const [key, pricing] of Object.entries(MODEL_COSTS)) {
    if (modelId.startsWith(key)) {
      if (!bestMatch || key.length > bestMatch.key.length) {
        bestMatch = { key, pricing };
      }
    }
  }

  if (bestMatch) {
    return {
      inputCostPer1k: bestMatch.pricing.input,
      outputCostPer1k: bestMatch.pricing.output,
    };
  }

  return undefined;
}

/**
 * Calculate the estimated cost of an API call.
 *
 * @param modelId - The model identifier
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output/completion tokens
 * @returns Estimated cost in USD, or 0 if model pricing is unknown
 */
export function estimateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = getModelPricing(modelId);
  if (!pricing) return 0;

  return calculateCost(
    promptTokens,
    completionTokens,
    pricing.inputCostPer1k,
    pricing.outputCostPer1k,
  );
}

/**
 * Format a cost estimate as a human-readable string.
 */
export function formatCostEstimate(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
): string {
  const cost = estimateCost(modelId, promptTokens, completionTokens);
  if (cost === 0) return 'Unknown cost';

  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}
