# Architecture

```text
MCP client --JSON-RPC/stdin+stdout--> McpServer
                                      | validate / authorize / correlate
                                      v
                                bounded dispatcher
                                      | HMAC envelope
                                      v
                       ws://127.0.0.1:32123
                                      |
                         UXP reconnecting client
                                      |
                         isolated command handler
                                      v
                           Premiere DOM / AME
```

The server reserves stdout for MCP. Pino writes redacted records to stderr. A command receives UUID request/command IDs, protocol version, timestamp, nonce, safety metadata, timeout and client identity. The plugin authenticates, acknowledges through the connection, executes, then returns correlated status, timestamps, duration, application state and warnings.

On disconnection, the bounded in-memory queue retains commands until the plugin's authenticated hello. Heartbeats detect stale connections. Exponential reconnect stops after eight attempts. Timeouts reject pending promises; duplicate IDs and nonces are rejected. Shutdown rejects pending commands and closes sockets.

Level 3 lifecycle: preview records operation and affected arguments, returns an opaque one-use token, explicit confirmation consumes it, safe mode is rechecked, execution occurs, and activity captures the outcome. Export validates allowlisted destination/preset paths before EncoderManager dispatch; progress is event-driven where the host supports it.

The `PremiereAdapter` boundary separates real bridge dispatch from deterministic mock behavior. Deferred AI features implement only typed interface contracts because they require transcription, vision, or analysis dependencies not supplied here.
