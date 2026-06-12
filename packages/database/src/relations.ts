import { relations } from 'drizzle-orm';
import { providers } from './schema/providers.js';
import { models } from './schema/models.js';
import { agents } from './schema/agents.js';
import { mcpServers, mcpTools } from './schema/mcp-servers.js';
import {
  workspaces,
  workspaceProviders,
  workspaceMcp,
  workspaceAgents,
} from './schema/workspaces.js';
import { routingRules } from './schema/routing-rules.js';
import { requestLogs } from './schema/request-logs.js';

// ─── Provider Relations ───

export const providersRelations = relations(providers, ({ many }) => ({
  models: many(models),
  workspaceProviders: many(workspaceProviders),
  requestLogs: many(requestLogs),
}));

// ─── Model Relations ───

export const modelsRelations = relations(models, ({ one, many }) => ({
  provider: one(providers, {
    fields: [models.providerId],
    references: [providers.id],
  }),
  primaryRoutingRules: many(routingRules, { relationName: 'primaryModel' }),
  fallbackRoutingRules: many(routingRules, { relationName: 'fallbackModel' }),
}));

// ─── Agent Relations ───

export const agentsRelations = relations(agents, ({ many }) => ({
  workspaceAgents: many(workspaceAgents),
}));

// ─── MCP Server Relations ───

export const mcpServersRelations = relations(mcpServers, ({ many }) => ({
  tools: many(mcpTools),
  workspaceMcp: many(workspaceMcp),
}));

export const mcpToolsRelations = relations(mcpTools, ({ one }) => ({
  server: one(mcpServers, {
    fields: [mcpTools.serverId],
    references: [mcpServers.id],
  }),
}));

// ─── Workspace Relations ───

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  workspaceProviders: many(workspaceProviders),
  workspaceMcp: many(workspaceMcp),
  workspaceAgents: many(workspaceAgents),
  routingRules: many(routingRules),
  requestLogs: many(requestLogs),
}));

export const workspaceProvidersRelations = relations(
  workspaceProviders,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceProviders.workspaceId],
      references: [workspaces.id],
    }),
    provider: one(providers, {
      fields: [workspaceProviders.providerId],
      references: [providers.id],
    }),
  }),
);

export const workspaceMcpRelations = relations(workspaceMcp, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMcp.workspaceId],
    references: [workspaces.id],
  }),
  mcpServer: one(mcpServers, {
    fields: [workspaceMcp.mcpServerId],
    references: [mcpServers.id],
  }),
}));

export const workspaceAgentsRelations = relations(
  workspaceAgents,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceAgents.workspaceId],
      references: [workspaces.id],
    }),
    agent: one(agents, {
      fields: [workspaceAgents.agentId],
      references: [agents.id],
    }),
  }),
);

// ─── Routing Rule Relations ───

export const routingRulesRelations = relations(routingRules, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [routingRules.workspaceId],
    references: [workspaces.id],
  }),
  primaryModel: one(models, {
    fields: [routingRules.primaryModelId],
    references: [models.id],
    relationName: 'primaryModel',
  }),
  fallbackModel: one(models, {
    fields: [routingRules.fallbackModelId],
    references: [models.id],
    relationName: 'fallbackModel',
  }),
}));

// ─── Request Log Relations ───

export const requestLogsRelations = relations(requestLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [requestLogs.workspaceId],
    references: [workspaces.id],
  }),
  provider: one(providers, {
    fields: [requestLogs.providerId],
    references: [providers.id],
  }),
}));
