import { describe, expect, it } from 'vitest';
import type { EngineeringAnalysisResult } from './engineeringAnalysis';
import { compareEngineeringRuns } from './engineeringRunComparison';

function blocked(runId: string, engineVersion = 'v1'): EngineeringAnalysisResult {
  return {
    runId,
    engineVersion,
    readiness: { status: 'BLOCKED', canExecute: false, findings: [], method: 'tolue-engineering-readiness-gate-v2' },
    executionStatus: 'BLOCKED',
    inputSnapshotHash: null,
    simulation: null,
    resultCenter: null,
    diagnostics: null,
    pumpabilityDecision: null,
    finalOutput: null,
    reportExport: null,
    pdfExportRequest: null,
    visualization3d: null,
    completeness: 'incomplete',
    method: 'tolue-engineering-analysis-orchestrator-v6',
  };
}

function executed(runId: string, requiredPressurePa: number, availablePressurePa: number, pressureMarginPa: number): EngineeringAnalysisResult {
  const result = {
    runId,
    engineVersion: 'v1',
    readiness: { status: 'READY', canExecute: true, findings: [], method: 'tolue-engineering-readiness-gate-v2' },
    executionStatus: 'EXECUTED',
    inputSnapshotHash: `hash-${runId}`,
    simulation: {
      runId,
      engineVersion: 'v1',
      createdAtIso: '2026-09-09T00:00:00.000Z',
      status: 'complete',
      inputSnapshot: { runId, engineVersion: 'v1', createdAtIso: '2026-09-09T00:00:00.000Z', pipeline: { targetFlowRateM3s: runId === 'A' ? 0.01 : 0.012 } },
      pipeline: {}, pressureProfile: {}, hydraulicInvariants: {}, rheologyCurves: {}, warnings: [], assumptions: [], methods: [],
      pumpAssessment: { requiredPressurePa, availablePressurePa, pressureMarginPa },
    },
    resultCenter: {}, diagnostics: {}, finalOutput: {}, reportExport: {}, pdfExportRequest: {}, visualization3d: {},
    pumpabilityDecision: { pressureFeasibility: pressureMarginPa >= 0 ? 'PASS' : 'FAIL', stability: 'NOT_ASSESSED', blockageRisk: 'NOT_ASSESSED', status: pressureMarginPa >= 0 ? 'PRESSURE_ONLY_ACCEPTABLE' : 'FAIL_PRESSURE' },
    completeness: 'complete',
    method: 'tolue-engineering-analysis-orchestrator-v6',
  } as unknown as EngineeringAnalysisResult;
  return result;
}

describe('engineering run comparison', () => {
  it('computes only arithmetic candidate-minus-baseline deltas from computed scalars', () => {
    const comparison = compareEngineeringRuns(executed('A', 1_000_000, 1_500_000, 500_000), executed('B', 1_200_000, 1_600_000, 400_000));
    expect(comparison.requiredPressure).toEqual({ baseline: 1_000_000, candidate: 1_200_000, deltaCandidateMinusBaseline: 200_000, unit: 'Pa' });
    expect(comparison.availablePressure.deltaCandidateMinusBaseline).toBe(100_000);
    expect(comparison.pressureMargin.deltaCandidateMinusBaseline).toBe(-100_000);
    expect(comparison.targetFlowRate.deltaCandidateMinusBaseline).toBeCloseTo(0.002);
    expect(comparison.interpretationClaim).toBe('no_automatic_better_or_worse_inference');
  });

  it('preserves decision states without ranking them', () => {
    const comparison = compareEngineeringRuns(executed('A', 1_000_000, 1_500_000, 500_000), executed('B', 1_700_000, 1_600_000, -100_000));
    expect(comparison.pressureFeasibility).toEqual({ baseline: 'PASS', candidate: 'FAIL' });
    expect(comparison.pumpabilityDecision).toEqual({ baseline: 'PRESSURE_ONLY_ACCEPTABLE', candidate: 'FAIL_PRESSURE' });
  });

  it('fails closed to null deltas when a run is blocked', () => {
    const comparison = compareEngineeringRuns(blocked('A'), executed('B', 1_200_000, 1_600_000, 400_000));
    expect(comparison.requiredPressure.baseline).toBeNull();
    expect(comparison.requiredPressure.deltaCandidateMinusBaseline).toBeNull();
    expect(comparison.pressureFeasibility.baseline).toBeNull();
  });

  it('requires distinct run identities', () => {
    expect(() => compareEngineeringRuns(blocked('A'), blocked('A'))).toThrow('RUN-COMPARISON-DISTINCT-001');
  });

  it('rejects cross-engine comparisons instead of implying comparable semantics', () => {
    expect(() => compareEngineeringRuns(blocked('A', 'v1'), blocked('B', 'v2'))).toThrow('RUN-COMPARISON-ENGINE-VERSION-001');
  });

  it('rejects inconsistent persisted execution identity before comparison', () => {
    const corrupt = { ...executed('A', 1_000_000, 1_500_000, 500_000), inputSnapshotHash: null } as unknown as EngineeringAnalysisResult;
    expect(() => compareEngineeringRuns(corrupt, executed('B', 1_200_000, 1_600_000, 400_000))).toThrow('RUN-COMPARISON-BASELINE-HASH-001');
  });
});
