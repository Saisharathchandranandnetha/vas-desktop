// ─── Tool Normalization Utilities ───
// Convert tool definitions and tool calls between provider formats.

import type { ToolDefinition, ToolCall } from '@vas/shared';
import type {
  AnthropicTool,
  AnthropicContentBlock,
  AnthropicToolUseBlock,
  GeminiFunctionDeclaration,
} from '../types.js';

// ─── OpenAI → Anthropic Tool Conversion ───

/**
 * Convert OpenAI-format tool definitions to Anthropic tool format.
 * OpenAI wraps functions in { type: 'function', function: { ... } }
 * Anthropic uses flat { name, description, input_schema } objects.
 */
export function convertToolsToAnthropic(tools: ToolDefinition[]): AnthropicTool[] {
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: (tool.function.parameters as Record<string, unknown>) ?? {
      type: 'object',
      properties: {},
    },
  }));
}

// ─── OpenAI → Gemini Tool Conversion ───

/**
 * Convert OpenAI-format tool definitions to Gemini functionDeclarations.
 * Gemini uses a flat { name, description, parameters } format.
 */
export function convertToolsToGemini(tools: ToolDefinition[]): GeminiFunctionDeclaration[] {
  return tools.map((tool) => {
    const decl: GeminiFunctionDeclaration = {
      name: tool.function.name,
    };
    if (tool.function.description) {
      decl.description = tool.function.description;
    }
    if (tool.function.parameters) {
      decl.parameters = tool.function.parameters;
    }
    return decl;
  });
}

// ─── Anthropic → OpenAI Tool Call Conversion ───

/**
 * Convert Anthropic tool_use content blocks to OpenAI-format tool_calls array.
 * Filters content blocks for type === 'tool_use' and maps to ToolCall format.
 */
export function convertAnthropicToolCalls(content: AnthropicContentBlock[]): ToolCall[] {
  return content
    .filter((block): block is AnthropicToolUseBlock => block.type === 'tool_use')
    .map((block) => ({
      id: block.id,
      type: 'function' as const,
      function: {
        name: block.name,
        arguments: JSON.stringify(block.input),
      },
    }));
}

// ─── Tool Choice Conversion ───

/**
 * Convert OpenAI tool_choice to Anthropic tool_choice format.
 */
export function convertToolChoiceToAnthropic(
  toolChoice: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } } | undefined,
): { type: 'auto' } | { type: 'any' } | { type: 'tool'; name: string } | undefined {
  if (!toolChoice) return undefined;

  if (toolChoice === 'none') return undefined;
  if (toolChoice === 'auto') return { type: 'auto' };
  if (toolChoice === 'required') return { type: 'any' };

  if (typeof toolChoice === 'object' && toolChoice.type === 'function') {
    return { type: 'tool', name: toolChoice.function.name };
  }

  return undefined;
}
