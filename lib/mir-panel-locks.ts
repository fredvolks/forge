export type PanelWidthInput={
  id:string;
  width:number;
  lockedWidth?:number|null;
};

export type RedistributePanelWidthsInput={
  measuredTotal:number;
  totalLooseness:number;
  jointOverlap:number;
  panels:PanelWidthInput[];
  roundTo?:number;
};

export type RedistributePanelWidthsResult={
  measuredTotal:number;
  netTotal:number;
  physicalPanelSum:number;
  widths:Array<{id:string;width:number;locked:boolean}>;
  assembledTotal:number;
  closureError:number;
};

/**
 * MIR — redistribution d'une rangée de panneaux avec dimensions verrouillées.
 *
 * Convention identique au calepinage MIR:
 * assembledTotal = somme des largeurs hors-tout - un recouvrement par joint.
 * Le lousse TOTAL est déduit une seule fois du hors-tout chantier avant le calcul.
 *
 * Exemple:
 * 120 po chantier - 3/8 po de lousse = 119 5/8 po net.
 * Trois panneaux, overlap 1 po, panneau central verrouillé à 32 1/2 po:
 * largeur physique à fabriquer = 119 5/8 + 2 overlaps = 121 5/8 po.
 * Il reste 89 1/8 po pour les deux voisins => 44 9/16 po chacun.
 */
export function redistributePanelWidths(input:RedistributePanelWidthsInput):RedistributePanelWidthsResult{
  const {measuredTotal,totalLooseness,jointOverlap,panels}=input;
  const roundTo=input.roundTo??1/16;
  if(!Number.isFinite(measuredTotal)||measuredTotal<=0)throw new Error('Le hors-tout chantier doit être supérieur à zéro.');
  if(!Number.isFinite(totalLooseness)||totalLooseness<0||totalLooseness>=measuredTotal)throw new Error('Le lousse total est invalide.');
  if(!Number.isFinite(jointOverlap)||jointOverlap<0)throw new Error('Le recouvrement de joint est invalide.');
  if(!panels.length)throw new Error('Au moins un panneau est requis.');
  if(!Number.isFinite(roundTo)||roundTo<=0)throw new Error('Le pas d’arrondi est invalide.');

  const netTotal=measuredTotal-totalLooseness;
  const physicalPanelSum=netTotal+jointOverlap*Math.max(0,panels.length-1);
  const locked=panels.filter(panel=>panel.lockedWidth!==undefined&&panel.lockedWidth!==null);
  for(const panel of locked){
    if(!Number.isFinite(panel.lockedWidth)||Number(panel.lockedWidth)<=0)throw new Error(`La largeur verrouillée de ${panel.id} est invalide.`);
  }
  const lockedSum=locked.reduce((sum,panel)=>sum+Number(panel.lockedWidth),0);
  const unlocked=panels.filter(panel=>panel.lockedWidth===undefined||panel.lockedWidth===null);
  const remaining=physicalPanelSum-lockedSum;
  if(remaining<-1e-9)throw new Error('Les dimensions verrouillées dépassent le hors-tout disponible.');
  if(!unlocked.length&&Math.abs(remaining)>1e-9)throw new Error('Toutes les dimensions sont verrouillées, mais leur somme ne ferme pas le hors-tout.');
  if(unlocked.length&&remaining<=0)throw new Error('Il ne reste aucune largeur positive pour les panneaux non verrouillés.');

  const rounded=(value:number)=>Math.round(value/roundTo)*roundTo;
  const widths=new Map<string,number>();
  for(const panel of locked)widths.set(panel.id,Number(panel.lockedWidth));

  if(unlocked.length){
    const target=remaining/unlocked.length;
    let assigned=0;
    unlocked.forEach((panel,index)=>{
      const width=index===unlocked.length-1?remaining-assigned:rounded(target);
      if(width<=0)throw new Error(`Le panneau ${panel.id} devient nul ou négatif.`);
      widths.set(panel.id,width);
      assigned+=width;
    });
  }

  const ordered=panels.map(panel=>({
    id:panel.id,
    width:widths.get(panel.id)??panel.width,
    locked:panel.lockedWidth!==undefined&&panel.lockedWidth!==null
  }));
  const assembledTotal=ordered.reduce((sum,panel)=>sum+panel.width,0)-jointOverlap*Math.max(0,ordered.length-1);
  return{
    measuredTotal,
    netTotal,
    physicalPanelSum,
    widths:ordered,
    assembledTotal,
    closureError:assembledTotal-netTotal
  };
}
