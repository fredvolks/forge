'use client';
import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {ArrowLeft} from 'lucide-react';
import {FoldingDrawing} from './folding-settings';

export type OrderDetail={id:string;job:string;date:string;status:string;priority?:string;delivery_location?:string;notes?:string;items:{name:string;qty:number;unit:string;detail?:string;photos?:string[];foldingSnapshot?:{versionNumber:number;geometry:import('../lib/folding-domain').FoldingGeometry}}[]};
export function OrderDetailOverlay({order,trigger,onClose}:{order:OrderDetail;trigger:HTMLButtonElement;onClose:()=>void}){
 const panel=useRef<HTMLElement>(null);
 const host=trigger.closest<HTMLElement>('.content.work-orders');
 useEffect(()=>{
  const children=Array.from(host?.children||[]).filter(child=>child!==panel.current&&!child.matches('.topbar,.shared-mobile-head')) as HTMLElement[];
  const previous=children.map(child=>child.inert);
  children.forEach(child=>{child.inert=true});
  panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
  return()=>{children.forEach((child,index)=>{child.inert=previous[index]});trigger.focus({preventScroll:true})};
 },[host,trigger]);
 if(!host)return null;
 return createPortal(<section ref={panel} className="order-detail-overlay" role="dialog" aria-modal="true" aria-label="Détail de la commande" onKeyDown={event=>{
  if(event.key==='Escape'){event.preventDefault();onClose()}
  if(event.key==='Tab'){event.preventDefault();panel.current?.querySelector<HTMLButtonElement>('button')?.focus()}
 }}>
  <header><button type="button" onClick={onClose}><ArrowLeft/> Mes commandes</button><span>{order.status}</span></header>
  <div className="order-detail-body">
   <h1>{order.job}</h1><p className="order-detail-id">{order.id}</p><p>{order.date} · {order.items.length} article{order.items.length>1?'s':''}</p>
   {order.priority&&<p>Priorité · {order.priority}</p>}
<ul>{order.items.map((item,index)=><li key={index}><div><h2>{item.name}</h2><b>{item.qty} {item.unit}</b></div>{item.foldingSnapshot&&<div><p>Profil commandé · V{item.foldingSnapshot.versionNumber}</p><FoldingDrawing geometry={item.foldingSnapshot.geometry}/></div>}{item.detail&&<p>{item.detail}</p>}{!!item.photos?.length&&<div className="order-detail-photos">{item.photos.map((photo,i)=><img key={i} src={photo} alt={`Pièce jointe ${i+1} — ${item.name}`}/>)}</div>}</li>)}</ul>
   {order.delivery_location&&<section><h2>Livraison</h2><p>{order.delivery_location}</p></section>}
   {order.notes&&<section><h2>Note</h2><p>{order.notes}</p></section>}
  </div>
 </section>,host);
}
