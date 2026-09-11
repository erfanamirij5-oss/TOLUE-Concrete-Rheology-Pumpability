import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { confirmStarterDraftInputs, hasStarterDraftPlaceholder } from './draftIntegrity';
import { updateProjectMetadataDraft, type ProjectMetadataField } from './projectMaterialDraft';

export interface ProjectViewActions { readonly updateInput: (input: Readonly<SimulationRunInput>) => void; }

export const PROJECT_METADATA_FIELDS: readonly { id: string; field: ProjectMetadataField; label: string; placeholder: string; maxLength: number; required?: boolean }[] = Object.freeze([
  { id: 'project-name', field: 'name', label: 'نام پروژه', placeholder: 'نام پروژه', maxLength: 120, required: true },
  { id: 'project-code', field: 'code', label: 'کد پروژه', placeholder: 'کد یا شناسه داخلی', maxLength: 80 },
  { id: 'project-location', field: 'location', label: 'محل پروژه', placeholder: 'شهر / کارگاه / موقعیت پروژه', maxLength: 160 },
  { id: 'project-client', field: 'client', label: 'کارفرما', placeholder: 'نام کارفرما یا سازمان', maxLength: 160 },
]);

function appendDraftIntegrityControl(card: HTMLElement, engineeringInput: Readonly<SimulationRunInput>, actions: Readonly<ProjectViewActions>): void {
  const placeholderActive = hasStarterDraftPlaceholder(engineeringInput);
  const box = document.createElement('section');
  box.setAttribute('aria-label', 'کنترل صحت Draft اولیه');
  box.style.gridColumn = '1 / -1';
  box.style.display = 'grid';
  box.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  box.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  box.style.border = `1px solid ${placeholderActive ? TOLUE_DESIGN_TOKENS.color.statusWarning : TOLUE_DESIGN_TOKENS.color.borderStrong}`;
  box.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  box.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
  const heading = document.createElement('strong'); heading.textContent = placeholderActive ? 'Starter Draft Lock فعال است' : 'Starter Draft Lock تأیید شده است'; box.appendChild(heading);
  const text = document.createElement('p'); text.style.margin = '0'; text.style.color = TOLUE_DESIGN_TOKENS.color.textMuted; text.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  text.textContent = placeholderActive ? 'مقادیر اولیه Draft فقط برای فعال بودن ویرایشگرها هستند و تا تأیید صریح شما تحلیل مهندسی BLOCKED می‌ماند. تغییر یک یا چند عدد به‌تنهایی این قفل را باز نمی‌کند.' : 'نشانگر Starter Placeholder از این Run حذف شده است. سایر قواعد Readiness، provenance، geometry، pump و LL همچنان مستقل اعمال می‌شوند.'; box.appendChild(text);
  if (!placeholderActive) { const state = document.createElement('small'); state.textContent = 'Integrity state: STARTER_VALUES_EXPLICITLY_ACKNOWLEDGED'; state.style.direction = 'ltr'; state.style.color = TOLUE_DESIGN_TOKENS.color.statusNominal; box.appendChild(state); card.appendChild(box); return; }
  const acknowledgement = document.createElement('label'); acknowledgement.style.display = 'flex'; acknowledgement.style.alignItems = 'flex-start'; acknowledgement.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.draftIntegrityAcknowledgement = 'true';
  const labelText = document.createElement('span'); labelText.textContent = 'تأیید می‌کنم مقادیر اولیه Draft را بررسی کرده‌ام و هر مقدار مهندسی مورد استفاده، عمداً با داده پروژه جایگزین یا توسط من تأیید شده است.'; acknowledgement.append(checkbox, labelText);
  const confirm = document.createElement('button'); confirm.type = 'button'; confirm.textContent = 'تأیید داده‌های واقعی و باز کردن Starter Lock'; confirm.disabled = true; confirm.style.fontFamily = 'inherit'; confirm.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.sm} ${TOLUE_DESIGN_TOKENS.spacing.md}`; confirm.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`; confirm.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm; confirm.style.background = TOLUE_DESIGN_TOKENS.color.surfaceElevated; confirm.style.color = TOLUE_DESIGN_TOKENS.color.text;
  const feedback = document.createElement('small'); feedback.setAttribute('aria-live', 'polite'); feedback.style.minHeight = '1.2em'; feedback.style.color = TOLUE_DESIGN_TOKENS.color.statusCritical;
  checkbox.addEventListener('change', () => { confirm.disabled = !checkbox.checked; });
  confirm.addEventListener('click', () => { try { const next = confirmStarterDraftInputs(engineeringInput, checkbox.checked); feedback.textContent = ''; actions.updateInput(next); } catch (error) { feedback.textContent = error instanceof Error ? error.message : 'DRAFT-INTEGRITY-UNKNOWN'; } });
  box.append(acknowledgement, confirm, feedback); card.appendChild(box);
}

export function renderProjectView(target: HTMLElement, engineeringInput?: Readonly<SimulationRunInput> | null, actions?: Readonly<ProjectViewActions>): void {
  target.replaceChildren();
  const card=document.createElement('section');card.setAttribute('aria-label','مشخصات پروژه');Object.assign(card.style,{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:TOLUE_DESIGN_TOKENS.spacing.lg,padding:TOLUE_DESIGN_TOKENS.spacing.lg,background:TOLUE_DESIGN_TOKENS.color.surface,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md});
  const title=document.createElement('h2');title.textContent='مشخصات پروژه';title.style.gridColumn='1 / -1';title.style.margin='0';card.appendChild(title);
  const meta=engineeringInput?.projectMetadata;
  for(const spec of PROJECT_METADATA_FIELDS){const label=document.createElement('label');label.style.display='grid';label.style.gap=TOLUE_DESIGN_TOKENS.spacing.sm;const caption=document.createElement('span');caption.textContent=spec.label;const input=document.createElement('input');input.id=spec.id;input.type='text';input.maxLength=spec.maxLength;input.placeholder=spec.placeholder;input.value=String(meta?.[spec.field]??'');input.disabled=!engineeringInput||!actions;input.style.fontFamily='inherit';input.style.padding=TOLUE_DESIGN_TOKENS.spacing.md;input.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;input.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.sm;const feedback=document.createElement('small');feedback.style.minHeight='1.2em';feedback.style.color=TOLUE_DESIGN_TOKENS.color.statusCritical;input.addEventListener('change',()=>{if(!engineeringInput||!actions)return;if(spec.required&&!input.value.trim()){input.setAttribute('aria-invalid','true');feedback.textContent='نام پروژه الزامی است.';return;}input.setAttribute('aria-invalid','false');feedback.textContent='';actions.updateInput(updateProjectMetadataDraft(engineeringInput,spec.field,input.value));});label.append(caption,input,feedback);card.appendChild(label);}
  if (engineeringInput && actions) appendDraftIntegrityControl(card, engineeringInput, actions);
  const note=document.createElement('p');note.textContent=engineeringInput?'این اطلاعات داخل Snapshot همان Run ذخیره می‌شوند و با تغییر آن‌ها نتیجه قبلی Stale می‌شود.':'Draft مهندسی فعال نیست.';note.style.gridColumn='1 / -1';note.style.margin='0';note.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;note.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeSm;card.appendChild(note);target.appendChild(card);
}
