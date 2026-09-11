'use client';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

// Keep native selects for form validation and values, but render their picker
// inside the order surface rather than in an OS popup outside the device frame.
export function OrderSelectOverlay() {
  const [target,setTarget]=useState<HTMLSelectElement|null>(null);
  const panel=useRef<HTMLDivElement>(null);
  const close=()=>{setTarget(null);target?.focus()};
  useEffect(()=>{
    const find=(event:Event)=>event.target instanceof Element ? event.target.closest<HTMLSelectElement>('.new-order-page select') : null;
    const pointer=(event:PointerEvent)=>{const select=find(event);if(select&&!select.disabled){event.preventDefault();setTarget(select)}};
    const keyboard=(event:KeyboardEvent)=>{const select=find(event);if(select&&!select.disabled&&['Enter',' ','ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();setTarget(select)}};
    document.addEventListener('pointerdown',pointer,true);
    document.addEventListener('keydown',keyboard,true);
    return()=>{document.removeEventListener('pointerdown',pointer,true);document.removeEventListener('keydown',keyboard,true)};
  },[]);
  useEffect(()=>{
    if(!target)return;
    panel.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]:not(:disabled), button:not(:disabled)')?.focus();
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setTarget(null);target.focus()}};
    document.addEventListener('keydown',escape);
    return()=>document.removeEventListener('keydown',escape);
  },[target]);
  const host=target?.closest('.new-order-page');
  if(!target||!host||!target.isConnected)return null;
  const title=target.getAttribute('aria-label')||target.getAttribute('title')||target.closest('label')?.childNodes[0]?.textContent||'Choisir une option';
  return createPortal(<div className="order-select-shade" onPointerDown={event=>{if(event.target===event.currentTarget)close()}}>
    <div ref={panel} className="order-select-panel" role="dialog" aria-modal="true" aria-label={title} onKeyDown={event=>{
      const buttons=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]);
      const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
      if(['Tab','ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();
        const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowUp'||(event.key==='Tab'&&event.shiftKey)?-1:1)+buttons.length)%buttons.length;
        buttons[next]?.focus();
      }
    }}>
      <header><b>{title}</b><button type="button" aria-label="Fermer les options" onClick={close}>×</button></header>
      <div className="order-select-list" role="listbox" aria-label={title}>
        {Array.from(target.options).map((option,index)=><button type="button" role="option" key={index} disabled={option.disabled} aria-selected={option.selected} onClick={()=>{
          const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value')?.set;
          setter?.call(target,option.value);
          target.dispatchEvent(new Event('change',{bubbles:true}));
          close();
        }}>{option.label}{option.selected&&<span aria-hidden="true">✓</span>}</button>)}
      </div>
    </div>
  </div>,host);
}
