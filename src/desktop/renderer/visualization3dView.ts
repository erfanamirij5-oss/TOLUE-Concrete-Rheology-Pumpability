import { TOLUE_DESIGN_TOKENS, statusToneColor } from './designSystem';
import type { PipelineScenePresentation } from './pipelineScenePresentation';
import { DEFAULT_SPATIAL_CAMERA, orbitSpatialCamera, panSpatialCamera, projectedSegmentDepth, projectSpatialPoint, spatialBounds, spatialReferenceGrid, zoomSpatialCamera, type SpatialViewportCamera } from './spatialViewportProjection';
import type { Visualization3DPresentation } from './visualization3dPresentation';
import { hydraulicStatusUx, pressureFeasibilityUx, visualizationCompletenessUx, visualizationSegmentKindLabel } from './visualization3dUx';

export interface Visualization3DViewOptions {
  readonly selectedSegmentId?: string | null;
  readonly onSelectSegment?: (segmentId: string | null) => void;
  readonly compact?: boolean;
  readonly scene?: Readonly<PipelineScenePresentation>;
}

const cameraByRoot=new WeakMap<HTMLElement,Readonly<SpatialViewportCamera>>();
const SVG_NS='http://www.w3.org/2000/svg';

function pressure(value:number|null):string{return value===null?'—':`${(value/1_000_000).toFixed(3)} MPa`;}
function scalar(value:number|null,unit:string):string{if(value===null)return'—';if(unit==='m')return`${value.toFixed(4)} m`;if(unit==='m3/s')return`${value.toFixed(4)} m³/s`;return`${value} ${unit}`;}
function scenePointText(point:Readonly<{xM:number;yM:number;zM:number}>|null):string{return point?`(${point.xM}, ${point.yM}, ${point.zM}) m`:'geometry unavailable';}
function toolbarButton(text:string,onClick:()=>void):HTMLButtonElement{const b=document.createElement('button');b.type='button';b.textContent=text;b.style.font='inherit';b.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;b.style.padding='4px 7px';b.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`;b.style.background=TOLUE_DESIGN_TOKENS.color.surfaceElevated;b.style.color=TOLUE_DESIGN_TOKENS.color.text;b.style.cursor='pointer';b.addEventListener('click',onClick);return b;}

export function renderVisualization3DView(root:HTMLElement,data?:Readonly<Visualization3DPresentation>,options:Readonly<Visualization3DViewOptions>={}):void{
  const scene=options.scene;
  let camera:Readonly<SpatialViewportCamera>=cameraByRoot.get(root)??DEFAULT_SPATIAL_CAMERA;
  const persistCamera=(next:Readonly<SpatialViewportCamera>)=>{camera=next;cameraByRoot.set(root,next);};
  const panel=document.createElement('section');panel.setAttribute('aria-label','نمای مهندسی سیستم پمپاژ');Object.assign(panel.style,{height:'100%',minHeight:options.compact?'320px':'460px',display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',background:TOLUE_DESIGN_TOKENS.color.viewport,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,overflow:'hidden'});
  const toolbar=document.createElement('header');Object.assign(toolbar.style,{minHeight:'38px',display:'flex',alignItems:'center',gap:TOLUE_DESIGN_TOKENS.spacing.sm,padding:`0 ${TOLUE_DESIGN_TOKENS.spacing.md}`,borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:TOLUE_DESIGN_TOKENS.color.surface});
  const title=document.createElement('strong');title.textContent='Engineering Viewport';title.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  const scope=document.createElement('span');scope.textContent=scene?.segments.some(s=>s.startPoint&&s.endPoint)?'Spatial XYZ · persistent camera · engineering reference grid':'Scene fallback · spatial geometry unavailable';scope.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;scope.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;
  const spacer=document.createElement('span');spacer.style.flex='1';toolbar.append(title,scope,spacer);

  const canvas=document.createElement('div');canvas.tabIndex=0;canvas.setAttribute('role','application');canvas.setAttribute('aria-label','نمای سه‌بعدی قابل انتخاب مسیر پمپاژ');Object.assign(canvas.style,{position:'relative',minHeight:'0',overflow:'hidden',background:TOLUE_DESIGN_TOKENS.color.viewport,userSelect:'none',touchAction:'none'});
  const sceneSegments=scene?.segments??[];
  const spatialSegments=sceneSegments.filter(segment=>segment.startPoint&&segment.endPoint);
  const allPoints=spatialSegments.flatMap(segment=>[segment.startPoint!,segment.endPoint!]);
  const bounds=spatialBounds(allPoints);
  let dragging=false,lastX=0,lastY=0,dragMode:'orbit'|'pan'='orbit';

  const drawSpatial=()=>{
    canvas.replaceChildren();
    if(!bounds){const empty=document.createElement('div');Object.assign(empty.style,{height:'100%',minHeight:'260px',display:'grid',placeItems:'center',color:TOLUE_DESIGN_TOKENS.color.textMuted});empty.textContent=sceneSegments.length?'مسیر موجود است اما مختصات XYZ معتبر برای نمایش فضایی ندارد.':'برای ساخت Scene، مسیر مهندسی تعریف شود. اجرای Simulation برای نمایش geometry لازم نیست.';canvas.appendChild(empty);return;}
    const width=Math.max(320,canvas.clientWidth||800),height=Math.max(240,canvas.clientHeight||520);
    const svg=document.createElementNS(SVG_NS,'svg');svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.display='block';

    const gridGroup=document.createElementNS(SVG_NS,'g');gridGroup.setAttribute('aria-label','engineering XYZ reference grid');gridGroup.style.pointerEvents='none';
    for(const gridLine of spatialReferenceGrid(bounds,10)){
      const a=projectSpatialPoint(gridLine.start,bounds,camera,width,height),b=projectSpatialPoint(gridLine.end,bounds,camera,width,height);
      const line=document.createElementNS(SVG_NS,'line');line.setAttribute('x1',String(a.x));line.setAttribute('y1',String(a.y));line.setAttribute('x2',String(b.x));line.setAttribute('y2',String(b.y));line.setAttribute('stroke',TOLUE_DESIGN_TOKENS.color.border);line.setAttribute('stroke-width','1');line.setAttribute('opacity','0.42');gridGroup.appendChild(line);
    }
    svg.appendChild(gridGroup);

    const ordered=[...spatialSegments].sort((a,b)=>projectedSegmentDepth(a.startPoint!,a.endPoint!,bounds,camera,width,height)-projectedSegmentDepth(b.startPoint!,b.endPoint!,bounds,camera,width,height));
    for(const segment of ordered){
      const a=projectSpatialPoint(segment.startPoint!,bounds,camera,width,height),b=projectSpatialPoint(segment.endPoint!,bounds,camera,width,height);
      const selected=options.selectedSegmentId===segment.id;
      const hydraulic=segment.hydraulicStatus==='not_run'?null:hydraulicStatusUx(segment.hydraulicStatus);
      const group=document.createElementNS(SVG_NS,'g');group.dataset.segmentId=segment.id;group.style.cursor='pointer';group.addEventListener('click',event=>{event.stopPropagation();options.onSelectSegment?.(segment.id);});
      const hit=document.createElementNS(SVG_NS,'line');hit.setAttribute('x1',String(a.x));hit.setAttribute('y1',String(a.y));hit.setAttribute('x2',String(b.x));hit.setAttribute('y2',String(b.y));hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','16');hit.setAttribute('stroke-linecap','round');
      if(selected){const halo=document.createElementNS(SVG_NS,'line');halo.setAttribute('x1',String(a.x));halo.setAttribute('y1',String(a.y));halo.setAttribute('x2',String(b.x));halo.setAttribute('y2',String(b.y));halo.setAttribute('stroke',TOLUE_DESIGN_TOKENS.color.selection);halo.setAttribute('stroke-width','11');halo.setAttribute('stroke-linecap','round');halo.setAttribute('opacity','0.22');group.appendChild(halo);}
      const line=document.createElementNS(SVG_NS,'line');line.setAttribute('x1',String(a.x));line.setAttribute('y1',String(a.y));line.setAttribute('x2',String(b.x));line.setAttribute('y2',String(b.y));line.setAttribute('stroke',selected?TOLUE_DESIGN_TOKENS.color.selection:hydraulic?statusToneColor(hydraulic.tone):TOLUE_DESIGN_TOKENS.color.borderStrong);line.setAttribute('stroke-width',selected?'7':'5');line.setAttribute('stroke-linecap','round');
      const start=document.createElementNS(SVG_NS,'circle');start.setAttribute('cx',String(a.x));start.setAttribute('cy',String(a.y));start.setAttribute('r',selected?'5':'4');start.setAttribute('fill',TOLUE_DESIGN_TOKENS.color.surfaceElevated);start.setAttribute('stroke',selected?TOLUE_DESIGN_TOKENS.color.selection:TOLUE_DESIGN_TOKENS.color.borderStrong);
      const end=document.createElementNS(SVG_NS,'circle');end.setAttribute('cx',String(b.x));end.setAttribute('cy',String(b.y));end.setAttribute('r',selected?'5':'4');end.setAttribute('fill',selected?TOLUE_DESIGN_TOKENS.color.selection:TOLUE_DESIGN_TOKENS.color.surfaceElevated);end.setAttribute('stroke',selected?TOLUE_DESIGN_TOKENS.color.selection:TOLUE_DESIGN_TOKENS.color.borderStrong);
      group.append(hit,line,start,end);svg.appendChild(group);

      const label=document.createElementNS(SVG_NS,'text');label.setAttribute('x',String((a.x+b.x)/2+7));label.setAttribute('y',String((a.y+b.y)/2-8));label.setAttribute('fill',selected?TOLUE_DESIGN_TOKENS.color.selection:TOLUE_DESIGN_TOKENS.color.text);label.setAttribute('font-size',selected?'12':'11');label.setAttribute('font-weight',selected?'700':'500');label.textContent=`${segment.id}${segment.totalPressureChangePa===null?'':` · ${pressure(segment.totalPressureChangePa)}`}`;label.style.pointerEvents='none';svg.appendChild(label);
    }

    const axisOrigin=projectSpatialPoint(bounds.center,bounds,camera,width,height);const axisLen=bounds.spanM*0.16;const axes:[string,{xM:number;yM:number;zM:number}][]=[['X',{xM:bounds.center.xM+axisLen,yM:bounds.center.yM,zM:bounds.center.zM}],['Y',{xM:bounds.center.xM,yM:bounds.center.yM+axisLen,zM:bounds.center.zM}],['Z',{xM:bounds.center.xM,yM:bounds.center.yM,zM:bounds.center.zM+axisLen}]];
    for(const [name,p] of axes){const ep=projectSpatialPoint(p,bounds,camera,width,height);const line=document.createElementNS(SVG_NS,'line');line.setAttribute('x1',String(axisOrigin.x));line.setAttribute('y1',String(axisOrigin.y));line.setAttribute('x2',String(ep.x));line.setAttribute('y2',String(ep.y));line.setAttribute('stroke',TOLUE_DESIGN_TOKENS.color.textMuted);line.setAttribute('stroke-width','2');const t=document.createElementNS(SVG_NS,'text');t.setAttribute('x',String(ep.x+5));t.setAttribute('y',String(ep.y-5));t.setAttribute('fill',TOLUE_DESIGN_TOKENS.color.textMuted);t.setAttribute('font-size','10');t.setAttribute('font-weight','700');t.textContent=name;svg.append(line,t);}
    svg.addEventListener('click',()=>options.onSelectSegment?.(null));canvas.appendChild(svg);
  };

  if(bounds){toolbar.append(toolbarButton('Fit',()=>{persistCamera(DEFAULT_SPATIAL_CAMERA);drawSpatial();}),toolbarButton('−',()=>{persistCamera(zoomSpatialCamera(camera,0.85));drawSpatial();}),toolbarButton('+',()=>{persistCamera(zoomSpatialCamera(camera,1.18));drawSpatial();}));}
  panel.appendChild(toolbar);panel.appendChild(canvas);
  canvas.addEventListener('wheel',event=>{if(!bounds)return;event.preventDefault();persistCamera(zoomSpatialCamera(camera,event.deltaY<0?1.1:0.9));drawSpatial();},{passive:false});
  canvas.addEventListener('pointerdown',event=>{if(!bounds)return;dragging=true;lastX=event.clientX;lastY=event.clientY;dragMode=event.shiftKey?'pan':'orbit';canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!dragging||!bounds)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;lastX=event.clientX;lastY=event.clientY;persistCamera(dragMode==='pan'?panSpatialCamera(camera,dx,dy):orbitSpatialCamera(camera,dx*0.008,dy*0.008));drawSpatial();});
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  drawSpatial();

  const footer=document.createElement('footer');Object.assign(footer.style,{minHeight:'34px',display:'flex',alignItems:'center',gap:TOLUE_DESIGN_TOKENS.spacing.lg,padding:`0 ${TOLUE_DESIGN_TOKENS.spacing.md}`,borderTop:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:TOLUE_DESIGN_TOKENS.color.surface,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,color:TOLUE_DESIGN_TOKENS.color.textMuted});
  const count=document.createElement('span');count.textContent=`${sceneSegments.length} scene objects · ${spatialSegments.length} spatial`;const spatial=document.createElement('span');spatial.textContent=`Spatial: ${scene?.spatialValidation.status??'not_available'}`;spatial.style.color=scene?.spatialValidation.status==='invalid'?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.textMuted;const help=document.createElement('span');help.textContent=bounds?'Drag: orbit · Shift+Drag: pan · Wheel: zoom · Camera persists':'Spatial controls unavailable';footer.append(count,spatial,help);
  if(scene?.analysisOverlayState==='stale'){const stale=document.createElement('span');stale.textContent='Overlay: stale / hidden';stale.style.color=TOLUE_DESIGN_TOKENS.color.statusWarning;footer.appendChild(stale);}else if(data){const complete=visualizationCompletenessUx(data.completeness);const pressureState=data.pumpabilityDecision?pressureFeasibilityUx(data.pumpabilityDecision.pressureFeasibility):null;const run=document.createElement('span');run.textContent=`Run: ${data.runId}`;run.style.direction='ltr';const state=document.createElement('span');state.textContent=complete.label;state.style.color=statusToneColor(complete.tone);footer.append(run,state);if(pressureState){const pump=document.createElement('span');pump.textContent=`Pump: ${pressureState.label}`;pump.style.color=statusToneColor(pressureState.tone);footer.appendChild(pump);}}
  panel.appendChild(footer);

  if(scene&&options.selectedSegmentId){const selected=scene.segments.find(segment=>segment.id===options.selectedSegmentId);if(selected){panel.dataset.selectedSegmentId=selected.id;const overlay=data?.segments.find(segment=>segment.id===selected.id);panel.title=`${selected.id} | ${visualizationSegmentKindLabel(selected.kind)} | ${scenePointText(selected.startPoint)} → ${scenePointText(selected.endPoint)}${overlay?` | Q=${scalar(overlay.flowRateM3s.value,overlay.flowRateM3s.unit)}`:''}`;}}
  root.appendChild(panel);
}
