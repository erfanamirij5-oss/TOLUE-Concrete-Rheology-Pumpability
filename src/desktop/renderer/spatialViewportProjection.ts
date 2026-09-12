import type { EngineeringPoint3D } from '../../engineering/core/pipeline';

export interface SpatialViewportCamera {
  readonly yawRad: number;
  readonly pitchRad: number;
  readonly zoom: number;
  readonly panXPx: number;
  readonly panYPx: number;
}

export interface SpatialViewportBounds {
  readonly center: Readonly<EngineeringPoint3D>;
  readonly spanM: number;
}

export interface ProjectedPoint2D {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}

export interface SpatialGridLine3D {
  readonly start: Readonly<EngineeringPoint3D>;
  readonly end: Readonly<EngineeringPoint3D>;
  readonly axis: 'x' | 'y';
}

export const DEFAULT_SPATIAL_CAMERA: Readonly<SpatialViewportCamera> = Object.freeze({
  yawRad: Math.PI / 4,
  pitchRad: -Math.PI / 6,
  zoom: 1,
  panXPx: 0,
  panYPx: 0,
});

export function spatialBounds(points: readonly Readonly<EngineeringPoint3D>[]): Readonly<SpatialViewportBounds> | null {
  if (!points.length) return null;
  const xs=points.map(point=>point.xM), ys=points.map(point=>point.yM), zs=points.map(point=>point.zM);
  if (![...xs,...ys,...zs].every(Number.isFinite)) throw new Error('SPATIAL-VIEWPORT-POINT-001');
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  return Object.freeze({
    center:Object.freeze({xM:(minX+maxX)/2,yM:(minY+maxY)/2,zM:(minZ+maxZ)/2}),
    spanM:Math.max(maxX-minX,maxY-minY,maxZ-minZ,1e-6),
  });
}

export function projectSpatialPoint(
  point: Readonly<EngineeringPoint3D>,
  bounds: Readonly<SpatialViewportBounds>,
  camera: Readonly<SpatialViewportCamera>,
  widthPx: number,
  heightPx: number,
): Readonly<ProjectedPoint2D> {
  if (![widthPx,heightPx,camera.yawRad,camera.pitchRad,camera.zoom,camera.panXPx,camera.panYPx].every(Number.isFinite) || widthPx<=0 || heightPx<=0 || camera.zoom<=0) throw new Error('SPATIAL-VIEWPORT-CAMERA-001');
  const x=point.xM-bounds.center.xM,y=point.yM-bounds.center.yM,z=point.zM-bounds.center.zM;
  const cy=Math.cos(camera.yawRad),sy=Math.sin(camera.yawRad);
  const x1=cy*x-sy*y,y1=sy*x+cy*y;
  const cp=Math.cos(camera.pitchRad),sp=Math.sin(camera.pitchRad);
  const y2=cp*y1-sp*z,z2=sp*y1+cp*z;
  const scale=(Math.min(widthPx,heightPx)*0.72/bounds.spanM)*camera.zoom;
  return Object.freeze({x:widthPx/2+x1*scale+camera.panXPx,y:heightPx/2-y2*scale+camera.panYPx,depth:z2});
}

export function projectedSegmentDepth(
  start: Readonly<EngineeringPoint3D>,
  end: Readonly<EngineeringPoint3D>,
  bounds: Readonly<SpatialViewportBounds>,
  camera: Readonly<SpatialViewportCamera>,
  widthPx: number,
  heightPx: number,
): number {
  const a=projectSpatialPoint(start,bounds,camera,widthPx,heightPx);
  const b=projectSpatialPoint(end,bounds,camera,widthPx,heightPx);
  return (a.depth+b.depth)/2;
}

export function spatialReferenceGrid(bounds:Readonly<SpatialViewportBounds>,divisions=10):readonly Readonly<SpatialGridLine3D>[] {
  if(!Number.isInteger(divisions)||divisions<2||divisions>40)throw new Error('SPATIAL-VIEWPORT-GRID-001');
  const half=bounds.spanM/2;
  const step=bounds.spanM/divisions;
  const zM=bounds.center.zM;
  const lines:SpatialGridLine3D[]=[];
  for(let i=0;i<=divisions;i+=1){
    const offset=-half+i*step;
    lines.push(Object.freeze({axis:'x',start:Object.freeze({xM:bounds.center.xM-half,yM:bounds.center.yM+offset,zM}),end:Object.freeze({xM:bounds.center.xM+half,yM:bounds.center.yM+offset,zM})}));
    lines.push(Object.freeze({axis:'y',start:Object.freeze({xM:bounds.center.xM+offset,yM:bounds.center.yM-half,zM}),end:Object.freeze({xM:bounds.center.xM+offset,yM:bounds.center.yM+half,zM})}));
  }
  return Object.freeze(lines);
}

export function orbitSpatialCamera(camera:Readonly<SpatialViewportCamera>,deltaYawRad:number,deltaPitchRad:number):Readonly<SpatialViewportCamera>{
  const pitch=Math.max(-Math.PI*0.48,Math.min(Math.PI*0.48,camera.pitchRad+deltaPitchRad));
  return Object.freeze({...camera,yawRad:camera.yawRad+deltaYawRad,pitchRad:pitch});
}

export function zoomSpatialCamera(camera:Readonly<SpatialViewportCamera>,factor:number):Readonly<SpatialViewportCamera>{
  if(!Number.isFinite(factor)||factor<=0)throw new Error('SPATIAL-VIEWPORT-ZOOM-001');
  return Object.freeze({...camera,zoom:Math.max(0.1,Math.min(20,camera.zoom*factor))});
}

export function panSpatialCamera(camera:Readonly<SpatialViewportCamera>,dxPx:number,dyPx:number):Readonly<SpatialViewportCamera>{
  if(!Number.isFinite(dxPx)||!Number.isFinite(dyPx))throw new Error('SPATIAL-VIEWPORT-PAN-001');
  return Object.freeze({...camera,panXPx:camera.panXPx+dxPx,panYPx:camera.panYPx+dyPx});
}
