import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { TolueBridge } from '../preload/tolueBridge';
import { renderApplicationShell } from './applicationShell';

export interface RendererPlatform {
  readonly exportEngineeringPdf: TolueBridge['exportEngineeringPdf'];
}

/** Renderer receives only the narrow preload contract; privileged APIs stay outside. */
export function createRendererPlatform(bridge: Readonly<TolueBridge>): Readonly<RendererPlatform> {
  if (!bridge || typeof bridge.exportEngineeringPdf !== 'function') throw new Error('RENDERER-BRIDGE-001');
  return Object.freeze({ exportEngineeringPdf: (request: EngineeringPdfExportRequest) => bridge.exportEngineeringPdf(request) });
}

export function bootstrapRenderer(target: Document = document): Readonly<RendererPlatform> {
  const platform = createRendererPlatform(window.tolue);
  const root = target.getElementById('app');
  if (!root) throw new Error('RENDERER-ROOT-001');
  renderApplicationShell(root, undefined, { exportEngineeringPdf: platform.exportEngineeringPdf });
  root.dataset.rendererReady = 'true';
  return platform;
}

if (typeof document !== 'undefined') bootstrapRenderer();
