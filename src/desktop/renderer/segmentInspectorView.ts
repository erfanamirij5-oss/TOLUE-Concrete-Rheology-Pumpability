import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PipelineScenePresentation } from './pipelineScenePresentation';
import type { Visualization3DPresentation } from './visualization3dPresentation';

type SceneSegment = PipelineScenePresentation['segments'][number];
type ResultSegment = Visualization3DPresentation['segments'][number];

const pressure=(value:number|null|undefined)=>value===null||value===undefined||!Number.isFinite(value)?'—':`${(value/1_000_000).toFixed(3)} MPa`;
const point=(value:SceneSegment['startPoint'])=>value?`${value.xM}, ${value.yM}, ${value.zM} m`:'—';
const datasetNumber=(value:number|null|undefined)=>value===null||value===undefined||!Number.isFinite(value)?'':String(value);

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
  const badge=document.createElement('span');badge.textContent=sceneSegment.kind;Object.assign(badge.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,padding:'3px 7px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,color:TOLUE_DESIGN_TOKENS.color.textMuted,direction:'ltr'});
  heading.append(title,badge);
  const hydraulic=document.createElement('div');const status=resultSegment?.hydraulicStatus??(stale?'stale':'not simulated');hydraulic.textContent=status==='computed'?'Hydraulic result · computed':status==='stale'?'Hydraulic result · stale':'Hydraulic result · not simulated';Object.assign(hydraulic.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,color:status==='computed'?TOLUE_DESIGN_TOKENS.color.statusNominal:status==='stale'?TOLUE_DESIGN_TOKENS.color.statusWarning:TOLUE_DESIGN_TOKENS.color.textMuted,direction:'ltr'});
  const metricGrid=document.createElement('div');Object.assign(metricGrid.style,{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'7px'});
  const metrics:[string,string][]=[['ΔP',stale?'—':pressure(resultSegment?.totalPressureChangePa.value)],['Friction',stale?'—':pressure(resultSegment?.frictionPressureLossPa.value)],['Elevation',stale?'—':pressure(resultSegment?.elevationPressurePa.value)],['Flow',stale||resultSegment?.flowRateM3s.value==null?'—':`${(resultSegment.flowRateM3s.value*3600).toFixed(1)} m³/h`]];
  for(const [label,value] of metrics){const box=document.createElement('div');Object.assign(box.style,{padding:'7px 8px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:TOLUE_DESIGN_TOKENS.color.surfaceElevated});const l=document.createElement('small');l.textContent=label;l.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;const v=document.createElement('strong');v.textContent=value;Object.assign(v.style,{display:'block',marginTop:'2px',fontFamily:TOLUE_DESIGN_TOKENS.typography.monoFamily,direction:'ltr',fontSize:'12px'});box.append(l,v);metricGrid.appendChild(box);}
  const table=document.createElement('dl');Object.assign(table.style,{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px 10px',margin:'0'});
  const rows:[string,string][]=[['Start XYZ',point(sceneSegment.startPoint)],['End XYZ',point(sceneSegment.endPoint)],['Connected from',sceneSegment.connectedFromSegmentId??'—'],['Length',sceneSegment.lengthM===null?'—':`${sceneSegment.lengthM} m`],['Elevation ΔZ',`${sceneSegment.elevationChangeM} m`],['Pipe radius',sceneSegment.pipeRadiusM===null?'—':`${sceneSegment.pipeRadiusM} m`]];
  for(const [label,value] of rows){const dt=document.createElement('dt');dt.textContent=label;Object.assign(dt.style,{color:TOLUE_DESIGN_TOKENS.color.textMuted,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,direction:'ltr'});const dd=document.createElement('dd');dd.textContent=value;Object.assign(dd.style,{margin:'0',direction:'ltr',fontFamily:TOLUE_DESIGN_TOKENS.typography.monoFamily,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs});table.append(dt,dd);}
  card.append(heading,hydraulic,metricGrid,table);root.appendChild(card);
}
