import {env} from 'cloudflare:workers';
import {ServiceError,verifiedActor,type IdentitySettings,type VerifiedActor} from './identity';
export async function authenticated(request:Request,run:(db:D1Database,actor:VerifiedActor)=>Promise<unknown>){
 const headers={'Cache-Control':'no-store','Vary':'Authorization','X-Content-Type-Options':'nosniff'};
 try{
  const settings=env as unknown as IdentitySettings&{DB?:D1Database};
  if(!settings.DB)throw new ServiceError(503,'Le stockage central est indisponible.');
  const actor=await verifiedActor(request,settings.DB,settings);
  return Response.json(await run(settings.DB,actor),{headers});
 }catch(error){
  if(error instanceof ServiceError)return Response.json({error:error.message},{status:error.status,headers});
  // Do not log credentials, submitted values, SQL or business records.
  console.error('Forge central request failed');
  return Response.json({error:'Les données centrales sont temporairement indisponibles.'},{status:503,headers});
 }
}
