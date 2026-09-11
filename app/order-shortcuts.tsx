'use client';
import {useEffect,useRef,useState} from 'react';
type Item={name:string;category:string;search:string};
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
export function OrderShortcuts({items,category,query,selected,preferenceKey,onSelect,onCloseSearch}:{items:Item[];category:string;query:string;selected:string;preferenceKey:string;onSelect:(item:Item)=>void;onCloseSearch:()=>void}){
 const [favorites,setFavorites]=useState<Record<string,string[]>>({});
 const [editing,setEditing]=useState<number|null>(null);
 const [choice,setChoice]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),held=useRef(false);
 const key=(item:Item)=>`${item.category}::${item.name}`;
 useEffect(()=>{try{setFavorites(JSON.parse(localStorage.getItem(preferenceKey)||'{}'))}catch{setFavorites({})}},[preferenceKey]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 const defaults=items.filter(item=>item.category===category);
 const shortcuts=Array.from({length:5},(_,index)=>items.find(item=>key(item)===favorites[category]?.[index])||defaults[index]);
 const results=query.trim()?items.filter(item=>normalize(item.search).includes(normalize(query.trim()))):items;
 const shown=shortcuts;
 const stop=()=>{if(timer.current)clearTimeout(timer.current)};
const button=(index:number)=>{const item=shown[index];if(query.trim()&&!item)return null;return <button type="button" className={item?.name===selected?'selected':''} aria-label={item?item.name:`Personnaliser le favori ${index+1}`} title="Appui long pour remplacer ce favori" onPointerDown={()=>{held.current=false;stop();timer.current=setTimeout(()=>{held.current=true;setChoice(item?key(item):'');setEditing(index)},550)}} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={e=>{e.preventDefault();stop();held.current=true;setChoice(item?key(item):'');setEditing(index)}} onKeyDown={e=>{if(e.key==='F2'){e.preventDefault();setChoice(item?key(item):'');setEditing(index)}}} onClick={()=>{if(held.current){held.current=false;return}if(item)onSelect(item);else setEditing(index)}}>{item?.name||'Choisir un favori'}</button>};
 return <div className="order-shortcuts">
  <div className="preset-title">{button(4)}<select className="order-all-items" aria-label="Tous les articles" value="" onChange={e=>{const item=items.find(i=>key(i)===e.target.value);if(item)onSelect(item)}}><option value="" disabled>Voir tout</option>{items.map(item=><option key={key(item)} value={key(item)}>{item.name} · {item.category}</option>)}</select></div>
  <div className="presets category-presets">{[0,1,2,3].map(index=><span key={index}>{button(index)}</span>)}</div>
  {query.trim()&&<section className="order-search-results" aria-label="Résultats du catalogue" onKeyDown={e=>{if(e.key==='Escape')onCloseSearch()}}><header><b>{results.length} résultat{results.length!==1?'s':''}</b><button type="button" onClick={onCloseSearch} aria-label="Fermer la recherche">×</button></header><div>{results.map(item=><button type="button" key={key(item)} onClick={()=>onSelect(item)}><b>{item.name}</b><small>{item.category}</small></button>)}{!results.length&&<p>Aucun article correspondant.</p>}</div></section>}
{editing!==null&&<div className="order-favorite-dialog" role="dialog" aria-modal="true" aria-label="Personnaliser le favori" onKeyDown={e=>{if(e.key==='Escape')setEditing(null)}}><h3>Choisir mon favori</h3><p>Remplacer le raccourci {editing+1}.</p><select autoFocus aria-label="Article favori" value={choice} onChange={e=>setChoice(e.target.value)}><option value="">Choisir un article</option>{items.map(item=><option key={key(item)} value={key(item)}>{item.name} · {item.category}</option>)}</select><div><button type="button" onClick={()=>setEditing(null)}>Annuler</button><button type="button" disabled={!choice} onClick={()=>{const next=shortcuts.map(item=>item?key(item):'');const duplicate=next.indexOf(choice);if(duplicate>=0)next[duplicate]=next[editing];next[editing]=choice;const updated={...favorites,[category]:next};try{localStorage.setItem(preferenceKey,JSON.stringify(updated));setFavorites(updated);setEditing(null)}catch{setEditing(null)}}}>Enregistrer</button></div></div>}
 </div>
}
