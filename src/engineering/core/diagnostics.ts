import { EngineeringResult, EngineeringValidationStatus } from './engineeringResult';
import { EngineeringResultCenter } from './resultCenter';

export type DiagnosticSeverity = 'info' | 'warning' | 'critical';
export type DiagnosticKind =
  | 'INCOMPLETE_ANALYSIS'
  | 'INSUFFICIENT_DATA'
  | 'PUMP_PRESSURE_INSUFFICIENT'
  | 'PUMP_PRESSURE_ADEQUATE';

export interface DiagnosticFinding {
  id: string;
  kind: DiagnosticKind;
  severity: DiagnosticSeverity;
  title: string;
  message: string;
  sourceResultIds: string[];
  sourceRunId: string;
  inputSnapshotHash: string;
  ruleId: string;
  ruleVersion: '1.0.0';
  basis: 'data_completeness' | 'exact_mathematical_relation';
  validationStatus: EngineeringValidationStatus;
  recommendation: string | null;
}

export interface DiagnosticsResult {
  runId: string;
  inputSnapshotHash: string;
  findings: DiagnosticFinding[];
  method: 'tolue-diagnostics-v1';
}

function resultById(center: EngineeringResultCenter, id: string): EngineeringResult | undefined {
  return center.results.find(result => result.id === id);
}

function common(center: EngineeringResultCenter) {
  return {
    sourceRunId: center.runId,
    inputSnapshotHash: center.inputSnapshotHash,
    ruleVersion: '1.0.0' as const,
  };
}

/**
 * Deterministic diagnostics derived only from explicit completeness states and
 * exact pressure-margin sign. No heuristic pumpability/blockage thresholds are
 * introduced here. Candidate source results cannot produce a stronger
 * validation claim than candidate.
 */
export function diagnoseEngineeringResults(center: EngineeringResultCenter): DiagnosticsResult {
  const findings: DiagnosticFinding[] = [];

  if (center.completeness === 'incomplete') {
    findings.push({
      id: 'diagnostic.analysis.incomplete',
      kind: 'INCOMPLETE_ANALYSIS',
      severity: 'warning',
      title: 'Engineering analysis is incomplete',
      message: 'One or more required engineering contributions are unavailable; dependent conclusions must not be treated as complete.',
      sourceResultIds: center.results.filter(r => r.validationStatus === 'insufficient_data' || r.value === null).map(r => r.id),
      ruleId: 'DX-COMPLETENESS-001',
      basis: 'data_completeness',
      validationStatus: 'insufficient_data',
      recommendation: 'Provide or validate the missing engineering inputs/models before relying on dependent results.',
      ...common(center),
    });
  }

  const insufficient = center.results.filter(r => r.validationStatus === 'insufficient_data');
  if (insufficient.length > 0) {
    findings.push({
      id: 'diagnostic.data.insufficient',
      kind: 'INSUFFICIENT_DATA',
      severity: 'warning',
      title: 'Insufficient data for one or more results',
      message: `${insufficient.length} engineering result(s) are explicitly marked insufficient_data.`,
      sourceResultIds: insufficient.map(r => r.id),
      ruleId: 'DX-DATA-001',
      basis: 'data_completeness',
      validationStatus: 'insufficient_data',
      recommendation: 'Resolve the listed insufficient-data results; do not replace unknown contributions with assumed zero.',
      ...common(center),
    });
  }

  const margin = resultById(center, 'pump.pressureMargin');
  if (margin && typeof margin.value === 'number' && Number.isFinite(margin.value) && margin.validationStatus !== 'insufficient_data') {
    if (margin.value < 0) {
      findings.push({
        id: 'diagnostic.pump.pressureInsufficient',
        kind: 'PUMP_PRESSURE_INSUFFICIENT',
        severity: 'critical',
        title: 'Available pump pressure is insufficient',
        message: `Available pressure is below modeled required pressure by ${Math.abs(margin.value)} Pa at the target flow.`,
        sourceResultIds: ['pump.pressureMargin', 'pump.availablePressure', 'pipeline.requiredPressure'],
        ruleId: 'DX-PUMP-MARGIN-001',
        basis: 'exact_mathematical_relation',
        validationStatus: margin.validationStatus,
        recommendation: 'Reassess pump capability, target flow, pipeline geometry, or concrete/rheology inputs using validated data; no automatic design change is prescribed.',
        ...common(center),
      });
    } else {
      findings.push({
        id: 'diagnostic.pump.pressureAdequate',
        kind: 'PUMP_PRESSURE_ADEQUATE',
        severity: 'info',
        title: 'Modeled pump pressure is nominally adequate',
        message: `Available pressure exceeds or equals modeled required pressure by ${margin.value} Pa at the target flow. This is not a safety-factor or reliability certification.`,
        sourceResultIds: ['pump.pressureMargin', 'pump.availablePressure', 'pipeline.requiredPressure'],
        ruleId: 'DX-PUMP-MARGIN-002',
        basis: 'exact_mathematical_relation',
        validationStatus: margin.validationStatus,
        recommendation: null,
        ...common(center),
      });
    }
  }

  return {
    runId: center.runId,
    inputSnapshotHash: center.inputSnapshotHash,
    findings,
    method: 'tolue-diagnostics-v1',
  };
}
