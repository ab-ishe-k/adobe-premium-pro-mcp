import { randomUUID } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import { CommandResultSchema, SignedEnvelopeSchema, type Command, type CommandResult, PremiereMcpError } from '@premiere-mcp/protocol';
import { signEnvelope, verifyEnvelope, NonceStore } from '../security/auth.js';
import { BoundedQueue } from './queue.js';
import type { Config } from '../config/index.js';

interface Pending { resolve:(r:CommandResult)=>void; reject:(e:Error)=>void; timer:NodeJS.Timeout }
export class BridgeServer {
  private wss?:WebSocketServer; private plugin:WebSocket|undefined; private readonly queue:BoundedQueue<Command>; private readonly pending=new Map<string,Pending>(); private readonly nonces=new NonceStore(60000); private lastHeartbeat=0;
  constructor(private readonly config:Config){this.queue=new BoundedQueue(config.MAX_QUEUE_SIZE)}
  start(){this.wss=new WebSocketServer({host:this.config.BRIDGE_HOST,port:this.config.BRIDGE_PORT,maxPayload:this.config.MAX_PAYLOAD_BYTES,perMessageDeflate:false}); this.wss.on('connection',(ws)=>this.onConnection(ws));}
  private onConnection(ws:WebSocket){let authenticated=false; ws.on('message',(raw)=>{try{const e=SignedEnvelopeSchema.parse(JSON.parse(raw.toString())); if(!verifyEnvelope(e,new Map([['primary',this.config.BRIDGE_AUTH_TOKEN]]),30000)||!this.nonces.use(e.nonce)) throw new Error('authentication failed'); if(e.type==='hello'){authenticated=true;this.plugin=ws;this.lastHeartbeat=Date.now();this.flush();return;} if(!authenticated||ws!==this.plugin) throw new Error('hello required'); if(e.type==='heartbeat'){this.lastHeartbeat=Date.now();return;} if(e.type==='result'){const result=CommandResultSchema.parse(JSON.parse(e.payload));const p=this.pending.get(result.commandId);if(p){clearTimeout(p.timer);this.pending.delete(result.commandId);p.resolve(result);}}}catch{ws.close(1008,'Invalid authenticated message');}}); ws.on('close',()=>{if(this.plugin===ws)this.plugin=undefined;});}
  async dispatch(command:Command):Promise<CommandResult>{if(this.pending.has(command.commandId))throw new PremiereMcpError('INVALID_ARGUMENT','Duplicate command ID');return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(command.commandId);reject(new PremiereMcpError('COMMAND_TIMEOUT','Premiere command timed out'));},command.timeoutMs);this.pending.set(command.commandId,{resolve,reject,timer});if(this.isConnected())this.send(command);else this.queue.enqueue(command);});}
  private send(command:Command){this.plugin?.send(JSON.stringify(signEnvelope('command',JSON.stringify(command),this.config.BRIDGE_AUTH_TOKEN)));}
  private flush(){for(const c of this.queue.drain())this.send(c)} isConnected(){return this.plugin?.readyState===1&&Date.now()-this.lastHeartbeat<this.config.HEARTBEAT_INTERVAL_MS*3;}
  status(){return {connected:this.isConnected(),queued:this.queue.size,pending:this.pending.size,lastHeartbeat:this.lastHeartbeat||null};}
  async stop(){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new PremiereMcpError('COMMAND_CANCELLED','Server shutting down'));}this.pending.clear();this.plugin?.close(1001,'shutdown');await new Promise<void>((resolve)=>this.wss?.close(()=>resolve())??resolve());}
  newIds(){return {commandId:randomUUID(),requestId:randomUUID()};}
}
