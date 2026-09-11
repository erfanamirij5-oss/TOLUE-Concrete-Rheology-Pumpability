import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { TolueBridge } from '../preload/tolueBridge';
import { createBlankEngineeringDraftState, createSampleEngineeringDraftState, type ApplicationDataFlowState } from './applicationDataFlow';
import { renderApplicationShell } from './applicationShell';
import { installBrandIcon } from './brandIconCanvas';

export interface RendererPlatform {
  readonly executeEngineeringAnalysis: TolueBridge['executeEngineeringAnalysis'];
  readonly loadEngineeringRun: TolueBridge['loadEngineeringRun'];
  readonly listEngineeringRuns: TolueBridge['listEngineeringRuns'];
  readonly compareEngineeringRuns: TolueBridge['compareEngineeringRuns'];
  readonly exportEngineeringPdf: TolueBridge['exportEngineeringPdf'];
  readonly importVerificationEvidence: TolueBridge['importVerificationEvidence'];
  readonly listVerificationEvidencePackages: TolueBridge['listVerificationEvidencePackages'];
  readonly loadVerificationEvidencePackage: TolueBridge['loadVerificationEvidencePackage'];
}

export function createRendererPlatform(bridge: Readonly<TolueBridge>): Readonly<RendererPlatform> {
  if (!bridge || typeof bridge.executeEngineeringAnalysis !== 'function' || typeof bridge.loadEngineeringRun !== 'function' || typeof bridge.listEngineeringRuns !== 'function' || typeof bridge.compareEngineeringRuns !== 'function' || typeof bridge.exportEngineeringPdf !== 'function' || typeof bridge.importVerificationEvidence !== 'function' || typeof bridge.listVerificationEvidencePackages !== 'function' || typeof bridge.loadVerificationEvidencePackage !== 'function') {
    throw new Error('RENDERER-BRIDGE-001');
  }
  return Object.freeze({
    executeEngineeringAnalysis: (input: SimulationRunInput) => bridge.executeEngineeringAnalysis(input),
    loadEngineeringRun: (runId: string) => bridge.loadEngineeringRun(runId),
    listEngineeringRuns: () => bridge.listEngineeringRuns(),
    compareEngineeringRuns: (baselineRunId: string, candidateRunId: string) => bridge.compareEngineeringRuns(baselineRunId, candidateRunId),
    exportEngineeringPdf: (request: EngineeringPdfExportRequest) => bridge.exportEngineeringPdf(request),
    importVerificationEvidence: () => bridge.importVerificationEvidence(),
    listVerificationEvidencePackages: () => bridge.listVerificationEvidencePackages(),
    loadVerificationEvidencePackage: (packageId: string) => bridge.loadVerificationEvidencePackage(packageId),
  });
}

function installPersistentWorkspacePolish(root: HTMLElement): void {
  if (root.querySelector('style[data-tolue-workspace-polish="v2"]')) return;
  const style=document.createElement('style');
  style.dataset.tolueWorkspacePolish='v2';
  style.textContent=`
[data-commercial-ui="v2"] > div { min-width: 920px !important; }
[data-commercial-ui="v2"] > div > header button,
[data-commercial-ui="v2"] > div > div > aside button,
[data-commercial-ui="v2"] > div > section button { transition: background-color .15s ease,border-color .15s ease,color .15s ease,transform .12s ease,box-shadow .15s ease; }
[data-commercial-ui="v2"] > div > header button:hover,
[data-commercial-ui="v2"] > div > div > aside button:hover,
[data-commercial-ui="v2"] > div > section button:hover:not(:disabled) { border-color:#3c5362 !important; background:#1c2b35 !important; color:#f3f6f8 !important; }
[data-commercial-ui="v2"] > div > header button:active,
[data-commercial-ui="v2"] > div > div > aside button:active,
[data-commercial-ui="v2"] > div > section button:active:not(:disabled) { transform:translateY(1px); }
[data-commercial-ui="v2"] > div > header button:disabled,
[data-commercial-ui="v2"] > div > section button:disabled { opacity:.48; cursor:not-allowed !important; }
[data-commercial-ui="v2"] > div > div > aside:first-child button { position:relative; overflow:hidden; }
[data-commercial-ui="v2"] > div > div > aside:first-child button::after { content:""; position:absolute; inset-inline-start:0; top:7px; bottom:7px; width:2px; border-radius:4px; background:transparent; }
[data-commercial-ui="v2"] > div > div > aside:first-child button:hover::after { background:#2498c5; }
[data-commercial-ui="v2"] > div > section { border-top:1px solid #2b414f !important; background:linear-gradient(180deg,#101a21 0%,#0d151b 100%) !important; box-shadow:0 -10px 30px rgba(0,0,0,.20) !important; }
[data-commercial-ui="v2"] > div > section > div:first-child { min-height:38px; padding:4px 10px !important; gap:5px !important; background:linear-gradient(180deg,#142029,#101920); border-bottom:1px solid #263a47 !important; overflow-x:auto; overflow-y:hidden; scrollbar-width:thin; }
[data-commercial-ui="v2"] > div > section > div:first-child button { min-height:28px; padding:5px 10px !important; white-space:nowrap; border-radius:7px !important; }
[data-commercial-ui="v2"] > div > section > div:last-child { padding:10px 12px !important; background:radial-gradient(circle at 50% 0%,rgba(36,152,197,.035),transparent 42%); }
[data-commercial-ui="v2"] > div > div > aside { scrollbar-width:thin; scrollbar-color:#334b5a transparent; }
[data-commercial-ui="v2"] > div > div > main { border-inline:1px solid rgba(60,83,98,.25); }
[data-commercial-ui="v2"] input:focus,[data-commercial-ui="v2"] select:focus,[data-commercial-ui="v2"] textarea:focus { outline:none; border-color:#59b8df !important; box-shadow:0 0 0 2px rgba(89,184,223,.14); }
@media (max-width:1180px) {
  [data-commercial-ui="v2"] > div > div { grid-template-columns:220px minmax(0,1fr) 310px !important; }
}
@media (max-width:1020px) {
  [data-commercial-ui="v2"] > div > div { grid-template-columns:200px minmax(0,1fr) 286px !important; }
  [data-commercial-ui="v2"] > div > header { gap:6px !important; padding-inline:10px !important; }
  [data-commercial-ui="v2"] > div > header [data-product-stage="true"] { display:none; }
}
`;
  root.prepend(style);
}

function installCommercialWorkspaceChrome(root: HTMLElement, sampleLoaded: boolean): void {
  installPersistentWorkspacePolish(root);
  const shell=root.firstElementChild instanceof HTMLStyleElement ? root.children.item(1) : root.firstElementChild;
  const header = shell?.querySelector(':scope > header');
  if (header instanceof HTMLElement) {
    Object.assign(header.style, {
      minHeight: '54px',
      padding: '0 14px',
      gap: '10px',
      background: 'linear-gradient(180deg,#16232c 0%,#111a22 100%)',
      borderBottom: '1px solid #2b414f',
      boxShadow: '0 8px 24px rgba(0,0,0,.18)',
      position: 'relative',
      zIndex: '8',
    });
    if(!header.querySelector('[data-commercial-accent="true"]')){
      const accent = document.createElement('i');
      accent.dataset.commercialAccent = 'true';
      Object.assign(accent.style, { position:'absolute', insetInlineStart:'0', top:'0', bottom:'0', width:'3px', background:'#f59b32' });
      header.appendChild(accent);
    }

    if(!header.querySelector('[data-product-stage="true"]')){
      const stage = document.createElement('span');
      stage.textContent = 'PRE-PRODUCTION';
      stage.dataset.productStage = 'true';
      Object.assign(stage.style, {
        direction:'ltr', fontSize:'10px', fontWeight:'800', letterSpacing:'.09em', padding:'4px 7px',
        borderRadius:'999px', color:'#91d8f1', background:'rgba(36,152,197,.10)', border:'1px solid rgba(97,183,218,.28)', whiteSpace:'nowrap',
      });
      header.insertBefore(stage, header.lastElementChild);
    }
  }

  const work = shell?.querySelector(':scope > header + div');
  if (work instanceof HTMLElement) work.style.gridTemplateColumns = '248px minmax(0,1fr) 348px';

  const asides = work?.querySelectorAll(':scope > aside');
  const tree = asides?.item(0);
  const inspector = asides?.item(1);
  if (tree instanceof HTMLElement) {
    Object.assign(tree.style,{background:'linear-gradient(180deg,#111b23 0%,#0e171e 100%)',boxShadow:'inset -1px 0 #172832'});
    const title=tree.firstElementChild;
    if(title instanceof HTMLElement){title.textContent='پروژه و صحنه';Object.assign(title.style,{padding:'12px 12px 10px',letterSpacing:'.04em',color:'#b7c5cd',background:'rgba(255,255,255,.015)'});}
  }
  if (inspector instanceof HTMLElement) {
    Object.assign(inspector.style,{background:'linear-gradient(180deg,#121c24 0%,#0f181f 100%)',boxShadow:'inset 1px 0 #172832'});
    const title=inspector.firstElementChild;
    if(title instanceof HTMLElement){title.textContent='بازرس مهندسی';Object.assign(title.style,{padding:'12px',letterSpacing:'.035em',color:'#b7c5cd',background:'rgba(17,26,34,.96)',backdropFilter:'blur(8px)'});}
  }

  const viewport=work?.querySelector(':scope > main');
  if(viewport instanceof HTMLElement) Object.assign(viewport.style,{padding:'12px',background:'radial-gradient(circle at 50% 35%,#10222d 0%,#081218 48%,#060c10 100%)'});

  const bottom=shell?.querySelector(':scope > section');
  if(bottom instanceof HTMLElement) Object.assign(bottom.style,{background:'#0f181f',boxShadow:'0 -8px 28px rgba(0,0,0,.16)'});

  root.dataset.commercialUi = 'v2';
  root.dataset.workspaceMode = sampleLoaded ? 'sample' : 'blank';
}

function installSampleResetControl(
  root: HTMLElement,
  onReset: () => void,
  sampleLoaded: boolean,
): void {
  const shell=root.firstElementChild instanceof HTMLStyleElement ? root.children.item(1) : root.firstElementChild;
  const header = shell?.querySelector(':scope > header');
  if (!(header instanceof HTMLElement)) return;

  if (sampleLoaded) {
    const badge = document.createElement('span');
    badge.textContent = 'پروژه نمونه آموزشی';
    badge.dataset.sampleProjectBadge = 'true';
    Object.assign(badge.style, {
      fontSize: '11px', padding: '5px 9px', borderRadius: '999px', border: '1px solid rgba(245,155,50,.38)',
      color: '#ffc477', background: 'rgba(245,155,50,.10)', whiteSpace: 'nowrap', fontWeight:'700',
    });
    header.insertBefore(badge, header.lastElementChild);
  }

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'بازنشانی / پروژه خالی';
  reset.dataset.resetWorkspace = 'true';
  reset.title = 'تمام داده‌های نمایشی و ورودی‌های فعلی پاک و یک Draft صفر ایجاد می‌شود.';
  Object.assign(reset.style, {
    font: 'inherit', fontSize: '12px', color: '#dce6eb', background: '#17252f', border: '1px solid #334b5a',
    borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
  });
  reset.addEventListener('click', () => {
    const accepted = typeof window.confirm === 'function'
      ? window.confirm('تمام داده‌های فعلی پاک شوند و یک پروژه خالی با مقادیر صفر ساخته شود؟')
      : true;
    if (accepted) onReset();
  });
  header.insertBefore(reset, header.lastElementChild);
}

export function bootstrapRenderer(target: Document = document): Readonly<RendererPlatform> {
  const platform = createRendererPlatform(window.tolue);
  const root = target.getElementById('app');
  if (!root) throw new Error('RENDERER-ROOT-001');

  const actions = {
    executeEngineeringAnalysis: platform.executeEngineeringAnalysis,
    loadEngineeringRun: platform.loadEngineeringRun,
    listEngineeringRuns: platform.listEngineeringRuns,
    compareEngineeringRuns: platform.compareEngineeringRuns,
    exportEngineeringPdf: platform.exportEngineeringPdf,
    importVerificationEvidence: platform.importVerificationEvidence,
    listVerificationEvidencePackages: platform.listVerificationEvidencePackages,
    loadVerificationEvidencePackage: platform.loadVerificationEvidencePackage,
  };

  const renderWorkspace = (state: Readonly<ApplicationDataFlowState>, sampleLoaded: boolean): void => {
    renderApplicationShell(root, state, actions);
    installBrandIcon(root);
    installCommercialWorkspaceChrome(root, sampleLoaded);
    installSampleResetControl(root, () => {
      const blank = createBlankEngineeringDraftState(`draft-${crypto.randomUUID()}`, new Date().toISOString());
      renderWorkspace(blank, false);
      root.dataset.sampleProjectLoaded = 'false';
      root.dataset.blankDraftReady = 'true';
    }, sampleLoaded);
    root.dataset.sampleProjectLoaded = sampleLoaded ? 'true' : 'false';
    root.dataset.rendererReady = 'true';
    root.dataset.engineeringDraftReady = 'true';
  };

  const sample = createSampleEngineeringDraftState(`sample-${crypto.randomUUID()}`, new Date().toISOString());
  renderWorkspace(sample, true);
  return platform;
}

if (typeof document !== 'undefined') bootstrapRenderer();
