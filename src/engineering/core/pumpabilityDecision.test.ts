import { describe, expect, it } from 'vitest';
import { assessPumpabilityDecision } from './pumpabilityDecision';
import { ProjectQualifiedPumpabilityEvidenceInput } from './projectQualifiedPumpabilityEvidence';
import { executeSimulationRun, SimulationRunInput } from './simulationRun';

function input(availablePressurePa: number): SimulationRunInput {
  return {
    runId: 'RUN-PUMPABILITY-DECISION',
    engineVersion: '0.1.0',
    createdAtIso: '2026-09-08T08:50:00+03:30',
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
      capabilityCurve: [{ flowRateM3s: 0.001, availableConcretePressurePa: availablePressurePa }],
    },
  };
}

function qualifiedEvidence(
  outcome: 'ACCEPTABLE' | 'UNACCEPTABLE',
): Omit<ProjectQualifiedPumpabilityEvidenceInput, 'targetFlowRateM3s' | 'domain'> {
  return {
    projectId: 'PROJECT-001',
    evidenceId: 'EVIDENCE-001',
    provenanceEntityId: 'PROV-001',
    methodId: 'project-qualified-test-v1',
    referenceIds: ['REF-001'],
    outcome,
    qualifiedFlowRangeM3s: { min: 0.0005, max: 0.0015 },
    applicabilityStatement: 'Qualified only for the documented project route/material system.',
    limitations: ['Not transferable without independent qualification.'],
  };
}

describe('TOLUE pumpability decision v2', () => {
  it('reports pressure-only acceptability without claiming stability or blockage safety', () => {
    const run = executeSimulationRun(input(5_000_000));
    const decision = assessPumpabilityDecision(run);

    expect(decision.pressureFeasibility).toBe('PASS');
    expect(decision.status).toBe('PRESSURE_ONLY_ACCEPTABLE');
    expect(decision.stability).toBe('NOT_ASSESSED');
    expect(decision.blockageRisk).toBe('NOT_ASSESSED');
    expect(decision.limitations.some(text => text.includes('not a complete pumpability'))).toBe(true);
  });

  it('produces project-qualified acceptable only when pressure, stability and blockage are all acceptable in-domain', () => {
    const runInput = input(5_000_000);
    runInput.pumpabilityEvidence = {
      stability: { ...qualifiedEvidence('ACCEPTABLE'), evidenceId: 'STAB-001', provenanceEntityId: 'PROV-STAB-001' },
      blockage: { ...qualifiedEvidence('ACCEPTABLE'), evidenceId: 'BLOCK-001', provenanceEntityId: 'PROV-BLOCK-001' },
    };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));

    expect(decision.pressureFeasibility).toBe('PASS');
    expect(decision.stability).toBe('ACCEPTABLE');
    expect(decision.blockageRisk).toBe('ACCEPTABLE');
    expect(decision.status).toBe('PROJECT_QUALIFIED_ACCEPTABLE');
    expect(decision.stabilityEvidence?.status).toBe('APPLICABLE');
    expect(decision.blockageEvidence?.status).toBe('APPLICABLE');
    expect(decision.sourceMethodIds).toContain('tolue-project-qualified-pumpability-evidence-v1');
  });

  it('fails stability when project-qualified stability evidence is explicitly unacceptable', () => {
    const runInput = input(5_000_000);
    runInput.pumpabilityEvidence = {
      stability: qualifiedEvidence('UNACCEPTABLE'),
    };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));

    expect(decision.stability).toBe('UNACCEPTABLE');
    expect(decision.status).toBe('FAIL_STABILITY');
  });

  it('fails blockage when project-qualified blockage evidence is explicitly unacceptable', () => {
    const runInput = input(5_000_000);
    runInput.pumpabilityEvidence = {
      blockage: qualifiedEvidence('UNACCEPTABLE'),
    };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));

    expect(decision.blockageRisk).toBe('UNACCEPTABLE');
    expect(decision.status).toBe('FAIL_BLOCKAGE');
  });

  it('does not extrapolate out-of-domain project evidence', () => {
    const runInput = input(5_000_000);
    runInput.pipeline.targetFlowRateM3s = 0.002;
    runInput.pumpCapability = {
      provenance: 'manufacturer_rated_point',
      capabilityCurve: [{ flowRateM3s: 0.002, availableConcretePressurePa: 5_000_000 }],
    };
    runInput.pumpabilityEvidence = {
      stability: qualifiedEvidence('ACCEPTABLE'),
    };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));

    expect(decision.stability).toBe('OUT_OF_DOMAIN');
    expect(decision.status).toBe('PRESSURE_ONLY_ACCEPTABLE');
    expect(decision.stabilityEvidence?.outcome).toBeNull();
  });

  it('fails on exact negative pressure capability before accepting project-qualified evidence', () => {
    const runInput = input(1);
    runInput.pumpabilityEvidence = {
      stability: qualifiedEvidence('ACCEPTABLE'),
      blockage: qualifiedEvidence('ACCEPTABLE'),
    };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));

    expect(decision.pressureFeasibility).toBe('FAIL');
    expect(decision.status).toBe('FAIL_PRESSURE');
  });

  it('returns insufficient data when pump capability is absent', () => {
    const { pumpCapability: _removed, ...withoutPump } = input(5_000_000);
    const run = executeSimulationRun(withoutPump);
    const decision = assessPumpabilityDecision(run);

    expect(decision.pressureFeasibility).toBe('INSUFFICIENT_DATA');
    expect(decision.status).toBe('INSUFFICIENT_DATA');
  });

  it('is deterministic and preserves source method traceability', () => {
    const run = executeSimulationRun(input(5_000_000));
    const a = assessPumpabilityDecision(run);
    const b = assessPumpabilityDecision(run);
    expect(a).toEqual(b);
    expect(a.sourceMethodIds).toEqual(run.methods);
    expect(a.method).toBe('tolue-pumpability-decision-v2');
  });
});
