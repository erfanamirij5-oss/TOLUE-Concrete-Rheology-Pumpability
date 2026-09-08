import type { EngineeringRunComparisonResult } from '../../engineering/core/engineeringRunComparison';
import { TOLUE_DESIGN_TOKENS } from './designSystem';

const value = (v: number | string | null, unit = ''): string => v === null ? '—' : `${typeof v === 'number' ? v.toPrecision(7) : v}${unit ? ` ${unit}` : ''}`;

export function renderRunComparisonView(root: HTMLElement, comparison: Readonly<EngineeringRunComparisonResult>): void {
  root.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = 'مقایسه Runهای مهندسی';
  const note = document.createElement('p');
  note.textContent = 'Delta = Candidate − Baseline. این نما هیچ رتبه‌بندی بهتر/بدتر، score یا threshold جدیدی تولید نمی‌کند.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  root.append(title, note);

  const identity = document.createElement('p');
  identity.textContent = `Baseline: ${comparison.baseline.runId} [${comparison.baseline.inputSnapshotHash ?? 'BLOCKED'}] · Candidate: ${comparison.candidate.runId} [${comparison.candidate.inputSnapshotHash ?? 'BLOCKED'}]`;
  root.appendChild(identity);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  const head = document.createElement('tr');
  for (const text of ['پارامتر', 'Baseline', 'Candidate', 'Delta']) { const th = document.createElement('th'); th.textContent = text; th.style.textAlign = 'right'; th.style.padding = TOLUE_DESIGN_TOKENS.spacing.sm; head.appendChild(th); }
  table.appendChild(head);

  const scalars = [
    ['Target flow', comparison.targetFlowRate],
    ['Required pressure', comparison.requiredPressure],
    ['Available pressure', comparison.availablePressure],
    ['Pressure margin', comparison.pressureMargin],
  ] as const;
  for (const [label, metric] of scalars) {
    const row = document.createElement('tr');
    for (const text of [label, value(metric.baseline, metric.unit), value(metric.candidate, metric.unit), value(metric.deltaCandidateMinusBaseline, metric.unit)]) { const td = document.createElement('td'); td.textContent = text; td.style.padding = TOLUE_DESIGN_TOKENS.spacing.sm; td.style.borderTop = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; row.appendChild(td); }
    table.appendChild(row);
  }
  const decisions = [
    ['Pressure feasibility', comparison.pressureFeasibility],
    ['Stability', comparison.stability],
    ['Blockage risk', comparison.blockageRisk],
    ['Pumpability decision', comparison.pumpabilityDecision],
  ] as const;
  for (const [label, axis] of decisions) {
    const row = document.createElement('tr');
    for (const text of [label, value(axis.baseline), value(axis.candidate), '—']) { const td = document.createElement('td'); td.textContent = text; td.style.padding = TOLUE_DESIGN_TOKENS.spacing.sm; td.style.borderTop = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; row.appendChild(td); }
    table.appendChild(row);
  }
  root.appendChild(table);
}
