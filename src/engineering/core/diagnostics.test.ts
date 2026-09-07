import { describe, expect, it } from 'vitest';
import { EngineeringResult } from './engineeringResult';
import { EngineeringResultCenter } from './resultCenter';
import { diagnoseEngineeringResults } from './diagnostics';

function result(id: string, value: number | null, validationStatus: EngineeringResult['validationStatus'] = 'candidate'): EngineeringResult {
  return {
    id,
    label: id,
    value,
    unit: 'Pa',
    resultClass: 'PHYSICAL_MODEL',
    methodId: 'test-method',
    methodVersion: '0.1.0',
    referenceIds: [],
    standardEditionIds: [],
    applicability: 'test domain',
    assumptions: [],
    limitations: [],
    validationStatus,
    evidenceStatus: 'DOCUMENTED',
    inputSnapshotHash: 'fnv1a32:12345678',
    sourceRunId: 'run-1',
  };
}

function center(results: EngineeringResult[], completeness: EngineeringResultCenter['completeness'] = 'complete'): EngineeringResultCenter {
  return {
    runId: 'run-1',
    engineVersion: '0.1.0',
    inputSnapshotHash: 'fnv1a32:12345678',
    results,
    warnings: [],
    completeness,
    method: 'tolue-engineering-result-center-v2',
  };
}

describe('Diagnostics Engine', () => {
  it('reports negative pressure margin as critical without inventing a threshold', () => {
    const output = diagnoseEngineeringResults(center([
      result('pipeline.requiredPressure', 12_000_000),
      result('pump.availablePressure', 10_000_000),
      result('pump.pressureMargin', -2_000_000),
    ]));
    const finding = output.findings.find(f => f.kind === 'PUMP_PRESSURE_INSUFFICIENT');
    expect(finding?.severity).toBe('critical');
    expect(finding?.basis).toBe('exact_mathematical_relation');
    expect(finding?.validationStatus).toBe('candidate');
  });

  it('treats zero margin as nominally adequate, not marginal', () => {
    const output = diagnoseEngineeringResults(center([
      result('pipeline.requiredPressure', 10_000_000),
      result('pump.availablePressure', 10_000_000),
      result('pump.pressureMargin', 0),
    ]));
    expect(output.findings.some(f => f.kind === 'PUMP_PRESSURE_ADEQUATE')).toBe(true);
    expect(output.findings.some(f => f.severity === 'warning' && f.kind === 'PUMP_PRESSURE_ADEQUATE')).toBe(false);
  });

  it('does not diagnose pump adequacy from insufficient data', () => {
    const output = diagnoseEngineeringResults(center([
      result('pipeline.requiredPressure', null, 'insufficient_data'),
      result('pump.pressureMargin', null, 'insufficient_data'),
    ], 'incomplete'));
    expect(output.findings.some(f => f.kind === 'INCOMPLETE_ANALYSIS')).toBe(true);
    expect(output.findings.some(f => f.kind === 'INSUFFICIENT_DATA')).toBe(true);
    expect(output.findings.some(f => f.kind === 'PUMP_PRESSURE_ADEQUATE' || f.kind === 'PUMP_PRESSURE_INSUFFICIENT')).toBe(false);
  });

  it('is deterministic for identical inputs', () => {
    const input = center([
      result('pipeline.requiredPressure', 8_000_000),
      result('pump.availablePressure', 10_000_000),
      result('pump.pressureMargin', 2_000_000),
    ]);
    expect(diagnoseEngineeringResults(input)).toEqual(diagnoseEngineeringResults(input));
  });
});
