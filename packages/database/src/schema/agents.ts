import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const agentTypes = [
  'claude_code',
  'codex',
  'aider',
  'goose',
  'roo_code',
  'custom',
] as const;

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  type: text('type', { enum: agentTypes }).notNull(),
  executablePath: text('executable_path'),
  version: text('version'),
  isInstalled: integer('is_installed', { mode: 'boolean' })
    .notNull()
    .default(false),
  isRunning: integer('is_running', { mode: 'boolean' })
    .notNull()
    .default(false),
  pid: integer('pid'),
  configJson: text('config_json').default('{}'),
  envJson: text('env_json').default('{}'),
  lastStarted: integer('last_started', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
