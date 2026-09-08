'use client';


import { useMemo, useState } from 'react';

import { Bell, CalendarDays, Check, ChevronRight, Clock3, Download, FileText, Filter, Image, MessageSquare, PackageCheck, Plus, Receipt, RefreshCcw, Search, Settings, Trash2, Truck, Upload, Users, X } from 'lucide-react';

import type { ForgeSession } from './forge-access';
import { applyAppearance, FORGE_THEMES, getBranding, getCompanyDefaultTheme, getUserAppearance, processCompanyLogo, resolveLogo, saveBranding, saveUserAppearance, type CompanyBranding, type ForgeMode, type ForgeThemeId } from './forge-branding';


const jobs=['Toutes les Jobs','JOB-214 · Breton','JOB-315 · Leduc','JOB-418 · Bélanger'];

const people=['Tous les employés','Fred G.','Alex P.','Marco T.'];

const deliveries=[
 {id:'LIV-0042',date:'2026-09-02',job:'JOB-214 · Breton',bon:'BC-2026-0841',by:'Fred G.',category:'Matériaux',item:'J soffite',color:'Noir',unit:'morceaux',requested:10,shipped:7,total:7,remaining:3,status:'Partielle',prepared:'Simon',supplier:'Inventaire MIR',source:'Inventaire MIR',notes:'Compléter au prochain voyage'},
 {id:'LIV-0048',date:'2026-09-04',job:'JOB-214 · Breton',bon:'BC-2026-0841',by:'Fred G.',category:'Matériaux',item:'J soffite',color:'Noir',unit:'morceaux',requested:10,shipped:3,total:10,remaining:0,status:'Complète',prepared:'Simon',supplier:'Inventaire MIR',source:'Inventaire MIR',notes:''},
 ...Array.from({length:40},(_,i)=>({id:`LIV-${String(50+i).padStart(4,'0')}`,date:`2026-${String(1+(i%9)).padStart(2,'0')}-${String(2+(i%25)).padStart(2,'0')}`,job:jobs[1+(i%3)],bon:`BC-2026-${String(700+i).padStart(4,'0')}`,by:people[1+(i%3)],category:i%4?'Matériaux':'Pliage',item:i%3?'Boîte de soffite':'Moulure de départ',color:i%2?'Blanc':'Noir',unit:i%3?'boîtes':'morceaux',requested:4+(i%16),shipped:3+(i%10),total:3+(i%10),remaining:i%4===0?2:0,status:i%4===0?'Partielle':'Complète',prepared:i%2?'Ester':'Simon',supplier:i%3?'Inventaire MIR':'Acier Breton',source:i%3?'Inventaire MIR':'Fournisseur',notes:''}))
];

const escapeCsv=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`;

function saveCsv(name:string,headers:string[],rows:unknown[][]){const csv='\uFEFF'+[headers,...rows].map(r=>r.map(escapeCsv).join(';')).join('\r\n');
const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
const a=document.createElement('a');
a.href=url;
a.download=name;
a.click();
URL.revokeObjectURL(url)}
function Head({eyebrow,title,text,action}:{eyebrow:string;
title:string;
text:string;
action?:React.ReactNode}){return <div className="suite-head">
<div>
<span>{eyebrow}</span>
<h1>{title}</h1>
<p>{text}</p>
</div>{action}</div>}

export function DeliveryReport(){const [period,setPeriod]=useState('Année 2026'),[job,setJob]=useState(jobs[0]),[employee,setEmployee]=useState(people[0]),[state,setState]=useState('Tous'),[query,setQuery]=useState(''),[group,setGroup]=useState<'Détail'|'Par Job'|'Par matériau'>('Détail');
const filtered=useMemo(()=>deliveries.filter(d=>(job===jobs[0]||d.job===job)&&(employee===people[0]||d.by===employee)&&(state==='Tous'||d.status===state)&&`${d.bon} ${d.item} ${d.category}`.toLowerCase().includes(query.toLowerCase())&&(period!=='Ce mois'||d.date.startsWith('2026-09'))),[period,job,employee,state,query]);
const complete=new Set(filtered.filter(d=>d.status==='Complète').map(d=>d.id)).size,partial=new Set(filtered.filter(d=>d.status==='Partielle').map(d=>d.id)).size,items=filtered.reduce((n,d)=>n+d.shipped,0),bons=new Set(filtered.map(d=>d.bon)).size;
const exportRows=()=>saveCsv('forge-rapport-livraisons.csv',['delivery_id','delivery_date','job_number','job_name','purchase_order_number','requested_by','item_category','item_name','color','unit','quantity_requested','quantity_shipped_this_delivery','quantity_shipped_total','quantity_remaining','delivery_status','prepared_by','supplier','source','notes'],filtered.map(d=>[d.id,d.date,d.job.split(' · ')[0],d.job.split(' · ')[1],d.bon,d.by,d.category,d.item,d.color,d.unit,d.requested,d.shipped,d.total,d.remaining,d.status,d.prepared,d.supplier,d.source,d.notes]));
const grouped=group==='Par Job'?[...new Set(filtered.map(d=>d.job))].map(k=>({key:k,rows:filtered.filter(d=>d.job===k)})):group==='Par matériau'?[...new Set(filtered.map(d=>`${d.item}|${d.unit}`))].map(k=>({key:k.replace('|',' · '),rows:filtered.filter(d=>`${d.item}|${d.unit}`===k)})):[];
return <div className="suite-page delivery-report">
<Head eyebrow="COMMANDES · RAPPORTS" title="Rapport des livraisons" text="Ce qui est réellement sorti, ce qui reste à livrer et pour quelles Jobs." action={<button className="suite-primary" onClick={exportRows}>
<Download/> Exporter CSV</button>}/>
<div className="suite-metrics">{[[Truck,'Livraisons',filtered.length],[PackageCheck,'Articles embarqués',items],[Check,'Livraisons complètes',complete],[Clock3,'Livraisons partielles',partial],[FileText,'Bons concernés',bons]].map(([Icon,label,value])=>
<article key={String(label)}>
<Icon/>
<span>{label as string}</span>
<b>{Number(value).toLocaleString('fr-CA')}</b>
</article>)}</div>
<div className="suite-shortcuts">{['Aujourd’hui','Cette semaine','Ce mois','Année 2026','Personnalisé'].map(v=>
<button className={period===v?'active':''} onClick={()=>setPeriod(v)} key={v}>{v}</button>)}</div>
<div className="suite-filters">
<label>
<Search/>
<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Bon, matériau, catégorie…"/>
</label>
<select value={job} onChange={e=>setJob(e.target.value)}>{jobs.map(v=>
<option key={v}>{v}</option>)}</select>
<select value={employee} onChange={e=>setEmployee(e.target.value)}>{people.map(v=>
<option key={v}>{v}</option>)}</select>
<select value={state} onChange={e=>setState(e.target.value)}>
<option>Tous</option>
<option>Complète</option>
<option>Partielle</option>
</select>
<div className="segmented">{(['Détail','Par Job','Par matériau'] as const).map(v=>
<button className={group===v?'active':''} onClick={()=>setGroup(v)} key={v}>{v}</button>)}</div>
</div>{group==='Détail'?<div className="suite-table">
<div className="suite-tr suite-th">
<span>Date</span>
<span>Livraison / Bon</span>
<span>Job / Demandeur</span>
<span>Article</span>
<span>Demandé</span>
<span>Embarqué</span>
<span>Restant</span>
<span>État</span>
<span>Par</span>
</div>{filtered.map(d=>
<button className="suite-tr" key={d.id}>
<span>{d.date}</span>
<span>
<b>{d.id}</b>
<small>{d.bon}</small>
</span>
<span>
<b>{d.job}</b>
<small>{d.by}</small>
</span>
<span>
<b>{d.item} {d.color}</b>
<small>{d.unit} · {d.source}</small>
</span>
<span>{d.requested}</span>
<span>{d.shipped}</span>
<span className={d.remaining?'warning':''}>{d.remaining}</span>
<span>
<em className={d.status==='Complète'?'ok':'partial'}>{d.status==='Complète'?'✓':'◐'} {d.status}</em>
</span>
<span>{d.prepared}</span>
</button>)}</div>:<div className="report-groups">{grouped.map(g=>
<article key={g.key}>
<div>
<b>{g.key}</b>
<span>{new Set(g.rows.map(r=>r.id)).size} livraisons · {g.rows.reduce((n,r)=>n+r.shipped,0)} articles · {g.rows.filter(r=>r.remaining).length} partielles</span>
</div>
<ChevronRight/>
</article>)}</div>}</div>}

const notices=[{id:1,type:'Commandes',title:'Nouvelle commande reçue',detail:'Fred · JOB-214 · BC-2026-0841 · 6 articles',time:'Il y a 3 min',unread:true,route:'commands/received'},{id:2,type:'Dépenses',title:'Nouvelle dépense à vérifier',detail:'Fred · JOB-214 · Canac · 184,37 $',time:'Il y a 5 min',unread:true,route:'purchases'},{id:3,type:'Punchs',title:'Punch hors rayon',detail:'Marco · JOB-315 · 1,4 km · justification reçue',time:'08:12',unread:true,route:'teams/punches'},{id:4,type:'Jobs',title:'Photo Problème / À signaler',detail:'Alex · JOB-214 · infiltration près de la fenêtre',time:'Hier',unread:false,route:'jobs/j214/photos'}];

export function NotificationCenter({go,close}:{go:(route:string)=>void;
close:()=>void}){const [items,setItems]=useState(notices),[filter,setFilter]=useState('Toutes');
const shown=items.filter(n=>filter==='Toutes'||filter==='À traiter'?filter==='Toutes'||n.unread:n.type===filter);
return <aside className="notice-center">
<header>
<div>
<Bell/>
<span>
<b>Notifications</b>
<small>{items.filter(n=>n.unread).length} non lues</small>
</span>
</div>
<button onClick={close}>
<X/>
</button>
</header>
<nav>{['Toutes','À traiter','Commandes','Dépenses','Punchs','Jobs'].map(v=>
<button className={filter===v?'active':''} onClick={()=>setFilter(v)} key={v}>{v}</button>)}</nav>
<button className="mark-all" onClick={()=>setItems(items.map(n=>({...n,unread:false})))}>
<Check/> Tout marquer comme lu</button>
<section>{shown.map(n=>
<button className={n.unread?'unread':''} key={n.id} onClick={()=>{setItems(items.map(x=>x.id===n.id?{...x,unread:false}:x));
go(n.route);
close()}}>
<i/>
<span>
<b>{n.title}</b>
<small>{n.detail}</small>
<em>{n.time}</em>
</span>
<ChevronRight/>
</button>)}</section>
<footer>Lu ne veut pas dire traité. L’état de l’élément ne change pas.</footer>
</aside>}

export function Discussions(){const [active,setActive]=useState('Fred Messely — Administration'),[message,setMessage]=useState('');
const conversations=[['Fred Messely — Administration','Je vais vérifier tes heures.','2'],['Équipe Simon — Revêtement','Le matériel est embarqué.','5'],['JOB-214 — Breton','Le plan révisé est disponible.','1'],['Marco T. — Administration','Merci!','']];
return <div className="suite-page">
<Head eyebrow="COMMUNICATION" title="Discussion" text="Employés, groupes et Jobs dans un seul moteur de messagerie." action={<button className="suite-primary">
<Plus/> Nouvelle discussion</button>}/>
<div className="discussion-shell">
<aside>
<label>
<Search/>
<input placeholder="Rechercher"/>
</label>
<nav>
<button className="active">Non lus</button>
<button>Employés</button>
<button>Groupes</button>
<button>Jobs</button>
</nav>{conversations.map(c=>
<button className={active===c[0]?'active':''} onClick={()=>setActive(c[0])} key={c[0]}>
<span>
<b>{c[0]}</b>
<small>{c[1]}</small>
</span>{c[2]&&<em>{c[2]}</em>}</button>)}</aside>
<section>
<header>
<div>
<b>{active}</b>
<small>Conversation reliée à la compagnie et aux permissions</small>
</div>
<Users/>
</header>
<div className="messages">
<article>
<b>Fred</b>
<p>J’ai un problème avec mes heures mardi.</p>
<small>09:31</small>
</article>
<article className="mine">
<b>Émilie — Adjointe</b>
<p>Je vais vérifier. Je te confirme ici dès que c’est corrigé.</p>
<small>09:34</small>
</article>
</div>
<form onSubmit={e=>{e.preventDefault();
setMessage('')}}>
<button type="button">＋</button>
<input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Écrire un message…"/>
<button>Envoyer</button>
</form>
</section>
</div>
</div>}

export function EventsPage(){const [present,setPresent]=useState(21),[absent,setAbsent]=useState(4);
return <div className="suite-page">
<Head eyebrow="COMPAGNIE" title="Événements spéciaux" text="Inviter, obtenir les réponses et relancer seulement les personnes sans réponse." action={<button className="suite-primary">
<Plus/> Créer un événement</button>}/>
<div className="event-feature">
<div className="event-date">
<b>06</b>
<span>SEP</span>
</div>
<div>
<span>COMPAGNIE · RÉPONSE REQUISE</span>
<h2>🌭 Party hot-dog à la shop</h2>
<p>Vendredi · 12 h · Shop MIR</p>
</div>
<button>Modifier</button>
</div>
<div className="event-stats">
<article>
<b>32</b>
<span>Invités</span>
</article>
<article className="yes">
<b>{present}</b>
<span>Présents</span>
</article>
<article className="no">
<b>{absent}</b>
<span>Absents</span>
</article>
<article>
<b>{32-present-absent}</b>
<span>Sans réponse</span>
</article>
</div>
<div className="event-actions">
<button onClick={()=>setPresent(v=>v+1)}>
<Check/> Présent</button>
<button onClick={()=>setAbsent(v=>v+1)}>
<X/> Absent</button>
<button>
<Bell/> Rappeler les personnes sans réponse</button>
</div>
<div className="clean-admin-list">{[['Fred G.','Présent'],['Marco T.','Présent'],['Alex P.','Absent'],['Simon L.','Sans réponse']].map(([n,s])=>
<button key={n}>
<Users/>
<div>
<b>{n}</b>
<small>Employé · Les Revêtements MIR</small>
</div>
<em>{s}</em>
<ChevronRight/>
</button>)}</div>
</div>}

const expenses=[['DEP-2026-0048','Fred G.','JOB-214','Canac',184.37,'À vérifier','À rembourser'],['DEP-2026-0047','Alex P.','JOB-315','BMR',93.10,'Approuvée','À rembourser'],['DEP-2026-0041','Fred G.','JOB-214','Canac',84.32,'Approuvée','Remboursé'],['DEP-2026-0039','Marco T.','JOB-315','Essence',150,'Approuvée','Carte compagnie']];

export function PurchasesPage(){const [filter,setFilter]=useState('Toutes');
const rows=expenses.filter(e=>filter==='Toutes'||e[5]===filter||e[6]===filter);
return <div className="suite-page">
<Head eyebrow="ACHATS & REMBOURSEMENTS" title="Dépenses et factures" text="La facture originale, la validation et le remboursement restent séparés." action={<button className="suite-primary" onClick={()=>saveCsv('forge-achats.csv',['expense_number','date','employee','job_number','supplier','total','validation_status','reimbursement_status'],rows.map(e=>[e[0],'2026-09-02',e[1],e[2],e[3],e[4],e[5],e[6]]))}>
<Download/> Exporter CSV</button>}/>
<div className="suite-metrics">{[[Receipt,'À vérifier',expenses.filter(e=>e[5]==='À vérifier').length],[Clock3,'À rembourser',expenses.filter(e=>e[6]==='À rembourser').length],[Check,'Approuvées',expenses.filter(e=>e[5]==='Approuvée').length],[PackageCheck,'Remboursé ce mois','4 820 $']].map(([Icon,l,v])=>
<article key={String(l)} onClick={()=>setFilter(String(l).replace('Approuvées','Approuvée'))}>
<Icon/>
<span>{String(l)}</span>
<b>{String(v)}</b>
</article>)}</div>
<div className="expense-list">{rows.map(e=>
<button key={String(e[0])}>
<Receipt/>
<span>
<b>{String(e[0])} · {String(e[3])}</b>
<small>{String(e[1])} · {String(e[2])} · Facture originale disponible</small>
</span>
<strong>{Number(e[4]).toLocaleString('fr-CA',{style:'currency',currency:'CAD'})}</strong>
<em>{String(e[5])} · {String(e[6])}</em>
<ChevronRight/>
</button>)}</div>
</div>}

export function EmployeeRecords(){const [status,setStatus]=useState('Tous');
const staff=[['Fred','Messely','Charpentier-menuisier','Compagnon','Institutionnel et commercial','Chef d’équipe','Actif'],['Alex','Parent','Charpentier-menuisier','Apprenti période 2','Résidentiel léger','Employé','Actif'],['Marco','Tremblay','Poseur de revêtements souples','Compagnon','Résidentiel lourd','Chef d’équipe','Blessé'],['Patrick','Dubé','Charpentier-menuisier','Apprenti période 3','Industriel','Employé','Mise à pied']];
const shown=staff.filter(s=>status==='Tous'||status==='Actifs'?status==='Tous'||s[6]!=='Mise à pied':s[6]==='Mise à pied');
return <div className="suite-page">
<Head eyebrow="DOSSIERS RH" title="Employés" text="Métier CCQ, secteur, statut RH, salaire et historique dans une fiche dédiée." action={<button className="suite-primary">
<Plus/> Ajouter un employé</button>}/>
<div className="employee-tabs">{['Tous','Actifs','Inactifs'].map(v=>
<button className={status===v?'active':''} onClick={()=>setStatus(v)} key={v}>{v}</button>)}</div>
<div className="suite-filters">
<label>
<Search/>
<input placeholder="Nom, métier, syndicat…"/>
</label>
<select>
<option>Tous les métiers</option>
<option>Charpentier-menuisier</option>
</select>
<select>
<option>Tous les secteurs CCQ</option>
<option>Résidentiel léger</option>
<option>Résidentiel lourd</option>
<option>Institutionnel et commercial</option>
<option>Industriel</option>
<option>Génie civil et voirie</option>
</select>
<select>
<option>Tous les statuts RH</option>
<option>Actif</option>
<option>Blessé</option>
<option>Congé</option>
<option>Mise à pied</option>
</select>
</div>
<div className="employee-records">{shown.map(s=>
<button key={s[0]}>
<span className="person-avatar">{s[0][0]}{s[1][0]}</span>
<div>
<b>{s[0]} {s[1]}</b>
<small>{s[2]} · {s[3]}</small>
</div>
<span>
<b>{s[4]}</b>
<small>{s[5]}</small>
</span>
<em className={s[6]==='Mise à pied'?'off':''}>{s[6]}</em>
<ChevronRight/>
</button>)}</div>
<div className="ccq-banner">
<FileText/>
<span>
<b>Grilles salariales CCQ versionnées</b>
<small>Architecture prête pour les taux officiels par métier, secteur, classification et date d’entrée en vigueur. Aucun taux n’est inventé dans l’interface.</small>
</span>
<button>Administration des grilles</button>
</div>
</div>}

export function PunchControl(){const [anomaly,setAnomaly]=useState('Toutes');
const punch=[['Fred G.','JOB-214','2026-09-02','06:31','15:42','9 h 11','✓ Sur le chantier'],['Alex P.','JOB-214','2026-09-02','06:44','15:19','8 h 35','⚠ Hors rayon · 220 m'],['Marco T.','JOB-315','2026-09-02','06:28','—','Actif','⚠ Punch incomplet']];
const rows=punch.filter(p=>anomaly==='Toutes'||p[6].includes(anomaly));
return <div className="suite-page">
<Head eyebrow="ÉQUIPES & HEURES" title="Centre de contrôle des punchs" text="Corriger, approuver et auditer sans modifier silencieusement les valeurs originales." action={<button className="suite-primary" onClick={()=>saveCsv('forge-punchs.csv',['employee','job','date','time_in','time_out','total','anomaly'],rows)}>
<Download/> Exporter CSV</button>}/>
<div className="suite-metrics">{[[Clock3,'Punchés maintenant',6],[Check,'Modifications à approuver',3],[Filter,'Hors rayon',1],[Bell,'Punchs incomplets',1]].map(([Icon,l,v])=>
<article onClick={()=>setAnomaly(String(l).replace('Punchs incomplets','Punch incomplet'))} key={String(l)}>
<Icon/>
<span>{String(l)}</span>
<b>{String(v)}</b>
</article>)}</div>
<div className="suite-filters">
<label>
<Search/>
<input placeholder="Employé, Job…"/>
</label>
<select>
<option>Cette semaine</option>
<option>Ce mois</option>
<option>Cette année</option>
</select>
<select>
<option>Tous les employés</option>
<option>Fred G.</option>
<option>Alex P.</option>
</select>
<select value={anomaly} onChange={e=>setAnomaly(e.target.value)}>
<option>Toutes</option>
<option>Hors rayon</option>
<option>Punch incomplet</option>
<option>Modification</option>
</select>
</div>
<div className="punch-table">
<div>
<span>Employé</span>
<span>Job</span>
<span>Date</span>
<span>IN</span>
<span>OUT</span>
<span>Total</span>
<span>État</span>
</div>{rows.map(p=>
<button key={p[0]}>{p.map((v,i)=>
<span className={i===6&&v.includes('⚠')?'warning':''} key={i}>{v}</span>)}</button>)}</div>
<div className="audit-card">
<Clock3/>
<span>
<b>Journal d’audit permanent</b>
<small>Original → demandé → approuvé/refusé · personne · date/heure · motif.</small>
</span>
</div>
</div>}

export function PersonalSettings({session}:{session:ForgeSession}){const initial=()=>getUserAppearance(session.companyId,session.email,(session.theme as ForgeThemeId)||'forge');const [appearance,setAppearance]=useState(initial),[saved,setSaved]=useState(initial),[branding,setBranding]=useState<CompanyBranding>(()=>getBranding(session.companyId)),[brandError,setBrandError]=useState(''),[processing,setProcessing]=useState(false);
const preview=(theme:ForgeThemeId)=>{const next={...appearance,theme};setAppearance(next);applyAppearance(next)};
const apply=()=>{const next={...appearance,updatedAt:new Date().toISOString()};setSaved(next);setAppearance(next);saveUserAppearance(session.companyId,session.email,next);applyAppearance(next)};
const upload=async(file?:File)=>{if(!file)return;setBrandError('');setProcessing(true);try{setBranding(await processCompanyLogo(file,session.companyId))}catch(error){setBrandError(error instanceof Error?error.message:'Impossible de préparer ce logo.')}finally{setProcessing(false)}};
const updateBrand=(changes:Partial<CompanyBranding>,action:string)=>setBranding(saveBranding({...branding,...changes},action));
const effectiveMode=(document.documentElement.dataset.mode==='light'?'light':'dark') as 'light'|'dark';
return <div className="suite-page settings-page">
<Head eyebrow="PARAMÈTRES PERSONNELS" title="Apparence" text="Ces choix appartiennent uniquement à votre compte."/>
<div className="mode-picker">
<span>Mode</span>{([['light','Clair'],['dark','Sombre'],['system','Système']] as [ForgeMode,string][]).map(([value,label])=>
<button className={appearance.mode===value?'active':''} onClick={()=>{const next={...appearance,mode:value};setAppearance(next);applyAppearance(next)}} key={value}>{label}</button>)}</div>
<h2>Choisissez votre style Forge</h2>
<p className="settings-intro">Un aperçu en direct s’applique sans modifier vos permissions, vos données ni les autres utilisateurs.</p>
<div className="style-grid">{FORGE_THEMES.map(s=>
<button className={appearance.theme===s.id?'active':''} onClick={()=>preview(s.id)} key={s.id}>
<i className={`style-preview ${s.id}`}>
<b>F</b>
<span/>
<em/>
</i>
<b>{s.name}</b>
<small>{s.description}</small>
</button>)}</div>
<div className="theme-actions">
<button onClick={()=>{setAppearance(saved);applyAppearance(saved)}}>Annuler</button>
<button onClick={()=>preview(getCompanyDefaultTheme(session.companyId,(session.theme as ForgeThemeId)||'forge'))}>Utiliser le thème compagnie</button>
<button className="suite-primary" onClick={apply}>
<Check/> Appliquer ce style</button>
</div>
<section className="branding-panel">
<div className="branding-title"><div><span>IDENTITÉ VISUELLE COMPAGNIE</span><h2>Logo et écran de chargement</h2><p>Le logo appartient à {session.companyName}. Le thème ci-dessus reste personnel.</p></div><label className="branding-upload"><Upload/> Remplacer le logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void upload(e.target.files?.[0])}/></label></div>
{brandError&&<div className="branding-error">{brandError} L’original existant a été conservé.</div>}
{processing&&<div className="branding-processing"><RefreshCcw/> Préparation de votre logo… Vous pouvez continuer à utiliser Forge.</div>}
<div className="branding-compare">
<LogoVariant title="Original" src={branding.original} active={branding.activeVariant==='original'} onUse={()=>updateBrand({activeVariant:'original'},'company_logo_variant_selected')}/>
<LogoVariant title="Version transparente" src={branding.transparent} active={branding.activeVariant==='transparent'} onUse={()=>updateBrand({activeVariant:'transparent'},'company_logo_variant_selected')}/>
</div>
<div className="loader-settings"><div className={`loader-preview ${branding.loaderAnimation} ${branding.loaderSpeed}`}><img src={resolveLogo(branding,effectiveMode)} alt="Aperçu du logo compagnie"/><small>Chargement de Forge…</small></div><div><h3>Écran de chargement</h3><label><input type="checkbox" checked={branding.useAsLoader} onChange={e=>updateBrand({useAsLoader:e.target.checked},e.target.checked?'company_loader_enabled':'company_loader_disabled')}/> Utiliser le logo de la compagnie</label><label>Animation<select value={branding.loaderAnimation} onChange={e=>updateBrand({loaderAnimation:e.target.value as CompanyBranding['loaderAnimation']},'company_loader_animation_changed')}><option value="pulse">Pulse</option><option value="fade">Fondu</option><option value="rotate">Rotation</option><option value="none">Aucune</option></select></label><label>Vitesse<select value={branding.loaderSpeed} onChange={e=>updateBrand({loaderSpeed:e.target.value as 'slow'|'normal'},'company_loader_settings_changed')}><option value="slow">Lente</option><option value="normal">Normale</option></select></label>{branding.original&&<button className="remove-branding" onClick={()=>updateBrand({original:undefined,transparent:undefined,light:undefined,dark:undefined,loader:undefined,useAsLoader:false,activeVariant:'original'},'company_logo_removed')}><Trash2/> Supprimer le logo</button>}</div></div>
<details><summary>Historique des modifications</summary>{branding.audit.length?branding.audit.map((a,i)=><p key={`${a.at}-${i}`}>{new Date(a.at).toLocaleString('fr-CA')} · {a.action.replaceAll('_',' ')}</p>):<p>Aucune modification enregistrée.</p>}</details>
</section>
<div className="settings-sections">
<article>
<Bell/>
<div>
<b>Notifications</b>
<small>Messages de Job, commandes, punchs, extras et alertes selon vos permissions.</small>
</div>
<button>Configurer</button>
</article>
<article>
<Settings/>
<div>
<b>Préférences</b>
<small>Français · format 24 h · densité normale</small>
</div>
<button>Modifier</button>
</article>
</div>
</div>}

function LogoVariant({title,src,active,onUse}:{title:string;src?:string;active:boolean;onUse:()=>void}){return <article className={active?'active':''}><div className="logo-checker">{src?<img src={src} alt={title}/>:<Image/>}</div><b>{title}</b>{active?<strong><Check/> Actuellement utilisé</strong>:src?<button onClick={onUse}>Utiliser cette version</button>:<small>Non disponible</small>}</article>}
