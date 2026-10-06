import { McpServer } from '@modelcontextprotocol/server';
import { registerTools } from './tools/registry.js';
import type { ToolService } from './service.js';
export function createServer(service:ToolService){const server=new McpServer({name:'premiere-pro-mcp',version:'0.1.0'},{capabilities:{logging:{},tools:{listChanged:false}}});const tools=registerTools(server,service);return {server,tools};}
