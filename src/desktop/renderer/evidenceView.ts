import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PumpabilityEvidencePresentation } from './evidencePresentation';

function domainLabel(domain: PumpabilityEvidencePresentation['domain']): string {
  return domain === 'stability' ? 'پایداری' : 'ریسک انسداد';
}

export function renderEvidenceView(
  root: HTMLElement,
  evidence: readonly Readonly<PumpabilityEvidencePresentation>[] = [],
): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'شواهد پروژه‌ای پمپ‌پذیری');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'شواهد پروژه‌ای پایداری و انسداد';
  title.style.marginTop = '0';

  const note = document.createElement('p');
  note.textContent = 'این صفحه فقط شواهد ارزیابی‌شده توسط Engineering Core را نمایش می‌دهد. OUT_OF_DOMAIN هرگز extrapolate نمی‌شود و نتیجه‌ای برای آن ساخته نمی‌شود.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (evidence.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'هنوز شواهد معتبر پروژه‌ای دریافت نشده است.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;

  for (const item of evidence) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;

    const heading = document.createElement('strong');
    heading.textContent = `${domainLabel(item.domain)} — ${item.status}`;

    const outcome = document.createElement('div');
    outcome.textContent = `نتیجه: ${item.outcome ?? '—'}`;
    outcome.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;

    const flow = document.createElement('div');
    flow.textContent = `دبی هدف: ${item.targetFlowRateM3s} m³/s | دامنه معتبر: ${item.qualifiedFlowRangeM3s.min} تا ${item.qualifiedFlowRangeM3s.max} m³/s`;
    flow.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xs;
    flow.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

    const applicability = document.createElement('p');
    applicability.textContent = item.applicabilityStatement;
    applicability.style.marginBottom = '0';

    const trace = document.createElement('small');
    trace.textContent = `Evidence: ${item.evidenceId} | Provenance: ${item.provenanceEntityId} | Method: ${item.methodId}`;
    trace.style.display = 'block';
    trace.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    trace.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

    card.append(heading, outcome, flow, applicability, trace);
    grid.appendChild(card);
  }

  panel.appendChild(grid);
  root.appendChild(panel);
}
