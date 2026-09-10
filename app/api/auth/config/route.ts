import {env} from 'cloudflare:workers';

export const dynamic='force-dynamic';
export async function GET(){
 const settings=env as unknown as {SUPABASE_URL?:string;SUPABASE_PUBLISHABLE_KEY?:string};
 const url=settings.SUPABASE_URL,key=settings.SUPABASE_PUBLISHABLE_KEY;
 // Expose only the public configuration; never accept a service-role key here.
 if(!url||!key?.startsWith('sb_publishable_'))return Response.json({error:'La connexion par courriel n’est pas encore configurée.'},{status:503,headers:{'Cache-Control':'no-store'}});
 try{const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw Error();}catch{return Response.json({error:'Configuration de connexion invalide.'},{status:503});}
 return Response.json({url,publishableKey:key},{headers:{'Cache-Control':'no-store'}});
}
