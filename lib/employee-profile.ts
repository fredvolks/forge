import type {Actor,TimeData} from './time-domain';

export const ccqSource='https://www.ccq.org/fr-CA/avantages-sociaux/salaire-taux';
export const employeeRoles:Actor['role'][]=['Employé','Chef','Adjointe','Boss'];
export const employmentStatuses=['Actif','Inactif','Blessé','Congé','Paternité','Mise à pied'];
export type EmergencyContact={id:string;name:string;relationship:string;phone:string;secondaryPhone:string;email:string;notes:string;primary:boolean};
export type EmployeeDocument={id:string;name:string;type:string;expires:string;data:string};
export type Compensation={id:string;effectiveFrom:string;actualRate:number|null;bonusType:string;bonusValue:number;employerCost:number|null;createdAt:string};
export type EmployeeProfile={firstName:string;lastName:string;email:string;birthDate:string;address:string;city:string;province:string;postalCode:string;hiredAt:string;endedAt:string;employmentStatus:string;notes:string;trade:string;grade:string;sector:string;union:string;teamId:string;supervisorId:string;jobId:string;skills:string;accessRequested:boolean;homePreset:string;photo:string;contacts:EmergencyContact[];documents:EmployeeDocument[];compensations:Compensation[]};
export const emptyEmployeeProfile=():EmployeeProfile=>({firstName:'',lastName:'',email:'',birthDate:'',address:'',city:'',province:'QC',postalCode:'',hiredAt:'',endedAt:'',employmentStatus:'Actif',notes:'',trade:'',grade:'',sector:'',union:'',teamId:'',supervisorId:'',jobId:'',skills:'',accessRequested:false,homePreset:'Conserver le preset actuel',photo:'',contacts:[],documents:[],compensations:[]});
export function nextEmployeeNumber(d:TimeData){return 'EMP-'+String(Math.max(0,...d.employees.map(e=>Number(e.employee_number?.replace('EMP-',''))||0))+1).padStart(4,'0')}
export function saveEmployeeProfile(d:TimeData,a:Actor,input:{id:string;version:number;role:Actor['role'];phone:string;profile:EmployeeProfile}){
 if(a.companyId!=='mir-demo'||d.company_id!==a.companyId||!['Boss','Adjointe'].includes(a.role)||!d.employees.some(e=>e.user_id===a.email&&e.role===a.role))throw Error('Accès démo non autorisé.');
 const existing=d.employees.find(e=>e.id===input.id);
 if(existing&&existing.company_id!==a.companyId)throw Error('Employé inaccessible.');
 if(existing&&(existing.profile_version||0)!==input.version)throw Error('Cette fiche a changé. Fermez-la et rouvrez-la.');
 if(!employeeRoles.includes(input.role)||(a.role==='Adjointe'&&input.role==='Boss'&&existing?.role!=='Boss'))throw Error('Rôle non autorisé.');
 const p=structuredClone(input.profile);
 if(!p.firstName.trim()||!p.lastName.trim())throw Error('Prénom et nom obligatoires.');
 if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))throw Error('Courriel invalide.');
 if(p.accessRequested&&!p.email)throw Error('Le courriel est obligatoire pour simuler une invitation.');
 if(p.endedAt&&p.hiredAt&&p.endedAt<p.hiredAt)throw Error('La fin d’emploi doit suivre l’embauche.');
 if(p.contacts.filter(c=>c.primary).length>1)throw Error('Un seul contact principal est permis.');
 if(p.contacts.some(c=>!c.name.trim()||!c.phone.trim()))throw Error('Chaque contact doit avoir un nom et un téléphone.');
 if(p.teamId&&!d.teams?.some(t=>t.id===p.teamId&&t.company_id===a.companyId))throw Error('Équipe inaccessible.');
 if(p.jobId&&!d.jobs.some(j=>j.id===p.jobId&&j.company_id===a.companyId))throw Error('Job inaccessible.');
 if(p.supervisorId&&!d.employees.some(e=>e.id===p.supervisorId&&e.company_id===a.companyId&&e.role==='Chef'))throw Error('Chef inaccessible.');
 for(const c of p.compensations){if(!/^\d{4}-\d{2}-\d{2}$/.test(c.effectiveFrom)||[c.actualRate,c.bonusValue,c.employerCost].some(v=>v!==null&&(!Number.isFinite(v)||v<0)))throw Error('Rémunération invalide.');}
 if(new Set(p.compensations.map(c=>c.effectiveFrom)).size!==p.compensations.length)throw Error('Une rémunération existe déjà pour cette date.');
 for(const old of existing?.profile?.compensations||[]){if(JSON.stringify(p.compensations.find(c=>c.id===old.id))!==JSON.stringify(old))throw Error('Les rémunérations précédentes doivent être conservées.');}
 const stamp=new Date().toISOString(),before=existing?structuredClone(existing):null;
 const value={id:input.id,company_id:a.companyId,user_id:existing?.user_id||'',name:p.firstName.trim()+' '+p.lastName.trim(),phone:input.phone.trim(),role:input.role,status:(p.employmentStatus==='Actif'?'active':'inactive') as 'active'|'inactive',trade:p.trade,employee_number:existing?.employee_number||nextEmployeeNumber(d),profile:p,profile_version:input.version+1};
 if(existing)Object.assign(existing,value);else d.employees.push(value);
 if(p.teamId){const t=d.teams!.find(t=>t.id===p.teamId)!;if(!t.member_ids.includes(value.id))t.member_ids.push(value.id);}
 if(p.jobId&&value.user_id){const j=d.jobs.find(j=>j.id===p.jobId)!;if(!j.members.includes(value.user_id))j.members.push(value.user_id);}
 d.audit.push({id:crypto.randomUUID(),company_id:a.companyId,actor_id:a.email,action:existing?'employee_profile_updated':'employee_created',entity_id:value.id,before,after:structuredClone(value),reason:'Fiche employé · démo',created_at:stamp});
 if(p.accessRequested&&!before?.profile?.accessRequested)d.notifications.push({id:crypto.randomUUID(),company_id:a.companyId,recipient_user_id:a.email,source_type:'employee',source_id:value.id,employee_id:value.id,original_segment_id:null,job_id:p.jobId||null,title:'Invitation simulée · '+value.name,deep_link:'#admin/teams/employees',read_at:null,created_at:stamp});
 return value.id;
}
