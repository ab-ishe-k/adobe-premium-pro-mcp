import { randomBytes, createHash } from 'node:crypto';
import { PremiereMcpError } from '@premiere-mcp/protocol';
interface Entry { hash: string; operation: string; args: Record<string,unknown>; expires: number }
export class ConfirmationStore { private readonly entries = new Map<string,Entry>(); constructor(private readonly ttlMs: number) {}
  create(operation: string,args: Record<string,unknown>,now=Date.now()) { const token=randomBytes(32).toString('base64url'); const id=randomBytes(12).toString('hex'); this.entries.set(id,{hash:createHash('sha256').update(token).digest('hex'),operation,args,expires:now+this.ttlMs}); return {token:`${id}.${token}`,expiresAt:now+this.ttlMs}; }
  consume(value:string,now=Date.now()):Entry { const [id,token]=value.split('.'); if(!id||!token) throw new PremiereMcpError('INVALID_ARGUMENT','Malformed confirmation token'); const e=this.entries.get(id); this.entries.delete(id); if(!e||e.expires<now) throw new PremiereMcpError('CONFIRMATION_EXPIRED','Confirmation token expired or already used'); if(createHash('sha256').update(token).digest('hex')!==e.hash) throw new PremiereMcpError('INVALID_ARGUMENT','Invalid confirmation token'); return e; }
  cancel(value:string):boolean { const id=value.split('.')[0]; return id ? this.entries.delete(id) : false; }
}
