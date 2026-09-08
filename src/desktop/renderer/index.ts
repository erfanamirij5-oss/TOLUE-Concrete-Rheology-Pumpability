import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { TolueBridge } from '../preload/tolueBridge';
import { renderApplicationShell } from './applicationShell';

export interface RendererPlatform {
  readonly executeEngineeringAnalysis: TolueBridge['executeEngineeringAnalysis'];
  readonly loadEngineeringRun: TolueBridge['loadEngineeringRun'];
  readonly listEngineeringRuns: TolueBridge['listEngineeringRuns'];
  readonly exportEngineeringPdf: TolueBridge['exportEngineeringPdf'];
}

export function createRendererPlatform(bridge: Readonly<TolueBridge>): Readonly<RendererPlatform> {
  if (!bridge || typeof bridge.executeEngineeringAnalysis !== 'function' || typeof bridge.loadEngineeringRun !== 'function' || typeof bridge.listEngineeringRuns !== 'function' || typeof bridge.exportEngineeringPdf !== 'function') {
    throw new Error('RENDERER-BRIDGE-001');
  }
  return Object.freeze({
    executeEngineeringAnalysis: (input: SimulationRunInput) => bridge.executeEngineeringAnalysis(input),
    loadEngineeringRun: (runId: string) => bridge.loadEngineeringRun(runId),
    listEngineeringRuns: () => bridge.listEngineeringRuns(),
    exportEngineeringPdf: (request: EngineeringPdfExportRequest) => bridge.exportEngineeringPdf(request),
  });
}

export function bootstrapRenderer(target: Document = document): Readonly<RendererPlatform> {
  const platform = createRendererPlatform(window.tolue);
  const root = target.getElementById('app');
  if (!root) throw new Error('RENDERER-ROOT-001');
  renderApplicationShell(root, undefined, {
    executeEngineeringAnalysis: platform.executeEngineeringAnalysis,
    loadEngineeringRun: platform.loadEngineeringRun,
    listEngineeringRuns: platform.listEngineeringRuns,
    exportEngineeringPdf: platform.exportEngineeringPdf,
  });
  root.dataset.rendererReady = 'true';
  return platform;
}

if (typeof document !== 'undefined') bootstrapRenderer();
