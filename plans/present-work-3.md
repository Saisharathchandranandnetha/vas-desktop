# Present Work 3 — Subagents & Orchestration (PRIVATE DRAFT)

> **Phase:** 2
> **Status:** Draft. Push to `plans/` only after Phase 1 ships.
> **Prerequisite:** Skills & Plugins system (Phase 1) must be complete.

---

## 1. What Are Subagents & Orchestration?

Subagents are **named, role-based AI instances** that coordinate via message-passing to tackle complex multi-step tasks in parallel or in sequence.

Key concepts:
- **Named subagents:** each has a name + role + system prompt (researcher, coder, tester, reviewer)
- **Message-passing:** agents communicate via SendMessage, not shared mutable state
- **Topologies:** pipeline (A→B→C), fan-out (lead→A,B,C→lead), supervisor (lead↔workers)
- **Background agents:** spawn and continue; lead waits for results
- **Routing:** which agent handles which task; later learned by RL (Phase 6)

---

## 2. Which Existing CLIs Have This?

| CLI | Feature | Approach |
|-----|---------|----------|
| Claude Code | Subagents | Named, isolated, message-passing; routing tables |
| Antigravity | Parallel agents | Fan-out to specialized subagents concurrently; async workflows |
| Devin | Autonomous engineer | Plan → code → test → debug loop; dynamic re-planning |
| Goose | General agent | Activity-based; local-first |
| Roo Code | Multi-mode | Mode switching = persona switching |
| OpenAI Codex | Parallel agents | Multiple agents in parallel (newer feature) |

---

## 3. Deep Comparison

### Claude Code — Subagents

**Architecture:**
- Each subagent = isolated Claude instance with own context (no shared mutable state)
- Named: `researcher`, `coder`, `tester`, `reviewer` (user-defined roles)
- `run_in_background`: lead spawns subagent and continues; waits for completion signal
- Routing tables: static map of task-type → agent-role
- Message-passing: structured JSON messages between agents

**What we take:**
- ✅ Isolation: each subagent gets only what it needs
- ✅ Named roles = system prompts (user-definable)
- ✅ Background spawn + result collection
- ✅ Routing tables (static now, RL in Phase 6)

### Antigravity — Parallel Agents

**Architecture:**
- Central "shared agent harness" — fan out tasks to fleet of specialized subagents
- Async: background tasks don't block terminal session
- Same backend as desktop app = consistent behavior everywhere

**What we take:**
- ✅ Fan-out topology as a first-class pattern
- ✅ Async workflows (spawn + continue without blocking)

### Devin — Autonomous Loop

**Architecture:**
- Plan → Code → Test → Debug → Deploy loop
- Dynamic re-planning: if plan fails, agent revises and retries automatically
- Cloud sandbox per task

**What we take:**
- ✅ Plan-execute-verify loop (not just "write code")
- ✅ Dynamic re-planning seed (full impl: Phase 9)

---

## 4. Our Implementation Plan

### 4.1 Agent Definition

```markdown
<!-- agents/researcher/agent.md -->
---
name: researcher
role: researcher
description: "Searches the codebase, web, and docs to gather context for a task"
tools: [read_file, search_web, grep]
---
You are a researcher. Your job is to gather context and summarize findings.
Never write code. Never make edits. Only gather and summarize.
```

### 4.2 File Structure

```
src/core/
  agent.ts          # spawn(name, prompt) → AgentInstance; SendMessage(to, msg)
  topology.ts       # pipeline(), fanout(), supervisor() helpers
agents/
  researcher/agent.md
  coder/agent.md
  tester/agent.md
  reviewer/agent.md
```

### 4.3 Topologies

```typescript
// Fan-out: all at once
await topology.fanout(lead, [researcher, coder], task);

// Pipeline: sequential
await topology.pipeline([researcher, coder, tester], task);

// Supervisor: lead directs workers
await topology.supervisor(lead, [worker1, worker2], task);
```

### 4.4 Build Steps

1. `core/agent.ts`: `spawn(name, prompt)` creates isolated model context; `SendMessage(to, msg)` routes messages
2. `core/topology.ts`: `pipeline()`, `fanout()`, `supervisor()` helpers
3. Default agent definitions (researcher, coder, tester, reviewer) as `agents/*/agent.md`
4. Wire lifecycle hooks: subagents emit `AgentStart`/`AgentStop` events
5. `vas agent spawn <role> "<task>"` command
6. Integration test: 2-agent pipeline (researcher → coder) produces expected output

### 4.5 Acceptance Criteria

- [ ] `vas agent spawn researcher "..."` runs and returns a result
- [ ] `SendMessage` delivers between named agents
- [ ] Pipeline completes in order (A result → B input)
- [ ] Background agents run; lead resumes on completion
- [ ] Fan-out: 3 agents spawn concurrently, results collected
- [ ] `AgentStart` / `AgentStop` hooks fire correctly

---

## 5. Risks

| Risk | Mitigation |
|------|-----------|
| LLM API cost per subagent | Use cheap models (haiku/mini) for simple agents; expensive only for complex |
| Context isolation | Each agent gets only its assigned context; no shared mutable state |
| Routing accuracy | Static tables for now; RL improvements in Phase 6 |
