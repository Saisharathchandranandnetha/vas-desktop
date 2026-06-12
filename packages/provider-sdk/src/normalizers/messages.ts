// ─── Message Normalization Utilities ───
// Convert between OpenAI canonical message format and provider-native formats.

import type { ChatMessage, ContentBlock } from '@vas/shared';
import type {
  AnthropicMessage,
  AnthropicContentBlock,
  AnthropicToolResultBlock,
  GeminiContent,
  GeminiPart,
} from '../types.js';

// ─── System Message Extraction ───

export interface ExtractedSystem {
  /** Combined system prompt text (all system messages joined) */
  systemPrompt: string | undefined;
  /** Messages array with system messages removed */
  filteredMessages: ChatMessage[];
}

/**
 * Extract system-role messages from a messages array.
 * Anthropic and Gemini require system prompts to be sent separately.
 */
export function extractSystemMessage(messages: ChatMessage[]): ExtractedSystem {
  const systemMessages: string[] = [];
  const filteredMessages: ChatMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      const text = extractTextContent(msg.content);
      if (text) systemMessages.push(text);
    } else {
      filteredMessages.push(msg);
    }
  }

  return {
    systemPrompt: systemMessages.length > 0 ? systemMessages.join('\n\n') : undefined,
    filteredMessages,
  };
}

// ─── Anthropic Message Conversion ───

/**
 * Convert OpenAI-format messages to Anthropic message format.
 * - System messages should already be extracted (use extractSystemMessage first)
 * - Tool results are converted to tool_result content blocks
 * - Multi-modal content blocks are converted
 */
export function convertToAnthropicMessages(messages: ChatMessage[]): AnthropicMessage[] {
  const result: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      // System messages should have been extracted already, skip
      continue;
    }

    if (msg.role === 'tool') {
      // Tool results in Anthropic are sent as user messages with tool_result content blocks
      const toolResult: AnthropicToolResultBlock = {
        type: 'tool_result',
        tool_use_id: msg.tool_call_id ?? '',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      };

      // Check if the last message is already a user message — merge tool results
      const lastMsg = result[result.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        if (typeof lastMsg.content === 'string') {
          lastMsg.content = [
            { type: 'text', text: lastMsg.content },
            toolResult,
          ];
        } else if (Array.isArray(lastMsg.content)) {
          (lastMsg.content as AnthropicContentBlock[]).push(toolResult);
        }
      } else {
        result.push({
          role: 'user',
          content: [toolResult],
        });
      }
      continue;
    }

    if (msg.role === 'assistant') {
      const content = convertAssistantToAnthropicBlocks(msg);
      result.push({ role: 'assistant', content });
      continue;
    }

    // User messages
    if (msg.role === 'user') {
      const content = convertContentToAnthropicBlocks(msg.content);
      result.push({ role: 'user', content });
      continue;
    }
  }

  // Anthropic requires alternating user/assistant messages.
  // Merge consecutive same-role messages.
  return mergeConsecutiveSameRole(result);
}

/**
 * Convert an assistant message (possibly with tool_calls) to Anthropic content blocks.
 */
function convertAssistantToAnthropicBlocks(msg: ChatMessage): AnthropicContentBlock[] {
  const blocks: AnthropicContentBlock[] = [];

  // Add text content
  const text = extractTextContent(msg.content);
  if (text) {
    blocks.push({ type: 'text', text });
  }

  // Add tool use blocks
  if (msg.tool_calls) {
    for (const tc of msg.tool_calls) {
      blocks.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input: safeParseJson(tc.function.arguments),
      });
    }
  }

  // If no content at all, add an empty text block (Anthropic requires non-empty content)
  if (blocks.length === 0) {
    blocks.push({ type: 'text', text: '' });
  }

  return blocks;
}

/**
 * Convert OpenAI content (string or ContentBlock[]) to Anthropic content blocks.
 */
function convertContentToAnthropicBlocks(
  content: string | ContentBlock[] | null,
): AnthropicContentBlock[] | string {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;

  const blocks: AnthropicContentBlock[] = [];
  for (const block of content) {
    if (block.type === 'text' && block.text) {
      blocks.push({ type: 'text', text: block.text });
    } else if (block.type === 'image_url' && block.image_url) {
      // Convert OpenAI image_url to Anthropic image block
      const url = block.image_url.url;
      if (url.startsWith('data:')) {
        // Base64 data URL
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          blocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: match[1],
              data: match[2],
            },
          });
        }
      } else {
        // URL-based image
        blocks.push({
          type: 'image',
          source: {
            type: 'url',
            url,
          },
        });
      }
    }
  }

  return blocks.length > 0 ? blocks : '';
}

/**
 * Merge consecutive messages with the same role.
 * Anthropic requires strict user/assistant alternation.
 */
function mergeConsecutiveSameRole(messages: AnthropicMessage[]): AnthropicMessage[] {
  if (messages.length === 0) return messages;

  const merged: AnthropicMessage[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = messages[i];

    if (prev.role === curr.role) {
      // Merge content
      const prevBlocks = toBlockArray(prev.content);
      const currBlocks = toBlockArray(curr.content);
      prev.content = [...prevBlocks, ...currBlocks];
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

// ─── Gemini Content Conversion ───

/**
 * Convert OpenAI-format messages to Gemini contents format.
 * - System messages should already be extracted
 * - Maps 'assistant' → 'model', 'user' → 'user'
 * - Tool calls → functionCall parts
 * - Tool results → functionResponse parts
 */
export function convertToGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  const result: GeminiContent[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue; // Should be extracted already

    if (msg.role === 'tool') {
      // Tool result → functionResponse part
      const functionResponse: GeminiPart = {
        functionResponse: {
          name: msg.name ?? 'unknown',
          response: safeParseJson(
            typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          ),
        },
      };

      // Gemini tool responses go in a 'user' turn
      const lastContent = result[result.length - 1];
      if (lastContent && lastContent.role === 'user') {
        lastContent.parts.push(functionResponse);
      } else {
        result.push({ role: 'user', parts: [functionResponse] });
      }
      continue;
    }

    const role: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';
    const parts: GeminiPart[] = [];

    // Text content
    const text = extractTextContent(msg.content);
    if (text) {
      parts.push({ text });
    }

    // Multi-modal content
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'image_url' && block.image_url) {
          const url = block.image_url.url;
          if (url.startsWith('data:')) {
            const match = url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              parts.push({
                inlineData: { mimeType: match[1], data: match[2] },
              });
            }
          }
        }
      }
    }

    // Tool calls
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        parts.push({
          functionCall: {
            name: tc.function.name,
            args: safeParseJson(tc.function.arguments),
          },
        });
      }
    }

    if (parts.length > 0) {
      result.push({ role, parts });
    }
  }

  return result;
}

// ─── Helpers ───

/**
 * Extract plain text from a message content field.
 */
function extractTextContent(content: string | ContentBlock[] | null | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  const textParts = content
    .filter((b): b is ContentBlock & { text: string } => b.type === 'text' && !!b.text)
    .map((b) => b.text);
  return textParts.join('');
}

/**
 * Safely parse JSON, returning an empty object on failure.
 */
function safeParseJson(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Convert Anthropic content (string or block array) to a block array.
 */
function toBlockArray(
  content: string | AnthropicContentBlock[],
): AnthropicContentBlock[] {
  if (typeof content === 'string') {
    return content ? [{ type: 'text', text: content }] : [];
  }
  return content;
}
