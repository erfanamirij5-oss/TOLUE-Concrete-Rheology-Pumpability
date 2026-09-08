import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { createRheologyInputPresentation, type RheologyInputPresentation } from './rheologyPresentation';

const EMPTY_RHEOLOGY_INPUTS: readonly Readonly<RheologyInputPresentation>[] = Object.freeze([
  createRheologyInputPresentation({ modelFamily: 'BINGHAM', inputId: 'yield-stress', label: 'تنش تسلیم', value: null, unit: 'Pa' }),
  createRheologyInputPresentation({ modelFamily: 'BINGHAM', inputId: 'plastic-viscosity', label: 'ویسکوزیته پلاستیک', value: null, unit: 'Pa·s' }),
]);

export function renderRheologyView(root: HTMLElement, inputs: readonly Readonly<RheologyInputPresentation>[] = EMPTY_RHEOLOGY_INPUTS): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'ورودی‌های رئولوژی');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'داده‌های رئولوژی';
  title.style.marginTop = '0';

  const note = document.createElement('p');
  note.textContent = 'این صفحه فقط مقادیر و واحدهای ورودی/خروجی را نمایش می‌دهد. انتخاب مدل، اعتبارسنجی علمی و محاسبات در Engineering Core انجام می‌شوند.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
  grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;

  for (const input of inputs) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;

    const label = document.createElement('strong');
    label.textContent = input.label;
    const value = document.createElement('div');
    value.textContent = input.value === null ? `— ${input.unit}` : `${input.value} ${input.unit}`;
    value.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    value.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;

    const model = document.createElement('small');
    model.textContent = `Model contract: ${input.modelFamily}`;
    model.style.display = 'block';
    model.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    model.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    card.append(label, value, model);
    grid.appendChild(card);
  }

  panel.append(title, note, grid);
  root.appendChild(panel);
}
