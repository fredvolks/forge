'use client';
import {useRef} from 'react';
import type {JobRecord} from '../lib/time-domain';

export function JobPhotoEditor({job,onChange}:{job:JobRecord;onChange:(crop:{x:number;y:number;zoom:number})=>void}){
 const drag=useRef<{x:number;y:number;left:number;top:number;overflowX:number;overflowY:number}|null>(null);
 const crop=job.cover_photo_crop||{x:50,y:50,zoom:1};
 const clamp=(n:number)=>Math.max(0,Math.min(100,n));
 return <>
  <img className="jw-editable-photo" src={job.cover_photo} alt="Cadrage du chantier" draggable={false} tabIndex={0} aria-label="Déplacer le cadrage avec les flèches ou en glissant la photo" style={{objectPosition:`${crop.x}% ${crop.y}%`,transform:`scale(${crop.zoom})`,transformOrigin:`${crop.x}% ${crop.y}%`}}
   onPointerDown={e=>{const el=e.currentTarget,r=el.parentElement!.getBoundingClientRect(),scale=Math.max(r.width/el.naturalWidth,r.height/el.naturalHeight)*crop.zoom;drag.current={x:e.clientX,y:e.clientY,left:crop.x,top:crop.y,overflowX:el.naturalWidth*scale-r.width,overflowY:el.naturalHeight*scale-r.height};el.setPointerCapture(e.pointerId)}}
   onPointerMove={e=>{const d=drag.current;if(d)onChange({...crop,x:d.overflowX>0?clamp(d.left-(e.clientX-d.x)/d.overflowX*100):50,y:d.overflowY>0?clamp(d.top-(e.clientY-d.y)/d.overflowY*100):50})}}
   onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}}
   onKeyDown={e=>{const offsets:Record<string,[number,number]>={ArrowLeft:[5,0],ArrowRight:[-5,0],ArrowUp:[0,5],ArrowDown:[0,-5]};const offset=offsets[e.key];if(offset){e.preventDefault();onChange({...crop,x:clamp(crop.x+offset[0]),y:clamp(crop.y+offset[1])})}}}/>
  <div className="jw-photo-controls" aria-label="Zoom de la photo"><button type="button" aria-label="Réduire la photo" disabled={crop.zoom<=1} onClick={()=>onChange({...crop,zoom:Math.max(1,Math.round((crop.zoom-.1)*10)/10)})}>−</button><span>{Math.round(crop.zoom*100)} %</span><button type="button" aria-label="Agrandir la photo" disabled={crop.zoom>=3} onClick={()=>onChange({...crop,zoom:Math.min(3,Math.round((crop.zoom+.1)*10)/10)})}>+</button></div>
 </>;
}
