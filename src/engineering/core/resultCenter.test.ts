import { describe, expect, it } from 'vitest';
import { buildEngineeringResultCenter, inputSnapshotFingerprint } from './resultCenter';
import { validateEngineeringResult } from './engineeringResult';
import { executeSimulationRun, SimulationRunInput } from './simulationRun';

const semanticRunInput: SimulationRunInput = {
  runId: 'RUN-RESULT-SEMANTICS',
  engineVersion: '0.1.0',
  createdAtIso: '2026-09-07T08:43:00+03:30',
  pipeline: {
    targetFlowRateM3s: 0.001,
    densityKgM3: 2400,
    lubricationLayerThicknessM: 0.002,
    bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 },
    lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 },
    segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 5 }],
  },
  pumpCapability: {
    capabilityCurve: [
      { flowRateM3s: 0, availableConcretePressurePa: 5_000_000 },
      { flowRateM3s: 0.002, availableConcretePressurePa: 4_000_000 },
    ],
    provenance: 'manufacturer_curve',
  },
};

describe('Engineering Result provenance contract', () => {
  it('creates deterministic fingerprints independent of object key order', () => {
    const a = inputSnapshotFingerprint({ flow: 0.01, pipe: { radius: 0.0625, length: 100 } });
    const b = inputSnapshotFingerprint({ pipe: { length: 100, radius: 0.0625 }, flow: 0.01 });
    expect(a).toBe(b);
    expect(a.startsWith('fnv1a32:')).toBe(true);
  });

  it('changes fingerprint when an engineering input changes', () => {
    expect(inputSnapshotFingerprint({ flow: 0.01 })).not.toBe(inputSnapshotFingerprint({ flow: 0.011 }));
  });

  it('keeps scientific validation and evidence documentation as independent dimensions', () => {
    const result = {
      id: 'pressure', label: 'Pressure', value: 1, unit: 'Pa',
      resultClass: 'PHYSICAL_MODEL' as const, methodId: 'model-v1', methodVersion: '0.1.0',
      referenceIds: [], standardEditionIds: [], applicability: 'test', assumptions: [], limitations: [],
      validationStatus: 'candidate' as const, evidenceStatus: 'DOCUMENTED' as const,
      inputSnapshotHash: 'fnv1a32:12345678', sourceRunId: 'run-1',
    };
    expect(() => validateEngineeringResult(result)).not.toThrow();
    expect(result.validationStatus).toBe('candidate');
    expect(result.evidenceStatus).toBe('DOCUMENTED');
  });

  it('classifies pump source data and arithmetic derivatives explicitly', () => {
    const center = buildEngineeringResultCenter(executeSimulationRun(semanticRunInput));
    const available = center.results.find(result => result.id === 'pump.availablePressure');
    const margin = center.results.find(result => result.id === 'pump.pressureMargin');
    const utilization = center.results.find(result => result.id === 'pump.pressureUtilization');

    expect(available?.resultClass).toBe('SOURCE_DATA');
    expect(margin?.resultClass).toBe('DERIVED_METRIC');
    expect(utilization?.resultClass).toBe('DERIVED_METRIC');
    expect(utilization?.unit).toBe('1');
  });

  it('keeps project-calibrated local loss distinct from source data and generic derived metrics', () => {
    const input: SimulationRunInput = {
      ...semanticRunInput,
      runId: 'RUN-LOCAL-SEMANTICS',
      pipeline: {
        ...semanticRunInput.pipeline,
        segments: [
          { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
          {
            id: 'E1', kind: 'elbow', elevationChangeM: 0,
            calibratedLocalLoss: {
              calibrationCurve: [
                { flowRateM3s: 0.0005, pressureLossPa: 10_000 },
                { flowRateM3s: 0.0015, pressureLossPa: 30_000 },
              ],
              provenanceEntityId: 'LOCAL-EVIDENCE-001',
              calibrationId: 'LOCAL-CAL-001',
            },
          },
        ],
      },
    };

    const center = buildEngineeringResultCenter(executeSimulationRun(input));
    const local = center.results.find(result => result.id === 'pipeline.segment.E1.calibratedLocalPressure');
    const required = center.results.find(result => result.id === 'pipeline.requiredPressure');
    const margin = center.results.find(result => result.id === 'pump.pressureMargin');

    expect(local?.resultClass).toBe('PROJECT_CALIBRATED_DATA');
    expect(local?.resultClass).not.toBe('SOURCE_DATA');
    expect(local?.resultClass).not.toBe('DERIVED_METRIC');
    expect(local?.provenanceEntityIds).toEqual(['LOCAL-EVIDENCE-001']);
    expect(local?.calibrationIds).toEqual(['LOCAL-CAL-001']);
    expect(local?.evidenceStatus).toBe('PRELIMINARY');
    expect(required?.evidenceStatus).toBe('PRELIMINARY');
    expect(margin?.evidenceStatus).toBe('PRELIMINARY');
  });

  it('does not promote scientific validation merely because evidence is documented', () => {
    const center = buildEngineeringResultCenter(executeSimulationRun(semanticRunInput));
    const available = center.results.find(result => result.id === 'pump.availablePressure');

    expect(available?.validationStatus).toBe('candidate');
    expect(available?.validationStatus).not.toBe('verified');
  });

  it('rejects a result without traceability identity', () => {
    expect(() => validateEngineeringResult({
      id: 'pressure', label: 'Pressure', value: 1, unit: 'Pa',
      resultClass: 'PHYSICAL_MODEL', methodId: '', methodVersion: '0.1.0',
      referenceIds: [], standardEditionIds: [], applicability: 'test', assumptions: [], limitations: [],
      validationStatus: 'candidate', evidenceStatus: 'NOT_ASSESSED', inputSnapshotHash: 'fnv1a32:12345678', sourceRunId: 'run-1',
    })).toThrow(/methodId/);
  });
});
