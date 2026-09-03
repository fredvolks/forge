'use client';

import { useState } from 'react';
import { ArrowRight, Building2, Check, Eye, HardHat, LockKeyhole, Mail, Plus, Upload, X } from 'lucide-react';

export type ForgeSession = { companyId: string; companyName: string; userName: string; email: string; role: 'Boss' | 'Adjointe' | 'Chef' | 'Employé'; logo?: string; theme?: string; accent?: string };
const companyThemes=[{id:'charcoal',name:'Charcoal chantier',desc:'Sombre et robuste'},{id:'light',name:'Clair professionnel',desc:'Lumineux et minimal'},{id:'steel',name:'Acier industriel',desc:'Gris métallique'},{id:'contrast',name:'Contraste maximum',desc:'Lisibilité terrain'}];
const themeColors=['#A8FF2E','#73E22F','#21D97D','#00C2A8','#20C7E8','#2F80ED','#4966FF','#7557FF','#A855F7','#D946EF','#FF4DB8','#FF4778','#FF4B3E','#FF7043','#FF8A00','#FFB000','#FFD000','#F3E33B','#D4E157','#8BC34A','#4CAF50','#009688','#00ACC1','#0288D1','#3F51B5','#673AB7','#9C27B0','#C2185B','#B7410E','#E8E8E8'];

const demoAccounts: Record<string, ForgeSession & { password: string }> = {
  'simon@mir.ca': { companyId:'mir-demo', companyName:'Les Revêtements MIR', userName:'Simon', email:'simon@mir.ca', role:'Boss', password:'forge' },
  'ester@mir.ca': { companyId:'mir-demo', companyName:'Les Revêtements MIR', userName:'Ester', email:'ester@mir.ca', role:'Adjointe', password:'forge' },
  'fred@mir.ca': { companyId:'mir-demo', companyName:'Les Revêtements MIR', userName:'Fred', email:'fred@mir.ca', role:'Chef', password:'forge' },
  'alex@mir.ca': { companyId:'mir-demo', companyName:'Les Revêtements MIR', userName:'Alex', email:'alex@mir.ca', role:'Employé', password:'forge' },
};

export function ForgeAccess({ onEnter }:{ onEnter:(session:ForgeSession)=>void }) {
  const [createOpen,setCreateOpen]=useState(false);
  const [email,setEmail]=useState('simon@mir.ca');
  const [password,setPassword]=useState('forge');
  const [error,setError]=useState('');
  const [logo,setLogo]=useState('');
  const [theme,setTheme]=useState('charcoal');
  const [accent,setAccent]=useState('#A8FF2E');
  function login(e:React.FormEvent) {
    e.preventDefault(); setError('');
    const demo=demoAccounts[email.trim().toLowerCase()];
    if(demo && demo.password===password) { const {password:_,...session}=demo; void _; localStorage.setItem('forge:session',JSON.stringify(session)); onEnter(session); return; }
    const companies=JSON.parse(localStorage.getItem('forge:companies') || '[]') as Array<ForgeSession & {password:string}>;
    const account=companies.find((c)=>c.email.toLowerCase()===email.trim().toLowerCase() && c.password===password);
    if(account){ const {password:_,...session}=account; void _; localStorage.setItem('forge:session',JSON.stringify(session)); onEnter(session); return; }
    setError('Courriel ou mot de passe invalide.');
  }
  function createCompany(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form=new FormData(e.currentTarget); const id=`company-${Date.now()}`;
    const session:ForgeSession={companyId:id,companyName:String(form.get('company')),userName:String(form.get('owner')),email:String(form.get('loginEmail')),role:'Boss',logo,theme,accent};
    const stored=JSON.parse(localStorage.getItem('forge:companies') || '[]'); stored.push({...session,password:String(form.get('newPassword')),address:String(form.get('address')),phone:String(form.get('phone')),companyEmail:String(form.get('companyEmail'))});
    localStorage.setItem('forge:companies',JSON.stringify(stored)); localStorage.setItem('forge:session',JSON.stringify(session)); onEnter(session);
  }
  return <main className="forge-access">
    <header><div className="forge-wordmark"><span><HardHat/></span><b>FORGE</b></div><small>OPÉRATIONS DE CHANTIER</small></header>
    <section className="access-grid">
      <div className="access-story"><span>CONSTRUIT POUR LE TERRAIN</span><h1>Votre chantier.<br/><em>Tout au même endroit.</em></h1><p>Employés, heures, jobs, commandes, matériaux, extras et suivi de chantier.</p><div className="access-proof"><div><Check/><span><b>Une seule plateforme</b><small>Du punch jusqu’au bon de commande</small></span></div><div><Building2/><span><b>Chaque compagnie est isolée</b><small>Vos données restent dans votre espace</small></span></div></div></div>
      <form className="access-login" onSubmit={login}><span>ESPACE SÉCURISÉ</span><h2>Accéder à votre espace</h2><p>Connectez-vous avec le compte fourni par votre compagnie.</p><label>Courriel<div><Mail/><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></div></label><label>Mot de passe<div><LockKeyhole/><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required/><Eye/></div></label>{error&&<div className="access-error">{error}</div>}<button className="access-submit">Se connecter <ArrowRight/></button><button type="button" className="forgot">Mot de passe oublié</button><div className="access-separator"><span>OU</span></div><button type="button" className="create-company-button" onClick={()=>setCreateOpen(true)}><Plus/> Créer une compagnie</button><div className="demo-accounts"><b>DÉMO LES REVÊTEMENTS MIR</b><div>{Object.values(demoAccounts).map((a)=><button type="button" key={a.email} onClick={()=>{setEmail(a.email);setPassword('forge')}}>{a.role}</button>)}</div><small>Mot de passe : forge</small></div></form>
    </section>
    <footer>FORGE · Une compagnie, un espace, aucune donnée mélangée.</footer>
    {createOpen&&<div className="modal-wrap"><form className="modal company-create" onSubmit={createCompany}><div className="modal-head"><div><span>NOUVEL ESPACE FORGE</span><h2>Créer votre compagnie</h2><p>Votre compte Boss sera créé en même temps.</p></div><button type="button" onClick={()=>setCreateOpen(false)}><X/></button></div><div className="company-create-grid"><label>Nom de la compagnie<input name="company" required placeholder="Ex. Construction ABC"/></label><label className="company-logo-upload"><input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0];if(f)setLogo(URL.createObjectURL(f))}}/>{logo?<img src={logo} alt="Logo importé"/>:<><Upload/><span>Importer le logo</span></>}</label><label>Adresse<input name="address" required/></label><label>Téléphone<input name="phone" required/></label><label>Courriel de la compagnie<input name="companyEmail" type="email" required/></label><label>Propriétaire / administrateur<input name="owner" required/></label><label>Courriel de connexion<input name="loginEmail" type="email" required/></label><label>Mot de passe<input name="newPassword" type="password" minLength={6} required/></label><div className="company-theme-picker"><span>STYLE DE L’ESPACE</span><div>{companyThemes.map(item=><button type="button" key={item.id} className={theme===item.id?'selected':''} onClick={()=>setTheme(item.id)}><i className={`theme-preview ${item.id}`} style={{'--preview-accent':accent} as React.CSSProperties}/><b>{item.name}</b><small>{item.desc}</small></button>)}</div></div><div className="company-color-picker"><span>COULEUR PRINCIPALE · 30 CHOIX</span><div>{themeColors.map(color=><button type="button" key={color} className={accent===color?'selected':''} style={{background:color}} onClick={()=>setAccent(color)} aria-label={`Choisir ${color}`}/>)}</div></div></div><button className="access-submit" style={{background:accent}}>Créer la compagnie et entrer <ArrowRight/></button></form></div>}
  </main>
}

export function EmptyCompany({session,onLogout}:{session:ForgeSession;onLogout:()=>void}){
  return <main className="empty-company"><header><div className="forge-wordmark"><span><HardHat/></span><b>FORGE</b></div><div><b>{session.companyName}</b><button onClick={onLogout}>Déconnexion</button></div></header><section><span>NOUVELLE COMPAGNIE</span><h1>Bienvenue, {session.userName}.</h1><p>Votre espace est vide, isolé et prêt à être configuré.</p><div className="empty-steps">{['Créer votre première job','Inviter les employés et attribuer les rôles','Configurer le catalogue de matériaux','Ajouter les fournisseurs','Définir l’inventaire de départ'].map((step,i)=><article key={step}><b>0{i+1}</b><span>{step}</span><button><ArrowRight/></button></article>)}</div><button className="empty-primary"><Plus/> Commencer la configuration</button></section></main>
}
