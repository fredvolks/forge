'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Hourglass, LayoutGrid, List, MapPin, MoreHorizontal, Truck } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';

import { AlertTriangle, ArrowLeft, BarChart3, Bell, Box, BriefcaseBusiness, Building2, Check, ChevronRight, ClipboardList, Clock3, FileText, HardHat, History, Home, LogOut, MessageSquare, PackageCheck, Plus, Search, Settings, ShieldCheck, ShoppingCart, Users, Wrench, CircleDollarSign } from 'lucide-react';

import { CommandCenter } from './command-center';


import {AdjointeDiscussion} from './adjointe-discussion';
import {ExpenseNotices,useExpenseDemo} from './expense-workspace';
import {AdjointeDashboard} from './adjointe-dashboard';
import './adjointe-template.css';
import './jobs.css';
import './job-dossier.css';
import {JobForm} from './job-form';
import {HeaderWeather} from './header-weather';
import {CompanyLogoButton} from './company-logo-button';
import {SidebarAccount} from './sidebar-account';
import {WorkforceSummary} from './workforce-summary';
import {EmployeeForm} from './employee-form';
import {ForgeMessages} from './forge-messages';
import {useTimeData} from './use-time-data';
import {duration,dateKey,timeLabel,totals,weekOf,addDays,canReview,createDemoEmployee,saveTeam,type Team} from '../lib/time-domain';
import {changeTimeDemo} from '../lib/time-demo';
import './teams-hours.css';
import {addWorkforceExamples,WORKFORCE_EXAMPLES} from '../lib/workforce-examples';
import {jobHours,matchesJobQuick} from '../lib/job-view';



import { DeliveryReport, EventsPage, NotificationCenter, PersonalSettings, PurchasesPage } from './forge-suite';

import { TimeAdmin, TimeSettings } from './time-admin';
import type { ForgeSession } from './forge-access';
import { getBranding, resolveLogo } from './forge-branding';


type Role='Boss'|'Adjointe';

type AdminJob={id:string;
number:string;
name:string;
address:string;
chef:string;
status:string;
plan?:string};

const defaultJobs:AdminJob[]=[{id:'j214',number:'JOB-214',name:'Breton',address:'1280, rue Industrielle, Québec',chef:'Fred G.',status:'Active',plan:'Plan architecture.pdf'},{id:'j315',number:'JOB-315',name:'Leduc',address:'480, boulevard Leduc, Québec',chef:'Marco T.',status:'Active'},{id:'j418',number:'JOB-418',name:'Bélanger',address:'72, rue Bélanger, Lévis',chef:'À assigner',status:'Planifiée'},{id:'j193',number:'JOB-193',name:'Laurentien',address:'Saint-Augustin-de-Desmaures',chef:'Patrick D.',status:'Terminée'}];


const commandPages=[{id:'received',title:'Commandes reçues',desc:'Nouvelles demandes du terrain',count:'24',icon:ClipboardList},{id:'current',title:'Commandes en cours',desc:'Préparation, fournisseur et livraison',count:'91',icon:PackageCheck},{id:'completed',title:'Commandes complétées',desc:'Historique des bons terminés',count:'68',icon:Check},{id:'inventory',title:'Inventaire',desc:'Stock MIR, réservations et minimums',count:'',icon:Box},{id:'catalog',title:'Catalogue',desc:'Articles, presets et profils de pliage',count:'',icon:BriefcaseBusiness},{id:'suppliers',title:'Fournisseurs',desc:'Fiches et courriels de commande',count:'',icon:Building2},{id:'order-reports',title:'Rapports de commandes',desc:'Consommation, PDF et Excel',count:'',icon:BarChart3},{id:'delivery-report',title:'Rapport des livraisons',desc:'Sorties réelles, restants et export CSV',count:'',icon:PackageCheck}];

const teamPages=[{id:'employees',title:'Employés',desc:'Fiches, rôles et assignations',icon:Users},{id:'crews',title:'Équipes',desc:'Chefs et composition des équipes',icon:ShieldCheck},{id:'punches',title:'Punchs',desc:'Entrées, sorties et chantiers',icon:Clock3},{id:'corrections',title:'Corrections',desc:'Corriger avec historique permanent',icon:History},{id:'time-reports',title:"Rapports d’heures",desc:'CCQ, mois, année et export',icon:BarChart3}];


function routeFromHash(){const raw=window.location.hash.replace(/^#/,'');
if(raw.startsWith('admin/'))return raw.slice(6);
if(['orders','inventory','suppliers'].includes(raw))return raw==='inventory'?'commands/inventory':raw==='suppliers'?'commands/suppliers':'commands';
return 'home'}

export function AdminPortal({role,session,onLogout}:{role:Role;
session:ForgeSession;
onLogout:()=>void}){const [route,setRoute]=useState('home');
const [legacyJobs,setJobs]=useState<AdminJob[]>(defaultJobs);
const sharedTime=useTimeData(session.companyId);
const jobs:AdminJob[]=(sharedTime?.jobs||[]).filter(j=>j.company_id===session.companyId).map(j=>{const legacy=legacyJobs.find(l=>l.id===j.id);return {id:j.id,number:j.number,name:j.name,address:[j.address,j.city].filter(Boolean).join(', ')||legacy?.address||'Adresse non renseignée',chef:j.lead_id?sharedTime?.employees.find(e=>e.id===j.lead_id)?.name||'À assigner':legacy?.chef||'À assigner',status:j.status||legacy?.status||'Planifiée',plan:legacy?.plan}});
const [jobQuery,setJobQuery]=useState('');
const [notificationsOpen,setNotificationsOpen]=useState(false);
const expenseLedger=useExpenseDemo();
const expenseNoticeCount=session.companyId==='mir-demo'?(expenseLedger?.notifications.filter(n=>n.company_id===session.companyId&&n.recipient_user_id===session.email&&!n.read_at).length||0):0;
const [companyLogo,setCompanyLogo]=useState('/mir-company-logo-transparent.png');
useEffect(()=>{setRoute(routeFromHash());
const raw=localStorage.getItem(`forge:${session.companyId}:admin-jobs`);
if(raw)setJobs(JSON.parse(raw));
const pop=()=>setRoute(routeFromHash());
window.addEventListener('popstate',pop);
window.addEventListener('hashchange',pop);
return()=>{window.removeEventListener('popstate',pop);
window.removeEventListener('hashchange',pop)}},[session.companyId]);
useEffect(()=>{const sync=()=>setCompanyLogo(resolveLogo(getBranding(session.companyId),document.documentElement.dataset.mode==='light'?'light':'dark'));sync();window.addEventListener('forge-branding-updated',sync);window.addEventListener('forge-appearance-updated',sync);return()=>{window.removeEventListener('forge-branding-updated',sync);window.removeEventListener('forge-appearance-updated',sync)}},[session.companyId]);
const go=(next:string)=>{window.history.pushState({},'',`#admin/${next}`);
setRoute(next);
window.scrollTo({top:0,behavior:'smooth'})};
const parts=route.split('/');
const section=parts[0];
const currentJob=parts[1]?jobs.find(j=>j.id===parts[1]):undefined;
const jobTab=parts[2]||'overview';
const commandTab=parts[1];
const teamTab=parts[1];
const commandMap:Record<string,string>={received:'Commandes',current:'Commandes',completed:'Commandes',inventory:'Inventaire',catalog:'Catalogue',suppliers:'Fournisseurs','order-reports':'Rapports'};
const breadcrumbs=useMemo(()=>{const result=[{label:'Accueil',route:'home'}];
if(section==='jobs'){result.push({label:'Jobs',route:'jobs'});
if(currentJob)result.push({label:`${currentJob.number} · ${currentJob.name}`,route:`jobs/${currentJob.id}/${jobTab}`})}if(section==='teams'){result.push({label:'Équipes & heures',route:'teams'});
if(teamTab)result.push({label:teamPages.find(p=>p.id===teamTab)?.title||teamTab,route})}if(section==='commands'){result.push({label:'Commandes',route:'commands'});
if(commandTab)result.push({label:commandPages.find(p=>p.id===commandTab)?.title||commandTab,route})}if(section==='reports')result.push({label:'Rapports',route:'reports'});
if(section==='administration')result.push({label:'Administration',route:'administration'});
return result},[section,currentJob,jobTab,commandTab,teamTab,route]);
const [dashboardScale,setDashboardScale]=useState(1);
const [dashboardHeight,setDashboardHeight]=useState(900);
useEffect(()=>{const resize=()=>{const scale=window.innerWidth>700?Math.min(1,window.innerWidth/1440,window.innerHeight/900):1;setDashboardScale(scale);setDashboardHeight(window.innerHeight/scale)};resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[]);
return <main style={role==='Adjointe'&&dashboardScale<1?{width:1440,height:dashboardHeight,zoom:dashboardScale}:undefined} className={`admin-portal ${role==='Adjointe'?'adjointe-template':''} ${route==='home'?'adjointe-home':''}`}>
<aside className="admin-sidebar">
<div className="admin-brand">
<CompanyLogoButton src={companyLogo} companyId={session.companyId} companyName={session.companyName} role={role}/>
<div>
{role!=='Adjointe'&&<b>FORGE</b>}
<small>{session.companyName}</small>
</div>
</div>
<nav>{(role==='Adjointe'?[{id:'home',label:'Accueil',icon:Home},{id:'jobs',label:'Jobs',icon:HardHat},{id:'teams',label:'Équipes & heures',icon:Users},{id:'commands',label:'Commandes',icon:ShoppingCart},{id:'quotes',label:'Soumissions',icon:FileText},{id:'tools',label:'Outils',icon:Wrench},{id:'discussion',label:'Discussion',icon:MessageSquare},{id:'reports',label:'Rapports',icon:BarChart3},{id:'administration',label:'Administration',icon:Settings},{id:'accounting',label:'Comptabilité',icon:CircleDollarSign}]:[{id:'home',label:'Accueil',icon:Home},{id:'jobs',label:'Jobs',icon:HardHat},{id:'teams',label:'Équipes & Heures',icon:Users},{id:'commands',label:'Commandes',icon:ShoppingCart},{id:'discussion',label:'Discussion · 8',icon:MessageSquare},{id:'purchases',label:'Achats',icon:FileText},{id:'events',label:'Événements',icon:Clock3},{id:'reports',label:'Rapports',icon:BarChart3},{id:'administration',label:'Administration',icon:Settings},{id:'settings',label:'Paramètres',icon:Settings}]).map(item=>
<button key={item.id} className={section===item.id?'active':''} onClick={()=>go(item.id)}>
<item.icon/>{item.label}</button>)}</nav>
<SidebarAccount name={session.userName} role={role} companyId={session.companyId} email={session.email} onSettings={()=>go('settings')}/>
</aside>
<section className="admin-page">
<header className="admin-topbar">
<div className="admin-breadcrumbs">{breadcrumbs.map((crumb,index)=>
<span key={`${crumb.route}-${index}`}>{index>0&&<i>/</i>}<button onClick={()=>go(crumb.route)}>{crumb.label}</button>
</span>)}</div>
{role==='Adjointe'&&<form className="oa-global-search" onSubmit={e=>{e.preventDefault();const value=String(new FormData(e.currentTarget).get('search')||'');setJobQuery(value);go('jobs')}}><Search size={18}/><input name="search" aria-label="Rechercher un job" placeholder="Rechercher un job…"/></form>}
<HeaderWeather/>
<button aria-label={`Notifications : ${expenseNoticeCount+(role==='Adjointe'?3:12)} en démo`} aria-expanded={notificationsOpen} className="admin-alert" onClick={()=>setNotificationsOpen(v=>!v)}>
<Bell/>
<b>{expenseNoticeCount+(role==='Adjointe'?3:12)}</b>
</button>

{notificationsOpen&&(role==='Adjointe'?<section className="oa-demo-notifications" aria-label="Notifications fictives"><header><b>Notifications · Démo</b><button onClick={()=>setNotificationsOpen(false)} aria-label="Fermer les notifications">×</button></header>{[['Commande reçue','JOB-214 · Émile a envoyé une commande.','Il y a 5 min'],['Correction de Punch','Simon demande une vérification de ses heures.','Il y a 12 min'],['Livraison fournisseur','La livraison Hilti est arrivée à l’atelier.','Il y a 25 min']].map(([title,message,date])=><article key={title}><i/><div><b>{title}</b><p>{message}</p><small>{date}</small></div></article>)}<ExpenseNotices actor={session} go={go}/><footer>Exemples fictifs, sans envoi ni modification des dossiers.</footer></section>:<NotificationCenter go={go} close={()=>setNotificationsOpen(false)} actor={session}/>)}
</header>
<div className="admin-content">{role==='Adjointe'&&section==='administration'&&<nav className="oa-secondary" aria-label="Accès administratifs"><button onClick={()=>go('purchases')}>Achats / reçus</button><button onClick={()=>go('events')}>Absences</button><button onClick={()=>go('commands/catalog')}>Catalogue</button><button onClick={()=>go('commands/inventory')}>Inventaire</button><button onClick={()=>go('commands/suppliers')}>Fournisseurs</button><button onClick={()=>go('settings')}>Paramètres</button></nav>}{role==='Adjointe'&&['quotes','tools','accounting'].includes(route)&&<section className="oa-panel oa-unconnected"><h2>{({quotes:'Soumissions',tools:'Outils',accounting:'Comptabilité'} as Record<string,string>)[route]}</h2><p>Ce module n’est pas encore relié. Aucune donnée ni action financière n’est simulée ici.</p>{route==='accounting'&&<button className="oa-link" onClick={()=>go('purchases')}>Consulter les achats et reçus existants</button>}</section>}{route==='home'&&(role==='Adjointe'?<AdjointeDashboard session={session} go={go}/>:<Dashboard role={role} go={go}/>)} {route==='jobs'&&<JobsPage jobs={jobs} session={session} query={jobQuery} setQuery={setJobQuery} go={go}/>} {section==='jobs'&&currentJob&&<JobPage job={currentJob} tab={jobTab} go={go} role={role} companyId={session.companyId} session={session}/>} {section==='teams'&&<TeamsHub go={go} session={session} tab={teamTab||'overview'} requestId={parts[2]}/>} {route==='commands'&&<CommandsHub go={go}/>} {section==='commands'&&commandTab&&commandTab!=='delivery-report'&&<div className="portal-page">
<BackButton onClick={()=>go('commands')} label="Retour aux commandes"/>
<PageTitle eyebrow="APPROVISIONNEMENT" title={commandPages.find(p=>p.id===commandTab)?.title||'Commandes'} text="Même source de données, présentée dans sa page de travail dédiée."/>
<CommandCenter role={role} companyId={session.companyId} initialTab={commandMap[commandTab]||'Commandes'} showNav={false} initialOrderId={parts[2]} initialStatus={commandTab==='received'?'À recevoir / traiter':commandTab==='completed'?'Complétée':'Tous'}/>
</div>} {route==='commands/delivery-report'&&<DeliveryReport/>} {route==='discussion'&&(<AdjointeDiscussion session={session} jobs={jobs} onJob={number=>{const job=jobs.find(j=>j.number===number);go(job?`jobs/${job.id}`:'jobs')}}/>)} {section==='purchases'&&<PurchasesPage actor={session} expenseId={parts[1]}/> } {route==='events'&&<EventsPage/>} {route==='settings'&&<PersonalSettings session={session}/>} {route==='reports'&&<ReportsPage go={go}/>} {route==='administration'&&<><AdministrationPage role={role}/><TimeSettings actor={session}/></>}</div>
</section>
</main>}

function PageTitle({eyebrow,title,text}:{eyebrow:string;
title:string;
text:string}){return <div className="portal-title">
<span>{eyebrow}</span>
<h1>{title}</h1>
<p>{text}</p>
</div>}
function BackButton({onClick,label}:{onClick:()=>void;
label:string}){return <button className="portal-back" onClick={onClick}>
<ArrowLeft/>{label}</button>}
function Dashboard({role,go}:{role:Role;
go:(route:string)=>void}){const cards=[{label:'Nouvelles commandes',value:24,note:'8 urgentes',route:'commands/received',icon:ShoppingCart},{label:'Commandes à traiter',value:37,note:'12 fournisseur',route:'commands/current',icon:PackageCheck},{label:'Punchs à vérifier',value:14,note:'Depuis lundi',route:'teams/punches',icon:Clock3},{label:'Achats à vérifier',value:8,note:'1 284,62 $',route:'purchases',icon:FileText},{label:'Jobs actives',value:3,note:'1 démarre bientôt',route:'jobs',icon:HardHat},{label:'Événements à venir',value:2,note:'7 sans réponse',route:'events',icon:Clock3},{label:'Extras à traiter',value:9,note:'3 sans approbation',route:'jobs',icon:Plus},{label:'Alertes importantes',value:5,note:'Stock et échéances',route:'commands/inventory',icon:AlertTriangle}];
return <div className="portal-dashboard">
<PageTitle eyebrow={`VUE ${role.toUpperCase()}`} title={`Bonjour, ${role==='Adjointe'?'Ester':'Simon'}.`} text="Voici uniquement ce qui demande ton attention aujourd’hui."/>
<div className="attention-grid">{cards.map(card=>
<button key={card.label} onClick={()=>go(card.route)}>
<card.icon/>
<span>{card.label}</span>
<b>{card.value}</b>
<small>{card.note}</small>
<ChevronRight/>
</button>)}</div>
<div className="dashboard-flow">
<div>
<span>FLUX DE TRAVAIL</span>
<h2>Une job, un seul dossier maître</h2>
<p>Plans, équipes, heures, commandes, extras, chat et historique restent attachés à la même job.</p>
</div>
<button onClick={()=>go('jobs')}>
<HardHat/> Ouvrir les Jobs</button>
</div>
</div>}
function JobsPage({jobs,session,query,setQuery,go}:{jobs:AdminJob[];session:ForgeSession;query:string;setQuery:(v:string)=>void;go:(route:string)=>void}){
 const [creating,setCreating]=useState(false),[editingJob,setEditingJob]=useState<string|null>(null);
 const time=useTimeData(session.companyId);
 const [quick,setQuick]=useState('all'),[status,setStatus]=useState(''),[city,setCity]=useState(''),[chef,setChef]=useState(''),[sort,setSort]=useState('number'),[view,setView]=useState('cards'),[page,setPage]=useState(1);
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer)},[]);
 const hours=useMemo(()=>time?jobHours(time,now):{},[time,now]);
 const rows=useMemo(()=>session.companyId==='mir-demo'?jobs.filter(j=>time?.jobs.some(t=>t.id===j.id&&t.company_id===session.companyId)):[],[jobs,time,session.companyId]);
 const matchesQuick=matchesJobQuick;
 const kpis=[{key:'active',label:'Jobs actives',icon:HardHat},{key:'upcoming',label:'À venir',icon:Clock3},{key:'delay',label:'En retard',icon:Hourglass},{key:'deliveries',label:'Livraisons aujourd’hui',icon:Truck},{key:'extras',label:'Extras en attente',icon:Box},{key:'incidents',label:'Incidents ouverts',icon:AlertTriangle}];
 const available=['active','upcoming','lead'];
 const filtered=rows.filter(j=>matchesQuick(j,quick)&&(!status||j.status===status)&&(!city||j.address.split(',').at(-1)?.trim()===city)&&(!chef||j.chef===chef)&&`${j.number} ${j.name} ${j.address} ${j.chef} ${time?.jobs.find(record=>record.id===j.id)?.client||''}`.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr'))).sort((a,b)=>sort==='hours'?(hours[b.id]?.today||0)-(hours[a.id]?.today||0):sort==='name'?a.name.localeCompare(b.name,'fr'):a.number.localeCompare(b.number,'fr',{numeric:true}));
 useEffect(()=>setPage(1),[quick,status,city,chef,query,sort]);
 const reset=()=>{setQuick('all');setStatus('');setCity('');setChef('');setQuery('');setSort('number');setPage(1)};
 const actionItems=(job:AdminJob)=><><DropdownMenuItem onClick={()=>go(`jobs/${job.id}/overview`)}>Ouvrir le dossier</DropdownMenuItem>{canReview(session)&&<><DropdownMenuItem onClick={()=>setEditingJob(job.id)}>Modifier</DropdownMenuItem><DropdownMenuItem onClick={()=>setEditingJob(job.id)}>Assigner le chef</DropdownMenuItem></>}<DropdownMenuItem onClick={()=>go(`jobs/${job.id}/team`)}>Voir équipe et heures</DropdownMenuItem><DropdownMenuItem onClick={()=>go(`jobs/${job.id}/orders`)}>Voir commandes</DropdownMenuItem><DropdownMenuItem onClick={()=>go(`jobs/${job.id}/deliveries`)}>Voir livraisons</DropdownMenuItem></>;
 return <div className="forge-jobs">
  <div className="jobs-kpis">{kpis.map(({key,label,icon:Icon})=><button key={key} disabled={!available.includes(key)} title={!available.includes(key)?'Donnée non reliée':undefined} aria-pressed={quick===key} className={`jobs-kpi-${key} ${quick===key?'selected':''}`} onClick={()=>setQuick(quick===key?'all':key)}><Icon/><strong>{available.includes(key)?rows.filter(j=>matchesQuick(j,key)).length:'—'}</strong><span>{label}</span>{available.includes(key)?<ChevronRight className="jobs-kpi-arrow"/>:<small>Non relié</small>}</button>)}</div>
  <div className="jobs-filters"><label className="jobs-search"><Search/><input aria-label="Rechercher une Job" placeholder="Numéro, nom, adresse ou chef…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <select aria-label="Statut" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Tous les statuts</option>{[...new Set(rows.map(j=>j.status))].map(s=><option key={s}>{s}</option>)}</select>
   <select aria-label="Ville" value={city} onChange={e=>setCity(e.target.value)}><option value="">Toutes les villes</option>{[...new Set(rows.map(j=>j.address.split(',').at(-1)?.trim()||''))].map(s=><option key={s}>{s}</option>)}</select>
   <select aria-label="Chef" value={chef} onChange={e=>setChef(e.target.value)}><option value="">Tous les chefs</option>{[...new Set(rows.map(j=>j.chef))].map(s=><option key={s}>{s}</option>)}</select>
   <select aria-label="Trier les Jobs" value={sort} onChange={e=>setSort(e.target.value)}><option value="number">Numéro Job</option><option value="name">Nom</option><option value="hours">Heures aujourd’hui</option></select>
  </div>
  <div className="jobs-resultbar">{canReview(session)&&<button className="jobs-create" onClick={()=>setCreating(true)}><Plus/>Nouvelle Job</button>}<div aria-label="Affichage des Jobs"><button aria-pressed={view==='cards'} onClick={()=>setView('cards')}><LayoutGrid/>Cartes</button><button aria-pressed={view==='list'} onClick={()=>setView('list')}><List/>Liste</button></div></div>
  <div className={`jobs-cards ${view==='list'?'jobs-list-view':''}`}>{filtered.slice((page-1)*12,page*12).map(job=>{const sharedJob=time?.jobs.find(j=>j.id===job.id),h=hours[job.id];return <article className="jobs-card" key={job.id}>
   <div className="jobs-cover-wrap"><button className="jobs-cover" aria-label={`Ouvrir ${job.number} ${job.name}`} onClick={()=>go(`jobs/${job.id}/overview`)}>{sharedJob?.cover_photo?<img className="jobs-cover-image" style={{objectPosition:`${sharedJob.cover_photo_crop?.x??50}% ${sharedJob.cover_photo_crop?.y??50}%`,transform:`scale(${sharedJob.cover_photo_crop?.zoom??1})`,transformOrigin:`${sharedJob.cover_photo_crop?.x??50}% ${sharedJob.cover_photo_crop?.y??50}%`}} src={sharedJob.cover_photo} alt={job.name}/>:<HardHat/>}<span className={`jobs-badge ${job.status==='Active'?'is-active':job.status==='Planifiée'?'is-planned':'is-neutral'}`}>{job.status}</span>{!sharedJob?.cover_photo&&<span className="jobs-photo-label">Photo à ajouter</span>}</button><DropdownMenu><DropdownMenuTrigger className="jobs-more" aria-label={`Actions pour ${job.number}`}><MoreHorizontal/></DropdownMenuTrigger><DropdownMenuContent className="jobs-menu" align="end">{actionItems(job)}</DropdownMenuContent></DropdownMenu></div>
   <div className="jobs-card-body"><button className="jobs-card-name" onClick={()=>go(`jobs/${job.id}/overview`)}><small>{job.number}</small><h2>{job.name}</h2></button><p className="jobs-address"><MapPin/>{job.address}</p>
    <div className="jobs-progress"><span/><small>Progression non renseignée</small></div>
    <p className="jobs-fact"><HardHat/><span>{job.chef==='À assigner'?'Chef à assigner':`Chef : ${job.chef}`}</span></p>
    <p className="jobs-fact"><Users/><span>{sharedJob?.members.length||0} membres assignés</span></p>
    <button className="jobs-fact" onClick={()=>go(`jobs/${job.id}/team`)}><Clock3/><span>Aujourd’hui : <b>{duration(h?.today||0)}</b></span></button>
    <button className="jobs-fact" onClick={()=>go(`jobs/${job.id}/team`)}><Clock3/><span>En cours : <b>{h?.employees.size||0} emp. · {duration(h?.live||0)}</b></span></button>
    <p className="jobs-fact"><ClipboardList/><span>{sharedJob?.planned_end?`Échéance : ${new Date(sharedJob.planned_end+'T12:00:00').toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}`:sharedJob?.planned_delivery?`Livraison prévue : ${new Date(sharedJob.planned_delivery+'T12:00:00').toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}`:sharedJob?.planned_start?`Début prévu : ${new Date(sharedJob.planned_start+'T12:00:00').toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}`:'Échéance non renseignée'}</span></p>
    {job.chef==='À assigner'&&<span className="jobs-warning"><AlertTriangle/>Sans chef</span>}
    <div className="jobs-card-footer"><DropdownMenu><DropdownMenuTrigger className="jobs-action-trigger">Actions<ChevronDown/></DropdownMenuTrigger><DropdownMenuContent className="jobs-menu">{actionItems(job)}</DropdownMenuContent></DropdownMenu><button className="jobs-detail" onClick={()=>go(`jobs/${job.id}/overview`)}>Voir le détail<ArrowRight/></button></div>
   </div></article>})}</div>
  {!filtered.length&&<div className="jobs-empty"><HardHat/><h2>{!time?'Chargement des chantiers…':'Aucun chantier à afficher'}</h2><button onClick={reset}>Réinitialiser les filtres</button></div>}
  {filtered.length>12&&<nav className="jobs-pagination" aria-label="Pages des Jobs"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Précédent</button><span>{page} / {Math.ceil(filtered.length/12)}</span><button disabled={page*12>=filtered.length} onClick={()=>setPage(p=>p+1)}>Suivant</button></nav>}
  {creating&&time&&canReview(session)&&<JobForm actor={session} data={time} onClose={()=>setCreating(false)} onSaved={id=>{setCreating(false);go(`jobs/${id}/overview`)}}/>}
  {editingJob&&time&&canReview(session)&&time.jobs.some(j=>j.id===editingJob&&j.company_id===session.companyId)&&<JobForm key={editingJob} actor={session} data={time} initial={time.jobs.find(j=>j.id===editingJob&&j.company_id===session.companyId)} onClose={()=>setEditingJob(null)} onSaved={()=>setEditingJob(null)}/>}
  {session.companyId==='mir-demo'&&<p className="jobs-source-note">Démo · Heures issues du registre Punch partagé. Rapports, photos, livraisons, extras et incidents non reliés.</p>}
 </div>;
}
function JobPage({job,tab,go,role,companyId,session}:{job:AdminJob;tab:string;go:(route:string)=>void;role:Role;companyId:string;session:ForgeSession}){
 const data=useTimeData(companyId),[editing,setEditing]=useState(false),[now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(t)},[]);
 if(!data)return <p>Chargement du chantier…</p>;
 const record=data.jobs.find(j=>j.id===job.id&&j.company_id===companyId);
 if(!record||!canReview(session))return <p>Job inaccessible.</p>;
 const tabs=[['overview','Aperçu'],['documents','Plans & documents'],['photos','Photos'],['team','Équipe & heures'],['orders','Commandes'],['purchases','Achats & reçus'],['extras','Extras'],['deliveries','Livraisons'],['reports','Rapports'],['chat','Chat'],['history','Historique']];
 const segments=data.segments.filter(s=>s.company_id===companyId),values=totals(segments,data.settings,now).byId;
 const jobSegments=segments.filter(s=>s.job_id===job.id),worked=jobSegments.reduce((s,row)=>s+(values[row.id]?.payable||0),0),live=jobHours(data,now)[job.id];
 const correctionCount=data.corrections.filter(c=>c.company_id===companyId&&c.status==='pending'&&(c.original?.job_id===job.id||c.proposed.job_id===job.id)).length;
 const audits=data.audit.filter(a=>a.company_id===companyId&&(a.entity_id===job.id||[a.before,a.after].some(v=>v&&typeof v==='object'&&'job_id' in v&&v.job_id===job.id))).slice().sort((a,b)=>b.created_at.localeCompare(a.created_at));
 return <div className="job-dossier"><BackButton onClick={()=>go('jobs')} label="Retour aux Jobs"/>
 <header className="jd-heading"><div><small>DOSSIER MAÎTRE</small><h1>{job.number} — {job.name}<span>{job.status}</span></h1><p>{job.address}</p><div className="jd-facts"><span><HardHat/>Chef : {job.chef}</span><span><Users/>{record.members.length} membres assignés</span><span><Clock3/>Début : {record.planned_start||'À préciser'}</span></div></div><button onClick={()=>setEditing(true)}>Modifier la Job</button></header>
 <nav className="jd-tabs" aria-label="Dossier Job">{tabs.map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} className={tab===id?'active':''} onClick={()=>go('jobs/'+job.id+'/'+id)}>{label}</button>)}</nav>
 {tab==='overview'&&<><div className="jd-kpis">{[['Heures estimées',record.estimated_hours===undefined?'—':duration(record.estimated_hours*60)],['Heures travaillées',duration(worked)],['Heures restantes',record.estimated_hours===undefined?'—':duration(Math.max(0,record.estimated_hours*60-worked))],['Progression','Non reliée']].map(([label,value])=><article key={label}><strong>{value}</strong><span>{label}</span></article>)}</div>
 <div className="jd-panels"><section><h2>À surveiller aujourd’hui</h2>{job.chef==='À assigner'&&<p className="jd-alert"><AlertTriangle/>Chef à assigner</p>}{correctionCount>0&&<button onClick={()=>go('teams/corrections')}><Clock3/>{correctionCount} correction(s) en attente</button>}<p className="jd-muted">Les alertes de rapports et de livraisons ne sont pas encore reliées.</p></section><section><h2>Activité aujourd’hui</h2><p><Users/>{live?.employees.size||0} employés avec Punch actif</p><p><Clock3/>{duration(live?.today||0)} aujourd’hui</p><p><Clock3/>{duration(live?.live||0)} en cours</p><button onClick={()=>go('jobs/'+job.id+'/team')}>Voir les heures<ChevronRight/></button></section><section><h2>Planification</h2><p>Début prévu : {record.planned_start||'Non renseigné'}</p><p>Échéance prévue : {record.planned_end||'Non renseignée'}</p><p>Livraison prévue : {record.planned_delivery||'Non renseignée'}</p><p>{record.planning_notes||'Aucune note de planification.'}</p></section><section><h2>Chantier</h2><p>Client : {record.client||'Non renseigné'}</p><p>{record.description||'Aucune description.'}</p>{record.contractor&&<p>Entrepreneur : {record.contractor}</p>}{record.site_instructions&&<p>Consignes : {record.site_instructions}</p>}<button onClick={()=>setEditing(true)}>Compléter le dossier</button></section></div></>}
 {tab==='team'&&<><section className="jd-team"><h2>Équipe actuelle</h2>{data.employees.filter(e=>e.user_id&&record.members.includes(e.user_id)).map(e=><article key={e.id}><b>{e.name}</b><span>{e.role}</span><span>{jobSegments.some(s=>s.employee_id===e.id&&!s.end_time)?'Punch actif':'Sans Punch actif'}</span><span>{duration(jobSegments.filter(s=>s.employee_id===e.id).reduce((v,s)=>v+(values[s.id]?.payable||0),0))}</span></article>)}</section><TimeAdmin actor={session} jobId={job.id}/></>}
 {tab==='purchases'&&<PurchasesPage actor={session} jobId={job.id}/>}
 {tab==='chat'&&<div className="jd-chat"><ForgeMessages session={session} jobs={data.jobs} activeDiscussionId={job.id} embedded onJob={()=>go('jobs/'+job.id+'/overview')}/></div>}
 {tab==='orders'&&<CommandCenter key={job.id} role={role} companyId={companyId} initialTab="Commandes" showNav={false} lockedJobNumber={job.number}/>}
 {['documents','photos','extras','deliveries','reports'].includes(tab)&&<section className="jd-empty"><FileText/><h2>{tabs.find(t=>t[0]===tab)?.[1]}</h2><p>Le registre partagé de ce module n’est pas encore relié à {job.number}.</p><p>Aucun élément fictif n’est présenté comme appartenant au chantier.</p></section>}
 {tab==='history'&&<section className="jd-history"><h2>Historique du chantier</h2>{audits.map(a=><article key={a.id}><div><b>{({job_created:'Job créée',job_updated:'Job modifiée',punch_in:'Début de Punch',punch_out:'Fin de Punch',administrative_correction:'Correction administrative',job_members_assigned:'Membres assignés'} as Record<string,string>)[a.action]||a.action}</b><small>{a.actor_id} · {new Date(a.created_at).toLocaleString('fr-CA')}</small></div><details><summary>Voir le détail</summary><p>{a.reason}</p><pre>{JSON.stringify({avant:a.before,après:a.after},null,2)}</pre></details></article>)}{!audits.length&&<p>Aucun événement enregistré pour cette Job dans le registre démo.</p>}</section>}
 {editing&&<JobForm actor={session} data={data} initial={{...record,address:record.address||job.address,status:record.status||job.status}} onClose={()=>setEditing(false)} onSaved={()=>setEditing(false)}/>}
 </div>;
}
function TeamsHub({go,session,tab,requestId}:{go:(route:string)=>void;session:ForgeSession;tab:string;requestId?:string}){
 const data=useTimeData(session.companyId);
 const [exampleError,setExampleError]=useState('');
 const [employeeEdit,setEmployeeEdit]=useState<string|null>(null);
 useEffect(()=>{if(data&&session.companyId==='mir-demo'&&canReview(session)&&!data.audit.some(a=>a.id===WORKFORCE_EXAMPLES)){void changeTimeDemo(session,d=>addWorkforceExamples(d,session)).catch(e=>setExampleError(e instanceof Error?e.message:'Exemples indisponibles.'));}},[data,session.companyId,session.email,session.role]);
 const [now,setNow]=useState(()=>Date.now()),[quick,setQuick]=useState('all'),[query,setQuery]=useState(''),[employeeSort,setEmployeeSort]=useState({key:'name',ascending:true}),[historyMonth,setHistoryMonth]=useState(''),[historyEmployee,setHistoryEmployee]=useState('');
 const [employeeOpen,setEmployeeOpen]=useState(false),[teamForm,setTeamForm]=useState<Team|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer)},[]);
 if(!data)return <p>Chargement de la main-d’œuvre…</p>;
 if(!canReview(session)||!data.employees.some(e=>e.user_id===session.email&&e.role===session.role))return <p>Accès non autorisé.</p>;
 const employees=data.employees.filter(e=>e.company_id===session.companyId),segments=data.segments.filter(s=>s.company_id===session.companyId),teams=(data.teams||[]).filter(t=>t.company_id===session.companyId);
 const active=segments.filter(s=>!s.end_time),outside=active.filter(s=>s.gps_context?.toLowerCase().includes('hors rayon')),pending=data.corrections.filter(c=>c.company_id===session.companyId&&c.status==='pending');
 const activeEmployees=new Set(active.map(s=>s.employee_id)),occupied=new Set(active.map(s=>s.job_id));
 const activeTeams=teams.filter(t=>t.member_ids.some(id=>activeEmployees.has(id)));
 const hours=jobHours(data,now),today=dateKey(new Date(now),data.settings.timezone),pay=totals(segments,data.settings,now);
 const name=(id:string)=>employees.find(e=>e.id===id)?.name||'Employé inconnu';
 const initials=(fullName:string)=>{const parts=fullName.trim().split(/\s+/).filter(Boolean);if(!parts.length)return '?';if(parts.length===1)return parts[0]![0].toUpperCase();return `${parts[0]![0]}${parts.at(-1)![0]}`.toUpperCase();};
 const tabs=[['overview','Vue d’ensemble'],['employees','Employés'],['crews','Équipes'],['punches','Punchs'],['corrections','Corrections'],['history','Historique']];
 const openTab=(id:string)=>{setQuick('all');go(id==='overview'?'teams':'teams/'+id)};
 const run=async(action:()=>Promise<void>)=>{setError('');setBusy(true);try{await action()}catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible')}finally{setBusy(false)}};
 const shownEmployees=employees.map(employee=>({employee,segment:active.find(s=>s.employee_id===employee.id)})).filter(({segment})=>quick==='outside'?!!segment&&outside.includes(segment):quick==='active'?!!segment:true).sort((a,b)=>Number(!!b.segment)-Number(!!a.segment)||a.employee.name.localeCompare(b.employee.name,'fr'));
 const month=historyMonth||today.slice(0,7);
 const historyRows=segments.filter(s=>dateKey(s.start_time,data.settings.timezone).startsWith(month)&&(!historyEmployee||s.employee_id===historyEmployee));
 const days=[...new Set(historyRows.map(s=>dateKey(s.start_time,data.settings.timezone)))].sort();
 const sum=(list:typeof segments)=>list.reduce((s,row)=>s+(pay.byId[row.id]?.payable||0),0);
 const currentWeek=weekOf(today,data.settings.weekStartsOn);
 const weekHours=sum(segments.filter(s=>{const day=dateKey(s.start_time,data.settings.timezone);return day>=currentWeek&&day<=today}));
 const monthHours=sum(segments.filter(s=>{const day=dateKey(s.start_time,data.settings.timezone);return day.startsWith(today.slice(0,7))&&day<=today}));
 const sumHistory=sum(historyRows);
 return <div className={'teams-hours'+(tab==='employees'?' th-employees-page':'')}>
 <WorkforceSummary active={activeEmployees.size} teams={activeTeams.length} jobs={occupied.size} outside={outside.length} pending={pending.length} today={duration(Object.values(hours).reduce((s,h)=>s+h.today,0))} week={duration(weekHours)} month={duration(monthHours)} filter={value=>{openTab('overview');setQuick(value)}} navigate={id=>{if(id==='activeTeams'){openTab('crews');setQuick('activeTeams')}else{if(id==='history')setHistoryMonth(today.slice(0,7));openTab(id)}}}/>
 <nav className="th-tabs" aria-label="Équipes et heures">{tabs.map(([id,label])=><button aria-current={tab===id?'page':undefined} className={tab===id?'active':''} key={id} onClick={()=>openTab(id)}>{label}{id==='corrections'&&pending.length>0&&<span className="th-correction-badge" aria-label={pending.length+' en attente'}>{pending.length}</span>}</button>)}</nav>
 {error&&<p role="alert" className="mh-error">{error}</p>}
 {tab==='overview'&&<><div className="th-overview">
{!['jobs','hours'].includes(quick)&&<section className="th-panel"><header><h2>Employés ({shownEmployees.length})</h2></header><div className="th-live-list" role="region" aria-label="Liste des employés" tabIndex={0}>{shownEmployees.map(({employee,segment:s})=><div className="th-live-row" key={employee.id}><span className="th-avatar">{initials(employee.name)}</span><span><b>{employee.name}</b>{s?<><small>{data.jobs.find(j=>j.id===s.job_id)?.number} · {timeLabel(s.start_time,data.settings.timezone)}</small></>:<small>Aucun Punch en cours</small>}</span><span><span className={'th-work-status '+(s?'is-active':'is-inactive')}>{s?'Actif':'Inactif'}</span>{s&&<small>{duration(pay.byId[s.id]?.gross||0)} en cours</small>}</span></div>)}{!shownEmployees.length&&<p>{quick==='outside'?'Aucun employé actif hors rayon.':quick==='active'?'Aucun employé actif.':'Aucun employé.'}</p>}</div></section>}
 {quick!=='outside'&&<section className="th-panel"><header><h2>Heures par Job</h2></header>{data.jobs.filter(j=>j.company_id===session.companyId&&(quick!=='jobs'||occupied.has(j.id))).map(j=><button className="th-job-hours" key={j.id} onClick={()=>go('jobs/'+j.id)}><span><b>{j.number} — {j.name}</b></span><span className="th-hours-line"><span>Aujourd’hui</span><b>{duration(hours[j.id]?.today||0)}</b></span><span className="th-hours-line"><span>Total de la Job</span><b>{duration(hours[j.id]?.total||0)}</b></span></button>)}</section>}
 {quick==='all'&&<section className="th-panel th-watch-panel"><header><h2>À surveiller maintenant</h2></header>{outside.map(s=><button className="th-alert" key={s.id} onClick={()=>name(s.employee_id)==='Marc Bouchard'?openTab('punches'):setQuick('outside')}><AlertTriangle/><span><b>{name(s.employee_id)}</b><small>{name(s.employee_id)==='Marc Bouchard'?'A modifié son punch':'A punché hors rayon'}</small></span></button>)}{pending.map(c=><button className="th-alert" key={c.id} onClick={()=>go('teams/corrections/'+c.id)}><Clock3/><span><b>{name(c.employee_id)}</b><small>Correction en attente</small></span></button>)}{!outside.length&&!pending.length&&<p>Aucune alerte issue des Punchs.</p>}</section>}
 </div></>}
 {tab==='employees'&&<><div className="th-filters th-employee-toolbar"><label>Rechercher<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom ou téléphone…"/></label><button className="th-add-employee" onClick={()=>{setError('');setEmployeeOpen(true)}}><Plus/>Nouvel employé</button></div><div className="th-employee-list th-directory"><div className="th-directory-head">{[['name','Nom'],['role','Rôle'],['status','Statut']].map(([key,label])=><button key={key} onClick={()=>setEmployeeSort(s=>({key,ascending:s.key===key?!s.ascending:true}))} aria-label={'Trier par '+label}>{label} <span aria-hidden="true">{employeeSort.key===key?(employeeSort.ascending?'↑':'↓'):'↕'}</span></button>)}</div><div className="th-directory-scroll" role="region" aria-label="Liste des employés, dix lignes visibles" tabIndex={0}>{employees.filter(e=>(e.name+' '+(e.phone||'')).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>{const value=(e:typeof a)=>employeeSort.key==='role'?e.role:employeeSort.key==='status'?(activeEmployees.has(e.id)?'Actif':'Inactif'):e.name;const order=value(a).localeCompare(value(b),'fr')||a.name.localeCompare(b.name,'fr');return employeeSort.ascending?order:-order}).map(e=><details key={e.id}><summary><span className="th-avatar">{initials(e.name)}</span><b>{e.name}</b><span>{e.role}</span><span className={'th-work-status '+(activeEmployees.has(e.id)?'is-active':'is-inactive')}>{activeEmployees.has(e.id)?'Actif':'Inactif'}</span></summary><div><p>Téléphone : {e.phone||'Non renseigné'}</p><p>Accès : {e.user_id?'Compte démo':'Sans compte Forge'}</p><p>Équipe : {teams.filter(t=>t.member_ids.includes(e.id)).map(t=>t.name).join(', ')||'Non assignée'}</p><p>Jobs : {data.jobs.filter(j=>e.user_id&&j.members.includes(e.user_id)).map(j=>j.number).join(', ')||'Non assignées'}</p><button onClick={()=>setEmployeeEdit(e.id)}>Ouvrir la fiche employé</button><button onClick={()=>openTab('punches')}>Consulter les Punchs</button></div></details>)}</div></div></>}
 {tab==='crews'&&<><div className="th-team-grid">{(quick==='activeTeams'?activeTeams:teams).map(t=>{const teamSegments=segments.filter(s=>t.member_ids.includes(s.employee_id)),teamActive=teamSegments.filter(s=>!s.end_time);const todayMinutes=sum(teamSegments.filter(s=>dateKey(s.start_time,data.settings.timezone)===today));const livePay=teamActive.reduce((a,s)=>a+(pay.byId[s.id]?.gross||0),0);const leadSegment=t.lead_id?[...teamSegments.filter(s=>s.employee_id===t.lead_id)].sort((a,b)=>a.start_time.localeCompare(b.start_time)).pop():undefined;const leadJobId=leadSegment?.job_id||t.job_id;return <article className="th-panel th-team-card" key={t.id}><header className="th-team-header"><div><h2>{t.name}</h2><span>{new Set(teamActive.map(s=>s.employee_id)).size} membre{new Set(teamActive.map(s=>s.employee_id)).size===1?'':'s'} actif{new Set(teamActive.map(s=>s.employee_id)).size>1?'s':''} · {t.member_ids.length} membre{t.member_ids.length===1?'':'s'}</span></div></header><div className="th-team-badges"><span className="th-badge">Chef · {t.lead_id?name(t.lead_id):'Non assigné'}</span><span className="th-badge">Job · {data.jobs.find(j=>j.id===leadJobId)?.number||'Non assignée'}</span><span className={`th-badge ${teamActive.length ? 'th-badge-active' : 'th-badge-idle'}`}>{teamActive.length?'ACTIF':'INACTIF'}</span></div><div className="th-avatars">{t.member_ids.map(id=><span className="th-avatar" title={name(id)} key={id}>{initials(name(id))}</span>)}</div><div className="th-team-metrics"><div><b>{duration(livePay)}</b><small>En cours</small></div><div><b>{duration(todayMinutes)}</b><small>Aujourd’hui</small></div><div><b>{t.member_ids.length}</b><small>Membres</small></div></div><button className="th-team-action" onClick={()=>{setError('');setTeamForm(structuredClone(t))}}>Voir / modifier l’équipe</button></article>})}</div>{!teams.length&&<p>Aucune équipe créée. Utilisez « Nouvelle équipe » pour composer la première.</p>}</>}
 {['punches','corrections','time-reports'].includes(tab)&&<TimeAdmin actor={session} mode={tab} requestId={requestId}/>}
 {tab==='history'&&<><div className="th-filters"><label>Mois<input type="month" value={month} onChange={e=>setHistoryMonth(e.target.value)}/></label><label>Employé<select value={historyEmployee} onChange={e=>setHistoryEmployee(e.target.value)}><option value="">Tous les employés</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label></div><div className="th-kpis"><article><strong>{duration(sumHistory)}</strong><span>Heures payables</span></article><article><strong>{duration(days.length?Math.round(sumHistory/days.length):0)}</strong><span>Moyenne par jour actif</span></article><article><strong>{days.length}</strong><span>Jours avec activité</span></article></div><div className="th-history-chart" aria-label="Heures payables par jour">{days.map(day=>{const value=sum(historyRows.filter(s=>dateKey(s.start_time,data.settings.timezone)===day));return <div key={day} title={day+' : '+duration(value)}><span>{duration(value)}</span><i style={{height:Math.max(2,value/Math.max(1,...days.map(d=>sum(historyRows.filter(s=>dateKey(s.start_time,data.settings.timezone)===d))))*120)}}/><small>{day.slice(8)}</small></div>})}</div><div className="th-panel"><h2>Détail par semaine</h2>{[...new Set(historyRows.map(s=>weekOf(dateKey(s.start_time,data.settings.timezone),data.settings.weekStartsOn)))].sort().map(w=>{const list=historyRows.filter(s=>weekOf(dateKey(s.start_time,data.settings.timezone),data.settings.weekStartsOn)===w);return <p className="th-week" key={w}><b>{w} → {addDays(w,6)}</b><span>{duration(sum(list))} payables</span><span>{duration(list.reduce((v,s)=>v+pay.byId[s.id].deduction,0))} déduites</span></p>})}{!days.length&&<p>Aucune heure dans cette période.</p>}</div></>}
 {(employeeOpen||employeeEdit)&&<EmployeeForm key={employeeEdit||'new'} data={data} actor={session} employee={employees.find(e=>e.id===employeeEdit)} onClose={()=>{setEmployeeOpen(false);setEmployeeEdit(null)}}/>}
 {teamForm&&<div className="th-modal-backdrop"><section className="th-modal" role="dialog" aria-modal="true" aria-label="Fiche équipe"><header><h2>{teamForm.name||'Nouvelle équipe'}</h2><button aria-label="Fermer" disabled={busy} onClick={()=>setTeamForm(null)}>×</button></header>{error&&<p role="alert">{error}</p>}
 {teamForm&&<form onSubmit={e=>{e.preventDefault();void run(async()=>{await changeTimeDemo(session,d=>saveTeam(d,session,teamForm));setTeamForm(null)})}}><label>Nom<input required autoFocus value={teamForm.name} onChange={e=>setTeamForm({...teamForm,name:e.target.value})}/></label><label>Job<select value={teamForm.job_id||''} onChange={e=>setTeamForm({...teamForm,job_id:e.target.value||null})}><option value="">Aucune job</option>{data.jobs.map(j=><option key={j.id} value={j.id}>{j.number} — {j.name}</option>)}</select></label><label>Chef<select value={teamForm.lead_id||''} onChange={e=>setTeamForm({...teamForm,lead_id:e.target.value||null,member_ids:e.target.value?[...new Set([...teamForm.member_ids,e.target.value])]:teamForm.member_ids})}><option value="">Non assigné</option>{employees.filter(e=>e.role==='Chef').map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><fieldset><legend>Membres</legend>{employees.map(e=><label className="th-check" key={e.id}><input type="checkbox" checked={teamForm.member_ids.includes(e.id)} onChange={event=>setTeamForm({...teamForm,member_ids:event.target.checked?[...teamForm.member_ids,e.id]:teamForm.member_ids.filter(id=>id!==e.id),lead_id:!event.target.checked&&teamForm.lead_id===e.id?null:teamForm.lead_id})}/>{e.name} · {e.role}</label>)}</fieldset><p>La job choisie sera ajoutée aux affectations des membres ayant un compte. Les affectations précédentes sont conservées.</p><button disabled={busy}>Enregistrer l’équipe</button></form>}</section></div>}
 <small className="th-demo">Démo locale · mêmes segments que Punch, Mes heures et Jobs.</small>
 </div>;
}

function CommandsHub({go}:{go:(route:string)=>void}){return <div className="portal-page">
<PageTitle eyebrow="APPROVISIONNEMENT" title="Commandes" text="Choisis la fonction à ouvrir. Chaque espace possède sa propre page et un retour clair."/>
<div className="command-hub-grid">{commandPages.filter(page=>!['order-reports','delivery-report'].includes(page.id)).map(page=>
<button key={page.id} onClick={()=>go(`commands/${page.id}`)}>
<page.icon/>
<div>
<b>{page.title}</b>
<small>{page.desc}</small>
</div>{page.count&&<strong>{page.count}</strong>}<ChevronRight/>
</button>)}</div>
</div>}
function ReportsPage({go}:{go:(route:string)=>void}){return <div className="portal-page">
<PageTitle eyebrow="ANALYSE" title="Rapports" text="Heures, coûts, rendement et consommation sans dupliquer les données sources."/>
<div className="report-hub">
<button onClick={()=>go('commands/delivery-report')}><PackageCheck/><div><b>Rapport des livraisons</b><small>Sorties réelles, restants et export CSV</small></div><ChevronRight/></button>
<button onClick={()=>go('purchases')}><FileText/><div><b>Achats & remboursements</b><small>Factures, validations et remboursements</small></div><ChevronRight/></button>
<button onClick={()=>go('teams/time-reports')}>
<Clock3/>
<div>
<b>Rapports d’heures</b>
<small>CCQ, audit et corrections</small>
</div>
<ChevronRight/>
</button>
<button onClick={()=>go('commands/order-reports')}>
<BarChart3/>
<div>
<b>Rapports de commandes</b>
<small>Consommation par item, job et fournisseur</small>
</div>
<ChevronRight/>
</button>
<button onClick={()=>go('jobs')}>
<HardHat/>
<div>
<b>Rendement par Job</b>
<small>Heures, matériaux et extras</small>
</div>
<ChevronRight/>
</button>
</div>
</div>}
function AdministrationPage({role}:{role:Role}){const cards=[['Fiches employés','Coordonnées, statut et dossier'],['Rôles & permissions','Boss, Adjointe, Chef et Employé'],['Métiers & grades','Apprentis, compagnons et spécialités'],['Syndicats','Affiliations des employés'],['Taux & grilles salariales','Taux horaires et historique'],['Compagnie','Logo, coordonnées et paramètres']];
return <div className="portal-page">
<PageTitle eyebrow="PARAMÈTRES" title="Administration" text={`Gestion réservée au ${role} et regroupée dans une seule section.`}/>
<div className="administration-grid">{cards.map(([title,text])=>
<button key={title}>
<Settings/>
<div>
<b>{title}</b>
<small>{text}</small>
</div>
<ChevronRight/>
</button>)}</div>
<div className="permissions-note">
<ShieldCheck/>
<span>
<b>Une compagnie, une source de données</b>
<small>Chaque fiche et chaque paramètre restent liés au company_id de Les Revêtements MIR.</small>
</span>
</div>
</div>}
