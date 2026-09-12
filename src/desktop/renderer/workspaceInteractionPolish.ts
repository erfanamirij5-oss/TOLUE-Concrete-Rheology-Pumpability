import { DEFAULT_BOTTOM_PANE_HEIGHT, installResizableWorkspace } from './resizableWorkspace';

export type CommercialRunState = 'ready' | 'running' | 'stale' | 'blocked';

export function deriveCommercialRunState(
  ariaBusy: string | null,
  disabled: boolean,
  statusText: string,
): CommercialRunState {
  if (ariaBusy === 'true') return 'running';
  if (statusText.includes('قدیمی') || statusText.includes('تغییر کرده')) return 'stale';
  if (disabled) return 'blocked';
  return 'ready';
}

export function commercialWorkspaceGridRows(): string {
  return `54px minmax(220px,1fr) 6px var(--tolue-bottom-height,${DEFAULT_BOTTOM_PANE_HEIGHT}px)`;
}

function decorateTreeSelection(tree: HTMLElement): void {
  for (const button of Array.from(tree.querySelectorAll('button'))) {
    if (!(button instanceof HTMLButtonElement)) continue;
    const active = !button.style.border.includes('transparent') && button.style.background !== 'transparent';
    const nextActive = active ? 'true' : 'false';
    if (button.dataset.active !== nextActive) button.dataset.active = nextActive;
    if (active) {
      if (button.getAttribute('aria-current') !== 'true') button.setAttribute('aria-current', 'true');
    } else if (button.hasAttribute('aria-current')) {
      button.removeAttribute('aria-current');
    }
  }
}

export function installWorkspaceInteractionPolish(root: HTMLElement, sampleLoaded: boolean): void {
  const shell = root.firstElementChild instanceof HTMLStyleElement ? root.children.item(1) : root.firstElementChild;
  const header = shell?.querySelector(':scope > header');
  const work = shell?.querySelector(':scope > header + div');
  if (!(shell instanceof HTMLElement) || !(header instanceof HTMLElement) || !(work instanceof HTMLElement)) return;

  // applicationShell starts with three rows. The resizable workspace inserts a dedicated
  // horizontal grip, so the shell must be switched to four explicit tracks inline.
  // Keeping the bottom track bound to the CSS variable lets the existing drag/collapse
  // logic resize the real bottom pane instead of creating an implicit blank grid row.
  shell.style.gridTemplateRows = commercialWorkspaceGridRows();

  const runButton = header.querySelector('button[aria-busy]');
  const statusNode = runButton?.previousElementSibling;
  if (runButton instanceof HTMLButtonElement) {
    runButton.dataset.runAction = 'true';
    runButton.setAttribute('aria-live', 'polite');
    const syncRunState = () => {
      const state = deriveCommercialRunState(
        runButton.getAttribute('aria-busy'),
        runButton.disabled,
        statusNode?.textContent ?? '',
      );
      if (runButton.dataset.runState !== state) runButton.dataset.runState = state;
      if (root.dataset.runState !== state) root.dataset.runState = state;
    };
    syncRunState();
    const observer = new MutationObserver(syncRunState);
    observer.observe(runButton, {
      attributes: true,
      attributeFilter: ['aria-busy', 'disabled'],
      childList: true,
      characterData: true,
      subtree: true,
    });
    if (statusNode) observer.observe(statusNode, { childList: true, characterData: true, subtree: true });
  }

  const tree = work.querySelector(':scope > aside:first-child');
  if (tree instanceof HTMLElement) {
    decorateTreeSelection(tree);
    const treeObserver = new MutationObserver(() => decorateTreeSelection(tree));
    treeObserver.observe(tree, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

    if (!sampleLoaded && !tree.querySelector('[data-blank-guidance="true"]')) {
      const guidance = document.createElement('div');
      guidance.dataset.blankGuidance = 'true';
      guidance.innerHTML = '<strong>پروژه خالی</strong><span>۱. پروژه و مصالح</span><span>۲. رئولوژی و پمپ</span><span>۳. مسیر خط لوله</span><span>۴. اجرای تحلیل</span>';
      const title = tree.firstElementChild;
      if (title?.nextSibling) tree.insertBefore(guidance, title.nextSibling);
      else tree.appendChild(guidance);
    }
  }

  if (root.dataset.resizableWorkspace !== 'true') {
    const viewport=work.querySelector(':scope > main');
    const inspector=work.querySelector(':scope > aside:last-child');
    const bottom=shell.querySelector(':scope > section');
    if (tree instanceof HTMLElement && viewport instanceof HTMLElement && inspector instanceof HTMLElement && bottom instanceof HTMLElement) {
      installResizableWorkspace({shell,work,tree,viewport,inspector,bottom});
      root.dataset.resizableWorkspace='true';
    }
  }
}
