'use client';
import {useEffect,useRef,useState} from 'react';
import {FileText,Folder,Image,MessageSquare,PackageCheck,ReceiptText,ShieldAlert,AlertTriangle,ChevronRight,X} from 'lucide-react';

const options=[
 {id:'project-info',label:'Infos du chantier',Icon:FileText},
 {id:'messages',label:'Discussion',Icon:MessageSquare},
 {id:'project-plans',label:'Plans',Icon:Folder},
 {id:'project-photos',label:'Photos',Icon:Image},
 {id:'project-architect',label:'Rapports',Icon:FileText},
 {id:'orders',label:'Commandes',Icon:PackageCheck},
 {id:'purchases',label:'Achats et reçus',Icon:ReceiptText},
 {id:'project-special',label:'Demandes spéciales',Icon:AlertTriangle},
 {id:'incidents',label:'Incidents',Icon:ShieldAlert},
] as const;
type Destination=typeof options[number]['id'];
const defaults:Destination[]=options.slice(0,6).map(o=>o.id);
export function JobShortcuts({storageKey,onNavigate}:{storageKey:string;onNavigate:(view:Destination)=>void}){
 const [items,setItems]=useState<Destination[]>(defaults);
 const [editing,setEditing]=useState<number|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const held=useRef(false);
 const cancel=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null};
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(Array.isArray(saved)&&saved.length===6&&new Set(saved).size===6&&saved.every(id=>options.some(o=>o.id===id)))setItems(saved)}catch{}return cancel},[storageKey]);
 const replace=(id:Destination)=>{if(editing===null)return;const next=[...items];const other=next.indexOf(id);if(other!==-1)next[other]=next[editing];next[editing]=id;setItems(next);try{localStorage.setItem(storageKey,JSON.stringify(next))}catch{}setEditing(null)};
 return <><div className="job-dashboard-shortcuts">{items.map((id,index)=>{const {label,Icon}=options.find(o=>o.id===id)!;return <button key={index} title="Appui long pour remplacer ce raccourci" onPointerDown={e=>{if(e.button!==0)return;held.current=false;cancel();timer.current=setTimeout(()=>{held.current=true;setEditing(index)},600)}} onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel} onContextMenu={e=>{e.preventDefault();cancel();held.current=true;setEditing(index)}} onClick={()=>{if(held.current){held.current=false;return}onNavigate(id)}}><Icon/><b>{label}</b><ChevronRight/></button>})}</div>
 {editing!==null&&<div className="job-shortcut-backdrop" onClick={()=>setEditing(null)}><section role="dialog" aria-modal="true" aria-label="Remplacer le raccourci" className="job-shortcut-picker" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')setEditing(null)}}><header><h2>Remplacer le raccourci</h2><button autoFocus aria-label="Fermer" onClick={()=>setEditing(null)}><X/></button></header><p>Choisissez une section. Un raccourci déjà présent échange sa place.</p><div>{options.map(({id,label,Icon})=><button key={id} onClick={()=>replace(id)}><Icon/>{label}<ChevronRight/></button>)}</div></section></div>}</>;
}
