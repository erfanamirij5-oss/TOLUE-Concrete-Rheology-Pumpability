import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { TolueBridge } from '../preload/tolueBridge';
import { createNewEngineeringDraftState } from './applicationDataFlow';
import { renderApplicationShell } from './applicationShell';
import { installBrandIcon } from './brandIconCanvas';

export interface RendererPlatform {
  readonly executeEngineeringAnalysis: TolueBridge['executeEngineeringAnalysis'];
  readonly loadEngineeringRun: TolueBridge['loadEngineeringRun'];
  readonly listEngineeringRuns: TolueBridge['listEngineeringRuns'];
  readonly compareEngineeringRuns: TolueBridge['compareEngineeringRuns'];
  readonly exportEngineeringPdf: TolueBridge['exportEngineeringPdf'];
  readonly importVerificationEvidence: TolueBridge['importVerificationEvidence'];
}

export function createRendererPlatform(bridge: Readonly<TolueBridge>): Readonly<RendererPlatform> {
  if (!bridge || typeof bridge.executeEngineeringAnalysis !== 'function' || typeof bridge.loadEngineeringRun !== 'function' || typeof bridge.listEngineeringRuns !== 'function' || typeof bridge.compareEngineeringRuns !== 'function' || typeof bridge.exportEngineeringPdf !== 'function' || typeof bridge.importVerificationEvidence !== 'function') {
    throw new Error('RENDERER-BRIDGE-001');
  }
  return Object.freeze({
    executeEngineeringAnalysis: (input: SimulationRunInput) => bridge.executeEngineeringAnalysis(input),
    loadEngineeringRun: (runId: string) => bridge.loadEngineeringRun(runId),
    listEngineeringRuns: () => bridge.listEngineeringRuns(),
    compareEngineeringRuns: (baselineRunId: string, candidateRunId: string) => bridge.compareEngineeringRuns(baselineRunId, candidateRunId),
    exportEngineeringPdf: (request: EngineeringPdfExportRequest) => bridge.exportEngineeringPdf(request),
    importVerificationEvidence: () => bridge.importVerificationEvidence(),
  });
}

export function bootstrapRenderer(target: Document = document): Readonly<RendererPlatform> {
  const platform = createRendererPlatform(window.tolue);
  const root = target.getElementById('app');
  if (!root) throw new Error('RENDERER-ROOT-001');
  const runId = `draft-${crypto.randomUUID()}`;
  const dataFlow = createNewEngineeringDraftState(runId, new Date().toISOString());
  renderApplicationShell(root, dataFlow, {
    executeEngineeringAnalysis: platform.executeEngineeringAnalysis,
    loadEngineeringRun: platform.loadEngineeringRun,
    listEngineeringRuns: platform.listEngineeringRuns,
    compareEngineeringRuns: platform.compareEngineeringRuns,
    exportEngineeringPdf: platform.exportEngineeringPdf,
    importVerificationEvidence: platform.importVerificationEvidence,
  });
  installBrandIcon(root);
  root.dataset.rendererReady = 'true';
  root.dataset.engineeringDraftReady = 'true';
  return platform;
}

if (typeof document !== 'undefined') bootstrapRenderer();
