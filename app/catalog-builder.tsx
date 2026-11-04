'use client';
import {useEffect,useMemo,useState} from 'react';
import {Copy,Eye,GripVertical,Pencil,Plus,Save,Search,Trash2,X} from 'lucide-react';
import {ProfileSketcher} from './profile-sketcher';
export type CatalogField={id:string;name:string;type:string;required:boolean;defaultValue:string;filledBy:'terrain'|'admin';unit:string;options:string[]};
export type ProfileSegment={id:string;direction:'horizontal'|'vertical'|'angle'|'retour';label:string;length:number;x1?:number;y1?:number;x2?:number;y2?:number};
export type DynamicValidationRule={id:string;type:'min-offset';baseFieldId:string;targetFieldId:string;offset:number;unit:'po';label:string;message:string};
export type DynamicProduct={id:string;companyId:string;name:string;category:string;subcategory:string;description:string;supplier:string;source:'Inventaire MIR'|'Fournisseur'|'Les deux';active:boolean;colors:string[];units:string[];fields:CatalogField[];segments:ProfileSegment[];validationRules?:DynamicValidationRule[]};
export const beamProduct:DynamicProduct={id:'dynamic-beam',companyId:'mir-demo',name:'Beam',category:'Pliage',subcategory:'Profil sur mesure',description:'Profil de pliage à cinq segments',supplier:'Acier Breton',source:'Fournisseur',active:true,colors:['Noir','Blanc','Autre'],units:['morceau'],segments:[{id:'s1',direction:'horizontal',label:'A',length:56},{id:'s2',direction:'vertical',label:'B',length:86},{id:'s3',direction:'horizontal',label:'C',length:150},{id:'s4',direction:'vertical',label:'D',length:86},{id:'s5',direction:'horizontal',label:'E',length:56}],fields:[...['A','B','C','D','E'].map((name,i)=>({id:`f${i}`,name,type:'Mesure',required:true,defaultValue:'',filledBy:'terrain' as const,unit:'po',options:[]})),{id:'f-double',name:'Pli double A-E',type:'Oui/Non',required:false,defaultValue:'Non',filledBy:'terrain',unit:'',options:[]},{id:'f-length',name:'Longueur',type:'Longueur',required:true,defaultValue:'120',filledBy:'terrain',unit:'po',options:[]},{id:'f-qty',name:'Quantité',type:'Quantité',required:true,defaultValue:'1',filledBy:'terrain',unit:'',options:[]} as CatalogField]};

const brickFlashingProduct:DynamicProduct={
  id:'mir-brick-flashing',
  companyId:'mir-demo',
  name:'Moulure solin brique',
  category:'Pliage',
  subcategory:'Solin et maçonnerie',
  description:'Solin brique paramétrique inspiré de la pièce chantier MIR. Toutes les cotes restent à saisir selon le chantier.',
  supplier:'Acier Breton',
  source:'Fournisseur',
  active:true,
  colors:['Noir','Blanc','Autre'],
  units:['morceau'],
  segments:[
    {id:'brick-a',direction:'vertical',label:'A',length:95,x1:90,y1:300,x2:90,y2:90},
    {id:'brick-b',direction:'angle',label:'B',length:180,x1:90,y1:300,x2:355,y2:245},
    {id:'brick-c',direction:'angle',label:'C',length:55,x1:355,y1:245,x2:420,y2:190},
    {id:'brick-d',direction:'vertical',label:'D',length:70,x1:420,y1:190,x2:420,y2:305},
    {id:'brick-e',direction:'horizontal',label:'E',length:35,x1:420,y1:305,x2:475,y2:305}
  ],
  fields:[
    ...['A','B','C','D','E'].map((name,i)=>({id:`brick-${name.toLowerCase()}`,name,type:'Mesure',required:true,defaultValue:'',filledBy:'terrain' as const,unit:'po',options:[]})),
    {id:'brick-length',name:'Longueur',type:'Longueur',required:true,defaultValue:'120',filledBy:'terrain',unit:'po',options:[]},
    {id:'brick-qty',name:'Quantité',type:'Quantité',required:true,defaultValue:'1',filledBy:'terrain',unit:'',options:[]}
  ]
};

const cornerAProduct:DynamicProduct={
  id:'mir-corner-a',
  companyId:'mir-demo',
  name:'Coin architectural — Type A',
  category:'Pliage',
  subcategory:'Coins architecturaux',
  description:'Coin architectural MIR, profil Type A de la référence chantier. Cotes paramétriques.',
  supplier:'Acier Breton',
  source:'Fournisseur',
  active:true,
  colors:['Noir','Blanc','Autre'],
  units:['morceau'],
  segments:[
    {id:'ca-a',direction:'horizontal',label:'A',length:90,x1:85,y1:110,x2:330,y2:110},
    {id:'ca-b',direction:'vertical',label:'B',length:70,x1:330,y1:110,x2:330,y2:245},
    {id:'ca-c',direction:'horizontal',label:'C',length:70,x1:330,y1:245,x2:155,y2:245}
  ],
  fields:[
    ...['A','B','C'].map(name=>({id:`corner-a-${name.toLowerCase()}`,name,type:'Mesure',required:true,defaultValue:'',filledBy:'terrain' as const,unit:'po',options:[]})),
    {id:'corner-a-length',name:'Longueur',type:'Longueur',required:true,defaultValue:'120',filledBy:'terrain',unit:'po',options:[]},
    {id:'corner-a-qty',name:'Quantité',type:'Quantité',required:true,defaultValue:'1',filledBy:'terrain',unit:'',options:[]}
  ]
};

const cornerJProduct:DynamicProduct={
  id:'mir-corner-j',
  companyId:'mir-demo',
  name:'Coin architectural — J intégré',
  category:'Pliage',
  subcategory:'Coins architecturaux',
  description:'Coin avec J intégré. Le clouage doit dépasser le retour du J de 1¼ po minimum.',
  supplier:'Acier Breton',
  source:'Fournisseur',
  active:true,
  colors:['Noir','Blanc','Autre'],
  units:['morceau'],
  segments:[
    {id:'cj-a',direction:'horizontal',label:'A',length:90,x1:85,y1:235,x2:270,y2:235},
    {id:'cj-b',direction:'vertical',label:'B',length:55,x1:270,y1:235,x2:270,y2:130},
    {id:'cj-c',direction:'horizontal',label:'J',length:50,x1:270,y1:130,x2:355,y2:130},
    {id:'cj-d',direction:'vertical',label:'D',length:80,x1:355,y1:130,x2:355,y2:300}
  ],
  fields:[
    {id:'corner-j-face',name:'Face du coin',type:'Mesure',required:true,defaultValue:'',filledBy:'terrain',unit:'po',options:[]},
    {id:'corner-j-return',name:'Retour du J',type:'Mesure',required:true,defaultValue:'1',filledBy:'terrain',unit:'po',options:[]},
    {id:'corner-j-nailing',name:'Clouage',type:'Mesure',required:true,defaultValue:'2 1/4',filledBy:'terrain',unit:'po',options:[]},
    {id:'corner-j-length',name:'Longueur',type:'Longueur',required:true,defaultValue:'120',filledBy:'terrain',unit:'po',options:[]},
    {id:'corner-j-qty',name:'Quantité',type:'Quantité',required:true,defaultValue:'1',filledBy:'terrain',unit:'',options:[]}
  ],
  validationRules:[{
    id:'corner-j-nailing-min',
    type:'min-offset',
    baseFieldId:'corner-j-return',
    targetFieldId:'corner-j-nailing',
    offset:1.25,
    unit:'po',
    label:'Clouage minimum du J intégré',
    message:'Le clouage doit être au moins 1¼ po plus long que le retour du J.'
  }]
};

const cornerCProduct:DynamicProduct={
  id:'mir-corner-c',
  companyId:'mir-demo',
  name:'Coin architectural — Type C',
  category:'Pliage',
  subcategory:'Coins architecturaux',
  description:'Coin architectural MIR, profil Type C de la référence dessinée. Cotes paramétriques.',
  supplier:'Acier Breton',
  source:'Fournisseur',
  active:true,
  colors:['Noir','Blanc','Autre'],
  units:['morceau'],
  segments:[
    {id:'cc-a',direction:'horizontal',label:'A',length:85,x1:100,y1:220,x2:270,y2:220},
    {id:'cc-b',direction:'angle',label:'B',length:45,x1:270,y1:220,x2:325,y2:150},
    {id:'cc-c',direction:'angle',label:'C',length:70,x1:325,y1:150,x2:355,y2:300}
  ],
  fields:[
    ...['A','B','C'].map(name=>({id:`corner-c-${name.toLowerCase()}`,name,type:'Mesure',required:true,defaultValue:'',filledBy:'terrain' as const,unit:'po',options:[]})),
    {id:'corner-c-length',name:'Longueur',type:'Longueur',required:true,defaultValue:'120',filledBy:'terrain',unit:'po',options:[]},
    {id:'corner-c-qty',name:'Quantité',type:'Quantité',required:true,defaultValue:'1',filledBy:'terrain',unit:'',options:[]}
  ]
};

export const mirDefaultProducts:DynamicProduct[]=[beamProduct,brickFlashingProduct,cornerAProduct,cornerJProduct,cornerCProduct];

export function loadDynamicCatalog(companyId:string):DynamicProduct[]{
  const defaults=companyId==='mir-demo'?mirDefaultProducts:[];
  if(typeof window==='undefined')return defaults;
  const key=`forge:${companyId}:dynamic-catalog`;
  const raw=localStorage.getItem(key);
  if(raw){
    try{
      const stored=JSON.parse(raw) as DynamicProduct[];
      const ids=new Set(stored.map(item=>item.id));
      const merged=[...stored,...defaults.filter(item=>!ids.has(item.id))];
      if(merged.length!==stored.length)localStorage.setItem(key,JSON.stringify(merged));
      return merged;
    }catch{
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem(key,JSON.stringify(defaults));
  return defaults;
}
export function ProfilePreview({product,compact=false}:{product:DynamicProduct;compact?:boolean}){const points=useMemo(()=>{if(product.segments.length&&product.segments.every(s=>s.x1!==undefined&&s.y1!==undefined&&s.x2!==undefined&&s.y2!==undefined)){const xs=product.segments.flatMap(s=>[s.x1!,s.x2!]),ys=product.segments.flatMap(s=>[s.y1!,s.y2!]),minX=Math.min(...xs),minY=Math.min(...ys);return[{x:product.segments[0].x1!-minX+35,y:product.segments[0].y1!-minY+35},...product.segments.map(s=>({x:s.x2!-minX+35,y:s.y2!-minY+35}))]}let x=45,y=30;const out=[{x,y}];product.segments.forEach((s,i)=>{const d=Math.max(32,Math.min(110,s.length));if(s.direction==='horizontal')x+=i<product.segments.length/2?d:-d;else if(s.direction==='vertical')y+=i<product.segments.length/2?d:-d;else{x+=d*.7;y+=s.direction==='angle'?d*.7:-d*.3}out.push({x,y})});return out},[product.segments]);const width=Math.max(230,...points.map(p=>p.x+55)),height=Math.max(170,...points.map(p=>p.y+55));return <svg className={compact?'profile-builder-svg compact':'profile-builder-svg'} viewBox={`0 0 ${width} ${height}`}><polyline points={points.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#b8ff3d" strokeWidth="8"/><polyline points={points.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#efffcf" strokeWidth="2"/>{product.segments.map((s,i)=>{const a=points[i],b=points[i+1];return <text key={s.id} x={(a.x+b.x)/2} y={(a.y+b.y)/2-16} textAnchor="middle" fill="#b8ff3d" fontSize="12" fontWeight="900">{s.label}</text>})}</svg>}
const fieldTypes=['Texte','Nombre','Quantité','Mesure','Longueur','Dimension','Liste de choix','Oui/Non','Couleur','Unité','Note/commentaire'];
export function CatalogBuilder({companyId,suppliers,onSaved}:{companyId:string;suppliers:string[];onSaved:(items:DynamicProduct[])=>void}){
 const[items,setItems]=useState<DynamicProduct[]>([]),[editing,setEditing]=useState<DynamicProduct|null>(null),[query,setQuery]=useState(''),[category,setCategory]=useState('Toutes'),[status,setStatus]=useState('Tous');
 useEffect(()=>setItems(loadDynamicCatalog(companyId)),[companyId]);
 const persist=(next:DynamicProduct[])=>{setItems(next);localStorage.setItem(`forge:${companyId}:dynamic-catalog`,JSON.stringify(next));window.dispatchEvent(new Event('forge-catalog-updated'));onSaved(next)};
 const fresh=():DynamicProduct=>({id:`product-${Date.now()}`,companyId,name:'',category:'Matériaux',subcategory:'',description:'',supplier:suppliers[0]||'',source:'Les deux',active:true,colors:['Noir','Blanc','Autre'],units:['morceau'],fields:[{id:`field-${Date.now()}`,name:'Quantité',type:'Quantité',required:true,defaultValue:'1',filledBy:'terrain',unit:'',options:[]}],segments:[]});
 const save=()=>{if(!editing?.name.trim())return;const next=items.some(i=>i.id===editing.id)?items.map(i=>i.id===editing.id?editing:i):[...items,editing];persist(next);setEditing(null)};
 const filtered=items.filter(i=>(!query||`${i.name} ${i.category} ${i.subcategory} ${i.supplier}`.toLowerCase().includes(query.toLowerCase()))&&(category==='Toutes'||i.category===category)&&(status==='Tous'||(status==='Actifs'?i.active:!i.active)));
 const updateField=(id:string,patch:Partial<CatalogField>)=>editing&&setEditing({...editing,fields:editing.fields.map(f=>f.id===id?{...f,...patch}:f)});
 const moveField=(index:number,delta:number)=>{if(!editing)return;const target=index+delta;if(target<0||target>=editing.fields.length)return;const fields=[...editing.fields];[fields[index],fields[target]]=[fields[target],fields[index]];setEditing({...editing,fields})};
 return <div className="dynamic-catalog"><div className="catalog-manager-head"><div><h3>Catalogue</h3><p>Recherchez, filtrez et gérez les articles disponibles dans Forge.</p></div><button onClick={()=>setEditing(fresh())}><Plus/> Ajouter un article</button></div><div className="catalog-manager-tools"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un article, une catégorie ou un fournisseur…"/></label><select value={category} onChange={e=>setCategory(e.target.value)}><option>Toutes</option>{[...new Set(items.map(i=>i.category))].map(c=><option key={c}>{c}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option>Tous</option><option>Actifs</option><option>Inactifs</option></select></div><div className="dynamic-product-list">{filtered.map(item=><article key={item.id} className={!item.active?'inactive':''}>{item.segments.length?<ProfilePreview product={item} compact/>:<span className="product-placeholder">{item.category.slice(0,3).toUpperCase()}</span>}<div><b>{item.name}</b><small>{item.category}{item.subcategory?` · ${item.subcategory}`:''} · {item.fields.length} information{item.fields.length>1?'s':''} · {item.source}</small></div><button onClick={()=>setEditing(item)}><Pencil/> Modifier</button><button onClick={()=>setEditing({...item,id:`${item.id}-copy-${Date.now()}`,name:`${item.name} — copie`})}><Copy/> Dupliquer</button><button onClick={()=>persist(items.map(i=>i.id===item.id?{...i,active:!i.active}:i))}>{item.active?'Actif':'Inactif'}</button></article>)}{!filtered.length&&<div className="fcc-empty">Aucun article ne correspond à ces filtres.</div>}</div>
 {editing&&<div className="builder-overlay"><div className="article-builder"><header><div><span>CATALOGUE · CRÉATION D’ARTICLE</span><h2>{editing.name||'Nouvel article'}</h2><p>Définissez l’article et ce que l’équipe devra fournir au moment de la commande.</p></div><button onClick={()=>setEditing(null)}><X/></button></header><div className="builder-columns"><section className="builder-form"><SectionTitle n="1" title="Informations de l’article" text="Ce qu’est le produit et comment il est approvisionné."/><div className="builder-basic"><label>Nom de l’article<input autoFocus value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="Ex. Lame de scie"/></label><label>Catégorie<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}><option>Matériaux</option><option>Outils</option><option>Pliage</option></select></label><label>Sous-catégorie<input value={editing.subcategory} onChange={e=>setEditing({...editing,subcategory:e.target.value})} placeholder="Ex. Coupe"/></label><label>Fournisseur<select value={editing.supplier} onChange={e=>setEditing({...editing,supplier:e.target.value})}><option value="">Aucun</option>{suppliers.map(s=><option key={s}>{s}</option>)}</select></label><label>Source<select value={editing.source} onChange={e=>setEditing({...editing,source:e.target.value as DynamicProduct['source']})}><option>Inventaire MIR</option><option>Fournisseur</option><option>Les deux</option></select></label><label>Couleurs disponibles<input value={editing.colors.join(', ')} onChange={e=>setEditing({...editing,colors:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)})}/></label><label>Unités<input value={editing.units.join(', ')} onChange={e=>setEditing({...editing,units:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)})}/></label><label className="wide">Description<textarea value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})}/></label></div>{editing.category==='Pliage'&&<div className="segment-builder"><ProfileSketcher product={editing} onChange={setEditing}/></div>}
 <div className="field-builder"><div className="builder-section-heading"><b>2</b><div><h3>Informations à fournir lors de la commande</h3><p>Choisissez ce que l’Employé ou le Chef devra fournir pour commander cet article.</p></div><button onClick={()=>setEditing({...editing,fields:[...editing.fields,{id:`f-${Date.now()}`,name:'Nouvelle information',type:'Texte',required:false,defaultValue:'',filledBy:'terrain',unit:'',options:[]}]})}><Plus/> Ajouter une information</button></div><div className="field-card-list">{editing.fields.map((field,index)=><article className="field-card" key={field.id}><div className="field-card-title"><GripVertical/><div><b>{field.name||'Information sans nom'}</b><small>{field.type} · {field.required?'Obligatoire':'Facultative'} · {field.filledBy==='terrain'?'Employé/Chef':'Administration'}</small></div><div><button disabled={!index} onClick={()=>moveField(index,-1)}>↑</button><button disabled={index===editing.fields.length-1} onClick={()=>moveField(index,1)}>↓</button><button className="danger" onClick={()=>setEditing({...editing,fields:editing.fields.filter(f=>f.id!==field.id)})}><Trash2/></button></div></div><div className="field-card-grid"><label>Nom de l’information<input value={field.name} onChange={e=>updateField(field.id,{name:e.target.value})}/></label><label>Type de réponse<select value={field.type} onChange={e=>updateField(field.id,{type:e.target.value})}>{fieldTypes.map(t=><option key={t}>{t}</option>)}</select></label>{field.type==='Liste de choix'&&<label className="wide">Choix disponibles<input value={field.options.join(', ')} onChange={e=>updateField(field.id,{options:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)})} placeholder={'10", 12", 14"'}/></label>}<label>Valeur par défaut<input value={field.defaultValue} onChange={e=>updateField(field.id,{defaultValue:e.target.value})}/></label><label>Unité<input value={field.unit} onChange={e=>updateField(field.id,{unit:e.target.value})}/></label><label>Demandé à<select value={field.filledBy} onChange={e=>updateField(field.id,{filledBy:e.target.value as CatalogField['filledBy']})}><option value="terrain">Employé/Chef</option><option value="admin">Administration</option></select></label><label className="check-row"><input type="checkbox" checked={field.required} onChange={e=>updateField(field.id,{required:e.target.checked})}/> Information obligatoire</label></div></article>)}</div></div></section>
 <aside className="employee-preview"><span><Eye/> APERÇU EMPLOYÉ EN DIRECT</span><h3>{editing.name||'Nom de l’article'}</h3><p>Voici exactement ce que l’équipe verra dans sa commande.</p>{editing.segments.length>0&&<ProfilePreview product={editing}/>}<div>{editing.fields.filter(f=>f.filledBy==='terrain').map(f=><label key={f.id}>{f.name}{f.required&&<em>*</em>}{f.type==='Oui/Non'?<span className="preview-check"><input type="checkbox"/> Oui</span>:f.type==='Liste de choix'?<select defaultValue=""><option value="">Choisir…</option>{f.options.map(o=><option key={o}>{o}</option>)}</select>:f.type==='Note/commentaire'?<textarea placeholder="Écrire une note…"/>:<input value={f.defaultValue} readOnly placeholder={f.type}/>}<small>{f.unit}</small></label>)}</div>{editing.colors.length>0&&<label>Couleur<select>{editing.colors.map(c=><option key={c}>{c}</option>)}</select></label>}{editing.units.length>1&&<label>Unité<select>{editing.units.map(u=><option key={u}>{u}</option>)}</select></label>}</aside></div><footer><label><input type="checkbox" checked={editing.active} onChange={e=>setEditing({...editing,active:e.target.checked})}/> Article actif</label><button disabled={!editing.name.trim()} onClick={save}><Save/> Sauvegarder l’article</button></footer></div></div>}</div>
}
function SectionTitle({n,title,text}:{n:string;title:string;text:string}){return <div className="builder-section-heading"><b>{n}</b><div><h3>{title}</h3><p>{text}</p></div></div>}
