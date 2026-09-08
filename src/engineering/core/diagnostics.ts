import { EngineeringResult, EngineeringValidationStatus } from './engineeringResult';
import { PumpabilityDecisionResult } from './pumpabilityDecision';
import { EngineeringResultCenter } from './resultCenter';

export type DiagnosticSeverity = 'info' | 'warning' | 'critical';
export type DiagnosticKind =
  | 'INCOMPLETE_ANALYSIS'
  | 'INSUFFICIENT_DATA'
  | 'PUMP_PRESSURE_INSUFFICIENT'
  | 'PUMP_PRESSURE_ADEQUATE'
  | 'STABILITY_UNACCEPTABLE'
  | 'BLOCKAGE_UNACCEPTABLE'
  | 'PUMPABILITY_PROJECT_QUALIFIED'
  | 'PUMPABILITY_PARTIALLY_QUALIFIED';

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
  basis: 'data_completeness' | 'exact_mathematical_relation' | 'project_qualified_evidence';
  validationStatus: EngineeringValidationStatus;
  recommendation: string | null;
}

export interface DiagnosticsResult {
  runId: string;
  inputSnapshotHash: string;
  findings: DiagnosticFinding[];
  method: 'tolue-diagnostics-v2';
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

export function diagnoseEngineeringResults(
  center: EngineeringResultCenter,
  pumpabilityDecision?: PumpabilityDecisionResult,
): DiagnosticsResult {
  const findings: DiagnosticFinding[] = [];

  if (center.completeness === 'incomplete') {
    findings.push({ id: 'diagnostic.analysis.incomplete', kind: 'INCOMPLETE_ANALYSIS', severity: 'warning', title: 'Engineering analysis is incomplete', message: 'One or more required engineering contributions are unavailable; dependent conclusions must not be treated as complete.', sourceResultIds: center.results.filter(r => r.validationStatus === 'insufficient_data' || r.value === null).map(r => r.id), ruleId: 'DX-COMPLETENESS-001', basis: 'data_completeness', validationStatus: 'insufficient_data', recommendation: 'Provide or validate the missing engineering inputs/models before relying on dependent results.', ...common(center) });
  }

  const insufficient = center.results.filter(r => r.validationStatus === 'insufficient_data');
  if (insufficient.length > 0) {
    findings.push({ id: 'diagnostic.data.insufficient', kind: 'INSUFFICIENT_DATA', severity: 'warning', title: 'Insufficient data for one or more results', message: `${insufficient.length} engineering result(s) are explicitly marked insufficient_data.`, sourceResultIds: insufficient.map(r => r.id), ruleId: 'DX-DATA-001', basis: 'data_completeness', validationStatus: 'insufficient_data', recommendation: 'Resolve the listed insufficient-data results; do not replace unknown contributions with assumed zero.', ...common(center) });
  }

  const margin = resultById(center, 'pump.pressureMargin');
  if (margin && typeof margin.value === 'number' && Number.isFinite(margin.value) && margin.validationStatus !== 'insufficient_data') {
    if (margin.value < 0) {
      findings.push({ id: 'diagnostic.pump.pressureInsufficient', kind: 'PUMP_PRESSURE_INSUFFICIENT', severity: 'critical', title: 'Available pump pressure is insufficient', message: `Available pressure is below modeled required pressure by ${Math.abs(margin.value)} Pa at the target flow.`, sourceResultIds: ['pump.pressureMargin', 'pump.availablePressure', 'pipeline.requiredPressure'], ruleId: 'DX-PUMP-MARGIN-001', basis: 'exact_mathematical_relation', validationStatus: margin.validationStatus, recommendation: 'Reassess pump capability, target flow, pipeline geometry, or concrete/rheology inputs using validated data; no automatic design change is prescribed.', ...common(center) });
    } else {
      findings.push({ id: 'diagnostic.pump.pressureAdequate', kind: 'PUMP_PRESSURE_ADEQUATE', severity: 'info', title: 'Modeled pump pressure is nominally adequate', message: `Available pressure exceeds or equals modeled required pressure by ${margin.value} Pa at the target flow. This is not a safety-factor or reliability certification.`, sourceResultIds: ['pump.pressureMargin', 'pump.availablePressure', 'pipeline.requiredPressure'], ruleId: 'DX-PUMP-MARGIN-002', basis: 'exact_mathematical_relation', validationStatus: margin.validationStatus, recommendation: null, ...common(center) });
    }
  }

  if (pumpabilityDecision?.status === 'FAIL_STABILITY') {
    findings.push({ id: 'diagnostic.pumpability.stabilityUnacceptable', kind: 'STABILITY_UNACCEPTABLE', severity: 'critical', title: 'Project-qualified stability evidence is unacceptable', message: 'The supplied in-domain project-qualified stability evidence reports an unacceptable outcome. This is project-specific and is not a universal stability model.', sourceResultIds: ['pumpability.stabilityEvidence', 'pumpability.decisionStatus'], ruleId: 'DX-PUMPABILITY-STABILITY-001', basis: 'project_qualified_evidence', validationStatus: 'candidate', recommendation: 'Review the documented project evidence, material system, target flow, and qualification scope before proceeding.', ...common(center) });
  }

  if (pumpabilityDecision?.status === 'FAIL_BLOCKAGE') {
    findings.push({ id: 'diagnostic.pumpability.blockageUnacceptable', kind: 'BLOCKAGE_UNACCEPTABLE', severity: 'critical', title: 'Project-qualified blockage evidence is unacceptable', message: 'The supplied in-domain project-qualified blockage evidence reports an unacceptable outcome. This is project-specific and is not a universal blockage model.', sourceResultIds: ['pumpability.blockageEvidence', 'pumpability.decisionStatus'], ruleId: 'DX-PUMPABILITY-BLOCKAGE-001', basis: 'project_qualified_evidence', validationStatus: 'candidate', recommendation: 'Review the documented project evidence, route/material system, target flow, and qualification scope before proceeding.', ...common(center) });
  }

  if (pumpabilityDecision?.status === 'PROJECT_QUALIFIED_ACCEPTABLE') {
    findings.push({ id: 'diagnostic.pumpability.projectQualified', kind: 'PUMPABILITY_PROJECT_QUALIFIED', severity: 'info', title: 'Project-qualified pumpability evidence is acceptable', message: 'Pressure feasibility, stability evidence, and blockage evidence are acceptable for the supplied project-qualified domains. This is not a universal certification.', sourceResultIds: ['pumpability.stabilityEvidence', 'pumpability.blockageEvidence', 'pumpability.decisionStatus'], ruleId: 'DX-PUMPABILITY-QUALIFIED-001', basis: 'project_qualified_evidence', validationStatus: 'candidate', recommendation: null, ...common(center) });
  }

  if (pumpabilityDecision?.status === 'PARTIALLY_QUALIFIED_ACCEPTABLE') {
    findings.push({ id: 'diagnostic.pumpability.partiallyQualified', kind: 'PUMPABILITY_PARTIALLY_QUALIFIED', severity: 'warning', title: 'Pumpability evidence is only partially qualified', message: 'Pressure is feasible and one project-qualified evidence domain is acceptable, but the other stability/blockage domain is not fully assessed in-domain.', sourceResultIds: ['pumpability.decisionStatus'], ruleId: 'DX-PUMPABILITY-QUALIFIED-002', basis: 'project_qualified_evidence', validationStatus: 'candidate', recommendation: 'Obtain project-qualified evidence for the missing or out-of-domain stability/blockage domain before treating pumpability as fully qualified.', ...common(center) });
  }

  return { runId: center.runId, inputSnapshotHash: center.inputSnapshotHash, findings, method: 'tolue-diagnostics-v2' };
}
