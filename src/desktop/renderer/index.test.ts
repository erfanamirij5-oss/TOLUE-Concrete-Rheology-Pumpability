import { describe, expect, it, vi } from 'vitest';
import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { TolueBridge } from '../preload/tolueBridge';
import { createRendererPlatform } from './index';

const pdfRequest: EngineeringPdfExportRequest = {
  runId: 'run-renderer', engineVersion: 'v1', inputSnapshotHash: 'hash-renderer', fileName: 'report.pdf', html: '<html dir="rtl">گزارش</html>',
  mediaType: 'application/pdf', sourceMediaType: 'text/html', rendererBoundary: 'privileged_desktop_main_process', scientificClaim: 'presentation_only_no_new_engineering_inference',
  method: 'tolue-engineering-pdf-export-request-v1', page: { format: 'A4', landscape: false, printBackground: true, preferCssPageSize: true, displayHeaderFooter: false, marginsMm: { top: 14, right: 14, bottom: 14, left: 14 } },
};
const analysisInput = { runId: 'run-analysis', engineVersion: 'v1', createdAtIso: '2026-09-09T00:00:00Z', pipeline: { targetFlowRateM3s: 0, densityKgM3: 2400, lubricationLayerThicknessM: 0.001, bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 }, lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 }, segments: [] } } as SimulationRunInput;

describe('renderer application boundary', () => {
  it('exposes typed analysis, run history/load, and PDF operations', async () => {
    const executeEngineeringAnalysis = vi.fn().mockResolvedValue({ status: 'REJECTED', result: null, errorCode: 'TEST', method: 'tolue-engineering-analysis-ipc-response-v1' });
    const loadEngineeringRun = vi.fn().mockResolvedValue({ status: 'NOT_FOUND', input: null, result: null, errorCode: null, method: 'tolue-engineering-run-load-ipc-response-v1' });
    const listEngineeringRuns = vi.fn().mockResolvedValue({ status: 'SUCCESS', items: [], errorCode: null, method: 'tolue-engineering-run-history-ipc-response-v1' });
    const exportEngineeringPdf = vi.fn().mockResolvedValue({ runId: pdfRequest.runId, engineVersion: pdfRequest.engineVersion, inputSnapshotHash: pdfRequest.inputSnapshotHash, status: 'CANCELLED', savedFileName: null, bytesWritten: null, errorCode: null, method: 'tolue-engineering-pdf-ipc-response-v1' });
    const bridge: Readonly<TolueBridge> = Object.freeze({ executeEngineeringAnalysis, loadEngineeringRun, listEngineeringRuns, exportEngineeringPdf });
    const platform = createRendererPlatform(bridge);
    expect(Object.keys(platform)).toEqual(['executeEngineeringAnalysis', 'loadEngineeringRun', 'listEngineeringRuns', 'exportEngineeringPdf']);
    await platform.executeEngineeringAnalysis(analysisInput); expect(executeEngineeringAnalysis).toHaveBeenCalledWith(analysisInput);
    await platform.loadEngineeringRun('run-analysis'); expect(loadEngineeringRun).toHaveBeenCalledWith('run-analysis');
    await platform.listEngineeringRuns(); expect(listEngineeringRuns).toHaveBeenCalledOnce();
    const result = await platform.exportEngineeringPdf(pdfRequest); expect(result).toMatchObject({ status: 'CANCELLED', runId: 'run-renderer' });
  });
  it('fails closed when any preload bridge operation is unavailable', () => { expect(() => createRendererPlatform({} as Readonly<TolueBridge>)).toThrow('RENDERER-BRIDGE-001'); });
});
