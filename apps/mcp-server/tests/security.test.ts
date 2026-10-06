import { describe,expect,it } from 'vitest';
import { signEnvelope,verifyEnvelope,NonceStore } from '../src/security/auth.js';
import { ConfirmationStore } from '../src/security/confirmation.js';
import { BoundedQueue } from '../src/bridge/queue.js';
describe('bridge security',()=>{const token='x'.repeat(32);it('authenticates signed envelopes and rejects tampering',()=>{const e=signEnvelope('hello','{}',token,'primary',1000);expect(verifyEnvelope(e,new Map([['primary',token]]),100,1000)).toBe(true);expect(verifyEnvelope({...e,payload:'evil'},new Map([['primary',token]]),100,1000)).toBe(false);});it('prevents nonce replay',()=>{const n=new NonceStore(1000);expect(n.use('a',10)).toBe(true);expect(n.use('a',11)).toBe(false);});});
describe('bounded state',()=>{it('expires one-use confirmations',()=>{const s=new ConfirmationStore(10);const c=s.create('op',{},0);expect(s.consume(c.token,5).operation).toBe('op');expect(()=>s.consume(c.token,5)).toThrow();});it('enforces queue limit',()=>{const q=new BoundedQueue<number>(1);q.enqueue(1);expect(()=>q.enqueue(2)).toThrow();});});
