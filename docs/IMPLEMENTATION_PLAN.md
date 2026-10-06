# Implementation plan

## Verified baseline (31 July 2026)

- Node.js 20+, TypeScript strict mode, npm workspaces.
- MCP TypeScript SDK v2 package layout: `@modelcontextprotocol/server` with stdio transport.
- Premiere Pro 25.6+, UXP 8.1+, manifest v5. The plugin imports `premierepro` and acts as a WebSocket client.
- Local bridge: authenticated `ws://127.0.0.1`, HMAC-SHA256 envelopes, timestamp/nonce replay protection, bounded queue, heartbeat, payload and rate limits.

## Adobe API support matrix

| Capability | Status | Verified API |
|---|---|---|
| Active project, path, save | Supported | `Project.getActiveProject`, `Project.path`, `Project.save` |
| Project backup | Supported with caveat | UXP filesystem copy; does not change active project |
| Project tree/bins/import | Supported | `Project.getRootItem`, `FolderItem`, `Project.importFiles` |
| Active/list/create sequences | Supported | `getActiveSequence`, `getSequences`, `createSequenceFromMedia` |
| Rename sequence | Supported | project-item rename action in transaction |
| Duplicate sequence | Supported | `Sequence.createCloneAction` in project transaction |
| Tracks/clips/playhead/duration | Supported | Sequence track/count/player/end APIs and track-item APIs |
| Markers | Supported | `Markers.getMarkers`, marker actions in transaction |
| Export | Supported | `EncoderManager.exportSequence`, AME events |
| Enumerate export presets | Unsupported | No documented enumeration API; caller supplies an allowlisted preset path |
| Cancel an export | Unsupported | Render-cancel event exists, but no documented cancel method |
| AI editing features | Deferred | Interfaces/schemas only; external analysis services required |

Sources: Adobe Premiere UXP API reference v25.6 and network/manifest recipes; official MCP TypeScript SDK server guide.

## Phases and gates

1. Foundation: workspaces, shared protocol/validation/logger, configuration. Gate: typecheck and unit tests.
2. MCP server: strict tool registry, adapter abstraction, mock adapter, stdio. Gate: MCP integration tests.
3. Bridge: loopback WebSocket, authenticated envelopes, replay/rate/queue/timeout controls. Gate: bridge tests.
4. UXP plugin: panel, reconnecting client, validated dispatcher, isolated Premiere adapter. Gate: bundle/package.
5. Safety: allowlisted paths, safe mode, preview/confirm tokens, audit activity.
6. Documentation and final quality gates.

Real Premiere execution cannot be automated here. Automated tests use the explicitly named mock adapter; real-host behavior remains subject to the manual checklist.
