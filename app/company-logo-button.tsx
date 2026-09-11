'use client';
import {useRef,useState} from 'react';
import {getBranding,saveBranding} from './forge-branding';
export function CompanyLogoButton({src,companyId,companyName,role}:{src:string;companyId:string;companyName:string;role:string}){
 const input=useRef<HTMLInputElement>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const allowed=role==='Boss'||role==='Adjointe';
 async function upload(file?:File){
  if(!file||!allowed||busy)return;
  setError('');setBusy(true);
  try{
   if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choisissez un fichier PNG, JPG ou WebP.');
   if(file.size>2*1024*1024)throw Error('Maximum 2 Mo pour le logo de démonstration.');
   const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Lecture impossible.'));reader.readAsDataURL(file)});
   await new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(Error('Cette image est invalide.'));image.src=data});
   saveBranding({...getBranding(companyId),original:data,transparent:undefined,light:undefined,dark:undefined,loader:data,activeVariant:'original',processingStatus:'ready'},'company_logo_uploaded');
  }catch(e){setError(e instanceof Error?e.message:'Impossible de changer le logo.');}finally{setBusy(false);if(input.current)input.current.value='';}
 }
 const image=<img src={src} alt={`Logo ${companyName}`} onError={e=>{if(!e.currentTarget.src.endsWith('/mir-company-logo-transparent.png'))e.currentTarget.src='/mir-company-logo-transparent.png'}}/>;
 return <><span className="admin-company-logo">{allowed?<button type="button" className="company-logo-edit" aria-label="Changer le logo de la compagnie" title="Cliquer pour changer le logo" disabled={busy} onClick={()=>input.current?.click()}>{image}</button>:image}</span>{allowed&&<input ref={input} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={e=>void upload(e.target.files?.[0])}/>} {busy&&<small role="status">Chargement du logo…</small>}{error&&<small role="alert">{error} Le logo précédent est conservé.</small>}</>;
}
