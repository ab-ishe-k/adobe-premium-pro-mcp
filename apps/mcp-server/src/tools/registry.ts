import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import { PremiereMcpError } from '@premiere-mcp/protocol';
import { EmptyInputSchema, MarkerInputSchema, TrackInputSchema, CreateSequenceSchema, ImportMediaSchema, ExportRequestSchema, ConfirmationSchema, PreviewSchema, SafeModeSchema, IdSchema, RenameSequenceSchema, PlayheadSchema, SequenceNameSchema, EditPlanInputSchema, EditPlanConfirmationSchema } from '@premiere-mcp/validation';
import { TOOLS } from '../adapters/mock.js';
import type { ToolService } from '../service.js';

const inputSchemas:Record<string,z.ZodObject>={
  premiere_create_bin:z.object({name:SequenceNameSchema}).strict(),premiere_import_media:ImportMediaSchema,premiere_create_sequence:CreateSequenceSchema,
  premiere_rename_sequence:RenameSequenceSchema,premiere_duplicate_sequence:IdSchema,premiere_get_sequence_details:IdSchema,premiere_list_clips:TrackInputSchema,
  premiere_set_playhead_position:PlayheadSchema,premiere_add_marker:MarkerInputSchema,premiere_validate_export_request:ExportRequestSchema,premiere_export_sequence:ExportRequestSchema,premiere_get_export_status:IdSchema,
};
const descriptions:Record<string,string>={premiere_list_export_presets:'Unsupported in current UXP: reports the documented capability limitation.',premiere_cancel_export:'Unsupported in current UXP: reports the documented capability limitation.'};
export function registerTools(server:McpServer,service:ToolService):string[]{
  const names=[...TOOLS,'premiere_validate_edit_plan','premiere_preview_edit_plan','premiere_execute_edit_plan','premiere_preview_operation','premiere_confirm_operation','premiere_cancel_operation','premiere_set_safe_mode','premiere_get_safe_mode'];
  const special:Record<string,z.ZodObject>={premiere_validate_edit_plan:EditPlanInputSchema,premiere_preview_edit_plan:EditPlanInputSchema,premiere_execute_edit_plan:EditPlanConfirmationSchema,premiere_preview_operation:PreviewSchema,premiere_confirm_operation:ConfirmationSchema,premiere_cancel_operation:ConfirmationSchema,premiere_set_safe_mode:SafeModeSchema};
  for(const name of names){const schema=inputSchemas[name]??special[name]??EmptyInputSchema;server.registerTool(name,{description:descriptions[name]??`Premiere Pro operation: ${name}`,inputSchema:schema.shape},async(args:Record<string,unknown>)=>{try{const data=await service.invoke(name,args);return {content:[{type:'text' as const,text:JSON.stringify({ok:true,data},null,2)}],structuredContent:{ok:true,data}};}catch(error){const e=error instanceof PremiereMcpError?error:new PremiereMcpError('INTERNAL_ERROR',error instanceof Error?error.message:'Unknown error');return {isError:true,content:[{type:'text' as const,text:`${e.code}: ${e.message}`}],structuredContent:{ok:false,error:{code:e.code,message:e.message,details:e.details}}};}});}
  return names;
}
