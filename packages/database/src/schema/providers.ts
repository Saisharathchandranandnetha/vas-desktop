import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const providerTypes = [
  'openai',
  'anthropic',
  'gemini',
  'openai_compat',
  'custom',
] as const;

export const healthStatuses = [
  'healthy',
  'degraded',
  'down',
  'unknown',
] as const;

export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: providerTypes }).notNull(),
  baseUrl: text('base_url').notNull(),
  apiKey: text('api_key'),
  headersJson: text('headers_json').default('{}'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  isLocal: integer('is_local', { mode: 'boolean' }).notNull().default(false),
  rateLimitRpm: integer('rate_limit_rpm'),
  rateLimitTpm: integer('rate_limit_tpm'),
  healthStatus: text('health_status', { enum: healthStatuses })
    .notNull()
    .default('unknown'),
  lastHealthCheck: integer('last_health_check', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
