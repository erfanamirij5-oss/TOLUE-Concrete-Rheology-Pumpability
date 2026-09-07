import { describe, expect, it } from 'vitest';
import { assessInputEvidence, EngineeringInputProvenanceRecord, SimulationInputProvenance } from './inputProvenance';

function measuredRecord(entityId: string): EngineeringInputProvenanceRecord {
  return {
    evidence: {
      entityId,
      entityKind: 'measurement_result',
      generatedByActivityId: `${entityId}-measurement`,
      uncertainty: { expandedUncertainty: 1, coverageFactor: 2, unit: 'Pa', evaluationMethodId: 'GUM-compatible-evaluation' },
    },
    activities: [{
      id: `${entityId}-measurement`,
      kind: 'measurement',
      methodId: 'rheometer-method',
      startedAtIso: '2026-09-06T00:00:00.000Z',
      endedAtIso: '2026-09-06T00:05:00.000Z',
      agentIds: ['RHEO-01'],
      calibrationChain: [{ calibrationId: 'CAL-001', referenceId: 'LAB-REF-001', calibratedAtIso: '2026-08-01T00:00:00.000Z' }],
    }],
    agents: [{ id: 'RHEO-01', kind: 'equipment', label: 'Concrete rheometer' }],
  };
}

function localLossRecord(entityId: string): EngineeringInputProvenanceRecord {
  return {
    evidence: {
      entityId,
      entityKind: 'derived_result',
      generatedByActivityId: `${entityId}-derivation`,
      sourceEntityIds: [`${entityId}-field-data`],
      referenceIds: ['PROJECT-PUMP-TEST-001'],
    },
    activities: [{
      id: `${entityId}-derivation`,
      kind: 'derivation',
      methodId: 'project-local-loss-calibration-v1',
      agentIds: ['TOLUE'],
    }],
    agents: [{ id: 'TOLUE', kind: 'software' }],
  };
}

function documented(): SimulationInputProvenance {
  return {
    bulkRheology: measuredRecord('bulk-rheology'),
    lubricationLayerRheology: measuredRecord('ll-rheology'),
    lubricationLayerThickness: {
      evidence: { entityId: 'll-thickness', entityKind: 'derived_result', generatedByActivityId: 'll-derivation', sourceEntityIds: ['project-test-data'] },
      activities: [{ id: 'll-derivation', kind: 'derivation', methodId: 'project-calibration-v1', agentIds: ['TOLUE'] }],
      agents: [{ id: 'TOLUE', kind: 'software' }],
    },
    pumpCapability: {
      evidence: { entityId: 'pump-curve', entityKind: 'manufacturer_data', generatedByActivityId: 'manufacturer-declaration', sourceDocumentId: 'pump-datasheet-v3' },
      activities: [{ id: 'manufacturer-declaration', kind: 'manufacturer_declaration', agentIds: ['PUMP-MFR'] }],
      agents: [{ id: 'PUMP-MFR', kind: 'organization' }],
    },
  };
}

describe('TOLUE input provenance v3', () => {
  it('returns DOCUMENTED for structurally complete lineage without claiming physical verification', () => {
    const result = assessInputEvidence(documented());
    expect(result.status).toBe('DOCUMENTED');
    expect(result.method).toBe('tolue-input-provenance-v3');
    expect(result.findings).toEqual([]);
  });

  it('assesses project-calibrated local-loss evidence as a first-class provenance record', () => {
    const input = documented();
    input.localLossCalibrations = {
      'project-elbow-evidence-001': localLossRecord('project-elbow-evidence-001'),
    };
    const result = assessInputEvidence(input);
    expect(result.status).toBe('DOCUMENTED');
    expect(result.findings).toEqual([]);
  });

  it('blocks a local-loss provenance map key that does not match evidence.entityId', () => {
    const input = documented();
    input.localLossCalibrations = {
      'project-elbow-evidence-001': localLossRecord('different-entity'),
    };
    const result = assessInputEvidence(input);
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.some(f => f.ruleId === 'PROV-LOCAL-002')).toBe(true);
  });

  it('marks explicit engineering assumptions PRELIMINARY', () => {
    const input = documented();
    input.lubricationLayerThickness = {
      evidence: { entityId: 'll-assumption', entityKind: 'engineering_assumption', generatedByActivityId: 'assume-ll', note: 'Scenario assumption' },
      activities: [{ id: 'assume-ll', kind: 'assumption', agentIds: ['ENG-01'] }],
      agents: [{ id: 'ENG-01', kind: 'person' }],
    };
    const result = assessInputEvidence(input);
    expect(result.status).toBe('PRELIMINARY');
    expect(result.findings.some(f => f.ruleId === 'PROV-ASSUMPTION-001')).toBe(true);
  });

  it('does not call a measurement documented when uncertainty is absent', () => {
    const input = documented();
    const { uncertainty: _omitted, ...evidenceWithoutUncertainty } = input.bulkRheology.evidence;
    input.bulkRheology.evidence = evidenceWithoutUncertainty;
    const result = assessInputEvidence(input);
    expect(result.status).toBe('PRELIMINARY');
    expect(result.findings.some(f => f.ruleId === 'PROV-MEAS-003')).toBe(true);
  });

  it('blocks broken entity-to-activity lineage', () => {
    const input = documented();
    input.bulkRheology.evidence.generatedByActivityId = 'missing-activity';
    const result = assessInputEvidence(input);
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.some(f => f.ruleId === 'PROV-LINEAGE-003')).toBe(true);
  });

  it('blocks activities that reference unknown agents', () => {
    const input = documented();
    input.bulkRheology.activities[0]!.agentIds = ['UNKNOWN'];
    const result = assessInputEvidence(input);
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.some(f => f.ruleId === 'PROV-AGENT-001')).toBe(true);
  });

  it('blocks malformed activity timestamps', () => {
    const input = documented();
    input.bulkRheology.activities[0]!.startedAtIso = 'not-a-date';
    const result = assessInputEvidence(input);
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.some(f => f.ruleId === 'PROV-TIME-001')).toBe(true);
  });

  it('is deterministic', () => {
    expect(assessInputEvidence(documented())).toEqual(assessInputEvidence(documented()));
  });
});
