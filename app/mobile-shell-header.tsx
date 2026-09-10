'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';

/** Shared chrome for every field route, including forms and account settings. */
export function MobileShellHeader({logoSrc,userName,companyId,email,onSettings,routeKey}:{logoSrc:string;userName:string;companyId:string;email:string;onSettings:()=>void;routeKey:string}) {
 const header=useRef<HTMLElement>(null);
 const [photo,setPhoto]=useState('');
 const [page,setPage]=useState(0);
 const [pages,setPages]=useState(1);
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
  content.scrollTop=0;setPage(0);setNotifications(false);
  const measure=()=>{
   if(!header.current?.getClientRects().length)return;
   if(header.current.closest('.device-mobile')){setPages(1);setPage(0);content.scrollTop=0;return;}
   const step=Math.max(1,content.clientHeight-48);
   const pager=header.current.parentElement?.querySelector<HTMLElement>('.fixed-screen-pagination');
   const unpagedHeight=content.clientHeight+(pager&&!pager.hidden?44:0);
   const count=content.scrollHeight<=unpagedHeight+2?1:1+Math.ceil(Math.max(0,content.scrollHeight-content.clientHeight-2)/step);
   setPages(count);
   setPage(Math.min(count-1,Math.ceil(content.scrollTop/step)));
  };
  const resize=new ResizeObserver(measure);resize.observe(content);
  Array.from(content.children).forEach(el=>resize.observe(el));
  const changes=new MutationObserver(measure);changes.observe(content,{childList:true,subtree:true});
  const focus=()=>{measure()};content.addEventListener('focusin',focus);
  measure();
  return()=>{resize.disconnect();changes.disconnect();content.removeEventListener('focusin',focus)};
 },[routeKey]);
 const move=(next:number)=>{
  const content=header.current?.parentElement?.querySelector<HTMLElement>(':scope > .content');
  if(!content)return;
  content.scrollTo({top:next*Math.max(1,content.clientHeight-48),behavior:'instant'});setPage(next);
 };
 const initials=userName.trim().split(/\s+/).map(word=>word[0]).slice(0,2).join('').toUpperCase();
 return <>
  <header ref={header} className="field-mobile-head shared-mobile-head">
   <img className="field-company-logo" src={logoSrc} alt="Logo de la compagnie"/>
   <div><button aria-label="Notifications" aria-expanded={notifications} onClick={()=>setNotifications(!notifications)}><Bell/></button><button className="field-account-avatar" onClick={onSettings} aria-label="Ouvrir les paramètres du compte">{photo?<img src={photo} alt="Photo de profil"/>:<span>{initials}</span>}</button></div>
  </header>
  {notifications&&<section className="shell-notifications" aria-label="Notifications"><b>Notifications</b><p>Consultez les notifications et les demandes dans l’accueil et vos heures.</p><button onClick={()=>setNotifications(false)}>Fermer</button></section>}
  <nav className="fixed-screen-pagination" aria-label="Pages de cet écran" hidden={pages<2}><button disabled={page===0} onClick={()=>move(page-1)}><ChevronLeft/> Précédent</button><span aria-live="polite">{page+1} / {pages}</span><button disabled={page>=pages-1} onClick={()=>move(page+1)}>Suivant <ChevronRight/></button></nav>
 </>;
}
