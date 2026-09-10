import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Conversations} from '../server/conversations.ts';

function setup(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON');
 for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 sql.exec(`INSERT INTO companies(id,name,created_at) VALUES('a','A','2026'),('b','B','2026');
 INSERT INTO users(id,company_id,email,name,role) VALUES('boss','a','boss@a','Boss','boss'),('assistant','a','assistant@a','Assistant','adjointe'),('worker','a','worker@a','Worker','employe'),('outsider','a','outsider@a','Outsider','employe'),('other','b','other@b','Other','boss');
 INSERT INTO jobs(id,company_id,job_number,name,status,created_by,created_at) VALUES('job','a','JOB-214','Breton','active','boss','2026'),('job-b','b','JOB-214','Other','active','other','2026');
 INSERT INTO job_members(job_id,user_id) VALUES('job','worker');
 INSERT INTO employees(id,company_id,user_id,first_name,last_name,role,created_at) VALUES('employee','a','worker','Worker','A','employe','2026');`);
 const wrap=(query,args=[])=>({bind(...values){return wrap(query,values)},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return sql.prepare(query).run(...args)}});
 const db={prepare:wrap,async batch(statements){sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}};
 return {sql,service:new Conversations(db)};
}
const actor=userId=>({userId,companyId:userId==='other'?'b':'a'});
test('Job resolution keeps a legacy ID and never creates a second primary chat',async()=>{
 const {sql,service}=setup();sql.exec("INSERT INTO conversations(id,company_id,job_id,created_at) VALUES('old','a','job','2026')");
 assert.equal(await service.resolveJob(actor('worker'),'job'),'old');
 assert.equal(await service.resolveJob(actor('boss'),'job'),'old');
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM conversations').get().n,1);
 sql.close();
});
test('ambiguous old histories stop consolidation without deleting either',async()=>{
 const {sql,service}=setup();sql.exec("INSERT INTO conversations(id,company_id,job_id,created_at) VALUES('old1','a','job','2026'),('old2','a','job','2026')");
 await assert.rejects(()=>service.resolveJob(actor('boss'),'job'),{status:409});
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM conversations').get().n,2);sql.close();
});
test('employee, Boss and Adjointe share one Administration history',async()=>{
 const {sql,service}=setup();const id=await service.resolveAdministration(actor('worker'),'employee');
 assert.equal(await service.resolveAdministration(actor('boss'),'employee'),id);
 assert.equal(await service.resolveAdministration(actor('assistant'),'employee'),id);
 await service.send(actor('worker'),id,{body:'Bonjour',requestId:'request-001'});
 for(const u of ['worker','boss','assistant'])assert.equal((await service.messages(actor(u),id)).messages[0].body,'Bonjour');
 await assert.rejects(()=>service.messages(actor('outsider'),id),{status:403});sql.close();
});
test('company boundary, forged company, deactivation and removed job assignment denied',async()=>{
 const {sql,service}=setup();const id=await service.resolveJob(actor('worker'),'job');
 await assert.rejects(()=>service.messages(actor('other'),id),{status:404});
 await assert.rejects(()=>service.messages({userId:'other',companyId:'a'},id),{status:403});
 await assert.rejects(()=>service.resolveJob(actor('outsider'),'job'),{status:403});
 sql.exec("DELETE FROM job_members WHERE user_id='worker'");
 await assert.rejects(()=>service.messages(actor('worker'),id),{status:403});
 sql.exec("UPDATE users SET active=0 WHERE id='boss'");
 await assert.rejects(()=>service.messages(actor('boss'),id),{status:403});sql.close();
});
test('retry is idempotent, reply and attachment references cannot cross conversations',async()=>{
 const {sql,service}=setup();const id=await service.resolveJob(actor('worker'),'job');
 const one=await service.send(actor('worker'),id,{body:'Test',requestId:'request-001'});
 assert.equal(await service.send(actor('worker'),id,{body:'Test',requestId:'request-001'}),one);
 assert.equal((await service.messages(actor('worker'),id)).messages.length,1);
 const other=await service.resolveJob(actor('other'),'job-b');
 await assert.rejects(()=>service.send(actor('other'),other,{body:'Reply',requestId:'request-002',replyTo:one}),{status:400});
 await assert.rejects(()=>service.send(actor('worker'),id,{body:'File',requestId:'request-003',attachmentIds:['foreign']}),{status:403});
 await assert.rejects(()=>service.send(actor('worker'),id,{body:'Job',requestId:'request-004',links:[{type:'job',id:'job-b'}]}),{status:403});sql.close();
});
test('read state affects only the reader; pagination has a stable cursor',async()=>{
 const {sql,service}=setup();const id=await service.resolveJob(actor('worker'),'job');
 for(let i=0;i<55;i++)await service.send(actor('worker'),id,{body:`Message ${i}`,requestId:`request-${String(i).padStart(4,'0')}`});
 const page=await service.messages(actor('boss'),id);assert.equal(page.messages.length,50);assert.equal(page.hasMore,true);
 const oldest=page.messages[0];const previous=await service.messages(actor('boss'),id,{time:oldest.created_at,id:oldest.id});assert.equal(previous.messages.length,5);
 await service.markRead(actor('boss'),id,page.messages.at(-1).id);
 assert.equal(await service.unread(actor('boss'),id),0);assert.equal(await service.unread(actor('assistant'),id),55);assert.equal(await service.unread(actor('worker'),id),0);sql.close();
});
