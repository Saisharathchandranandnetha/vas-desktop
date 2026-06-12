import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const mcpTransportTypes = ['stdio', 'http'] as const;

export const mcpServers = sqliteTable('mcp_servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  command: text('command').notNull(),
  argsJson: text('args_json').default('[]'),
  envJson: text('env_json').default('{}'),
  transport: text('transport', { enum: mcpTransportTypes })
    .notNull()
    .default('stdio'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  isRunning: integer('is_running', { mode: 'boolean' })
    .notNull()
    .default(false),
  pid: integer('pid'),
  autoStart: integer('auto_start', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const mcpTools = sqliteTable('mcp_tools', {
  id: text('id').primaryKey(),
  serverId: text('server_id')
    .notNull()
    .references(() => mcpServers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  inputSchemaJson: text('input_schema_json').default('{}'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
});

export type McpServer = typeof mcpServers.$inferSelect;
export type NewMcpServer = typeof mcpServers.$inferInsert;
export type McpTool = typeof mcpTools.$inferSelect;
export type NewMcpTool = typeof mcpTools.$inferInsert;
