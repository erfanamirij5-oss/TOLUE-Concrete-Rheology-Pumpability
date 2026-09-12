import type { EngineeringRunComparisonResult } from '../../engineering/core/engineeringRunComparison';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { comparisonDeltaLabel, comparisonRunStatusLabel, RUN_COMPARISON_INTERPRETATION_LABEL, RUN_COMPARISON_METHOD_LABEL } from './runComparisonUx';
import { assessmentStatusFa, unitFa } from './persianPresentation';

const value = (v: number | string | null, unit = ''): string => v === null ? '—' : `${typeof v === 'number' ? v.toPrecision(7) : assessmentStatusFa(v)}${unit ? ` ${unitFa(unit) ?? unit}` : ''}`;

function runCard(label: string, run: Readonly<EngineeringRunComparisonResult['baseline']>): HTMLElement {
  const card = document.createElement('article');
  card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
  card.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  const heading = document.createElement('strong');
  heading.textContent = `${label}: ${run.runId}`;
  const meta = document.createElement('p');
  meta.textContent = `${comparisonRunStatusLabel(run)} · نسخه هسته ${run.engineVersion}`;
  meta.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.xs} 0 0`;
  meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  const trace = document.createElement('code');
  trace.textContent = run.inputSnapshotHash ?? 'مسدودشده';
  trace.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;
  trace.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  card.append(heading, meta, trace);
  return card;
}

export function renderRunComparisonView(root: HTMLElement, comparison: Readonly<EngineeringRunComparisonResult>): void {
  root.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = 'مقایسه تحلیل‌های مهندسی';
  const note = document.createElement('p');
  note.textContent = RUN_COMPARISON_INTERPRETATION_LABEL;
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  root.append(title, note);

  const identity = document.createElement('section');
  identity.setAttribute('aria-label', 'هویت تحلیل‌های مقایسه‌شده');
  identity.style.display = 'grid';
  identity.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 1fr))';
  identity.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  identity.append(runCard('مبنا', comparison.baseline), runCard('مقایسه‌ای', comparison.candidate));
  root.appendChild(identity);

  const method = document.createElement('p');
  method.textContent = RUN_COMPARISON_METHOD_LABEL;
  method.style.fontWeight = '700';
  method.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  root.appendChild(method);

  const tableWrap = document.createElement('div');
  tableWrap.style.overflowX = 'auto';
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  const head = document.createElement('tr');
  for (const text of ['پارامتر', 'مبنا', 'مقایسه‌ای', 'تغییر نسبت به مبنا']) { const th = document.createElement('th'); th.textContent = text; th.style.textAlign = 'right'; th.style.padding = TOLUE_DESIGN_TOKENS.spacing.sm; head.appendChild(th); }
  table.appendChild(head);

  const scalars = [
    ['دبی هدف', comparison.targetFlowRate],
    ['فشار موردنیاز', comparison.requiredPressure],
    ['فشار در دسترس', comparison.availablePressure],
    ['حاشیه فشار', comparison.pressureMargin],
  ] as const;
  for (const [label, metric] of scalars) {
    const row = document.createElement('tr');
    const cells = [label, value(metric.baseline, metric.unit), value(metric.candidate, metric.unit), comparisonDeltaLabel(metric.deltaCandidateMinusBaseline, metric.unit)];
    for (const text of cells) { const td = document.createElement('td'); td.textContent = text; td.style.padding = TOLUE_DESIGN_TOKENS.spacing.sm; td.style.borderTop = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; row.appendChild(td); }
    table.appendChild(row);
  }
  const decisions = [
    ['امکان‌پذیری فشار', comparison.pressureFeasibility],
    ['پایداری', comparison.stability],
    ['ریسک انسداد', comparison.blockageRisk],
    ['تصمیم پمپ‌پذیری', comparison.pumpabilityDecision],
  ] as const;
  for (const [label, axis] of decisions) {
    const row = document.createElement('tr');
    for (const text of [label, value(axis.baseline), value(axis.candidate), '—']) { const td = document.createElement('td'); td.textContent = text; td.style.padding = TOLUE_DESIGN_TOKENS.spacing.sm; td.style.borderTop = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; row.appendChild(td); }
    table.appendChild(row);
  }
  tableWrap.appendChild(table);
  root.appendChild(tableWrap);

  const traceability = document.createElement('details');
  traceability.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  const summary = document.createElement('summary');
  summary.textContent = 'جزئیات روش و ردیابی مقایسه';
  const traceText = document.createElement('p');
  traceText.textContent = `شناسه روش: ${comparison.method} · ادعای تفسیری: ${comparison.interpretationClaim}`;
  traceText.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;
  traceText.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  traceability.append(summary, traceText);
  root.appendChild(traceability);
}
