# Deep Research: AGI CLI Core Architecture (2026)

This document synthesizes the parallel deep research conducted across four domains: Core Language Tradeoffs, LLM Provider Abstractions, Permission/Safety Models, and Advanced TypeScript Patterns.

---

## 1. The Core Language Tradeoff: Why TypeScript Wins for AGI

The research confirms that while **Go** and **Rust** have performance advantages, **TypeScript + Node.js** is the definitive choice for an AGI-scale CLI in 2026. 

### Why not Go or Rust?
- **Go (OpenCode, Antigravity):** Excellent for single-binary distribution and cold starts. However, Go struggles massively with dynamic plugin loading (Go plugins are notoriously brittle) and local CRDT integration (no first-class Yjs port exists).
- **Rust (Goose, Warp):** The king of performance and memory safety. It boasts incredible WASM integration and native CRDT ports (`Yrs`). However, writing complex, reactive terminal UIs (TUIs) in Rust is incredibly slow compared to React/Ink, and the iteration speed for a rapidly evolving AGI architecture is a massive bottleneck.

### The TypeScript Advantage (VAS Desktop)
- **Dynamic ESM Loading:** We can `await import(pluginPath)` at runtime to securely load community skills. 
- **CRDT / Yjs:** Node is the native environment for Yjs, making Phase 5 (Team Collaboration) trivial compared to porting to Go.
- **MCP Standard:** The official Model Context Protocol (MCP) SDKs are TypeScript-first.
- **Reactive UIs:** We can use **React + Ink** to treat the terminal as a canvas. When the LLM streams tokens, React state updates the terminal without tearing or flickering, identical to Claude Code.

---

## 2. Advanced TypeScript Patterns for AGI (The Engine)

As the CLI scales to orchestrate multiple subagents and recursive loops, standard `Promise` and `try/catch` architectures turn into spaghetti.

### Adopt `Effect-ts`
The research strongly recommends adopting **Effect (`effect-ts`)**.
1. **Strict Error Typing:** `Effect<Success, Error, Context>` forces you to explicitly handle API limits, parsing errors, or tool failures. 
2. **Graceful Interruption:** If a user presses `Ctrl+C` (SIGINT), Effect's Fiber model cleanly interrupts an entire tree of subagents, kills child processes, and flushes logs automatically.

### Agent Isolation
Never run untrusted or AI-generated plugins in the main event loop.
- **Child Processes:** Use `execa` to spawn subagents or execute shell commands. If a subagent segfaults, the main CLI UI does not crash.
- **Worker Threads:** Offload heavy local tokenization or AST parsing (via Tree-sitter) to `piscina` worker threads.

### Streaming Architecture
- Expose internal APIs using `AsyncIterable<T>`. 
- Use standard Web `AbortController` passed down to *every* asynchronous operation to ensure clean halts.

---

## 3. Provider Abstraction: The "Architect + Editor" Pattern

Do not couple the CLI to the Vercel AI SDK or LangChain. They obscure the prompt and make fine-grained tool streaming difficult. 

### The Tool-Call Loop
Adopt Claude Code's **State-Machine Loop**: a persistent `while(true)` loop that explicitly manages token budgets and context compaction. Instead of relying on the LLM to choose a stop tool, the loop explicitly measures turn limits and budget constraints.

### Tiered Routing (Aider's Pattern)
- **The Architect Model:** Use a heavy reasoning model (e.g., Claude 3.5 Sonnet or OpenAI o1) to act as a system designer. It analyzes the codebase (using a Tree-sitter AST repo-map, not raw `grep`) and outputs a high-level plan.
- **The Editor Model:** Pass the Architect's plan to a faster, cheaper, formatting-specialized model that strictly outputs Unified Diffs (`udiff`). 
- *Impact:* Heavy models fail at strict diff formatting; cheap models fail at complex planning. Combining them (as Aider does) yields state-of-the-art results.

---

## 4. The AGI Permission & Safety Sandbox

Static Role-Based Access Control is dead. As agents become autonomous, the permission model must act as an impenetrable firewall.

### The Three Tiers of Approval
1. **Ask/Suggest:** Explicit approval for every destructive action (Claude Code/Codex).
2. **Plan/Spec-Driven:** The **Kiro/AWS pattern**. Before generating any code, the agent *must* generate formalized artifacts (`requirements.md`, `design.md`) and halt for human approval.
3. **Bypass/Auto:** Only used in isolated CI environments.

### The Sandbox Layer (Antigravity's Pattern)
When the agent executes shell commands, it must not execute with the host's ambient authority.
- **Linux:** Wrap execution in `NsJail` (namespaces, seccomp filters).
- **macOS:** Wrap execution in `sandbox-exec`.
- **Windows:** Use `AppContainer` or lightweight WSL2 execution contexts.
This breaks attack chains (e.g., prompt injection leading to `rm -rf`) at the OS kernel level.

### The "Chaperone" Middleware
Implement a middleware layer (PreToolUse hook) that sits strictly outside the AI's control. It validates tool parameters against Policy-as-Code (e.g., ensuring a git branch follows naming conventions, or a file write does not use `../` path traversal to overwrite `.vscode/settings.json`).
