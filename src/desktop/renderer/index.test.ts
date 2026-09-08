import { describe, expect, it, vi } from 'vitest';
import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { TolueBridge } from '../preload/tolueBridge';
import { createRendererPlatform } from './index';

const pdfRequest: EngineeringPdfExportRequest = {
  runId: 'run-renderer', engineVersion: 'v1', inputSnapshotHash: 'hash-renderer', fileName: 'report.pdf',
  html: '<html dir="rtl">گزارش</html>', mediaType: 'application/pdf', sourceMediaType: 'text/html',
  rendererBoundary: 'privileged_desktop_main_process', scientificClaim: 'presentation_only_no_new_engineering_inference',
  method: 'tolue-engineering-pdf-export-request-v1',
  page: { format: 'A4', landscape: false, printBackground: true, preferCssPageSize: true, displayHeaderFooter: false,
    marginsMm: { top: 14, right: 14, bottom: 14, left: 14 } },
};

const analysisInput = {
  runId: 'run-analysis', engineVersion: 'v1', createdAtIso: '2026-09-09T00:00:00Z',
  pipeline: { targetFlowRateM3s: 0, densityKgM3: 2400, lubricationLayerThicknessM: 0.001,
    bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 }, lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 }, segments: [] },
} as SimulationRunInput;

describe('renderer application boundary', () => {
  it('exposes only typed analysis and PDF operations and preserves payload identity', async () => {
    const executeEngineeringAnalysis = vi.fn().mockResolvedValue({ status: 'REJECTED', result: null, errorCode: 'TEST', method: 'tolue-engineering-analysis-ipc-response-v1' });
    const exportEngineeringPdf = vi.fn().mockResolvedValue({
      runId: pdfRequest.runId, engineVersion: pdfRequest.engineVersion, inputSnapshotHash: pdfRequest.inputSnapshotHash,
      status: 'CANCELLED', savedFileName: null, bytesWritten: null, errorCode: null, method: 'tolue-engineering-pdf-ipc-response-v1',
    });
    const bridge: Readonly<TolueBridge> = Object.freeze({ executeEngineeringAnalysis, exportEngineeringPdf });
    const platform = createRendererPlatform(bridge);
    expect(Object.keys(platform)).toEqual(['executeEngineeringAnalysis', 'exportEngineeringPdf']);
    expect(Object.isFrozen(platform)).toBe(true);
    const inputSnapshot = structuredClone(analysisInput);
    await platform.executeEngineeringAnalysis(analysisInput);
    expect(executeEngineeringAnalysis).toHaveBeenCalledWith(analysisInput);
    expect(analysisInput).toEqual(inputSnapshot);
    const pdfSnapshot = structuredClone(pdfRequest);
    const result = await platform.exportEngineeringPdf(pdfRequest);
    expect(exportEngineeringPdf).toHaveBeenCalledWith(pdfRequest);
    expect(pdfRequest).toEqual(pdfSnapshot);
    expect(result).toMatchObject({ status: 'CANCELLED', runId: 'run-renderer' });
  });

  it('fails closed when either preload bridge operation is unavailable', () => {
    expect(() => createRendererPlatform({} as Readonly<TolueBridge>)).toThrow('RENDERER-BRIDGE-001');
  });
});
