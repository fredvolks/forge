'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Clock3, Folder, MapPin, Navigation } from 'lucide-react';

const jobs:Record<string,{name:string;address:string}>={
 'JOB-214':{name:'Breton',address:'1280, rue Industrielle, Québec'},'JOB-315':{name:'Leduc',address:'480, boulevard Leduc, Québec'},'JOB-418':{name:'Bélanger',address:'72, rue Bélanger, Lévis'}
};
const progressItems=[['Élévation droite',75],['Élévation arrière',25],['Élévation gauche',75],['Façade',100]] as const;

export function PunchPreview({role,punched,selectedJob,startedAt,onJob,onToggle,onOpenJob,onHours}:{role:'Chef'|'Employé';punched:boolean;selectedJob:string;startedAt:number|null;onJob:(v:string)=>void;onToggle:()=>void;onOpenJob:()=>void;onHours:()=>void}){
 const [now,setNow]=useState(Date.now());const [reportOpen,setReportOpen]=useState(false);const [progress,setProgress]=useState<Record<string,number>>(()=>Object.fromEntries(progressItems));
 useEffect(()=>{if(!punched)return;const id=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(id)},[punched]);
 const elapsed=startedAt?Math.max(0,now-startedAt):0;const total=Math.floor(elapsed/1000);const timer=`${Math.floor(total/3600)} h ${String(Math.floor(total/60)%60).padStart(2,'0')} min ${String(total%60).padStart(2,'0')} s`;const job=jobs[selectedJob]||{name:'Chantier',address:'Adresse à confirmer'};
 const punch=()=>{if(role==='Chef'&&punched)setReportOpen(true);else onToggle()};
 return <div className="punch-redesign punch-v9">
  <header className="new-punch-title"><h1>PUNCH</h1>{role==='Chef'&&<span>CHEF D’ÉQUIPE</span>}</header>
  <div className="new-punch-layout"><div className="new-punch-main">
   <section className={`new-punch-status ${punched?'active':''}`}><div><i/><span>{punched?'EN COURS':'PRÊT À COMMENCER'}</span></div>{punched?<><h2>{selectedJob} — {job.name}</h2><p>Depuis {new Date(startedAt||Date.now()).toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'})} · Temps actuel : {timer}</p></>:<p>Vous n’êtes pas pointé.<br/>Sélectionnez un job puis pointez.</p>}</section>
   <label className="new-job-picker"><span>CHOISIR LE JOB</span><select value={selectedJob} onChange={e=>onJob(e.target.value)}><option value="JOB-214">★ SUGGÉRÉ · JOB-214 — Breton · 86 m</option><option value="JOB-315">JOB-315 — Leduc</option><option value="JOB-418">JOB-418 — Bélanger</option></select></label>
   <button className="new-punch-address"><MapPin/><span>{job.address}</span><Navigation/></button>
   <button className="new-job-folder" onClick={onOpenJob}><Folder/><span><b>Dossier de job</b><small>Plans, photos et extras</small></span><ChevronRight/></button>
   <button className="new-punch-action" onClick={punch}>{punched?'PUNCH OUT':'PUNCH IN'}</button>{punched&&<button className="new-change-job">Changer de job</button>}
  </div><aside className="new-punch-side"><section><span>AUJOURD’HUI</span><small>Total d’heures</small><b>{punched?timer:'0 h 00 min 00 s'}</b><div><i>JOB-214 · 5 h 12</i><i>JOB-315 · 2 h 18</i></div></section><section><span>MA JOURNÉE</span><div className="new-timeline"><i/><p><b>07:04 · PUNCH IN</b><small>JOB-214 — Breton</small></p><i className="muted"/><p><b>{punched?'En cours':'15:32 · PUNCH OUT'}</b><small>{selectedJob} — {job.name}</small></p></div></section></aside></div>
  <footer className="new-punch-footer"><button onClick={onHours}>Voir / modifier mes heures <ArrowRight/></button><p><Clock3/> Déduction automatique selon les paramètres de la compagnie.</p></footer>
  {reportOpen&&<div className="quick-report-backdrop"><section className="quick-report"><button className="quick-close" onClick={()=>setReportOpen(false)}>×</button><span>COMPTE RENDU RAPIDE</span><h2>Avant de terminer votre journée</h2><p><b>{selectedJob} — {job.name}</b><br/>Vos dernières valeurs sont déjà préremplies.</p>{progressItems.map(([label])=><div className="progress-row" key={label}><b>{label}</b><div>{[0,25,75,100].map(v=><button key={v} className={progress[label]===v?'active':''} onClick={()=>setProgress({...progress,[label]:v})}>{v} %</button>)}</div></div>)}<button className="confirm-report" onClick={()=>{setReportOpen(false);onToggle()}}><Check/> CONFIRMER ET PUNCH OUT</button></section></div>}
 </div>
}
