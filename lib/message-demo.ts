import type {Actor,TimeData} from './time-domain';
export type ChatAsset={id:string;name:string;kind:'image'|'audio'|'document'|'job'|'link';url?:string;entityId?:string};
export type ChatMessage={id:string;company_id?:string;conversation_id:string;sender:string;body:string;created_at:string;attachments:ChatAsset[];reply_to_message_id?:string;reply?:string;readers?:{id:string;name:string}[]};
export type ChatDiscussion={id:string;number:string;name:string;members:string[];private:boolean;type:'job'|'employee_admin'|'group';company_id:string;job_id?:string};
export type ChatDemo={messages:ChatMessage[];groups:ChatDiscussion[];memberships:Record<string,string[]>;reads:Record<string,string>};
// Shared preview adapter only. The authenticated Conversations service remains the production boundary.
let snapshot:ChatDemo={messages:[],groups:[],memberships:{},reads:{}};
const listeners=new Set<()=>void>();
export const subscribeChatDemo=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}};
export const getChatDemo=()=>snapshot;
const publish=(next:ChatDemo)=>{snapshot=next;listeners.forEach(fn=>fn())};
export function demoDiscussions(identity:TimeData,a:Actor):ChatDiscussion[]{
 if(a.companyId!=='mir-demo'||identity.company_id!==a.companyId||!identity.employees.some(e=>e.user_id===a.email&&e.role===a.role))return [];
 const admins=identity.employees.filter(e=>['Boss','Adjointe'].includes(e.role));const workers=identity.employees.filter(e=>e.user_id&&!['Boss','Adjointe'].includes(e.role));
 const pairs=workers.flatMap(e=>admins.map(ad=>({id:`preview:private:${encodeURIComponent(a.companyId)}:${encodeURIComponent(e.user_id.toLowerCase())}:${ad.role}`,company_id:a.companyId,number:'',name:['Boss','Adjointe'].includes(a.role)?e.name:ad.role,members:[e.user_id,ad.user_id],private:true,type:'employee_admin' as const})));
 const jobs=identity.jobs.filter(j=>j.company_id===a.companyId).map(j=>({id:j.id,company_id:a.companyId,number:j.number,name:j.name,members:j.members,private:false,type:'job' as const}));
 return [...jobs,...pairs,...snapshot.groups.filter(c=>c.company_id===a.companyId)].map(c=>({...c,members:snapshot.memberships[c.id]||c.members})).filter(c=>c.members.includes(a.email)||(c.type==='job'&&['Boss','Adjointe'].includes(a.role)));
}
export function seedChatMessages(identity:TimeData):ChatMessage[]{if(identity.company_id!=='mir-demo')return [];return identity.jobs.flatMap(j=>[{id:`${j.id}:sample1`,company_id:identity.company_id,conversation_id:j.id,sender:'ester@mir.ca',body:'J’ai reçu tes photos. Je les joins à la commande du chantier.',created_at:'2026-09-10T09:42:00',attachments:[]},{id:`${j.id}:sample2`,company_id:identity.company_id,conversation_id:j.id,sender:'alex@mir.ca',body:'Parfait ! Il faut livrer directement au chantier dans 2 jours.',created_at:'2026-09-10T09:44:00',attachments:[]},{id:`${j.id}:sample3`,company_id:identity.company_id,conversation_id:j.id,sender:'simon@mir.ca',body:'La commande est prête. Je vous envoie le bordereau.',created_at:'2026-09-10T09:46:00',attachments:[]}]);}
export function sendChatDemo(identity:TimeData,a:Actor,m:ChatMessage){const c=demoDiscussions(identity,a).find(c=>c.id===m.conversation_id);if(!c||m.sender!==a.email)throw Error('Conversation inaccessible.');if(m.reply_to_message_id&&![...seedChatMessages(identity),...snapshot.messages].some(x=>x.id===m.reply_to_message_id&&x.conversation_id===c.id))throw Error('Réponse inaccessible.');if(m.attachments.some(x=>x.kind==='job'&&!identity.jobs.some(j=>j.id===x.entityId&&j.company_id===a.companyId&&(['Boss','Adjointe'].includes(a.role)||j.members.includes(a.email)))))throw Error('Job inaccessible.');if(snapshot.messages.some(x=>x.id===m.id))return;publish({...snapshot,messages:[...snapshot.messages,{...m,company_id:a.companyId}]});}
export function markChatDemo(identity:TimeData,a:Actor,id:string,last:string){if(!demoDiscussions(identity,a).some(c=>c.id===id))return;const key=`${a.companyId}:${id}:${a.email}`;if(snapshot.reads[key]===last)return;publish({...snapshot,reads:{...snapshot.reads,[key]:last}})}
function validateActor(identity:TimeData,a:Actor){if(a.companyId!=='mir-demo'||identity.company_id!==a.companyId||!identity.employees.some(e=>e.company_id===a.companyId&&e.user_id===a.email&&e.role===a.role))throw Error('Accès refusé.');}
function validateMembers(identity:TimeData,a:Actor,members:string[]){if(members.some(id=>!identity.employees.some(e=>e.company_id===a.companyId&&e.user_id===id)))throw Error('Membre inaccessible.');const ids=[...new Set(members)].sort();if(ids.length<2)throw Error('Choisissez au moins deux membres.');return ids;}
export function createChatGroup(identity:TimeData,a:Actor,name:string,members:string[],jobId?:string){
 validateActor(identity,a);
 if(!['Boss','Adjointe','Chef'].includes(a.role)||!name.trim())throw Error('Création de groupe non autorisée.');
 const ids=validateMembers(identity,a,[a.email,...members]);
 if(jobId&&!identity.jobs.some(j=>j.id===jobId&&j.company_id===a.companyId&&(['Boss','Adjointe'].includes(a.role)||j.members.includes(a.email))))throw Error('Job inaccessible.');
 const existing=snapshot.groups.find(c=>c.company_id===a.companyId&&c.job_id===jobId&&c.name===name.trim()&&[...(snapshot.memberships[c.id]||c.members)].sort().join('|')===ids.join('|'));
 if(existing)return existing.id;
 const id=crypto.randomUUID();publish({...snapshot,groups:[...snapshot.groups,{id,company_id:a.companyId,name:name.trim(),number:'',members:ids,private:false,type:'group',job_id:jobId}]});return id;
}
export function updateChatMembers(identity:TimeData,a:Actor,id:string,members:string[]){
 validateActor(identity,a);
 if(!['Boss','Adjointe'].includes(a.role)||!demoDiscussions(identity,a).some(c=>c.id===id))throw Error('Gestion des membres non autorisée.');
 const ids=validateMembers(identity,a,members);
 publish({...snapshot,memberships:{...snapshot.memberships,[id]:ids}});
}
