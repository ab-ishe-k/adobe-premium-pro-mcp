import { PremiereMcpError } from '@premiere-mcp/protocol';
import type { PremiereAdapter, PremiereState } from './types.js';
export class MockPremiereAdapter implements PremiereAdapter {
  connected=true; project:{id:string;name:string;path:string}|null={id:'mock-project',name:'Mock Project',path:'C:\\Projects\\mock.prproj'};
  sequence:{id:string;name:string;durationSeconds:number;playheadSeconds:number}|null={id:'mock-sequence',name:'Main',durationSeconds:60,playheadSeconds:0};
  failNext=false; exports=new Map<string,{status:string;progress:number}>(); activity:Array<Record<string,unknown>>=[];
  capabilities(){return Object.fromEntries(TOOLS.map((x)=>[x,!['premiere_list_export_presets','premiere_cancel_export'].includes(x)]));}
  async state():Promise<PremiereState>{return {connected:this.connected,projectName:this.project?.name??null,sequenceName:this.sequence?.name??null};}
  async execute(tool:string,args:Record<string,unknown>):Promise<unknown>{
    if(this.failNext){this.failNext=false;throw new PremiereMcpError('PREMIERE_API_ERROR','Injected mock failure');}
    if(!this.connected&&tool!=='premiere_get_status')throw new PremiereMcpError('PREMIERE_NOT_CONNECTED','Premiere plugin is not connected');
    const project=()=>{if(!this.project)throw new PremiereMcpError('NO_ACTIVE_PROJECT','No active project');return this.project;};
    const sequence=()=>{if(!this.sequence)throw new PremiereMcpError('NO_ACTIVE_SEQUENCE','No active sequence');return this.sequence;};
    let result:unknown;
    switch(tool){
      case 'premiere_get_status': result={connected:this.connected,mock:true};break;
      case 'premiere_get_capabilities':result=this.capabilities();break;
      case 'premiere_get_application_info':result={name:'Adobe Premiere Pro (mock)',version:'25.6',uxpVersion:'8.1'};break;
      case 'premiere_run_diagnostics':result={ok:true,adapter:'mock',checks:{connection:this.connected,project:!!this.project,sequence:!!this.sequence}};break;
      case 'premiere_get_recent_activity':result=this.activity.slice(-50);break;
      case 'premiere_get_active_project':result=project();break; case 'premiere_get_project_path':result={path:project().path};break;
      case 'premiere_save_project':project();result={saved:true};break; case 'premiere_create_project_backup':result={created:true,path:String(args.path??'mock-backup.prproj')};break;
      case 'premiere_list_project_items':result=[{id:'item-1',name:'clip.mp4',type:'clip'}];break; case 'premiere_list_bins':result=[{id:'root',name:'Root'}];break;
      case 'premiere_create_bin':result={id:'bin-new',name:args.name};break; case 'premiere_import_media':result={imported:args.paths};break;
      case 'premiere_get_active_sequence':result=sequence();break;case 'premiere_list_sequences':result=this.sequence?[this.sequence]:[];break;case 'premiere_get_sequence_details':result={...sequence(),videoTracks:1,audioTracks:1};break;
      case 'premiere_create_sequence':result={id:'sequence-new',name:args.name};break;case 'premiere_rename_sequence':sequence().name=String(args.name);result=sequence();break;case 'premiere_duplicate_sequence':result={...sequence(),id:'sequence-copy',name:`${sequence().name} Copy`};break;
      case 'premiere_list_tracks':result=[{type:'video',index:0},{type:'audio',index:0}];break;case 'premiere_list_clips':result=[{id:'clip-1',name:'clip.mp4',startSeconds:0,endSeconds:10}];break;
      case 'premiere_get_playhead_position':result={timeSeconds:sequence().playheadSeconds};break;case 'premiere_set_playhead_position':sequence().playheadSeconds=Number(args.timeSeconds);result={timeSeconds:sequence().playheadSeconds};break;
      case 'premiere_get_timeline_duration':result={durationSeconds:sequence().durationSeconds};break;case 'premiere_add_marker':result={id:'marker-new',...args};break;case 'premiere_list_markers':result=[];break;
      case 'premiere_execute_edit_plan':{const plan=args.plan as {name:string;operations:Array<{id:string;type:string}>};result={executed:true,planName:plan.name,operationCount:plan.operations.length,operations:plan.operations.map((operation)=>({id:operation.id,type:operation.type,status:'success'})),mock:true};break;}
      case 'premiere_validate_export_request':result={valid:true,...args};break;case 'premiere_export_sequence':{const id='export-1';this.exports.set(id,{status:'queued',progress:0});result={exportId:id,status:'queued'};break;}case 'premiere_get_export_status':result=this.exports.get(String(args.id))??{status:'unknown'};break;
      case 'premiere_list_export_presets':case 'premiere_cancel_export':throw new PremiereMcpError('UNSUPPORTED_OPERATION','Premiere UXP has no documented API for this operation');
      default:throw new PremiereMcpError('UNSUPPORTED_OPERATION',`Unsupported adapter operation: ${tool}`);
    }
    this.activity.push({timestamp:Date.now(),tool,success:true});return result;
  }
}
export const TOOLS=['premiere_get_status','premiere_get_capabilities','premiere_get_application_info','premiere_run_diagnostics','premiere_get_recent_activity','premiere_get_active_project','premiere_get_project_path','premiere_save_project','premiere_create_project_backup','premiere_list_project_items','premiere_list_bins','premiere_create_bin','premiere_import_media','premiere_get_active_sequence','premiere_list_sequences','premiere_get_sequence_details','premiere_create_sequence','premiere_rename_sequence','premiere_duplicate_sequence','premiere_list_tracks','premiere_list_clips','premiere_get_playhead_position','premiere_set_playhead_position','premiere_get_timeline_duration','premiere_add_marker','premiere_list_markers','premiere_list_export_presets','premiere_validate_export_request','premiere_export_sequence','premiere_get_export_status','premiere_cancel_export'] as const;
