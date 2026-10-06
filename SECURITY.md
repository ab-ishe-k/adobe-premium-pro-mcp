# Security

## Threat model

The system assumes the Windows account and Premiere installation are trusted, but other local processes, malicious MCP arguments, replayed traffic, traversal paths, oversized payloads, and accidental destructive edits are hostile. The bridge binds only `127.0.0.1`; this is isolation, not authentication.

Messages are HMAC-SHA256 signed with a 32+ character token stored in environment configuration and UXP secure storage. Signatures use constant-time comparison; timestamp windows and bounded nonce storage prevent replay. Rotation is supported by envelope `keyId` and can be performed by restarting both endpoints with a new secret. Tokens, signatures, authorization headers, and sensitive content are redacted from stderr logs.

Paths are resolved canonically and compared with `path.relative` against media/export/backup allowlists. Inputs cannot contain commands; no `eval`, generated code, shell invocation, or remote URL operation is present. Payload, queue, rate, input-length, timeout, and activity limits constrain resource use.

Level 3 work requires a preview and single-use expiring confirmation token. Safe mode blocks it globally. Backups should be manually verified before real destructive testing; unsupported operations fail closed.

Report vulnerabilities privately to repository maintainers with reproduction steps. Do not include tokens, project files, media, or personal metadata. Rotate any exposed token immediately.
