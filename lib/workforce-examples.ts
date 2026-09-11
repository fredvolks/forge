import {addDays,dateKey,employeeId,localInstant,requestCorrection,reviewCorrection,type Actor,type TimeData} from './time-domain';
export const WORKFORCE_EXAMPLES='workforce-examples-v1';
/** Explicit fictional fixtures, added once without resetting any existing record. */
export function addWorkforceExamples(d:TimeData,actor:Actor,now=new Date()){
 if(d.company_id!=='mir-demo'||actor.companyId!==d.company_id||!['Boss','Adjointe'].includes(actor.role)||!d.employees.some(e=>e.user_id===actor.email&&e.role===actor.role))throw Error('Exemples réservés à la démo administrateur.');
 if(d.audit.some(a=>a.id===WORKFORCE_EXAMPLES))return;
 const jobs=d.jobs.filter(j=>j.company_id===d.company_id).slice(0,3);
 if(!jobs.length)throw Error('Ajoutez une Job avant les exemples.');
 const people=[['Marco Tremblay','Chef'],['Patrick Dubé','Chef'],['Simon Laroche','Chef'],['David Roy','Employé'],['Émilie Côté','Employé'],['Marc Bouchard','Employé'],['Jean Simard','Employé'],['Kevin Gagnon','Employé'],['Julie Pelletier','Employé']] as const;
 const today=dateKey(now,d.settings.timezone);
 const workers=people.map(([name,role],i)=>{
  const email='workforce-demo-'+i+'@example.invalid';
  const a:Actor={companyId:d.company_id,email,userName:name,role};
  const id=employeeId(a);
  let e=d.employees.find(e=>e.id===id);
  if(!e){e={id,company_id:d.company_id,user_id:email,name,role,phone:'418 555-01'+String(i+10),trade:i%2?'Manœuvre':'Charpentier-menuisier',status:'active'};d.employees.push(e);}
  const job=jobs[i%jobs.length];
  if(!job.members.includes(email))job.members.push(email);
  // Isolated fixture IDs prevent a second run from duplicating historical Punchs.
  for(let back=14;back>=1;back--){
   const day=addDays(today,-back),weekday=new Date(day+'T12:00:00Z').getUTCDay();
   if(weekday===0||weekday===6)continue;
   const sid=WORKFORCE_EXAMPLES+':'+i+':'+day;
   const start=localInstant(day,'07:'+String(i%3*5).padStart(2,'0'),d.settings.timezone),end=localInstant(day,i%2?'15:30':'16:00',d.settings.timezone);
   if(!d.segments.some(s=>s.id===sid||s.employee_id===id&&Date.parse(start)<(s.end_time?Date.parse(s.end_time):Infinity)&&Date.parse(end)>Date.parse(s.start_time)))
    d.segments.push({id:sid,company_id:d.company_id,employee_id:id,job_id:job.id,shift_id:sid,start_time:start,end_time:end,source:'fictional_workforce',created_at:start,updated_at:end,version:1});
  }
  const elapsedToday=Math.floor((now.getTime()-Date.parse(localInstant(today,'00:00',d.settings.timezone)))/60000);
  const minutes=Math.max(1,Math.min(180+i*13,elapsedToday-1));
  const start=new Date(now.getTime()-minutes*60000).toISOString();
  const end=i<7?null:new Date(now.getTime()-Math.min(20,Math.floor(minutes/2))*60000).toISOString();
  const sid=WORKFORCE_EXAMPLES+':'+i+':live';
  if(!d.segments.some(s=>s.employee_id===id&&(!s.end_time||Date.parse(s.end_time)>Date.parse(start))))
   d.segments.push({id:sid,company_id:d.company_id,employee_id:id,job_id:job.id,shift_id:sid,start_time:start,end_time:end,source:'fictional_workforce',gps_context:i===3?'Hors rayon · 220 m':i===5?'Hors rayon · 340 m':'Sur le chantier · démo',created_at:start,updated_at:end||start,version:1});
  return {employee:e,actor:a,job};
 });
 d.teams??=[];
 jobs.forEach((job,index)=>{
  const id=WORKFORCE_EXAMPLES+':team:'+index;
  if(!d.teams!.some(t=>t.id===id))d.teams!.push({id,company_id:d.company_id,name:['Équipe Revêtement','Équipe Toiture','Équipe Finition'][index],lead_id:workers[index].employee.id,job_id:job.id,member_ids:workers.filter((_,i)=>i%jobs.length===index).map(w=>w.employee.id)});
 });
 for(let i=0;i<4;i++){
  const w=workers[i+3],s=d.segments.filter(s=>s.employee_id===w.employee.id&&s.end_time&&s.id.startsWith(WORKFORCE_EXAMPLES)&&!s.id.endsWith(':live')).at(-1);
  if(!s?.end_time)continue;
  const c=requestCorrection(d,w.actor,s.id,{job_id:s.job_id,start_time:s.start_time,end_time:new Date(Date.parse(s.end_time)+15*60000).toISOString()},'Sortie plus tardive','Exemple fictif : rangement du matériel en fin de journée.');
  if(i===2)reviewCorrection(d,actor,c.id,'approved','Exemple fictif approuvé.');
  if(i===3)reviewCorrection(d,actor,c.id,'rejected','Exemple fictif : horaire original confirmé.');
 }
 d.audit.push({id:WORKFORCE_EXAMPLES,company_id:d.company_id,actor_id:actor.email,action:'fictional_workforce_examples_added',entity_id:WORKFORCE_EXAMPLES,before:null,after:{employees:workers.map(w=>w.employee.id),jobs:jobs.map(j=>j.id)},reason:'Données fictives demandées pour Équipes & heures.',created_at:now.toISOString()});
}
