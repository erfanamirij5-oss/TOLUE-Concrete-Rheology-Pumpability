import type { EngineeringRunHistoryItem } from '../main/persistence/engineeringRunRepository';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { canCompareSelectedRuns, clearRunHistoryComparisonSelection, createRunHistoryComparisonSelection, runHistorySelectionSummary, selectRunForComparison } from './runHistorySelection';

export interface RunHistoryViewActions {
  readonly loadRun: (runId: string) => Promise<void>;
  readonly compareRuns?: (baselineRunId: string, candidateRunId: string) => Promise<void>;
}

function executionStatusLabel(status: EngineeringRunHistoryItem['executionStatus']): string {
  if (status === 'EXECUTED') return 'اجراشده';
  if (status === 'BLOCKED') return 'مسدودشده';
  return status;
}

function completenessLabel(completeness: EngineeringRunHistoryItem['completeness']): string {
  return completeness === 'complete' ? 'کامل' : 'ناقص';
}

export function renderRunHistoryView(root: HTMLElement, items: readonly Readonly<EngineeringRunHistoryItem>[], actions: Readonly<RunHistoryViewActions>): void {
  root.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = 'فضای کاری تاریخچه و مقایسه';
  title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'تحلیل‌های ذخیره‌شده را باز کنید یا دو Run متفاوت را برای مقایسه انتخاب کنید. بازکردن و مقایسه، تحلیل مهندسی جدید اجرا نمی‌کند.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  root.append(title, note);

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'هنوز تحلیل ذخیره‌شده‌ای وجود ندارد. پس از اجرای تحلیل، Runهای ذخیره‌شده در این فضا نمایش داده می‌شوند.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
    root.appendChild(empty);
    return;
  }

  let selectionState = createRunHistoryComparisonSelection();
  const toolbar = document.createElement('section');
  toolbar.setAttribute('aria-label', 'انتخاب تحلیل‌های مقایسه');
  toolbar.style.display = 'grid';
  toolbar.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  toolbar.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  toolbar.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.lg;
  toolbar.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
  toolbar.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  toolbar.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const selection = document.createElement('strong');
  selection.setAttribute('aria-live', 'polite');
  const actionsRow = document.createElement('div');
  actionsRow.style.display = 'flex';
  actionsRow.style.flexWrap = 'wrap';
  actionsRow.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  const compare = document.createElement('button');
  compare.type = 'button';
  compare.textContent = 'مقایسه تحلیل‌های انتخاب‌شده';
  compare.style.fontFamily = 'inherit';
  compare.style.fontWeight = '700';
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.textContent = 'پاک‌کردن انتخاب‌ها';
  clear.style.fontFamily = 'inherit';

  const refresh = (): void => {
    selection.textContent = runHistorySelectionSummary(selectionState);
    compare.disabled = !actions.compareRuns || !canCompareSelectedRuns(selectionState);
    clear.disabled = selectionState.baselineRunId === null && selectionState.candidateRunId === null;
  };
  compare.addEventListener('click', () => {
    if (actions.compareRuns && canCompareSelectedRuns(selectionState)) void actions.compareRuns(selectionState.baselineRunId!, selectionState.candidateRunId!);
  });
  clear.addEventListener('click', () => {
    selectionState = clearRunHistoryComparisonSelection(selectionState);
    refresh();
  });
  actionsRow.append(compare, clear);
  toolbar.append(selection, actionsRow);
  refresh();
  root.appendChild(toolbar);

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const item of items) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surface;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

    const heading = document.createElement('strong');
    heading.textContent = item.runId;
    const meta = document.createElement('p');
    meta.textContent = `${item.createdAtIso} · ${executionStatusLabel(item.executionStatus)} · وضعیت داده: ${completenessLabel(item.completeness)}`;
    meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
    const open = document.createElement('button');
    open.type = 'button';
    open.textContent = 'بازکردن تحلیل';
    open.style.fontFamily = 'inherit';
    open.addEventListener('click', () => { void actions.loadRun(item.runId); });
    const baseline = document.createElement('button');
    baseline.type = 'button';
    baseline.textContent = 'انتخاب به‌عنوان مبنا';
    baseline.style.fontFamily = 'inherit';
    baseline.addEventListener('click', () => { selectionState = selectRunForComparison(selectionState, 'baseline', item.runId); refresh(); });
    const candidate = document.createElement('button');
    candidate.type = 'button';
    candidate.textContent = 'انتخاب به‌عنوان کاندید';
    candidate.style.fontFamily = 'inherit';
    candidate.addEventListener('click', () => { selectionState = selectRunForComparison(selectionState, 'candidate', item.runId); refresh(); });
    row.append(open, baseline, candidate);
    card.append(heading, meta, row);
    list.appendChild(card);
  }
  root.appendChild(list);
}
