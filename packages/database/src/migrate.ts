import { sql } from 'drizzle-orm';
import type { VasDatabase } from './connection.js';
import { getSqlite } from './connection.js';

/**
 * SQL statements to create all tables.
 * Uses IF NOT EXISTS so this is safe to run on every startup.
 */
const CREATE_TABLE_STATEMENTS = [
  // ─── Providers ───
  `CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('openai','anthropic','gemini','openai_compat','custom')),
    base_url TEXT NOT NULL,
    api_key TEXT,
    headers_json TEXT DEFAULT '{}',
    is_enabled INTEGER NOT NULL DEFAULT 1,
    is_local INTEGER NOT NULL DEFAULT 0,
    rate_limit_rpm INTEGER,
    rate_limit_tpm INTEGER,
    health_status TEXT NOT NULL DEFAULT 'unknown' CHECK(health_status IN ('healthy','degraded','down','unknown')),
    last_health_check INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  // ─── Models ───
  `CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY NOT NULL,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    context_window INTEGER NOT NULL DEFAULT 4096,
    max_output_tokens INTEGER NOT NULL DEFAULT 4096,
    supports_tools INTEGER NOT NULL DEFAULT 0,
    supports_streaming INTEGER NOT NULL DEFAULT 1,
    supports_vision INTEGER NOT NULL DEFAULT 0,
    input_cost_per_1k REAL NOT NULL DEFAULT 0,
    output_cost_per_1k REAL NOT NULL DEFAULT 0,
    tags TEXT DEFAULT '[]',
    is_enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  // ─── Agents ───
  `CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('claude_code','codex','aider','goose','roo_code','custom')),
    executable_path TEXT,
    version TEXT,
    is_installed INTEGER NOT NULL DEFAULT 0,
    is_running INTEGER NOT NULL DEFAULT 0,
    pid INTEGER,
    config_json TEXT DEFAULT '{}',
    env_json TEXT DEFAULT '{}',
    last_started INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  // ─── MCP Servers ───
  `CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    command TEXT NOT NULL,
    args_json TEXT DEFAULT '[]',
    env_json TEXT DEFAULT '{}',
    transport TEXT NOT NULL DEFAULT 'stdio' CHECK(transport IN ('stdio','http')),
    is_enabled INTEGER NOT NULL DEFAULT 1,
    is_running INTEGER NOT NULL DEFAULT 0,
    pid INTEGER,
    auto_start INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  // ─── MCP Tools ───
  `CREATE TABLE IF NOT EXISTS mcp_tools (
    id TEXT PRIMARY KEY NOT NULL,
    server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    input_schema_json TEXT DEFAULT '{}',
    is_enabled INTEGER NOT NULL DEFAULT 1
  )`,

  // ─── Workspaces ───
  `CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    path TEXT,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    config_json TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  // ─── Workspace Junction Tables ───
  `CREATE TABLE IF NOT EXISTS workspace_providers (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (workspace_id, provider_id)
  )`,

  `CREATE TABLE IF NOT EXISTS workspace_mcp (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (workspace_id, mcp_server_id)
  )`,

  `CREATE TABLE IF NOT EXISTS workspace_agents (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (workspace_id, agent_id)
  )`,

  // ─── Routing Rules ───
  `CREATE TABLE IF NOT EXISTS routing_rules (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    match_model_pattern TEXT,
    match_agent_id TEXT,
    match_tag TEXT,
    primary_model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    fallback_model_id TEXT REFERENCES models(id) ON DELETE SET NULL,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  // ─── Request Logs ───
  `CREATE TABLE IF NOT EXISTS request_logs (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    provider_id TEXT REFERENCES providers(id) ON DELETE SET NULL,
    model_id TEXT,
    agent_id TEXT,
    routing_rule_id TEXT,
    method TEXT NOT NULL DEFAULT 'POST',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','success','error','timeout','rate_limited')),
    request_tokens INTEGER DEFAULT 0,
    response_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost REAL DEFAULT 0,
    latency_ms INTEGER,
    error_message TEXT,
    request_body_json TEXT,
    response_body_json TEXT,
    tool_calls INTEGER DEFAULT 0,
    has_streaming INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  // ─── Audit Logs ───
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  // ─── Settings ───
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
];

/**
 * Indexes for performance on high-traffic query patterns.
 */
const CREATE_INDEX_STATEMENTS = [
  // Request logs: query by time range, workspace, provider, model
  `CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_request_logs_workspace_id ON request_logs(workspace_id)`,
  `CREATE INDEX IF NOT EXISTS idx_request_logs_provider_id ON request_logs(provider_id)`,
  `CREATE INDEX IF NOT EXISTS idx_request_logs_model_id ON request_logs(model_id)`,
  `CREATE INDEX IF NOT EXISTS idx_request_logs_status ON request_logs(status)`,

  // Audit logs: query by time and entity
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`,

  // Models: look up by provider
  `CREATE INDEX IF NOT EXISTS idx_models_provider_id ON models(provider_id)`,

  // MCP tools: look up by server
  `CREATE INDEX IF NOT EXISTS idx_mcp_tools_server_id ON mcp_tools(server_id)`,

  // Routing rules: look up by workspace + priority ordering
  `CREATE INDEX IF NOT EXISTS idx_routing_rules_workspace_id ON routing_rules(workspace_id, priority)`,
];

/**
 * Run all table creation and index statements inside a transaction.
 * Safe to call on every app startup — uses IF NOT EXISTS.
 */
export function runMigrations(db: VasDatabase): void {
  const sqlite = getSqlite();

  sqlite.run('BEGIN TRANSACTION;');
  try {
    for (const stmt of CREATE_TABLE_STATEMENTS) {
      sqlite.run(stmt);
    }
    for (const stmt of CREATE_INDEX_STATEMENTS) {
      sqlite.run(stmt);
    }
    sqlite.run('COMMIT;');
  } catch (err) {
    sqlite.run('ROLLBACK;');
    throw err;
  }

  // Set schema version in settings for future migration tracking
  db.run(
    sql`INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('schema_version', '1', unixepoch())`,
  );
}
