# Present Work 1 — Core CLI Foundation

> **Phase:** 0 (Foundation — build and ship this before any other feature)
> **Purpose:** Build the stable, extensible CLI core that every future feature integrates against.
> **Stack:** TypeScript + Node.js

---

## 1. What is the Core CLI?

The core CLI is the bedrock of VAS_Desktop — the surface every future feature plugs into.
It includes:

- **Interactive REPL** — conversational AI coding loop
- **Non-interactive mode** — scriptable, pipe-friendly, CI-safe
- **Command registry** — discover and dispatch commands
- **Config system** — layered project/user/global config with validation
- **Logging** — structured, discipline-separated (stdout = output, stderr = diagnostics)
- **Error handling** — typed errors, correct exit codes, clean failure messages
- **Permission model** — gate destructive operations safely (ask / plan / bypass)
- **Provider-agnostic model layer** — swap LLM backends via config (not code)
- **Plugin/skill discovery hook** — foundation for extensibility (Phase 1)
- **Distribution** — npm install, npx, cross-platform

This is what every user touches first and last. It must be rock-solid before anything else is layered on top.

---

## 2. Which Existing CLIs Have Built This?

Every major AI CLI has a core. Here is the full list of tools surveyed for this plan:

| # | Tool | Author | Language | Open Source |
|---|------|--------|----------|-------------|
| 1 | Claude Code | Anthropic | TypeScript | No (SDK open) |
| 2 | OpenAI Codex CLI | OpenAI | TypeScript | Yes |
| 3 | Gemini CLI | Google | TypeScript | Yes |
| 4 | Antigravity CLI (`agy`) | Google | Go | No |
| 5 | Aider | Paul Gauthier | Python | Yes |
| 6 | Cline | Open Source | TypeScript | Yes (Apache 2.0) |
| 7 | Roo Code | Roo Code Team | TypeScript | Yes (Apache 2.0) |
| 8 | Goose | Block | Rust | Yes |
| 9 | Amp | Sourcegraph | TypeScript | No |
| 10 | Kiro | Amazon (AWS) | TypeScript | No |
| 11 | GitHub Copilot CLI (`gh copilot`) | GitHub/Microsoft | Go | No |
| 12 | Continue | Open Source | TypeScript | Yes |
| 13 | OpenCode | SST/open-source | Go | Yes |
| 14 | Qwen Code | Alibaba | TypeScript | Yes (Gemini fork) |
| 15 | Open Interpreter | Open Source | Python | Yes |
| 16 | Devin | Cognition | Proprietary | No |
| 17 | Warp | Warp | Rust | No |
| 18 | Nushell | Open Source | Rust | Yes |
| 19 | Ollama CLI | Ollama | Go | Yes |
| 20 | Jan | Jan | TypeScript/Electron | Yes |
| 21 | Cursor | Anysphere | TypeScript (Electron) | No |
| 22 | Windsurf | Codeium | TypeScript (Electron) | No |
| 23 | Droid | Factory | Proprietary | No |
| 24 | Claude Agent SDK | Anthropic | TypeScript | Partial |
| 25 | Kilo Code | Kilo Code Team | TypeScript | Yes |

---

## 3. Deep Comparison: How Each CLI Built Its Core

### 3.1 Claude Code (Anthropic)

**Use case:** The richest-featured agentic coding CLI. The "gold standard" the ecosystem measures itself against.

**Why they built it:**
Anthropic needed a CLI that would showcase Claude's agent capabilities in a real developer workflow. The goal was not just a chatbot wrapper but a fully agentic tool that could autonomously read, edit, run, and review code.

**Impact:**
- Became the market reference for what an "agentic CLI" looks like
- Skills, subagents, hooks, and MCP integration are now industry standards copied by others
- Plugin marketplace emerging

**Architecture:**
- **Language:** TypeScript + Node.js
- **TUI layer:** React + Ink — fully reactive terminal UI with components and hooks
- **Three-layer system:**
  1. CLI/Interaction Layer: session management, command parsing
  2. Query Engine: streaming, token management, Extended Thinking, tool-call loops
  3. Tool System: read/write/edit/shell/grep with permission gating
- **Config:** `CLAUDE.md` at project root = permanent context loaded every session
- **Memory:** `memory/` dir + `MEMORY.md` index — survives context compaction
- **Permission modes:** ask (default), plan (dry-run), bypass (autonomous)
- **Provider:** Anthropic-only (but SDK is extensible)
- **Plugin system:** skills (`SKILL.md` folders) + plugins (bundled skills + MCPs + hooks)
- **Hooks lifecycle:** PreToolUse, PostToolUse, PreCompact, Stop
- **Distribution:** npm global install

**What we take from this:**
- ✅ React + Ink for the TUI layer (reactive, componentized)
- ✅ Three-layer architecture (interaction → query → tool)
- ✅ Permission model as a first-class concern (not an afterthought)
- ✅ Permanent context file at project root (`VAS.md` for us)
- ✅ Hook lifecycle (PreToolUse, PostToolUse, Stop) — Phase 1
- ✅ Skills/plugin system design — Phase 1

---

### 3.2 OpenAI Codex CLI

**Use case:** Fast, lightweight terminal agent. Tight integration with ChatGPT Plus/Enterprise.

**Why they built it:**
Launched April 2025 to give OpenAI API users a terminal-native experience. Deliberately minimalist — fast loops over feature richness.

**Impact:**
- Proved that a minimal core with `auto-accept` mode is a valid, popular design choice
- Strong enterprise adoption via ChatGPT integration
- Parallel agent support added later

**Architecture:**
- **Language:** TypeScript + Node.js
- **Key features:** streaming, `reasoning effort` control (low/medium/high), explicit cost/token visibility, auto-accept toggle
- **Permission:** three-way auto-accept: suggest / auto-edit / full-auto
- **Distribution:** npm global install + VS Code extension sync
- **Notable:** deliberately avoids feature sprawl — small surface area, fast cold start

**What we take from this:**
- ✅ `reasoning effort` flag (low/medium/high) — expose this as a cost/quality dial
- ✅ Explicit cost + token tracking in output
- ✅ `auto-accept` mode as a named first-class concept
- ✅ Minimal viable core first — don't over-engineer Phase 0

---

### 3.3 Gemini CLI (Google → Antigravity)

**Use case:** Long-context codebase analysis. Google Cloud integration. Extension ecosystem.

**Why they built it:**
Google needed a CLI that could leverage Gemini's 1M+ token context window for whole-repo analysis. Became massively popular in 2025 (1M+ weekly users at launch).

**Impact:**
- Proved long-context is a killer feature for large-codebase workflows
- Extension ecosystem (80+ plugins) became a model for plugin-driven CLIs
- Transitioned to Antigravity CLI in mid-2026

**Architecture:**
- **Language:** TypeScript + Node.js
- **Structure:** two-package system (`packages/cli` for interface, `packages/core` for orchestration)
- **Extensions:** modular plugins (80+ covering Stripe, Figma, Postgres, etc.)
- **Context:** leverages Gemini's huge context window + project-level `GEMINI.md` config file
- **Distribution:** npm

**What we take from this:**
- ✅ Split CLI package from core orchestration package (`packages/cli` vs `packages/core`)
- ✅ Extension ecosystem design (80+ plugins = 80+ use cases unlocked)
- ✅ Project-level config file (`VAS.md`) as permanent context

---

### 3.4 Antigravity CLI (`agy`)

**Use case:** Multi-agent, parallel execution, Google-ecosystem integration. Next-gen replacement for Gemini CLI.

**Why they built it:**
Google launched Antigravity at Google I/O 2026 to provide a "shared agent harness" CLI with full parallel agent support. The same backend powers both the CLI and the Antigravity desktop app.

**Impact:**
- Unified CLI + desktop app backend = consistent multi-agent behavior anywhere
- Terminal sandbox (nsjail/sandbox-exec/AppContainer) for safe shell execution
- `AGENTS.md` at project root prepended to every prompt

**Architecture:**
- **Language:** Go (fast cold start, small binary, great for SSH/remote sessions)
- **Terminal sandbox:** nsjail (Linux), sandbox-exec (macOS), AppContainer (Windows)
- **Agent config:** `AGENTS.md` at project root
- **Parallel agents:** fan-out tasks to specialized subagents concurrently
- **Async workflows:** background tasks without locking terminal
- **Skills/plugins:** modular, MCP-standard

**What we take from this:**
- ✅ `VAS.md` project config file (like `AGENTS.md`)
- ✅ Terminal sandbox for shell execution safety
- ✅ Background async workflows (Phase 2)
- ✅ CLI + desktop share the same backend harness

---

### 3.5 Aider

**Use case:** Git-native pair programmer. Vendor-agnostic. The power-user's editing tool.

**Why they built it:**
Paul Gauthier built Aider (2023) to solve the "LLM edits are hard to review and undo" problem. Git-native from day 1 — every AI edit is an atomic git commit.

**Impact:**
- Most-starred open-source AI coding tool for 2+ years
- Repo-map context compression is widely copied
- Multi-model workflow (Architect + Editor using different models) is a new pattern

**Architecture:**
- **Language:** Python
- **Repo-map:** compress the entire repo into a token-efficient tree-sitter-based map for the model
- **Edit formats:** diff-based, reviewable before apply (not blind writes)
- **Git integration:** every change = atomic commit, easy `--undo`
- **Architect/Editor mode:** plan with one model, edit with a cheaper/faster model
- **Model-agnostic:** Claude, GPT, DeepSeek, local Ollama — all swappable via config

**What we take from this:**
- ✅ Repo-map style context compression (seed in `core/context.ts` — Phase 0)
- ✅ Diff-based, reviewable edits (never blind writes)
- ✅ `--undo` as a first-class command
- ✅ Architect+Editor dual-model pattern (use cheap model for planning, smart model for code)
- ✅ Provider-agnostic model layer (non-negotiable)

---

### 3.6 Cline

**Use case:** Human-in-the-loop coding agent. Massive MCP marketplace.

**Why they built it:**
Built as a VS Code extension agent that keeps humans in control — every action requires approval before it runs.

**Impact:**
- Most popular open-source VS Code AI agent
- MCP marketplace with hundreds of integrations
- Approval-step UX became a trust standard

**Architecture:**
- **Language:** TypeScript
- **Host:** VS Code extension (but patterns apply to CLI)
- **Human-in-the-loop:** explicit approve/reject before every tool use
- **MCP-first:** MCP is the primary tool integration mechanism
- **License:** Apache 2.0

**What we take from this:**
- ✅ Approve-before-execute step as a permission mode (maps to our `ask` mode)
- ✅ MCP as the primary tool interface (Phase 3)

---

### 3.7 Roo Code

**Use case:** Multi-mode agentic coding with structured roles.

**Why they built it:**
Forked from Cline to add a structured "mode" system — Code mode, Architect mode, Ask mode, Debug mode, etc. Each mode has a different system prompt and tool access.

**Impact:**
- Multi-mode became popular for teams wanting structured AI roles
- Cloud-based autonomous agents (not just local)

**Architecture:**
- **Language:** TypeScript (Cline fork)
- **Modes:** Code / Architect / Ask / Debug / (custom) — each is a named persona
- **Cloud agents:** autonomous execution in cloud sandboxes
- **License:** Apache 2.0

**What we take from this:**
- ✅ Named agent roles / modes (maps to our subagent roles — Phase 2)

---

### 3.8 Goose (Block)

**Use case:** General-purpose AI agent (not just coding). Local-first. MCP-heavy.

**Why they built it:**
Block (formerly Square) built Goose as a local-first, open-source agent that isn't limited to coding — it handles data analysis, browser automation, and system tasks. Privacy-first: runs everything locally.

**Impact:**
- Strong MCP adopter (Goose + MCP = huge extensibility)
- Rust for performance + safety
- General-purpose = much wider use case than coding-only CLIs

**Architecture:**
- **Language:** Rust (performance, memory safety, single binary)
- **Extension system:** "activities" (similar to skills)
- **Local-first:** privacy by default, no cloud telemetry
- **MCP-standard:** Goose uses MCP as its primary tool interface

**What we take from this:**
- ✅ Local-first privacy stance (ollama adapter for air-gapped use)
- ✅ General-purpose design (not just coding — VAS Desktop has PCB, teams, etc.)
- ✅ MCP as tool interface (Phase 3)

---

### 3.9 Amp (Sourcegraph)

**Use case:** Frontier-model agent for large codebases and long refactor threads.

**Why they built it:**
Sourcegraph (makers of code search) built Amp to leverage their code intelligence for grounding AI answers in real code. Specializes in very long conversation threads (hundreds of rounds without losing state).

**Impact:**
- Best-in-class for massive refactors that other agents lose track of
- Code-graph grounding for accurate answers

**Architecture:**
- **Language:** TypeScript
- **Key strength:** long-thread memory — hundreds of conversation rounds without state loss
- **Code graph:** grounds answers in real code-search (Sourcegraph heritage)

**What we take from this:**
- ✅ Long-thread state management (conversation compaction strategy)
- ✅ Code-graph grounding (Phase 4 memory + context compression)

---

### 3.10 Kiro (Amazon/AWS)

**Use case:** Spec-driven agentic IDE. Bridging "vibe coding" and production-ready systems.

**Why they built it:**
AWS built Kiro to solve the "vibe coding problem" — AI writes code that works in the demo but breaks in production. Solution: force a planning step (Spec) before any code is written.

**Impact:**
- Spec-first approach is becoming a governance standard in enterprise
- Forces AI to articulate requirements → design → tasks before coding
- Kiro specs become audit artifacts

**Architecture:**
- **Language:** TypeScript (IDE-based)
- **Spec-driven:** NL prompt → requirements → design → task list → code
- **Governance:** specs = reviewable artifacts before execution

**What we take from this:**
- ✅ Plan/Spec mode as a first-class permission mode (not just "plan" — a full spec artifact)
- ✅ Requirement → Design → Task → Code flow for complex agent tasks

---

### 3.11 GitHub Copilot CLI (`gh copilot`)

**Use case:** Integrated GitHub/IDE workflow. Developer ecosystem-wide reach.

**Why they built it:**
GitHub extended `gh` CLI with AI so developers already using `gh` get AI capabilities without installing a separate tool. Auth via GitHub — no new credentials.

**Impact:**
- Largest installed base of any coding assistant (GitHub's user count)
- Proves "extend an existing CLI" as a valid distribution strategy

**Architecture:**
- **Language:** Go (inside `gh` binary)
- **Auth:** GitHub SSO — zero new credential setup
- **Distribution:** bundled with `gh` — instant reach to millions

**What we take from this:**
- ✅ Piggyback distribution: VAS Desktop CLI can be a plugin for existing shells (zsh/fish/etc.)
- ✅ SSO auth model — use existing identity rather than new credentials

---

### 3.12 Continue

**Use case:** IDE-agnostic AI coding assistant. Portable context format.

**Why they built it:**
Continue targets developers who don't want to be locked to one IDE. It works in VS Code, JetBrains, and any editor that supports its protocol.

**Impact:**
- IDE-agnostic = wider reach than any single-editor tool
- Portable context format = same behavior everywhere

**Architecture:**
- **Language:** TypeScript
- **Host:** VS Code + JetBrains (IDE extensions)
- **Context format:** portable across editors

**What we take from this:**
- ✅ Host-agnostic design — VAS Desktop CLI works in any terminal, not locked to VS Code

---

### 3.13 OpenCode

**Use case:** Fast, single-binary, provider-agnostic terminal agent.

**Why they built it:**
Built as a lightweight alternative to Claude Code — Go binary means zero Node.js dependency, instant startup, easy distribution.

**Architecture:**
- **Language:** Go (single cross-platform binary)
- **Key:** no runtime dependency — `curl + run` installs it
- **Provider-agnostic:** any model via config

**What we take from this:**
- ✅ Provider-agnostic model layer (config-driven, not code-driven)
- ✅ Fast cold start as a target metric

---

### 3.14 Qwen Code (Alibaba)

**Use case:** Gemini CLI fork for Chinese ecosystem and Qwen models.

**Why they built it:**
Alibaba forked Gemini CLI and repointed it at Qwen models + DashScope API. Skipped years of core development by forking.

**Architecture:**
- TypeScript (Gemini fork)
- Provider layer = the only significant change

**What we take from this:**
- ✅ Provider abstraction is the most important non-negotiable. If another team can fork VAS Desktop by only changing the provider config, the architecture is correct.

---

### 3.15 Open Interpreter

**Use case:** Local computer-use agent. Execute code locally, control GUI, browser.

**Why they built it:**
Power-users want a ChatGPT-style experience with full local computer access — files, browser, installed apps — without sending data to cloud.

**Impact:**
- Leading open-source choice for local/offline AI automation
- Desktop app brought computer-use to non-developers

**Architecture:**
- **Language:** Python
- **Execution:** runs generated code locally (Python, shell, JavaScript)
- **Model-agnostic:** OpenAI, Anthropic, local Ollama
- **Computer use:** file system, browser, GUI apps

**What we take from this:**
- ✅ Local execution path for privacy-sensitive ops (Phase 8 — computer use)
- ✅ Ollama adapter for 100% offline mode

---

### 3.16 Devin (Cognition)

**Use case:** Fully autonomous software engineer. Give it a ticket, it plans-codes-tests-deploys.

**Why they built it:**
Cognition's thesis: agents should work like a junior engineer — given a task, they autonomously complete it end-to-end including debugging, not just writing code.

**Impact:**
- Redefined "autonomous agent" expectations
- v3 added dynamic re-planning: agent revises its own plan mid-task

**Architecture:**
- **Cloud sandbox:** isolated environment per task
- **Plan → Code → Test → Debug → Deploy loop**
- **Dynamic re-planning:** if the plan fails, agent revises and retries

**What we take from this:**
- ✅ Full plan-execute-verify loop (not just "write code" — also test and debug)
- ✅ Dynamic re-planning when the current plan fails (Phase 9)

---

### 3.17 Warp Terminal

**Use case:** Agentic Development Environment (ADE). AI-native terminal with blocks + MCP.

**Why they built it:**
Warp reimagined the terminal itself — every command output is a "block" (shareable, searchable), with AI integrated directly. Evolved into an ADE supporting MCP.

**Architecture:**
- **Language:** Rust
- **Blocks:** structured command outputs (copyable, shareable)
- **Agent mode:** multi-step tasks in the terminal
- **MCP support:** connect to internal tools via MCP

**What we take from this:**
- ✅ Structured output blocks (each command output is parseable, shareable)
- ✅ MCP support (Phase 3)

---

### 3.18 Nushell

**Use case:** Data-centric shell. Everything is structured data (tables, JSON, not text).

**Why they built it:**
Eliminate the fragile `awk/sed/grep` pipeline hell. Every output is typed structured data that can be filtered, sorted, and manipulated with a real query language.

**Architecture:**
- **Language:** Rust
- **Everything is data:** `ls | where size > 10mb` — no text parsing needed

**What we take from this:**
- ✅ `--json` output mode for every command (structured data, not text)
- ✅ Output normalization at the adapter boundary — internal code never parses upstream text

---

### 3.19 Ollama + Jan (Local Model Runners)

**Use case:** Run LLMs locally. Zero cloud dependency.

**Why they built it:**
Privacy + cost + offline access. Run Llama, Mistral, CodeLlama, DeepSeek locally.

**What we take from this:**
- ✅ `ollama` adapter in the model layer from day 1 — full offline/private mode

---

### 3.20 Cursor + Windsurf (Agentic IDEs)

**Use case:** Full IDE with AI deeply integrated (not just a plugin).

**Why they built it:**
VS Code forks that embed AI into every editing flow — autocomplete, refactor, inline chat, background agents.

**What we take from this:**
- ✅ Inline diff review before applying (Aider-style) — in the CLI, show diffs before writing files

---

### 3.21 Droid (Factory)

**Use case:** Autonomous AI software engineer, cloud-based, for enterprise teams.

**Architecture:** Cloud sandbox, task delegation, audit trail

**What we take from this:**
- ✅ Full audit trail — every agent action logged and reversible (Phase 9)

---

## 4. Cross-CLI Patterns (Synthesis)

After analyzing all 25 CLIs, these patterns appear consistently in the best implementations:

| Pattern | Who does it | Why it works |
|---------|-------------|--------------|
| **TypeScript + Node.js** | Claude Code, Codex, Gemini, Cline, Roo Code, Continue, Amp, Kiro | Largest agent ecosystem; npm; MCP SDK; CRDT (Yjs); plugin loading |
| **Provider-agnostic model layer** | Aider, OpenCode, Qwen, Goose, Continue | Fork = config change, not rewrite; multi-model workflows |
| **Permission model (ask/plan/bypass)** | Claude Code, Codex, Cline, Antigravity | Safety spine; required for autonomous tools |
| **Plugin/extension/skill system** | Claude Code, Gemini, Cline, Goose, Antigravity | Extensibility without forking core |
| **Diff-based reviewable edits** | Aider, Claude Code | Trust + safety; easy undo |
| **Repo-map context compression** | Aider, Amp | Cost efficiency; large repos fit in context |
| **MCP as tool interface** | Claude Code, Cline, Goose, Warp | Standard = ecosystem of tools; write once, works everywhere |
| **Local-first / privacy** | Goose, Open Interpreter, Ollama | Enterprise + sensitive data requirements |
| **Permanent project config file** | Claude Code (CLAUDE.md), Antigravity (AGENTS.md), Gemini (GEMINI.md) | Consistent behavior across sessions |

---

## 5. Gaps in Existing Implementations

These are the things **no existing CLI does well** — our opportunities to differentiate:

| Gap | Current state | Our approach |
|-----|--------------|--------------|
| **Real-time multi-user collaboration** | Not solved by anyone — all CLIs are single-user | CRDT via Yjs (Phase 5) |
| **AI-powered PCB generation** | No CLI; only browser tools (Flux.ai, ProtoFlow) | CLI + 3D terminal view + desktop editor (Phase 7) |
| **RL self-improvement loop** | No shipping CLI has it; Devin has static re-planning only | Python/trl external service + trace/reward/policy loop (Phase 6) |
| **Structured output as a default** | Most CLIs output unstructured text | `--json` on every command; structured blocks |
| **Unified meta-CLI** | Every tool is its own island | One CLI, one grammar, all tools via adapters |
| **Team presence/awareness in terminal** | Nothing | CRDT awareness layer (cursors, users, status) |

---

## 6. Our Implementation Plan — Phase 0: Core CLI

### 6.1 Goal

Build the smallest, most solid CLI core possible. This is Phase 0 — it has NO user-facing AI features yet. It is the foundation that proves:
- Commands can be discovered, registered, and dispatched
- Config loads correctly from multiple sources
- Errors are handled cleanly with correct exit codes
- The model layer can call an LLM and stream a response
- Permission modes gate destructive operations
- A plugin can be loaded without core changes

Ship Phase 0. Verify it. Then and only then move to Phase 1.

### 6.2 Tech Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Language | TypeScript + Node.js | Dominant in agent CLIs; best npm/MCP ecosystem |
| CLI framework | Custom registry + oclif inspiration | Full control; oclif too heavyweight for our custom permission/hook model |
| TUI layer | React + Ink | Same as Claude Code; reactive, componentized, hot-reload in dev |
| Config | cosmiconfig + zod | Layered local/user/global; typed + validated at load |
| Logging | pino | Fast structured logging; stdout = output only, stderr = diagnostics |
| Errors | Custom `CliError` + exit codes | 0/1/2/>2; never exit 0 on failure |
| Build | esbuild | Fastest bundler; tiny output; ESM output |
| Tests | vitest | Fast, ESM-native; execa for integration tests against built binary |
| Releases | changesets | PR authors add changelogs; CI versions + publishes |
| Distribution | npm global + npx + Homebrew tap | Maximum reach; Homebrew for macOS/Linux devs |

### 6.3 File Structure

```
src/
  index.ts                  # Entry: config → logger → permission → registry → run
  core/
    registry.ts             # Map<name, CommandDef> + glob discovery + plugin merge
    config.ts               # cosmiconfig + zod schema (vasrc / .vasrc.json / package.json "vas" key)
    logger.ts               # pino wrapper; stdout reserved for command output
    error.ts                # CliError(message, exitCode) + top-level handleError()
    permission.ts           # ask / plan / bypass modes; gating wrapper for destructive ops
    model.ts                # Provider interface + adapters: anthropic, openai, gemini, ollama
    plugin-loader.ts        # Discover skills/ + plugins/ + npm-installed vas-plugin-* packages
    context.ts              # Repo-map style context compression (seed now, full impl Phase 4)
  commands/
    version.ts              # vas --version / vas version
    help.ts                 # vas --help / vas help [command]
  types.ts                  # CommandDef, Adapter, Plugin, Hook, Provider interfaces

VAS.md                      # Permanent project context (loaded every session, like CLAUDE.md)
.vasrc.json                 # Project-level config (gitignored by users; example: .vasrc.example.json)
```

### 6.4 Key Interfaces

```typescript
// CommandDef: what every command looks like
interface CommandDef {
  name: string;
  description: string;
  args?: ArgDef[];
  flags?: FlagDef[];
  run(ctx: Context): Promise<void>;
}

// Provider: how any LLM is called
interface Provider {
  name: string;
  ask(messages: Message[], opts?: AskOptions): AsyncIterable<string>;
}

// Plugin: what a plugin exports
interface Plugin {
  name: string;
  commands?: CommandDef[];
  hooks?: Hook[];
  skills?: Skill[];
}

// Permission modes
type PermissionMode = 'ask' | 'plan' | 'bypass';
```

### 6.5 Config Schema (`vasrc`)

```json
{
  "model": {
    "provider": "anthropic",
    "name": "claude-sonnet-4-5",
    "effort": "medium"
  },
  "permission": "ask",
  "plugins": [],
  "mcp": { "servers": [] }
}
```

Loaded via `cosmiconfig` from: `.vasrc` → `.vasrc.json` → `package.json "vas"` → `~/.vasrc` → defaults.

### 6.6 Build Steps

**Step 1 — Scaffold**
```
npm init; set "type": "module"; add bin: { "vas": "./dist/index.js" }
Install: typescript, tsx, esbuild, vitest, execa, pino, cosmiconfig, zod, ink, react, changesets
```

**Step 2 — Core modules (in this order)**
1. `core/error.ts` — `CliError` class + `handleError()` — build this first so all other modules can throw
2. `core/logger.ts` — pino wrapper; `log.info()` → stderr; `process.stdout.write()` for output
3. `core/config.ts` — cosmiconfig loader + zod schema; throws `CliError` on invalid config
4. `core/permission.ts` — `checkPermission(mode, action)`: ask → prompt user; plan → describe action; bypass → execute
5. `core/model.ts` — `Provider` interface + `AnthropicAdapter` + `OllamaAdapter`; `getProvider(config)` factory
6. `core/registry.ts` — `Map<string, CommandDef>`; `register(cmd)`, `discover(glob)`, `dispatch(argv)`
7. `core/plugin-loader.ts` — scan `skills/*/SKILL.md`, scan `plugins/*/index.ts`, scan `vas-plugin-*` in node_modules
8. `core/context.ts` — stub: `getContext(dir)` returns file tree summary (full repo-map: Phase 4)

**Step 3 — Commands**
1. `commands/version.ts` — reads `package.json`, prints version, exits 0
2. `commands/help.ts` — iterates registry, prints name + description table

**Step 4 — Entry point**
`index.ts`:
```
1. Load config (handleError on failure)
2. Init logger
3. Init permission mode from config
4. Load plugins (plugin-loader)
5. Build registry (built-ins + plugin commands)
6. Parse argv
7. Dispatch command (handleError on CliError)
8. Exit with correct code
```

**Step 5 — Build + link**
```bash
npm run build  # esbuild → dist/index.js with #!/usr/bin/env node shebang
npm link       # makes `vas` callable globally
vas --version  # should print version and exit 0
```

**Step 6 — Tests**
```typescript
// integration/version.test.ts
test('vas --version exits 0', async () => {
  const { exitCode, stdout } = await execa('vas', ['--version']);
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/\d+\.\d+\.\d+/);
});

// integration/permission.test.ts
test('permission ask mode prompts before destructive ops', async () => {
  // pipe 'n' to stdin; assert destructive op was NOT executed
});

// unit/config.test.ts
test('invalid config throws CliError with exit code 1', () => {
  expect(() => loadConfig({ model: { provider: 'invalid' } })).toThrow(CliError);
});
```

**Step 7 — Release**
```bash
npx changeset  # add changelog entry
npx changeset version  # bump version
npm publish    # publish to npm as vas-desktop-cli
```

### 6.7 Exit Code Contract

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (unexpected failure) |
| 2 | Bad usage (unknown command, missing arg, invalid flag) |
| 3 | Permission denied by user |
| 4 | Model/provider error |
| 5+ | Domain-specific (future phases) |

> **Rule:** Never exit 0 on failure. Never exit non-zero on success. Tools in pipelines depend on this.

### 6.8 Permission Model Design

Three modes (set in config or overridden per-command with `--mode`):

| Mode | Behavior | When to use |
|------|----------|-------------|
| `ask` (default) | Before any destructive op, print what will happen and prompt `y/n` | Development; when you're exploring |
| `plan` | Only describe what would happen, never execute. Outputs a plan artifact | Code review; safety check |
| `bypass` | Execute everything without prompting | CI/automation; trusted environments |

Destructive operations: file writes, file deletes, shell commands, git operations.

### 6.9 Provider Adapter Design

```typescript
// core/model.ts
interface Provider {
  name: string;
  ask(messages: Message[], opts?: AskOptions): AsyncIterable<string>;
}

// Swapped purely by config:
// { "model": { "provider": "ollama", "name": "llama3.2" } }
// → uses OllamaAdapter, zero code change
```

Wire at least 2 adapters in Phase 0: `anthropic` (primary) + `ollama` (local fallback).
The interface is the contract — Phase 1 plugins can add new providers.

---

## 7. Acceptance Criteria

Phase 0 is complete when ALL of these pass:

- [ ] `vas --version` prints version, exits 0
- [ ] `vas --help` lists all registered commands with descriptions, exits 0
- [ ] Unknown command → exits 2 with helpful "did you mean?" message
- [ ] Thrown `CliError` → clean stderr message + correct exit code (never 0 on failure)
- [ ] Config loads from `.vasrc.json` with zod validation; invalid config shows clear error
- [ ] Permission `ask` mode prompts before a destructive op; `n` answer aborts
- [ ] Permission `plan` mode outputs plan artifact without executing
- [ ] `anthropic` provider streams a response from `claude-sonnet-4-5`
- [ ] `ollama` provider works with a local model (e.g. `llama3.2`)
- [ ] Swapping provider in config works without code change
- [ ] Plugin placed in `plugins/` is auto-discovered and its commands appear in `--help`
- [ ] `npm run build` produces a runnable `dist/index.js`
- [ ] `npm link` makes `vas` callable from anywhere
- [ ] All integration tests pass: `npm run test`

---

## 8. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| ESM/CJS interop with plugins | Medium | Pin `"type": "module"` in package.json; document plugin ESM contract |
| oclif too heavyweight | Low | Using custom registry (oclif-inspired, not oclif itself) |
| Ink (React in terminal) complexity | Medium | Start with basic Ink; full reactive TUI in Phase 1 |
| Provider API changes | Medium | Version-pin SDK deps; adapter interface absorbs upstream changes |
| pnpm workspace integration | Low | VAS Desktop is already a pnpm monorepo — follow existing pattern |

---

## 9. What Comes Next (Phase 1 Preview)

Once Phase 0 ships and all acceptance criteria pass, Phase 1 (Skills & Plugins) will be published. It will cover:
- The `SKILL.md` folder system (drop a folder, add a command)
- Plugin packages (bundle skills + MCPs + hooks)
- Hook lifecycle (PreToolUse, PostToolUse, Stop)
- Auto-trigger by description (semantic matching)

The Phase 1 plan will be released in this directory when Phase 0 is merged.
