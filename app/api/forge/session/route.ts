import {authenticated} from '@/server/api';
export const dynamic='force-dynamic';
export async function GET(request:Request){return authenticated(request,async(_db,actor)=>({user:actor}))}
