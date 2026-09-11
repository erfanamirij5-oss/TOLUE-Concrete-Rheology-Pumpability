import { TOLUE_DESIGN_TOKENS, statusToneColor } from './designSystem';
import type { PipelineScenePresentation } from './pipelineScenePresentation';
import { DEFAULT_SPATIAL_CAMERA, orbitSpatialCamera, panSpatialCamera, projectSpatialPoint, spatialBounds, spatialReferenceGrid, zoomSpatialCamera, type SpatialViewportCamera } from './spatialViewportProjection';
import type { Visualization3DPresentation } from './visualization3dPresentation';
import { pressureFeasibilityUx, visualizationCompletenessUx, visualizationSegmentKindLabel } from './visualization3dUx';

export interface Visualization3DViewOptions {
  readonly selectedSegmentId?: string | null;
  readonly onSelectSegment?: (segmentId: string | null) => void;
  readonly compact?: boolean;
  readonly scene?: Readonly<PipelineScenePresentation>;
}

type Projected = Readonly<{x:number;y:number}>;
const cameraByRoot=new WeakMap<HTMLElement,Readonly<SpatialViewportCamera>>();
const SVG_NS='http://www.w3.org/2000/svg';

function pressure(value:number|null):string{return value===null?'—':`${(value/1_000_000).toFixed(3)} MPa`;}
function scalar(value:number|null,unit:string):string{if(value===null)return'—';if(unit==='m')return`${value.toFixed(4)} m`;if(unit==='m3/s')return`${value.toFixed(4)} m³/s`;return`${value} ${unit}`;}
function scenePointText(point:Readonly<{xM:number;yM:number;zM:number}>|null):string{return point?`(${point.xM}, ${point.yM}, ${point.zM}) m`:'geometry unavailable';}
function toolbarButton(text:string,onClick:()=>void):HTMLButtonElement{const b=document.createElement('button');b.type='button';b.textContent=text;b.style.font='inherit';b.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;b.style.padding='4px 7px';b.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`;b.style.background=TOLUE_DESIGN_TOKENS.color.surfaceElevated;b.style.color=TOLUE_DESIGN_TOKENS.color.text;b.style.cursor='pointer';b.addEventListener('click',onClick);return b;}
function line(svg:SVGSVGElement,a:Projected,b:Projected,attrs:Readonly<Record<string,string>>):SVGLineElement{const el=document.createElementNS(SVG_NS,'line');el.setAttribute('x1',String(a.x));el.setAttribute('y1',String(a.y));el.setAttribute('x2',String(b.x));el.setAttribute('y2',String(b.y));for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);svg.appendChild(el);return el;}
function midpoint(a:Projected,b:Projected):Projected{return{x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
function acceptableStatus(status:string|undefined):boolean{return status==='PROJECT_QUALIFIED_ACCEPTABLE'||status==='PARTIALLY_QUALIFIED_ACCEPTABLE'||status==='PRESSURE_ONLY_ACCEPTABLE';}

export function renderVisualization3DView(root:HTMLElement,data?:Readonly<Visualization3DPresentation>,options:Readonly<Visualization3DViewOptions>={}):void{
  const scene=options.scene;
  let camera:Readonly<SpatialViewportCamera>=cameraByRoot.get(root)??DEFAULT_SPATIAL_CAMERA;
  const persistCamera=(next:Readonly<SpatialViewportCamera>)=>{camera=next;cameraByRoot.set(root,next);};
  const panel=document.createElement('section');panel.setAttribute('aria-label','نمای مهندسی سیستم پمپاژ');Object.assign(panel.style,{height:'100%',minHeight:options.compact?'320px':'460px',display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',background:'radial-gradient(circle at 50% 35%,#13252c 0%,#0c171b 55%,#081014 100%)',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,overflow:'hidden'});
  const toolbar=document.createElement('header');Object.assign(toolbar.style,{minHeight:'38px',display:'flex',alignItems:'center',gap:TOLUE_DESIGN_TOKENS.spacing.sm,padding:`0 ${TOLUE_DESIGN_TOKENS.spacing.md}`,borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:TOLUE_DESIGN_TOKENS.color.surface});
  const title=document.createElement('strong');title.textContent='Transparent Flow Simulation View';title.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  const scope=document.createElement('span');scope.textContent=scene?.segments.some(s=>s.startPoint&&s.endPoint)?'Spatial XYZ · glass pipeline · Engineering Core overlay':'Scene fallback · spatial geometry unavailable';scope.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;scope.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;
  const spacer=document.createElement('span');spacer.style.flex='1';toolbar.append(title,scope,spacer);

  const canvas=document.createElement('div');canvas.tabIndex=0;canvas.setAttribute('role','application');canvas.setAttribute('aria-label','نمای سه‌بعدی شیشه‌ای مسیر پمپاژ و جریان بتن');Object.assign(canvas.style,{position:'relative',minHeight:'0',overflow:'hidden',background:'transparent',userSelect:'none',touchAction:'none'});
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
    const defs=document.createElementNS(SVG_NS,'defs');
    defs.innerHTML=`<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="0.22" stop-color="#9bd7ea" stop-opacity="0.42"/><stop offset="0.6" stop-color="#4b7785" stop-opacity="0.18"/><stop offset="1" stop-color="#e8fbff" stop-opacity="0.65"/></linearGradient><linearGradient id="concrete" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d6c68"/><stop offset="0.45" stop-color="#9b968d"/><stop offset="1" stop-color="#5a5955"/></linearGradient><filter id="glassGlow"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="plugGlow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    svg.appendChild(defs);

    for(const gridLine of spatialReferenceGrid(bounds,10)){
      const a=projectSpatialPoint(gridLine.start,bounds,camera,width,height),b=projectSpatialPoint(gridLine.end,bounds,camera,width,height);
      line(svg,a,b,{stroke:TOLUE_DESIGN_TOKENS.color.border,'stroke-width':'1',opacity:'0.26'});
    }

    const projected=spatialSegments.map(segment=>({segment,a:projectSpatialPoint(segment.startPoint!,bounds,camera,width,height),b:projectSpatialPoint(segment.endPoint!,bounds,camera,width,height)}));
    const decision=data?.pumpabilityDecision;
    const status=decision?.status;
    const runAcceptable=acceptableStatus(status);
    const pressurePass=decision?.pressureFeasibility==='PASS';
    const blockageFail=status==='FAIL_BLOCKAGE';
    const stabilityFail=status==='FAIL_STABILITY';
    const pressureFail=status==='FAIL_PRESSURE';
    const hasRun=Boolean(data&&decision);

    for(const item of projected){
      const selected=options.selectedSegmentId===item.segment.id;
      const g=document.createElementNS(SVG_NS,'g');g.dataset.segmentId=item.segment.id;g.style.cursor='pointer';g.addEventListener('click',event=>{event.stopPropagation();options.onSelectSegment?.(item.segment.id);});svg.appendChild(g);
      const hit=document.createElementNS(SVG_NS,'line');hit.setAttribute('x1',String(item.a.x));hit.setAttribute('y1',String(item.a.y));hit.setAttribute('x2',String(item.b.x));hit.setAttribute('y2',String(item.b.y));hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','28');hit.setAttribute('stroke-linecap','round');g.appendChild(hit);
      const shadow=document.createElementNS(SVG_NS,'line');shadow.setAttribute('x1',String(item.a.x+3));shadow.setAttribute('y1',String(item.a.y+5));shadow.setAttribute('x2',String(item.b.x+3));shadow.setAttribute('y2',String(item.b.y+5));shadow.setAttribute('stroke','#000');shadow.setAttribute('stroke-opacity','0.42');shadow.setAttribute('stroke-width','22');shadow.setAttribute('stroke-linecap','round');g.appendChild(shadow);
      const tube=document.createElementNS(SVG_NS,'line');tube.setAttribute('x1',String(item.a.x));tube.setAttribute('y1',String(item.a.y));tube.setAttribute('x2',String(item.b.x));tube.setAttribute('y2',String(item.b.y));tube.setAttribute('stroke','url(#glass)');tube.setAttribute('stroke-width',selected?'24':'21');tube.setAttribute('stroke-linecap','round');tube.setAttribute('filter','url(#glassGlow)');g.appendChild(tube);
      const cavity=document.createElementNS(SVG_NS,'line');cavity.setAttribute('x1',String(item.a.x));cavity.setAttribute('y1',String(item.a.y));cavity.setAttribute('x2',String(item.b.x));cavity.setAttribute('y2',String(item.b.y));cavity.setAttribute('stroke','#071013');cavity.setAttribute('stroke-opacity','0.62');cavity.setAttribute('stroke-width',selected?'14':'12');cavity.setAttribute('stroke-linecap','round');g.appendChild(cavity);
      const highlight=document.createElementNS(SVG_NS,'line');highlight.setAttribute('x1',String(item.a.x));highlight.setAttribute('y1',String(item.a.y-3));highlight.setAttribute('x2',String(item.b.x));highlight.setAttribute('y2',String(item.b.y-3));highlight.setAttribute('stroke','#dff9ff');highlight.setAttribute('stroke-opacity','0.72');highlight.setAttribute('stroke-width','2');highlight.setAttribute('stroke-linecap','round');g.appendChild(highlight);
      if(hasRun&&pressurePass&&(runAcceptable||blockageFail||stabilityFail)){
        const flow=document.createElementNS(SVG_NS,'line');flow.setAttribute('x1',String(item.a.x));flow.setAttribute('y1',String(item.a.y));flow.setAttribute('x2',String(item.b.x));flow.setAttribute('y2',String(item.b.y));flow.setAttribute('stroke','url(#concrete)');flow.setAttribute('stroke-width','9');flow.setAttribute('stroke-linecap','round');flow.setAttribute('stroke-dasharray',runAcceptable?'18 7':'12 8');flow.setAttribute('opacity',blockageFail?'0.72':stabilityFail?'0.68':'0.9');
        if(!blockageFail){const animate=document.createElementNS(SVG_NS,'animate');animate.setAttribute('attributeName','stroke-dashoffset');animate.setAttribute('from','0');animate.setAttribute('to','-50');animate.setAttribute('dur',runAcceptable?'1.1s':'1.9s');animate.setAttribute('repeatCount','indefinite');flow.appendChild(animate);}g.appendChild(flow);
      }
      const label=document.createElementNS(SVG_NS,'text');const m=midpoint(item.a,item.b);label.setAttribute('x',String(m.x+8));label.setAttribute('y',String(m.y-15));label.setAttribute('fill',selected?TOLUE_DESIGN_TOKENS.color.selection:TOLUE_DESIGN_TOKENS.color.text);label.setAttribute('font-size',selected?'12':'11');label.setAttribute('font-weight',selected?'700':'500');label.textContent=`${item.segment.id}${item.segment.totalPressureChangePa===null?'':` · ${pressure(item.segment.totalPressureChangePa)}`}`;label.style.pointerEvents='none';svg.appendChild(label);
    }

    if(projected.length&&hasRun){
      const first=projected[0]!,last=projected[projected.length-1]!;
      const pump=document.createElementNS(SVG_NS,'g');const px=first.a.x-34,py=first.a.y;const body=document.createElementNS(SVG_NS,'rect');body.setAttribute('x',String(px-24));body.setAttribute('y',String(py-18));body.setAttribute('width','48');body.setAttribute('height','36');body.setAttribute('rx','8');body.setAttribute('fill','#f28a16');body.setAttribute('stroke','#ffc267');body.setAttribute('stroke-width','2');const wheel=document.createElementNS(SVG_NS,'circle');wheel.setAttribute('cx',String(px));wheel.setAttribute('cy',String(py));wheel.setAttribute('r','8');wheel.setAttribute('fill','#18262b');wheel.setAttribute('stroke','#fff');wheel.setAttribute('stroke-opacity','0.65');pump.append(body,wheel);svg.appendChild(pump);
      if(runAcceptable&&pressurePass){
        const streamEnd={x:last.b.x,y:Math.min(height-18,last.b.y+72)};const stream=line(svg,last.b,streamEnd,{stroke:'url(#concrete)','stroke-width':'9','stroke-linecap':'round','stroke-dasharray':'12 7',opacity:'0.92'});const animate=document.createElementNS(SVG_NS,'animate');animate.setAttribute('attributeName','stroke-dashoffset');animate.setAttribute('from','0');animate.setAttribute('to','-38');animate.setAttribute('dur','0.85s');animate.setAttribute('repeatCount','indefinite');stream.appendChild(animate);const outlet=document.createElementNS(SVG_NS,'text');outlet.setAttribute('x',String(streamEnd.x+10));outlet.setAttribute('y',String(streamEnd.y));outlet.setAttribute('fill','#81e6b1');outlet.setAttribute('font-size','12');outlet.setAttribute('font-weight','700');outlet.textContent='خروج موفق بتن';svg.appendChild(outlet);
      }
      if(blockageFail){
        const plugItem=projected[Math.floor(projected.length/2)]!;const p=midpoint(plugItem.a,plugItem.b);const plug=document.createElementNS(SVG_NS,'circle');plug.setAttribute('cx',String(p.x));plug.setAttribute('cy',String(p.y));plug.setAttribute('r','14');plug.setAttribute('fill','#e3493e');plug.setAttribute('stroke','#ffc0ba');plug.setAttribute('stroke-width','3');plug.setAttribute('filter','url(#plugGlow)');const pulse=document.createElementNS(SVG_NS,'animate');pulse.setAttribute('attributeName','r');pulse.setAttribute('values','12;17;12');pulse.setAttribute('dur','1.1s');pulse.setAttribute('repeatCount','indefinite');plug.appendChild(pulse);svg.appendChild(plug);const t=document.createElementNS(SVG_NS,'text');t.setAttribute('x',String(p.x+22));t.setAttribute('y',String(p.y-10));t.setAttribute('fill','#ff8f87');t.setAttribute('font-size','12');t.setAttribute('font-weight','700');t.textContent='ریسک گرفتگی';svg.appendChild(t);const d=document.createElementNS(SVG_NS,'text');d.setAttribute('x',String(p.x+22));d.setAttribute('y',String(p.y+8));d.setAttribute('fill',TOLUE_DESIGN_TOKENS.color.textMuted);d.setAttribute('font-size','9');d.textContent='محل نمایشی است؛ Core مکان واقعی گرفتگی را تعیین نمی‌کند';svg.appendChild(d);
      }else if(pressureFail||stabilityFail){
        const p=midpoint(last.a,last.b);const t=document.createElementNS(SVG_NS,'text');t.setAttribute('x',String(p.x+10));t.setAttribute('y',String(p.y-12));t.setAttribute('fill',pressureFail?'#ff766d':'#f5c15d');t.setAttribute('font-size','12');t.setAttribute('font-weight','700');t.textContent=pressureFail?'عبور نامجاز: فشار کافی نیست':'عبور نامجاز: پایداری نامطلوب';svg.appendChild(t);
      }
    }

    const axisOrigin=projectSpatialPoint(bounds.center,bounds,camera,width,height);const axisLen=bounds.spanM*0.16;const axes:[string,{xM:number;yM:number;zM:number}][]=[['X',{xM:bounds.center.xM+axisLen,yM:bounds.center.yM,zM:bounds.center.zM}],['Y',{xM:bounds.center.xM,yM:bounds.center.yM+axisLen,zM:bounds.center.zM}],['Z',{xM:bounds.center.xM,yM:bounds.center.yM,zM:bounds.center.zM+axisLen}]];
    for(const[name,p]of axes){const ep=projectSpatialPoint(p,bounds,camera,width,height);line(svg,axisOrigin,ep,{stroke:TOLUE_DESIGN_TOKENS.color.textMuted,'stroke-width':'2'});const t=document.createElementNS(SVG_NS,'text');t.setAttribute('x',String(ep.x+5));t.setAttribute('y',String(ep.y-5));t.setAttribute('fill',TOLUE_DESIGN_TOKENS.color.textMuted);t.setAttribute('font-size','10');t.setAttribute('font-weight','700');t.textContent=name;svg.appendChild(t);}
    svg.addEventListener('click',()=>options.onSelectSegment?.(null));canvas.appendChild(svg);
  };

  if(bounds){toolbar.append(toolbarButton('Fit',()=>{persistCamera(DEFAULT_SPATIAL_CAMERA);drawSpatial();}),toolbarButton('−',()=>{persistCamera(zoomSpatialCamera(camera,0.85));drawSpatial();}),toolbarButton('+',()=>{persistCamera(zoomSpatialCamera(camera,1.18));drawSpatial();}));}
  panel.appendChild(toolbar);panel.appendChild(canvas);
  canvas.addEventListener('wheel',event=>{if(!bounds)return;event.preventDefault();persistCamera(zoomSpatialCamera(camera,event.deltaY<0?1.1:0.9));drawSpatial();},{passive:false});
  canvas.addEventListener('pointerdown',event=>{if(!bounds)return;dragging=true;lastX=event.clientX;lastY=event.clientY;dragMode=event.shiftKey?'pan':'orbit';canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!dragging||!bounds)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;lastX=event.clientX;lastY=event.clientY;persistCamera(dragMode==='pan'?panSpatialCamera(camera,dx,dy):orbitSpatialCamera(camera,dx*0.008,dy*0.008));drawSpatial();});
  canvas.addEventListener('pointerup',()=>{dragging=false;});canvas.addEventListener('pointercancel',()=>{dragging=false;});
  drawSpatial();

  const footer=document.createElement('footer');Object.assign(footer.style,{minHeight:'34px',display:'flex',alignItems:'center',gap:TOLUE_DESIGN_TOKENS.spacing.lg,padding:`0 ${TOLUE_DESIGN_TOKENS.spacing.md}`,borderTop:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:TOLUE_DESIGN_TOKENS.color.surface,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,color:TOLUE_DESIGN_TOKENS.color.textMuted});
  const count=document.createElement('span');count.textContent=`${sceneSegments.length} scene objects · ${spatialSegments.length} spatial`;const spatial=document.createElement('span');spatial.textContent=`Spatial: ${scene?.spatialValidation.status??'not_available'}`;spatial.style.color=scene?.spatialValidation.status==='invalid'?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.textMuted;const help=document.createElement('span');help.textContent=bounds?'Drag: orbit · Shift+Drag: pan · Wheel: zoom · glass flow overlay':'Spatial controls unavailable';footer.append(count,spatial,help);
  if(scene?.analysisOverlayState==='stale'){const stale=document.createElement('span');stale.textContent='Overlay: stale / hidden';stale.style.color=TOLUE_DESIGN_TOKENS.color.statusWarning;footer.appendChild(stale);}else if(data){const complete=visualizationCompletenessUx(data.completeness);const pressureState=data.pumpabilityDecision?pressureFeasibilityUx(data.pumpabilityDecision.pressureFeasibility):null;const run=document.createElement('span');run.textContent=`Run: ${data.runId}`;run.style.direction='ltr';const state=document.createElement('span');state.textContent=complete.label;state.style.color=statusToneColor(complete.tone);footer.append(run,state);if(pressureState){const pump=document.createElement('span');pump.textContent=`Pump: ${pressureState.label}`;pump.style.color=statusToneColor(pressureState.tone);footer.appendChild(pump);}}
  panel.appendChild(footer);
  if(scene&&options.selectedSegmentId){const selected=scene.segments.find(segment=>segment.id===options.selectedSegmentId);if(selected){panel.dataset.selectedSegmentId=selected.id;const overlay=data?.segments.find(segment=>segment.id===selected.id);panel.title=`${selected.id} | ${visualizationSegmentKindLabel(selected.kind)} | ${scenePointText(selected.startPoint)} → ${scenePointText(selected.endPoint)}${overlay?` | Q=${scalar(overlay.flowRateM3s.value,overlay.flowRateM3s.unit)}`:''}`;}}
  root.appendChild(panel);
}
