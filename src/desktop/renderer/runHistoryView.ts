import type { EngineeringRunHistoryItem } from '../main/persistence/engineeringRunRepository';
import { TOLUE_DESIGN_TOKENS } from './designSystem';

export interface RunHistoryViewActions {
  readonly loadRun: (runId: string) => Promise<void>;
}

export function renderRunHistoryView(
  root: HTMLElement,
  items: readonly Readonly<EngineeringRunHistoryItem>[],
  actions: Readonly<RunHistoryViewActions>,
): void {
  root.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = 'تاریخچه تحلیل‌ها';
  title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'فقط متادیتای ذخیره‌شده نمایش داده می‌شود. بازکردن یک Run هیچ محاسبه مجددی انجام نمی‌دهد.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  root.append(title, note);

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'هنوز Run ذخیره‌شده‌ای وجود ندارد.';
    root.appendChild(empty);
    return;
  }

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  for (const item of items) {
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.runId = item.runId;
    card.style.textAlign = 'right';
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surface;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    card.style.fontFamily = 'inherit';
    card.textContent = `${item.runId} · ${item.createdAtIso} · ${item.executionStatus} · ${item.completeness}`;
    card.addEventListener('click', () => { void actions.loadRun(item.runId); });
    list.appendChild(card);
  }
  root.appendChild(list);
}
