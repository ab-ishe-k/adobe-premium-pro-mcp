import 'dotenv/config';
import { z } from 'zod';
const bool = z.string().transform((v) => v.toLowerCase() === 'true');
const dirs = z.string().min(1).transform((v) => v.split(';').map((x) => x.trim()).filter(Boolean));
const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'), LOG_LEVEL: z.string().default('info'),
  BRIDGE_HOST: z.literal('127.0.0.1').default('127.0.0.1'), BRIDGE_PORT: z.coerce.number().int().min(1024).max(65535).default(32123),
  BRIDGE_AUTH_TOKEN: z.string().min(32), COMMAND_TIMEOUT_MS: z.coerce.number().int().min(500).max(300000).default(30000),
  HEARTBEAT_INTERVAL_MS: z.coerce.number().int().min(1000).default(5000), MAX_QUEUE_SIZE: z.coerce.number().int().min(1).max(1000).default(100),
  MAX_PAYLOAD_BYTES: z.coerce.number().int().min(1024).max(1048576).default(262144), RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(10000).default(120),
  SAFE_MODE: bool.default(true), ALLOWED_MEDIA_DIRECTORIES: dirs, ALLOWED_EXPORT_DIRECTORIES: dirs, BACKUP_DIRECTORY: z.string().min(1),
  CONFIRMATION_TOKEN_TTL_MS: z.coerce.number().int().min(5000).max(300000).default(60000), PREMIERE_MOCK: bool.default(false),
});
export type Config = z.infer<typeof schema>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config { const parsed = schema.safeParse(env); if (!parsed.success) throw new Error(`Invalid configuration: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`); return parsed.data; }
