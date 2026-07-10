# Present Work 5 — Memory System (PRIVATE DRAFT)

> **Phase:** 4 | **Status:** Draft | **Prerequisite:** MCP Tools (Phase 3)

---

## 1. What is the Memory System?

Cross-session, file-based memory so the CLI accumulates context about the user, project, and past interactions.
The agent feels agentic and continuous — it remembers what you told it last week.

Memory types (Claude Code taxonomy):
- **user** — who you are, your role, preferences
- **feedback** — how to work with you, what you like/dislike
- **project** — current initiatives, architecture decisions, context
- **reference** — external pointers (docs, repos, tickets)

---

## 2. Who Has Memory?

| CLI | Memory approach |
|-----|----------------|
| Claude Code | `memory/` dir + `MEMORY.md` index; 4-type taxonomy; survives compaction |
| Aider | Repo-map: compresses entire repo into token-efficient tree |
| Amp | Long-thread memory: hundreds of rounds without state loss |
| Gemini/Antigravity | Long context window (1M+ tokens) — brute force |
| Continue | Portable context format across editors |

---

## 3. Deep Comparison

### Claude Code — Memory Taxonomy

**Architecture:**
- `memory/<type>/<name>.md` files
- `MEMORY.md` index loaded every session
- Written via `memory add` command or agent actions
- Survives context compaction — memory is outside the context window
- Types: user, feedback, project, reference

**What we take:**
- ✅ Same taxonomy (user/feedback/project/reference)
- ✅ File-based store: auditable, version-controllable, portable
- ✅ `MEMORY.md` index pattern

### Aider — Repo-Map

**Architecture:**
- Tree-sitter parses the repo; builds a compressed map of all classes/functions/files
- Map sent to model instead of raw files — massive token savings
- Model understands the whole repo without reading every file

**What we take:**
- ✅ Repo-map as the context compression strategy (seed in Phase 0 `context.ts`, implement fully here)
- ✅ Token-efficient repo understanding before any expensive file reads

---

## 4. Our Implementation Plan

### File Structure
```
core/memory/
  store.ts          # CRUD over <project>/.vas/memory/<type>/<name>.md
  index.ts          # MEMORY.md maintenance: auto-update on every write
  types.ts          # Memory = { type, name, description, body, createdAt }
  context.ts        # Full repo-map implementation (extends Phase 0 stub)
```

### Commands
```
vas memory add <type> <name>    # Create/update a memory entry
vas memory list [type]          # List all memories (optionally filtered)
vas memory get <name>           # Read a memory entry
vas memory forget <name>        # Delete a memory entry
```

### Acceptance Criteria
- [ ] `memory add` persists; survives restart
- [ ] `memory list/get` retrieve correctly
- [ ] `MEMORY.md` index stays in sync (auto-updated)
- [ ] Memory loads into agent context at session start
- [ ] Sensitive-data guard: refuses credentials/PII without explicit consent
- [ ] Repo-map generates a tree-sitter-based compressed context

---

## 5. Risks
- Index drift: regenerate index on every write (never lazy-update)
- Stale memories: provide `memory forget` + `createdAt` freshness
- Memory size: cap per-memory file; index shows sizes
