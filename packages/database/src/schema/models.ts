import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { providers } from './providers.js';

export const models = sqliteTable('models', {
  id: text('id').primaryKey(),
  providerId: text('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull(),
  displayName: text('display_name').notNull(),
  contextWindow: integer('context_window').notNull().default(4096),
  maxOutputTokens: integer('max_output_tokens').notNull().default(4096),
  supportsTools: integer('supports_tools', { mode: 'boolean' })
    .notNull()
    .default(false),
  supportsStreaming: integer('supports_streaming', { mode: 'boolean' })
    .notNull()
    .default(true),
  supportsVision: integer('supports_vision', { mode: 'boolean' })
    .notNull()
    .default(false),
  inputCostPer1k: real('input_cost_per_1k').notNull().default(0),
  outputCostPer1k: real('output_cost_per_1k').notNull().default(0),
  tags: text('tags').default('[]'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
