'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

/** Shared chrome for every field route, including forms and account settings. */
export function MobileShellHeader({logoSrc,userName,companyId,email,onSettings,routeKey}:{logoSrc:string;userName:string;companyId:string;email:string;onSettings:()=>void;routeKey:string}) {
 const header=useRef<HTMLElement>(null);
 const [photo,setPhoto]=useState('');
 const [notifications,setNotifications]=useState(false);
 const photoKey=`forge:${companyId}:profile-photo:${email}`;
 useEffect(()=>{
  const stage=header.current?.closest<HTMLElement>('.demo-device-stage');if(!stage)return;
  const resize=()=>{const landscape=stage.classList.contains('device-tablet-landscape');const width=landscape?1024:768;const height=landscape?768:1024;const rail=parseFloat(getComputedStyle(stage).getPropertyValue('--demo-rail'))||0;stage.style.setProperty('--tablet-scale',String(Math.max(.2,Math.min(1,(window.innerHeight-24)/height,(window.innerWidth-rail-70)/width))))};
  resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);
 },[routeKey]);
 useEffect(()=>{const sync=()=>setPhoto(localStorage.getItem(photoKey)||'');sync();window.addEventListener('forge-profile-updated',sync);return()=>window.removeEventListener('forge-profile-updated',sync)},[photoKey]);
 useEffect(()=>{
  const content=header.current?.parentElement?.querySelector<HTMLElement>(':scope > .content');
  if(!content)return;
  content.scrollTop=0;setNotifications(false);
 },[routeKey]);
 const initials=userName.trim().split(/\s+/).map(word=>word[0]).slice(0,2).join('').toUpperCase();
 return <>
  <header ref={header} className="field-mobile-head shared-mobile-head">
   <img className="field-company-logo" src={logoSrc} alt="Logo de la compagnie"/>
   <div><button aria-label="Notifications" aria-expanded={notifications} onClick={()=>setNotifications(!notifications)}><Bell/></button><button className="field-account-avatar" onClick={onSettings} aria-label="Ouvrir les paramètres du compte">{photo?<img src={photo} alt="Photo de profil"/>:<span>{initials}</span>}</button></div>
  </header>
  {notifications&&<section className="shell-notifications" aria-label="Notifications"><b>Notifications</b><p>Consultez les notifications et les demandes dans l’accueil et vos heures.</p><button onClick={()=>setNotifications(false)}>Fermer</button></section>}
 </>;
}
