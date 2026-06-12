import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { workspaces } from './workspaces.js';
import { providers } from './providers.js';

export const requestStatuses = [
  'pending',
  'success',
  'error',
  'timeout',
  'rate_limited',
] as const;

export const requestLogs = sqliteTable('request_logs', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .references(() => workspaces.id, { onDelete: 'set null' }),
  providerId: text('provider_id')
    .references(() => providers.id, { onDelete: 'set null' }),
  modelId: text('model_id'),
  agentId: text('agent_id'),
  routingRuleId: text('routing_rule_id'),
  method: text('method').notNull().default('POST'),
  status: text('status', { enum: requestStatuses }).notNull().default('pending'),
  requestTokens: integer('request_tokens').default(0),
  responseTokens: integer('response_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  estimatedCost: real('estimated_cost').default(0),
  latencyMs: integer('latency_ms'),
  errorMessage: text('error_message'),
  requestBodyJson: text('request_body_json'),
  responseBodyJson: text('response_body_json'),
  toolCalls: integer('tool_calls').default(0),
  hasStreaming: integer('has_streaming', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type RequestLog = typeof requestLogs.$inferSelect;
export type NewRequestLog = typeof requestLogs.$inferInsert;
