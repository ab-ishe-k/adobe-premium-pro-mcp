import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { SignedEnvelope } from '@premiere-mcp/protocol';
export function signEnvelope(type: SignedEnvelope['type'], payload: string, token: string, keyId = 'primary', now = Date.now()): SignedEnvelope {
  const nonce = randomBytes(18).toString('base64url'); const data = `${type}.${keyId}.${now}.${nonce}.${payload}`;
  return { type, keyId, timestamp: now, nonce, payload, signature: createHmac('sha256', token).update(data).digest('hex') };
}
export function verifyEnvelope(e: SignedEnvelope, tokens: ReadonlyMap<string,string>, maxAgeMs: number, now = Date.now()): boolean {
  if (Math.abs(now - e.timestamp) > maxAgeMs) return false; const token = tokens.get(e.keyId); if (!token) return false;
  const expected = createHmac('sha256', token).update(`${e.type}.${e.keyId}.${e.timestamp}.${e.nonce}.${e.payload}`).digest(); const actual = Buffer.from(e.signature, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export class NonceStore { private readonly seen = new Map<string,number>(); constructor(private readonly ttlMs: number, private readonly max = 10000) {} use(nonce: string, now = Date.now()): boolean { for (const [n,t] of this.seen) if (now-t > this.ttlMs) this.seen.delete(n); if (this.seen.has(nonce)) return false; if (this.seen.size >= this.max) this.seen.delete(this.seen.keys().next().value as string); this.seen.set(nonce,now); return true; } }
