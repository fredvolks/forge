import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const js=ts.transpileModule(readFileSync(new URL('../lib/employee-profile.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {emptyEmployeeProfile,saveEmployeeProfile}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const actor={companyId:'mir-demo',email:'ester@example.invalid',role:'Adjointe'};
function fixture(){return {company_id:'mir-demo',employees:[{id:'ester',company_id:'mir-demo',user_id:actor.email,role:actor.role}],teams:[{id:'t',company_id:'mir-demo',member_ids:[]}],jobs:[],audit:[],notifications:[]}}
test('create and reopen one shared employee, number and simulated invitation',()=>{
 const d=fixture(),profile={...emptyEmployeeProfile(),firstName:'Alex',lastName:'Démo',email:'alex@example.invalid',teamId:'t',accessRequested:true};
 const input={id:'new',version:0,role:'Employé',phone:'',profile};
 saveEmployeeProfile(d,actor,input);assert.equal(d.employees[1].employee_number,'EMP-0001');assert.deepEqual(d.teams[0].member_ids,['new']);assert.equal(d.notifications.length,1);
 saveEmployeeProfile(d,actor,{...input,version:1});assert.equal(d.employees.length,2);assert.equal(d.notifications.length,1);
 assert.throws(()=>saveEmployeeProfile(d,actor,input),/changé/);
});
test('reject multiple primary contacts and privilege elevation',()=>{
 const d=fixture(),input={id:'new',version:0,role:'Boss',phone:'',profile:{...emptyEmployeeProfile(),firstName:'Alex',lastName:'Démo'}};
 assert.throws(()=>saveEmployeeProfile(d,actor,input),/Rôle/);
 input.role='Employé';input.profile.contacts=[{name:'A',phone:'1',primary:true},{name:'B',phone:'2',primary:true}];assert.throws(()=>saveEmployeeProfile(d,actor,input),/principal/);
});
test('compensation history cannot be rewritten',()=>{
 const d=fixture(),input={id:'new',version:0,role:'Employé',phone:'',profile:{...emptyEmployeeProfile(),firstName:'Alex',lastName:'Démo',compensations:[{id:'r',effectiveFrom:'2026-09-10',actualRate:45,bonusType:'Aucun',bonusValue:0,employerCost:null,createdAt:'2026-09-10'}]}};
 saveEmployeeProfile(d,actor,input);input.profile.compensations[0].actualRate=40;
 assert.throws(()=>saveEmployeeProfile(d,actor,{...input,version:1}),/conservées/);
});
