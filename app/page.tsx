'use client';

import { useMemo, useState } from 'react';
import {
  Bell, Box, Check, ChevronRight, Clock3, Factory, FileText, HardHat, LayoutDashboard,
  Mail, Menu, MessageSquare, PackageCheck, Paperclip, Plus, Search, Send, Settings, ShieldCheck,
  Users, X, Zap,
} from 'lucide-react';

type Role = 'Boss' | 'Adjointe' | 'Chef' | 'Employé';
type Order = { id: string; job: string; client: string; title: string; stage: 'À préparer' | 'En production' | 'Prêt' | 'Livraison'; due: string; lead: string; progress: number; color: string; access: Role[] };
const orders: Order[] = [
  { id: 'CMD-2481', job: 'JOB-214', client: 'Breton', title: 'Solins & moulures — Phase 2', stage: 'En production', due: 'Aujourd’hui · 15:30', lead: 'Équipe Fred', progress: 68, color: '#ff9f1c', access: ['Boss','Adjointe','Chef','Employé'] },
  { id: 'CMD-2479', job: 'JOB-315', client: 'Construction Leduc', title: 'Panneaux toiture 24 ga', stage: 'Prêt', due: 'Ramassage · 13:00', lead: 'Équipe Samir', progress: 100, color: '#32d583', access: ['Boss','Adjointe','Chef'] },
  { id: 'CMD-2486', job: 'JOB-418', client: 'Toitures Bélanger', title: 'Pliage spécial — 42 pièces', stage: 'À préparer', due: 'Livraison chantier · 2 jours', lead: 'Non assigné', progress: 12, color: '#6c7cff', access: ['Boss','Adjointe'] },
  { id: 'CMD-2473', job: 'JOB-193', client: 'Métal Laurentien', title: 'Revêtement commercial', stage: 'Livraison', due: 'En route · 11:45', lead: 'Patrick D.', progress: 92, color: '#22b8cf', access: ['Boss','Adjointe'] },
];
const requests = [
  { urgent: true, type: 'MATÉRIAUX', title: 'Rouleau acier noir 24 ga', meta: 'Chantier Leduc · demandé par Marco', age: 'il y a 8 min' },
  { urgent: false, type: 'PLIAGE', title: '6 solins en L — 4 po × 6 po', meta: 'Atelier · demandé par Alexandre', age: 'il y a 21 min' },
  { urgent: false, type: 'MATÉRIAUX', title: '2 boîtes vis #12 couleur QC283', meta: 'Chantier Nordik · demandé par Samir', age: 'il y a 34 min' },
];
const team = [
  { name: 'Marco T.', role: 'Chef · Nordik', status: 'Sur chantier', initials: 'MT', tone: 'orange' },
  { name: 'Samir B.', role: 'Chef · Leduc', status: 'À l’atelier', initials: 'SB', tone: 'blue' },
  { name: 'Alexandre P.', role: 'Opérateur pliage', status: 'En production', initials: 'AP', tone: 'violet' },
  { name: 'Karine L.', role: 'Adjointe admin.', status: 'Disponible', initials: 'KL', tone: 'green' },
];

export default function Home() {
  const [role, setRole] = useState<Role>('Boss');
  const [filter, setFilter] = useState('Tous'); const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false); const [toast, setToast] = useState(false); const [mobileNav, setMobileNav] = useState(false);
  const visibleOrders = useMemo(() => orders.filter((o) => o.access.includes(role) && (filter === 'Tous' || o.stage === filter) && `${o.id} ${o.job} ${o.client} ${o.title}`.toLowerCase().includes(query.toLowerCase())), [filter, query, role]);
  function submitRequest(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setModal(false); setToast(true); window.setTimeout(() => setToast(false), 3200); }

  return <main className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><HardHat size={23}/></div><div><b>MIR</b><span>DESK</span></div></div>
      <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Fermer le menu"><X/></button>
      <nav aria-label="Navigation principale"><p>ESPACE DE TRAVAIL</p><a className="active" href="#dashboard"><LayoutDashboard/>Vue d’ensemble</a><a href="#orders"><PackageCheck/>Commandes <em>{visibleOrders.length}</em></a><a href="#requests"><Zap/>Demandes <em className="hot">3</em></a><a href="#messages"><MessageSquare/>Communications <i/></a><p>GESTION</p><a href="#team"><Users/>Équipes</a>{(role === 'Boss' || role === 'Adjointe') && <><a href="#inventory"><Box/>Inventaire</a><a href="#suppliers"><Factory/>Fournisseurs</a><a href="#settings"><Settings/>Paramètres</a></>}</nav>
      <div className="shift-card"><div><Clock3/><span>Quart en cours</span></div><b>06:30 — 15:30</b><small>18 membres actifs</small></div>
      <div className="profile"><div className="avatar">ML</div><div><b>Mathieu Leblanc</b><span>Direction</span></div><ChevronRight/></div>
    </aside>
    {mobileNav && <button className="nav-scrim" aria-label="Fermer" onClick={() => setMobileNav(false)}/>}
    <section className="workspace" id="dashboard">
      <header className="topbar"><button className="menu-btn" onClick={() => setMobileNav(true)} aria-label="Ouvrir le menu"><Menu/></button><div className="search"><Search/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher no de job, commande, client…"/><kbd>⌘ K</kbd></div><div className="top-actions"><label className="role-switch"><span>Vue</span><select value={role} onChange={(e) => setRole(e.target.value as Role)}><option>Boss</option><option>Adjointe</option><option>Chef</option><option>Employé</option></select></label><span className="live"><i/> Atelier en activité</span><button aria-label="Notifications" className="icon-btn"><Bell/><b>4</b></button><button className="new-request" onClick={() => setModal(true)}><Plus/> Nouvelle demande</button></div></header>
      <div className="content">
        <div className="welcome"><div><p>MIR DESK · VUE {role.toUpperCase()}</p><h1>{role === 'Adjointe' ? 'Bon matin, Ester.' : role === 'Chef' ? 'Bon matin, Fred.' : role === 'Employé' ? 'Bon matin, Alex.' : 'Bon matin, Simon.'}</h1><span>{role === 'Boss' || role === 'Adjointe' ? 'Vue complète de la compagnie.' : 'Seulement les projets auxquels tu es assigné.'}</span></div><div className="weather"><span>☀</span><div><b>22°C</b><small>Grand-Turk · Dégagé</small></div></div></div>
        <section className="metrics" aria-label="Indicateurs du jour">
          <article><div className="metric-icon amber"><PackageCheck/></div><div><span>COMMANDES ACTIVES</span><b>12</b><small><i>+3</i> depuis hier</small></div><svg viewBox="0 0 130 48"><path d="M2 40 C20 38,22 27,38 30 S58 18,72 23 S91 8,108 14 S120 6,128 3"/></svg></article>
          <article><div className="metric-icon red"><Zap/></div><div><span>DEMANDES À TRAITER</span><b>3</b><small><strong>1 urgente</strong></small></div><div className="pulse-rings"><i/><i/><i/></div></article>
          <article><div className="metric-icon green"><ShieldCheck/></div><div><span>PRODUCTION DU JOUR</span><b>84%</b><small><i>+6%</i> vs objectif</small></div><div className="donut"><span>84</span></div></article>
          <article><div className="metric-icon blue"><Users/></div><div><span>ÉQUIPES ACTIVES</span><b>4/5</b><small>18 employés présents</small></div><div className="mini-faces"><i>MT</i><i>SB</i><i>AP</i><i>+15</i></div></article>
        </section>
        <div className="main-grid"><section className="panel orders-panel" id="orders">
          <div className="panel-head"><div><h2>Commandes en cours</h2><p>Suivi en temps réel de la production</p></div><button>Voir l’historique <ChevronRight/></button></div>
          <div className="filters">{['Tous','À préparer','En production','Prêt','Livraison'].map((f) => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}{f === 'Tous' && <span>12</span>}</button>)}</div>
          <div className="order-list">{visibleOrders.map((o) => <article className="order-row" key={o.id}><div className="order-accent" style={{background:o.color}}/><div className="order-main"><div><span>{o.job} · {o.id}</span><b>{o.title}</b><small>{o.client} · Plan PDF disponible</small></div></div><div className="order-stage"><span><i style={{background:o.color}}/>{o.stage}</span><small>{o.lead}</small></div><div className="progress-wrap"><div><span>Progression</span><b>{o.progress}%</b></div><div className="bar"><i style={{width:`${o.progress}%`,background:o.color}}/></div></div><div className="due"><Clock3/><div><small>Échéance</small><b>{o.due}</b></div></div><button className="row-action" aria-label={`Ouvrir ${o.id}`}><ChevronRight/></button></article>)}{visibleOrders.length === 0 && <div className="empty">Aucune commande assignée dans cette vue.</div>}</div>
        </section><aside className="right-stack">
          <section className="panel requests" id="requests"><div className="panel-head"><div><h2>Demandes terrain</h2><p>À approuver ou assigner</p></div><button className="count">3</button></div><div className="request-list">{requests.map((r) => <article key={r.title} className={r.urgent ? 'urgent' : ''}><div className="request-icon">{r.type === 'PLIAGE' ? <Factory/> : <Box/>}</div><div className="request-copy"><div><span>{r.type}</span>{r.urgent && <strong>URGENT</strong>}</div><b>{r.title}</b><small>{r.meta}</small><time>{r.age}</time></div><button aria-label="Traiter"><ChevronRight/></button></article>)}</div><button className="full-button" onClick={() => setModal(true)}><Plus/> Faire une demande</button></section>
          <section className="panel team" id="team"><div className="panel-head"><div><h2>Qui est où</h2><p>Présence en direct</p></div><button>Voir tous</button></div>{team.map((p) => <div className="person" key={p.name}><div className={`avatar ${p.tone}`}>{p.initials}<i/></div><div><b>{p.name}</b><span>{p.role}</span></div><small>{p.status}</small></div>)}</section>
        </aside></div>
        <section className="feature-grid">
          <article className="panel job-hub"><div className="panel-head"><div><h2>Dossier de job</h2><p>Tout ce qui suit le chantier</p></div><button><Plus/> Nouveau job</button></div><div className="job-body"><div className="job-badge">214</div><div><span>JOB-214 · BRETON</span><h3>Réfection enveloppe extérieure</h3><p>Plans, commandes, photos et historique réunis au même endroit.</p><div className="job-actions"><button><FileText/> Plan architecture.pdf</button><button><Paperclip/> Déposer un plan</button></div></div><div className="hours"><span>HEURES PROJET</span><b>213 / 410 h</b><div><i/></div><small>197 h restantes · 52%</small></div></div></article>
          {(role === 'Boss' || role === 'Adjointe') && <article className="panel supplier-card" id="suppliers"><div className="panel-head"><div><h2>Commande fournisseur</h2><p>Brouillon regroupé automatiquement</p></div><span className="draft">BROUILLON</span></div><div className="supplier-body"><div><span>FOURNISSEUR</span><b>Acier Breton Ltée</b><small>commandes@acierbreton.ca</small></div><div className="supplier-lines"><span>Acier noir 24 ga × 2</span><span>Clous gun 3¼ × 5</span><span>Photos employé × 2 jointes</span></div><button onClick={() => { setToast(true); window.setTimeout(() => setToast(false), 3200); }}><Mail/> Ester — Envoyer par email</button><small>Délai demandé : 2 jours · Livraison au chantier</small></div></article>}
          <article className="panel chat-card" id="messages"><div className="panel-head"><div><h2>Discussion · JOB-214</h2><p>{role === 'Chef' ? 'Fred, Simon et Ester' : 'Simon, Ester et Fred'}</p></div><span className="private-pill">PRIVÉE</span></div><div className="chat-body"><div><b>ESTER</b><p>J’ai reçu tes photos. Je les joins à la commande Breton.</p><span>09:42</span></div><div className="mine"><b>{role === 'Chef' ? 'FRED' : role.toUpperCase()}</b><p>Parfait. Il faut livrer directement au chantier dans 2 jours.</p><span>09:44 · Lu</span></div><form onSubmit={(e) => e.preventDefault()}><input placeholder="Écrire dans cette discussion…"/><button aria-label="Envoyer"><Send/></button></form></div></article>
        </section>
      </div>
    </section>
    {modal && <div className="modal-wrap" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(false); }}><form className="modal order-modal" onSubmit={submitRequest}><div className="modal-head"><div><span>COMMANDE MULTI-ARTICLES</span><h2>Nouvelle demande terrain</h2><p>Ajoute plusieurs articles, quantités et photos en une seule demande.</p></div><button type="button" onClick={() => setModal(false)} aria-label="Fermer"><X/></button></div><div className="form-row"><label>No de job<select required defaultValue="JOB-214"><option>JOB-214 — Breton</option><option>JOB-315 — Leduc</option></select></label><label>Catégorie<select><option>Matériaux</option><option>Outils</option><option>Pliage</option></select></label></div><div className="preset-title"><span>ARTICLES RAPIDES</span><button type="button"><Plus/> Créer un preset</button></div><div className="presets">{['Lame Olfa 1″','Tape 3M','Broche soffite','Broche Maibec','Clou revêtement','Clou gun 3¼','Tape rouge','Clou finition','Papier joint fibro','Lame Skill 7¼'].map((item) => <button type="button" key={item}><Plus/>{item}</button>)}</div><div className="item-line"><label>Article<input required defaultValue="Lame Olfa 1″"/></label><label>Qté<input required type="number" min="1" defaultValue="2"/></label><label>Unité<select><option>boîte</option><option>unité</option><option>rouleau</option><option>paquet</option></select></label><button type="button" aria-label="Retirer"><X/></button></div><button type="button" className="add-line"><Plus/> Ajouter un autre article</button><label className="photo-drop"><input type="file" accept="image/*" multiple/><Paperclip/><span><b>Ajouter des photos</b><small>Photos du chantier, croquis ou dimensions</small></span></label><div className="form-row"><label>Priorité<select><option>Normale</option><option>Urgente</option></select></label><label>Livraison souhaitée<input defaultValue="Dans 2 jours — au chantier"/></label></div><label>Note pour l’atelier<textarea placeholder="Couleur, dimensions, angle, détails importants…"/></label><button className="submit" type="submit"><Send/> Envoyer la commande</button></form></div>}
    {toast && <div className="toast"><span><Check/></span><div><b>Demande envoyée</b><small>L’atelier vient d’être avisé.</small></div></div>}
  </main>;
}
