import {authenticated} from '@/server/api';
import {ForgeData} from '@/server/forge-data';
export const dynamic='force-dynamic';
export async function GET(request:Request){return authenticated(request,async(db,actor)=>({jobs:await new ForgeData(db).jobs(actor)}))}
