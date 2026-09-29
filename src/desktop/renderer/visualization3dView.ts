import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PipelineScenePresentation } from './pipelineScenePresentation';
import { DEFAULT_SPATIAL_CAMERA, orbitSpatialCamera, panSpatialCamera, projectSpatialPoint, spatialBounds, spatialReferenceGrid, zoomSpatialCamera, type SpatialViewportCamera } from './spatialViewportProjection';
import type { Visualization3DPresentation, Visualization3DSegmentPresentation } from './visualization3dPresentation';

export interface Visualization3DViewOptions {
  readonly selectedSegmentId?: string | null;
  readonly onSelectSegment?: (segmentId: string | null) => void;
  readonly compact?: boolean;
  readonly scene?: Readonly<PipelineScenePresentation>;
}

type Projected = Readonly<{x:number;y:number}>;
const SVG_NS='http://www.w3.org/2000/svg';
const cameraByRoot=new WeakMap<HTMLElement,Readonly<SpatialViewportCamera>>();

const pressure=(value:number|null|undefined)=>value===null||value===undefined||!Number.isFinite(value)?'—':`${(value/1_000_000).toFixed(3)} مگاپاسکال`;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const midpoint=(a:Projected,b:Projected):Projected=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const flowCapableStatus=(status:string|undefined)=>status==='PROJECT_QUALIFIED_ACCEPTABLE'||status==='SCREENED_ACCEPTABLE'||status==='PARTIALLY_QUALIFIED_ACCEPTABLE'||status==='PARTIALLY_SCREENED_ACCEPTABLE'||status==='PRESSURE_ONLY_ACCEPTABLE'||status==='FAIL_STABILITY'||status==='FAIL_BLOCKAGE';
const fullyAcceptableStatus=(status:string|undefined)=>status==='PROJECT_QUALIFIED_ACCEPTABLE'||status==='SCREENED_ACCEPTABLE';

function line(parent:SVGElement,a:Projected,b:Projected,attrs:Readonly<Record<string,string>>):SVGLineElement{
  const el=document.createElementNS(SVG_NS,'line');
  el.setAttribute('x1',String(a.x));el.setAttribute('y1',String(a.y));el.setAttribute('x2',String(b.x));el.setAttribute('y2',String(b.y));
  for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);
  parent.appendChild(el);return el;
}

function circle(parent:SVGElement,p:Projected,r:number,attrs:Readonly<Record<string,string>>):SVGCircleElement{
  const el=document.createElementNS(SVG_NS,'circle');el.setAttribute('cx',String(p.x));el.setAttribute('cy',String(p.y));el.setAttribute('r',String(r));for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);parent.appendChild(el);return el;
}

function control(label:string,title:string,onClick:()=>void):HTMLButtonElement{
  const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;
  Object.assign(b.style,{font:'inherit',fontSize:'11px',minWidth:'30px',height:'28px',padding:'0 8px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:TOLUE_DESIGN_TOKENS.color.surfaceElevated,color:TOLUE_DESIGN_TOKENS.color.text,cursor:'pointer'});
  b.addEventListener('click',onClick);return b;
}

/** Presentation-only cadence. It uses Q/A only to make the existing computed flow easier to read visually. */
function visualFlowDurationSeconds(segment:Readonly<Visualization3DSegmentPresentation>|undefined,pipeRadiusM:number|null):number{
  const q=segment?.flowRateM3s.value;
  if(q===null||q===undefined||!Number.isFinite(q)||q<=0)return 1.55;
  if(pipeRadiusM!==null&&Number.isFinite(pipeRadiusM)&&pipeRadiusM>0){
    const velocity=q/(Math.PI*pipeRadiusM*pipeRadiusM);
    return clamp(1.62-Math.sqrt(Math.max(0,velocity))*0.72,0.48,1.62);
  }
  const hourly=q*3600;
  return clamp(1.7-Math.sqrt(Math.max(0,hourly))*0.12,0.65,1.7);
}

function pressureLevel(segment:Readonly<Visualization3DSegmentPresentation>|undefined,maxPressurePa:number):number{
  if(!segment||maxPressurePa<=0)return 0;
  const values=[segment.inletRemainingPressurePa.value,segment.outletRemainingPressurePa.value].filter((value):value is number=>value!==null&&Number.isFinite(value));
  if(!values.length)return 0;
  return clamp(values.reduce((sum,value)=>sum+Math.max(0,value),0)/(values.length*maxPressurePa),0,1);
}

function pressureTone(level:number):string{
  const hue=Math.round(196-(level*156));
  return `hsl(${hue} 88% 60%)`;
}

function decisionVisual(data:Readonly<Visualization3DPresentation>|undefined):Readonly<{label:string;detail:string;color:string}> {
  const decision=data?.pumpabilityDecision;
  if(!data)return{label:'پیش‌نویس',detail:'تحلیل هنوز اجرا نشده',color:TOLUE_DESIGN_TOKENS.color.info};
  if(!decision)return{label:'بدون تصمیم',detail:'داده تصمیم پمپ‌پذیری در دسترس نیست',color:TOLUE_DESIGN_TOKENS.color.statusUnknown};
  if(decision.status==='PROJECT_QUALIFIED_ACCEPTABLE')return{label:'قابل قبول',detail:'فشار، پایداری و ریسک انسداد در دامنه شواهد پروژه قابل قبول‌اند',color:TOLUE_DESIGN_TOKENS.color.statusNominal};
  if(decision.status==='SCREENED_ACCEPTABLE')return{label:'غربالگری قابل قبول',detail:'فشار و غربالگری مهندسی پایداری/انسداد قابل قبول‌اند',color:TOLUE_DESIGN_TOKENS.color.statusNominal};
  if(decision.status==='PARTIALLY_QUALIFIED_ACCEPTABLE')return{label:'تأیید جزئی',detail:'فشار قابل تأمین است و بخشی از شواهد پروژه قابل قبول است',color:TOLUE_DESIGN_TOKENS.color.statusWarning};
  if(decision.status==='PARTIALLY_SCREENED_ACCEPTABLE')return{label:'غربالگری ناقص',detail:'فشار قابل تأمین است اما یکی از محورهای غربالگری کامل نیست',color:TOLUE_DESIGN_TOKENS.color.statusWarning};
  if(decision.status==='PRESSURE_ONLY_ACCEPTABLE')return{label:'فشار قابل قبول',detail:'مسیر از نظر فشار قابل تأمین است؛ ارزیابی ریسک کامل نیست',color:TOLUE_DESIGN_TOKENS.color.statusWarning};
  if(decision.status==='FAIL_PRESSURE')return{label:'رد · فشار',detail:'فشار پمپ برای مسیر کافی نیست',color:TOLUE_DESIGN_TOKENS.color.statusCritical};
  if(decision.status==='FAIL_STABILITY')return{label:'رد · پایداری',detail:'ارزیابی پایداری وضعیت نامطلوب نشان می‌دهد',color:TOLUE_DESIGN_TOKENS.color.statusWarning};
  if(decision.status==='FAIL_BLOCKAGE')return{label:'رد · ریسک انسداد',detail:'غربالگری/شواهد، ریسک انسداد نامطلوب نشان می‌دهد',color:TOLUE_DESIGN_TOKENS.color.statusCritical};
  return{label:'مقدماتی',detail:'تصمیم نهایی به داده یا شواهد بیشتری نیاز دارد',color:TOLUE_DESIGN_TOKENS.color.statusWarning};
}

function appendFlowAnimation(flow:SVGLineElement,durationSeconds:number,distance=64):void{
  const animate=document.createElementNS(SVG_NS,'animate');
  animate.setAttribute('attributeName','stroke-dashoffset');animate.setAttribute('from','0');animate.setAttribute('to',String(-distance));animate.setAttribute('dur',`${durationSeconds.toFixed(2)}s`);animate.setAttribute('repeatCount','indefinite');flow.appendChild(animate);
}

function appendJoint(parent:SVGElement,p:Projected,selected:boolean):void{
  circle(parent,p,selected?12.5:11.5,{fill:'#17242b',stroke:selected?TOLUE_DESIGN_TOKENS.color.selection:'#8da0a8','stroke-width':selected?'2.4':'1.7',opacity:'.98'});
  circle(parent,p,selected?8:7.2,{fill:'#0a1115',stroke:'#d7e2e5','stroke-width':'1',opacity:'.94'});
  circle(parent,{x:p.x-2.2,y:p.y-2.4},1.4,{fill:'#ffffff',opacity:'.7'});
}

export function renderVisualization3DView(root:HTMLElement,data?:Readonly<Visualization3DPresentation>,options:Readonly<Visualization3DViewOptions>={}):void{
  root.replaceChildren();
  const scene=options.scene;
  let camera=cameraByRoot.get(root)??DEFAULT_SPATIAL_CAMERA;
  const persist=(next:Readonly<SpatialViewportCamera>)=>{camera=next;cameraByRoot.set(root,next);draw();};
  const panel=document.createElement('section');panel.dataset.engineeringViewport='true';panel.setAttribute('aria-label','نمای مهندسی سه‌بعدی سیستم پمپاژ');
  Object.assign(panel.style,{height:'100%',minHeight:options.compact?'300px':'460px',display:'grid',gridTemplateRows:'46px minmax(0,1fr) 30px',overflow:'hidden',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.lg,background:'radial-gradient(circle at 48% 32%,#18323f 0,#0c1b23 42%,#071016 100%)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.04),0 16px 38px rgba(0,0,0,.28)'});

  const toolbar=document.createElement('header');Object.assign(toolbar.style,{display:'flex',alignItems:'center',gap:'8px',padding:'0 10px',borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:'linear-gradient(180deg,#182a35,#101920)'});
  const titleWrap=document.createElement('div');Object.assign(titleWrap.style,{display:'grid',gap:'1px',minWidth:'0'});
  const title=document.createElement('strong');title.textContent='محیط سه‌بعدی پمپاژ';Object.assign(title.style,{fontSize:'12px'});
  const subtitle=document.createElement('small');subtitle.textContent='مسیر فضایی XYZ · لوله صنعتی · جریان بتن داده‌محور';Object.assign(subtitle.style,{fontSize:'9px',color:TOLUE_DESIGN_TOKENS.color.textMuted,whiteSpace:'nowrap'});titleWrap.append(title,subtitle);
  const state=decisionVisual(data);const status=document.createElement('div');Object.assign(status.style,{display:'flex',alignItems:'center',gap:'6px',marginInlineStart:'8px',padding:'4px 8px',border:`1px solid ${state.color}66`,borderRadius:'999px',background:`${state.color}12`});const dot=document.createElement('span');Object.assign(dot.style,{width:'7px',height:'7px',borderRadius:'50%',background:state.color,boxShadow:`0 0 10px ${state.color}`});const statusText=document.createElement('strong');statusText.textContent=state.label;Object.assign(statusText.style,{fontSize:'10px',color:state.color});status.append(dot,statusText);
  const firstFlow=data?.segments.find(segment=>segment.flowRateM3s.value!==null)?.flowRateM3s.value??null;
  const live=document.createElement('div');if(data?.pumpabilityDecision?.pressureFeasibility==='PASS'&&firstFlow!==null){live.dataset.concreteFlowActive='true';Object.assign(live.style,{display:'flex',alignItems:'center',gap:'5px',padding:'3px 7px',border:'1px solid rgba(185,192,190,.26)',borderRadius:'999px',background:'rgba(113,117,114,.13)'});const liveDot=document.createElement('span');Object.assign(liveDot.style,{width:'6px',height:'6px',borderRadius:'50%',background:'#c6c0b5',boxShadow:'0 0 8px rgba(218,211,198,.7)'});const liveText=document.createElement('small');liveText.textContent=`جریان بتن · ${(firstFlow*3600).toLocaleString('fa-IR',{maximumFractionDigits:1})} مترمکعب/ساعت`;Object.assign(liveText.style,{fontSize:'9px',color:'#d4d0c7'});live.append(liveDot,liveText);}else live.style.display='none';
  const spacer=document.createElement('div');spacer.style.flex='1';
  const controls=document.createElement('div');Object.assign(controls.style,{display:'flex',gap:'5px',direction:'ltr'});controls.append(control('جاگذاری','بازنشانی نمای دوربین',()=>persist(DEFAULT_SPATIAL_CAMERA)),control('−','کوچک‌نمایی',()=>persist(zoomSpatialCamera(camera,0.85))),control('+','بزرگ‌نمایی',()=>persist(zoomSpatialCamera(camera,1.15))));
  toolbar.append(titleWrap,status,live,spacer,controls);

  const canvas=document.createElement('div');canvas.tabIndex=0;canvas.setAttribute('role','application');canvas.setAttribute('aria-label','صحنه سه‌بعدی مسیر پمپاژ');Object.assign(canvas.style,{position:'relative',minHeight:'0',overflow:'hidden',userSelect:'none',touchAction:'none',cursor:'grab'});
  const sceneSegments=scene?.segments??[];const spatialSegments=sceneSegments.filter(segment=>segment.startPoint&&segment.endPoint);const points=spatialSegments.flatMap(segment=>[segment.startPoint!,segment.endPoint!]);const bounds=spatialBounds(points);
  let dragging=false,lastX=0,lastY=0,mode:'orbit'|'pan'='orbit';

  const draw=()=>{
    canvas.replaceChildren();
    if(!bounds){const empty=document.createElement('div');Object.assign(empty.style,{height:'100%',display:'grid',placeItems:'center',padding:'24px',textAlign:'center',color:TOLUE_DESIGN_TOKENS.color.textMuted});empty.textContent=sceneSegments.length?'مختصات XYZ معتبر برای نمایش فضایی این مسیر موجود نیست.':'برای شروع، مسیر خط لوله را در بخش «خط لوله» تعریف کنید.';canvas.appendChild(empty);return;}
    const width=Math.max(360,canvas.clientWidth||760),height=Math.max(250,canvas.clientHeight||430);
    const svg=document.createElementNS(SVG_NS,'svg');svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.display='block';
    const defs=document.createElementNS(SVG_NS,'defs');defs.innerHTML=`
      <linearGradient id="toluePipeMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2edf0"/><stop offset=".14" stop-color="#8ba1aa"/><stop offset=".42" stop-color="#41545e"/><stop offset=".72" stop-color="#18252c"/><stop offset="1" stop-color="#768992"/></linearGradient>
      <linearGradient id="toluePipeInner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1114"/><stop offset=".5" stop-color="#151d20"/><stop offset="1" stop-color="#030607"/></linearGradient>
      <linearGradient id="tolueConcrete" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4f5150"/><stop offset=".23" stop-color="#777770"/><stop offset=".52" stop-color="#aaa59a"/><stop offset=".72" stop-color="#77756f"/><stop offset="1" stop-color="#484b4b"/></linearGradient>
      <linearGradient id="tolueConcreteSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8e0d2" stop-opacity=".18"/><stop offset=".42" stop-color="#f7f2e8" stop-opacity=".72"/><stop offset=".58" stop-color="#e7ddce" stop-opacity=".18"/><stop offset="1" stop-color="#ffffff" stop-opacity=".52"/></linearGradient>
      <filter id="toluePipeShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="3" dy="6" stdDeviation="4" flood-color="#000" flood-opacity=".48"/></filter>
      <filter id="tolueGlow"><feGaussianBlur stdDeviation="2.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="tolueSelect"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="tolueSoftGlow"><feGaussianBlur stdDeviation="5.5"/></filter>`;svg.appendChild(defs);

    const projected=spatialSegments.map(segment=>({segment,a:projectSpatialPoint(segment.startPoint!,bounds,camera,width,height),b:projectSpatialPoint(segment.endPoint!,bounds,camera,width,height)}));
    if(projected.length){const xs=projected.flatMap(item=>[item.a.x,item.b.x]),ys=projected.flatMap(item=>[item.a.y,item.b.y]);const ground=document.createElementNS(SVG_NS,'ellipse');ground.setAttribute('cx',String((Math.min(...xs)+Math.max(...xs))/2));ground.setAttribute('cy',String(Math.min(height-24,Math.max(...ys)+34)));ground.setAttribute('rx',String(Math.max(80,(Math.max(...xs)-Math.min(...xs))*.38)));ground.setAttribute('ry','22');ground.setAttribute('fill','#000');ground.setAttribute('opacity','.18');ground.setAttribute('filter','url(#tolueSoftGlow)');svg.appendChild(ground);}

    for(const gridLine of spatialReferenceGrid(bounds,10)){const a=projectSpatialPoint(gridLine.start,bounds,camera,width,height),b=projectSpatialPoint(gridLine.end,bounds,camera,width,height);line(svg,a,b,{stroke:TOLUE_DESIGN_TOKENS.color.border,'stroke-width':'1',opacity:'.18'});}
    const axisLength=bounds.spanM*.18;const origin=bounds.center;const o=projectSpatialPoint(origin,bounds,camera,width,height);const axes=[{p:{xM:origin.xM+axisLength,yM:origin.yM,zM:origin.zM},c:'#ef6767',l:'X'},{p:{xM:origin.xM,yM:origin.yM+axisLength,zM:origin.zM},c:'#63c98d',l:'Y'},{p:{xM:origin.xM,yM:origin.yM,zM:origin.zM+axisLength},c:'#6bb7e7',l:'Z'}];for(const axis of axes){const e=projectSpatialPoint(axis.p,bounds,camera,width,height);line(svg,o,e,{stroke:axis.c,'stroke-width':'2',opacity:'.72'});const t=document.createElementNS(SVG_NS,'text');t.setAttribute('x',String(e.x+4));t.setAttribute('y',String(e.y-4));t.setAttribute('fill',axis.c);t.setAttribute('font-size','10');t.textContent=axis.l;svg.appendChild(t);}

    const decision=data?.pumpabilityDecision;const statusValue=decision?.status;const pressurePass=decision?.pressureFeasibility==='PASS';const blockage=statusValue==='FAIL_BLOCKAGE';const stability=statusValue==='FAIL_STABILITY';const pressureFail=statusValue==='FAIL_PRESSURE';const hasRun=Boolean(data&&decision);const shouldAnimateFlow=hasRun&&pressurePass&&flowCapableStatus(statusValue);
    const pressureValues=(data?.segments??[]).flatMap(segment=>[segment.inletRemainingPressurePa.value,segment.outletRemainingPressurePa.value]).filter((value):value is number=>value!==null&&Number.isFinite(value)&&value>0);const maxPressurePa=pressureValues.length?Math.max(...pressureValues):0;

    for(const item of projected){
      const selected=options.selectedSegmentId===item.segment.id;const result=data?.segments.find(segment=>segment.id===item.segment.id);const group=document.createElementNS(SVG_NS,'g');group.dataset.segmentId=item.segment.id;group.style.cursor='pointer';group.addEventListener('click',event=>{event.stopPropagation();options.onSelectSegment?.(item.segment.id);});svg.appendChild(group);
      const outerWidth=selected?28:25;const innerWidth=selected?17:15;const concreteWidth=selected?11.5:10;
      const level=pressureLevel(result,maxPressurePa);if(hasRun&&level>0){line(group,item.a,item.b,{stroke:pressureTone(level),'stroke-width':String(outerWidth+7),'stroke-linecap':'round',opacity:String(.05+level*.12),filter:'url(#tolueGlow)'});}
      if(selected)line(group,item.a,item.b,{stroke:TOLUE_DESIGN_TOKENS.color.selection,'stroke-width':String(outerWidth+10),'stroke-linecap':'round',opacity:'.16',filter:'url(#tolueSelect)'});
      line(group,item.a,item.b,{stroke:'#000','stroke-width':String(outerWidth+4),'stroke-linecap':'round',opacity:'.28',filter:'url(#toluePipeShadow)'});
      line(group,item.a,item.b,{stroke:'url(#toluePipeMetal)','stroke-width':String(outerWidth),'stroke-linecap':'round'});
      line(group,item.a,item.b,{stroke:'url(#toluePipeInner)','stroke-width':String(innerWidth),'stroke-linecap':'round',opacity:'.98'});

      if(hasRun&&pressurePass&&flowCapableStatus(statusValue)){
        const duration=visualFlowDurationSeconds(result,item.segment.pipeRadiusM);
        line(group,item.a,item.b,{stroke:'url(#tolueConcrete)','stroke-width':String(concreteWidth),'stroke-linecap':'round',opacity:blockage?'.78':stability?'.84':'.96'});
        const chunks=line(group,item.a,item.b,{stroke:'url(#tolueConcreteSheen)','stroke-width':String(Math.max(4,concreteWidth-2.3)),'stroke-linecap':'round','stroke-dasharray':blockage?'3 10 12 12':'3 9 17 8 5 13',opacity:blockage?'.58':'.82'});
        appendFlowAnimation(chunks,blockage?duration*1.7:stability?duration*1.28:duration,72);
        const aggregate=line(group,item.a,item.b,{stroke:'#242625','stroke-width':'2.2','stroke-linecap':'round','stroke-dasharray':'1 13 2 18 1 11',opacity:'.55'});appendFlowAnimation(aggregate,blockage?duration*1.9:duration*1.12,60);
      }
      line(group,{x:item.a.x,y:item.a.y-4},{x:item.b.x,y:item.b.y-4},{stroke:'#f0fbfd','stroke-width':'2.2','stroke-linecap':'round',opacity:'.58'});
      appendJoint(group,item.a,selected);

      const m=midpoint(item.a,item.b);const labelBg=document.createElementNS(SVG_NS,'rect');const labelText=`${item.segment.id}${result?.totalPressureChangePa.value==null?'':` · ${pressure(result.totalPressureChangePa.value)}`}`;const labelWidth=Math.max(58,labelText.length*6.4+14);labelBg.setAttribute('x',String(m.x-labelWidth/2));labelBg.setAttribute('y',String(m.y-36));labelBg.setAttribute('width',String(labelWidth));labelBg.setAttribute('height','20');labelBg.setAttribute('rx','7');labelBg.setAttribute('fill',selected?'#3b2b17':'#0b141a');labelBg.setAttribute('stroke',selected?TOLUE_DESIGN_TOKENS.color.selection:TOLUE_DESIGN_TOKENS.color.borderStrong);labelBg.setAttribute('opacity','.94');labelBg.style.pointerEvents='none';svg.appendChild(labelBg);const label=document.createElementNS(SVG_NS,'text');label.setAttribute('x',String(m.x));label.setAttribute('y',String(m.y-22));label.setAttribute('fill',selected?TOLUE_DESIGN_TOKENS.color.selection:TOLUE_DESIGN_TOKENS.color.text);label.setAttribute('text-anchor','middle');label.setAttribute('font-size','10');label.setAttribute('font-weight',selected?'700':'500');label.textContent=labelText;label.style.pointerEvents='none';svg.appendChild(label);
    }
    if(projected.length)appendJoint(svg,projected[projected.length-1]!.b,options.selectedSegmentId===projected[projected.length-1]!.segment.id);

    if(projected.length&&hasRun){
      const first=projected[0]!,last=projected[projected.length-1]!;const px=first.a.x-48,py=first.a.y;
      const pump=document.createElementNS(SVG_NS,'g');pump.dataset.pumpVisual='true';const pumpShadow=document.createElementNS(SVG_NS,'ellipse');pumpShadow.setAttribute('cx',String(px));pumpShadow.setAttribute('cy',String(py+24));pumpShadow.setAttribute('rx','31');pumpShadow.setAttribute('ry','8');pumpShadow.setAttribute('fill','#000');pumpShadow.setAttribute('opacity','.34');const pumpBody=document.createElementNS(SVG_NS,'rect');pumpBody.setAttribute('x',String(px-31));pumpBody.setAttribute('y',String(py-19));pumpBody.setAttribute('width','62');pumpBody.setAttribute('height','38');pumpBody.setAttribute('rx','10');pumpBody.setAttribute('fill','#c86c20');pumpBody.setAttribute('stroke','#ffc078');pumpBody.setAttribute('stroke-width','2');const pumpTop=document.createElementNS(SVG_NS,'rect');pumpTop.setAttribute('x',String(px-23));pumpTop.setAttribute('y',String(py-13));pumpTop.setAttribute('width','34');pumpTop.setAttribute('height','8');pumpTop.setAttribute('rx','4');pumpTop.setAttribute('fill','#f0a553');pumpTop.setAttribute('opacity','.85');const nozzle=line(pump,{x:px+29,y:py},{x:first.a.x,y:first.a.y},{stroke:'#aab7bc','stroke-width':'12','stroke-linecap':'round'});nozzle.setAttribute('opacity','.88');const wheel=circle(pump,{x:px-12,y:py+16},8,{fill:'#15232b',stroke:'#dce5e8','stroke-width':'2'});const hub=circle(pump,{x:px-12,y:py+16},2.2,{fill:'#dce5e8'});if(shouldAnimateFlow){const rotate=document.createElementNS(SVG_NS,'animateTransform');rotate.setAttribute('attributeName','transform');rotate.setAttribute('type','rotate');rotate.setAttribute('from',`0 ${px-12} ${py+16}`);rotate.setAttribute('to',`360 ${px-12} ${py+16}`);rotate.setAttribute('dur','1.15s');rotate.setAttribute('repeatCount','indefinite');wheel.appendChild(rotate);hub.appendChild(rotate.cloneNode(true));}pump.prepend(pumpShadow);pump.append(pumpBody,pumpTop);svg.appendChild(pump);
      const pumpLabel=document.createElementNS(SVG_NS,'text');pumpLabel.setAttribute('x',String(px));pumpLabel.setAttribute('y',String(py-27));pumpLabel.setAttribute('fill','#ffd6a3');pumpLabel.setAttribute('text-anchor','middle');pumpLabel.setAttribute('font-size','10');pumpLabel.setAttribute('font-weight','700');pumpLabel.textContent='پمپ بتن';svg.appendChild(pumpLabel);

      if(shouldAnimateFlow&&fullyAcceptableStatus(statusValue)){const end={x:last.b.x,y:Math.min(height-20,last.b.y+72)};line(svg,last.b,end,{stroke:'#171c1d','stroke-width':'14','stroke-linecap':'round',opacity:'.72'});line(svg,last.b,end,{stroke:'url(#tolueConcrete)','stroke-width':'10','stroke-linecap':'round',opacity:'.95'});const stream=line(svg,last.b,end,{stroke:'url(#tolueConcreteSheen)','stroke-width':'6','stroke-linecap':'round','stroke-dasharray':'3 8 14 7',opacity:'.75'});appendFlowAnimation(stream,.75,48);const t=document.createElementNS(SVG_NS,'text');t.setAttribute('x',String(end.x+10));t.setAttribute('y',String(end.y));t.setAttribute('fill',TOLUE_DESIGN_TOKENS.color.statusNominal);t.setAttribute('font-size','11');t.setAttribute('font-weight','700');t.textContent='خروج بتن';svg.appendChild(t);}

      if(pressureFail||stability||blockage){const card=document.createElement('div');card.dataset.failureOverlay='true';Object.assign(card.style,{position:'absolute',left:'14px',bottom:'14px',maxWidth:'340px',padding:'9px 11px',border:`1px solid ${state.color}88`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,background:'rgba(8,16,22,.92)',boxShadow:'0 10px 26px rgba(0,0,0,.28)',pointerEvents:'none',backdropFilter:'blur(5px)'});const h=document.createElement('strong');h.textContent=state.label;Object.assign(h.style,{display:'block',fontSize:'11px',color:state.color});const d=document.createElement('small');d.textContent=state.detail;Object.assign(d.style,{display:'block',marginTop:'3px',color:TOLUE_DESIGN_TOKENS.color.textMuted});card.append(h,d);if(blockage){const note=document.createElement('small');note.textContent='ریسک انسداد روی کل مسیر هشدار داده می‌شود؛ هسته مهندسی محل فیزیکی گرفتگی را تعیین نمی‌کند.';Object.assign(note.style,{display:'block',marginTop:'5px',color:TOLUE_DESIGN_TOKENS.color.statusWarning});card.appendChild(note);}canvas.appendChild(card);}
    }

    if(data&&firstFlow!==null){const hud=document.createElement('div');hud.dataset.flowHud='true';Object.assign(hud.style,{position:'absolute',right:'12px',top:'12px',display:'grid',gap:'3px',minWidth:'150px',padding:'8px 10px',border:'1px solid rgba(158,178,186,.22)',borderRadius:TOLUE_DESIGN_TOKENS.radius.md,background:'rgba(7,15,20,.74)',boxShadow:'0 8px 20px rgba(0,0,0,.2)',backdropFilter:'blur(5px)',pointerEvents:'none'});const h=document.createElement('strong');h.textContent='نمایش جریان بتن';Object.assign(h.style,{fontSize:'10px',color:'#ddd8ce'});const q=document.createElement('small');q.textContent=`دبی هدف: ${(firstFlow*3600).toLocaleString('fa-IR',{maximumFractionDigits:1})} مترمکعب/ساعت`;Object.assign(q.style,{fontSize:'9px',color:TOLUE_DESIGN_TOKENS.color.textMuted});const note=document.createElement('small');note.textContent='سرعت انیمیشن از Q/A برای نمایش بصری مقیاس می‌شود';Object.assign(note.style,{fontSize:'8px',color:TOLUE_DESIGN_TOKENS.color.textMuted});hud.append(h,q,note);canvas.appendChild(hud);}

    svg.addEventListener('click',()=>options.onSelectSegment?.(null));canvas.prepend(svg);
  };

  canvas.addEventListener('pointerdown',event=>{dragging=true;lastX=event.clientX;lastY=event.clientY;mode=event.shiftKey||event.button===1?'pan':'orbit';canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';});
  canvas.addEventListener('pointermove',event=>{if(!dragging)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;lastX=event.clientX;lastY=event.clientY;if(mode==='pan')persist(panSpatialCamera(camera,dx,dy));else persist(orbitSpatialCamera(camera,dx*.008,dy*.008));});
  const endDrag=(event:PointerEvent)=>{dragging=false;canvas.style.cursor='grab';if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('wheel',event=>{event.preventDefault();persist(zoomSpatialCamera(camera,event.deltaY<0?1.08:.92));},{passive:false});
  canvas.addEventListener('dblclick',()=>persist(DEFAULT_SPATIAL_CAMERA));

  const footer=document.createElement('footer');Object.assign(footer.style,{display:'flex',alignItems:'center',gap:'10px',padding:'0 10px',borderTop:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:'#0d171e',fontSize:'9px',color:TOLUE_DESIGN_TOKENS.color.textMuted});const guidance=document.createElement('span');guidance.textContent='کشیدن: چرخش · Shift+کشیدن: جابه‌جایی · چرخ ماوس: بزرگ‌نمایی · دوبار کلیک: جاگذاری';const footSpacer=document.createElement('span');footSpacer.style.flex='1';const claim=document.createElement('span');claim.textContent='نمایش مهندسی · شبیه‌سازی CFD/DEM نیست';Object.assign(claim.style,{color:TOLUE_DESIGN_TOKENS.color.statusWarning});footer.append(guidance,footSpacer,claim);
  panel.append(toolbar,canvas,footer);root.appendChild(panel);draw();
}
