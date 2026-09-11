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

function decorateTreeSelection(tree: HTMLElement): void {
  for (const button of Array.from(tree.querySelectorAll('button'))) {
    if (!(button instanceof HTMLButtonElement)) continue;
    const active = !button.style.border.includes('transparent') && button.style.background !== 'transparent';
    button.dataset.active = active ? 'true' : 'false';
    if (active) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
}

export function installWorkspaceInteractionPolish(root: HTMLElement, sampleLoaded: boolean): void {
  const shell = root.firstElementChild instanceof HTMLStyleElement ? root.children.item(1) : root.firstElementChild;
  const header = shell?.querySelector(':scope > header');
  const work = shell?.querySelector(':scope > header + div');
  if (!(header instanceof HTMLElement) || !(work instanceof HTMLElement)) return;

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
      runButton.dataset.runState = state;
      root.dataset.runState = state;
    };
    syncRunState();
    const observer = new MutationObserver(syncRunState);
    observer.observe(runButton, { attributes: true, childList: true, characterData: true, subtree: true });
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
}
