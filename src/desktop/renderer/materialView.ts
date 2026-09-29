import type { MaterialKind } from '../../engineering/core/projectMaterialInput';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { appendEngineeringSectionHeader, styleEngineeringButton, styleEngineeringField, styleEngineeringSection } from './engineeringPanelStyle';
import { addMaterialDraft, addMaterialPropertyDraft, removeMaterialDraft, removeMaterialPropertyDraft, updateMaterialIdentityDraft } from './projectMaterialDraft';

const MATERIAL_KIND_LABELS: Readonly<Record<MaterialKind,string>> = Object.freeze({cement:'سیمان',water:'آب',fine_aggregate:'سنگدانه ریز',coarse_aggregate:'سنگدانه درشت',scm:'مواد مکمل سیمانی',chemical_admixture:'افزودنی شیمیایی',fiber:'الیاف',other_addition:'سایر افزودنی‌ها'});

interface MaterialPropertyPreset { readonly key:string; readonly label:string; readonly unit?:string; readonly placeholder?:string; }
const MATERIAL_PROPERTY_PRESETS: Readonly<Record<MaterialKind,readonly MaterialPropertyPreset[]>> = Object.freeze({
  cement:Object.freeze([
    {key:'specificGravity',label:'چگالی نسبی',placeholder:'مثلاً 3.15'},
    {key:'blaineSpecificSurface',label:'سطح مخصوص بلین',unit:'cm²/g'},
    {key:'initialSettingTime',label:'زمان گیرش اولیه',unit:'min'},
    {key:'finalSettingTime',label:'زمان گیرش نهایی',unit:'min'},
    {key:'strengthClass',label:'رده / کلاس مقاومت'},
  ]),
  water:Object.freeze([
    {key:'pH',label:'pH'},
    {key:'tds',label:'کل مواد جامد محلول',unit:'mg/L'},
    {key:'chloride',label:'کلراید',unit:'mg/L'},
    {key:'sulfate',label:'سولفات',unit:'mg/L'},
  ]),
  fine_aggregate:Object.freeze([
    {key:'ssdSpecificGravity',label:'چگالی نسبی SSD'},
    {key:'waterAbsorption',label:'جذب آب',unit:'%'},
    {key:'moistureContent',label:'رطوبت',unit:'%'},
    {key:'finenessModulus',label:'مدول نرمی'},
    {key:'passing75Micron',label:'عبوری از الک 75 میکرون',unit:'%'},
  ]),
  coarse_aggregate:Object.freeze([
    {key:'ssdSpecificGravity',label:'چگالی نسبی SSD'},
    {key:'waterAbsorption',label:'جذب آب',unit:'%'},
    {key:'moistureContent',label:'رطوبت',unit:'%'},
    {key:'nominalMaximumSize',label:'حداکثر اندازه اسمی',unit:'mm'},
    {key:'losAngelesAbrasion',label:'سایش لس‌آنجلس',unit:'%'},
  ]),
  scm:Object.freeze([
    {key:'specificGravity',label:'چگالی نسبی'},
    {key:'specificSurface',label:'سطح مخصوص',unit:'cm²/g'},
    {key:'activityIndex',label:'شاخص فعالیت',unit:'%'},
    {key:'lossOnIgnition',label:'افت حرارتی',unit:'%'},
  ]),
  chemical_admixture:Object.freeze([
    {key:'density',label:'چگالی',unit:'kg/L'},
    {key:'solidContent',label:'درصد مواد جامد',unit:'%'},
    {key:'pH',label:'pH'},
    {key:'recommendedDosage',label:'دوز پیشنهادی سازنده',unit:'%'},
  ]),
  fiber:Object.freeze([
    {key:'fiberMaterial',label:'جنس الیاف'},
    {key:'length',label:'طول',unit:'mm'},
    {key:'diameter',label:'قطر',unit:'mm'},
    {key:'aspectRatio',label:'نسبت طول به قطر'},
    {key:'tensileStrength',label:'مقاومت کششی',unit:'MPa'},
  ]),
  other_addition:Object.freeze([
    {key:'specificGravity',label:'چگالی نسبی'},
    {key:'particleSize',label:'اندازه ذره',unit:'µm'},
    {key:'solidContent',label:'درصد جامد',unit:'%'},
  ]),
});
const propertyLabel=(kind:MaterialKind,key:string):string=>MATERIAL_PROPERTY_PRESETS[kind].find(item=>item.key===key)?.label??key;
export interface MaterialsViewActions { readonly updateInput:(input:Readonly<SimulationRunInput>)=>void; }

function field(captionText:string,control:HTMLInputElement|HTMLSelectElement):HTMLLabelElement{const label=document.createElement('label');const caption=document.createElement('span');caption.textContent=captionText;styleEngineeringField(label,control,caption);label.append(caption,control);return label;}

export function renderMaterialsView(root:HTMLElement, engineeringInput?:Readonly<SimulationRunInput>|null, actions?:Readonly<MaterialsViewActions>):void{
  root.replaceChildren();
  const intro=document.createElement('div');Object.assign(intro.style,{display:'flex',alignItems:'center',gap:'8px',padding:'9px 11px',marginBottom:TOLUE_DESIGN_TOKENS.spacing.md,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:TOLUE_DESIGN_TOKENS.color.surfaceMuted,color:TOLUE_DESIGN_TOKENS.color.textMuted,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs});const dot=document.createElement('span');Object.assign(dot.style,{width:'7px',height:'7px',borderRadius:'50%',background:TOLUE_DESIGN_TOKENS.color.info});const introText=document.createElement('span');introText.textContent='پیش‌نویس هوشمندی مصالح · هیچ مقدار، واحد یا استانداردی به‌صورت خودکار فرض نمی‌شود.';intro.append(dot,introText);root.appendChild(intro);
  if(!engineeringInput||!actions){const p=document.createElement('p');p.textContent='پیش‌نویس مهندسی فعال نیست.';root.appendChild(p);return;}

  const create=document.createElement('section');styleEngineeringSection(create,true);appendEngineeringSectionHeader(create,'افزودن مصالح','شناسه و نوع مصالح را تعریف کنید؛ جزئیات بعد از ایجاد قابل ویرایش است.','مصالح');
  const createBody=document.createElement('div');Object.assign(createBody.style,{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:TOLUE_DESIGN_TOKENS.spacing.sm,padding:TOLUE_DESIGN_TOKENS.spacing.md,alignItems:'end'});
  const id=document.createElement('input');id.placeholder='شناسه مصالح';const kind=document.createElement('select');for(const [value,label] of Object.entries(MATERIAL_KIND_LABELS)){const o=document.createElement('option');o.value=value;o.textContent=label;kind.appendChild(o);}const add=document.createElement('button');add.type='button';add.textContent='افزودن مصالح';styleEngineeringButton(add,true);add.addEventListener('click',()=>{try{actions.updateInput(addMaterialDraft(engineeringInput,kind.value as MaterialKind,id.value));}catch{ id.setAttribute('aria-invalid','true'); }});createBody.append(field('شناسه مصالح',id),field('نوع مصالح',kind),add);create.appendChild(createBody);root.appendChild(create);

  const materials=engineeringInput.materials??[];
  if(materials.length===0){const empty=document.createElement('div');Object.assign(empty.style,{marginTop:TOLUE_DESIGN_TOKENS.spacing.md,padding:'18px',textAlign:'center',border:`1px dashed ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,color:TOLUE_DESIGN_TOKENS.color.textMuted});empty.textContent='هنوز مصالحی برای این اجرا تعریف نشده است.';root.appendChild(empty);return;}
  const grid=document.createElement('div');Object.assign(grid.style,{display:'grid',gap:TOLUE_DESIGN_TOKENS.spacing.md,marginTop:TOLUE_DESIGN_TOKENS.spacing.md});
  materials.forEach((material,index)=>{const card=document.createElement('section');styleEngineeringSection(card);appendEngineeringSectionHeader(card,`${MATERIAL_KIND_LABELS[material.kind]} · ${material.id}`,material.source?`منبع: ${material.source}`:'منبع مصالح هنوز ثبت نشده است.',MATERIAL_KIND_LABELS[material.kind]);
    const body=document.createElement('div');Object.assign(body.style,{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:TOLUE_DESIGN_TOKENS.spacing.sm,padding:TOLUE_DESIGN_TOKENS.spacing.md});
    const fields:readonly ['name'|'supplier'|'source'|'standardReference',string,string][]=[['name','نام',material.name],['supplier','تأمین‌کننده',material.supplier??''],['source','منبع / معدن / کارخانه',material.source??''],['standardReference','مرجع استاندارد',material.standardReference??'']];
    for(const [fieldName,labelText,value] of fields){const control=document.createElement('input');control.value=value;control.addEventListener('change',()=>actions.updateInput(updateMaterialIdentityDraft(engineeringInput,index,fieldName,control.value)));body.appendChild(field(labelText,control));}
    const propertySection=document.createElement('div');Object.assign(propertySection.style,{gridColumn:'1 / -1',display:'grid',gap:'10px',padding:'10px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:TOLUE_DESIGN_TOKENS.color.surfaceMuted});
    const propertyTitle=document.createElement('div');Object.assign(propertyTitle.style,{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px'});const propertyTitleText=document.createElement('strong');propertyTitleText.textContent=`ویژگی‌های ${MATERIAL_KIND_LABELS[material.kind]}`;const propertyHint=document.createElement('small');propertyHint.textContent='فقط ثبت داده؛ هیچ حد پذیرش یا مقدار پیش‌فرض اعمال نمی‌شود.';propertyHint.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;propertyTitle.append(propertyTitleText,propertyHint);propertySection.appendChild(propertyTitle);
    if(material.properties.length){const list=document.createElement('div');Object.assign(list.style,{display:'grid',gap:'6px'});material.properties.forEach((property,pIndex)=>{const row=document.createElement('div');Object.assign(row.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:TOLUE_DESIGN_TOKENS.spacing.sm,alignItems:'center',padding:'7px 8px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:'rgba(8,16,22,.35)'});const text=document.createElement('span');text.textContent=`${propertyLabel(material.kind,property.key)}: ${property.value}${property.unit?` ${property.unit}`:''}${property.provenanceEntityId?` · شناسه منشأ: ${property.provenanceEntityId}`:' · بدون منشأ داده'}`;text.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs;const remove=document.createElement('button');remove.type='button';remove.textContent='حذف';styleEngineeringButton(remove,false,true);remove.addEventListener('click',()=>actions.updateInput(removeMaterialPropertyDraft(engineeringInput,index,pIndex)));row.append(text,remove);list.appendChild(row);});propertySection.appendChild(list);}else{const emptyProps=document.createElement('small');emptyProps.textContent='هنوز هیچ ویژگی برای این مصالح ثبت نشده است.';emptyProps.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;propertySection.appendChild(emptyProps);}
    const editor=document.createElement('div');Object.assign(editor.style,{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:TOLUE_DESIGN_TOKENS.spacing.sm,alignItems:'end'});
    const preset=document.createElement('select');const customOption=document.createElement('option');customOption.value='';customOption.textContent='ویژگی سفارشی';preset.appendChild(customOption);for(const item of MATERIAL_PROPERTY_PRESETS[material.kind]){const option=document.createElement('option');option.value=item.key;option.textContent=item.label;preset.appendChild(option);}
    const key=document.createElement('input');key.placeholder='کلید ویژگی';const value=document.createElement('input');value.placeholder='مقدار';const unit=document.createElement('input');unit.placeholder='واحد (اختیاری)';const prov=document.createElement('input');prov.placeholder='شناسه منشأ داده (اختیاری)';
    preset.addEventListener('change',()=>{const selected=MATERIAL_PROPERTY_PRESETS[material.kind].find(item=>item.key===preset.value);if(!selected)return;key.value=selected.key;unit.value=selected.unit??'';value.placeholder=selected.placeholder??'مقدار';key.removeAttribute('aria-invalid');value.removeAttribute('aria-invalid');});
    editor.append(field('ویژگی پیشنهادی',preset),field('کلید ویژگی',key),field('مقدار',value),field('واحد',unit),field('شناسه منشأ داده',prov));
    const status=document.createElement('small');Object.assign(status.style,{gridColumn:'1 / -1',minHeight:'18px',color:TOLUE_DESIGN_TOKENS.color.textMuted});
    const addProp=document.createElement('button');addProp.type='button';addProp.textContent='افزودن ویژگی';styleEngineeringButton(addProp,true);
    const submitProperty=()=>{key.removeAttribute('aria-invalid');value.removeAttribute('aria-invalid');status.textContent='';try{actions.updateInput(addMaterialPropertyDraft(engineeringInput,index,key.value,value.value,unit.value,prov.value));}catch(error){const message=error instanceof Error?error.message:'';status.style.color=TOLUE_DESIGN_TOKENS.color.statusCritical;if(message.includes('DUPLICATE')){key.setAttribute('aria-invalid','true');status.textContent='این ویژگی قبلاً برای همین مصالح ثبت شده است.';}else if(message.includes('VALUE')){value.setAttribute('aria-invalid','true');status.textContent='برای ویژگی مقدار وارد کنید.';}else{key.setAttribute('aria-invalid','true');status.textContent='نام یا نوع ویژگی را وارد کنید.';}}};
    addProp.addEventListener('click',submitProperty);for(const control of [key,value,unit,prov])control.addEventListener('keydown',(event)=>{if(event.key==='Enter'){event.preventDefault();submitProperty();}});editor.append(addProp,status);propertySection.appendChild(editor);body.appendChild(propertySection);
    const actionRow=document.createElement('div');Object.assign(actionRow.style,{gridColumn:'1 / -1',display:'flex',justifyContent:'flex-end',paddingTop:'4px'});const removeMaterial=document.createElement('button');removeMaterial.type='button';removeMaterial.textContent='حذف مصالح';styleEngineeringButton(removeMaterial,false,true);removeMaterial.addEventListener('click',()=>actions.updateInput(removeMaterialDraft(engineeringInput,index)));actionRow.append(removeMaterial);body.appendChild(actionRow);card.appendChild(body);grid.appendChild(card);});
  root.appendChild(grid);
}
