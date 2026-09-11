import {dateKey,totals,type TimeData} from './time-domain';
// KPI counts and quick-filter results deliberately share this predicate.
export function matchesJobQuick(job:{status:string;chef:string},key:string){
 return key==='all'||key==='active'&&job.status==='Active'||key==='upcoming'&&job.status==='Planifiée'||key==='lead'&&['Active','Planifiée'].includes(job.status)&&(!job.chef||job.chef==='À assigner');
}
// Read-only projection of the shared punch ledger; no counters are persisted.
export function jobHours(data:TimeData,now=Date.now()){
 const segments=data.segments.filter(s=>s.company_id===data.company_id),pay=totals(segments,data.settings,now).byId;
 const today=dateKey(new Date(now),data.settings.timezone);
 const result:Record<string,{today:number;total:number;live:number;employees:Set<string>}>={};
 for(const s of segments){
  const row=result[s.job_id]??={today:0,total:0,live:0,employees:new Set()};
  row.total+=pay[s.id]?.payable||0;
  if(dateKey(s.start_time,data.settings.timezone)===today)row.today+=pay[s.id]?.payable||0;
  if(!s.end_time){row.live+=pay[s.id]?.gross||0;row.employees.add(s.employee_id);}
 }
 return result;
}
