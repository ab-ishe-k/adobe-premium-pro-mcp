# AI editing workflow

The MCP client converts natural language into a strict edit plan; the server never executes prose or generated code.

```json
{"version":"1.0","name":"Tight opening","objective":"Trim and mark the opening","createBackup":true,"operations":[{"id":"trim-1","type":"trim_clip","target":{"mediaType":"video","trackIndex":0,"itemIndex":0},"startSeconds":0,"endSeconds":8},{"id":"marker-1","type":"add_marker","name":"Beat","comments":"Review","timeSeconds":2,"durationSeconds":0}]}
```

Mandatory sequence:

1. `premiere_validate_edit_plan` with `{plan}`.
2. `premiere_preview_edit_plan` with the same plan.
3. Show the exact operations, destructive count, warnings, and expiry; obtain explicit user approval.
4. On a disposable project, call `premiere_set_safe_mode` with `{enabled:false}`.
5. Call `premiere_execute_edit_plan` with the one-use preview token.
6. Inspect every operation result and timeline, then re-enable safe mode.

Supported operations are `insert_project_item`, `move_clip`, `trim_clip`, `remove_clip`, `set_clip_enabled`, `add_marker`, `set_playhead`, and `apply_mogrt`. Action changes use Premiere transactions. When requested, a timestamped `.prproj` copy is written to `BACKUP_DIRECTORY` before editing.

Timeline references are zero-based and resolved during execution. Ripple changes can alter later indexes, so removal plans should generally be ordered from the highest position to the lowest.

Silence detection, transcription, scene detection, beat analysis, face tracking, highlight selection, and reframing require external FFmpeg/Whisper/vision adapters. They remain unimplemented and never report success. General effect and caption automation also require verified, allowlisted Premiere component/template mappings.
