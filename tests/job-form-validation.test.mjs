import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../lib/job-form-validation.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {validateJobStep}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const actor={companyId:'a',email:'boss',role:'Boss'};
const data={company_id:'a',jobs:[{id:'existing',company_id:'a',number:'JOB-1'}],employees:[{id:'chef',company_id:'a',user_id:'chef-user',role:'Chef'},{id:'foreign',company_id:'b',user_id:'foreign-user',role:'Chef'}],teams:[{id:'team',company_id:'a'}]};
const job={id:'',company_id:'a',number:'JOB-2',name:'Chantier',client:'Client',project_type:'Résidentiel',members:[],address:'1 rue Test',city:'Québec',province:'Québec',postal_code:'G1A 1A1'};
test('step validation is read-only and requires essentials before advancing',()=>{
 const before=JSON.stringify(data);
 assert.equal(validateJobStep(job,0,data,actor),null);
 for(const key of ['number','name','client','project_type'])assert.ok(validateJobStep({...job,[key]:''},0,data,actor));
 assert.ok(validateJobStep({...job,number:' job-1 '},0,data,actor));
 assert.ok(validateJobStep({...job,city:''},1,data,actor));
 assert.equal(JSON.stringify(data),before);assert.equal(job.id,'');
});
test('planning rejects reversed dates and invalid estimates',()=>{
 assert.ok(validateJobStep({...job,planned_start:'2026-10-10',planned_end:'2026-10-09'},2,data,actor));
 assert.ok(validateJobStep({...job,planned_start:'2026-10-10',planned_delivery:'2026-10-09'},2,data,actor));
 assert.ok(validateJobStep({...job,estimated_hours:-1},2,data,actor));
 assert.equal(validateJobStep({...job,estimated_hours:0},2,data,actor),null);
});
test('assignment validation uses company and existing member relations',()=>{
 assert.ok(validateJobStep({...job,members:['foreign-user'],lead_id:'foreign'},3,data,actor));
 assert.ok(validateJobStep({...job,lead_id:'chef'},3,data,actor));
 assert.equal(validateJobStep({...job,members:['chef-user'],lead_id:'chef',team_id:'team'},3,data,actor),null);
 assert.ok(validateJobStep({...job,team_id:'missing'},3,data,actor));
});
