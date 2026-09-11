import {authenticated} from '@/server/api';
import {ForgeData} from '@/server/forge-data';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 return authenticated(request,async(db,actor)=>({order:await new ForgeData(db).order(actor,id)}));
}
