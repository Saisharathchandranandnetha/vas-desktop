# Present Work 6 — Team Collaboration via CRDT (PRIVATE DRAFT)

> **Phase:** 5 | **Status:** Draft | **Prerequisite:** Memory System (Phase 4)
> **PRIORITY: #1 DIFFERENTIATOR** — No existing CLI has real-time multi-user collaboration.

---

## 1. What is Team Collaboration?

Multiple users working on the **same project simultaneously** in their own terminals:
- Real-time sync of project state (files, tasks, shared memory)
- Live **presence** — see who else is active, what they're working on
- **Offline-first** — edits apply instantly without a server; merge automatically on reconnect
- **Conflict-free** — CRDT guarantees convergence, no manual conflict resolution

This is Figma/Linear-style collaboration, but for CLI-based AI workflows.

---

## 2. Who Has This?

**Nobody.** This is a genuine gap.

| CLI | Collaboration status |
|-----|---------------------|
| Claude Code | Session export/import only. No real-time sync. |
| Codex | None |
| Aider | None |
| Cline | None |
| Goose | None |
| Antigravity | None |
| All others | Single-user only |

This is Ruflo's strongest differentiator.

---

## 3. CRDT Research (Why Yjs over Automerge)

| | Yjs | Automerge |
|---|-----|-----------|
| Awareness (presence) | First-class `y-protocols/awareness` | None built-in |
| Bundle size | ~10KB gz | ~50-100KB+ (WASM) |
| Ecosystem | CodeMirror, Monaco, ProseMirror, y-websocket, y-leveldb, Liveblocks | `automerge-repo` only |
| Node support | Full | Full |
| Performance | Fast, low memory | Improved in 2.x but historically heavier |

**Decision: Yjs** — awareness (presence) is exactly what multi-user CLI needs, and the provider ecosystem is far larger.

---

## 4. Architecture

```
core/sync/
  doc.ts          # Y.Doc per project (room = project ID); typed accessors
  server.ts       # y-websocket sync server (ws + Fastify integration)
  persist.ts      # y-leveldb offline store; load on start, save on change
  awareness.ts    # Presence: {userId, color, cursor, currentTask}
  auth.ts         # Project token/JWT validation at WebSocket handshake
```

### Transport
- **Live sync:** y-websocket → sync server (can live on existing Fastify backend)
- **Offline:** y-leveldb local store; edits apply instantly; incremental diff sync on reconnect
- **P2P option:** y-webrtc for serverless mesh (needs signaling server)

### Auth Model
- Each user has a `userId` + `color` (generated on first join)
- `projectToken` validated at WebSocket connection
- Presence is ephemeral (not persisted); doc state is persisted

---

## 5. Build Steps

1. Add: `yjs`, `y-websocket`, `y-leveldb`, `y-protocols`
2. `core/sync/doc.ts`: create/load Y.Doc per project; typed `YMap`/`YArray` accessors
3. `core/sync/persist.ts`: local offline store; load-on-start, save-on-change
4. `core/sync/server.ts`: standalone WS server; `setupWSConnection` from y-websocket
5. `core/sync/auth.ts`: validate project token; reject unauthorized connections
6. `core/sync/awareness.ts`: presence broadcast; show active users
7. Commands: `vas project join <id>` / `vas project sync` / `vas project who`
8. Integration test: two offline users edit same project; merge losslessly on reconnect

## 6. Acceptance Criteria

- [ ] Two users join same project; both see live presence
- [ ] Concurrent offline edits merge losslessly on reconnect
- [ ] Unauthorized connection rejected by token auth
- [ ] State survives restart (persistence)
- [ ] `vas project who` shows active users with their colors

---

## 7. Risks
- Sync server scaling (stateful rooms) — start single-instance; shard by project later
- CRDT resists schema invariants — enforce app-level guards on doc shape
- Large binaries don't belong in doc — store refs, sync blobs separately
- y-leveldb native module install — offer y-redis as pure-JS fallback
