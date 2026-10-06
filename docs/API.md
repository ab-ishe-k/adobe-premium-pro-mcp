# MCP tool API

All tools return text plus structured `{ok,data}` or `{ok:false,error:{code,message,details?}}`. Schemas are strict: unknown keys yield `INVALID_ARGUMENT`. Common errors include `PREMIERE_NOT_CONNECTED`, `NO_ACTIVE_PROJECT`, `NO_ACTIVE_SEQUENCE`, `COMMAND_TIMEOUT`, `SAFE_MODE_BLOCKED`, `UNSUPPORTED_OPERATION`, and `PREMIERE_API_ERROR`.

| Tool | Level | Input | Result |
|---|---:|---|---|
| premiere_get_status | 1 | `{}` | bridge/host status |
| premiere_get_capabilities | 1 | `{}` | capability map |
| premiere_get_application_info | 1 | `{}` | name/version |
| premiere_run_diagnostics | 1 | `{}` | check report |
| premiere_get_recent_activity | 1 | `{}` | bounded records |
| premiere_get_active_project | 1 | `{}` | project identity |
| premiere_get_project_path | 1 | `{}` | canonical path |
| premiere_save_project | 2 | `{}` | saved flag |
| premiere_create_project_backup | 2 | `{}` | backup path |
| premiere_list_project_items | 1 | `{}` | project items |
| premiere_list_bins | 1 | `{}` | bins |
| premiere_create_bin | 2 | `{name}` | new bin |
| premiere_import_media | 2 | `{paths[],targetBinId?}` | imported paths |
| premiere_get_active_sequence | 1 | `{}` | sequence identity |
| premiere_list_sequences | 1 | `{}` | sequences |
| premiere_get_sequence_details | 1 | `{id}` | metadata |
| premiere_create_sequence | 2 | `{name,mediaItemIds[]}` | new sequence |
| premiere_rename_sequence | 2 | `{sequenceId,name}` | renamed sequence |
| premiere_duplicate_sequence | 2 | `{id}` | clone result |
| premiere_list_tracks | 1 | `{}` | track counts/list |
| premiere_list_clips | 1 | `{mediaType,trackIndex}` | clips |
| premiere_get_playhead_position | 1 | `{}` | seconds |
| premiere_set_playhead_position | 2 | `{timeSeconds}` | updated position |
| premiere_get_timeline_duration | 1 | `{}` | seconds |
| premiere_add_marker | 2 | `{name,comments,timeSeconds,durationSeconds}` | marker |
| premiere_list_markers | 1 | `{}` | markers |
| premiere_list_export_presets | 1 | `{}` | `UNSUPPORTED_OPERATION` |
| premiere_validate_export_request | 1 | `{destination,presetPath,overwrite,queueToAme}` | validation |
| premiere_export_sequence | 2 | same as validation | export/job status |
| premiere_get_export_status | 1 | `{id}` | job status |
| premiere_cancel_export | 3 | `{}` | `UNSUPPORTED_OPERATION` |
| premiere_preview_operation | 1 | `{operation,arguments}` | plan/token/expiry |
| premiere_confirm_operation | 3 | `{token}` | execution/audit result |
| premiere_cancel_operation | 1 | `{token}` | cancellation flag |
| premiere_set_safe_mode | 2 | `{enabled}` | current value |
| premiere_get_safe_mode | 1 | `{}` | current value |

Example request arguments: `{"name":"Intro","comments":"Opening","timeSeconds":12.5,"durationSeconds":0}`. Example success: `{"ok":true,"data":{"created":true}}`. Example error: `{"ok":false,"error":{"code":"NO_ACTIVE_SEQUENCE","message":"No active sequence"}}`.
