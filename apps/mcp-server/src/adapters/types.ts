export interface PremiereState { connected:boolean; projectName:string|null; sequenceName:string|null }
export interface PremiereAdapter { execute(tool:string,args:Record<string,unknown>):Promise<unknown>; state():Promise<PremiereState>; capabilities():Record<string,boolean>; }
