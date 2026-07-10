# Present Work 4 — MCP Tools Integration (PRIVATE DRAFT)

> **Phase:** 3 | **Status:** Draft | **Prerequisite:** Subagents (Phase 2)

## 1. What is MCP Tools Integration?

Model Context Protocol (MCP) is the emerging industry standard for connecting AI agents to external tools.
An MCP server exposes tools + resources over stdio or HTTP. Any MCP-compatible agent can use any MCP server's tools.

This means: one MCP server for GitHub = every VAS Desktop agent can use GitHub tools without any custom code.

## 2. Who Implements MCP?

| CLI | MCP Status |
|-----|-----------|
| Claude Code | First-class, leading implementation |
| Cline | Massive MCP marketplace (hundreds of servers) |
| Goose | Strong adopter, MCP-primary tool interface |
| Warp | MCP support for internal tools |
| Antigravity | MCP standard |
| Codex | Limited |
| Aider | No |

## 3. Our Implementation Plan

### 3.1 Architecture

``
core/mcp/
  client.ts        # Connect to MCP server (stdio/HTTP), handshake, list tools + schemas
  registry.ts      # Register MCP tools as adapters in the main tool registry
config: { mcp: { servers: [{name, command, args} | {name, url}] } }
``

### 3.2 Build Steps

1. Add @modelcontextprotocol/sdk
2. core/mcp/client.ts: spawn/connect server, handshake, fetch tool list + schemas
3. core/mcp/registry.ts: register MCP tools as adapters — transparent to agents
4. Config schema: mcp.servers array
5. Commands: vas mcp list / vas mcp add <name> <cmd> / vas mcp remove <name>
6. Example: connect a sample MCP server (e.g. filesystem MCP); agent calls its tool

### 3.3 Acceptance Criteria

- [ ] Declaring MCP server in config makes its tools available to agents
- [ ] Tool schema discovery works; calls return expected results
- [ ] Failed connection reported clearly without crashing CLI
- [ ] vas mcp list shows all connected servers and their tools
