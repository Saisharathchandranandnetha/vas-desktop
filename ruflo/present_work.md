# Present Work — Core CLI Research & Implementation Plan

> **Purpose:** Single file to push to the team repo. Contains (a) a comprehensive survey of
> how today's trending AI CLIs built their *core*, and (b) Ruflo's own core-CLI
> implementation plan at the bottom.
>
> **Context:** Ruflo is a from-scratch TypeScript/Node CLI (committed language decision, see
> `goal-research.md`). It aggregates dev-tool capabilities behind one command grammar, then
> grows features (skills, subagents, CRDT team collab, RL loop). This file focuses on *Phase 0:
> the stable core*, informed by how others built theirs.
>
> **VERIFICATION NOTE:** Network egress in the working sandbox is allowlisted to a single host,
> so live web verification was not possible. Architecture claims are from training knowledge
> (cutoff ~Jan 2026) and should be re-checked before implementation. Names/versions for
> "Antigravity", "OpenCode" internals, etc. are flagged where uncertain — do not treat as fact.

---

## 1. Comprehensive list of trending AI coding CLIs

The landscape, grouped by archetype (so we don't miss any):

**Agentic CLI (the core comparison set):**
1. Claude Code — Anthropic
2. OpenAI Codex CLI — OpenAI
3. Gemini CLI — Google
4. Qwen Code — Alibaba (fork of Gemini CLI)
5. OpenCode — open-source (SST/ejby lineage)
6. Aider — Paul Gauthier (open-source)
7. Cline — open-source (VS Code extension + agent)
8. Roo Code / Kilo Code — open-source (Cline forks)
9. Continue — open-source (IDE-agnostic)
10. Amp — Sourcegraph
11. Goose — Block (open-source agentic framework)
12. Kiro — Amazon (agentic, CLI-ish)
13. GitHub Copilot CLI (`gh copilot`) — GitHub/Microsoft
14. Antigravity — Google *(UNVERIFIED — see §3.14)*

**Shell / terminal intelligence (relevant to the earlier "gaps" discussion):**
15. Warp — Rust terminal (not an agent, but terminal-intel leader)
16. Nushell — Rust structured shell
17. Open Interpreter — Python local code-execution agent

**Local model runners (provider layer):**
18. Ollama CLI
19. Jan

**Cloud agents (context, not CLI-core models):**
20. Devin — Cognition
21. Droid — Factory
22. Cursor / Windsurf — agentic IDEs (inform the UX, not the CLI core)

**Foundations:**
23. Claude Agent SDK — the SDK Claude Code is built on

---

## 2. Per-CLI core architecture deep dive

### 2.1 Claude Code (Anthropic)
- **Architecture:** TypeScript, built on the **Claude Agent SDK**. Core loop = REPL →
  agentic tool-use (read/write/edit/shell/grep). Layered on top: **skills** (`SKILL.md`
  folders, auto-triggered by description), **subagents** (named, message-passing), **hooks**
  (PreToolUse/PostToolUse/PreCompact/Stop lifecycle), **permission modes** (default-ask /
  plan / bypass), **memory files** (`memory/` + `MEMORY.md` index), oclif-style command
  discovery.
- **Why:** TS maximizes ecosystem + agent-SDK leverage; skills/hooks give safe extensibility
  without forking; permission modes make autonomous execution survivable in prod; memory
  gives cross-session continuity.
- **Take:** skills system, hook lifecycle, subagent message-passing, and a *permission model
  as a first-class core concern* — all directly inform Ruflo Phases 1–4. This is the closest
  template to what we want.

### 2.2 OpenAI Codex CLI
- **Architecture:** TypeScript/Node, deliberately **lightweight**. Minimal TUI, strong
  **auto-accept / autonomous mode**, explicit `reasoning effort` control, streaming, tight
  token/cost visibility.
- **Why:** lightweight + cheap + fast loops for well-scoped tasks; opinionated minimalism
  over feature sprawl.
- **Take:** a *minimal viable core* is a legitimate choice — don't over-engineer Phase 0.
  Auto-accept loop + cost visibility are good defaults for a "fast" path.

### 2.3 Gemini CLI (Google)
- **Architecture:** TypeScript/Node, **extension system** (extensions add tools/commands),
  very **long context** handling, open-weight model option, scriptable/CI-friendly.
- **Why:** long context lets it ingest large repos in one shot; extension system mirrors
  plugin thinking; open-weight option for self-host.
- **Take:** extension/plugin boundary as a core primitive; design context ingestion for large
  inputs from day one.

### 2.4 Qwen Code (Alibaba)
- **Architecture:** TypeScript, a **fork of Gemini CLI**, repointed at Qwen models + Chinese
  ecosystem (DashScope).
- **Why:** fork to skip years of core work; adapt provider + localization.
- **Take:** **provider abstraction is non-negotiable** — build the model layer swappable so a
  fork/retarget is a config change, not a rewrite.

### 2.5 OpenCode (open-source)
- **Architecture:** *(UNVERIFIED internals)* Believed Go-based terminal agent, provider-
  agnostic, TUI, session management. Single static binary.
- **Why (inferred):** Go → single cross-platform binary, no runtime dependency, fast startup.
- **Take:** provider abstraction + single-binary distribution as a goal; we get that via npm +
  esbuild (no native binary needed) but the *provider-agnostic* lesson is key.

### 2.6 Aider (Paul Gauthier)
- **Architecture:** Python. Signature feature = **repo-map** (compresses the repo into a
  token-efficient map for the model), **diff-based editing** (edits applied as patches, easy
  to review/undo), deep **git integration**, architect/chat roles.
- **Why:** Python = ML-ecosystem native; repo-map solves context-window cost; diff-based
  edits are safe + reviewable.
- **Take:** **context compression (repo-map)** and **diff-based, reviewable edits** are the
  two ideas worth stealing for any coding agent — including Ruflo's subagent layer.

### 2.7 Cline / Roo Code / Kilo Code
- **Architecture:** TypeScript, VS Code extension agent (Cline origin), now forked (Roo, Kilo).
  Human-in-the-loop approve-every-step, tool use, MCP support.
- **Why:** TS for extension ecosystem; forks show the market wants configurability.
- **Take:** **MCP support** as a tool-source primitive (Ruflo Phase 3); approve-step UX.

### 2.8 Continue
- **Architecture:** TypeScript, IDE-agnostic, own config/context format, local+cloud models.
- **Why:** IDE-agnostic = wider reach than a single editor.
- **Take:** portable context format; don't lock to one host environment.

### 2.9 Amp (Sourcegraph)
- **Architecture:** *(UNVERIFIED)* Agent with strong code-search heritage (Sourcegraph).
- **Why (inferred):** leverages code intelligence/graph for grounding.
- **Take:** grounding answers in real code-graph > guessing.

### 2.10 Goose (Block)
- **Architecture:** *(UNVERIFIED; likely Rust or TS)* Open-source agentic framework, provider-
  agnostic, **extension/activity** system, local-first.
- **Why:** local-first + extensions = private + extensible.
- **Take:** local-first privacy stance (echoes the "institutional command memory" privacy
  paradox from earlier discussion).

### 2.11 Kiro (Amazon)
- **Architecture:** Agentic, spec-driven (requirements → design → tasks). CLI-ish.
- **Why:** spec-driven keeps agents on-track vs. wandering.
- **Take:** spec/plan artifacts as first-class (relates to Ruflo `present_work` discipline).

### 2.12 GitHub Copilot CLI (`gh copilot`)
- **Architecture:** TypeScript, lives inside the `gh` CLI as a subcommand; auth via GitHub.
- **Why:** piggyback on `gh`'s installed base + auth.
- **Take:** a CLI can *extend an existing CLI* rather than replace it — relevant to our meta-
  CLI aggregator thesis (wrap, don't rebuild).

### 2.13 Antigravity (Google) — UNVERIFIED
- **Status:** I could not verify this as a shipping, named CLI during planning (egress
  blocked). It may refer to Google's Gemini-based agent/IDE effort. **Do not treat the
  following as fact.**
- **If real:** expected TS/Node, Gemini-backed, agentic.
- **Action:** confirm with the team / live search before citing. Listed because you named it.

### 2.14 Warp (terminal intelligence)
- **Architecture:** Rust terminal (not an agent). Blocks/commands as shareable units, AI
  command search, individual-first.
- **Why:** Rust for a fast terminal; individual-first product posture.
- **Take:** "commands as structured units" + AI search = directly relevant to the
  institutional-command-memory gap (#1 from earlier). Note Warp is *individual*, not team —
  the opening we identified.

### 2.15 Nushell
- **Architecture:** Rust shell; **everything is structured data** (pipes carry typed tables,
  not text).
- **Why:** structured data enables filtering/pivoting after the fact.
- **Take:** structured output is the right model — but Ruflo should get it via adapters
  (jc-style) without forcing a shell swap (our earlier "structure without switching shells"
  gap, #4).

### 2.16 Open Interpreter
- **Architecture:** Python; executes code locally in a loop, computer-use capable.
- **Why:** local execution = no cloud round-trip, full system access.
- **Take:** local execution path for privacy-sensitive ops.

### 2.17–2.19 Ollama / Jan / Claude Agent SDK
- **Ollama/Jan:** local model runners → provider layer we can target.
- **Claude Agent SDK:** the SDK pattern (spawn agents, message-passing) we mirror in
  `implementations/03-subagents-hooks.md`.

---

## 3. Synthesis — patterns across all of them

1. **TS/Node dominates the agent CLIs** (Claude Code, Codex, Gemini, Qwen, Cline, Copilot).
   Rust/Go appear for terminals (Warp, Nushell) and single-binary agents (OpenCode). Python
   for ML-native (Aider, Open Interpreter). → **Ruflo's TS/Node choice matches the majority
   and the most feature-rich examples.** Confirmed.
2. **Provider abstraction is near-universal** (OpenCode, Goose, Qwen fork, Continue, Ollama).
   → Build the model layer swappable.
3. **Extensibility via plugins/extensions/skills** (Claude Code skills, Gemini extensions,
   Cline MCP, Goose activities). → Ruflo Phase 1 skills/plugins is the right differentiator.
4. **Permission / human-in-the-loop** is the safety spine (Claude Code modes, Cline approve-
   step, Codex auto-accept toggle). → Permission model belongs in Phase 0, not later.
5. **Context efficiency** differs: long-context (Gemini) vs compression (Aider repo-map). →
   Adopt repo-map-style compression for large inputs.
6. **Diff-based, reviewable edits** (Aider) > blind writes. → Edits should produce reviewable
   diffs; pairs with the earlier "time-travel/undo" gap.
7. **Local-first privacy** (Goose, Open Interpreter, Ollama) is a rising theme — critical for
   the institutional-memory moat paradox.
8. **MCP** is becoming the standard tool interface (Cline, others). → Ruflo Phase 3.

**Bottom line:** the winning core shape is *TS/Node + swappable provider + plugin/skill
extensibility + permission model + structured/reviewable edits + MCP tooling*. Ruflo's plan
already aligns; this survey confirms and sharpens it.

---

## 4. OUR IMPLEMENTATION PLAN — Core CLI (Ruflo Phase 0)

Derived from the survey above. Build this FIRST, ship/verify, then layer features.

### 4.1 Principles (from the survey)
- Minimal viable core (Codex lesson) — don't over-build.
- Permission model as a core concern (Claude Code lesson).
- Provider-agnostic model layer (Qwen/OpenCode/Goose lesson).
- Plugin/skill boundary from day one (Gemini/Claude Code lesson).
- Structured, reviewable output (Aider/Nushell lesson).

### 4.2 Stack
- **Language:** TypeScript + Node (confirmed; matches the majority of feature-rich CLIs).
- **Command shell:** oclif (real plugin system + hook lifecycle + auto-discovery).
- **Config:** cosmiconfig + zod (layered, validated).
- **Logging:** pino (stdout = output only, stderr = diagnostics).
- **Errors:** `CliError` + exit codes (0/1/2/>2); top-level handler.
- **Model layer:** provider interface (`openai`/`anthropic`/`gemini`/`ollama` adapters) behind
  one `ask()` call.
- **Build/dist:** esbuild bundle + `npm bin` primary; Homebrew + install-script fallback.
- **Tests:** vitest (unit + integration via `execa` shelling the built binary).

### 4.3 Core modules
```
src/
  index.ts              # entry: config → logger → permission → registry → run
  core/
    registry.ts         # Map<name, CommandDef> + glob discovery
    config.ts           # cosmiconfig + zod
    logger.ts           # pino, stdout/stderr discipline
    error.ts            # CliError + exitCode + handler
    permission.ts       # ask / plan / bypass modes (Claude Code lesson)
    model.ts            # provider interface + adapters (swappable)
    plugin-loader.ts    # skills/plugins/hooks discovery (Phase 1 hook)
    context.ts          # repo-map-style compression helper (Phase 2 seed)
  commands/             # version, help, (later) pcb, etc.
  types.ts              # CommandDef, Adapter, Plugin, Hook, Provider
```

### 4.4 Build steps
1. Scaffold: `package.json` (bin + `"type":"module"`), `tsconfig`, `build.mjs` (esbuild).
2. `core/config.ts` (cosmiconfig + zod), `core/logger.ts` (pino), `core/error.ts`.
3. `core/permission.ts` — three modes; gating wrapper for destructive ops.
4. `core/model.ts` — provider interface + 2 adapters (e.g. anthropic + ollama) to prove swap.
5. `core/registry.ts` + `core/plugin-loader.ts` (discovery only; plugins land Phase 1).
6. `index.ts` wiring + `version`/`help` commands as proof.
7. `vitest`: one integration test running `ruflo --version`, assert exit 0; one permission
   test.
8. `npm run build` → runnable `dist/index.js`; `npm link` → `ruflo` callable.

### 4.5 Acceptance criteria
- `ruflo --version` / `--help` work; correct exit codes (0/1/2).
- Permission mode gates a destructive command (dry-run / ask).
- Model layer swaps provider via config with no code change.
- Unknown command → exit 2 + helpful message.
- One passing integration test.

### 4.6 Open questions (resolve before coding)
- Default permission mode (recommend `ask` for v1).
- Which 2 model providers to wire first (recommend anthropic + ollama for local fallback).
- Plugin discovery source: local `plugins/` + npm packages (recommend both).

---

*Next file to read: `powerful-plan-1.md` (PCB-builder product track + integration into this
core).*
