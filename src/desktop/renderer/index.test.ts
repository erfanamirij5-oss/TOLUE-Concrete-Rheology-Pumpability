import { describe, expect, it, vi } from 'vitest';
import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { TolueBridge } from '../preload/tolueBridge';
import { COMMERCIAL_WORKSPACE_LAYOUT, createRendererPlatform } from './index';

const pdfRequest: EngineeringPdfExportRequest = {
  runId: 'run-renderer', engineVersion: 'v1', inputSnapshotHash: 'hash-renderer', fileName: 'report.pdf', html: '<html dir="rtl">گزارش</html>',
  mediaType: 'application/pdf', sourceMediaType: 'text/html', rendererBoundary: 'privileged_desktop_main_process', scientificClaim: 'presentation_only_no_new_engineering_inference',
  method: 'tolue-engineering-pdf-export-request-v1', page: { format: 'A4', landscape: false, printBackground: true, preferCssPageSize: true, displayHeaderFooter: false, marginsMm: { top: 14, right: 14, bottom: 14, left: 14 } },
};
const analysisInput = { runId: 'run-analysis', engineVersion: 'v1', createdAtIso: '2026-09-09T00:00:00Z', pipeline: { targetFlowRateM3s: 0, densityKgM3: 2400, lubricationLayerThicknessM: 0.001, bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 }, lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 }, segments: [] } } as SimulationRunInput;

describe('renderer application boundary', () => {
  it('exposes typed analysis, run history/load/comparison, PDF, and verification operations', async () => {
    const executeEngineeringAnalysis = vi.fn().mockResolvedValue({ status: 'REJECTED', result: null, errorCode: 'TEST', method: 'tolue-engineering-analysis-ipc-response-v1' });
    const loadEngineeringRun = vi.fn().mockResolvedValue({ status: 'NOT_FOUND', input: null, result: null, errorCode: null, method: 'tolue-engineering-run-load-ipc-response-v1' });
    const listEngineeringRuns = vi.fn().mockResolvedValue({ status: 'SUCCESS', items: [], errorCode: null, method: 'tolue-engineering-run-history-ipc-response-v1' });
    const compareEngineeringRuns = vi.fn().mockResolvedValue({ status: 'NOT_FOUND', comparison: null, errorCode: null, method: 'tolue-engineering-run-comparison-ipc-response-v1' });
    const exportEngineeringPdf = vi.fn().mockResolvedValue({ runId: pdfRequest.runId, engineVersion: pdfRequest.engineVersion, inputSnapshotHash: pdfRequest.inputSnapshotHash, status: 'CANCELLED', savedFileName: null, bytesWritten: null, errorCode: null, method: 'tolue-engineering-pdf-ipc-response-v1' });
    const getLicenseStatus = vi.fn().mockResolvedValue({ status: 'ACTIVE', machineCode: 'machine', licenseId: 'license', validUntilIso: null, canUseApplication: true, errorCode: null, method: 'tolue-license-status-ipc-response-v1' });
    const importLicense = vi.fn().mockResolvedValue({ status: 'CANCELLED', licenseStatus: 'ACTIVE', licenseId: null, validUntilIso: null, errorCode: null, method: 'tolue-license-import-ipc-response-v1' });
    const importVerificationEvidence = vi.fn().mockResolvedValue({ status: 'CANCELLED', evidencePackage: null, errorCode: null, method: 'tolue-verification-evidence-import-ipc-response-v1' });
    const listVerificationEvidencePackages = vi.fn().mockResolvedValue({ status: 'SUCCESS', items: [], errorCode: null, method: 'tolue-verification-evidence-history-ipc-response-v1' });
    const loadVerificationEvidencePackage = vi.fn().mockResolvedValue({ status: 'NOT_FOUND', evidencePackage: null, errorCode: null, method: 'tolue-verification-evidence-load-ipc-response-v1' });
    const bridge: Readonly<TolueBridge> = Object.freeze({ executeEngineeringAnalysis, loadEngineeringRun, listEngineeringRuns, compareEngineeringRuns, exportEngineeringPdf, getLicenseStatus, importLicense, importVerificationEvidence, listVerificationEvidencePackages, loadVerificationEvidencePackage });
    const platform = createRendererPlatform(bridge);
    expect(Object.keys(platform)).toEqual(['executeEngineeringAnalysis', 'loadEngineeringRun', 'listEngineeringRuns', 'compareEngineeringRuns', 'exportEngineeringPdf', 'importVerificationEvidence', 'listVerificationEvidencePackages', 'loadVerificationEvidencePackage']);
    await platform.executeEngineeringAnalysis(analysisInput); expect(executeEngineeringAnalysis).toHaveBeenCalledWith(analysisInput);
    await platform.loadEngineeringRun('run-analysis'); expect(loadEngineeringRun).toHaveBeenCalledWith('run-analysis');
    await platform.listEngineeringRuns(); expect(listEngineeringRuns).toHaveBeenCalledOnce();
    await platform.compareEngineeringRuns('run-a', 'run-b'); expect(compareEngineeringRuns).toHaveBeenCalledWith('run-a', 'run-b');
    const result = await platform.exportEngineeringPdf(pdfRequest); expect(result).toMatchObject({ status: 'CANCELLED', runId: 'run-renderer' });
    await platform.importVerificationEvidence(); expect(importVerificationEvidence).toHaveBeenCalledOnce();
    await platform.listVerificationEvidencePackages(); expect(listVerificationEvidencePackages).toHaveBeenCalledOnce();
    await platform.loadVerificationEvidencePackage('VP-001'); expect(loadVerificationEvidencePackage).toHaveBeenCalledWith('VP-001');
  });

  it('keeps a usable center viewport and bounded bottom console at the commercial minimum width', () => {
    const centerWidthPx = COMMERCIAL_WORKSPACE_LAYOUT.minWidthPx - COMMERCIAL_WORKSPACE_LAYOUT.treeWidthPx - COMMERCIAL_WORKSPACE_LAYOUT.inspectorWidthPx;
    expect(centerWidthPx).toBeGreaterThanOrEqual(COMMERCIAL_WORKSPACE_LAYOUT.centerMinWidthPx);
    expect(COMMERCIAL_WORKSPACE_LAYOUT.bottomMinHeightPx).toBeGreaterThan(0);
    expect(COMMERCIAL_WORKSPACE_LAYOUT.bottomMaxHeightPx).toBeGreaterThan(COMMERCIAL_WORKSPACE_LAYOUT.bottomMinHeightPx);
    expect(COMMERCIAL_WORKSPACE_LAYOUT.bottomPreferredVh).toBeGreaterThan(0);
    expect(COMMERCIAL_WORKSPACE_LAYOUT.bottomPreferredVh).toBeLessThan(50);
  });

  it('fails closed when any preload bridge operation is unavailable', () => { expect(() => createRendererPlatform({} as Readonly<TolueBridge>)).toThrow('RENDERER-BRIDGE-001'); });
});