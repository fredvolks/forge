'use client';
export type MessageReader={id:string;name:string};

export function MessageReaders({readers,sender,connected}:{readers:MessageReader[];sender:string;connected:boolean}){
 const members=readers.filter((r,i,all)=>r.id!==sender&&all.findIndex(x=>x.id===r.id)===i);
 const initials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase();
 return <details className="fm-readers">
  <summary aria-label={`${members.length?`Vu par ${members.map(r=>r.name).join(', ')}`:'Distribué, pas encore vu'}${connected?'':' — simulation locale'}. Afficher les détails`}>
   <span>{members.length?'Vu par':'Distribué'}{!connected?' · démo':''}</span>
   <span className="fm-reader-avatars">{members.slice(0,3).map(r=><span className="fm-reader-avatar" key={r.id} title={r.name}>{initials(r.name)}</span>)}</span>{members.length>3&&<span className="fm-reader-more">+{members.length-3}</span>}
  </summary>
  <div className="fm-readers-list">
   {!connected&&<p>Statut simulé dans cet aperçu local. Aucun envoi réel aux employés.</p>}
   {members.length?<><b>Vu par · {members.length}</b><ul>{members.map(r=><li key={r.id}><span className="fm-reader-avatar" aria-hidden="true">{initials(r.name)}</span><span>{r.name}</span></li>)}</ul></>:connected?<p>Aucun autre membre n’a encore lu ce message.</p>:null}
  </div>
 </details>;
}
