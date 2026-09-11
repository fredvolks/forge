'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { OrderSelectOverlay } from './order-select-overlay';
import { AlertTriangle, ArrowLeft, Bell, Box, CalendarDays, Check, ChevronRight, ClipboardCheck, Clock3, Download, Factory, Flag, FileText, Folder, HardHat, LayoutDashboard, Camera, CreditCard, Mail, MapPin, Menu, MessageSquare, PackageCheck, Paperclip, Play, Plus, ReceiptText, Search, Send, Settings, ShieldCheck, Navigation, ShoppingCart, Square, Trash2, Users, X, Zap, } from 'lucide-react';
import { EmptyCompany, ForgeAccess, type ForgeSession } from './forge-access';
import { CommandCenter } from './command-center';
import { loadDynamicCatalog, ProfilePreview, type DynamicProduct } from './catalog-builder';
import {configuredGeometry} from '../lib/folding-domain';
import {FoldingDrawing} from './folding-settings';
import { AdjointeDesk } from './adjointe-desk';
import { SimulationPanel } from './simulation-panel';
import { AdminPortal } from './admin-portal';
import { applyAppearance, getBranding, getUserAppearance, resolveLogo, type ForgeThemeId } from './forge-branding';
import { FieldWorkspace, type FieldView } from './field-workspace';
import { PunchPreview } from './punch-preview';
import { ForgeMessages,MessageUnreadBadge } from './forge-messages';
import { MyOrders } from './my-orders';
import { OrderShortcuts } from './order-shortcuts';
import { MobileShellHeader } from './mobile-shell-header';
import { useTimeData } from './use-time-data';
import {ExpenseWorkspace} from './expense-workspace';
import { changeTimeDemo } from '../lib/time-demo';
import { dateKey, duration, employeeId, punch, totals } from '../lib/time-domain';
type Role = 'Boss' | 'Adjointe' | 'Chef' | 'Employé';
type Order = {
    id: string;
    job: string;
    client: string;
    title: string;
    stage: 'À préparer' | 'En production' | 'Prêt' | 'Livraison';
    due: string;
    lead: string;
    progress: number;
    color: string;
    access: Role[];
};
const orders: Order[] = [
    { id: 'CMD-2481', job: 'JOB-214', client: 'Breton', title: 'Solins & moulures — Phase 2', stage: 'En production', due: 'Aujourd’hui · 15:30', lead: 'Équipe Fred', progress: 68, color: '#ff9f1c', access: ['Boss', 'Adjointe', 'Chef', 'Employé'] },
    { id: 'CMD-2479', job: 'JOB-315', client: 'Construction Leduc', title: 'Panneaux toiture 24 ga', stage: 'Prêt', due: 'Ramassage · 13:00', lead: 'Équipe Samir', progress: 100, color: '#32d583', access: ['Boss', 'Adjointe', 'Chef'] },
    { id: 'CMD-2486', job: 'JOB-418', client: 'Toitures Bélanger', title: 'Pliage spécial — 42 pièces', stage: 'À préparer', due: 'Livraison chantier · 2 jours', lead: 'Non assigné', progress: 12, color: '#6c7cff', access: ['Boss', 'Adjointe'] },
    { id: 'CMD-2473', job: 'JOB-193', client: 'Métal Laurentien', title: 'Revêtement commercial', stage: 'Livraison', due: 'En route · 11:45', lead: 'Patrick D.', progress: 92, color: '#22b8cf', access: ['Boss', 'Adjointe'] },
];
const requests = [
    { urgent: true, type: 'MATÉRIAUX', title: 'Rouleau acier noir 24 ga', meta: 'Chantier Leduc · demandé par Marco', age: 'il y a 8 min' },
    { urgent: false, type: 'PLIAGE', title: '6 solins en L — 4 po × 6 po', meta: 'Atelier · demandé par Alexandre', age: 'il y a 21 min' },
    { urgent: false, type: 'MATÉRIAUX', title: '2 boîtes vis #12 couleur QC283', meta: 'Chantier Nordik · demandé par Samir', age: 'il y a 34 min' },
];
const team = [
    { name: 'Marco T.', role: 'Chef · Nordik', status: 'Sur chantier', initials: 'MT', tone: 'orange' },
    { name: 'Samir B.', role: 'Chef · Leduc', status: 'À l’atelier', initials: 'SB', tone: 'blue' },
    { name: 'Alexandre P.', role: 'Opérateur pliage', status: 'En production', initials: 'AP', tone: 'violet' },
    { name: 'Karine L.', role: 'Adjointe admin.', status: 'Disponible', initials: 'KL', tone: 'green' },
];
const weekHours = [
    { day: 'Lun', date: '31', hours: 9.25, job: 'JOB-214', status: 'Confirmé' },
    { day: 'Mar', date: '01', hours: 8.5, job: 'JOB-214', status: 'Confirmé' },
    { day: 'Mer', date: '02', hours: 10, job: 'JOB-214', status: 'À confirmer' },
    { day: 'Jeu', date: '03', hours: 7.75, job: 'JOB-315', status: 'À venir' },
    { day: 'Ven', date: '04', hours: 0, job: '—', status: 'À venir' },
];
const payrollRows = [
    { name: 'Fred G.', role: 'Chef', gross: '42 h 15', lunch: '- 1 h 15', payable: '41 h 00', state: 'Correction' },
    { name: 'Alex P.', role: 'Employé', gross: '39 h 30', lunch: '- 1 h 15', payable: '38 h 15', state: 'Confirmé' },
    { name: 'Marco T.', role: 'Chef', gross: '44 h 00', lunch: '- 1 h 15', payable: '42 h 45', state: 'À confirmer' },
    { name: 'Samir B.', role: 'Employé', gross: '37 h 45', lunch: '- 1 h 00', payable: '36 h 45', state: 'Confirmé' },
];
export default function Home() {
    const [role, setRole] = useState<Role>('Boss');
    const [devicePreview,setDevicePreview]=useState<'mobile'|'tablet-landscape'|'tablet-portrait'|'desktop'>('mobile');
    const [fieldView, setFieldView] = useState<FieldView | 'work'>('home');
    const [workTarget, setWorkTarget] = useState<'punch'|'orders'|'messages'|'purchases'>('punch');
    const [session, setSession] = useState<ForgeSession | null>(null);
    const demoIdentity:Record<Role,Pick<ForgeSession,'userName'|'email'|'role'>>={Boss:{userName:'Simon',email:'simon@mir.ca',role:'Boss'},Adjointe:{userName:'Ester',email:'ester@mir.ca',role:'Adjointe'},Chef:{userName:'Fred',email:'fred@mir.ca',role:'Chef'},Employé:{userName:'Alex',email:'alex@mir.ca',role:'Employé'}};
    const activeSession=session?.companyId==='mir-demo'?{...session,...demoIdentity[role]}:session;
    const [accessReady, setAccessReady] = useState(false);
    const timeData = useTimeData(session?.companyId || '');
    const activeSegment = timeData?.segments.find(s=>activeSession && s.employee_id===employeeId(activeSession) && !s.end_time);
    const punched = !!activeSegment;
    const punchStartedAt = activeSegment ? Date.parse(activeSegment.start_time) : null;
    const activeJob = timeData?.jobs.find(j=>j.id===activeSegment?.job_id)?.number || 'JOB-214';
    const ownSegments = timeData?.segments.filter(s=>activeSession&&s.employee_id===employeeId(activeSession))||[];
    const [punchClock,setPunchClock] = useState(()=>Date.now());
    useEffect(()=>{setPunchClock(Date.now());if(!punched)return;const interval=window.setInterval(()=>setPunchClock(Date.now()),1000);return()=>window.clearInterval(interval)},[punched]);
    const timeTotals = timeData ? totals(ownSegments,timeData.settings,punchClock) : null;
    const todaySegments = timeData ? ownSegments.filter(s=>dateKey(s.start_time,timeData.settings.timezone)===dateKey(new Date(),timeData.settings.timezone)) : [];
    const todaySeconds = todaySegments.reduce((n,s)=>n+Math.max(0,Math.floor(((s.end_time?Date.parse(s.end_time):punchClock)-Date.parse(s.start_time))/1000)-(timeTotals?.byId[s.id]?.deduction||0)*60),0);
    const todayPunchLabel = `${Math.floor(todaySeconds/3600)}:${String(Math.floor(todaySeconds/60)%60).padStart(2,'0')}:${String(todaySeconds%60).padStart(2,'0')}`;
    const togglePunch = async (action:'toggle'|'switch'='toggle') => {
      if(!activeSession||!timeData)return;
      try {const job=timeData.jobs.find(j=>j.number===selectedJob);if(!job)throw Error('Choisissez une Job assignée.');await changeTimeDemo(activeSession,d=>punch(d,activeSession,job.id,action));setToastText(action==='switch'?'Job changée':punched?'Punch terminé':'Punch démarré');}
      catch(error){setToastText((error as Error).message);}
      setToast(true);window.setTimeout(()=>setToast(false),3200);
    };
    const [toastText, setToastText] = useState('Demande envoyée');
    const [selectedJob, setSelectedJob] = useState('JOB-214');
    const [jobSwitchPending, setJobSwitchPending] = useState(false);
    const [temporaryJobs, setTemporaryJobs] = useState(['TEMP-009']);
    const [temporaryJobNames, setTemporaryJobNames] = useState<Record<string, string>>({ 'TEMP-009': 'Réparation urgence' });
    const [pendingOrders, setPendingOrders] = useState(1);
    const [clearedJobs, setClearedJobs] = useState<string[]>([]);
    const [bidPrice, setBidPrice] = useState(45251.01);
    const [materialsCost, setMaterialsCost] = useState(21480);
    const [fixedCost, setFixedCost] = useState(3450);
    const [rentalCost, setRentalCost] = useState(1895);
    const [laborCost, setLaborCost] = useState(9870);
    const [extrasCost, setExtrasCost] = useState(1450);
    const [accidentOpen, setAccidentOpen] = useState(false);
    const [documentationOpen, setDocumentationOpen] = useState(false);
    const [mapChoiceOpen, setMapChoiceOpen] = useState(false);
    const [accidentSubmitted, setAccidentSubmitted] = useState(false);
    const [accidentApproved, setAccidentApproved] = useState(false);
    const [planName, setPlanName] = useState('Plan architecture.pdf');
    const [logoSrc, setLogoSrc] = useState('/mir-company-logo-transparent.png');
    const [jobDossierOpen, setJobDossierOpen] = useState(false);
    const [extraFormOpen, setExtraFormOpen] = useState(false);
    const [orderCategory, setOrderCategory] = useState<'Matériaux' | 'Outils' | 'Pliage'>('Matériaux');
    const [orderShortcutCategory,setOrderShortcutCategory]=useState<'Matériaux' | 'Outils' | 'Pliage'>('Matériaux');
    const [selectedPreset, setSelectedPreset] = useState('Lame de Skill');
    const [orderCart, setOrderCart] = useState<Array<{
        id: string;
        quantity: number;
        category: string;
        item: string;
        detail: string;
        photos: string[];
        foldingSnapshot?: {productId:string;versionId:string;versionNumber:number;geometry:import('../lib/folding-domain').FoldingGeometry;values:Record<string,string|boolean>};
    }>>([]);
    const [orderSearch,setOrderSearch]=useState('');
    const [orderQuantityInput,setOrderQuantityInput]=useState('1');
    const orderQuantity=Number(orderQuantityInput);
    const [orderCartOpen,setOrderCartOpen]=useState(false);
    const [orderConfigOpen,setOrderConfigOpen]=useState(false);
    const [orderDelivery,setOrderDelivery]=useState('Livraison dans 2j');
    const [orderDeliveryMessage,setOrderDeliveryMessage]=useState('');
    const [orderPriority,setOrderPriority]=useState('');
    useEffect(()=>{
        const closeOutside=(event:PointerEvent)=>{
            if(!(event.target instanceof Node))return;
            document.querySelectorAll<HTMLDetailsElement>('.new-order-page .order-options details[open], .new-order-page details.order-attachments[open]').forEach(panel=>{
                if(!panel.contains(event.target as Node))panel.open=false;
            });
        };
        const closeWithEscape=(event:KeyboardEvent)=>{
            if(event.key!=='Escape')return;
            document.querySelectorAll<HTMLDetailsElement>('.new-order-page .order-options details[open], .new-order-page details.order-attachments[open]').forEach(panel=>{
                panel.open=false;
                panel.querySelector<HTMLElement>('summary')?.focus();
            });
        };
        document.addEventListener('pointerdown',closeOutside);
        document.addEventListener('keydown',closeWithEscape);
        return()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeWithEscape)};
    },[]);
    const [orderNote,setOrderNote]=useState('');
    const [orderSubmitting,setOrderSubmitting]=useState(false);
    const [orderPhotos, setOrderPhotos] = useState<string[]>([]);
    const [orderPhotoBusy,setOrderPhotoBusy]=useState(false);
    async function addOrderPhotos(files:FileList|null) {
        if(!files?.length)return;
        if(orderPhotos.length+files.length>4){setToastText('Maximum 4 photos par article.');setToast(true);return;}
        setOrderPhotoBusy(true);
        try {
            const photos=await Promise.all(Array.from(files).map(file=>new Promise<string>((resolve,reject)=>{
                if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1024*1024){reject(new Error('Utilisez une photo JPG, PNG ou WebP de moins de 1 Mo dans cet aperçu local.'));return;}
                const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('Photo illisible.'));reader.onerror=()=>reject(new Error('Photo illisible.'));reader.readAsDataURL(file);
            })));
            setOrderPhotos(current=>[...current,...photos]);
        } catch(error){setToastText(error instanceof Error?error.message:'Photo illisible.');setToast(true);}
        finally{setOrderPhotoBusy(false);}
    }
    const [orderJob,setOrderJob]=useState('');
    
    const [presetSets, setPresetSets] = useState<Record<'Matériaux' | 'Outils' | 'Pliage', string[]>>({
        Outils: ['Gun à revêtement', 'Gun à charpente', 'Gun à finition', 'Scie circulaire', 'Scie sauteuse', 'OLSA — grosseur manuelle', 'Scie à onglet', 'Patte d’échafaud', 'Vérin', 'Batterie FlexVolt', 'Batterie non FlexVolt', 'Hose à air'],
        Pliage: ['Fascia', 'Chaise', 'Colonne', 'T transition soffite/revêtement', 'L 1½″ fenêtre', 'Moulure anti-rongeur', 'Moulure de départ', 'Capage porte de garage', 'Beam', 'Autre pliage custom'],
        Matériaux: ['Lame de Skill', 'Lame Olfa 1″', 'Broche à soffite', 'Clou à revêtement', 'Clou 3¼', 'Clou finition', 'Tape 3M', 'Joint fibro 5′', 'Joint fibro 7′', 'J soffite', 'Boîte de soffite'],
    });
    const [length1, setLength1] = useState('120');
    const [length2, setLength2] = useState('');
    const [lengthQty1, setLengthQty1] = useState(1);
    const [lengthQty2, setLengthQty2] = useState(1);
    const [beamDoubleFold, setBeamDoubleFold] = useState(false);
    const [columnQty, setColumnQty] = useState(1);
    const [itemColor, setItemColor] = useState('Noir');
    const [customColor, setCustomColor] = useState('');
    const [itemUnit, setItemUnit] = useState('morceau');
    const [dynamicCatalog, setDynamicCatalog] = useState<DynamicProduct[]>([]);
    const [dynamicValues, setDynamicValues] = useState<Record<string, string | boolean>>({});
    const restoringOrderDraft=useRef(false);
    useEffect(()=>{
        if(restoringOrderDraft.current){restoringOrderDraft.current=false;return;}
        setOrderQuantityInput('1');
        setColumnQty(1);
        setLengthQty1(1);
        setLengthQty2(1);
        const product=dynamicCatalog.find(item=>item.active&&item.category===orderCategory&&item.name===selectedPreset);
        setItemColor(product?.colors[0]||'Noir');
        setItemUnit(product?.units[0]||'morceau');
        setCustomColor('');
        setDynamicValues(Object.fromEntries((product?.fields||[]).filter(field=>field.type==='Quantité').map(field=>[field.id,'1'])));
    },[selectedPreset,orderCategory,dynamicCatalog]);
    const [basketItems, setBasketItems] = useState([
        { id: 1, chef: 'Fred G.', job: 'JOB-214', name: 'Lames Olfa 1″', qty: '2 boîtes', loaded: false },
        { id: 2, chef: 'Fred G.', job: 'JOB-214', name: 'Tape rouge', qty: '6 rouleaux', loaded: false },
        { id: 3, chef: 'Fred G.', job: 'JOB-214', name: 'Clous gun 3¼', qty: '3 boîtes', loaded: true },
        { id: 4, chef: 'Marco T.', job: 'JOB-315', name: 'Broche soffite', qty: '2 boîtes', loaded: false },
        { id: 5, chef: 'Marco T.', job: 'JOB-315', name: 'Papier joint fibro', qty: '4 rouleaux', loaded: false },
    ]);
    const [filter, setFilter] = useState('Tous');
    const [query, setQuery] = useState('');
    const [modal, setModal] = useState(false);
    const [orderDraftStarted,setOrderDraftStarted]=useState(false);
    const [parkedDrafts,setParkedDrafts]=useState<Array<{id:string;data:ReturnType<typeof captureOrderDraft>}>>([]);
    function captureOrderDraft(){return {orderCart,orderJob,orderCategory,orderShortcutCategory,selectedPreset,orderQuantityInput,orderDelivery,orderDeliveryMessage,orderPriority,orderNote,orderPhotos,length1,length2,lengthQty1,lengthQty2,beamDoubleFold,columnQty,itemColor,customColor,itemUnit,dynamicValues};}
    function parkCurrentDraft(){if(orderDraftStarted||orderCart.length)setParkedDrafts(items=>[...items,{id:crypto.randomUUID(),data:captureOrderDraft()}]);}
    function resetOrderDraft(){setOrderCart([]);setOrderJob('');setOrderNote('');setOrderDeliveryMessage('');setOrderDelivery('Livraison dans 2j');setOrderPriority('');setOrderPhotos([]);setSelectedPreset('');setOrderQuantityInput('1');setDynamicValues({});setCustomColor('');setItemColor('Noir');setItemUnit('morceau');setLength1('120');setLength2('');setLengthQty1(1);setLengthQty2(1);setColumnQty(1);setBeamDoubleFold(false);setOrderSearch('');setOrderCartOpen(false);setOrderConfigOpen(false);setOrderDraftStarted(false);}
    function resumeOrderDraft(id:string){
        if(id!=='current'){
            const draft=parkedDrafts.find(item=>item.id===id);if(!draft)return;
            const previous=(orderDraftStarted||orderCart.length)?{id:crypto.randomUUID(),data:captureOrderDraft()}:null;
            setParkedDrafts(items=>[...items.filter(item=>item.id!==id),...(previous?[previous]:[])]);
            const d=draft.data;
            restoringOrderDraft.current=selectedPreset!==d.selectedPreset||orderCategory!==d.orderCategory;
            setOrderCart(d.orderCart);setOrderJob(d.orderJob);setOrderCategory(d.orderCategory);setOrderShortcutCategory(d.orderShortcutCategory);setSelectedPreset(d.selectedPreset);setOrderQuantityInput(d.orderQuantityInput);setOrderDelivery(d.orderDelivery);setOrderDeliveryMessage(d.orderDeliveryMessage);setOrderPriority(d.orderPriority);setOrderNote(d.orderNote);setOrderPhotos(d.orderPhotos);setLength1(d.length1);setLength2(d.length2);setLengthQty1(d.lengthQty1);setLengthQty2(d.lengthQty2);setBeamDoubleFold(d.beamDoubleFold);setColumnQty(d.columnQty);setItemColor(d.itemColor);setCustomColor(d.customColor);setItemUnit(d.itemUnit);setDynamicValues(d.dynamicValues);
        }
        setOrderDraftStarted(true);setOrderSearch('');setOrderCartOpen(false);setOrderConfigOpen(false);setModal(true);
    }
    useEffect(()=>{if(modal&&fieldView==='work'&&workTarget==='orders')setOrderDraftStarted(true)},[modal,fieldView,workTarget]);
    const [toast, setToast] = useState(false);
    const [mobileNav, setMobileNav] = useState(false);
    const visibleOrders = useMemo(() => orders.filter((o) => !clearedJobs.includes(o.job) && o.access.includes(role) && (filter === 'Tous' || o.stage === filter) && `${o.id} ${o.job} ${o.client} ${o.title}`.toLowerCase().includes(query.toLowerCase())), [clearedJobs, filter, query, role]);
    const totalCost = materialsCost + fixedCost + rentalCost + laborCost + extrasCost;
    const profit = bidPrice - totalCost;
    const performance = bidPrice ? (profit / bidPrice) * 100 : 0;
    function submitRequest(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (orderSubmitting || !orderCart.length || !activeSession)
            return;
        const chosenJob=timeData?.jobs.find(j=>j.id===orderJob&&j.company_id===activeSession.companyId&&j.members.includes(activeSession.email));
        if(!chosenJob){setToastText('Choisissez un chantier assigné.');setToast(true);return;}
        if(orderCart.some(item=>!Number.isFinite(item.quantity)||item.quantity<1)){setToastText('Vérifiez les quantités.');setToast(true);return;}
        setOrderSubmitting(true);
        try {
        const key = `forge:${activeSession.companyId}:orders`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const catalog = JSON.parse(localStorage.getItem(`forge:${activeSession!.companyId}:catalog`) || '[]') as Array<{
            name: string;
            source: string;
        }>;
        const dynamic = loadDynamicCatalog(activeSession.companyId);
        const next = { id: `BC-${crypto.randomUUID()}`, companyId: activeSession.companyId, job_id:chosenJob.id, requested_by_user_id:activeSession.email, date: new Date().toISOString().slice(0, 10), job: `${chosenJob.number} · ${chosenJob.name}`, requester: activeSession.userName, items: orderCart.map(item => {
                const product = catalog.find(p => p.name === item.item);
                const dynamicProduct = dynamic.find(p => p.name === item.item);
                const source = dynamicProduct?.source || product?.source || 'Inventaire MIR';
                const unit = item.detail.match(/Unité:\s*([^·]+)/)?.[1]?.trim() || (item.detail.includes('boîte') ? 'boîtes' : item.detail.includes('morceau') ? 'morceaux' : dynamicProduct?.units[0] || 'morceaux');
                return { order_line_id: item.id, photos:item.photos, foldingSnapshot:item.foldingSnapshot, name: item.item, qty:item.quantity, unit, detail: item.detail, source: source === 'Fournisseur' ? 'Fournisseur' : 'Inventaire MIR', supplier: source === 'Fournisseur' ? (dynamicProduct?.supplier || 'Acier Breton') : undefined };
            }), priority:orderCart.some(item=>item.detail.includes('Priorité: Urgente'))?'Urgente':orderCart.some(item=>item.detail.includes('Priorité: Normale'))?'Normale':'', delivery_location:[orderDelivery,orderDeliveryMessage.trim()].filter(Boolean).join(' — '), notes:orderNote, status: 'Reçue', history: [`Créée par ${activeSession.userName} · ${new Date().toLocaleString('fr-CA')}`] };
        localStorage.setItem(key, JSON.stringify([next, ...existing]));
        window.dispatchEvent(new Event('forge-orders-updated'));
        setOrderDeliveryMessage('');
        setOrderDraftStarted(false);
        setOrderCartOpen(false);
        setOrderConfigOpen(false);
        setModal(false);
        setOrderCart([]);
        setPendingOrders((n) => n + 1);
        setWorkTarget('orders');setFieldView('work');window.location.hash='orders';
        setToastText('Commande enregistrée dans Mes commandes · aperçu local');
        setToast(true);
        window.setTimeout(() => setToast(false), 3200);
        } catch {setToastText('Enregistrement impossible. Votre panier est conservé.');setToast(true);} finally {setOrderSubmitting(false);}
    }
    function submitPurchase(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setToastText('Achat confirmé'); setToast(true); window.setTimeout(() => setToast(false), 3200); }

    useEffect(() => { ['JOB-214', 'JOB-315'].forEach((job) => { if (!basketItems.some((item) => item.job === job))
        setClearedJobs((jobs) => jobs.includes(job) ? jobs : [...jobs, job]); }); }, [basketItems]);
    useEffect(() => { const raw = localStorage.getItem('forge:session'); if (raw) {
        try {
            const current = JSON.parse(raw) as ForgeSession;
            setSession(current);
            setRole(current.role);
        }
        catch {
            localStorage.removeItem('forge:session');
        }
    } setAccessReady(true); }, []);
    useEffect(() => { if (!session)
        return; const sync = () => { const simpleRaw = localStorage.getItem(`forge:${session.companyId}:catalog`); const products = (simpleRaw ? JSON.parse(simpleRaw) : []) as Array<{
        name: string;
        category: string;
        active: boolean;
    }>; const dynamic = loadDynamicCatalog(session.companyId); setDynamicCatalog(dynamic); setPresetSets(current => { const next = { ...current }; (['Matériaux', 'Outils', 'Pliage'] as const).forEach(category => { const names = [...products.filter(p => p.active && p.category === category).map(p => p.name), ...dynamic.filter(p => p.active && p.category === category).map(p => p.name)]; if (names.length)
        next[category] = [...new Set(names)]; }); return next; }); }; sync(); window.addEventListener('forge-catalog-updated', sync); return () => window.removeEventListener('forge-catalog-updated', sync); }, [session]);
    useEffect(() => { if(!session)return; const sync=()=>{const appearance=getUserAppearance(session.companyId,session.email,(session.theme as ForgeThemeId)||'forge');applyAppearance(appearance);setLogoSrc(resolveLogo(getBranding(session.companyId),document.documentElement.dataset.mode==='light'?'light':'dark'))};sync();window.addEventListener('forge-appearance-updated',sync);window.addEventListener('forge-branding-updated',sync);return()=>{window.removeEventListener('forge-appearance-updated',sync);window.removeEventListener('forge-branding-updated',sync)} }, [session]);
    useEffect(() => { const sync=()=>{if(window.location.hash==='#orders'){setWorkTarget('orders');setFieldView('work');return;}const hash=window.location.hash.replace('#field/','').split('/')[0];const fieldPages:FieldView[]=['home','projects','project','project-sections','project-info','project-plans','project-photos','project-architect','project-special','menu','profile','hours','absences','emergency','documents','incidents','documentation','settings'];if(fieldPages.includes(hash as FieldView))setFieldView(hash as FieldView)};sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)}, []);
    if (!accessReady)
        return <div className="forge-loading">FORGE</div>;
    if (!session)
        return <ForgeAccess onEnter={(current) => { setSession(current); setRole(current.role); }}/>;
    if (session.companyId !== 'mir-demo')
        return <EmptyCompany session={session} onLogout={() => { localStorage.removeItem('forge:session'); setSession(null); }}/>;
    const isFieldRole = role === 'Employé' || role === 'Chef';
    if (!isFieldRole)
        return <AdminPortal role={role as 'Boss' | 'Adjointe'} session={activeSession!} onLogout={() => { localStorage.removeItem('forge:session'); setSession(null); }}/>;
    // Keep the declared role union for the legacy demo sections below. The
    // current route is field-only, but those sections remain for regression QA.
    const displayedRole: Role = session.role;
    const quickItems = presetSets[orderCategory];
    const activeDynamicProduct = dynamicCatalog.find(product => product.active && product.category === orderCategory && product.name === selectedPreset);
    const hasQuickColor = Boolean(activeDynamicProduct?.colors.length || orderCategory === 'Pliage' || ['J soffite', 'Boîte de soffite'].includes(selectedPreset));
    const quickField = !hasQuickColor ? activeDynamicProduct?.fields.find(field => field.filledBy === 'terrain' && ['Dimension', 'Mesure', 'Longueur', 'Liste de choix', 'Texte', 'Nombre'].includes(field.type)) : undefined;
    const extraQuickFields = (activeDynamicProduct?.fields || []).filter(field => field.filledBy === 'terrain' && field.id !== quickField?.id && ['Dimension', 'Mesure', 'Longueur', 'Liste de choix', 'Texte', 'Nombre'].includes(field.type)).slice(0, 2);
    const switchingJob = punched && selectedJob !== activeJob;
    const navigateField = (destination:FieldView|'punch'|'orders'|'messages'|'purchases') => {
        document.querySelector<HTMLElement>('.workspace')?.scrollTo({top:0,behavior:'smooth'});
        if (['punch','orders','messages','purchases'].includes(destination)) {
            if (destination === 'orders') {
                setModal(false);
                setOrderCartOpen(false);
                setOrderConfigOpen(false);
            }
            setWorkTarget(destination as 'punch'|'orders'|'messages'|'purchases');
            setFieldView('work');
            window.location.hash = destination;
            window.setTimeout(() => document.getElementById(destination)?.scrollIntoView({behavior:'smooth'}), 50);
            return;
        }
        setFieldView(destination as FieldView);
        window.location.hash = `field/${destination}`;
        window.scrollTo({top:0,behavior:'smooth'});
    };
    return <main className={`app-shell ${isFieldRole ? 'field-mobile demo-device-stage' : ''} device-${devicePreview} ${fieldView==='hours'?'hours-active':''} role-${displayedRole.toLowerCase().replace('é', 'e')}`}>
    <OrderSelectOverlay/>
    {isFieldRole && <aside className="demo-preview-controls" aria-label="Contrôles de l’aperçu Démo">
      <div className="demo-control-group">
        <span>Rôle</span>
        <div className="demo-role-buttons">
          {(['Boss','Adjointe','Chef','Employé'] as Role[]).map((item) => <button key={item} className={role===item?'active':''} onClick={()=>setRole(item)}>{item==='Chef'?'Chef d’équipe':item}</button>)}
        </div>
      </div>
      <div className="demo-control-group">
        <span>Appareil</span>
        <div className="demo-device-buttons">
          <button className={devicePreview==='mobile'?'active':''} onClick={()=>setDevicePreview('mobile')}><b>Mobile</b><small>390 × 844</small></button>
          <button className={devicePreview==='tablet-portrait'?'active':''} onClick={()=>setDevicePreview('tablet-portrait')}><b>iPad portrait</b><small>768 × 1024</small></button>
          <button className={devicePreview==='tablet-landscape'?'active':''} onClick={()=>setDevicePreview('tablet-landscape')}><b>iPad paysage</b><small>1024 × 768</small></button>
          <button className={devicePreview==='desktop'?'active':''} onClick={()=>setDevicePreview('desktop')}><b>Desktop</b><small>1440 × 900</small></button>
        </div>
      </div>
      <p>Les contrôles restent hors de l’écran de l’appareil.</p>
    </aside>}
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand">
<div className="brand-mark">
<HardHat size={23}/>
</div>
<div>
<b>FORGE</b>
<span>CHANTIER</span>
</div>
</div>
      <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Fermer le menu">
<X />
</button>
      <nav aria-label="Navigation principale">
<p>ESPACE DE TRAVAIL</p>{displayedRole === 'Employé' ? <>
<a className={fieldView==='work'?'active':''} href="#punch" onClick={()=>navigateField('punch')}>
<Clock3 />Punch</a><a className={fieldView==='hours'?'active':''} href="#field/hours" onClick={()=>navigateField('hours')}><Clock3/>Mes heures</a>
<a href="#job">
<HardHat />Mon job</a>
<a href="#orders">
<PackageCheck />Commandes <em>{visibleOrders.length}</em>
</a>
<a href="#messages">
<MessageSquare />Discussion privée <i />
</a>
</> : <>
<a className="active" href="#dashboard">
<LayoutDashboard />Vue d’ensemble</a>
<a href="#punch">
<Clock3 />{displayedRole === 'Chef' ? 'Punch & mon équipe' : 'Punch & heures'}</a>
<a href="#orders">
<PackageCheck />Commandes <em>{visibleOrders.length}</em>
</a>
<a href="#requests">
<Zap />Demandes <em className="hot">3</em>
</a>
<a href="#messages">
<MessageSquare />Communications <i />
</a>
<p>GESTION</p>
<a href="#team">
<Users />Équipes</a>{(displayedRole === 'Boss' || displayedRole === 'Adjointe') && <>
<a href="#inventory">
<Box />Inventaire</a>
<a href="#suppliers">
<Factory />Fournisseurs</a>
<a href="#settings">
<Settings />Paramètres</a>
</>}</>}</nav>
      <div className="shift-card">
<div>
<Clock3 />
<span>Quart en cours</span>
</div>
<b>06:30 — 15:30</b>
<small>18 membres actifs</small>
</div>
      <div className="profile forge-profile">
<div className="avatar">{session.userName.slice(0, 2).toUpperCase()}</div>
<div>
<b>{session.userName}</b>
<span>{session.companyName} · {role}</span>
</div>
<button onClick={() => { localStorage.removeItem('forge:session'); setSession(null); }}>Quitter</button>
</div>
    </aside>
    {mobileNav && <button className="nav-scrim" aria-label="Fermer" onClick={() => setMobileNav(false)}/>}
    <section className="workspace" id="dashboard">
      {isFieldRole && <MobileShellHeader logoSrc={logoSrc} userName={activeSession!.userName} companyId={activeSession!.companyId} email={activeSession!.email} onSettings={()=>navigateField('settings')} routeKey={`${fieldView}:${workTarget}:${devicePreview}`}/>}
      <header className="topbar">
<button className="menu-btn" onClick={() => setMobileNav(true)} aria-label="Ouvrir le menu">
<Menu />
</button>
<div className="search">
<Search />
<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher no de job, commande, client…"/>
<kbd>⌘ K</kbd>
</div>
<div className="top-actions">
{!isFieldRole&&<label className="role-switch">
<span>Vue</span>
<select value={role} onChange={(e) => setRole(e.target.value as Role)}>
<option>Boss</option>
<option>Adjointe</option>
<option>Chef</option>
<option>Employé</option>
</select>
</label>}
<span className="live">
<i /> Atelier en activité</span>
<button aria-label="Notifications" className="icon-btn">
<Bell />
<b>4</b>
</button>{displayedRole !== 'Employé' && <button className="new-request" onClick={() => setModal(true)}>
<Plus /> Nouvelle demande</button>}<label className={`company-logo ${displayedRole === 'Adjointe' ? 'editable' : ''}`} aria-label={displayedRole === 'Adjointe' ? 'Modifier le logo de la compagnie' : 'Les Revêtements MIR'}>
<img src={logoSrc} alt="Les Revêtements MIR"/>{displayedRole === 'Adjointe' && <>
<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) {
        setLogoSrc(URL.createObjectURL(file));
        setToastText('Nouveau logo importé');
        setToast(true);
        window.setTimeout(() => setToast(false), 3200);
    } }}/>
<span className="logo-edit-hint">
<Camera /> Modifier</span>
</>}</label>
</div>
</header>
      <div className={`content ${fieldView !== 'work' ? 'field-page-active' : `work-focus work-${workTarget}`}`}>
        {fieldView==='work'&&workTarget==='orders'&&!modal&&<MyOrders session={activeSession!} drafts={[...(orderDraftStarted||orderCart.length?[{id:'current',count:orderCart.length,job:timeData?.jobs.find(j=>j.id===orderJob)?.number||orderJob}]:[]),...parkedDrafts.map(d=>({id:d.id,count:d.data.orderCart.length,job:timeData?.jobs.find(j=>j.id===d.data.orderJob)?.number||d.data.orderJob}))]} onResume={resumeOrderDraft} onDeleteDraft={id=>{if(id==='current')resetOrderDraft();else setParkedDrafts(items=>items.filter(d=>d.id!==id))}} onNew={()=>{parkCurrentDraft();resetOrderDraft();setOrderJob(timeData?.jobs.find(j=>j.members.includes(activeSession!.email))?.id||'');setOrderDraftStarted(true);setModal(true)}}/>}
    {modal && fieldView === 'work' && workTarget === 'orders' && <section className="new-order-page"><form className="modal order-modal" onSubmit={submitRequest}>
      <div className="modal-head order-hero">
<div>
<span>COMMANDE MULTI-ARTICLES</span>
<h2>Nouvelle commande</h2>
<p>Ajoutez les articles dont vous avez besoin.</p>
</div>
<button type="button" onClick={() => setModal(false)} aria-label="Retour à mes commandes">
<X />
</button>
</div>
      <div className="new-order-layout"><div className="new-order-main"><div className="form-row">
<label>Projet / chantier<select required value={orderJob} onChange={e=>{if(orderCart.length&&e.target.value!==orderJob){if(!window.confirm('Changer de chantier videra la commande actuelle. Continuer?'))return;setOrderCart([]);setOrderPhotos([]);}setOrderJob(e.target.value)}}>
<option value="">Choisir un chantier</option>
{timeData?.jobs.filter(j=>j.company_id===activeSession!.companyId&&j.members.includes(activeSession!.email)).map(j=><option key={j.id} value={j.id}>{j.number} — {j.name}</option>)}
</select>
</label>
</div>
<label className="order-article-search"><Search/><input value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Rechercher un article, un code ou une référence…" aria-label="Rechercher un article"/></label>
<div className="order-section-label">CATÉGORIES</div>
<div className="order-category-pills">{Object.keys(presetSets).map(category=><button type="button" key={category} aria-pressed={orderShortcutCategory===category} onClick={()=>{setOrderShortcutCategory(category as typeof orderCategory);setOrderCategory(category as typeof orderCategory);setSelectedPreset(presetSets[category as typeof orderCategory][0]||'');setDynamicValues({})}}>{category}</button>)}</div>
<OrderShortcuts category={orderShortcutCategory} onCloseSearch={()=>setOrderSearch('')} query={orderSearch} selected={selectedPreset} preferenceKey={`forge:${session.companyId}:${session.email}:order-favorites`} items={Object.entries(presetSets).flatMap(([category,names])=>names.map(name=>({category,name,search:`${name} ${category}`}))).concat(dynamicCatalog.filter(p=>p.active&&p.companyId===session.companyId).map(p=>({category:p.category,name:p.name,search:`${p.name} ${p.id} ${p.description} ${p.subcategory} ${p.supplier}`}))).filter((item,index,all)=>all.findLastIndex(other=>other.name===item.name&&other.category===item.category)===index)} onSelect={item=>{setOrderCategory(item.category as typeof orderCategory);setSelectedPreset(item.name);setDynamicValues({});setOrderSearch('')}}/>
<section className="order-item-card"><div className="order-selected-title"><div><span>ARTICLE SÉLECTIONNÉ</span><b>{selectedPreset||'Choisissez un article'}</b></div><button type="button" onClick={()=>setSelectedPreset('')} aria-label="Retirer l’article sélectionné"><X/></button></div>
      {(orderCategory==='Pliage'||activeDynamicProduct?.fields.some(field=>field.filledBy==='terrain'&&field.id!==quickField?.id&&!extraQuickFields.some(quick=>quick.id===field.id)))&&<button className="order-configure" type="button" aria-label="Autres options de l’article" title="Autres options" aria-expanded={orderConfigOpen} onClick={()=>setOrderConfigOpen(true)}><Settings/></button>}
      <div className={`order-configuration ${orderConfigOpen?'open':''}`}><button className="order-config-done" type="button" onClick={()=>setOrderConfigOpen(false)}>Terminé <Check/></button>
      {orderCategory === 'Pliage' && <div className="folding-options">
<label>Couleur<select data-order-option="Couleur" value={itemColor} onChange={e=>setItemColor(e.target.value)}>
<option>Noir</option>
<option>Blanc</option>
</select>
</label>
<label className="simon-confirm">
<input data-order-option="Confirmé avec Simon" type="checkbox" required/>
<span>
<b>Confirmer avec Simon</b>
<small>Dimensions et couleur vérifiées avant l’envoi</small>
</span>
</label>
</div>}
      {orderCategory === 'Pliage' && selectedPreset === 'Colonne' && <div className="garage-folding technical-profile column-profile">
<div className="garage-diagram">
<img src="/profil-colonne.svg" alt="Profil technique Colonne avec mesure A sur le dessus et B sur le côté droit"/>
</div>
<div className="garage-fields">
<span>PRESET PLIAGE · COLONNE</span>
<h3>Mesures et quantité</h3>
<div className="profile-measures column-measures">{['A', 'B'].map((measure) => <label key={measure}>
<b>{measure}</b>
<input data-order-option={`Mesure ${measure}`} required placeholder="Mesure"/>
</label>)}</div>
<label className="column-qty">Quantité<input required type="number" min="1" value={columnQty} onChange={(e) => setColumnQty(Number(e.target.value))}/>
</label>
<div className="column-confirmed">
<Check />
<span>Noir ou blanc · À confirmer avec Simon ci-dessus</span>
</div>
</div>
</div>}
      {orderCategory === 'Pliage' && !activeDynamicProduct && (selectedPreset === 'Capage porte de garage' || selectedPreset === 'Beam') && <div className="garage-folding technical-profile">
<div className="garage-diagram">
<img src={selectedPreset === 'Beam' ? '/profil-beam.svg' : '/profil-porte-garage.svg'} alt={selectedPreset === 'Beam' ? 'Profil technique Beam avec cinq segments identifiés' : 'Profil technique de capage de porte de garage avec trois segments identifiés'}/>
</div>
<div className="garage-fields">
<span>PRESET CUSTOM · {selectedPreset.toUpperCase()}</span>
<h3>Mesures du profil</h3>
<div className="profile-measures">{(selectedPreset === 'Beam' ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C']).map((measure) => <label key={measure}>
<b>{measure}</b>
<input data-order-option={`Mesure ${measure}`} required placeholder="Mesure"/>
</label>)}</div>{selectedPreset === 'Beam' && <div className="beam-double-folds">
<label className={beamDoubleFold ? 'checked' : ''}>
<input type="checkbox" checked={beamDoubleFold} onChange={(e) => setBeamDoubleFold(e.target.checked)}/>
<b>A–E</b>
<small>Plié double</small>
</label>
</div>}<div className={selectedPreset === 'Beam' ? 'beam-length-row' : 'profile-lengths paired-lengths'}>
<label>Longueur<input required value={length1} onChange={(e) => setLength1(e.target.value)} placeholder="Inscrire la longueur"/>
</label>
<label>Quantité<input required type="number" min="1" value={lengthQty1} onChange={(e) => setLengthQty1(Number(e.target.value))}/>
</label>{selectedPreset !== 'Beam' && <>
<label>Longueur 2 <small>optionnelle</small>
<input value={length2} onChange={(e) => setLength2(e.target.value)} placeholder="Inscrire la longueur"/>
</label>
<label>Quantité longueur 2<input type="number" min="1" value={lengthQty2} onChange={(e) => setLengthQty2(Number(e.target.value))}/>
</label>
</>}</div>
</div>
</div>}
      {activeDynamicProduct && <div className="dynamic-order-form">
<div className="dynamic-profile-view">
{activeDynamicProduct.folding?.versions.length ? <FoldingDrawing geometry={activeDynamicProduct.folding.versions.at(-1)!.geometry}/> : <ProfilePreview product={activeDynamicProduct}/>}
</div>
<div className="dynamic-order-fields">
<span>ARTICLE DU CATALOGUE · {activeDynamicProduct.name.toUpperCase()}</span>
<h3>Mesures et données</h3>
<div>{activeDynamicProduct.fields.filter(field => field.filledBy === 'terrain' && field.id !== quickField?.id).map(field => <label key={field.id}>{field.name}{field.type === 'Oui/Non' ? <input type="checkbox" checked={Boolean(dynamicValues[field.id])} onChange={e => setDynamicValues(v => ({ ...v, [field.id]: e.target.checked }))}/> : <input required={field.required} value={String(dynamicValues[field.id] ?? field.defaultValue)} onChange={e => setDynamicValues(v => ({ ...v, [field.id]: e.target.value }))} placeholder={field.type}/>}<small>{field.unit}</small>
</label>)}</div>{activeDynamicProduct.colors.length > 0 && <label>Couleur<select value={itemColor} onChange={e => setItemColor(e.target.value)}>{activeDynamicProduct.colors.map(color => <option key={color}>{color}</option>)}</select>
</label>}{itemColor === 'Autre' && <label>Couleur personnalisée<input value={customColor} onChange={e => setCustomColor(e.target.value)} required/>
</label>}{activeDynamicProduct.units.length > 1 && <label>Unité<select value={itemUnit} onChange={e => setItemUnit(e.target.value)}>{activeDynamicProduct.units.map(unit => <option key={unit}>{unit}</option>)}</select>
</label>}</div>
</div>}
      {!activeDynamicProduct && !(orderCategory === 'Pliage' && (selectedPreset === 'Capage porte de garage' || selectedPreset === 'Beam' || selectedPreset === 'Colonne')) && <div className="item-line">
<label>Article<input required readOnly value={selectedPreset}/>
</label>
<label>Quantité<div className="order-qty"><button type="button" aria-label="Diminuer la quantité" disabled={orderQuantity<=1} onClick={()=>setOrderQuantityInput(String(Math.max(1,orderQuantity-1)))}>−</button><input required aria-label="Quantité" type="number" inputMode="numeric" min="1" step="1" value={orderQuantityInput} onChange={e=>setOrderQuantityInput(e.target.value.replace(/^0+(?=\d)/,''))}/><button type="button" aria-label="Augmenter la quantité" onClick={()=>setOrderQuantityInput(String(Math.max(1,orderQuantity+1)))}>+</button></div>
</label>

</div>}
      {orderCategory === 'Matériaux' && ['J soffite', 'Boîte de soffite'].includes(selectedPreset) && <div className="soffit-options">
<label>Couleur<select value={itemColor} onChange={e => setItemColor(e.target.value)}>
<option>Noir</option>
<option>Blanc</option>
<option>Autre</option>
</select>
</label>{itemColor === 'Autre' && <label>Couleur personnalisée<input value={customColor} onChange={e => setCustomColor(e.target.value)} placeholder="Inscrire la couleur" required/>
</label>}<label>Unité<select value={itemUnit} onChange={e => setItemUnit(e.target.value)}>
<option value="morceau">Morceau</option>
<option value="boîte">Boîte</option>
</select>
</label>
</div>}

</div><div className="order-quick-options"><details className="order-attachments"><summary aria-label="Joindre une photo ou une note"><Paperclip/></summary><div className="order-attachment-menu"><button className="order-attachment-close" type="button" onClick={e=>{const panel=e.currentTarget.closest('details');if(panel){panel.open=false;panel.querySelector<HTMLElement>('summary')?.focus()}}}>Fermer <X/></button><div className="mobile-photo-actions">
<label>
<input type="file" accept="image/*" capture="environment" disabled={orderPhotoBusy} onChange={e=>{void addOrderPhotos(e.target.files);e.target.value=''}}/>
<Camera />
<span>
<b>Prendre une photo</b>
<small>{orderPhotos.length ? `${orderPhotos.length} photo jointe` : 'Chantier ou matériel'}</small>
</span>
</label>
<label>
<input type="file" accept="image/*" multiple disabled={orderPhotoBusy} onChange={e=>{void addOrderPhotos(e.target.files);e.target.value=''}}/>
<Paperclip />
<span>
<b>Ajouter une photo</b>
<small>{orderPhotos.length ? `${orderPhotos.length} photo${orderPhotos.length > 1 ? 's' : ''} sélectionnée${orderPhotos.length > 1 ? 's' : ''}` : 'Galerie de photos'}</small>
</span>
</label>
</div><label className="order-attachment-note">Note<textarea value={orderNote} onChange={e=>setOrderNote(e.target.value)} placeholder="Couleur, dimensions, détails importants…"/></label></div></details>
{hasQuickColor ? <label className="order-quick-color">{itemColor==='Autre'?<span className="order-inline-color"><input autoFocus aria-label="Préciser la couleur" placeholder="Écrire la couleur" required value={customColor} onChange={e=>setCustomColor(e.target.value)}/><button type="button" aria-label="Revenir aux couleurs proposées" title="Changer de couleur" onClick={()=>{setItemColor(activeDynamicProduct?.colors.find(color=>color!=='Autre')||'Noir');setCustomColor('')}}><ChevronRight/></button></span>:<select aria-label="Couleur de l’article" title="Couleur" value={itemColor} onChange={e=>setItemColor(e.target.value)}>{(activeDynamicProduct?.colors.length?activeDynamicProduct.colors:orderCategory==='Pliage'?['Noir','Blanc']:['Noir','Blanc','Autre']).map(color=><option key={color}>{color}</option>)}</select>}</label> : quickField ? <label className="order-quick-color">{quickField.type === 'Liste de choix' ? <select aria-label={quickField.name} title={quickField.name} required={quickField.required} value={String(dynamicValues[quickField.id] ?? quickField.defaultValue)} onChange={e=>setDynamicValues(v=>({...v,[quickField.id]:e.target.value}))}><option value="">{quickField.name}</option>{quickField.options.map(option=><option key={option}>{option}</option>)}</select> : <input aria-label={quickField.name} title={quickField.name} placeholder={quickField.name} required={quickField.required} value={String(dynamicValues[quickField.id] ?? quickField.defaultValue)} onChange={e=>setDynamicValues(v=>({...v,[quickField.id]:e.target.value}))}/>}</label> : orderCategory === 'Outils' && selectedPreset.includes('OLSA') ? <label className="order-quick-color"><input key={selectedPreset} data-order-option="Grosseur OLSA" aria-label="Grosseur OLSA" title="Grosseur OLSA" required placeholder="Grosseur"/></label> : null}
{selectedPreset&&<label className="order-quick-unit"><select aria-label="Unité de l’article" title="Unité" value={itemUnit} onChange={e=>setItemUnit(e.target.value)}>{Array.from(new Set([...(activeDynamicProduct?.units||[]),'morceau','boîte','pi²','pi lin.','paquet','rouleau','mètre','litre'])).map(unit=><option key={unit} value={unit}>{unit==='morceau'?'mcx':unit}</option>)}</select></label>}
{extraQuickFields.map((field,index)=><label className="order-quick-color order-quick-extra" key={field.id} style={{gridColumn:index+2,gridRow:2}}>{field.type==='Liste de choix'?<select aria-label={field.name} title={field.name} required={field.required} value={String(dynamicValues[field.id]??field.defaultValue)} onChange={e=>setDynamicValues(v=>({...v,[field.id]:e.target.value}))}><option value="">{field.name}</option>{field.options.map(option=><option key={option}>{option}</option>)}</select>:<input aria-label={field.name} title={field.name} placeholder={field.name} required={field.required} value={String(dynamicValues[field.id]??field.defaultValue)} onChange={e=>setDynamicValues(v=>({...v,[field.id]:e.target.value}))}/>}</label>)}
</div>
{orderPhotos.length>0&&<div className="order-photo-thumbs">{orderPhotos.map((photo,index)=><figure key={index}><img src={photo} alt={`Photo jointe ${index+1}`}/><button type="button" aria-label={`Retirer la photo ${index+1}`} onClick={()=>setOrderPhotos(photos=>photos.filter((_,i)=>i!==index))}><X/></button></figure>)}</div>}
</section>
<div className="order-options">
<details><summary><Flag/><b>{orderPriority ? `Priorité · ${orderPriority}` : 'Priorité'}</b><ChevronRight/></summary><label>Priorité (facultative)<select value={orderPriority} onChange={e=>setOrderPriority(e.target.value)}><option value="">Aucune priorité</option><option>Normale</option><option>Urgente</option></select></label></details>
</div>
</div><aside id="order-basket" aria-label="Ma commande" className={`new-order-cart ${orderCartOpen?'open':''}`}><div className="order-basket-heading"><h3>Ma commande</h3><button type="button" onClick={()=>setOrderCartOpen(false)} aria-label="Fermer le panier"><X/></button></div>{!orderCart.length&&<p className="order-cart-empty">Ajoutez votre premier article.</p>}
      {orderCart.length > 0 && <div className="order-cart-preview">
<div className="cart-preview-head">
<div>
<span>MA COMMANDE</span>
<h3>{orderCart.length} article{orderCart.length > 1 ? 's' : ''}</h3>
</div>
<button type="button" className="order-clear" onClick={()=>{if(window.confirm('Vider les articles de cette commande?'))setOrderCart([])}}>Vider tout</button>
</div>{orderCart.map((item) => <div className="cart-preview-item" key={item.id}>
<span>{item.category.slice(0, 3).toUpperCase()}</span>
<div>
<b>{item.item}</b>
<div className="order-cart-quantity"><button type="button" aria-label={`Diminuer la quantité de ${item.item}`} disabled={item.quantity<=1} onClick={()=>setOrderCart(items=>items.map(i=>i.id===item.id?{...i,quantity:i.quantity-1,detail:i.detail.replace(/Quantité:?\s*\d+/i,`Quantité ${i.quantity-1}`)}:i))}>−</button><span>{item.quantity}</span><button type="button" aria-label={`Augmenter la quantité de ${item.item}`} onClick={()=>setOrderCart(items=>items.map(i=>i.id===item.id?{...i,quantity:i.quantity+1,detail:i.detail.replace(/Quantité:?\s*\d+/i,`Quantité ${i.quantity+1}`)}:i))}>+</button></div><small>{[...item.detail.split(' · ').filter(part=>!/^Quantité:?\s*\d+(?:[.,]\d+)?$/i.test(part.trim())), ...(item.photos.length ? [`${item.photos.length} photo${item.photos.length > 1 ? 's' : ''} jointe${item.photos.length > 1 ? 's' : ''}`] : [])].filter(Boolean).join(' · ')}</small>
</div>
<button type="button" onClick={() => setOrderCart((items) => items.filter((i) => i.id !== item.id))} aria-label={`Retirer ${item.item}`}>
<Trash2 />
</button>
</div>)}<small className="cart-help">Change de catégorie ci-dessus pour ajouter d’autres types d’articles à la même commande.</small>
</div>}
      <label className="order-cart-delivery"><span><CalendarDays/> Livraison souhaitée</span><select aria-label="Livraison souhaitée" value={orderDelivery} onChange={e=>setOrderDelivery(e.target.value)}><option>Livraison rush</option><option>Livraison dans 2j</option><option>Livraison dans 3j</option><option>Non urgent</option></select></label>
      <label className="order-cart-delivery">Message pour la livraison<textarea rows={2} maxLength={1000} value={orderDeliveryMessage} onChange={e=>setOrderDeliveryMessage(e.target.value)} placeholder="Lieu précis, heure, consignes…" style={{minHeight:64,resize:'vertical'}}/></label>
      <button formNoValidate className="submit" type="submit" disabled={!orderCart.length||orderSubmitting}>
<Send /> {orderCart.length ? `Envoyer la commande · ${orderCart.length} item${orderCart.length > 1 ? 's' : ''}` : 'Ajoute un item avant d’envoyer'}</button>
</aside></div><div className="order-mobile-bar"><button type="button" aria-expanded={orderCartOpen} aria-controls="order-basket" onClick={()=>{setOrderCartOpen(true);}}><ShoppingCart/><span><b>{orderCart.length} article{orderCart.length>1?'s':''}</b><small>Voir le panier</small></span></button><button type="button" className="add-to-order" disabled={!selectedPreset||orderPhotoBusy} onClick={(e) => { const form=e.currentTarget.form;if(!form?.checkValidity()){setOrderConfigOpen(true);requestAnimationFrame(()=>form?.reportValidity());return;} const version=activeDynamicProduct?.folding?.versions.at(-1); if(activeDynamicProduct?.folding&&!version){setToastText('Publiez une première version de ce profil dans le catalogue.');setToast(true);return;} let foldingSnapshot:(typeof orderCart)[number]['foldingSnapshot']; if(version&&activeDynamicProduct){try{foldingSnapshot={productId:activeDynamicProduct.id,versionId:version.id,versionNumber:version.number,geometry:configuredGeometry(version.geometry,dynamicValues),values:structuredClone(dynamicValues)}}catch(error){setOrderConfigOpen(true);setToastText((error as Error).message);setToast(true);return;}} const isProfile = orderCategory === 'Pliage' && (selectedPreset === 'Capage porte de garage' || selectedPreset === 'Beam'); const soffit = orderCategory === 'Matériaux' && ['J soffite', 'Boîte de soffite'].includes(selectedPreset); const dynamicDetail = activeDynamicProduct ? activeDynamicProduct.fields.filter(field => field.filledBy === 'terrain').map(field => `${field.name}: ${field.type === 'Oui/Non' ? (dynamicValues[field.id] ? 'Oui' : 'Non') : (dynamicValues[field.id] ?? field.defaultValue)}`).join(' · ') : ''; const detail = dynamicDetail ? `${dynamicDetail} · Couleur: ${itemColor === 'Autre' ? customColor : itemColor}${activeDynamicProduct && activeDynamicProduct.units.length > 1 ? ` · Unité: ${itemUnit}` : ''}` : selectedPreset === 'Colonne' ? `Quantité ${columnQty} · Noir/blanc à confirmer` : selectedPreset === 'Beam' ? `${length1} × ${lengthQty1}${beamDoubleFold ? ' · A–E plié double' : ''}` : isProfile ? `${length1} × ${lengthQty1}${length2 ? ` + ${length2} × ${lengthQty2}` : ''}` : soffit ? `Quantité ${orderQuantity} · ${itemColor === 'Autre' ? customColor : itemColor} · ${itemUnit}` : `Quantité ${orderQuantity}`; const enteredOptions = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-order-option]')).map(field => { const value = field instanceof HTMLInputElement && field.type === 'checkbox' ? (field.checked ? 'Oui' : 'Non') : field.value.trim(); return value ? `${field.dataset.orderOption}: ${value}` : ''; }).filter(Boolean); const savedDetail = [...detail.split(' · ').filter(part=>!part.startsWith('Unité:')&&part!==itemUnit), ...enteredOptions, ...(orderPriority ? [`Priorité: ${orderPriority}`] : []), `Unité: ${itemUnit}`].filter(Boolean).join(' · '); setOrderCart((items) => [...items, { id: crypto.randomUUID(), quantity: activeDynamicProduct?Number(dynamicValues[activeDynamicProduct.fields.find(f=>f.type==='Quantité')?.id||'']??activeDynamicProduct.fields.find(f=>f.type==='Quantité')?.defaultValue??orderQuantity):selectedPreset==='Colonne'?columnQty:isProfile?lengthQty1+(length2?lengthQty2:0):orderQuantity, category: orderCategory, item: selectedPreset, detail: savedDetail, foldingSnapshot, photos: [...orderPhotos] }]); setOrderPhotos([]); setOrderPriority(''); setDynamicValues({}); setSelectedPreset(''); setToastText(`${selectedPreset} ajouté à la commande`); setToast(true); window.setTimeout(() => setToast(false), 1800); }}>
<Plus/><span>Ajouter à<br/>la commande</span></button></div></form></section>}

        {fieldView !== 'work' && <FieldWorkspace jobs={timeData?.jobs||[]} view={fieldView} session={activeSession!} role={role as 'Chef'|'Employé'} navigate={navigateField} logoSrc={logoSrc} onNewOrder={job=>{if(orderCart.length&&orderJob!==job.id){if(!window.confirm('Changer de chantier videra la commande actuelle. Continuer?'))return;setOrderCart([]);setOrderPhotos([]);}setOrderJob(job.id);navigateField('orders');setModal(true)}} punch={{punched,selectedJob,activeJob,startedAt:punchStartedAt,onToggle:()=>void togglePunch(),onChangeJob:setSelectedJob}}/>}
        <div className="welcome">
<div>
<p>FORGE · LES REVÊTEMENTS MIR · VUE {role.toUpperCase()}</p>
<h1>{displayedRole === 'Adjointe' ? 'Bon matin, Ester.' : displayedRole === 'Chef' ? 'Bon matin, Fred.' : displayedRole === 'Employé' ? 'Bon matin, Alex.' : 'Bon matin, Simon.'}</h1>
<span>{displayedRole === 'Boss' || displayedRole === 'Adjointe' ? 'Vue complète de la compagnie.' : 'Seulement les projets auxquels tu es assigné.'}</span>
</div>
<div className="weather">
<span>☀</span>
<div>
<b>22°C</b>
<small>Grand-Turk · Dégagé</small>
</div>
</div>
</div>
        {(displayedRole === 'Employé' || displayedRole === 'Chef') && <section className="punch-module" id="punch">
          <PunchPreview activeJob={activeJob} todayLabel={todayPunchLabel} todaySegments={todaySegments.map(s=>({id:s.id,job:timeData?.jobs.find(j=>j.id===s.job_id)?.number||s.job_id,start:s.start_time,end:s.end_time}))} onSwitch={()=>void togglePunch('switch')} role={displayedRole} punched={punched} selectedJob={selectedJob} startedAt={punchStartedAt} onJob={setSelectedJob} onOpenJob={()=>navigateField('project')} onHours={()=>navigateField('hours')} onToggle={()=>void togglePunch()} logoSrc={logoSrc} userName={activeSession!.userName} companyId={activeSession!.companyId} email={activeSession!.email} onSettings={()=>navigateField('settings')}/>
          {false && switchingJob && <div className="job-switch-card">
<button className="switch-back" onClick={() => { setSelectedJob(activeJob); setJobSwitchPending(false); }} aria-label="Annuler le changement de job">
<ArrowLeft />
</button>
<div>
<span>CHANGEMENT DE CHANTIER</span>
<b>{activeJob} → {selectedJob}</b>
<small>Le temps de {activeJob} sera fermé seulement quand tu commenceras la prochaine job.</small>
</div>
<button className="switch-start" onClick={() => { void togglePunch('switch'); setJobSwitchPending(false); setToastText(`Punch démarré sur ${selectedJob}`); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Play /> PUNCH IN</button>
</div>}
          <div className={`punch-panel ${punched ? 'active' : ''}`}>
<div className="punch-status">
<span>
<i /> {punched ? 'PUNCH ACTIF' : 'PRÊT À COMMENCER'}</span>
<label className="job-picker">
<small>{punched ? 'CHANGER DE CHANTIER' : 'CHOISIR LE JOB'}</small>
<div className="job-select-row">
<select value={selectedJob} onChange={(e) => { const value = e.target.value; if (value === 'CREATE_TEMP') {
            const id = `TEMP-${String(temporaryJobs.length + 10).padStart(3, '0')}`;
            setTemporaryJobs((jobs) => [...jobs, id]);
            setTemporaryJobNames((names) => ({ ...names, [id]: 'Nouveau chantier' }));
            setSelectedJob(id);
            setToastText(`${id} créé et partagé immédiatement avec l’équipe`);
            setToast(true);
            window.setTimeout(() => setToast(false), 3200);
        }
        else {
            setSelectedJob(value);
        } }}>
<option value="JOB-214">JOB-214 — Breton · 86 m</option>
<option value="JOB-315">JOB-315 — Leduc</option>
<option value="JOB-418">JOB-418 — Bélanger</option>{temporaryJobs.map((job) => <option key={job} value={job}>{job} — {temporaryJobNames[job] || 'Chantier temporaire'}{job !== 'TEMP-009' ? ' · Non approuvé' : ''}</option>)}{displayedRole === 'Chef' && <option value="CREATE_TEMP">＋ Créer un chantier temporaire</option>}</select>{displayedRole === 'Chef' && selectedJob.startsWith('TEMP-') && <button type="button" className="rename-temp-job" onClick={(e) => { e.preventDefault(); const name = window.prompt('Nouveau nom du chantier temporaire', temporaryJobNames[selectedJob] || 'Chantier temporaire'); if (name?.trim()) {
            setTemporaryJobNames((names) => ({ ...names, [selectedJob]: name.trim() }));
            setToastText(`${selectedJob} renommé ${name.trim()}`);
            setToast(true);
            window.setTimeout(() => setToast(false), 3200);
        } }}>Renommer</button>}</div>
</label>
<div className="punch-job-heading">
<div>
<h2>{punched ? '02:18:42' : selectedJob}</h2>
<p>{punched ? `Temps actif sur ${selectedJob} · tu peux changer de chantier` : selectedJob.startsWith('TEMP-') ? `${temporaryJobNames[selectedJob] || 'Chantier temporaire'} · créé par le chef · visible immédiatement` : 'Chantier assigné par l’administration'}</p>
</div>
<div>
<button onClick={() => { setToastText('Photo jointe ouverte'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Camera /> Photo jointe</button>
<button className="job-folder-button" onClick={() => setJobDossierOpen(true)}>
<HardHat /> Dossier de job</button>
</div>
</div>
<button className="address-link" onClick={() => setMapChoiceOpen(true)}>
<MapPin />
<span>{selectedJob === 'JOB-315' ? '480, boulevard Leduc, Québec' : selectedJob === 'JOB-418' ? '72, rue Bélanger, Lévis' : selectedJob.startsWith('TEMP-') ? 'Adresse temporaire à confirmer' : '1280, rue Industrielle, Québec'}</span>
<Navigation />
</button>
<div className="today-jobs">
<small>AUJOURD’HUI</small>
<span>JOB-214 · 5 h 12</span>
<span>JOB-315 · 2 h 18</span>
</div>
</div>
<button onClick={()=>void togglePunch()}>{punched ? <Square /> : <Play />}<span>{punched ? 'PUNCH OUT' : 'PUNCH IN'}</span>
<small>{punched ? `Arrêter sur ${selectedJob}` : `Commencer sur ${selectedJob}`}</small>
</button>
<div className="daily-time">
<span>TOTAL AUJOURD’HUI</span>
<b>{punched ? '7 h 30' : '7 h 30'}</b>
<small>Temps cumulé sur 2 chantiers aujourd’hui</small>
</div>
</div>
          <div className="punch-detail-grid">
<article className="panel hour-summary">
<div className="panel-head">
<div>
<h2>Mes heures</h2>
<p>Semaine du 31 août au 6 septembre</p>
</div>
<button>Voir l’historique <ChevronRight />
</button>
</div>
<div className="hour-totals field-hours">
<div>
<span>AUJOURD’HUI</span>
<b>9 h 15</b>
</div>
<div className="payable">
<span>TOTAL SEMAINE</span>
<b>35 h 30</b>
</div>
</div>
<div className="week-strip">{weekHours.map((d) => <div key={d.day} className={d.status === 'Confirmé' ? 'done' : ''}>
<span>{d.day} {d.date}</span>
<b>{d.hours ? `${d.hours.toFixed(2)} h` : '—'}</b>
<small>{d.job}</small>
<i>{d.status}</i>
</div>)}</div>
<button className="confirm-hours">
<Check /> Confirmer mes heures</button>
</article>
          {displayedRole === 'Chef' && <article className="panel crew-punch">
<div className="panel-head">
<div>
<h2>Mon équipe sur JOB-214</h2>
<p>Présence en direct</p>
</div>
<button>
<Plus /> Chantier temporaire</button>
</div>{[{ n: 'Fred G.', s: 'Punch actif', t: '2 h 18', ok: true }, { n: 'Alex P.', s: 'Punch actif', t: '2 h 07', ok: true }, { n: 'Kevin R.', s: 'Non punché', t: '—', ok: false }, { n: 'Louis M.', s: 'À 2,4 km · accepté', t: '1 h 52', ok: false }].map((m) => <div className="crew-row" key={m.n}>
<div className={`crew-dot ${m.ok ? 'on' : 'warn'}`}/>
<div>
<b>{m.n}</b>
<span>{m.s}</span>
</div>
<strong>{m.t}</strong>
<button>
<ChevronRight />
</button>
</div>)}</article>}
          </div>
        </section>}
        {displayedRole === 'Chef' && <section className="chef-field-flow">
<article className="panel employee-order-create" data-legacy-orders="true">
<div className="order-create-icon">
<ShoppingCart />
</div>
<span>COMMANDE POUR LE CHANTIER</span>
<h2>Créer une commande</h2>
<p>Ajoute plusieurs articles, quantités et photos. La demande sera ajoutée aux commandes en attente du chef.</p>
<button onClick={() => setModal(true)}>
<Plus /> Nouvelle commande</button>
</article>
<article className="panel pending-chef-orders">
<div className="panel-head">
<div>
<h2>Commandes en attente</h2>
<p>Demandes envoyées par les employés de ton équipe</p>
</div>
<span>{pendingOrders}</span>
</div>
<div className="pending-order-line">
<div className="request-icon">
<Box />
</div>
<div>
<b>Alex P. · JOB-214</b>
<span>Lames Olfa, tape rouge, clous 3¼ · photo jointe</span>
<small>Reçue il y a 4 min</small>
</div>
<button onClick={() => { setPendingOrders((n) => Math.max(0, n - 1)); setToastText('Commande approuvée et envoyée à l’administration'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Check /> Approuver</button>
</div>
</article>
<article className="panel field-notifications">
<div className="panel-head">
<div>
<h2>Notifications de l’équipe</h2>
<p>Activité récente des employés</p>
</div>
<Bell />
</div>{[{ t: 'Commande reçue', d: 'Alex · JOB-214 · 3 articles', i: 'CMD' }, { t: 'Achat confirmé', d: 'Kevin · 184,32 $ · reçu joint', i: 'ACH' }, { t: 'Accident déclaré', d: 'Alex · JOB-214 · à confirmer', i: 'SST' }].map((n) => <div className="field-notification" key={n.i}>
<span>{n.i}</span>
<div>
<b>{n.t}</b>
<small>{n.d}</small>
</div>
<ChevronRight />
</div>)}</article>
</section>}
        {(displayedRole === 'Boss' || displayedRole === 'Adjointe') && <section className="admin-hours" id="punch">
<div className="hours-head">
<div>
<span>VALIDATION HEBDOMADAIRE</span>
<h2>Punch et heures de l’équipe</h2>
<p>Semaine du 24 au 30 août · fermeture dimanche</p>
</div>
<button>
<CalendarDays /> Changer de semaine</button>
</div>
<div className="approval-metrics">
<article>
<span>HEURES PAYABLES</span>
<b>684 h 30</b>
<small>18 employés</small>
</article>
<article>
<span>CONFIRMÉS</span>
<b>12 / 18</b>
<small className="good">67% complété</small>
</article>
<article>
<span>CORRECTIONS</span>
<b>2</b>
<small className="bad">À traiter</small>
</article>
<article>
<span>ANOMALIES GPS</span>
<b>3</b>
<small>Plus de 2 km</small>
</article>
</div>
<div className="panel payroll">
<div className="panel-head">
<div>
<h2>Validation des employés</h2>
<p>Brut, dîner automatique et total payable</p>
</div>
<div className="approval-actions">
<button>Exporter</button>
<button className="approve-all">
<Check /> {displayedRole === 'Boss' ? 'Approbation finale' : 'Soumettre au Boss'}</button>
</div>
</div>
<div className="payroll-table">
<div className="payroll-header">
<span>EMPLOYÉ</span>
<span>HEURES BRUTES</span>
<span>DÎNER</span>
<span>PAYABLES</span>
<span>STATUT</span>
<span />
</div>{payrollRows.map((r) => <div className="payroll-row" key={r.name}>
<div>
<b>{r.name}</b>
<small>{r.role}</small>
</div>
<span>{r.gross}</span>
<span>{r.lunch}</span>
<strong>{r.payable}</strong>
<em className={r.state === 'Confirmé' ? 'confirmed' : r.state === 'Correction' ? 'correction' : ''}>{r.state}</em>
<button>
<ChevronRight />
</button>
</div>)}</div>
</div>
<div className="hours-alert">
<AlertTriangle />
<div>
<b>3 punchs demandent ton attention</b>
<span>Deux positions GPS éloignées et un punch sans sortie. Les punchs ont été acceptés et conservés.</span>
</div>
<button>Examiner</button>
</div>
</section>}
        {(displayedRole === 'Boss' || displayedRole === 'Adjointe') && <section className="panel admin-plan-sync">
<div>
<span>JOB ET PLANS PARTAGÉS</span>
<h2>JOB-214 · Breton</h2>
<p>Assigné à Fred, Alex et Kevin. Le plan déposé apparaît automatiquement dans leur Punch ou leur dossier de job.</p>
</div>
<div className="admin-plan-file">
<FileText />
<span>
<b>{planName}</b>
<small>Visible par toute l’équipe assignée</small>
</span>
<label>
<Paperclip /> Remplacer le plan<input type="file" accept=".pdf,image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) {
        setPlanName(file.name);
        setToastText('Plan partagé avec toute l’équipe assignée');
        setToast(true);
        window.setTimeout(() => setToast(false), 3200);
    } }}/>
</label>
</div>
</section>}
        {displayedRole === 'Adjointe' && <>
<AdjointeDesk companyId={session.companyId}/>
<SimulationPanel />
</>} 
        {(displayedRole === 'Boss' || displayedRole === 'Adjointe') && <CommandCenter role={displayedRole} companyId={session.companyId}/>}
        {displayedRole === 'Adjointe' && <section className="panel punch-correction">
<div>
<span>CORRECTION DE PUNCH EN TOUT TEMPS</span>
<h2>Changer un employé de job</h2>
<p>Corrige la job d’un punch actif, fermé, d’hier ou d’une période antérieure. Chaque modification reste inscrite au journal.</p>
</div>
<div className="correction-fields">
<label>Employé<select>
<option>Alex P.</option>
<option>Kevin R.</option>
<option>Louis M.</option>
</select>
</label>
<label>Date<input type="date" defaultValue="2026-09-01"/>
</label>
<label>Job corrigée<select>
<option>JOB-315 — Leduc</option>
<option>JOB-214 — Breton</option>
<option>TEMP-009</option>
</select>
</label>
<button onClick={() => { setToastText('Punch corrigé et inscrit au journal'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Check /> Enregistrer</button>
</div>
</section>}
        {displayedRole === 'Boss' && <section className="boss-reporting">
<div className="reporting-head">
<div>
<span>REGISTRE PERMANENT · CCQ</span>
<h2>Heures, coûts et rendement par chantier</h2>
<p>Journal mensuel et annuel conservé pour chaque employé et chaque job.</p>
</div>
<button onClick={() => { setToastText('Dossier CCQ préparé pour téléchargement'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Download /> Exporter le dossier CCQ</button>
</div>
<div className="report-filters">
<select>
<option>Tous les entrepreneurs</option>
<option>Construction Breton</option>
<option>Construction Leduc</option>
</select>
<select>
<option>Tous les chefs</option>
<option>Fred G.</option>
<option>Marco T.</option>
</select>
<select>
<option>Septembre</option>
<option>Août</option>
<option>Juillet</option>
</select>
<select>
<option>2026</option>
<option>2025</option>
</select>
<select>
<option>Jobs actives et terminées</option>
<option>Actives</option>
<option>Terminées</option>
</select>
</div>
<div className="ccq-log">
<div>
<span>JOB-214 · BRETON</span>
<b>684 h 30</b>
<small>18 employés · Active · Chef Fred</small>
</div>
<div>
<span>JOB-315 · LEDUC</span>
<b>412 h 15</b>
<small>9 employés · Active · Chef Marco</small>
</div>
<div>
<span>JOB-193 · LAURENTIEN</span>
<b>1 104 h 45</b>
<small>Terminée · Dossier archivé</small>
</div>
</div>
<div className="profit-panel">
<div className="profit-inputs">
<label>Prix de soumission<input type="number" value={bidPrice} onChange={(e) => setBidPrice(Number(e.target.value))}/>
</label>
<label>Matériaux<input type="number" value={materialsCost} onChange={(e) => setMaterialsCost(Number(e.target.value))}/>
</label>
<label>Dépenses fixes<input type="number" value={fixedCost} onChange={(e) => setFixedCost(Number(e.target.value))}/>
</label>
<label>Location d’outils<input type="number" value={rentalCost} onChange={(e) => setRentalCost(Number(e.target.value))}/>
</label>
<label>Main-d’œuvre<input type="number" value={laborCost} onChange={(e) => setLaborCost(Number(e.target.value))}/>
</label>
<label>Extras<input type="number" value={extrasCost} onChange={(e) => setExtrasCost(Number(e.target.value))}/>
</label>
</div>
<div className="profit-result">
<span>COÛT TOTAL</span>
<b>{totalCost.toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $</b>
<span>PROFIT</span>
<strong>{profit.toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $</strong>
<div>
<small>RENDEMENT</small>
<em>{performance.toFixed(2)} %</em>
</div>
</div>
</div>
</section>}
        {displayedRole === 'Chef' && <section className="chef-order-board" id="chef-orders">
<div className="chef-order-tabs">
<button className="active">En attente <span>{pendingOrders}</span>
</button>
<button>Chez fournisseurs <span>2</span>
</button>
<button>Pliage <span>2</span>
</button>
</div>
<article className="panel readonly-bag">
<div className="panel-head">
<div>
<h2>Bag de Fred · Lecture seulement</h2>
<p>Articles préparés pour ta prochaine livraison</p>
</div>
<span className="readonly-pill">CONSULTATION</span>
</div>
<div className="bag-items">{basketItems.filter((item) => item.chef === 'Fred G.').map((item) => <div key={item.id}>
<span className={item.loaded ? 'bag-loaded' : ''}>{item.loaded ? <Check /> : <Box />}</span>
<div>
<b>{item.name}</b>
<small>{item.job} · {item.qty}</small>
</div>
<em>{item.loaded ? 'Embarqué' : 'Dans le bag'}</em>
</div>)}</div>
<small className="bag-note">Seuls le Boss et l’Adjointe peuvent ajouter ou retirer des articles.</small>
</article>
<div className="order-tracking-grid">
<article className="panel supplier-tracking">
<div className="panel-head">
<div>
<h2>Commandes chez les fournisseurs</h2>
<p>Délais et livraison au chantier</p>
</div>
</div>{[{ n: 'Breton', d: 'Livraison demain · avant 14 h', s: 'Commandée', j: 'JOB-214' }, { n: 'Métal Laurentien', d: 'Délai 2 jours · chantier', s: 'En préparation', j: 'JOB-315' }].map((o) => <div className="tracking-row" key={o.n}>
<Factory />
<div>
<b>{o.n}</b>
<small>{o.j} · {o.d}</small>
</div>
<em>{o.s}</em>
</div>)}</article>
<article className="panel folding-tracking">
<div className="panel-head">
<div>
<h2>Commandes de pliage</h2>
<p>Atelier et approbation</p>
</div>
</div>{[{ n: '6 solins en L · 4 × 6 po', d: 'Approuvé · prêt demain', s: 'En pliage' }, { n: '12 moulures de départ', d: 'À approuver par le Boss', s: 'En attente' }].map((o) => <div className="tracking-row" key={o.n}>
<Zap />
<div>
<b>{o.n}</b>
<small>{o.d}</small>
</div>
<em>{o.s}</em>
</div>)}</article>
</div>
</section>}
        {displayedRole === 'Adjointe' && <section className="supplier-sorter">
<div className="sorter-head">
<div>
<span>TRI D’UNE COMMANDE MULTI-MATÉRIAUX</span>
<h2>Distribuer les bons articles aux bonnes personnes</h2>
<p>Commande Alex · JOB-214 · 8 articles reçus avec 2 photos</p>
</div>
<button onClick={() => { setToastText('Tous les courriels de commande ont été préparés'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Mail /> Préparer tous les courriels</button>
</div>
<div className="sort-groups">{[{ c: 'FOURNISSEUR · BRETON', m: 'commandes@breton.ca', i: ['Clous revêtement · 4 boîtes', 'Broche Maibec · 2 boîtes', 'Tape 3M · 6 rouleaux'] }, { c: 'MATÉRIEL SHOP · ATELIER MIR', m: 'Préparation interne', i: ['Pliage solin en L · 6 unités', 'Papier joint fibro · 3 rouleaux'] }, { c: 'OUTILS · QUINCAILLERIE', m: 'commande@quincaillerie.ca', i: ['Lames Skill 7¼ · 2', 'Lames Olfa 1″ · 3 paquets'] }, { c: 'PLIAGE · ATELIER', m: 'atelier@mir.ca', i: ['Moulure départ noire · 12 unités'] }].map((g) => <article className="sort-group" key={g.c}>
<div className="sort-group-head">
<div>
<b>{g.c}</b>
<small>{g.m}</small>
</div>
<button onClick={() => { setToastText(`Courriel préparé · ${g.c}`); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Mail /> Envoyer</button>
</div>
<div className="sort-items">{g.i.map((item) => <label key={item}>
<input type="checkbox" defaultChecked/>
<span>{item}</span>
<em>Déplacer</em>
</label>)}</div>
</article>)}</div>
<div className="sorter-footer">
<Paperclip />
<span>
<b>2 photos reçues de l’employé</b>
<small>Elles seront jointes seulement aux courriels concernés.</small>
</span>
<button onClick={() => { setToastText('Commande divisée et courriels envoyés'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Send /> Envoyer les commandes séparées</button>
</div>
</section>}
        {(displayedRole === 'Boss' || displayedRole === 'Adjointe') && <section className="metrics" aria-label="Indicateurs du jour">
          <article>
<div className="metric-icon amber">
<PackageCheck />
</div>
<div>
<span>COMMANDES ACTIVES</span>
<b>12</b>
<small>
<i>+3</i> depuis hier</small>
</div>
<svg viewBox="0 0 130 48">
<path d="M2 40 C20 38,22 27,38 30 S58 18,72 23 S91 8,108 14 S120 6,128 3"/>
</svg>
</article>
          <article>
<div className="metric-icon red">
<Zap />
</div>
<div>
<span>DEMANDES À TRAITER</span>
<b>3</b>
<small>
<strong>1 urgente</strong>
</small>
</div>
<div className="pulse-rings">
<i />
<i />
<i />
</div>
</article>
          <article>
<div className="metric-icon green">
<ShieldCheck />
</div>
<div>
<span>PRODUCTION DU JOUR</span>
<b>84%</b>
<small>
<i>+6%</i> vs objectif</small>
</div>
<div className="donut">
<span>84</span>
</div>
</article>
          <article>
<div className="metric-icon blue">
<Users />
</div>
<div>
<span>ÉQUIPES ACTIVES</span>
<b>4/5</b>
<small>18 employés présents</small>
</div>
<div className="mini-faces">
<i>MT</i>
<i>SB</i>
<i>AP</i>
<i>+15</i>
</div>
</article>
        </section>}
        {(displayedRole === 'Adjointe' || displayedRole === 'Boss') && <section className="order-control">
<article className="panel incoming-order">
<div className="panel-head">
<div>
<h2>Nouvelle commande reçue</h2>
<p>Fred G. · JOB-214 Breton · il y a 8 min</p>
</div>
<span className="new-order-pill">NOUVELLE</span>
</div>
<div className="incoming-body">
<div className="incoming-summary">
<div className="request-icon">
<Box />
</div>
<div>
<span>3 ARTICLES · MATÉRIAUX</span>
<b>Lames Olfa, tape rouge et clous 3¼</b>
<small>Photos du chantier jointes · Priorité normale</small>
</div>
</div>
<div className="decision-actions">{displayedRole === 'Adjointe' && <button className="ask-approval" onClick={() => { setToastText('Approbation demandée au Boss'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<ClipboardCheck /> Faire approuver par le Boss</button>}<button className="add-basket" onClick={() => { setToastText('Commande ajoutée au panier de Fred'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<ShoppingCart /> Mettre dans le panier</button>
<button className="order-now" onClick={() => { setToastText('Commande passée immédiatement'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Zap /> Commander maintenant</button>
</div>
</div>
</article>{displayedRole === 'Boss' && <article className="panel chef-baskets">
<div className="panel-head">
<div>
<h2>Paniers des chefs d’équipe</h2>
<p>Prépare ta tournée et confirme ce qui embarque dans le camion</p>
</div>
<span className="basket-count">{basketItems.filter(i => !i.loaded).length} À CHARGER</span>
</div>{['Fred G.', 'Marco T.'].map((chef) => { const items = basketItems.filter(i => i.chef === chef); if (!items.length)
        return null; return <div className="chef-basket" key={chef}>
<div className="basket-head">
<div>
<span>{chef.split(' ').map(v => v[0]).join('')}</span>
<div>
<b>Panier · {chef}</b>
<small>{items[0].job} · {items.length} articles</small>
</div>
</div>
<button onClick={() => setBasketItems(current => current.filter(i => i.chef !== chef))}>
<Trash2 /> Supprimer le panier</button>
</div>
<div className="basket-lines">{items.map((item) => <label key={item.id} className={item.loaded ? 'loaded' : ''}>
<input type="checkbox" checked={item.loaded} onChange={() => setBasketItems(current => current.map(i => i.id === item.id ? { ...i, loaded: !i.loaded } : i))}/>
<span>
<b>{item.name}</b>
<small>{item.qty}</small>
</span>
<em>{item.loaded ? 'EMBARQUÉ · STOCK RETIRÉ' : 'À EMBARQUER'}</em>
</label>)}</div>
<button className="confirm-load" onClick={() => { setToastText(`Chargement de ${chef} confirmé`); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Check /> Confirmer les articles embarqués</button>
</div>; })}</article>}</section>}
        <div className={`main-grid ${displayedRole === 'Employé' ? 'employee-grid' : ''}`}>{displayedRole === 'Employé' ? <section className="panel employee-order-create" data-legacy-orders="true">
<div className="order-create-icon">
<PackageCheck />
</div>
<span>COMMANDE POUR JOB-214</span>
<h2>Besoin de matériel?</h2>
<p>Crée une commande avec plusieurs articles, quantités, notes et photos du chantier.</p>
<button onClick={() => setModal(true)}>
<Plus /> Créer une commande</button>
<small>Tu verras le statut de ta demande dans les notifications.</small>
</section> : <section className="panel orders-panel" data-legacy-orders="true">
          <div className="panel-head">
<div>
<h2>Commandes en cours</h2>
<p>Suivi en temps réel de la production</p>
</div>
<button>Voir l’historique <ChevronRight />
</button>
</div>
          <div className="filters">{['Tous', 'À préparer', 'En production', 'Prêt', 'Livraison'].map((f) => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}{f === 'Tous' && <span>12</span>}</button>)}</div>
          <div className="order-list">{visibleOrders.map((o) => <article className="order-row" key={o.id}>
<div className="order-accent" style={{ background: o.color }}/>
<div className="order-main">
<div>
<span>{o.job} · {o.id}</span>
<b>{o.title}</b>
<small>{o.client} · Plan PDF disponible</small>
</div>
</div>
<div className="order-stage">
<span>
<i style={{ background: o.color }}/>{o.stage}</span>
<small>{o.lead}</small>
</div>
<div className="progress-wrap">
<div>
<span>Progression</span>
<b>{o.progress}%</b>
</div>
<div className="bar">
<i style={{ width: `${o.progress}%`, background: o.color }}/>
</div>
</div>
<div className="due">
<Clock3 />
<div>
<small>Échéance</small>
<b>{o.due}</b>
</div>
</div>
<button className="row-action" aria-label={`Ouvrir ${o.id}`}>
<ChevronRight />
</button>
</article>)}{visibleOrders.length === 0 && <div className="empty">Aucune commande assignée dans cette vue.</div>}</div>
        </section>}{displayedRole !== 'Employé' && <aside className="right-stack">
          <section className="panel requests" id="requests">
<div className="panel-head">
<div>
<h2>Demandes terrain</h2>
<p>À approuver ou assigner</p>
</div>
<button className="count">3</button>
</div>
<div className="request-list">{requests.map((r) => <article key={r.title} className={r.urgent ? 'urgent' : ''}>
<div className="request-icon">{r.type === 'PLIAGE' ? <Factory /> : <Box />}</div>
<div className="request-copy">
<div>
<span>{r.type}</span>{r.urgent && <strong>URGENT</strong>}</div>
<b>{r.title}</b>
<small>{r.meta}</small>
<time>{r.age}</time>
</div>
<button aria-label="Traiter">
<ChevronRight />
</button>
</article>)}</div>
<button className="full-button" onClick={() => setModal(true)}>
<Plus /> Faire une demande</button>
</section>
          <section className="panel team" id="team">
<div className="panel-head">
<div>
<h2>Qui est où</h2>
<p>Présence en direct</p>
</div>
<button>Voir tous</button>
</div>{team.map((p) => <div className="person" key={p.name}>
<div className={`avatar ${p.tone}`}>{p.initials}<i />
</div>
<div>
<b>{p.name}</b>
<span>{p.role}</span>
</div>
<small>{p.status}</small>
</div>)}</section>
        </aside>}</div>
        {isFieldRole && activeSession && <ExpenseWorkspace actor={activeSession}/>} 
        {displayedRole === 'Chef' && <section className="panel job-extra">
<div className="panel-head">
<div>
<h2>Extra au dossier de job</h2>
<p>Documente les travaux supplémentaires à côté des plans</p>
</div>
<button onClick={() => { setToastText('Extra ajouté au dossier JOB-214'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Plus /> Ajouter un extra</button>
</div>
<div className="extra-fields">
<label>Date<input type="date" defaultValue="2026-09-01"/>
</label>
<label>Temps requis<input placeholder="Ex. 3 h 30"/>
</label>
<label>Approuvé par<input placeholder="Nom du client ou responsable"/>
</label>
<label className="extra-photo">
<Camera /> Ajouter des photos<input type="file" accept="image/*" capture="environment" multiple/>
</label>
</div>
<textarea placeholder="Description des travaux extra, matériel utilisé et raison…"/>
<div className="extra-history">
<Check />
<span>
<b>Extra #EX-014 · Solin imprévu</b>
<small>1 sept. · 2 h 45 · Approuvé par J. Breton · 3 photos</small>
</span>
</div>
</section>}
        <section className="feature-grid">
          <article className="panel job-hub" id="job">
<div className="panel-head">
<div>
<h2>{displayedRole === 'Employé' ? 'Mon job assigné' : 'Dossier de job'}</h2>
<p>{displayedRole === 'Employé' ? 'Les informations utiles pour ton chantier' : 'Tout ce qui suit le chantier'}</p>
</div>{displayedRole !== 'Employé' && <button>
<Plus /> Nouveau job</button>}</div>
<div className="job-body">
<div className="job-badge">214</div>
<div>
<span>JOB-214 · BRETON</span>
<h3>Réfection enveloppe extérieure</h3>
<p>Plans, commandes, photos et historique réunis au même endroit.</p>
<div className="job-actions">
<button>
<FileText /> Plan architecture.pdf</button>{displayedRole !== 'Employé' && <button>
<Paperclip /> Déposer un plan</button>}</div>
</div>{displayedRole !== 'Employé' && <div className="hours">
<span>HEURES PROJET</span>
<b>213 / 410 h</b>
<div>
<i />
</div>
<small>197 h restantes · 52%</small>
</div>}</div>
</article>
          {(displayedRole === 'Boss' || displayedRole === 'Adjointe') && <article className="panel supplier-card" id="suppliers">
<div className="panel-head">
<div>
<h2>Commande fournisseur</h2>
<p>Brouillon regroupé automatiquement</p>
</div>
<span className="draft">BROUILLON</span>
</div>
<div className="supplier-body">
<div>
<span>FOURNISSEUR</span>
<b>Acier Breton Ltée</b>
<small>commandes@acierbreton.ca</small>
</div>
<div className="supplier-lines">
<span>Acier noir 24 ga × 2</span>
<span>Clous gun 3¼ × 5</span>
<span>Photos employé × 2 jointes</span>
</div>
<button onClick={() => { setToastText('Courriel fournisseur envoyé'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Mail /> Ester — Envoyer par email</button>
<small>Délai demandé : 2 jours · Livraison au chantier</small>
</div>
</article>}
          {activeSession&&<ForgeMessages key={activeSession.companyId+activeSession.email} session={activeSession} jobs={timeData?.jobs||[]} onJob={number=>{setSelectedJob(number);navigateField('project')}}/>}
        </section>
        {isFieldRole && <section className="field-resources compact-resources">
<button className="documentation-toggle" onClick={() => setDocumentationOpen(open => !open)}><FileText /><span><b>Documentation importante</b><small>Guides d’installation, GCR et Code du bâtiment</small></span><ChevronRight className={documentationOpen ? 'open' : ''} /></button>
{documentationOpen && <><div className="resources-title">
<span>OUTILS DE CHANTIER</span>
<h2>Guides d’installation & sécurité</h2>
<p>Accès rapide aux documents officiels. Toujours vérifier la version indiquée par le fabricant et les exigences du projet.</p>
</div>
<div className="guide-list">
<a href="https://www.jameshardie.ca/product-support/resource-center/installation?lang=fr-CA" target="_blank" rel="noreferrer">
<div className="guide-logo">JH</div>
<div>
<b>James Hardie</b>
<span>Guides d’installation officiels</span>
</div>
<ChevronRight />
</a>
<a href="https://maibec.com/fr/ressources/documentations/" target="_blank" rel="noreferrer">
<div className="guide-logo">CX</div>
<div>
<b>Maibec CanExel</b>
<span>Guides par profil et par région</span>
</div>
<ChevronRight />
</a>
<a href="https://maibec.com/fr/ressources/documentations/" target="_blank" rel="noreferrer">
<div className="guide-logo">MB</div>
<div>
<b>Maibec</b>
<span>Bois véritable, bardeaux et aluminium</span>
</div>
<ChevronRight />
</a>
<a href="https://allurausa.com/products/lap-siding/" target="_blank" rel="noreferrer">
<div className="guide-logo">AL</div>
<div>
<b>Allura</b>
<span>Manuel fibrociment et accessoires</span>
</div>
<ChevronRight />
</a>
<a href="https://lighttrim.com/wp-content/uploads/2023/06/CatalogueTechnique_20230605Web.pdf" target="_blank" rel="noreferrer">
<div className="guide-logo">LT</div>
<div>
<b>Light Trim</b>
<span>Catalogue technique et guide d’installation</span>
</div>
<ChevronRight />
</a>
<a href="https://www.garantiegcr.com/fr/entrepreneurs/fiches-techniques/" target="_blank" rel="noreferrer">
<div className="guide-logo">GCR</div>
<div>
<b>GCR — Revêtement</b>
<span>Fiches techniques et bonnes pratiques</span>
</div>
<ChevronRight />
</a>
<a href="https://cnrc.canada.ca/fr/certifications-evaluations-normes/codes-canada/publications-codes-canada" target="_blank" rel="noreferrer">
<div className="guide-logo">QC</div>
<div>
<b>Code du bâtiment</b>
<span>Publications officielles Canada et Québec</span>
</div>
<ChevronRight />
</a>
</div></>}
<div className="accident-card">
<div className="accident-intro">
<div>
<AlertTriangle />
</div>
<span>
<b>Déclarer un accident de travail</b>
<small>Avise immédiatement le Chef, Ester et Simon.</small>
</span>
<button onClick={() => setAccidentOpen(!accidentOpen)}>{accidentOpen ? 'Fermer' : 'Ouvrir le formulaire'}</button>
</div>{accidentOpen && <form onSubmit={(e) => { e.preventDefault(); setAccidentOpen(false); setAccidentSubmitted(true); setToastText('Accident déclaré au chef et à l’administration'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<div className="accident-grid">
<label>Job<select defaultValue={selectedJob}>
<option>JOB-214</option>
<option>JOB-315</option>
<option>JOB-418</option>
<option>TEMP-009</option>
</select>
</label>
<label>Date et heure<input type="datetime-local" required/>
</label>
</div>
<label>Personne blessée<input required placeholder="Nom complet"/>
</label>
<label>Description de l’accident<textarea required placeholder="Décris ce qui est arrivé, la blessure et l’endroit précis…"/>
</label>
<div className="mobile-photo-actions accident-photos">
<label>
<input type="file" accept="image/*" capture="environment"/>
<Camera />
<span>
<b>Prendre une photo</b>
<small>Ouvrir la caméra</small>
</span>
</label>
<label>
<input type="file" accept="image/*" multiple/>
<Paperclip />
<span>
<b>Choisir du téléphone</b>
<small>Une ou plusieurs photos</small>
</span>
</label>
</div>
<label>Mesures prises<input placeholder="Premiers soins, arrêt des travaux, transport…"/>
</label>
<div className="emergency-note">
<b>Urgence?</b>
<span>Appelle d’abord les services d’urgence. Ce formulaire ne remplace pas un appel au 911.</span>
</div>
<button type="submit">
<Send /> Envoyer la déclaration</button>
</form>}{displayedRole === 'Chef' && accidentSubmitted && <div className={`accident-approval ${accidentApproved ? 'approved' : ''}`}>
<ShieldCheck />
<div>
<b>{accidentApproved ? 'Accident confirmé par le chef' : 'Déclaration à confirmer'}</b>
<small>Alex P. · {selectedJob} · Photos et mesures reçues</small>
</div>{!accidentApproved && <button onClick={() => { setAccidentApproved(true); setToastText('Accident approuvé et confirmé'); setToast(true); window.setTimeout(() => setToast(false), 3200); }}>
<Check /> Approuver et confirmer</button>}</div>}</div>
</section>}
      </div>
    </section>
    {mapChoiceOpen && <div className="modal-wrap" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget)
        setMapChoiceOpen(false); }}>
<div className="modal map-choice">
<div className="modal-head">
<div>
<span>ITINÉRAIRE CHANTIER</span>
<h2>Ouvrir l’adresse avec…</h2>
<p>{selectedJob} · L’application choisie va démarrer la navigation.</p>
</div>
<button onClick={() => setMapChoiceOpen(false)} aria-label="Fermer">
<X />
</button>
</div>
<div className="map-apps">
<a href="https://waze.com/ul?q=1280%20rue%20Industrielle%20Quebec&navigate=yes" target="_blank" rel="noreferrer" onClick={() => setMapChoiceOpen(false)}>
<Navigation />
<span>
<b>Waze</b>
<small>Ouvrir dans l’application Waze</small>
</span>
<ChevronRight />
</a>
<a href="https://www.google.com/maps/search/?api=1&query=1280%20rue%20Industrielle%20Quebec" target="_blank" rel="noreferrer" onClick={() => setMapChoiceOpen(false)}>
<MapPin />
<span>
<b>Google Maps</b>
<small>Ouvrir l’itinéraire Google Maps</small>
</span>
<ChevronRight />
</a>
</div>
</div>
</div>}
    {jobDossierOpen && <div className="modal-wrap" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) {
        setJobDossierOpen(false);
        setExtraFormOpen(false);
    } }}>
<div className="modal job-dossier-modal">
<div className="modal-head">
<div>
<span>DOSSIER DE JOB · {selectedJob}</span>
<h2>Plans, photos et extras</h2>
<p>Tout le dossier du chantier sélectionné au même endroit.</p>
</div>
<button onClick={() => { setJobDossierOpen(false); setExtraFormOpen(false); }} aria-label="Fermer">
<X />
</button>
</div>
<div className="dossier-files">
<button>
<FileText />
<span>
<b>{planName}</b>
<small>Plan partagé par l’administration</small>
</span>
<ChevronRight />
</button>
<button>
<Camera />
<span>
<b>Photos du chantier</b>
<small>8 photos jointes à cette job</small>
</span>
<ChevronRight />
</button>{isFieldRole && <button className="open-extra-button" onClick={() => setExtraFormOpen(true)}>
<Plus />
<span>
<b>Ajouter un extra</b>
<small>Travaux supplémentaires, temps et photos</small>
</span>
<ChevronRight />
</button>}</div>{(!isFieldRole || extraFormOpen) && <div className="dossier-extra">
<div className="dossier-extra-title">
<div>
<span>EXTRA AU DOSSIER</span>
<h3>Ajouter des travaux supplémentaires</h3>
</div>{isFieldRole && <button className="collapse-extra" onClick={() => setExtraFormOpen(false)}>
<X />
</button>}</div>
<div className="extra-fields">
<label>Date<input type="date" defaultValue="2026-09-01"/>
</label>
<label>Temps requis<input placeholder="Ex. 3 h 30"/>
</label>
<label>Approuvé par<input placeholder="Nom du responsable"/>
</label>
<label className="extra-photo">
<Camera /> Ajouter des photos<input type="file" accept="image/*" capture="environment" multiple/>
</label>
</div>
<textarea placeholder="Description des travaux extra, matériel utilisé et raison…"/>
<button className="save-extra" onClick={() => { setToastText(`Extra ajouté au dossier ${selectedJob}`); setToast(true); setJobDossierOpen(false); setExtraFormOpen(false); window.setTimeout(() => setToast(false), 3200); }}>
<Check /> Enregistrer l’extra</button>
<div className="extra-history">
<Check />
<span>
<b>Extra #EX-014 · Solin imprévu</b>
<small>1 sept. · 2 h 45 · Approuvé par J. Breton · 3 photos</small>
</span>
</div>
</div>}</div>
</div>}
    {toast && <div className="toast">
<span>
<Check />
</span>
<div>
<b>{toastText}</b>
<small>{workTarget==='orders'?'Aperçu local · aucune transmission à l’administration.':'L’administration vient d’être avisée.'}</small>
</div>
</div>}
    {isFieldRole && <nav className="mobile-bottom-nav" aria-label="Navigation mobile">
<button className={fieldView==='home'?'active':''} onClick={()=>navigateField('home')}><LayoutDashboard/><span>Accueil</span></button>
<button className={fieldView==='projects'||fieldView.startsWith('project')?'active':''} onClick={()=>navigateField('projects')}><Folder/><span>Projets</span></button>
<button className="punch-nav" onClick={()=>navigateField('punch')}><Clock3/><span>Punch</span></button>
<button className={fieldView==='work'&&workTarget==='messages'?'active':''} onClick={()=>navigateField('messages')}><MessageSquare/><span>Messages</span>{activeSession&&<MessageUnreadBadge session={activeSession}/>}</button>
<button className={fieldView==='menu'?'active':''} onClick={()=>navigateField('menu')}><Menu/><span>Menu</span></button>
</nav>}
  </main>;
}
