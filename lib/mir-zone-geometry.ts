export type Axis='horizontal'|'vertical';

export type Point2D={x:number;y:number};

export function roofPitchAngleDegrees(rise:number,run=12):number{
  if(!Number.isFinite(rise)||rise<0)throw new Error('La montée de pente doit être positive.');
  if(!Number.isFinite(run)||run<=0)throw new Error('La base de pente doit être supérieure à zéro.');
  return Math.atan(rise/run)*180/Math.PI;
}

export function riseFromPitch(horizontalRun:number,rise:number,run=12):number{
  if(!Number.isFinite(horizontalRun)||horizontalRun<0)throw new Error('La portée horizontale est invalide.');
  if(!Number.isFinite(rise)||rise<0)throw new Error('La montée de pente est invalide.');
  if(!Number.isFinite(run)||run<=0)throw new Error('La base de pente est invalide.');
  return horizontalRun*(rise/run);
}

export type CenteredGableInput={
  width:number;
  eaveHeight:number;
  pitchRise:number;
  pitchRun?:number;
};

export type CenteredGableResult={
  width:number;
  halfRun:number;
  rise:number;
  eaveHeight:number;
  peakHeight:number;
  peakX:number;
  angleDegrees:number;
};

/**
 * Calcule un pignon centré quand la largeur et la pente X/12 sont connues.
 * Exemple MIR: 108 po, 6/12 => demi-portée 54 po, montée 27 po.
 */
export function centeredGableFromPitch(input:CenteredGableInput):CenteredGableResult{
  const pitchRun=input.pitchRun??12;
  if(!Number.isFinite(input.width)||input.width<=0)throw new Error('La largeur du pignon doit être supérieure à zéro.');
  if(!Number.isFinite(input.eaveHeight)||input.eaveHeight<0)throw new Error('La hauteur d’égout est invalide.');
  const halfRun=input.width/2;
  const rise=riseFromPitch(halfRun,input.pitchRise,pitchRun);
  return{
    width:input.width,
    halfRun,
    rise,
    eaveHeight:input.eaveHeight,
    peakHeight:input.eaveHeight+rise,
    peakX:halfRun,
    angleDegrees:roofPitchAngleDegrees(input.pitchRise,pitchRun)
  };
}

export type TwoPitchGableInput={
  width:number;
  eaveHeight:number;
  leftPitchRise:number;
  rightPitchRise:number;
  pitchRun?:number;
};

/**
 * Variante décentrée avec deux pentes et des égouts à la même hauteur.
 * La position de pointe est calculée automatiquement afin que les deux versants
 * rencontrent exactement la même pointe.
 */
export function twoPitchGable(input:TwoPitchGableInput){
  const run=input.pitchRun??12;
  if(!Number.isFinite(input.width)||input.width<=0)throw new Error('La largeur du pignon doit être supérieure à zéro.');
  if(input.leftPitchRise<=0||input.rightPitchRise<=0)throw new Error('Les deux pentes doivent être supérieures à zéro.');
  const leftSlope=input.leftPitchRise/run;
  const rightSlope=input.rightPitchRise/run;
  const leftRun=input.width*rightSlope/(leftSlope+rightSlope);
  const rightRun=input.width-leftRun;
  const rise=leftRun*leftSlope;
  return{
    width:input.width,
    leftRun,
    rightRun,
    peakX:leftRun,
    rise,
    peakHeight:input.eaveHeight+rise,
    leftAngleDegrees:roofPitchAngleDegrees(input.leftPitchRise,run),
    rightAngleDegrees:roofPitchAngleDegrees(input.rightPitchRise,run)
  };
}

export function orthogonalProjection(anchor:Point2D,point:Point2D,axis?:Axis|null):{axis:Axis;point:Point2D}{
  const chosen=axis??(Math.abs(point.x-anchor.x)>=Math.abs(point.y-anchor.y)?'horizontal':'vertical');
  return chosen==='horizontal'
    ?{axis:chosen,point:{x:point.x,y:anchor.y}}
    :{axis:chosen,point:{x:anchor.x,y:point.y}};
}

export function shouldSwitchOrthogonalAxis(anchor:Point2D,point:Point2D,axis:Axis,threshold=20):boolean{
  return axis==='horizontal'
    ?Math.abs(point.y-anchor.y)>=threshold
    :Math.abs(point.x-anchor.x)>=threshold;
}
