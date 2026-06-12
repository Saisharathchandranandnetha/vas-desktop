import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { providers } from './providers.js';
import { mcpServers } from './mcp-servers.js';
import { agents } from './agents.js';

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  path: text('path'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  configJson: text('config_json').default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const workspaceProviders = sqliteTable(
  'workspace_providers',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    providerId: text('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.providerId] }),
  }),
);

export const workspaceMcp = sqliteTable(
  'workspace_mcp',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    mcpServerId: text('mcp_server_id')
      .notNull()
      .references(() => mcpServers.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.mcpServerId] }),
  }),
);

export const workspaceAgents = sqliteTable(
  'workspace_agents',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.agentId] }),
  }),
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceProvider = typeof workspaceProviders.$inferSelect;
export type NewWorkspaceProvider = typeof workspaceProviders.$inferInsert;
export type WorkspaceMcp = typeof workspaceMcp.$inferSelect;
export type NewWorkspaceMcp = typeof workspaceMcp.$inferInsert;
export type WorkspaceAgent = typeof workspaceAgents.$inferSelect;
export type NewWorkspaceAgent = typeof workspaceAgents.$inferInsert;
