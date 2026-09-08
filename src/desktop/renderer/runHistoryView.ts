import type { EngineeringRunHistoryItem } from '../main/persistence/engineeringRunRepository';
import { TOLUE_DESIGN_TOKENS } from './designSystem';

export interface RunHistoryViewActions {
  readonly loadRun: (runId: string) => Promise<void>;
  readonly compareRuns?: (baselineRunId: string, candidateRunId: string) => Promise<void>;
}

export function renderRunHistoryView(root: HTMLElement, items: readonly Readonly<EngineeringRunHistoryItem>[], actions: Readonly<RunHistoryViewActions>): void {
  root.replaceChildren();
  const title = document.createElement('h2'); title.textContent = 'تاریخچه تحلیل‌ها'; title.style.marginTop = '0';
  const note = document.createElement('p'); note.textContent = 'فقط متادیتای ذخیره‌شده نمایش داده می‌شود. بازکردن یا مقایسه Runها هیچ تحلیل مجددی اجرا نمی‌کند.'; note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  root.append(title, note);
  if (items.length === 0) { const empty = document.createElement('p'); empty.textContent = 'هنوز Run ذخیره‌شده‌ای وجود ندارد.'; root.appendChild(empty); return; }

  let baselineRunId: string | null = null;
  let candidateRunId: string | null = null;
  const selection = document.createElement('p');
  const compare = document.createElement('button'); compare.type = 'button'; compare.textContent = 'مقایسه Baseline و Candidate'; compare.disabled = true; compare.style.fontFamily = 'inherit';
  const refresh = (): void => { selection.textContent = `Baseline: ${baselineRunId ?? '—'} · Candidate: ${candidateRunId ?? '—'}`; compare.disabled = !actions.compareRuns || !baselineRunId || !candidateRunId || baselineRunId === candidateRunId; };
  compare.addEventListener('click', () => { if (actions.compareRuns && baselineRunId && candidateRunId && baselineRunId !== candidateRunId) void actions.compareRuns(baselineRunId, candidateRunId); });
  refresh(); root.append(selection, compare);

  const list = document.createElement('div'); list.style.display = 'grid'; list.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  for (const item of items) {
    const card = document.createElement('article'); card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md; card.style.background = TOLUE_DESIGN_TOKENS.color.surface; card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const meta = document.createElement('div'); meta.textContent = `${item.runId} · ${item.createdAtIso} · ${item.executionStatus} · ${item.completeness}`;
    const open = document.createElement('button'); open.type = 'button'; open.textContent = 'بازکردن'; open.style.fontFamily = 'inherit'; open.addEventListener('click', () => { void actions.loadRun(item.runId); });
    const baseline = document.createElement('button'); baseline.type = 'button'; baseline.textContent = 'Baseline'; baseline.style.fontFamily = 'inherit'; baseline.addEventListener('click', () => { baselineRunId = item.runId; refresh(); });
    const candidate = document.createElement('button'); candidate.type = 'button'; candidate.textContent = 'Candidate'; candidate.style.fontFamily = 'inherit'; candidate.addEventListener('click', () => { candidateRunId = item.runId; refresh(); });
    card.append(meta, open, baseline, candidate); list.appendChild(card);
  }
  root.appendChild(list);
}
