import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { workspaces } from './workspaces.js';
import { models } from './models.js';

export const routingRules = sqliteTable('routing_rules', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  priority: integer('priority').notNull().default(0),
  matchModelPattern: text('match_model_pattern'),
  matchAgentId: text('match_agent_id'),
  matchTag: text('match_tag'),
  primaryModelId: text('primary_model_id')
    .notNull()
    .references(() => models.id, { onDelete: 'cascade' }),
  fallbackModelId: text('fallback_model_id')
    .references(() => models.id, { onDelete: 'set null' }),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type RoutingRule = typeof routingRules.$inferSelect;
export type NewRoutingRule = typeof routingRules.$inferInsert;
