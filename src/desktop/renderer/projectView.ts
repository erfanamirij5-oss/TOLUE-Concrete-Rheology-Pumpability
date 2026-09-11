import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { updateProjectMetadataDraft, type ProjectMetadataField } from './projectMaterialDraft';

export interface ProjectViewActions { readonly updateInput: (input: Readonly<SimulationRunInput>) => void; }

const FIELDS: readonly { field: ProjectMetadataField; label: string; placeholder: string; maxLength: number; required?: boolean }[] = Object.freeze([
  { field: 'name', label: 'نام پروژه', placeholder: 'نام پروژه', maxLength: 120, required: true },
  { field: 'code', label: 'کد پروژه', placeholder: 'کد یا شناسه داخلی', maxLength: 80 },
  { field: 'location', label: 'محل پروژه', placeholder: 'شهر / کارگاه / موقعیت پروژه', maxLength: 160 },
  { field: 'client', label: 'کارفرما', placeholder: 'نام کارفرما یا سازمان', maxLength: 160 },
]);

export function renderProjectView(target: HTMLElement, engineeringInput?: Readonly<SimulationRunInput> | null, actions?: Readonly<ProjectViewActions>): void {
  target.replaceChildren();
  const card=document.createElement('section');card.setAttribute('aria-label','مشخصات پروژه');Object.assign(card.style,{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:TOLUE_DESIGN_TOKENS.spacing.lg,padding:TOLUE_DESIGN_TOKENS.spacing.lg,background:TOLUE_DESIGN_TOKENS.color.surface,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md});
  const title=document.createElement('h2');title.textContent='مشخصات پروژه';title.style.gridColumn='1 / -1';title.style.margin='0';card.appendChild(title);
  const meta=engineeringInput?.projectMetadata;
  for(const spec of FIELDS){const label=document.createElement('label');label.style.display='grid';label.style.gap=TOLUE_DESIGN_TOKENS.spacing.sm;const caption=document.createElement('span');caption.textContent=spec.label;const input=document.createElement('input');input.type='text';input.maxLength=spec.maxLength;input.placeholder=spec.placeholder;input.value=String(meta?.[spec.field]??'');input.disabled=!engineeringInput||!actions;input.style.fontFamily='inherit';input.style.padding=TOLUE_DESIGN_TOKENS.spacing.md;input.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;input.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.sm;const feedback=document.createElement('small');feedback.style.minHeight='1.2em';feedback.style.color=TOLUE_DESIGN_TOKENS.color.statusCritical;input.addEventListener('change',()=>{if(!engineeringInput||!actions)return;if(spec.required&&!input.value.trim()){input.setAttribute('aria-invalid','true');feedback.textContent='نام پروژه الزامی است.';return;}input.setAttribute('aria-invalid','false');feedback.textContent='';actions.updateInput(updateProjectMetadataDraft(engineeringInput,spec.field,input.value));});label.append(caption,input,feedback);card.appendChild(label);}
  const note=document.createElement('p');note.textContent=engineeringInput?'این اطلاعات داخل Snapshot همان Run ذخیره می‌شوند و با تغییر آن‌ها نتیجه قبلی Stale می‌شود.':'Draft مهندسی فعال نیست.';note.style.gridColumn='1 / -1';note.style.margin='0';note.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;note.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeSm;card.appendChild(note);target.appendChild(card);
}
