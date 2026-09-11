/** Real identities only. Demo roles, email headers and client company IDs are never trusted. */
export type VerifiedActor = {userId:string;companyId:string;name:string;email:string;role:'boss'|'adjointe'|'chef'|'employe'};
export type IdentitySettings = {SUPABASE_URL?:string;SUPABASE_PUBLISHABLE_KEY?:string};
export class ServiceError extends Error {
 constructor(public status:number,message:string){super(message)}
}
export async function verifiedActor(request:Request,db:D1Database,settings:IdentitySettings,fetcher:typeof fetch=fetch):Promise<VerifiedActor>{
 const {SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key}=settings;
 if(!url||!key?.startsWith('sb_publishable_'))throw new ServiceError(503,'La connexion sécurisée n’est pas encore activée.');
 let issuer:URL;
 try{issuer=new URL(url);if(issuer.protocol!=='https:'||issuer.username||issuer.password||issuer.search||issuer.hash||!['','/'].includes(issuer.pathname))throw Error()}catch{throw new ServiceError(503,'Configuration de connexion invalide.')}
 const authorization=request.headers.get('Authorization')||'';
 if(!/^Bearer [^\s]{20,8192}$/.test(authorization))throw new ServiceError(401,'Veuillez vous connecter.');
 let response:Response;
 try{response=await fetcher(`${issuer.origin}/auth/v1/user`,{headers:{Authorization:authorization,apikey:key},redirect:'error',signal:AbortSignal.timeout(8000)})}catch{throw new ServiceError(503,'Le service de connexion est temporairement indisponible.')}
 if(response.status===401||response.status===403)throw new ServiceError(401,'Votre connexion a expiré.');
 if(!response.ok)throw new ServiceError(503,'Le service de connexion est temporairement indisponible.');
 let identity:{id?:unknown;is_anonymous?:unknown};
 try{identity=await response.json()}catch{throw new ServiceError(503,'Réponse de connexion invalide.')}
 if(typeof identity.id!=='string'||!identity.id||identity.is_anonymous===true)throw new ServiceError(401,'Une connexion personnelle est requise.');
 const actor=await db.prepare(`SELECT u.id AS userId,u.company_id AS companyId,u.name,u.email,u.role
 FROM user_identities i JOIN users u ON u.id=i.user_id AND u.company_id=i.company_id
 WHERE i.provider='supabase' AND i.issuer=? AND i.subject=? AND u.active=1`).bind(issuer.origin,identity.id).first<VerifiedActor>();
 if(!actor)throw new ServiceError(403,'Votre compte n’est pas encore associé à une compagnie Forge. Contactez votre administrateur.');
 return actor;
}
