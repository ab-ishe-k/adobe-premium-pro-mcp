import { randomUUID } from 'node:crypto';
import { PROTOCOL_VERSION, PremiereMcpError, type Command, type CommandResult, type SafetyLevel } from '@premiere-mcp/protocol';
import type { Config } from './config/index.js';
import type { PremiereAdapter } from './adapters/types.js';
import type { BridgeServer } from './bridge/server.js';
import { ConfirmationStore } from './security/confirmation.js';
import { validateEditPlan } from './edit-plans.js';
import { canonicalAllowedPath, validateMediaPath, type EditPlan } from '@premiere-mcp/validation';

export class ToolService {
  private safeMode:boolean; private readonly confirmations:ConfirmationStore; private readonly activity:Array<Record<string,unknown>>=[];
  constructor(private readonly config:Config,private readonly adapter:PremiereAdapter,private readonly bridge?:BridgeServer){this.safeMode=config.SAFE_MODE;this.confirmations=new ConfirmationStore(config.CONFIRMATION_TOKEN_TTL_MS);}
  async invoke(tool:string,args:Record<string,unknown>):Promise<unknown>{    if(tool==='premiere_validate_edit_plan'){return validateEditPlan(args.plan).summary;}
    if(tool==='premiere_preview_edit_plan'){const validated=validateEditPlan(args.plan);const created=this.confirmations.create('premiere_execute_edit_plan',{plan:validated.plan});return {...validated.summary,requiresConfirmation:true,...created,plan:validated.plan};}
    if(tool==='premiere_execute_edit_plan'){const entry=this.confirmations.consume(String(args.token));if(entry.operation!=='premiere_execute_edit_plan')throw new PremiereMcpError('INVALID_ARGUMENT','Token is not for an edit plan');if(this.safeMode)throw new PremiereMcpError('SAFE_MODE_BLOCKED','Disable safe mode explicitly before executing an edit plan');const validated=validateEditPlan(entry.args.plan);return this.invokeAdapter('premiere_execute_edit_plan',{plan:validated.plan,backupDirectory:this.config.BACKUP_DIRECTORY},3);}
    if(tool==='premiere_set_safe_mode'){this.safeMode=Boolean(args.enabled);if(!this.config.PREMIERE_MOCK)await this.invokeAdapter(tool,{enabled:this.safeMode},2);return {enabled:this.safeMode};}
    if(tool==='premiere_get_safe_mode')return {enabled:this.safeMode};
    if(tool==='premiere_preview_operation'){const operation=String(args.operation);const operationArgs=(args.arguments??{}) as Record<string,unknown>;const created=this.confirmations.create(operation,operationArgs);return {operation,affectedItems:operationArgs,requiresConfirmation:true,...created};}
    if(tool==='premiere_confirm_operation'){const entry=this.confirmations.consume(String(args.token));if(this.safeMode)throw new PremiereMcpError('SAFE_MODE_BLOCKED','Safe mode blocks destructive operations');return this.invokeAdapter(entry.operation,entry.args,3);}
    if(tool==='premiere_cancel_operation')return {cancelled:this.confirmations.cancel(String(args.token))};
    return this.invokeAdapter(tool,args,SAFETY[tool]??1);
  }
  private async invokeAdapter(tool:string,args:Record<string,unknown>,safety:SafetyLevel):Promise<unknown>{
    args=this.secureArguments(tool,args);
    const started=Date.now();try{let result:unknown;if(this.config.PREMIERE_MOCK)result=await this.adapter.execute(tool,args);else{if(!this.bridge)throw new PremiereMcpError('BRIDGE_UNAVAILABLE','Bridge is unavailable');const ids=this.bridge.newIds();const command:Command={protocolVersion:PROTOCOL_VERSION,...ids,toolName:tool,timestamp:Date.now(),nonce:randomUUID().replaceAll('-',''),payload:args,safetyLevel:safety,requiresConfirmation:safety===3,timeoutMs:this.config.COMMAND_TIMEOUT_MS,client:{name:'premiere-pro-mcp',version:'0.1.0'}};const response:CommandResult=await this.bridge.dispatch(command);if(response.status!=='success')throw new PremiereMcpError(response.error?.code??'PREMIERE_API_ERROR',response.error?.message??'Premiere operation failed');result=response.result;}
      this.activity.push({timestamp:Date.now(),tool,durationMs:Date.now()-started,success:true});return result;
    }catch(error){this.activity.push({timestamp:Date.now(),tool,durationMs:Date.now()-started,success:false});throw error;}}
  recent(){return this.activity.slice(-100);}
  private secureArguments(tool:string,args:Record<string,unknown>):Record<string,unknown>{
    try{
      if(tool==='premiere_import_media'){const paths=(args.paths as string[]).map((value)=>validateMediaPath(value,this.config.ALLOWED_MEDIA_DIRECTORIES));return {...args,paths};}
      if(tool==='premiere_export_sequence'||tool==='premiere_validate_export_request'){return {...args,destination:canonicalAllowedPath(String(args.destination),this.config.ALLOWED_EXPORT_DIRECTORIES),presetPath:canonicalAllowedPath(String(args.presetPath),this.config.ALLOWED_MEDIA_DIRECTORIES)};}
      if(tool==='premiere_execute_edit_plan'){const plan=args.plan as EditPlan;const operations=plan.operations.map((operation)=>operation.type==='apply_mogrt'?{...operation,templatePath:canonicalAllowedPath(operation.templatePath,this.config.ALLOWED_MEDIA_DIRECTORIES)}:operation);return {...args,plan:{...plan,operations},backupDirectory:canonicalAllowedPath(String(args.backupDirectory),[this.config.BACKUP_DIRECTORY])};}
      return args;
    }catch(error){throw new PremiereMcpError('INVALID_ARGUMENT',error instanceof Error?error.message:'Path validation failed');}
  }
}
export const SAFETY:Record<string,SafetyLevel>={premiere_save_project:2,premiere_create_project_backup:2,premiere_create_bin:2,premiere_import_media:2,premiere_create_sequence:2,premiere_rename_sequence:2,premiere_duplicate_sequence:2,premiere_set_playhead_position:2,premiere_add_marker:2,premiere_export_sequence:2};
