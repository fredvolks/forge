'use client';
import {ClipboardList,Truck,Clock3,Users,Receipt,Wrench,FileText,CircleDollarSign,Box,ChevronRight} from 'lucide-react';
import type {ForgeSession} from './forge-access';
type Order={id:string;companyId:string;job:string;requester:string;date:string;status:string;priority?:string;items:{source?:string;supplier?:string}[]};
export function AdjointeDashboard({session,go}:{session:ForgeSession;go:(route:string)=>void}){
 const preview=()=>window.alert('Données fictives de l’accueil uniquement. Aucun dossier réel n’est modifié.');
 const error='';
 const orders:Order[]=[
 {id:'CMD-1025',companyId:session.companyId,job:'JOB-214 · Breton',requester:'Émile R.',date:'2026-09-12',status:'Partiellement traitée',items:[{supplier:'Hilti Canada'}]},
 {id:'CMD-1024',companyId:session.companyId,job:'JOB-315 · Leduc',requester:'Simon L.',date:'2026-09-13',status:'Réservée',items:[{supplier:'RONA'}]},
 {id:'CMD-1023',companyId:session.companyId,job:'JOB-418 · Bélanger',requester:'Marc T.',date:'2026-09-14',status:'Commandée',items:[{supplier:'Bétonel'}]},
 {id:'CMD-1022',companyId:session.companyId,job:'Atelier',requester:'Adjointe',date:'2026-09-11',status:'Complète',items:[{supplier:'Grainger Canada'}]},
 {id:'CMD-1021',companyId:session.companyId,job:'JOB-214 · Breton',requester:'Julie M.',date:'2026-09-15',status:'Partiellement traitée',items:[{supplier:'Deschênes & Fils'}]}
 ];
 const pending=Array.from({length:7});
 const approvals=[{id:'demo-1',label:'Correction de Punch — Simon'},{id:'demo-2',label:'Reçu d’achat — 84,62 $'},{id:'demo-3',label:'Demande de congé — Julie'},{id:'demo-4',label:'Dossier employé — Marc'}];
 const tasks=[
 {id:'t1',label:'JOB-214 — commande employé reçue',person:'Émile R.',status:'Urgent',route:'commands/received'},
 {id:'t2',label:'Hilti — livraison fournisseur reçue',person:'Adjointe',status:'En attente',route:'commands'},
 {id:'t3',label:'Simon — modification de Punch',person:'Simon L.',status:'À valider',route:'teams/corrections'},
 {id:'t4',label:'Marc — outil brisé',person:'Marc T.',status:'En attente',route:'tools'},
 {id:'t5',label:'SOU-104 — soumission à suivre',person:'Adjointe',status:'Suivi',route:'quotes'},
 {id:'t6',label:'JOB-315 — fin prévue vendredi',person:'Adjointe',status:'Suivi',route:'jobs'}
 ];
 const time={jobs:[{id:'j214',number:'JOB-214',name:'Breton',chef:'Fred',progress:68},{id:'j315',number:'JOB-315',name:'Leduc',chef:'Marco',progress:42},{id:'j418',number:'JOB-418',name:'Bélanger',chef:'Patrick',progress:25}]};
 const kpis=[{label:'Commandes à traiter',value:7,icon:ClipboardList,route:'commands/received'},{label:'Réceptions fournisseur',value:3,icon:Truck,route:'commands'},{label:'Punchs à approuver',value:4,icon:Clock3,route:'teams/corrections'},{label:'Congés / maladies',value:2,icon:Users,route:'events'},{label:'Achats à vérifier',value:5,icon:Receipt,route:'purchases'},{label:'Outils brisés',value:2,icon:Wrench,route:'tools'},{label:'Soumissions à suivre',value:3,icon:FileText,route:'quotes'},{label:'Comptes clients à recevoir',value:'84 250 $',icon:CircleDollarSign,route:'accounting'}];
 const link=(label:string,route:string)=><button className="oa-link" onClick={()=>go(route)}>{label}<ChevronRight size={14}/></button>;
 return <div className="oa-dashboard">{error&&<p role="alert">{error}</p>}
 <div className="oa-kpis">{kpis.map(k=><button key={k.label} onClick={()=>k.route&&go(k.route)} disabled={!k.route} className="oa-kpi"><i><k.icon size={22}/></i><span>{k.label}</span><b>{k.value}</b><small>{'Fictif'}</small></button>)}</div>
 <div className="oa-middle"><div className="oa-left">
 <section className="oa-panel oa-tasks"><h2>À faire aujourd’hui</h2><div className="oa-records">{tasks.slice(0,6).map(t=><button className="oa-task" key={t.id} onClick={preview}><ClipboardList size={17}/><span>{t.label}</span><small>{t.person}</small><em className={t.status==='Urgent'?'oa-danger':'oa-status'}>{t.status}</em></button>)}{!tasks.length&&<p className="oa-empty">Aucune demande en attente.</p>}</div>{link('Voir toutes les tâches','commands/received')}</section>
 <section className="oa-panel oa-modules"><h2>Aperçu des modules</h2><div>{[{name:'Commandes',icon:ClipboardList,lines:[`${pending.length} à traiter`,'3 réceptions','12 en cours'],route:'commands/received'},{name:'Inventaire',icon:Box,lines:['532 articles','18 bas stocks','6 ruptures'],route:'commands/inventory'},{name:'Absences',icon:Users,lines:['2 absences','1 congé à venir','0 en attente'],route:'events'},{name:'Comptabilité',icon:CircleDollarSign,lines:['84 250 $ à recevoir','26 400 $ à payer','5 200 $ à facturer'],route:'purchases'}].map(m=><article key={m.name}><h3><m.icon size={22}/>{m.name}</h3><div>{m.lines.map(l=><p key={l}>{l}</p>)}</div>{link('Voir le module',m.route)}</article>)}</div></section>
 </div><div className="oa-right">
 <section className="oa-panel oa-approvals"><h2>Approbations rapides</h2><div className="oa-records">{approvals.slice(0,4).map(a=><div className="oa-approval" key={a.id}><Clock3 size={17}/><span>{a.label}</span><button onClick={preview}>Voir</button><button className="oa-gold" onClick={preview} title="Examiner la demande avant de l’approuver">Examiner</button></div>)}{!approvals.length&&<p className="oa-empty">Aucune approbation en attente.</p>}</div>{approvals.length>4&&link('Voir toutes les demandes','teams/corrections')}</section>
 <div className="oa-right-bottom"><section className="oa-panel oa-finance"><h2>Suivi financier</h2>{['À recevoir','À payer fournisseurs','Remboursements employés','Extras à facturer'].map((l,i)=><div key={l}><span>{l}</span><b>{['84 250 $','26 400 $','486,24 $','5 200 $'][i]}</b></div>)}<small>Données fictives — accueil seulement</small></section><section className="oa-panel oa-jobs"><h2>Jobs actives</h2><div className="oa-records">{time.jobs.map(j=><button key={j.id} onClick={preview}><b>{j.number}</b><span>{j.name}</span><span>{j.progress}%</span><span className="oa-job-chef">Chef d’équipe : {j.chef}</span><progress aria-label={j.number} max={100} value={j.progress}/></button>)}</div>{link('Voir tous les jobs','jobs')}</section></div>
 </div></div>
 <section className="oa-panel oa-recent"><h2>Commandes récentes</h2><div className="oa-table-wrap"><table><thead><tr>{['No','Job','Demandeur','Fournisseur / source','Statut','Livraison'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{orders.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(o=><tr key={o.id}><td><button title={o.id} onClick={preview}>{o.id.length>18?o.id.slice(0,11)+'…':o.id}</button></td><td>{o.job}</td><td>{o.requester}</td><td>{[...new Set(o.items.map(i=>i.supplier||i.source).filter(Boolean))].join(', ')||'—'}</td><td><em className="oa-status">{o.status}</em></td><td>{o.date}</td></tr>)}</tbody></table>{!orders.length&&<p className="oa-empty">Les commandes de l’équipe apparaîtront ici.</p>}</div>{link('Voir toutes les commandes','commands/received')}</section>
 </div>
}
