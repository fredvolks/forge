'use client';
import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
import {applyAppearance,getUserAppearance,saveUserAppearance} from './forge-branding';
export function SidebarAccount({name,role,companyId,email,onSettings}:{name:string;role:string;companyId:string;email:string;onSettings:()=>void}){
 const [dark,setDark]=useState(true),[error,setError]=useState('');
 useEffect(()=>{const sync=()=>setDark(document.documentElement.dataset.mode!=='light');sync();const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-mode']});return()=>observer.disconnect()},[]);
 function toggle(){try{const value={...getUserAppearance(companyId,email),mode:dark?'light' as const:'dark' as const,updatedAt:new Date().toISOString()};saveUserAppearance(companyId,email,value);applyAppearance(value);setError('')}catch{setError('Impossible de conserver ce choix.')}}
 return <div className="forge-sidebar-account"><button className="fsa-profile" onClick={onSettings} aria-label="Ouvrir les paramètres du compte"><span className="fsa-avatar">{name.slice(0,2).toUpperCase()}</span><span><b>{name}</b><small>{role}</small></span></button><button className="fsa-mode" onClick={toggle} aria-label={dark?'Activer le mode clair':'Activer le mode sombre'}><span>{dark?<Moon size={18}/>:<Sun size={18}/>}</span>{dark?'Mode sombre':'Mode clair'}</button>{error&&<small role="alert">{error}</small>}</div>;
}
