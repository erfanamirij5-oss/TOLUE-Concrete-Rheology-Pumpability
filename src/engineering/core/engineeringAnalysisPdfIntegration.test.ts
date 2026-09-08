import { describe, expect, it } from 'vitest';
import { executeEngineeringAnalysis } from './engineeringAnalysis';
import { SimulationRunInput } from './simulationRun';

function input(): SimulationRunInput {
  return {
    runId: 'RUN-PDF-INTEGRATION-001',
    engineVersion: '0.1.0',
    createdAtIso: '2026-09-08T12:00:00.000Z',
    pipeline: {
      targetFlowRateM3s: 0.001,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.002,
      bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 },
      lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 },
      segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 }],
    },
    pumpCapability: {
      provenance: 'manufacturer_rated_point',
      capabilityCurve: [{ flowRateM3s: 0.001, availableConcretePressurePa: 2_000_000 }],
    },
  };
}

describe('engineering analysis PDF export integration', () => {
  it('propagates one run identity and hash into the PDF request', () => {
    const result = executeEngineeringAnalysis(input());
    expect(result.executionStatus).toBe('EXECUTED');
    if (result.executionStatus !== 'EXECUTED') throw new Error('expected executed analysis');

    expect(result.pdfExportRequest.runId).toBe(result.runId);
    expect(result.pdfExportRequest.engineVersion).toBe(result.engineVersion);
    expect(result.pdfExportRequest.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.pdfExportRequest.html).toBe(result.reportExport.html.content);
    expect(result.pdfExportRequest.mediaType).toBe('application/pdf');
    expect(result.pdfExportRequest.rendererBoundary).toBe('privileged_desktop_main_process');
  });

  it('keeps PDF output blocked when engineering readiness blocks execution', () => {
    const blocked = input();
    delete blocked.pumpCapability;
    const result = executeEngineeringAnalysis(blocked);
    expect(result.executionStatus).toBe('BLOCKED');
    expect(result.pdfExportRequest).toBeNull();
  });
});
