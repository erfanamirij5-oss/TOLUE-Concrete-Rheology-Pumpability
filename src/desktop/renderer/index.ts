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

function installSampleResetControl(
  root: HTMLElement,
  onReset: () => void,
  sampleLoaded: boolean,
): void {
  const header = root.querySelector('header');
  if (!(header instanceof HTMLElement)) return;

  if (sampleLoaded) {
    const badge = document.createElement('span');
    badge.textContent = 'پروژه نمونه آموزشی';
    badge.dataset.sampleProjectBadge = 'true';
    Object.assign(badge.style, {
      fontSize: '11px',
      padding: '4px 7px',
      borderRadius: '5px',
      border: '1px solid #775d24',
      color: '#f0c96d',
      background: '#2a2418',
      whiteSpace: 'nowrap',
    });
    header.insertBefore(badge, header.lastElementChild);
  }

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'بازنشانی / پروژه خالی';
  reset.dataset.resetWorkspace = 'true';
  reset.title = 'تمام داده‌های نمایشی و ورودی‌های فعلی پاک و یک Draft صفر ایجاد می‌شود.';
  Object.assign(reset.style, {
    font: 'inherit',
    fontSize: '12px',
    color: '#e7edef',
    background: '#242c2f',
    border: '1px solid #4a565b',
    borderRadius: '5px',
    padding: '6px 9px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
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
