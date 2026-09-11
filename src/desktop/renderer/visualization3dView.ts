import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PipelineScenePresentation } from './pipelineScenePresentation';
import { DEFAULT_SPATIAL_CAMERA, orbitSpatialCamera, panSpatialCamera, projectSpatialPoint, spatialBounds, spatialReferenceGrid, zoomSpatialCamera, type SpatialViewportCamera } from './spatialViewportProjection';
import type { Visualization3DPresentation } from './visualization3dPresentation';

export interface Visualization3DViewOptions {
  readonly selectedSegmentId?: string | null;
  readonly onSelectSegment?: (segmentId: string | null) => void;
  readonly compact?: boolean;
  readonly scene?: Readonly<PipelineScenePresentation>;
}

type Projected = Readonly<{x:number;y:number}>;
const SVG_NS='http://www.w3.org/2000/svg';
const cameraByRoot=new WeakMap<HTMLElement,Readonly<SpatialViewportCamera>>();

const pressure=(value:number|null|undefined)=>value===null||value===undefined||!Number.isFinite(value)?'—':`${(value/1_000_000).toFixed(3)} MPa`;
const acceptableStatus=(status:string|undefined)=>status==='PROJECT_QUALIFIED_ACCEPTABLE'||status==='PARTIALLY_QUALIFIED_ACCEPTABLE'||status==='PRESSURE_ONLY_ACCEPTABLE';
const midpoint=(a:Projected,b:Projected):Projected=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});

function line(parent:SVGElement,a:Projected,b:Projected,attrs:Readonly<Record<string,string>>):SVGLineElement{
  const el=document.createElementNS(SVG_NS,'line');el.setAttribute('x1',String(a.x));el.setAttribute('y1',String(a.y));el.setAttribute('x2',String(b.x));el.setAttribute('y2',String(b.y));for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);parent.appendChild(el);return el;
}

function control(label:string,title:string,onClick:()=>void):HTMLButtonElement{
  const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;
  Object.assign(b.style,{font:'inherit',fontSize:'11px',minWidth:'30px',height:'28px',padding:'0 8px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:TOLUE_DESIGN_TOKENS.color.surfaceElevated,color:TOLUE_DESIGN_TOKENS.color.text,cursor:'pointer'});
  b.addEventListener('click',onClick);return b;
}

function decisionVisual(data:Readonly<Visualization3DPresentation>|undefined):Readonly<{label:string;detail:string;color:string}> {
  const decision=data?.pumpabilityDecision;
  if(!data)return{label:'DRAFT SCENE',detail:'تحلیل هنوز اجرا نشده',color:TOLUE_DESIGN_TOKENS.color.info};
  if(!decision)return{label:'NO DECISION',detail:'داده تصمیم پمپ‌پذیری در دسترس نیست',color:TOLUE_DESIGN_TOKENS.color.statusUnknown};
  if(acceptableStatus(decision.status))return{label:'PASS',detail:'مسیر از نظر وضعیت محاسبه‌شده قابل عبور است',color:TOLUE_DESIGN_TOKENS.color.statusNominal};
  if(decision.status==='FAIL_PRESSURE')return{label:'FAIL · PRESSURE',detail:'فشار پمپ برای مسیر کافی نیست',color:TOLUE_DESIGN_TOKENS.color.statusCritical};
  if(decision.status==='FAIL_STABILITY')return{label:'FAIL · STABILITY',detail:'شواهد پایداری وضعیت نامطلوب نشان می‌دهد',color:TOLUE_DESIGN_TOKENS.color.statusWarning};
  if(decision.status==='FAIL_BLOCKAGE')return{label:'FAIL · BLOCKAGE',detail:'شواهد پروژه ریسک گرفتگی را نشان می‌دهد',color:TOLUE_DESIGN_TOKENS.color.statusCritical};
  return{label:'PRELIMINARY',detail:'تصمیم نهایی به داده یا شواهد بیشتری نیاز دارد',color:TOLUE_DESIGN_TOKENS.color.statusWarning};
}

export function renderVisualization3DView(root:HTMLElement,data?:Readonly<Visualization3DPresentation>,options:Readonly<Visualization3DViewOptions>={}):void{
  root.replaceChildren();
  const scene=options.scene;
  let camera=cameraByRoot.get(root)??DEFAULT_SPATIAL_CAMERA;
  const persist=(next:Readonly<SpatialViewportCamera>)=>{camera=next;cameraByRoot.set(root,next);draw();};
  const panel=document.createElement('section');panel.dataset.engineeringViewport='true';panel.setAttribute('aria-label','نمای مهندسی سه‌بعدی سیستم پمپاژ');
  Object.assign(panel.style,{height:'100%',minHeight:options.compact?'300px':'460px',display:'grid',gridTemplateRows:'44px minmax(0,1fr) 30px',overflow:'hidden',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.lg,background:'radial-gradient(circle at 48% 34%,#142b38 0,#0b1820 46%,#071016 100%)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.035),0 14px 32px rgba(0,0,0,.22)'});

  const toolbar=document.createElement('header');Object.assign(toolbar.style,{display:'flex',alignItems:'center',gap:'8px',padding:'0 10px',borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:'linear-gradient(180deg,#17242d,#111a22)'});
  const titleWrap=document.createElement('div');Object.assign(titleWrap.style,{display:'grid',gap:'1px',minWidth:'0'});
  const title=document.createElement('strong');title.textContent='3D PUMPING WORKSPACE';Object.assign(title.style,{direction:'ltr',fontSize:'12px',letterSpacing:'.055em'});
  const subtitle=document.createElement('small');subtitle.textContent='Spatial XYZ · transparent pipeline · Engineering Core overlay';Object.assign(subtitle.style,{direction:'ltr',fontSize:'9px',color:TOLUE_DESIGN_TOKENS.color.textMuted,whiteSpace:'nowrap'});titleWrap.append(title,subtitle);
  const state=decisionVisual(data);const status=document.createElement('div');Object.assign(status.style,{display:'flex',alignItems:'center',gap:'6px',marginInlineStart:'8px',padding:'4px 8px',border:`1px solid ${state.color}66`,borderRadius:'999px',background:`${state.color}12`});const dot=document.createElement('span');Object.assign(dot.style,{width:'7px',height:'7px',borderRadius:'50%',background:state.color,boxShadow:`0 0 10px ${state.color}`});const statusText=document.createElement('strong');statusText.textContent=state.label;Object.assign(statusText.style,{fontSize:'10px',color:state.color,direction:'ltr'});status.append(dot,statusText);
  const spacer=document.createElement('div');spacer.style.flex='1';
  const controls=document.createElement('div');Object.assign(controls.style,{display:'flex',gap:'5px',direction:'ltr'});controls.append(control('FIT','بازنشانی دوربین',()=>persist(DEFAULT_SPATIAL_CAMERA)),control('−','Zoom out',()=>persist(zoomSpatialCamera(camera,0.85))),control('+','Zoom in',()=>persist(zoomSpatialCamera(camera,1.15))));
  toolbar.append(titleWrap,status,spacer,controls);

  const canvas=document.createElement('div');canvas.tabIndex=0;canvas.setAttribute('role','application');canvas.setAttribute('aria-label','صحنه سه‌بعدی مسیر پمپاژ');Object.assign(canvas.style,{position:'relative',minHeight:'0',overflow:'hidden',userSelect:'none',touchAction:'none',cursor:'grab'});
  const sceneSegments=scene?.segments??[];const spatialSegments=sceneSegments.filter(segment=>segment.startPoint&&segment.endPoint);const points=spatialSegments.flatMap(segment=>[segment.startPoint!,segment.endPoint!]);const bounds=spatialBounds(points);
  let dragging=false,lastX=0,lastY=0,mode:'orbit'|'pan'='orbit';

  const draw=()=>{
    canvas.replaceChildren();
    if(!bounds){const empty=document.createElement('div');Object.assign(empty.style,{height:'100%',display:'grid',placeItems:'center',padding:'24px',textAlign:'center',color:TOLUE_DESIGN_TOKENS.color.textMuted});empty.textContent=sceneSegments.length?'مختصات XYZ معتبر برای نمایش فضایی این مسیر موجود نیست.':'برای شروع، مسیر خط لوله را در بخش Pipeline تعریف کنید.';canvas.appendChild(empty);return;}
    const width=Math.max(360,canvas.clientWidth||760),height=Math.max(250,canvas.clientHeight||430);
    const svg=document.createElementNS(SVG_NS,'svg');svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.display='block';
    const defs=document.createElementNS(SVG_NS,'defs');defs.innerHTML=`<linearGradient id="tolueGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".92"/><stop offset=".18" stop-color="#a5e5fa" stop-opacity=".48"/><stop offset=".55" stop-color="#397187" stop-opacity=".17"/><stop offset="1" stop-color="#dff8ff" stop-opacity=".6"/></linearGradient><linearGradient id="tolueConcrete" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5c5e5e"/><stop offset=".48" stop-color="#9d9a93"/><stop offset="1" stop-color="#535659"/></linearGradient><filter id="tolueGlow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="tolueSelect"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;svg.appendChild(defs);

    for(const gridLine of spatialReferenceGrid(bounds,10)){const a=projectSpatialPoint(gridLine.start,bounds,camera,width,height),b=projectSpatialPoint(gridLine.end,bounds,camera,width,height);line(svg,a,b,{stroke:TOLUE_DESIGN_TOKENS.color.border,'stroke-width':'1',opacity:'.24'});}
    const axisLength=bounds.spanM*.18;const origin=bounds.center;const o=projectSpatialPoint(origin,bounds,camera,width,height);const axes=[{p:{xM:origin.xM+axisLength,yM:origin.yM,zM:origin.zM},c:'#ef6767',l:'X'},{p:{xM:origin.xM,yM:origin.yM+axisLength,zM:origin.zM},c:'#63c98d',l:'Y'},{p:{xM:origin.xM,yM:origin.yM,zM:origin.zM+axisLength},c:'#6bb7e7',l:'Z'}];for(const axis of axes){const e=projectSpatialPoint(axis.p,bounds,camera,width,height);line(svg,o,e,{stroke:axis.c,'stroke-width':'2',opacity:'.8'});const t=document.createElementNS(SVG_NS,'text');t.setAttribute('x',String(e.x+4));t.setAttribute('y',String(e.y-4));t.setAttribute('fill',axis.c);t.setAttribute('font-size','10');t.textContent=axis.l;svg.appendChild(t);}

    const projected=spatialSegments.map(segment=>({segment,a:projectSpatialPoint(segment.startPoint!,bounds,camera,width,height),b:projectSpatialPoint(segment.endPoint!,bounds,camera,width,height)}));
    const decision=data?.pumpabilityDecision;const statusValue=decision?.status;const pass=acceptableStatus(statusValue);const pressurePass=decision?.pressureFeasibility==='PASS';const blockage=statusValue==='FAIL_BLOCKAGE';const stability=statusValue==='FAIL_STABILITY';const pressureFail=statusValue==='FAIL_PRESSURE';const hasRun=Boolean(data&&decision);

    for(const item of projected){
      const selected=options.selectedSegmentId===item.segment.id;const result=data?.segments.find(s=>s.id===item.segment.id);const group=document.createElementNS(SVG_NS,'g');group.dataset.segmentId=item.segment.id;group.style.cursor='pointer';group.addEventListener('click',event=>{event.stopPropagation();options.onSelectSegment?.(item.segment.id);});svg.appendChild(group);
      const shadow=line(group,item.a,item.b,{stroke:'#000','stroke-width':selected?'28':'24','stroke-linecap':'round',opacity:'.38'});shadow.setAttribute('transform','translate(3 5)');
      if(selected)line(group,item.a,item.b,{stroke:TOLUE_DESIGN_TOKENS.color.selection,'stroke-width':'32','stroke-linecap':'round',opacity:'.16',filter:'url(#tolueSelect)'});
      line(group,item.a,item.b,{stroke:'url(#tolueGlass)','stroke-width':selected?'24':'21','stroke-linecap':'round',filter:'url(#tolueGlow)'});
      line(group,item.a,item.b,{stroke:'#061116','stroke-width':selected?'14':'12','stroke-linecap':'round',opacity:'.64'});
      line(group,{x:item.a.x,y:item.a.y-3},{x:item.b.x,y:item.b.y-3},{stroke:'#e5fbff','stroke-width':'2','stroke-linecap':'round',opacity:'.7'});
      if(hasRun&&pressurePass&&(pass||blockage||stability)){const flow=line(group,item.a,item.b,{stroke:'url(#tolueConcrete)','stroke-width':'9','stroke-linecap':'round','stroke-dasharray':pass?'18 7':'12 8',opacity:blockage?'.68':stability?'.64':'.9'});if(!blockage){const animate=document.createElementNS(SVG_NS,'animate');animate.setAttribute('attributeName','stroke-dashoffset');animate.setAttribute('from','0');animate.setAttribute('to','-50');animate.setAttribute('dur',pass?'1.05s':'1.8s');animate.setAttribute('repeatCount','indefinite');flow.appendChild(animate);}}
      const m=midpoint(item.a,item.b);const labelBg=document.createElementNS(SVG_NS,'rect');const labelText=`${item.segment.id}${result?.totalPressureChangePa.value==null?'':` · ${pressure(result.totalPressureChangePa.value)}`}`;const labelWidth=Math.max(58,labelText.length*6.4+14);labelBg.setAttribute('x',String(m.x-labelWidth/2));labelBg.setAttribute('y',String(m.y-31));labelBg.setAttribute('width',String(labelWidth));labelBg.setAttribute('height','19');labelBg.setAttribute('rx','7');labelBg.setAttribute('fill',selected?'#3b2b17':'#0b141a');labelBg.setAttribute('stroke',selected?TOLUE_DESIGN_TOKENS.color.selection:TOLUE_DESIGN_TOKENS.color.borderStrong);labelBg.setAttribute('opacity','.93');labelBg.style.pointerEvents='none';svg.appendChild(labelBg);const label=document.createElementNS(SVG_NS,'text');label.setAttribute('x',String(m.x));label.setAttribute('y',String(m.y-18));label.setAttribute('fill',selected?TOLUE_DESIGN_TOKENS.color.selection:TOLUE_DESIGN_TOKENS.color.text);label.setAttribute('text-anchor','middle');label.setAttribute('font-size','10');label.setAttribute('font-weight',selected?'700':'500');label.textContent=labelText;label.style.pointerEvents='none';svg.appendChild(label);
    }

    if(projected.length&&hasRun){const first=projected[0]!,last=projected[projected.length-1]!;const px=first.a.x-38,py=first.a.y;const pump=document.createElementNS(SVG_NS,'g');const pumpBody=document.createElementNS(SVG_NS,'rect');pumpBody.setAttribute('x',String(px-25));pumpBody.setAttribute('y',String(py-18));pumpBody.setAttribute('width','50');pumpBody.setAttribute('height','36');pumpBody.setAttribute('rx','9');pumpBody.setAttribute('fill','#e88422');pumpBody.setAttribute('stroke','#ffbd67');pumpBody.setAttribute('stroke-width','2');const wheel=document.createElementNS(SVG_NS,'circle');wheel.setAttribute('cx',String(px));wheel.setAttribute('cy',String(py));wheel.setAttribute('r','8');wheel.setAttribute('fill','#15232b');wheel.setAttribute('stroke','#fff');wheel.setAttribute('stroke-opacity','.55');pump.append(pumpBody,wheel);svg.appendChild(pump);
      if(pass&&pressurePass){const end={x:last.b.x,y:Math.min(height-20,last.b.y+68)};const stream=line(svg,last.b,end,{stroke:'url(#tolueConcrete)','stroke-width':'9','stroke-linecap':'round','stroke-dasharray':'12 7',opacity:'.9'});const animate=document.createElementNS(SVG_NS,'animate');animate.setAttribute('attributeName','stroke-dashoffset');animate.setAttribute('from','0');animate.setAttribute('to','-38');animate.setAttribute('dur','.85s');animate.setAttribute('repeatCount','indefinite');stream.appendChild(animate);const t=document.createElementNS(SVG_NS,'text');t.setAttribute('x',String(end.x+9));t.setAttribute('y',String(end.y));t.setAttribute('fill',TOLUE_DESIGN_TOKENS.color.statusNominal);t.setAttribute('font-size','11');t.setAttribute('font-weight','700');t.textContent='خروج بتن';svg.appendChild(t);}
      if(blockage){const target=projected[Math.floor(projected.length/2)]!;const p=midpoint(target.a,target.b);const plug=document.createElementNS(SVG_NS,'circle');plug.setAttribute('cx',String(p.x));plug.setAttribute('cy',String(p.y));plug.setAttribute('r','13');plug.setAttribute('fill',TOLUE_DESIGN_TOKENS.color.statusCritical);plug.setAttribute('stroke','#ffd0d0');plug.setAttribute('stroke-width','3');const pulse=document.createElementNS(SVG_NS,'animate');pulse.setAttribute('attributeName','r');pulse.setAttribute('values','11;16;11');pulse.setAttribute('dur','1s');pulse.setAttribute('repeatCount','indefinite');plug.appendChild(pulse);svg.appendChild(plug);}
      if(pressureFail||stability||blockage){const card=document.createElement('div');card.dataset.failureOverlay='true';Object.assign(card.style,{position:'absolute',left:'14px',bottom:'14px',maxWidth:'320px',padding:'9px 11px',border:`1px solid ${state.color}88`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,background:'rgba(8,16,22,.9)',boxShadow:'0 10px 26px rgba(0,0,0,.28)',pointerEvents:'none'});const h=document.createElement('strong');h.textContent=state.label;Object.assign(h.style,{display:'block',direction:'ltr',fontSize:'11px',color:state.color});const d=document.createElement('small');d.textContent=state.detail;Object.assign(d.style,{display:'block',marginTop:'3px',color:TOLUE_DESIGN_TOKENS.color.textMuted});card.append(h,d);if(blockage){const note=document.createElement('small');note.textContent='نشانگر گرفتگی صرفاً نمایشی است؛ Core مکان فیزیکی گرفتگی را تعیین نمی‌کند.';Object.assign(note.style,{display:'block',marginTop:'5px',color:TOLUE_DESIGN_TOKENS.color.statusWarning});card.appendChild(note);}canvas.appendChild(card);}
    }
    svg.addEventListener('click',()=>options.onSelectSegment?.(null));canvas.prepend(svg);
  };

  canvas.addEventListener('pointerdown',event=>{dragging=true;lastX=event.clientX;lastY=event.clientY;mode=event.shiftKey||event.button===1?'pan':'orbit';canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';});
  canvas.addEventListener('pointermove',event=>{if(!dragging)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;lastX=event.clientX;lastY=event.clientY;if(mode==='pan')persist(panSpatialCamera(camera,dx,dy));else persist(orbitSpatialCamera(camera,dx*.008,dy*.008));});
  const endDrag=(event:PointerEvent)=>{dragging=false;canvas.style.cursor='grab';if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('wheel',event=>{event.preventDefault();persist(zoomSpatialCamera(camera,event.deltaY<0?1.08:.92));},{passive:false});
  canvas.addEventListener('dblclick',()=>persist(DEFAULT_SPATIAL_CAMERA));

  const footer=document.createElement('footer');Object.assign(footer.style,{display:'flex',alignItems:'center',gap:'10px',padding:'0 10px',borderTop:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:'#0d171e',fontSize:'9px',color:TOLUE_DESIGN_TOKENS.color.textMuted});const guidance=document.createElement('span');guidance.textContent='Drag: Orbit · Shift+Drag: Pan · Wheel: Zoom · Double click: Fit';guidance.style.direction='ltr';const footSpacer=document.createElement('span');footSpacer.style.flex='1';const claim=document.createElement('span');claim.textContent='ENGINEERING VISUALIZATION · NOT CFD/DEM';Object.assign(claim.style,{direction:'ltr',color:TOLUE_DESIGN_TOKENS.color.statusWarning,letterSpacing:'.04em'});footer.append(guidance,footSpacer,claim);
  panel.append(toolbar,canvas,footer);root.appendChild(panel);draw();
}
