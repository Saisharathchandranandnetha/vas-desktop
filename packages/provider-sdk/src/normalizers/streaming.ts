// ─── SSE Stream Parsing Utilities ───
// Handles Server-Sent Events parsing for both OpenAI and Anthropic streaming formats.

import type { AnthropicStreamEvent } from '../types.js';

/**
 * Generic SSE parser that yields parsed JSON objects from a fetch Response body.
 * Handles the standard SSE format: `data: {json}\n\n`
 * Stops when it encounters `data: [DONE]`.
 */
export async function* parseSSEStream(response: Response): AsyncGenerator<unknown, void, undefined> {
  const body = response.body;
  if (!body) {
    throw new Error('Response body is null — streaming not available');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by double newlines
      const parts = buffer.split('\n\n');
      // Keep the last (possibly incomplete) part in the buffer
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const lines = part.split('\n');
        for (const line of lines) {
          // Skip comments, event labels, and empty lines
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6); // Remove 'data: ' prefix

          // OpenAI sends [DONE] to signal end of stream
          if (data === '[DONE]') return;

          // Skip empty data
          if (!data.trim()) continue;

          try {
            yield JSON.parse(data);
          } catch {
            // Skip malformed JSON lines — they can occur with partial chunks
            continue;
          }
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return;
        if (!data.trim()) continue;
        try {
          yield JSON.parse(data);
        } catch {
          continue;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Anthropic-specific SSE event parser.
 * Anthropic uses `event: <type>\ndata: {json}\n\n` format.
 */
export async function* parseAnthropicStream(
  response: Response,
): AsyncGenerator<AnthropicStreamEvent, void, undefined> {
  const body = response.body;
  if (!body) {
    throw new Error('Response body is null — streaming not available');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on double newlines to get individual SSE messages
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        if (!part.trim()) continue;

        const lines = part.split('\n');
        let eventType: string | undefined;
        let eventData: string | undefined;

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6);
          }
        }

        // Skip if no data payload
        if (!eventData?.trim()) continue;

        // Skip ping events with no meaningful data
        if (eventType === 'ping') {
          yield { type: 'ping' } as AnthropicStreamEvent;
          continue;
        }

        try {
          const parsed = JSON.parse(eventData);
          // Anthropic includes the event type in the data object,
          // but we ensure it's set from the SSE event field too
          if (eventType && !parsed.type) {
            parsed.type = eventType;
          }
          yield parsed as AnthropicStreamEvent;
        } catch {
          // Skip malformed events
          continue;
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      let eventType: string | undefined;
      let eventData: string | undefined;

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6);
        }
      }

      if (eventData?.trim()) {
        try {
          const parsed = JSON.parse(eventData);
          if (eventType && !parsed.type) {
            parsed.type = eventType;
          }
          yield parsed as AnthropicStreamEvent;
        } catch {
          // Ignore malformed final chunk
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
