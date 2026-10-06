import pino, { type Logger } from 'pino';
export function createLogger(component: string, level = 'info'): Logger {
  return pino({ level, base: { component }, redact: { paths: ['token','authToken','authorization','req.headers.authorization','*.token','*.signature'], censor: '[REDACTED]' } }, pino.destination(2));
}
