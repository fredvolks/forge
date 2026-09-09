import { addDays, dateKey, employeeId, localInstant, weekOf, type Actor, type TimeData } from './time-domain';

// Explicit demo repository. Never use this browser adapter as production authorization.
export function seedTimeDemo(companyId:string,now=new Date()):TimeData {
 const data:TimeData={company_id:companyId,revision:0,settings:{timezone:'America/Toronto',weekStartsOn:1,minimum:330,maximum:480,deduction:15},jobs:[],employees:[],segments:[],corrections:[],submissions:[],audit:[],notifications:[]};
 if(companyId!=='mir-demo')return data;
 const people=[['simon@mir.ca','Simon','Boss'],['ester@mir.ca','Ester','Adjointe'],['fred@mir.ca','Fred','Chef'],['alex@mir.ca','Alex','Employé']] as const;
 data.employees=people.map(([email,name,role])=>({id:employeeId({companyId,email,userName:name,role}),company_id:companyId,user_id:email,name,role}));
 data.jobs=[['j214','JOB-214','Breton'],['j315','JOB-315','Leduc'],['j418','JOB-418','Bélanger']].map(([id,number,name])=>({id,company_id:companyId,number,name,members:people.map(p=>p[0])}));
 const today=dateKey(now,data.settings.timezone),current=weekOf(today);
 for(const e of data.employees.filter(e=>e.role==='Chef'||e.role==='Employé'))for(let w=0;w<5;w++){
  const week=addDays(current,-7*w);for(let day=0;day<5;day++){const date=addDays(week,day);if(date>=today)continue;const shift=`demo:${e.id}:${date}`;
   const periods=day===2?[['07:02','11:48','j214'],['12:15','15:17','j315']]:[['07:00',day===0?'16:15':day===1?'15:50':'14:45',day===3?'j315':'j214']];
   periods.forEach(([start,end,job],i)=>{const start_time=localInstant(date,start,data.settings.timezone),end_time=localInstant(date,end,data.settings.timezone);data.segments.push({id:`${shift}:${i}`,company_id:companyId,employee_id:e.id,job_id:job,shift_id:shift,start_time,end_time,source:'demo',gps_context:day===1?'Hors rayon · 220 m':undefined,created_at:start_time,updated_at:end_time,version:1});});}
  if(w>0)data.submissions.push({id:`demo-week:${e.id}:${week}`,company_id:companyId,employee_id:e.id,week,status:w===4?'rejected':w===3?'submitted':'approved',submitted_at:localInstant(addDays(week,4),'17:00',data.settings.timezone),submitted_by_user_id:e.user_id,...(w<3?{reviewed_at:localInstant(addDays(week,5),'09:00',data.settings.timezone),reviewed_by_user_id:'simon@mir.ca'}:{})});
 }
 return data;
}
const cache=new Map<string,{raw:string|null;data:TimeData}>();
const storageKey=(company:string)=>`forge:${company}:punch-ledger`;
export function readTimeDemo(company:string){
 if(typeof window==='undefined')return null;
 const raw=localStorage.getItem(storageKey(company)),cached=cache.get(company);if(cached&&cached.raw===raw)return cached.data;
 const data=raw?JSON.parse(raw) as TimeData:seedTimeDemo(company);if(data.company_id!==company)throw Error('Données de compagnie invalides.');cache.set(company,{raw,data});return data;
}
export async function changeTimeDemo(actor:Actor,fn:(d:TimeData)=>void){
 if(actor.companyId!=='mir-demo')throw Error('Le service d’heures réel n’est pas encore configuré.');
 const apply=()=>{const d=structuredClone(readTimeDemo(actor.companyId)!);fn(d);d.revision++;localStorage.setItem(storageKey(actor.companyId),JSON.stringify(d));cache.delete(actor.companyId);window.dispatchEvent(new Event('forge-time-updated'));};
 // Serialize read/modify/write across demo tabs. A failed storage write changes no UI state.
 if(navigator.locks)await navigator.locks.request(storageKey(actor.companyId),apply);else apply();
}
