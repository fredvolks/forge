/** Shared data service. Actor must come from server authentication, never a request body. */
export type Actor = {userId:string; companyId:string};
export class ChatError extends Error {
 constructor(public status:number, message:string){super(message)}
}
type User = {id:string;company_id:string;role:string};
type Conversation = {id:string;company_id:string;job_id:string|null;employee_id:string|null;type:string;title:string|null;archived_at:string|null};
export class Conversations {
 constructor(private db:D1Database){}
 private async user(actor:Actor){
  const user=await this.db.prepare('SELECT id,company_id,role FROM users WHERE id=? AND company_id=? AND active=1').bind(actor.userId,actor.companyId).first<User>();
  if(!user)throw new ChatError(403,'Accès refusé.');return user;
 }
 private admin(user:User){return ['boss','adjointe'].includes(user.role)}
 async authorize(actor:Actor,id:string){
  const user=await this.user(actor);
  const c=await this.db.prepare('SELECT * FROM conversations WHERE id=? AND company_id=?').bind(id,user.company_id).first<Conversation>();
  if(!c)throw new ChatError(404,'Discussion inaccessible.');
  if(c.type==='job'){
   const job=await this.db.prepare('SELECT id FROM jobs WHERE id=? AND company_id=?').bind(c.job_id,user.company_id).first();
   const membership=await this.db.prepare('SELECT job_id FROM job_members WHERE job_id=? AND user_id=?').bind(c.job_id,user.id).first();
   if(!job||(!this.admin(user)&&!membership))throw new ChatError(403,'Discussion inaccessible.');
  }else if(c.type==='employee_admin'){
   const employee=await this.db.prepare('SELECT user_id FROM employees WHERE id=? AND company_id=?').bind(c.employee_id,user.company_id).first<{user_id:string}>();
   if(!employee||(!this.admin(user)&&employee.user_id!==user.id))throw new ChatError(403,'Discussion inaccessible.');
  }else{
   const member=await this.db.prepare('SELECT user_id FROM conversation_members WHERE conversation_id=? AND user_id=?').bind(id,user.id).first();
   if(!member)throw new ChatError(403,'Discussion inaccessible.');
  }
  return {user,conversation:c};
 }
 async resolveJob(actor:Actor,jobId:string){
  const user=await this.user(actor);
  const job=await this.db.prepare('SELECT id FROM jobs WHERE id=? AND company_id=?').bind(jobId,user.company_id).first();
  const member=await this.db.prepare('SELECT user_id FROM job_members WHERE job_id=? AND user_id=?').bind(jobId,user.id).first();
  if(!job||(!this.admin(user)&&!member))throw new ChatError(403,'Job inaccessible.');
  const existing=await this.db.prepare("SELECT id,type FROM conversations WHERE company_id=? AND job_id=? AND type IN ('legacy','job')").bind(user.company_id,jobId).all<{id:string;type:string}>();
  if(existing.results.length>1)throw new ChatError(409,'Plusieurs discussions existantes : rapprochement requis, aucun historique supprimé.');
  if(existing.results.length){
   const old=existing.results[0];
   if(old.type==='legacy')await this.db.prepare("UPDATE conversations SET type='job' WHERE id=? AND company_id=? AND type='legacy'").bind(old.id,user.company_id).run();
   return old.id;
  }
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await this.db.prepare("INSERT OR IGNORE INTO conversations(id,company_id,job_id,type,created_at,updated_at,created_by_user_id) VALUES(?,?,?,'job',?,?,?)").bind(id,user.company_id,jobId,now,now,user.id).run();
  const saved=await this.db.prepare("SELECT id FROM conversations WHERE company_id=? AND job_id=? AND type='job'").bind(user.company_id,jobId).first<{id:string}>();
  if(!saved)throw new ChatError(503,'Discussion temporairement indisponible.');return saved.id;
 }
 async resolveAdministration(actor:Actor,employeeId:string){
  const user=await this.user(actor);
  const employee=await this.db.prepare('SELECT user_id FROM employees WHERE id=? AND company_id=?').bind(employeeId,user.company_id).first<{user_id:string}>();
  if(!employee||(!this.admin(user)&&employee.user_id!==user.id))throw new ChatError(403,'Accès refusé.');
  const now=new Date().toISOString();
  await this.db.prepare("INSERT OR IGNORE INTO conversations(id,company_id,employee_id,type,title,created_at,updated_at,created_by_user_id) VALUES(?,?,?,'employee_admin','Administration',?,?,?)").bind(crypto.randomUUID(),user.company_id,employeeId,now,now,user.id).run();
  const c=await this.db.prepare("SELECT id FROM conversations WHERE company_id=? AND employee_id=? AND type='employee_admin'").bind(user.company_id,employeeId).first<{id:string}>();
  if(!c)throw new ChatError(503,'Discussion temporairement indisponible.');return c.id;
 }
 async messages(actor:Actor,id:string,before?:{time:string;id:string}){
  await this.authorize(actor,id);
  const cursor=before?' AND (m.created_at<? OR (m.created_at=? AND m.id<?))':'';
  const args=before?[id,before.time,before.time,before.id]:[id];
  const rows=await this.db.prepare(`SELECT m.*,u.name AS sender_name FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.conversation_id=?${cursor} ORDER BY m.created_at DESC,m.id DESC LIMIT 51`).bind(...args).all();
  return {messages:rows.results.slice(0,50).reverse(),hasMore:rows.results.length>50};
 }
 async send(actor:Actor,id:string,input:{body:string;requestId:string;replyTo?:string;attachmentIds?:string[];links?:{type:'job'|'order';id:string}[]}){
  const {user,conversation}=await this.authorize(actor,id);
  if(conversation.archived_at)throw new ChatError(409,'Discussion archivée.');
  if(typeof input.body!=='string'||input.body.length>10000||typeof input.requestId!=='string'||input.requestId.length<8||input.requestId.length>100)throw new ChatError(400,'Message invalide.');
  const attachments=[...new Set(input.attachmentIds||[])],links=input.links||[];
  if(attachments.length>5||links.length>5||(!input.body.trim()&&!attachments.length&&!links.length))throw new ChatError(400,'Message vide ou trop de pièces jointes.');
  const previous=await this.db.prepare('SELECT id FROM messages WHERE conversation_id=? AND sender_id=? AND client_request_id=?').bind(id,user.id,input.requestId).first<{id:string}>();
  if(previous)return previous.id;
  if(input.replyTo&&!await this.db.prepare('SELECT id FROM messages WHERE id=? AND conversation_id=?').bind(input.replyTo,id).first())throw new ChatError(400,'Réponse inaccessible.');
  for(const attachmentId of attachments){
   const a=await this.db.prepare("SELECT id FROM attachments WHERE id=? AND company_id=? AND owner_type='conversation' AND owner_id=?").bind(attachmentId,user.company_id,id).first();
   if(!a)throw new ChatError(403,'Pièce jointe inaccessible.');
  }
  for(const link of links){
   if(link.type==='job'){
    if(link.id!==conversation.job_id)throw new ChatError(403,'Job hors de cette discussion.');
   }else if(link.type==='order'){
    const order=await this.db.prepare('SELECT id FROM orders WHERE id=? AND company_id=? AND job_id=?').bind(link.id,user.company_id,conversation.job_id).first();
    if(!order)throw new ChatError(403,'Commande inaccessible.');
   }else throw new ChatError(400,'Type de lien invalide.');
  }
  const messageId=crypto.randomUUID(),now=new Date().toISOString();
  // Only the winning insert attaches objects; a concurrent retry cannot modify it.
  const canonical='SELECT id FROM messages WHERE conversation_id=? AND sender_id=? AND client_request_id=?';
  const batch=[this.db.prepare('INSERT OR IGNORE INTO messages(id,conversation_id,sender_id,body,created_at,reply_to_message_id,client_request_id) VALUES(?,?,?,?,?,?,?)').bind(messageId,id,user.id,input.body.trim(),now,input.replyTo||null,input.requestId)];
  for(const a of attachments)batch.push(this.db.prepare('INSERT OR IGNORE INTO message_attachments(message_id,attachment_id) SELECT id,? FROM messages WHERE id=?').bind(a,messageId));
  for(const link of links)batch.push(this.db.prepare('INSERT OR IGNORE INTO message_object_links(message_id,object_type,object_id) SELECT id,?,? FROM messages WHERE id=?').bind(link.type,link.id,messageId));
  batch.push(this.db.prepare('UPDATE conversations SET updated_at=? WHERE id=? AND company_id=?').bind(now,id,user.company_id));
  await this.db.batch(batch);
  const saved=await this.db.prepare(canonical).bind(id,user.id,input.requestId).first<{id:string}>();
  if(!saved)throw new ChatError(503,'Envoi non confirmé. Réessayez.');return saved.id;
 }
 async markRead(actor:Actor,id:string,messageId:string){
  const {user}=await this.authorize(actor,id);
  const m=await this.db.prepare('SELECT created_at FROM messages WHERE id=? AND conversation_id=?').bind(messageId,id).first<{created_at:string}>();
  if(!m)throw new ChatError(400,'Message inaccessible.');
  await this.db.prepare(`INSERT INTO conversation_read_state(conversation_id,user_id,last_read_message_id,last_read_at) VALUES(?,?,?,?)
   ON CONFLICT(conversation_id,user_id) DO UPDATE SET last_read_message_id=excluded.last_read_message_id,last_read_at=excluded.last_read_at
   WHERE excluded.last_read_at>conversation_read_state.last_read_at OR (excluded.last_read_at=conversation_read_state.last_read_at AND excluded.last_read_message_id>conversation_read_state.last_read_message_id)`).bind(id,user.id,messageId,m.created_at).run();
 }
 async unread(actor:Actor,id:string){
  const {user}=await this.authorize(actor,id);
  const row=await this.db.prepare(`SELECT COUNT(*) AS count FROM messages m LEFT JOIN conversation_read_state r ON r.conversation_id=m.conversation_id AND r.user_id=?
   WHERE m.conversation_id=? AND m.sender_id<>? AND (r.last_read_at IS NULL OR m.created_at>r.last_read_at OR (m.created_at=r.last_read_at AND m.id>r.last_read_message_id))`).bind(user.id,id,user.id).first<{count:number}>();
  return row?.count||0;
 }
}
