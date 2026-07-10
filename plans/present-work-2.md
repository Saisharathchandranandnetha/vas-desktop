# Present Work 2 — Skills & Plugins System (PRIVATE DRAFT)

> **Phase:** 1
> **Status:** Draft. Push to `plans/` only after Phase 0 ships.
> **Prerequisite:** `plans/present-work-1.md` (Phase 0) must be complete and merged.

---

## 1. What is the Skills & Plugins System?

The skills and plugins system is the **headline extensibility layer** of VAS Desktop CLI.

- **Skill** = a folder with a `SKILL.md` file that adds a command/behavior to the CLI with zero core changes
- **Plugin** = an npm package that bundles skills + MCP server definitions + hook handlers
- **Hook** = a deterministic script that fires at specific lifecycle events (PreToolUse, PostToolUse, Stop, etc.)

Drop a folder → it's a skill. Install a package → it's a plugin. No config registration needed.

---

## 2. Which Existing CLIs Have This?

| CLI | Feature name | How it works |
|-----|-------------|--------------|
| Claude Code | Skills + Plugins | SKILL.md folder, auto-trigger by description, plugin marketplace |
| Antigravity | Skills + Plugins | Modular, MCP-standard, AGENTS.md project config |
| Gemini CLI | Extensions | 80+ extensions, npm packages, tool/command additions |
| Cline | Custom Tools + MCP | MCP servers as tool providers |
| Roo Code | Modes | Named agent personas (Code, Architect, Ask, Debug) |
| Goose | Activities | Extension framework, MCP-heavy |
| Aider | n/a | No formal plugin system; model-agnostic instead |
| Codex CLI | Minimal | No extension system |

---

## 3. Deep Comparison

### Claude Code — Skills & Plugins

**Use case:** Power users and teams drop skill folders to add specialized behaviors without touching core.

**Why they built it:**
Claude Code needed extensibility without instability. Skills let users add behaviors without forking. Plugins let organizations standardize skills across teams.

**Impact:**
- Plugin marketplace emerging
- Hooks allow security teams to add PreToolUse policy checks without forking
- Skills reduce token inflation by keeping context focused

**Architecture:**
- **Skill:** `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`, `when-to-use`)
- **Trigger:** description-based semantic matching (agent reads description and auto-invokes) + explicit `/skill-name`
- **Plugin:** npm package with `commands/`, `hooks/`, `skills/` exported; registered in config
- **Hooks:** `PreToolUse`, `PostToolUse`, `PreCompact`, `Stop` — each fires at lifecycle event
- **Hook handler:** shell script or TS function; can block, modify, or log

**What we take:**
- ✅ SKILL.md frontmatter design exactly
- ✅ Auto-trigger by description + explicit invocation
- ✅ Plugin = npm package; install + register in config
- ✅ Full hook lifecycle (same events)

---

### Gemini CLI — Extensions

**Use case:** Add integrations (Stripe, Figma, Postgres, GitHub) without touching CLI core.

**Architecture:**
- Extension = npm package added to config
- 80+ community extensions
- Extensions add tools + commands

**What we take:**
- ✅ Extension = npm package (same as our plugin model)
- ✅ 80+ is the target ecosystem size to enable

---

### Roo Code — Modes

**Architecture:** Each mode = different system prompt + tool access policy
- Code mode: full tool access
- Architect mode: no file writes, planning only
- Ask mode: read-only context, no execution
- Debug mode: error-focused

**What we take:**
- ✅ Named agent modes map directly to our permission modes + subagent roles (Phase 2)

---

## 4. Gaps in Existing Implementations

- No CLI has a skill **marketplace with quality scoring**
- No CLI has **team-shared skills** (org-level skills synced via CRDT — Phase 5 integration)
- No CLI has **skill version pinning** (install skill@1.2.3)

---

## 5. Our Implementation Plan

### 5.1 Skill Structure

```
skills/
  commit/
    SKILL.md              # frontmatter: name, description, when-to-use
    scripts/
      run.ts             # optional: executable skill logic
    examples/
      usage.md
```

```yaml
# SKILL.md frontmatter
---
name: commit
description: "Create a git commit with a descriptive message based on staged changes"
when-to-use: "When the user wants to commit, push code, or save their work"
args:
  - name: message
    description: "Optional commit message override"
    required: false
---
# Instructions follow in markdown body
```

### 5.2 Plugin Structure

```typescript
// plugins/my-plugin/index.ts
export default {
  name: 'my-plugin',
  commands: [/* CommandDef[] */],
  hooks: [{ event: 'PreToolUse', handler: async (ctx) => { /* validate */ } }],
  skills: [{ name: 'my-skill', /* ... */ }]
} satisfies Plugin;
```

### 5.3 Hook Lifecycle

| Event | When | Common use |
|-------|------|-----------|
| `PreToolUse` | Before any tool executes | Security check, logging, modify params |
| `PostToolUse` | After tool succeeds | Log result, trigger follow-up |
| `PreCompact` | Before context compaction | Save important context to memory |
| `Stop` | Agent finishes | Cleanup, notifications, summaries |
| `CommandInit` | Before command runs | Auth check, load resources |
| `CommandDone` | After command returns | Telemetry, cleanup |

### 5.4 File Structure

```
src/core/
  trigger.ts        # Match user intent → skill(s) via semantic similarity
  hooks.ts          # EventEmitter for lifecycle; register + fire hooks
  skill-loader.ts   # Scan skills/**/SKILL.md, build skill index
  plugin-loader.ts  # Extended from Phase 0: also loads skills + registers hooks
```

### 5.5 Build Steps

1. Define `Skill`, `Plugin`, `Hook` types in `types.ts`
2. `core/skill-loader.ts`: scan `skills/*/SKILL.md`, parse frontmatter, build index
3. `core/trigger.ts`: semantic match user intent → skill description; explicit `/skill-name` override
4. `core/hooks.ts`: EventEmitter; `emit(event, ctx)` fires all registered handlers
5. Extend `core/plugin-loader.ts`: load plugins from `plugins/*/index.ts` + npm `vas-plugin-*`; register their skills + hooks
6. Ship 2 example skills: `commit` and `research`
7. Document the skill-author contract in `SKILL_CONTRACT.md`
8. Tests: drop a skill folder → it appears in `--help`; hook fires on lifecycle event

### 5.6 Acceptance Criteria

- [ ] Dropping `skills/foo/SKILL.md` makes `vas foo` available with zero core change
- [ ] Auto-trigger: "commit my changes" → commit skill invoked (semantic match)
- [ ] Explicit: `/commit` → commit skill invoked
- [ ] Plugin npm package adds commands + hooks on install + config entry
- [ ] `PreToolUse` hook can block a tool call
- [ ] `PostToolUse` hook receives tool result
- [ ] 2 example skills ship and work

---

## 6. Risks

| Risk | Mitigation |
|------|-----------|
| Trigger false positives | Start conservative (high confidence threshold); log why skill was chosen |
| Plugin security | Validate plugin manifests; sandbox plugin execution (Phase 8 sandbox pattern) |
| ESM plugin loading | Document plugin contract as ESM; enforce in loader |
