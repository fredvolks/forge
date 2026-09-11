import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const moduleURL=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const identityURL=moduleURL(readFileSync(new URL('../server/identity.ts',import.meta.url),'utf8'));
const {verifiedActor}=await import(identityURL);
const {ForgeData}=await import(moduleURL(readFileSync(new URL('../server/forge-data.ts',import.meta.url),'utf8').replace("'./identity'",JSON.stringify(identityURL))));
const settings={SUPABASE_URL:'https://identity.example',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
const request=()=>new Request('https://forge.example/api/forge/session',{headers:{Authorization:'Bearer '+ 'x'.repeat(30),'X-Company-ID':'b','X-User-Email':'other@b'}});
function setup(){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
 for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 sql.exec(`INSERT INTO companies(id,name,created_at) VALUES('a','A','2026'),('b','B','2026');
 INSERT INTO users(id,company_id,email,name,role) VALUES('boss','a','boss@a','Boss','boss'),('worker','a','worker@a','Worker','employe'),('other','b','other@b','Other','boss');
 INSERT INTO user_identities VALUES('supabase','https://identity.example','verified-subject','a','worker','2026');
 INSERT INTO jobs(id,company_id,job_number,name,status,created_by,created_at) VALUES('job-a','a','214','Breton','active','boss','2026'),('job-b','b','315','Leduc','active','other','2026');
 INSERT INTO job_members(job_id,user_id) VALUES('job-a','worker');
 INSERT INTO catalog_categories(id,company_id,name,created_at) VALUES('cat-a','a','Pliage','2026'),('cat-b','b','Pliage','2026');
 INSERT INTO catalog_products(id,company_id,category_id,name,source_mode,active,created_at) VALUES('product-a','a','cat-a','Solin','supplier',1,'2026'),('draft-a','a','cat-a','Brouillon','supplier',0,'2026'),('product-b','b','cat-b','Secret','supplier',1,'2026');
 INSERT INTO orders(id,company_id,job_id,requested_by,category,priority,status,created_at) VALUES('own','a','job-a','worker','Pliage','Normale','received','2026'),('admin','a','job-a','boss','Pliage','Normale','received','2026'),('foreign','b','job-b','other','Pliage','Normale','received','2026');`);
 const db={prepare(query){let args=[];return {bind(...values){args=values;return this},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}}}}};
 return {sql,db,data:new ForgeData(db)};
}
const actor=(userId,companyId='a')=>({userId,companyId,role:'boss'}); // Forged role must not grant access.
test('server identity uses verified subject, not submitted email, company or role',async()=>{
 const {sql,db}=setup();
 const user=await verifiedActor(request(),db,settings,async()=>Response.json({id:'verified-subject',email:'other@b',user_metadata:{role:'boss'}}));
 assert.equal(user.userId,'worker');assert.equal(user.companyId,'a');assert.equal(user.role,'employe');sql.close();
});
test('unconfigured auth and missing bearer fail closed',async()=>{
 const {sql,db}=setup();
 await assert.rejects(()=>verifiedActor(request(),db,{}),{status:503});
 await assert.rejects(()=>verifiedActor(new Request('https://forge.example'),db,settings),{status:401});sql.close();
});
test('invalid token, anonymous and unmapped identities cannot access business data',async()=>{
 const {sql,db}=setup();
 await assert.rejects(()=>verifiedActor(request(),db,settings,async()=>new Response('',{status:401})),{status:401});
 await assert.rejects(()=>verifiedActor(request(),db,settings,async()=>Response.json({id:'verified-subject',is_anonymous:true})),{status:401});
 await assert.rejects(()=>verifiedActor(request(),db,settings,async()=>Response.json({id:'unknown'})),{status:403});sql.close();
});
test('deactivated users and forged tenant cannot read central data',async()=>{
 const {sql,db,data}=setup();
 await assert.rejects(()=>data.catalog(actor('worker','b')),{status:403});
 sql.exec("UPDATE users SET active=0 WHERE id='worker'");
 await assert.rejects(()=>verifiedActor(request(),db,settings,async()=>Response.json({id:'verified-subject'})),{status:403});
 await assert.rejects(()=>data.orders(actor('worker')),{status:403});sql.close();
});
test('catalog is company-scoped and employee cannot see inactive products',async()=>{
 const {sql,data}=setup();
 assert.deepEqual((await data.catalog(actor('worker'))).map(i=>i.id),['product-a']);
 assert.equal((await data.catalog(actor('boss'))).length,2);sql.close();
});
test('orders are requester-scoped, admin-scoped and inaccessible across companies',async()=>{
 const {sql,data}=setup();
 assert.deepEqual((await data.orders(actor('worker'))).map(i=>i.id),['own']);
 assert.equal((await data.orders(actor('boss'))).length,2);
 await assert.rejects(()=>data.order(actor('worker'),'admin'),{status:404});
 await assert.rejects(()=>data.order(actor('boss'),'foreign'),{status:404});
 assert.equal((await data.order(actor('worker'),'own')).id,'own');sql.close();
});
test('job membership and identity tenant foreign key are enforced',async()=>{
 const {sql,data}=setup();
 assert.equal((await data.jobs(actor('worker'))).length,1);
 sql.exec("DELETE FROM job_members WHERE user_id='worker'");
 assert.equal((await data.jobs(actor('worker'))).length,0);
 assert.throws(()=>sql.exec("INSERT INTO user_identities VALUES('supabase','https://identity.example','invalid','b','worker','2026')"));sql.close();
});
