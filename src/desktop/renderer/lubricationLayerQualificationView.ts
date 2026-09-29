import type { ProvenanceActivityKind, ProvenanceEntityKind } from '../../engineering/core/inputProvenance';
import type { LubricationLayerQualificationMode } from '../../engineering/core/lubricationLayerQualification';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import {
  bindLubricationLayerQualificationToCurrentProvenance,
  removeLubricationLayerQualificationDraft,
  removeLubricationLayerThicknessProvenanceDraft,
  setLubricationLayerQualificationModeDraft,
  setLubricationLayerThicknessProvenanceDraft,
  updateLubricationLayerQualificationDraft,
} from './engineeringInputDraft';

export interface LubricationLayerQualificationViewActions { readonly updateInput:(input:Readonly<SimulationRunInput>)=>void; }

const MODES: readonly LubricationLayerQualificationMode[] = ['MEASURED_TRIBOLOGY','PROJECT_CALIBRATED','VALIDATED_PREDICTION','UNAVAILABLE'];
const ENTITY_KINDS: readonly ProvenanceEntityKind[] = ['measurement_result','derived_result','manufacturer_data','engineering_assumption'];
const ACTIVITY_KINDS: readonly ProvenanceActivityKind[] = ['measurement','calibration','derivation','manufacturer_declaration','assumption'];
const modeFa=(value:LubricationLayerQualificationMode)=>value==='MEASURED_TRIBOLOGY'?'اندازه‌گیری مستقیم تریبولوژی':value==='PROJECT_CALIBRATED'?'کالیبره‌شده برای پروژه':value==='VALIDATED_PREDICTION'?'پیش‌بینی اعتبارسنجی‌شده':'در دسترس نیست';
const entityKindFa=(value:ProvenanceEntityKind)=>value==='measurement_result'?'نتیجه اندازه‌گیری':value==='derived_result'?'نتیجه مشتق‌شده':value==='manufacturer_data'?'داده سازنده':'فرض مهندسی';
const activityKindFa=(value:ProvenanceActivityKind)=>value==='measurement'?'اندازه‌گیری':value==='calibration'?'کالیبراسیون':value==='derivation'?'استخراج/محاسبه':value==='manufacturer_declaration'?'اظهار سازنده':'فرض مهندسی';

function textField(labelText:string,value:string,onCommit:(value:string)=>void):HTMLElement{
  const label=document.createElement('label');label.style.display='grid';label.style.gap='4px';
  const span=document.createElement('span');span.textContent=labelText;span.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;
  const input=document.createElement('input');input.value=value;input.style.padding='7px';input.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;input.style.background=TOLUE_DESIGN_TOKENS.color.surface;input.style.color=TOLUE_DESIGN_TOKENS.color.text;input.style.fontFamily='inherit';
  input.addEventListener('change',()=>onCommit(input.value));label.append(span,input);return label;
}

export function renderLubricationLayerQualificationView(root:HTMLElement,input:Readonly<SimulationRunInput>,actions:Readonly<LubricationLayerQualificationViewActions>):void{
  const section=document.createElement('section');
  Object.assign(section.style,{marginTop:TOLUE_DESIGN_TOKENS.spacing.lg,padding:TOLUE_DESIGN_TOKENS.spacing.md,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:TOLUE_DESIGN_TOKENS.color.surfaceMuted});
  const heading=document.createElement('strong');heading.textContent='اعتبارسنجی لایه روانکار';
  const note=document.createElement('p');note.textContent='ضخامت و رئولوژی لایه روانکار فقط وقتی معتبر هستند که حالت ارزیابی و منشأ داده آن‌ها صریحاً تعریف و به همان شناسه‌های داده متصل شوند. هیچ اتصال خودکاری بدون رکورد موجود انجام نمی‌شود.';note.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;note.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;
  section.append(heading,note);

  const q=input.lubricationLayerQualification;
  const modeRow=document.createElement('div');modeRow.style.display='grid';modeRow.style.gridTemplateColumns='1fr auto';modeRow.style.gap='8px';
  const mode=document.createElement('select');for(const item of MODES){const option=document.createElement('option');option.value=item;option.textContent=modeFa(item);mode.appendChild(option);}mode.value=q?.mode??'MEASURED_TRIBOLOGY';mode.style.padding='7px';mode.style.fontFamily='inherit';
  const setMode=document.createElement('button');setMode.type='button';setMode.textContent=q?'تغییر حالت ارزیابی':'تعریف اعتبارسنجی';setMode.addEventListener('click',()=>actions.updateInput(setLubricationLayerQualificationModeDraft(input,mode.value as LubricationLayerQualificationMode)));
  modeRow.append(mode,setMode);section.appendChild(modeRow);

  if(q){
    const grid=document.createElement('div');grid.style.display='grid';grid.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';grid.style.gap='8px';grid.style.marginTop='8px';
    const fields:readonly [string,string,string][]=[['rheologyEvidenceEntityId','شناسه شواهد رئولوژی',q.rheologyEvidenceEntityId??''],['thicknessEvidenceEntityId','شناسه شواهد ضخامت',q.thicknessEvidenceEntityId??''],['methodId','شناسه روش',q.methodId??''],['referenceId','شناسه مرجع',q.referenceId??''],['note','یادداشت',q.note??'']];
    for(const [field,label,value] of fields)grid.appendChild(textField(label,value,next=>actions.updateInput(updateLubricationLayerQualificationDraft(input,field as 'rheologyEvidenceEntityId'|'thicknessEvidenceEntityId'|'methodId'|'referenceId'|'note',next))));
    const bind=document.createElement('button');bind.type='button';bind.textContent='اتصال به منشأ داده فعلی لایه روانکار';bind.style.gridColumn='1 / -1';bind.addEventListener('click',()=>{try{actions.updateInput(bindLubricationLayerQualificationToCurrentProvenance(input));}catch(error){bind.title=error instanceof Error?error.message:'اتصال به منشأ داده انجام نشد';}});
    const remove=document.createElement('button');remove.type='button';remove.textContent='حذف اعتبارسنجی';remove.style.gridColumn='1 / -1';remove.addEventListener('click',()=>actions.updateInput(removeLubricationLayerQualificationDraft(input)));
    grid.append(bind,remove);section.appendChild(grid);
  }

  const prov=input.provenance?.lubricationLayerThickness;
  const provBox=document.createElement('fieldset');provBox.style.marginTop='12px';provBox.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  const legend=document.createElement('legend');legend.textContent='منشأ داده ضخامت لایه روانکار';provBox.appendChild(legend);
  const pgrid=document.createElement('div');pgrid.style.display='grid';pgrid.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';pgrid.style.gap='8px';
  const entityId=(prov?.evidence.entityId??'');const activity=prov?.activities.find(a=>a.id===prov.evidence.generatedByActivityId);const agent=activity?.agentIds?.[0]?prov?.agents.find(a=>a.id===activity.agentIds?.[0]):undefined;
  const entityInput=document.createElement('input');entityInput.value=entityId;const activityInput=document.createElement('input');activityInput.value=activity?.id??'';const methodInput=document.createElement('input');methodInput.value=activity?.methodId??'';const equipmentInput=document.createElement('input');equipmentInput.value=agent?.id??'';const equipmentLabelInput=document.createElement('input');equipmentLabelInput.value=agent?.label??'';const sourceDocInput=document.createElement('input');sourceDocInput.value=prov?.evidence.sourceDocumentId??'';const referenceInput=document.createElement('input');referenceInput.value=prov?.evidence.referenceIds?.[0]??'';const noteInput=document.createElement('input');noteInput.value=prov?.evidence.note??'';
  const styleInput=(el:HTMLInputElement)=>{el.style.padding='7px';el.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;el.style.background=TOLUE_DESIGN_TOKENS.color.surface;el.style.color=TOLUE_DESIGN_TOKENS.color.text;};[entityInput,activityInput,methodInput,equipmentInput,equipmentLabelInput,sourceDocInput,referenceInput,noteInput].forEach(styleInput);
  const wrap=(label:string,el:HTMLElement)=>{const w=document.createElement('label');w.style.display='grid';w.style.gap='4px';const s=document.createElement('span');s.textContent=label;s.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;w.append(s,el);return w;};
  const entityKind=document.createElement('select');ENTITY_KINDS.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=entityKindFa(v);entityKind.appendChild(o);});entityKind.value=prov?.evidence.entityKind??'measurement_result';
  const activityKind=document.createElement('select');ACTIVITY_KINDS.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=activityKindFa(v);activityKind.appendChild(o);});activityKind.value=activity?.kind??'measurement';
  pgrid.append(wrap('شناسه داده',entityInput),wrap('نوع داده',entityKind),wrap('شناسه فعالیت',activityInput),wrap('نوع فعالیت',activityKind),wrap('شناسه روش',methodInput),wrap('شناسه تجهیز',equipmentInput),wrap('نام تجهیز',equipmentLabelInput),wrap('شناسه سند منبع',sourceDocInput),wrap('شناسه مرجع',referenceInput),wrap('یادداشت',noteInput));
  const save=document.createElement('button');save.type='button';save.textContent=prov?'به‌روزرسانی منشأ داده ضخامت':'ثبت منشأ داده ضخامت';save.style.gridColumn='1 / -1';save.addEventListener('click',()=>{try{actions.updateInput(setLubricationLayerThicknessProvenanceDraft(input,{entityId:entityInput.value,entityKind:entityKind.value as ProvenanceEntityKind,activityId:activityInput.value,activityKind:activityKind.value as ProvenanceActivityKind,methodId:methodInput.value,equipmentId:equipmentInput.value,equipmentLabel:equipmentLabelInput.value,sourceDocumentId:sourceDocInput.value,referenceId:referenceInput.value,note:noteInput.value}));}catch(error){save.title=error instanceof Error?error.message:'ثبت منشأ داده ضخامت انجام نشد';}});
  pgrid.appendChild(save);
  if(prov){const remove=document.createElement('button');remove.type='button';remove.textContent='حذف منشأ داده ضخامت';remove.style.gridColumn='1 / -1';remove.addEventListener('click',()=>actions.updateInput(removeLubricationLayerThicknessProvenanceDraft(input)));pgrid.appendChild(remove);}
  provBox.appendChild(pgrid);section.appendChild(provBox);root.appendChild(section);
}
