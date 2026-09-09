import { TOLUE_DESIGN_TOKENS } from './designSystem';

export const PROJECT_METADATA_FIELDS = Object.freeze([
  { id: 'project-name', label: 'نام پروژه', placeholder: 'نام پروژه' },
  { id: 'project-code', label: 'کد پروژه', placeholder: 'کد یا شناسه داخلی' },
  { id: 'project-location', label: 'محل پروژه', placeholder: 'شهر / کارگاه / موقعیت پروژه' },
  { id: 'project-client', label: 'کارفرما', placeholder: 'نام کارفرما یا سازمان' },
] as const);

/** Presentation-only project metadata. No engineering validation or inference occurs here. */
export function renderProjectView(target: HTMLElement): void {
  target.replaceChildren();

  const card = document.createElement('section');
  card.setAttribute('aria-label', 'مشخصات پروژه');
  card.style.display = 'grid';
  card.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
  card.style.gap = TOLUE_DESIGN_TOKENS.spacing.lg;
  card.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  card.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  for (const field of PROJECT_METADATA_FIELDS) {
    const wrapper = document.createElement('label');
    wrapper.htmlFor = field.id;
    wrapper.style.display = 'grid';
    wrapper.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
    wrapper.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeMd;

    const caption = document.createElement('span');
    caption.textContent = field.label;

    const input = document.createElement('input');
    input.id = field.id;
    input.name = field.id;
    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = field.placeholder;
    input.style.fontFamily = 'inherit';
    input.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeMd;
    input.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    input.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    input.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    input.style.background = TOLUE_DESIGN_TOKENS.color.surface;
    input.style.color = TOLUE_DESIGN_TOKENS.color.text;

    wrapper.append(caption, input);
    card.appendChild(wrapper);
  }

  const note = document.createElement('p');
  note.textContent = 'این اطلاعات فقط متادیتای پروژه هستند و هیچ نتیجه یا تصمیم مهندسی از آن‌ها در Renderer استخراج نمی‌شود.';
  note.style.gridColumn = '1 / -1';
  note.style.margin = '0';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  note.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  note.style.lineHeight = TOLUE_DESIGN_TOKENS.typography.lineHeight;
  card.appendChild(note);

  target.appendChild(card);
}
