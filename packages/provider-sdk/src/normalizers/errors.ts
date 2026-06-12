// ─── Error Normalization ───
// Converts provider-specific errors into a unified ProviderError format.

import { ProviderError } from '../types.js';

/** HTTP status codes that are generally retryable */
const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests (rate limited)
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  522, // Connection Timed Out (Cloudflare)
  524, // A Timeout Occurred (Cloudflare)
]);

/**
 * Determine if a given HTTP status code is retryable.
 */
export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

/**
 * Extract a retry-after value from a Response (in milliseconds).
 * Handles both seconds-based and date-based Retry-After headers.
 */
export function extractRetryAfterMs(response: Response): number | undefined {
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) return undefined;

  // Try parsing as seconds
  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds)) {
    return Math.max(0, Math.ceil(seconds * 1000));
  }

  // Try parsing as HTTP date
  const date = Date.parse(retryAfter);
  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return undefined;
}

/**
 * Extract an error message from a provider's error response body.
 * Different providers have different error shapes.
 */
function extractErrorMessage(body: unknown): string {
  if (typeof body === 'string') return body;
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;

    // OpenAI format: { error: { message: "..." } }
    if (obj.error && typeof obj.error === 'object') {
      const err = obj.error as Record<string, unknown>;
      if (typeof err.message === 'string') return err.message;
    }

    // Anthropic format: { error: { type: "...", message: "..." } }
    // (same structure, already handled above)

    // Direct message field
    if (typeof obj.message === 'string') return obj.message;

    // Fallback: stringify
    try {
      return JSON.stringify(body);
    } catch {
      return 'Unknown error';
    }
  }
  return 'Unknown error';
}

/**
 * Create a ProviderError from an HTTP response.
 * Attempts to parse the response body for error details.
 */
export async function normalizeHttpError(
  response: Response,
  provider: string,
): Promise<ProviderError> {
  let rawBody: unknown;
  try {
    rawBody = await response.json();
  } catch {
    try {
      rawBody = await response.text();
    } catch {
      rawBody = undefined;
    }
  }

  const message = extractErrorMessage(rawBody);
  const status = response.status;
  const retryable = isRetryableStatus(status);
  const retryAfterMs = retryable ? extractRetryAfterMs(response) : undefined;

  return new ProviderError(
    `[${provider}] ${status} ${response.statusText}: ${message}`,
    {
      status,
      provider,
      retryable,
      retryAfterMs,
      rawBody,
    },
  );
}

/**
 * Normalize any error (network, parse, etc.) into a ProviderError.
 */
export function normalizeProviderError(error: unknown, provider: string): ProviderError {
  // Already a ProviderError — return as-is
  if (error instanceof ProviderError) return error;

  // TypeError from fetch = network error
  if (error instanceof TypeError) {
    return new ProviderError(
      `[${provider}] Network error: ${error.message}`,
      {
        status: 0,
        provider,
        retryable: true,
        cause: error,
      },
    );
  }

  // AbortError = request was aborted/timed out
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ProviderError(
      `[${provider}] Request timed out`,
      {
        status: 408,
        provider,
        retryable: true,
        cause: error,
      },
    );
  }

  // SyntaxError = malformed JSON response
  if (error instanceof SyntaxError) {
    return new ProviderError(
      `[${provider}] Malformed response: ${error.message}`,
      {
        status: 0,
        provider,
        retryable: false,
        cause: error,
      },
    );
  }

  // Generic Error
  if (error instanceof Error) {
    return new ProviderError(
      `[${provider}] ${error.message}`,
      {
        status: 0,
        provider,
        retryable: false,
        cause: error,
      },
    );
  }

  // Unknown type
  return new ProviderError(
    `[${provider}] ${String(error)}`,
    {
      status: 0,
      provider,
      retryable: false,
    },
  );
}
