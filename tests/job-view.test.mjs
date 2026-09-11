import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const domain='data:text/javascript;base64,'+Buffer.from(compile('../lib/time-domain.ts')).toString('base64');
const source=compile('../lib/job-view.ts').replace("'./time-domain'",JSON.stringify(domain));
const {jobHours,matchesJobQuick}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('Jobs quick filters: two active, one upcoming, no unknown metrics counted as zero',()=>{
 const jobs=[{id:'214',status:'Active',chef:'Fred'},{id:'315',status:'Active',chef:'Marco'},{id:'418',status:'Planifiée',chef:'À assigner'},{id:'old',status:'Terminée',chef:'À assigner'}];
 assert.deepEqual(jobs.filter(j=>matchesJobQuick(j,'active')).map(j=>j.id),['214','315']);
 assert.deepEqual(jobs.filter(j=>matchesJobQuick(j,'upcoming')).map(j=>j.id),['418']);
 assert.deepEqual(jobs.filter(j=>matchesJobQuick(j,'lead')).map(j=>j.id),['418']);
 assert.equal(jobs.filter(j=>matchesJobQuick(j,'all')).length,4);
 assert.equal(matchesJobQuick(jobs[0],'deliveries'),false);
});
test('job hours share segment totals and ignore other companies',()=>{
 const now=Date.parse('2026-09-10T12:00:00Z');
 const segments=[0,1,2,3].map(i=>({id:String(i),company_id:'a',employee_id:String(i),shift_id:String(i),job_id:'j',start_time:'2026-09-10T10:00:00Z',end_time:null}));
 const d={company_id:'a',settings:{timezone:'UTC',minimum:330,maximum:480,deduction:15},segments:[...segments,{...segments[0],id:'foreign',company_id:'b'}]};
 const result=jobHours(d,now).j;
 assert.equal(result.today,480);assert.equal(result.live,480);assert.equal(result.employees.size,4);
});
