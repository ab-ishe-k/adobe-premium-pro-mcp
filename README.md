# Premiere Pro MCP

A local, authenticated Model Context Protocol server and Adobe Premiere Pro UXP panel. MCP clients communicate over stdio; the server binds an HMAC-authenticated WebSocket only to `127.0.0.1`; the panel executes isolated, validated Premiere operations. No cloud service is used.

```text
Codex / Claude / Cursor / VS Code
             | MCP stdio
       Node MCP server
             | signed WebSocket (loopback only)
       Premiere UXP panel
             | official UXP DOM
       Project / timeline / AME
```

## Requirements

- Windows, Node.js 20+, npm 10+
- Premiere Pro 25.6+ and UXP Developer Tool 2.2+
- A project open for project/sequence tools; Adobe Media Encoder for queued exports

## Install and run

1. `npm install`
2. Copy `.env.example` to `.env`. Generate a 32+ character random token and configure canonical media/export/backup directories. Lists use semicolons.
3. `npm run build`
4. Provision the same token once in the UXP Developer Tool console: `require('uxp').storage.secureStorage.setItem('bridgeAuthToken', 'YOUR_TOKEN')`. It is never displayed by the panel.
5. Load `apps/premiere-uxp-plugin/dist/manifest.json` in UXP Developer Tool, start the server with `npm start`, open **Window > UXP Plugins > Premiere MCP**, and click Connect.

Expected panel status is **Connected**, **MCP server: Online**, followed by the active project and sequence names. Run Diagnostics before invoking writes.

## Codex on Windows

Install the Codex CLI according to OpenAI's current official instructions, then build this repository. Replace the example path:

```powershell
codex mcp add premiere-pro --env-file "C:\absolute\path\premiere-pro-mcp\.env" -- node "C:\absolute\path\premiere-pro-mcp\apps\mcp-server\dist\index.js"
codex mcp list
codex mcp remove premiere-pro
```

Configuration-file alternative:

```toml
[mcp_servers.premiere-pro]
command = "node"
args = ["C:\\absolute\\path\\premiere-pro-mcp\\apps\\mcp-server\\dist\\index.js"]
env = { NODE_ENV = "production" }
```

Put the remaining variables in the launcher environment; do not commit the token. Ask Codex to list MCP tools and verify names beginning `premiere_`.

Generic Claude/Cursor/VS Code stdio configuration (consult each client's current location/schema):

```json
{"mcpServers":{"premiere-pro":{"command":"node","args":["C:\\absolute\\path\\premiere-pro-mcp\\apps\\mcp-server\\dist\\index.js"],"env":{"BRIDGE_AUTH_TOKEN":"set-securely","ALLOWED_MEDIA_DIRECTORIES":"C:\\Media","ALLOWED_EXPORT_DIRECTORIES":"C:\\Exports","BACKUP_DIRECTORY":"C:\\Backups"}}}}
```

## Safety model

- Level 1 reads run after validation.
- Level 2 non-destructive writes run after validation and path enforcement.
- Level 3 requires `premiere_preview_operation`, then a second `premiere_confirm_operation` call with a one-use, short-lived token. Safe mode blocks all Level 3 execution.
- Export preset enumeration and export cancellation return `UNSUPPORTED_OPERATION`: Premiere UXP documents neither API. AI editing features are typed but unimplemented and never report success.

## Commands

`npm run dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:integration`, `test:all`, `package:plugin`, `diagnostics`, `format`, and `clean` are root workspace commands.

See [API](docs/API.md), [architecture](docs/ARCHITECTURE.md), [manual testing](docs/MANUAL_TESTING.md), [troubleshooting](docs/TROUBLESHOOTING.md), and [security](SECURITY.md).

For prompt-driven timeline changes, follow the mandatory validate → preview → explicit approval → execute workflow in [AI editing](docs/AI_EDITING.md). Supported plan operations cover clip insertion, movement, trimming, ripple removal, enable/disable, markers, playhead changes, and MOGRT insertion.

## Known limitations

Real Premiere behavior cannot be verified without the host. Automated verification uses `PREMIERE_MOCK=true`. The initial UXP command set deliberately rejects handlers not yet backed by a documented call. Windows loopback `ws://` is used; macOS requires TLS and is outside this build's stated scope.
