import { describe, expect, it } from 'vitest';
import { executeEngineeringAnalysis } from './engineeringAnalysis';
import { EngineeringInputProvenanceRecord, SimulationInputProvenance } from './inputProvenance';
import { SimulationRunInput } from './simulationRun';

function measuredRecord(entityId: string, unit: string): EngineeringInputProvenanceRecord {
  return {
    evidence: {
      entityId,
      entityKind: 'measurement_result',
      generatedByActivityId: `${entityId}-measurement`,
      uncertainty: {
        expandedUncertainty: 1,
        coverageFactor: 2,
        unit,
        evaluationMethodId: 'test-uncertainty-evaluation',
      },
    },
    activities: [{
      id: `${entityId}-measurement`,
      kind: 'measurement',
      methodId: 'test-measurement-method',
      agentIds: ['TEST-INSTRUMENT'],
      calibrationChain: [{ calibrationId: 'TEST-CAL-001', referenceId: 'TEST-REF-001' }],
    }],
    agents: [{ id: 'TEST-INSTRUMENT', kind: 'equipment' }],
  };
}

function provenance(): SimulationInputProvenance {
  return {
    bulkRheology: measuredRecord('bulk-rheology', 'Pa'),
    lubricationLayerRheology: measuredRecord('ll-rheology', 'Pa'),
    lubricationLayerThickness: {
      evidence: {
        entityId: 'll-thickness',
        entityKind: 'derived_result',
        generatedByActivityId: 'll-thickness-derivation',
        sourceEntityIds: ['ll-project-test-data'],
      },
      activities: [{ id: 'll-thickness-derivation', kind: 'derivation', methodId: 'project-ll-calibration-v1', agentIds: ['TOLUE'] }],
      agents: [{ id: 'TOLUE', kind: 'software' }],
    },
    pumpCapability: {
      evidence: {
        entityId: 'pump-curve',
        entityKind: 'manufacturer_data',
        generatedByActivityId: 'pump-declaration',
        sourceDocumentId: 'pump-datasheet-v1',
      },
      activities: [{ id: 'pump-declaration', kind: 'manufacturer_declaration', agentIds: ['PUMP-MFR'] }],
      agents: [{ id: 'PUMP-MFR', kind: 'organization' }],
    },
    localLossCalibrations: {
      'LOCAL-EVIDENCE-001': {
        evidence: {
          entityId: 'LOCAL-EVIDENCE-001',
          entityKind: 'derived_result',
          generatedByActivityId: 'LOCAL-CAL-001',
          sourceEntityIds: ['project-local-loss-test-data'],
          referenceIds: ['project-local-loss-record-001'],
        },
        activities: [{
          id: 'LOCAL-CAL-001',
          kind: 'derivation',
          methodId: 'project-calibrated-local-loss-curve-v1',
          agentIds: ['TOLUE'],
        }],
        agents: [{ id: 'TOLUE', kind: 'software' }],
      },
    },
  };
}

function fullRunInput(): SimulationRunInput {
  return {
    runId: 'FULL-RUN-LOCAL-001',
    engineVersion: '0.1.0',
    createdAtIso: '2026-09-08T00:30:00+03:30',
    pipeline: {
      targetFlowRateM3s: 0.001,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.002,
      bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 },
      lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 },
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 2 },
        {
          id: 'E1',
          kind: 'elbow',
          elevationChangeM: 1,
          calibratedLocalLoss: {
            calibrationCurve: [
              { flowRateM3s: 0.0005, pressureLossPa: 10_000 },
              { flowRateM3s: 0.0015, pressureLossPa: 30_000 },
            ],
            provenanceEntityId: 'LOCAL-EVIDENCE-001',
            calibrationId: 'LOCAL-CAL-001',
          },
        },
        { id: 'S2', kind: 'straight', lengthM: 20, pipeRadiusM: 0.0625, elevationChangeM: -0.5 },
      ],
    },
    pumpCapability: {
      provenance: 'manufacturer_curve',
      capabilityCurve: [
        { flowRateM3s: 0.0005, availableConcretePressurePa: 5_000_000 },
        { flowRateM3s: 0.0015, availableConcretePressurePa: 4_000_000 },
      ],
    },
    provenance: provenance(),
  };
}

describe('full mixed-source engineering regression', () => {
  it('closes pressure, provenance, profile and pump semantics end-to-end as preliminary engineering', () => {
    const result = executeEngineeringAnalysis(fullRunInput());
    expect(result.readiness.status).toBe('PRELIMINARY');
    expect(result.readiness.findings.some(f => f.ruleId === 'RG-MODEL-COMMERCIAL-001')).toBe(true);
    expect(result.executionStatus).toBe('EXECUTED');
    if (result.executionStatus !== 'EXECUTED') throw new Error('expected executed analysis');

    const pipeline = result.simulation.pipeline;
    expect(pipeline.completeness).toBe('complete');
    expect(pipeline.calibratedLocalFrictionPressurePa).toBeCloseTo(20_000, 8);
    expect(pipeline.requiredPressurePa).toBeCloseTo(
      pipeline.straightFrictionPressurePa + pipeline.calibratedLocalFrictionPressurePa + pipeline.elevationPressurePa,
      8,
    );

    expect(result.simulation.pressureProfile.points[0]!.remainingRequiredPressurePa).toBeCloseTo(pipeline.requiredPressurePa!, 8);
    expect(result.simulation.hydraulicInvariants.status).toBe('consistent');
    expect(result.simulation.methods).toContain('tolue-project-calibrated-local-loss-v1');

    const local = result.resultCenter.results.find(item => item.id === 'pipeline.segment.E1.calibratedLocalPressure');
    const required = result.resultCenter.results.find(item => item.id === 'pipeline.requiredPressure');
    const margin = result.resultCenter.results.find(item => item.id === 'pump.pressureMargin');

    expect(local?.resultClass).toBe('PROJECT_CALIBRATED_DATA');
    expect(local?.evidenceStatus).toBe('DOCUMENTED');
    expect(local?.provenanceEntityIds).toEqual(['LOCAL-EVIDENCE-001']);
    expect(local?.calibrationIds).toEqual(['LOCAL-CAL-001']);
    expect(required?.evidenceStatus).toBe('DOCUMENTED');
    expect(margin?.resultClass).toBe('DERIVED_METRIC');
    expect(margin?.evidenceStatus).toBe('DOCUMENTED');
    expect(result.resultCenter.inputSnapshotHash).toBe(result.inputSnapshotHash);
  });

  it('changes the run fingerprint when the project calibration curve changes', () => {
    const a = executeEngineeringAnalysis(fullRunInput());
    const changed = fullRunInput();
    const elbow = changed.pipeline.segments[1]!;
    if (elbow.kind === 'straight' || !elbow.calibratedLocalLoss) throw new Error('expected calibrated local segment');
    elbow.calibratedLocalLoss.calibrationCurve[1] = { flowRateM3s: 0.0015, pressureLossPa: 31_000 };
    const b = executeEngineeringAnalysis(changed);

    expect(a.executionStatus).toBe('EXECUTED');
    expect(b.executionStatus).toBe('EXECUTED');
    if (a.executionStatus !== 'EXECUTED' || b.executionStatus !== 'EXECUTED') throw new Error('expected executed analyses');
    expect(a.inputSnapshotHash).not.toBe(b.inputSnapshotHash);
    expect(a.simulation.pipeline.requiredPressurePa).not.toBe(b.simulation.pipeline.requiredPressurePa);
  });
});
