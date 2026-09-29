import { describe, expect, it } from 'vitest';
import { assessPumpabilityDecision } from './pumpabilityDecision';
import { ProjectQualifiedPumpabilityEvidenceInput } from './projectQualifiedPumpabilityEvidence';
import { executeSimulationRun, SimulationRunInput } from './simulationRun';

function input(availablePressurePa: number): SimulationRunInput {
  return {
    runId: 'RUN-PUMPABILITY-DECISION', engineVersion: '0.1.0', createdAtIso: '2026-09-08T08:50:00+03:30',
    pipeline: { targetFlowRateM3s: 0.001, densityKgM3: 2400, lubricationLayerThicknessM: 0.002, bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 }, lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 }, segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 }] },
    pumpCapability: { provenance: 'manufacturer_rated_point', capabilityCurve: [{ flowRateM3s: 0.001, availableConcretePressurePa: availablePressurePa }] },
  };
}

function qualifiedEvidence(outcome: 'ACCEPTABLE' | 'UNACCEPTABLE'): Omit<ProjectQualifiedPumpabilityEvidenceInput, 'targetFlowRateM3s' | 'domain'> {
  return { projectId: 'PROJECT-001', evidenceId: 'EVIDENCE-001', provenanceEntityId: 'PROV-001', methodId: 'project-qualified-test-v1', referenceIds: ['REF-001'], outcome, qualifiedFlowRangeM3s: { min: 0.0005, max: 0.0015 }, applicabilityStatement: 'Qualified only for the documented project route/material system.', limitations: ['Not transferable without independent qualification.'] };
}

describe('TOLUE pumpability decision v3', () => {
  it('reports pressure-only acceptability when neither screening nor project evidence is supplied', () => {
    const decision = assessPumpabilityDecision(executeSimulationRun(input(5_000_000)));
    expect(decision.pressureFeasibility).toBe('PASS');
    expect(decision.status).toBe('PRESSURE_ONLY_ACCEPTABLE');
    expect(decision.stability).toBe('NOT_ASSESSED');
    expect(decision.blockageRisk).toBe('NOT_ASSESSED');
  });

  it('automatically assesses stability and blockage when screening inputs are supplied', () => {
    const runInput = input(5_000_000);
    runInput.pumpabilityRiskScreening = {
      nominalMaximumAggregateSizeM: 0.019,
      suspendingPhaseYieldStressPa: 15,
      suspendingPhaseDensityKgM3: 2200,
      coarseAggregateDensityKgM3: 2650,
    };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));
    expect(decision.pressureFeasibility).toBe('PASS');
    expect(decision.stability).toBe('ACCEPTABLE');
    expect(decision.blockageRisk).toBe('ACCEPTABLE');
    expect(decision.stabilityBasis).toBe('ENGINEERING_SCREENING');
    expect(decision.blockageBasis).toBe('ENGINEERING_SCREENING');
    expect(decision.status).toBe('SCREENED_ACCEPTABLE');
    expect(decision.riskScreening?.stability.criticalYieldStressPa).not.toBeNull();
    expect(decision.sourceMethodIds).toContain('tolue-pumpability-risk-screening-v1');
  });

  it('fails the blockage axis when automatic geometry screen exceeds the conservative limit', () => {
    const runInput = input(5_000_000);
    runInput.pumpabilityRiskScreening = { nominalMaximumAggregateSizeM: 0.05, suspendingPhaseYieldStressPa: 30, suspendingPhaseDensityKgM3: 2200, coarseAggregateDensityKgM3: 2650 };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));
    expect(decision.blockageRisk).toBe('UNACCEPTABLE');
    expect(decision.blockageBasis).toBe('ENGINEERING_SCREENING');
    expect(decision.status).toBe('FAIL_BLOCKAGE');
  });

  it('fails the stability axis when automatic Roussel screen is below critical yield stress', () => {
    const runInput = input(5_000_000);
    runInput.pumpabilityRiskScreening = { nominalMaximumAggregateSizeM: 0.02, suspendingPhaseYieldStressPa: 1, suspendingPhaseDensityKgM3: 2200, coarseAggregateDensityKgM3: 2700 };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));
    expect(decision.stability).toBe('UNACCEPTABLE');
    expect(decision.stabilityBasis).toBe('ENGINEERING_SCREENING');
    expect(decision.status).toBe('FAIL_STABILITY');
  });

  it('produces project-qualified acceptable only when pressure, stability and blockage are all acceptable in-domain', () => {
    const runInput = input(5_000_000);
    runInput.pumpabilityEvidence = { stability: { ...qualifiedEvidence('ACCEPTABLE'), evidenceId: 'STAB-001', provenanceEntityId: 'PROV-STAB-001' }, blockage: { ...qualifiedEvidence('ACCEPTABLE'), evidenceId: 'BLOCK-001', provenanceEntityId: 'PROV-BLOCK-001' } };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));
    expect(decision.stability).toBe('ACCEPTABLE'); expect(decision.blockageRisk).toBe('ACCEPTABLE'); expect(decision.status).toBe('PROJECT_QUALIFIED_ACCEPTABLE');
    expect(decision.stabilityEvidence?.status).toBe('APPLICABLE'); expect(decision.blockageEvidence?.status).toBe('APPLICABLE');
  });

  it('gives applicable project-qualified evidence priority over automatic screening', () => {
    const runInput = input(5_000_000);
    runInput.pumpabilityRiskScreening = { nominalMaximumAggregateSizeM: 0.019, suspendingPhaseYieldStressPa: 20, suspendingPhaseDensityKgM3: 2200, coarseAggregateDensityKgM3: 2650 };
    runInput.pumpabilityEvidence = { stability: qualifiedEvidence('UNACCEPTABLE') };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));
    expect(decision.stability).toBe('UNACCEPTABLE');
    expect(decision.stabilityBasis).toBe('PROJECT_QUALIFIED_EVIDENCE');
    expect(decision.status).toBe('FAIL_STABILITY');
  });

  it('fails stability when project-qualified stability evidence is explicitly unacceptable', () => {
    const runInput = input(5_000_000); runInput.pumpabilityEvidence = { stability: qualifiedEvidence('UNACCEPTABLE') };
    expect(assessPumpabilityDecision(executeSimulationRun(runInput)).status).toBe('FAIL_STABILITY');
  });

  it('fails blockage when project-qualified blockage evidence is explicitly unacceptable', () => {
    const runInput = input(5_000_000); runInput.pumpabilityEvidence = { blockage: qualifiedEvidence('UNACCEPTABLE') };
    expect(assessPumpabilityDecision(executeSimulationRun(runInput)).status).toBe('FAIL_BLOCKAGE');
  });

  it('does not extrapolate out-of-domain project evidence when no automatic screen is supplied', () => {
    const runInput = input(5_000_000); runInput.pipeline.targetFlowRateM3s = 0.002; runInput.pumpCapability = { provenance: 'manufacturer_rated_point', capabilityCurve: [{ flowRateM3s: 0.002, availableConcretePressurePa: 5_000_000 }] }; runInput.pumpabilityEvidence = { stability: qualifiedEvidence('ACCEPTABLE') };
    const decision = assessPumpabilityDecision(executeSimulationRun(runInput));
    expect(decision.stability).toBe('OUT_OF_DOMAIN'); expect(decision.status).toBe('PRESSURE_ONLY_ACCEPTABLE'); expect(decision.stabilityEvidence?.outcome).toBeNull();
  });

  it('fails on exact negative pressure capability before accepting project-qualified evidence', () => {
    const runInput = input(1); runInput.pumpabilityEvidence = { stability: qualifiedEvidence('ACCEPTABLE'), blockage: qualifiedEvidence('ACCEPTABLE') };
    expect(assessPumpabilityDecision(executeSimulationRun(runInput)).status).toBe('FAIL_PRESSURE');
  });

  it('returns insufficient data when pump capability is absent', () => {
    const { pumpCapability: _removed, ...withoutPump } = input(5_000_000);
    expect(assessPumpabilityDecision(executeSimulationRun(withoutPump)).status).toBe('INSUFFICIENT_DATA');
  });

  it('is deterministic and preserves source method traceability', () => {
    const run = executeSimulationRun(input(5_000_000));
    const a = assessPumpabilityDecision(run); const b = assessPumpabilityDecision(run);
    expect(a).toEqual(b); expect(a.sourceMethodIds).toEqual(run.methods); expect(a.method).toBe('tolue-pumpability-decision-v3');
  });
});
