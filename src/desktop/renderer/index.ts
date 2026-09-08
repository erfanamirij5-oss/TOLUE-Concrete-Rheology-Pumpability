import type { TolueBridge } from '../preload/tolueBridge';

export interface RendererPlatform {
  readonly exportEngineeringPdf: TolueBridge['exportEngineeringPdf'];
}

/**
 * Renderer-facing application boundary.
 * The renderer receives only the narrow preload contract; Electron, IPC,
 * filesystem paths and privileged APIs stay outside this module.
 */
export function createRendererPlatform(bridge: Readonly<TolueBridge>): Readonly<RendererPlatform> {
  if (!bridge || typeof bridge.exportEngineeringPdf !== 'function') {
    throw new Error('RENDERER-BRIDGE-001');
  }
  return Object.freeze({
    exportEngineeringPdf: request => bridge.exportEngineeringPdf(request),
  });
}

export function bootstrapRenderer(target: Document = document): Readonly<RendererPlatform> {
  const platform = createRendererPlatform(window.tolue);
  const root = target.getElementById('app');
  if (!root) throw new Error('RENDERER-ROOT-001');
  root.dataset.rendererReady = 'true';
  return platform;
}

if (typeof document !== 'undefined') bootstrapRenderer();
