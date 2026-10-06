# Manual Premiere test checklist

1. Build and load the manifest in UXP Developer Tool; expect **Premiere MCP** under UXP Plugins.
2. Provision the secure token, start `npm start`, open the panel; expect **Connected / Online**.
3. Run diagnostics; expect project and sequence names or explicit “No active …”.
4. Invoke `premiere_get_status`, active project, active sequence, tracks and clips.
5. Save a disposable project; verify Premiere's modified indicator clears.
6. Add marker “MCP Test” at 12.5s; verify it visually and undo it manually.
7. Import a copied media file from an allowed media directory into a disposable project.
8. Validate and export to an allowed output directory with a known `.epr` preset; verify AME/output. Do not overwrite.
9. Stop/restart the server; verify the panel reconnects and queued read completes.
10. Enable safe mode, preview a destructive test, then confirm; expect `SAFE_MODE_BLOCKED`. Do not disable safe mode on valuable projects.

These are real-host checks and are not represented as automated successes.
