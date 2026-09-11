export type FoldingSegment={id:string;label:string;length:number;angle:number;mode:'fixed'|'employee_input';min:number;max:number;step:number;doubleFold:'none'|'optional'|'required'};
export type FoldingGeometry={unit:'inch'|'mm';material:string;thickness:number;segments:FoldingSegment[]};
export type FoldingVersion={id:string;number:number;publishedAt:string;geometry:FoldingGeometry};
export type FoldingDefinition={draft:FoldingGeometry;versions:FoldingVersion[];publishOnSave?:boolean};
// Geometry lengths and thickness are always stored in inches; unit is display only.
export function parseMeasure(raw:string):number{
 const clean=raw.trim().replace(/[″"]/g,'').replace(',','.');
 const match=clean.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
 const result=match?Number(match[1]||0)+Number(match[2])/Number(match[3]):/^\d+(?:\.\d+)?$/.test(clean)?Number(clean):NaN;
 if(!Number.isFinite(result)||result<0)throw Error('Entrez une mesure valide, par exemple 1 1/2.');
 return result;
}
export function displayed(value:number,unit:'inch'|'mm'){return String(Number((unit==='mm'?value*25.4:value).toFixed(4)))}
export function measured(value:string,unit:'inch'|'mm'){return parseMeasure(value)/(unit==='mm'?25.4:1)}
export function validateGeometry(g:FoldingGeometry):string[]{
 const errors:string[]=[];
 if(!['inch','mm'].includes(g.unit))errors.push('Unité invalide.');
 if(!g.material.trim())errors.push('Précisez le matériau.');
 if(!Number.isFinite(g.thickness)||g.thickness<=0)errors.push('L’épaisseur doit être positive.');
 if(!g.segments.length||g.segments.length>100)errors.push('Le profil doit contenir entre 1 et 100 segments.');
 const labels=new Set<string>(),ids=new Set<string>();
 for(const s of g.segments){
  const label=s.label.trim();
  if(!s.id||ids.has(s.id))errors.push('Identifiant de segment dupliqué.');ids.add(s.id);
  if(!label||labels.has(label.toUpperCase()))errors.push('Les labels doivent être remplis et uniques.');labels.add(label.toUpperCase());
  if(!Number.isFinite(s.length)||s.length<=0)errors.push(`${label} : longueur supérieure à zéro requise.`);
  if(!Number.isFinite(s.angle)||s.angle < -180||s.angle>180)errors.push(`${label} : angle entre −180° et 180° requis.`);
  if(!['fixed','employee_input'].includes(s.mode)||!['none','optional','required'].includes(s.doubleFold))errors.push(`${label} : option invalide.`);
  if(s.mode==='employee_input'&&(![s.min,s.max,s.step].every(Number.isFinite)||s.min<=0||s.max<s.min||s.length<s.min||s.length>s.max||s.step<=0))errors.push(`${label} : vérifiez minimum, défaut, maximum et précision.`);
 }
 return errors;
}
export function profilePoints(g:FoldingGeometry){
 let x=0,y=0,heading=0;const points=[{x,y}];
 for(const s of g.segments){heading+=s.angle*Math.PI/180;x+=s.length*Math.cos(heading);y+=s.length*Math.sin(heading);points.push({x,y})}
 return points;
}
export function publishDefinition(def:FoldingDefinition):FoldingDefinition{
 const errors=validateGeometry(def.draft);if(errors.length)throw Error(errors.join(' '));
 return {draft:structuredClone(def.draft),versions:[...structuredClone(def.versions),{id:crypto.randomUUID(),number:Math.max(0,...def.versions.map(v=>v.number))+1,publishedAt:new Date().toISOString(),geometry:structuredClone(def.draft)}]};
}
export function configuredGeometry(g:FoldingGeometry,values:Record<string,string|boolean>):FoldingGeometry{
 const result=structuredClone(g);
 for(const s of result.segments){
  if(s.mode!=='employee_input')continue;
  const raw=values[`fold-${s.id}`];const n=raw===undefined||raw===''?s.length:measured(String(raw),g.unit);
  if(n<s.min-1e-8||n>s.max+1e-8||Math.abs((n-s.min)/s.step-Math.round((n-s.min)/s.step))>1e-6)throw Error(`La mesure ${s.label} doit respecter les limites et le pas définis dans le catalogue.`);
  s.length=n;
 }
 return result;
}
