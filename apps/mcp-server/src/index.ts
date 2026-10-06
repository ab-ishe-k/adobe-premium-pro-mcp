#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createLogger } from '@premiere-mcp/logger';
import { loadConfig } from './config/index.js';
import { MockPremiereAdapter } from './adapters/mock.js';
import { BridgeServer } from './bridge/server.js';
import { ToolService } from './service.js';
import { createServer } from './server.js';

async function main(){const config=loadConfig();const logger=createLogger('mcp-server',config.LOG_LEVEL);const bridge=new BridgeServer(config);bridge.start();const adapter=new MockPremiereAdapter();const service=new ToolService(config,adapter,bridge);const {server,tools}=createServer(service);
  if(process.argv.includes('--diagnostics')){process.stderr.write(`${JSON.stringify({ok:true,node:process.version,bridge:bridge.status(),tools:tools.length,mock:config.PREMIERE_MOCK})}\n`);await bridge.stop();return;}
  const shutdown=async()=>{logger.info('Shutting down');await server.close();await bridge.stop();process.exitCode=0;};process.once('SIGINT',()=>void shutdown());process.once('SIGTERM',()=>void shutdown());
  await server.connect(new StdioServerTransport());logger.info({toolCount:tools.length,bridge:bridge.status()},'Premiere MCP server started');}
main().catch((error)=>{process.stderr.write(`Premiere MCP startup failed: ${error instanceof Error?error.message:String(error)}\n`);process.exitCode=1;});
