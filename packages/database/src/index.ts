// @vas/database — Drizzle ORM + sql.js (WASM) database package

// ─── Connection ───
export {
  initDatabase,
  getDatabase,
  getSqlite,
  closeDatabase,
  saveDatabase,
  type VasDatabase,
} from './connection.js';

// ─── Migrations ───
export { runMigrations } from './migrate.js';

// ─── Schema (all tables + types) ───
export * from './schema/index.js';

// ─── Relations ───
export {
  providersRelations,
  modelsRelations,
  agentsRelations,
  mcpServersRelations,
  mcpToolsRelations,
  workspacesRelations,
  workspaceProvidersRelations,
  workspaceMcpRelations,
  workspaceAgentsRelations,
  routingRulesRelations,
  requestLogsRelations,
} from './relations.js';
