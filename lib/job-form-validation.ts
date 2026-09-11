import type {Actor,JobRecord,TimeData} from './time-domain';
export function validateJobStep(job:JobRecord,step:number,data:TimeData,actor:Actor):string|null{
 if(job.company_id!==actor.companyId||data.company_id!==actor.companyId)return 'Compagnie inaccessible.';
 if(step===0){
  if(!job.number.trim())return 'Indiquez le numéro de Job.';
  if(data.jobs.some(j=>j.company_id===actor.companyId&&j.id!==job.id&&j.number.trim().toLocaleLowerCase()===job.number.trim().toLocaleLowerCase()))return 'Ce numéro de Job existe déjà.';
  if(!job.name.trim())return 'Indiquez le nom du chantier.';
  if(!job.client?.trim())return 'Indiquez le client.';
  if(!job.project_type)return 'Choisissez le type de projet.';
  if((job.description?.length||0)>500)return 'La description est limitée à 500 caractères.';
 }
 if(step===1&&(!job.address?.trim()||!job.city?.trim()||!job.province?.trim()||!job.postal_code?.trim()))return 'Complétez l’adresse, la ville, la province et le code postal.';
 if(step===2){
  if(job.estimated_hours!==undefined&&(!Number.isFinite(job.estimated_hours)||job.estimated_hours<0))return 'Les heures estimées doivent être positives ou nulles.';
  for(const value of [job.planned_start,job.planned_end,job.planned_delivery])if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))))return 'Vérifiez les dates.';
  if(job.planned_start&&job.planned_end&&job.planned_end<job.planned_start)return 'L’échéance doit suivre le début prévu.';
  if(job.planned_start&&job.planned_delivery&&job.planned_delivery<job.planned_start)return 'La livraison doit suivre le début prévu.';
 }
 if(step===3){
  if(job.members.some(id=>!data.employees.some(e=>e.company_id===actor.companyId&&e.user_id===id&&id)))return 'Un employé sélectionné n’est plus accessible.';
  if(job.lead_id&&!data.employees.some(e=>e.company_id===actor.companyId&&e.id===job.lead_id&&e.role==='Chef'&&job.members.includes(e.user_id)))return 'Le chef doit faire partie des employés assignés.';
  if(job.team_id&&!data.teams?.some(t=>t.company_id===actor.companyId&&t.id===job.team_id))return 'Cette équipe n’est plus accessible.';
 }
 return null;
}
