import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { updatePipelineScalarDraft, updateStraightSegmentDraft, type PipelineScalarPath, type StraightSegmentNumericField } from './engineeringInputDraft';
import { appendStraightSpatialSegmentDraft } from './pipelineAuthoring';
import type { PipelinePresentation } from './pipelinePresentation';
import type { PressureCompositionPresentation } from './pressureCompositionPresentation';
import { renderPressureCompositionView } from './pressureCompositionView';
import type { PressureProfilePresentation } from './pressureProfilePresentation';
import { renderPressureProfileView } from './pressureProfileView';

const EMPTY_PIPELINE: Readonly<PipelinePresentation> = Object.freeze({ completeness: 'incomplete', method: 'tolue-pipeline-pressure-v2', components: Object.freeze([
  Object.freeze({ id: 'straight-friction', label: 'افت فشار اصطکاکی مسیر مستقیم', valuePa: null, source: 'engineering-core' as const }),
  Object.freeze({ id: 'calibrated-local-friction', label: 'افت فشار موضعی کالیبره‌شده', valuePa: null, source: 'engineering-core' as const }),
  Object.freeze({ id: 'elevation', label: 'فشار ناشی از اختلاف ارتفاع', valuePa: null, source: 'engineering-core' as const }),
  Object.freeze({ id: 'required', label: 'فشار موردنیاز', valuePa: null, source: 'engineering-core' as const }),
]), segments: Object.freeze([]) });

export interface PipelineViewActions { readonly updateInput: (input: Readonly<SimulationRunInput>) => void; }
function formatPressure(valuePa: number | null): string { return valuePa === null ? '— Pa' : `${valuePa} Pa`; }

function numericEditor(labelText:string,value:number,onCommit:(value:number)=>void):HTMLElement {
  const label=document.createElement('label'); label.style.display='grid'; label.style.gap=TOLUE_DESIGN_TOKENS.spacing.sm;
  const caption=document.createElement('span'); caption.textContent=labelText;
  const input=document.createElement('input'); input.type='number'; input.step='any'; input.value=String(value); input.style.padding=TOLUE_DESIGN_TOKENS.spacing.md; input.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; input.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.sm; input.style.fontFamily='inherit';
  const error=document.createElement('small'); error.style.minHeight='1.2em'; error.style.color=TOLUE_DESIGN_TOKENS.color.statusCritical;
  input.addEventListener('change',()=>{try{onCommit(Number(input.value));input.setAttribute('aria-invalid','false');error.textContent='';}catch{input.setAttribute('aria-invalid','true');error.textContent='مقدار واردشده با محدودیت‌های مدل مهندسی سازگار نیست.';}});
  label.append(caption,input,error); return label;
}

function appendSpatialAuthoring(editor:HTMLElement,engineeringInput:Readonly<SimulationRunInput>,actions:Readonly<PipelineViewActions>):void {
  const section=document.createElement('section');
  Object.assign(section.style,{marginTop:TOLUE_DESIGN_TOKENS.spacing.lg,padding:TOLUE_DESIGN_TOKENS.spacing.md,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:TOLUE_DESIGN_TOKENS.color.surfaceMuted});
  const heading=document.createElement('strong');heading.textContent='Spatial Pipeline Authoring';
  const previous=engineeringInput.pipeline.segments.at(-1);
  const previousEnd=previous?.spatial?.endPoint;
  const note=document.createElement('p');
  note.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;note.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;
  note.textContent=previous
    ? previousEnd
      ? `Segment جدید به انتهای واقعی ${previous.id} متصل می‌شود؛ طول و ΔZ از مختصات محاسبه می‌شوند.`
      : `آخرین Segment (${previous.id}) مختصات فضایی ندارد؛ تا تعیین geometry معتبر، اتصال خودکار مجاز نیست.`
    : 'برای اولین Segment نقطه شروع و پایان را وارد کنید؛ طول و اختلاف ارتفاع از geometry مشتق می‌شوند.';
  section.append(heading,note);

  const form=document.createElement('div');
  form.style.display='grid';form.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';form.style.gap='8px';
  const textInput=(labelText:string,value='')=>{const label=document.createElement('label');label.style.display='grid';label.style.gap='4px';const span=document.createElement('span');span.textContent=labelText;span.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;const input=document.createElement('input');input.value=value;input.style.padding='7px';input.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;input.style.background=TOLUE_DESIGN_TOKENS.color.surface;input.style.color=TOLUE_DESIGN_TOKENS.color.text;input.style.fontFamily='inherit';label.append(span,input);form.appendChild(label);return input;};
  const numberInput=(labelText:string,value='')=>{const input=textInput(labelText,value);input.type='number';input.step='any';return input;};

  const id=textInput('ID');
  const radius=numberInput('Pipe radius (m)');
  let sx:HTMLInputElement|null=null,sy:HTMLInputElement|null=null,sz:HTMLInputElement|null=null;
  if(!previous){sx=numberInput('Start X (m)');sy=numberInput('Start Y (m)');sz=numberInput('Start Z (m)');}
  else if(previousEnd){const start=document.createElement('div');start.style.gridColumn='1 / -1';start.style.fontFamily=TOLUE_DESIGN_TOKENS.typography.monoFamily;start.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;start.textContent=`Start = (${previousEnd.xM}, ${previousEnd.yM}, ${previousEnd.zM}) m · connectedFrom=${previous.id}`;form.appendChild(start);}
  const ex=numberInput('End X (m)');const ey=numberInput('End Y (m)');const ez=numberInput('End Z (m)');
  const error=document.createElement('small');error.style.gridColumn='1 / -1';error.style.minHeight='1.2em';error.style.color=TOLUE_DESIGN_TOKENS.color.statusCritical;
  const add=document.createElement('button');add.type='button';add.textContent='افزودن Straight Segment';add.style.gridColumn='1 / -1';add.disabled=Boolean(previous&&!previousEnd);add.style.padding='8px 10px';add.style.font='inherit';add.style.cursor=add.disabled?'not-allowed':'pointer';add.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`;add.style.background=TOLUE_DESIGN_TOKENS.color.surfaceElevated;add.style.color=TOLUE_DESIGN_TOKENS.color.text;add.addEventListener('click',()=>{try{const startPoint=previousEnd?undefined:{xM:Number(sx?.value),yM:Number(sy?.value),zM:Number(sz?.value)};const next=appendStraightSpatialSegmentDraft(engineeringInput,{id:id.value,pipeRadiusM:Number(radius.value),...(startPoint?{startPoint}:{}),endPoint:{xM:Number(ex.value),yM:Number(ey.value),zM:Number(ez.value)}});actions.updateInput(next);error.textContent='';}catch(err){error.textContent=err instanceof Error?err.message:'PIPELINE-AUTHORING-UNKNOWN';}});
  form.append(error,add);section.appendChild(form);editor.appendChild(section);
}

export function renderPipelineView(root: HTMLElement, presentation: Readonly<PipelinePresentation> = EMPTY_PIPELINE, pressureProfile?: Readonly<PressureProfilePresentation>, pressureComposition?: Readonly<PressureCompositionPresentation>, engineeringInput?: Readonly<SimulationRunInput> | null, actions?: Readonly<PipelineViewActions>): void {
  if(engineeringInput&&actions){const editor=document.createElement('section');editor.setAttribute('aria-label','ورودی‌های مسیر');editor.style.padding=TOLUE_DESIGN_TOKENS.spacing.lg;editor.style.marginBottom=TOLUE_DESIGN_TOKENS.spacing.lg;editor.style.background=TOLUE_DESIGN_TOKENS.color.surface;editor.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;editor.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.md;const title=document.createElement('h2');title.textContent='ورودی‌های مسیر و هندسه';title.style.marginTop='0';const note=document.createElement('p');note.textContent='تغییر این مقادیر Session را Stale می‌کند. محدودیت‌ها فقط از قراردادهای موجود Engineering Core بازتاب داده می‌شوند.';note.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;editor.append(title,note);const grid=document.createElement('div');grid.style.display='grid';grid.style.gridTemplateColumns='repeat(auto-fit,minmax(220px,1fr))';grid.style.gap=TOLUE_DESIGN_TOKENS.spacing.md;const scalars:readonly [PipelineScalarPath,string,string][]=[['targetFlowRateM3s','دبی هدف','m³/s'],['densityKgM3','چگالی بتن','kg/m³'],['lubricationLayerThicknessM','ضخامت لایه روانکار','m']];for(const [path,label,unit] of scalars){grid.appendChild(numericEditor(`${label} (${unit})`,engineeringInput.pipeline[path],value=>actions.updateInput(updatePipelineScalarDraft(engineeringInput,path,value))));}editor.appendChild(grid);
  engineeringInput.pipeline.segments.forEach((segment,index)=>{if(segment.kind!=='straight')return;const block=document.createElement('fieldset');block.style.marginTop=TOLUE_DESIGN_TOKENS.spacing.lg;block.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;block.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.sm;const legend=document.createElement('legend');legend.textContent=`قطعه مستقیم ${segment.id}`;block.appendChild(legend);const segmentGrid=document.createElement('div');segmentGrid.style.display='grid';segmentGrid.style.gridTemplateColumns='repeat(auto-fit,minmax(200px,1fr))';segmentGrid.style.gap=TOLUE_DESIGN_TOKENS.spacing.md;const fields:readonly [StraightSegmentNumericField,string,string][]=[['lengthM','طول','m'],['pipeRadiusM','شعاع داخلی لوله','m'],['elevationChangeM','تغییر ارتفاع','m']];for(const [field,label,unit] of fields){segmentGrid.appendChild(numericEditor(`${label} (${unit})`,segment[field],value=>actions.updateInput(updateStraightSegmentDraft(engineeringInput,index,field,value))));}if(segment.spatial){const spatial=document.createElement('small');spatial.style.gridColumn='1 / -1';spatial.style.direction='ltr';spatial.style.textAlign='left';spatial.style.fontFamily=TOLUE_DESIGN_TOKENS.typography.monoFamily;spatial.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;spatial.textContent=`(${segment.spatial.startPoint.xM}, ${segment.spatial.startPoint.yM}, ${segment.spatial.startPoint.zM}) → (${segment.spatial.endPoint.xM}, ${segment.spatial.endPoint.yM}, ${segment.spatial.endPoint.zM})${segment.spatial.connectedFromSegmentId?` · from ${segment.spatial.connectedFromSegmentId}`:''}`;segmentGrid.appendChild(spatial);}block.appendChild(segmentGrid);editor.appendChild(block);});appendSpatialAuthoring(editor,engineeringInput,actions);root.appendChild(editor);}

  const panel = document.createElement('section'); panel.setAttribute('aria-label', 'اجزای فشار خط لوله'); panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg; panel.style.background = TOLUE_DESIGN_TOKENS.color.surface; panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
  const title = document.createElement('h2'); title.textContent = 'اجزای فشار خط لوله'; title.style.marginTop = '0';
  const note = document.createElement('p'); note.textContent = 'مقادیر فقط از Engineering Core نمایش داده می‌شوند. افت موضعی بدون کالیبراسیون معتبر محاسبه‌شده فرض نمی‌شود و مقدار صفر جایگزین نمی‌گردد.'; note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  const grid = document.createElement('div'); grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))'; grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const component of presentation.components) { const card = document.createElement('article'); card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md; card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted; card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm; const label = document.createElement('strong'); label.textContent = component.label; const value = document.createElement('div'); value.textContent = formatPressure(component.valuePa); value.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm; value.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily; card.append(label, value); grid.appendChild(card); }
  const meta = document.createElement('small'); meta.textContent = `Completeness: ${presentation.completeness} · Method: ${presentation.method}`; meta.style.display = 'block'; meta.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg; meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note, grid, meta); root.appendChild(panel);
  renderPressureCompositionView(root, pressureComposition);
  renderPressureProfileView(root, pressureProfile);
}
