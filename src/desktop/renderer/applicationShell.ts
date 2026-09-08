import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { createNavigationState, TOLUE_SECTIONS, type TolueSectionId } from './navigation';
import { renderProjectView } from './projectView';

const SECTION_DESCRIPTIONS: Readonly<Record<TolueSectionId, string>> = Object.freeze({
  project: 'تعریف و مدیریت زمینه پروژه و ورودی‌های سطح پروژه.',
  materials: 'مدیریت داده‌های مصالح بدون ایجاد تفسیر مهندسی در لایه نمایش.',
  rheology: 'ورودی و نمایش داده‌های رئولوژی؛ محاسبات فقط توسط Engineering Core انجام می‌شوند.',
  pipeline: 'تعریف هندسه مسیر و نمایش اجزای فشار محاسبه‌شده توسط Core.',
  pump: 'ثبت داده‌های قابلیت پمپ از منابع مجاز و نمایش تطابق فشار.',
  evidence: 'نمایش شواهد پروژه‌ای، دامنه اعتبار و ردیابی منشأ داده.',
  results: 'مرکز نتایج مهندسی تولیدشده توسط Engineering Core.',
  diagnostics: 'نمایش تشخیص‌ها، هشدارها و محدودیت‌های تولیدشده توسط Core.',
  report: 'آماده‌سازی و صدور گزارش از خروجی‌های معتبر بدون استنتاج جدید.',
});

export function renderApplicationShell(root: HTMLElement): void {
  let state = createNavigationState();
  root.replaceChildren();
  root.setAttribute('dir', 'rtl');
  root.setAttribute('lang', 'fa');
  root.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.fontFamily;
  root.style.background = TOLUE_DESIGN_TOKENS.color.background;
  root.style.color = TOLUE_DESIGN_TOKENS.color.text;
  root.style.minHeight = '100vh';

  const layout = document.createElement('div');
  layout.style.display = 'grid';
  layout.style.gridTemplateColumns = '240px minmax(0, 1fr)';
  layout.style.minHeight = '100vh';

  const sidebar = document.createElement('aside');
  sidebar.setAttribute('aria-label', 'ناوبری اصلی');
  sidebar.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  sidebar.style.borderLeft = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  sidebar.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;

  const brand = document.createElement('div');
  brand.textContent = 'TOLUE';
  brand.style.fontWeight = '800';
  brand.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeXl;
  brand.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.xl;
  sidebar.appendChild(brand);

  const navigation = document.createElement('nav');
  navigation.style.display = 'grid';
  navigation.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;

  const main = document.createElement('main');
  main.style.padding = TOLUE_DESIGN_TOKENS.spacing.xl;

  const eyebrow = document.createElement('div');
  eyebrow.textContent = 'TOLUE Concrete Rheology & Pumpability';
  eyebrow.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  eyebrow.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;

  const heading = document.createElement('h1');
  heading.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.sm} 0 ${TOLUE_DESIGN_TOKENS.spacing.md}`;
  heading.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeXl;

  const intro = document.createElement('p');
  intro.style.maxWidth = '760px';
  intro.style.lineHeight = TOLUE_DESIGN_TOKENS.typography.lineHeight;
  intro.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  const content = document.createElement('div');
  content.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xl;

  const status = document.createElement('section');
  status.setAttribute('aria-label', 'وضعیت محیط');
  status.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xl;
  status.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  status.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  status.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  status.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const statusTitle = document.createElement('strong');
  statusTitle.textContent = 'مرز ارائه فعال است';
  const statusText = document.createElement('p');
  statusText.textContent = 'این صفحه فقط ساختار تعامل را مدیریت می‌کند؛ هیچ مدل، ضریب، آستانه یا نتیجه مهندسی در Renderer تولید نمی‌شود.';
  statusText.style.marginBottom = '0';
  statusText.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  status.append(statusTitle, statusText);

  const renderSection = (): void => {
    const section = TOLUE_SECTIONS.find(item => item.id === state.activeSection);
    if (!section) throw new Error('RENDERER-NAV-001');
    heading.textContent = section.label;
    intro.textContent = SECTION_DESCRIPTIONS[section.id];
    content.replaceChildren();
    if (section.id === 'project') {
      renderProjectView(content);
    } else {
      const placeholder = document.createElement('section');
      placeholder.textContent = 'این بخش در مرحله بعد به قراردادهای داده و خروجی‌های Engineering Core متصل خواهد شد.';
      placeholder.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
      placeholder.style.background = TOLUE_DESIGN_TOKENS.color.surface;
      placeholder.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
      placeholder.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
      placeholder.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
      content.appendChild(placeholder);
    }
    for (const element of Array.from(navigation.querySelectorAll('button'))) {
      const active = element.dataset.section === state.activeSection;
      element.setAttribute('aria-current', active ? 'page' : 'false');
      element.style.background = active ? TOLUE_DESIGN_TOKENS.color.surface : TOLUE_DESIGN_TOKENS.color.surfaceMuted;
      element.style.color = active ? TOLUE_DESIGN_TOKENS.color.text : TOLUE_DESIGN_TOKENS.color.textMuted;
      element.style.borderColor = active ? TOLUE_DESIGN_TOKENS.color.focus : TOLUE_DESIGN_TOKENS.color.border;
    }
  };

  for (const section of TOLUE_SECTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = section.label;
    button.dataset.section = section.id;
    button.style.textAlign = 'right';
    button.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.md} ${TOLUE_DESIGN_TOKENS.spacing.md}`;
    button.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    button.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    button.style.fontFamily = 'inherit';
    button.addEventListener('click', () => {
      state = createNavigationState(section.id);
      renderSection();
    });
    navigation.appendChild(button);
  }

  sidebar.appendChild(navigation);
  main.append(eyebrow, heading, intro, content, status);
  layout.append(sidebar, main);
  root.appendChild(layout);
  renderSection();
}
