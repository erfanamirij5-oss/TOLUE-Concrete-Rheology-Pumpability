import { TOLUE_DESIGN_TOKENS } from './designSystem';

const NAVIGATION_ITEMS = Object.freeze([
  'پروژه',
  'مصالح',
  'رئولوژی',
  'خط لوله',
  'پمپ',
  'شواهد',
  'نتایج',
  'عیب‌یابی',
  'گزارش',
] as const);

export function renderApplicationShell(root: HTMLElement): void {
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

  for (const item of NAVIGATION_ITEMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item;
    button.disabled = true;
    button.style.textAlign = 'right';
    button.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.md} ${TOLUE_DESIGN_TOKENS.spacing.md}`;
    button.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    button.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    button.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    button.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    button.style.fontFamily = 'inherit';
    button.setAttribute('aria-disabled', 'true');
    navigation.appendChild(button);
  }
  sidebar.appendChild(navigation);

  const main = document.createElement('main');
  main.style.padding = TOLUE_DESIGN_TOKENS.spacing.xl;

  const eyebrow = document.createElement('div');
  eyebrow.textContent = 'TOLUE Concrete Rheology & Pumpability';
  eyebrow.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  eyebrow.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;

  const heading = document.createElement('h1');
  heading.textContent = 'طلوع؛ رئولوژی و پمپ‌پذیری بتن';
  heading.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.sm} 0 ${TOLUE_DESIGN_TOKENS.spacing.md}`;
  heading.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeXl;

  const intro = document.createElement('p');
  intro.textContent = 'زیرساخت رابط مهندسی در حال آماده‌سازی است. منطق علمی و نتایج فقط از Engineering Core دریافت خواهند شد.';
  intro.style.maxWidth = '760px';
  intro.style.lineHeight = TOLUE_DESIGN_TOKENS.typography.lineHeight;
  intro.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  const status = document.createElement('section');
  status.setAttribute('aria-label', 'وضعیت محیط');
  status.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xl;
  status.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  status.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  status.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  status.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const statusTitle = document.createElement('strong');
  statusTitle.textContent = 'محیط دسکتاپ امن آماده است';

  const statusText = document.createElement('p');
  statusText.textContent = 'این لایه فقط نمایش و تعامل را مدیریت می‌کند و هیچ مدل، ضریب یا قاعده مهندسی جدیدی تولید نمی‌کند.';
  statusText.style.marginBottom = '0';
  statusText.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  status.append(statusTitle, statusText);
  main.append(eyebrow, heading, intro, status);
  layout.append(sidebar, main);
  root.appendChild(layout);
}
