import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { createTextField } from './inputField';

export const PROJECT_METADATA_FIELDS = Object.freeze([
  { id: 'project-name', label: 'نام پروژه', placeholder: 'نام پروژه', required: true, maxLength: 120, helperText: 'برای شناسایی گزارش‌ها و تاریخچه تحلیل استفاده می‌شود.' },
  { id: 'project-code', label: 'کد پروژه', placeholder: 'کد یا شناسه داخلی', maxLength: 80 },
  { id: 'project-location', label: 'محل پروژه', placeholder: 'شهر / کارگاه / موقعیت پروژه', maxLength: 160 },
  { id: 'project-client', label: 'کارفرما', placeholder: 'نام کارفرما یا سازمان', maxLength: 160 },
] as const);

/** Presentation-only project metadata. No engineering validation or inference occurs here. */
export function renderProjectView(target: HTMLElement): void {
  target.replaceChildren();

  const card = document.createElement('section');
  card.setAttribute('aria-label', 'مشخصات پروژه');
  card.style.display = 'grid';
  card.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 1fr))';
  card.style.gap = TOLUE_DESIGN_TOKENS.spacing.lg;
  card.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  card.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const controls = PROJECT_METADATA_FIELDS.map(field => createTextField(field));
  for (const control of controls) card.appendChild(control.wrapper);

  const actions = document.createElement('div');
  actions.style.gridColumn = '1 / -1';
  actions.style.display = 'flex';
  actions.style.alignItems = 'center';
  actions.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;

  const validateButton = document.createElement('button');
  validateButton.type = 'button';
  validateButton.textContent = 'بررسی اطلاعات پروژه';
  validateButton.style.fontFamily = 'inherit';
  validateButton.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.sm} ${TOLUE_DESIGN_TOKENS.spacing.lg}`;
  validateButton.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  validateButton.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  validateButton.style.cursor = 'pointer';

  const validationStatus = document.createElement('span');
  validationStatus.setAttribute('aria-live', 'polite');
  validationStatus.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  validationStatus.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  validateButton.addEventListener('click', () => {
    const valid = controls.map(control => control.validate()).every(Boolean);
    validationStatus.textContent = valid ? 'اطلاعات پروژه آماده است.' : 'موارد مشخص‌شده را اصلاح کنید.';
    validationStatus.style.color = valid ? TOLUE_DESIGN_TOKENS.color.statusNominal : TOLUE_DESIGN_TOKENS.color.statusCritical;
    if (!valid) controls.find(control => control.input.getAttribute('aria-invalid') === 'true')?.input.focus();
  });
  actions.append(validateButton, validationStatus);
  card.appendChild(actions);

  const note = document.createElement('p');
  note.textContent = 'این بررسی فقط کیفیت ورود متادیتای پروژه را کنترل می‌کند و هیچ نتیجه یا تصمیم مهندسی در Renderer تولید نمی‌کند.';
  note.style.gridColumn = '1 / -1';
  note.style.margin = '0';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  note.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  note.style.lineHeight = TOLUE_DESIGN_TOKENS.typography.lineHeight;
  card.appendChild(note);

  target.appendChild(card);
}
