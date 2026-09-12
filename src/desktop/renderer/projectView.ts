import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { confirmStarterDraftInputs, hasStarterDraftPlaceholder } from './draftIntegrity';
import { appendEngineeringSectionHeader, styleEngineeringButton, styleEngineeringField, styleEngineeringSection } from './engineeringPanelStyle';
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
  box.setAttribute('aria-label', 'کنترل صحت پیش‌نویس اولیه');
  styleEngineeringSection(box, true);
  Object.assign(box.style,{display:'grid',gap:TOLUE_DESIGN_TOKENS.spacing.sm,padding:TOLUE_DESIGN_TOKENS.spacing.md,borderColor:placeholderActive?TOLUE_DESIGN_TOKENS.color.statusWarning:TOLUE_DESIGN_TOKENS.color.borderStrong,background:placeholderActive?'linear-gradient(180deg,rgba(240,180,79,.08),rgba(17,26,34,.96))':'linear-gradient(180deg,rgba(85,197,138,.06),rgba(17,26,34,.96))'});
  const heading = document.createElement('div');Object.assign(heading.style,{display:'flex',alignItems:'center',gap:'8px'});
  const statusDot=document.createElement('span');Object.assign(statusDot.style,{width:'8px',height:'8px',borderRadius:'50%',background:placeholderActive?TOLUE_DESIGN_TOKENS.color.statusWarning:TOLUE_DESIGN_TOKENS.color.statusNominal,boxShadow:`0 0 12px ${placeholderActive?TOLUE_DESIGN_TOKENS.color.statusWarning:TOLUE_DESIGN_TOKENS.color.statusNominal}`});
  const headingText=document.createElement('strong');headingText.textContent=placeholderActive?'قفل پیش‌نویس اولیه فعال است':'پیش‌نویس اولیه تأیید شده است';heading.append(statusDot,headingText);box.appendChild(heading);
  const text = document.createElement('p'); Object.assign(text.style,{margin:'0',color:TOLUE_DESIGN_TOKENS.color.textMuted,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeSm,lineHeight:'1.8'});
  text.textContent = placeholderActive ? 'مقادیر اولیه فقط برای فعال بودن ویرایشگرها هستند و تا تأیید صریح شما تحلیل مهندسی مسدود می‌ماند. تغییر یک یا چند عدد به‌تنهایی این قفل را باز نمی‌کند.' : 'نشانگر مقادیر اولیه از این اجرا حذف شده است. سایر کنترل‌های آمادگی، منشأ داده، هندسه، پمپ و لایه روانکار همچنان مستقل اعمال می‌شوند.'; box.appendChild(text);
  if (!placeholderActive) { const state = document.createElement('small'); state.textContent = 'وضعیت صحت داده: مقادیر اولیه صریحاً تأیید شده‌اند'; state.style.color = TOLUE_DESIGN_TOKENS.color.statusNominal; box.appendChild(state); card.appendChild(box); return; }
  const acknowledgement = document.createElement('label'); Object.assign(acknowledgement.style,{display:'flex',alignItems:'flex-start',gap:TOLUE_DESIGN_TOKENS.spacing.sm,padding:'8px 0'});
  const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.draftIntegrityAcknowledgement = 'true';
  const labelText = document.createElement('span'); labelText.textContent = 'تأیید می‌کنم مقادیر اولیه را بررسی کرده‌ام و هر مقدار مهندسی مورد استفاده، عمداً با داده پروژه جایگزین یا توسط من تأیید شده است.'; acknowledgement.append(checkbox, labelText);
  const confirm = document.createElement('button'); confirm.type = 'button'; confirm.textContent = 'تأیید داده‌های واقعی و باز کردن قفل اولیه'; confirm.disabled = true; styleEngineeringButton(confirm,true);
  const feedback = document.createElement('small'); feedback.setAttribute('aria-live', 'polite'); feedback.style.minHeight = '1.2em'; feedback.style.color = TOLUE_DESIGN_TOKENS.color.statusCritical;
  checkbox.addEventListener('change', () => { confirm.disabled = !checkbox.checked; });
  confirm.addEventListener('click', () => { try { const next = confirmStarterDraftInputs(engineeringInput, checkbox.checked); feedback.textContent = ''; actions.updateInput(next); } catch { feedback.textContent = 'تأیید داده‌های اولیه انجام نشد.'; } });
  box.append(acknowledgement, confirm, feedback); card.appendChild(box);
}

export function renderProjectView(target: HTMLElement, engineeringInput?: Readonly<SimulationRunInput> | null, actions?: Readonly<ProjectViewActions>): void {
  target.replaceChildren();
  const card=document.createElement('section');styleEngineeringSection(card,true);card.setAttribute('aria-label','مشخصات پروژه');
  appendEngineeringSectionHeader(card,'مشخصات پروژه','هویت، محل و کارفرمای پروژه در تصویر ورودی همان اجرا ذخیره می‌شوند.','پروژه');
  const body=document.createElement('div');Object.assign(body.style,{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:TOLUE_DESIGN_TOKENS.spacing.md,padding:TOLUE_DESIGN_TOKENS.spacing.md});
  const meta=engineeringInput?.projectMetadata;
  for(const spec of PROJECT_METADATA_FIELDS){const label=document.createElement('label');const caption=document.createElement('span');caption.textContent=spec.label;const input=document.createElement('input');input.id=spec.id;input.type='text';input.maxLength=spec.maxLength;input.placeholder=spec.placeholder;input.value=String(meta?.[spec.field]??'');input.disabled=!engineeringInput||!actions;styleEngineeringField(label,input,caption);const feedback=document.createElement('small');feedback.style.minHeight='1.2em';feedback.style.color=TOLUE_DESIGN_TOKENS.color.statusCritical;input.addEventListener('change',()=>{if(!engineeringInput||!actions)return;if(spec.required&&!input.value.trim()){input.setAttribute('aria-invalid','true');feedback.textContent='نام پروژه الزامی است.';return;}input.setAttribute('aria-invalid','false');feedback.textContent='';actions.updateInput(updateProjectMetadataDraft(engineeringInput,spec.field,input.value));});label.append(caption,input,feedback);body.appendChild(label);}
  if(engineeringInput&&actions)appendDraftIntegrityControl(body,engineeringInput,actions);
  const note=document.createElement('div');Object.assign(note.style,{display:'flex',alignItems:'center',gap:'8px',padding:'9px 11px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:TOLUE_DESIGN_TOKENS.color.surfaceMuted,color:TOLUE_DESIGN_TOKENS.color.textMuted,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs});const dot=document.createElement('span');Object.assign(dot.style,{width:'7px',height:'7px',borderRadius:'50%',background:engineeringInput?TOLUE_DESIGN_TOKENS.color.info:TOLUE_DESIGN_TOKENS.color.statusUnknown});const noteText=document.createElement('span');noteText.textContent=engineeringInput?'تغییر مشخصات پروژه، نتایج قبلی را قدیمی می‌کند و برای نتیجه جدید باید تحلیل دوباره اجرا شود.':'پیش‌نویس مهندسی فعال نیست.';note.append(dot,noteText);body.appendChild(note);
  card.appendChild(body);target.appendChild(card);
}
