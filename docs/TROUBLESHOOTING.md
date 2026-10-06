# Troubleshooting

- Client cannot find server: run `npm run build`, use an absolute `dist/index.js` path, confirm Node 20+, then list the client's registered MCP servers.
- Server exits: run `npm run diagnostics`; missing or short token, non-loopback host, invalid directories, or a busy port are startup errors.
- Plugin cannot connect / network permission: use Premiere 25.6+, load the built manifest, keep port 32123 aligned, and reload after manifest edits.
- Invalid token: provision exactly the same token in UXP secure storage and `.env`, then restart both sides. Never paste it into the panel.
- No active project/sequence: open and focus one in Premiere, then run diagnostics.
- Unsupported API: capability responses are intentional; consult `IMPLEMENTATION_PLAN.md` before adding a documented newer API.
- Export failure: verify AME, preset file, allowed destination, existing-file policy, and available disk space.
- Plugin reload: disconnect, stop the server, reload from UXP Developer Tool, restart, then reconnect.
- Port in use: choose another loopback port and update `.env`, manifest permission, and plugin URL together, then rebuild.
