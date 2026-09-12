import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PipelineScenePresentation } from './pipelineScenePresentation';
import type { Visualization3DPresentation } from './visualization3dPresentation';

type SceneSegment = PipelineScenePresentation['segments'][number];
type ResultSegment = Visualization3DPresentation['segments'][number];

const pressure=(value:number|null|undefined)=>value===null||value===undefined||!Number.isFinite(value)?'—':`${(value/1_000_000).toFixed(3)} MPa`;
const point=(value:SceneSegment['startPoint'])=>value?`${value.xM}, ${value.yM}, ${value.zM} متر`:'—';
const datasetNumber=(value:number|null|undefined)=>value===null||value===undefined||!Number.isFinite(value)?'':String(value);
const segmentKindFa=(kind:string)=>kind==='straight'?'مستقیم':kind;

export function renderSegmentInspectorCard(root:HTMLElement,sceneSegment:Readonly<SceneSegment>,resultSegment:Readonly<ResultSegment>|undefined,stale:boolean):void{
  const card=document.createElement('section');card.dataset.segmentInspectorCard='true';
  card.dataset.segmentId=sceneSegment.id;
  card.dataset.segmentStale=stale?'true':'false';
  card.dataset.segmentTotalPressurePa=datasetNumber(resultSegment?.totalPressureChangePa.value);
  card.dataset.segmentFrictionPressurePa=datasetNumber(resultSegment?.frictionPressureLossPa.value);
  card.dataset.segmentElevationPressurePa=datasetNumber(resultSegment?.elevationPressurePa.value);
  card.dataset.segmentFlowRateM3s=datasetNumber(resultSegment?.flowRateM3s.value);
  card.dataset.segmentDiagnosticFindingIds=(resultSegment?.diagnosticFindingIds??[]).join('|');
  Object.assign(card.style,{display:'grid',gap:'10px'});
  const heading=document.createElement('div');Object.assign(heading.style,{display:'flex',alignItems:'center',gap:'8px'});
  const title=document.createElement('h3');title.textContent=sceneSegment.id;Object.assign(title.style,{margin:'0',direction:'ltr',fontFamily:TOLUE_DESIGN_TOKENS.typography.monoFamily,fontSize:'16px'});
  const badge=document.createElement('span');badge.textContent=segmentKindFa(sceneSegment.kind);Object.assign(badge.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,padding:'3px 7px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,color:TOLUE_DESIGN_TOKENS.color.textMuted});
  heading.append(title,badge);
  const hydraulic=document.createElement('div');const status=resultSegment?.hydraulicStatus??(stale?'stale':'not simulated');hydraulic.textContent=status==='computed'?'نتیجه هیدرولیکی محاسبه شده است':status==='stale'?'نتیجه هیدرولیکی قدیمی است':'تحلیل هیدرولیکی هنوز اجرا نشده است';Object.assign(hydraulic.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,color:status==='computed'?TOLUE_DESIGN_TOKENS.color.statusNominal:status==='stale'?TOLUE_DESIGN_TOKENS.color.statusWarning:TOLUE_DESIGN_TOKENS.color.textMuted});
  const metricGrid=document.createElement('div');Object.assign(metricGrid.style,{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'7px'});
  const metrics:[string,string][]=[['افت فشار کل',stale?'—':pressure(resultSegment?.totalPressureChangePa.value)],['افت اصطکاکی',stale?'—':pressure(resultSegment?.frictionPressureLossPa.value)],['فشار ارتفاعی',stale?'—':pressure(resultSegment?.elevationPressurePa.value)],['دبی',stale||resultSegment?.flowRateM3s.value==null?'—':`${(resultSegment.flowRateM3s.value*3600).toFixed(1)} m³/h`]];
  for(const [label,value] of metrics){const box=document.createElement('div');Object.assign(box.style,{padding:'7px 8px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:TOLUE_DESIGN_TOKENS.color.surfaceElevated});const l=document.createElement('small');l.textContent=label;l.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;const v=document.createElement('strong');v.textContent=value;Object.assign(v.style,{display:'block',marginTop:'2px',fontFamily:TOLUE_DESIGN_TOKENS.typography.monoFamily,direction:'ltr',fontSize:'12px'});box.append(l,v);metricGrid.appendChild(box);}
  const table=document.createElement('dl');Object.assign(table.style,{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px 10px',margin:'0'});
  const rows:[string,string][]=[['مختصات شروع',point(sceneSegment.startPoint)],['مختصات پایان',point(sceneSegment.endPoint)],['اتصال از قطعه',sceneSegment.connectedFromSegmentId??'—'],['طول',sceneSegment.lengthM===null?'—':`${sceneSegment.lengthM} متر`],['اختلاف ارتفاع',`${sceneSegment.elevationChangeM} متر`],['شعاع داخلی لوله',sceneSegment.pipeRadiusM===null?'—':`${sceneSegment.pipeRadiusM} متر`]];
  for(const [label,value] of rows){const dt=document.createElement('dt');dt.textContent=label;Object.assign(dt.style,{color:TOLUE_DESIGN_TOKENS.color.textMuted,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs});const dd=document.createElement('dd');dd.textContent=value;Object.assign(dd.style,{margin:'0',direction:'ltr',fontFamily:TOLUE_DESIGN_TOKENS.typography.monoFamily,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs});table.append(dt,dd);}
  card.append(heading,hydraulic,metricGrid,table);root.appendChild(card);
}
