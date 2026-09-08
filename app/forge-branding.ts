'use client';

export type ForgeThemeId = 'forge'|'arctic'|'navy'|'slate'|'sand'|'forest'|'sunset'|'rose'|'purple'|'teal';
export type ForgeMode = 'light'|'dark'|'system';

export const FORGE_THEMES:{id:ForgeThemeId;name:string;description:string;mode:'light'|'dark';accent:string}[]=[
  {id:'forge',name:'Forge Classic',description:'Sombre moderne · identité Forge',mode:'dark',accent:'#a8ff2e'},
  {id:'arctic',name:'Arctic Light',description:'Clair, épuré et professionnel',mode:'light',accent:'#3a9b2a'},
  {id:'navy',name:'Navy Pro',description:'Bleu professionnel · stable',mode:'dark',accent:'#2787ff'},
  {id:'slate',name:'Slate',description:'Gris sophistiqué · sobre',mode:'dark',accent:'#aeb8c0'},
  {id:'sand',name:'Sand',description:'Beige moderne · chaleureux',mode:'light',accent:'#70ae2e'},
  {id:'forest',name:'Forest',description:'Vert nature · plein air',mode:'dark',accent:'#24d18f'},
  {id:'sunset',name:'Sunset',description:'Orange énergique · dynamique',mode:'dark',accent:'#ff6b22'},
  {id:'rose',name:'Rose',description:'Rose moderne · doux',mode:'light',accent:'#ed4d87'},
  {id:'purple',name:'Purple',description:'Violet créatif · distinctif',mode:'dark',accent:'#9a53f5'},
  {id:'teal',name:'Teal',description:'Turquoise frais · polyvalent',mode:'light',accent:'#079c9b'},
];

export type UserAppearance={theme:ForgeThemeId;mode:ForgeMode;density:'compact'|'normal'|'comfortable';updatedAt:string};
export type CompanyBranding={companyId:string;brandingVersion:number;original?:string;transparent?:string;light?:string;dark?:string;loader?:string;activeVariant:'original'|'transparent'|'light'|'dark';processingStatus:'idle'|'processing'|'ready'|'partial'|'failed';hasExistingTransparency:boolean;useAsLoader:boolean;loaderAnimation:'rotate'|'pulse'|'fade'|'none';loaderSpeed:'slow'|'normal';updatedAt:string;audit:Array<{at:string;action:string}>};

const appearanceKey=(companyId:string,email:string)=>`forge:${companyId}:user:${email}:appearance`;
const companyThemeKey=(companyId:string)=>`forge:${companyId}:company-theme`;
const brandingKey=(companyId:string)=>`forge:${companyId}:branding`;

export function getCompanyDefaultTheme(companyId:string,fallback:ForgeThemeId='forge'):ForgeThemeId{
  if(typeof window==='undefined')return fallback;
  return (localStorage.getItem(companyThemeKey(companyId)) as ForgeThemeId)||fallback;
}
export function setCompanyDefaultTheme(companyId:string,theme:ForgeThemeId){localStorage.setItem(companyThemeKey(companyId),theme)}
export function getUserAppearance(companyId:string,email:string,fallback:ForgeThemeId='forge'):UserAppearance{
  if(typeof window==='undefined')return {theme:fallback,mode:'system',density:'normal',updatedAt:''};
  try{return JSON.parse(localStorage.getItem(appearanceKey(companyId,email))||'null')||{theme:getCompanyDefaultTheme(companyId,fallback),mode:'system',density:'normal',updatedAt:''}}catch{return {theme:fallback,mode:'system',density:'normal',updatedAt:''}}
}
export function saveUserAppearance(companyId:string,email:string,value:UserAppearance){localStorage.setItem(appearanceKey(companyId,email),JSON.stringify(value));window.dispatchEvent(new Event('forge-appearance-updated'))}
export function applyAppearance(value:UserAppearance){
  const root=document.documentElement; const definition=FORGE_THEMES.find(t=>t.id===value.theme)||FORGE_THEMES[0];
  const systemDark=window.matchMedia?.('(prefers-color-scheme: dark)').matches??true;
  const effective=value.mode==='system'?(systemDark?'dark':'light'):value.mode;
  root.dataset.forgeTheme=value.theme; root.dataset.mode=effective; root.dataset.density=value.density; root.style.setProperty('--accent',definition.accent);
}
export function getBranding(companyId:string):CompanyBranding{
  const fallback:CompanyBranding={companyId,brandingVersion:1,activeVariant:'original',processingStatus:'idle',hasExistingTransparency:false,useAsLoader:false,loaderAnimation:'pulse',loaderSpeed:'slow',updatedAt:'',audit:[]};
  if(typeof window==='undefined')return fallback;
  try{return {...fallback,...JSON.parse(localStorage.getItem(brandingKey(companyId))||'{}')}}catch{return fallback}
}
export function saveBranding(value:CompanyBranding,action:string){const next={...value,brandingVersion:value.brandingVersion+1,updatedAt:new Date().toISOString(),audit:[{at:new Date().toISOString(),action},...value.audit].slice(0,20)};localStorage.setItem(brandingKey(value.companyId),JSON.stringify(next));window.dispatchEvent(new Event('forge-branding-updated'));return next}
export function resolveLogo(branding:CompanyBranding,mode:'light'|'dark'='dark'){
  const active=branding[branding.activeVariant];
  return (mode==='dark'?branding.light:branding.dark)||active||branding.transparent||branding.original||'/mir-company-logo-transparent.png';
}

export async function processCompanyLogo(file:File,companyId:string):Promise<CompanyBranding>{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Format non pris en charge. Utilisez PNG, JPG ou WEBP.');
  if(file.size>8*1024*1024)throw new Error('Fichier trop volumineux (maximum 8 Mo).');
  const original=await readFile(file); const img=await loadImage(original);
  if(img.width<80||img.height<40)throw new Error('Cette image est trop petite.');
  const canvas=document.createElement('canvas'); const max=900; const scale=Math.min(1,max/Math.max(img.width,img.height)); canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true}); if(!ctx)throw new Error('Impossible de préparer cette image.'); ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const data=ctx.getImageData(0,0,canvas.width,canvas.height); let transparent=0; for(let i=3;i<data.data.length;i+=4)if(data.data[i]<245)transparent++;
  const hasAlpha=transparent>data.data.length/4*.005; let derived=original;
  if(!hasAlpha){const px=data.data; const samples=[[0,0],[canvas.width-1,0],[0,canvas.height-1],[canvas.width-1,canvas.height-1]];let r=0,g=0,b=0;samples.forEach(([x,y])=>{const i=(y*canvas.width+x)*4;r+=px[i];g+=px[i+1];b+=px[i+2]});r/=4;g/=4;b/=4;for(let i=0;i<px.length;i+=4){const d=Math.hypot(px[i]-r,px[i+1]-g,px[i+2]-b);if(d<38)px[i+3]=0;else if(d<82)px[i+3]=Math.round(255*(d-38)/44)}ctx.putImageData(data,0,0);derived=canvas.toDataURL('image/png')}
  const base=getBranding(companyId);return saveBranding({...base,original,transparent:derived,loader:derived,activeVariant:hasAlpha?'original':'transparent',processingStatus:'ready',hasExistingTransparency:hasAlpha,useAsLoader:true},hasAlpha?'company_logo_uploaded_existing_alpha':'company_logo_background_removal_completed');
}
function readFile(file:File){return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('Cette image semble endommagée.'));reader.onerror=()=>reject(new Error('Cette image semble endommagée.'));reader.readAsDataURL(file)})}
function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Cette image semble endommagée.'));image.src=src})}
