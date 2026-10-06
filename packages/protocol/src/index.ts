import { z } from 'zod';

export const PROTOCOL_VERSION = '1.0.0' as const;
export const ErrorCodeSchema = z.enum([
  'PREMIERE_NOT_CONNECTED','NO_ACTIVE_PROJECT','NO_ACTIVE_SEQUENCE','INVALID_ARGUMENT',
  'UNSUPPORTED_OPERATION','COMMAND_TIMEOUT','COMMAND_CANCELLED','CONFIRMATION_REQUIRED',
  'CONFIRMATION_EXPIRED','SAFE_MODE_BLOCKED','PREMIERE_API_ERROR',
  'BRIDGE_AUTHENTICATION_FAILED','BRIDGE_UNAVAILABLE','EXPORT_FAILED','INTERNAL_ERROR',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export const SafetyLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type SafetyLevel = z.infer<typeof SafetyLevelSchema>;
export const ClientInfoSchema = z.object({ name: z.string().min(1).max(80), version: z.string().max(40) }).strict();
export const CommandSchema = z.object({
  protocolVersion: z.literal(PROTOCOL_VERSION), commandId: z.string().uuid(), requestId: z.string().uuid(),
  toolName: z.string().regex(/^premiere_[a-z0-9_]+$/), timestamp: z.number().int().positive(),
  nonce: z.string().min(16).max(128), payload: z.record(z.string(),z.unknown()), safetyLevel: SafetyLevelSchema,
  requiresConfirmation: z.boolean(), timeoutMs: z.number().int().min(100).max(300000), client: ClientInfoSchema,
}).strict();
export type Command = z.infer<typeof CommandSchema>;
export const ProtocolErrorSchema = z.object({ code: ErrorCodeSchema, message: z.string(), details: z.record(z.string(),z.unknown()).optional() }).strict();
export const ApplicationStateSchema = z.object({ connected: z.boolean(), projectName: z.string().nullable(), sequenceName: z.string().nullable() }).strict();
export const CommandResultSchema = z.object({
  protocolVersion: z.literal(PROTOCOL_VERSION), commandId: z.string().uuid(), requestId: z.string().uuid(),
  status: z.enum(['acknowledged','success','error','cancelled']), result: z.unknown().optional(),
  error: ProtocolErrorSchema.nullable(), startedAt: z.number().int(), completedAt: z.number().int(), durationMs: z.number().nonnegative(),
  applicationState: ApplicationStateSchema, warnings: z.array(z.string()),
}).strict();
export type CommandResult = z.infer<typeof CommandResultSchema>;
export const SignedEnvelopeSchema = z.object({ type: z.enum(['hello','command','result','heartbeat','cancel']), keyId: z.string().min(1).max(64), timestamp: z.number().int(), nonce: z.string().min(16).max(128), payload: z.string().max(262144), signature: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export type SignedEnvelope = z.infer<typeof SignedEnvelopeSchema>;

export class PremiereMcpError extends Error {
  constructor(public readonly code: ErrorCode, message: string, public readonly details?: Record<string, unknown>) { super(message); this.name = 'PremiereMcpError'; }
}
