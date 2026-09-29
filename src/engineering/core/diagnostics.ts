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
  | 'PUMPABILITY_PARTIALLY_QUALIFIED'
  | 'PUMPABILITY_SCREENED_ACCEPTABLE'
  | 'PUMPABILITY_PARTIALLY_SCREENED';

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
  basis: 'data_completeness' | 'exact_mathematical_relation' | 'project_qualified_evidence' | 'engineering_screening';
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
    const screened = pumpabilityDecision.stabilityBasis === 'ENGINEERING_SCREENING';
    findings.push({
      id: 'diagnostic.pumpability.stabilityUnacceptable',
      kind: 'STABILITY_UNACCEPTABLE',
      severity: 'critical',
      title: screened ? 'Static stability engineering screen is unacceptable' : 'Project-qualified stability evidence is unacceptable',
      message: screened
        ? 'The Roussel static segregation screen indicates that the supplied suspending-phase yield stress is below the calculated critical value for the supplied aggregate size and density contrast.'
        : 'The supplied in-domain project-qualified stability evidence reports an unacceptable outcome. This is project-specific and is not a universal stability model.',
      sourceResultIds: screened
        ? ['pumpability.stabilityScreening', 'pumpability.stabilityCriticalYieldStress', 'pumpability.decisionStatus']
        : ['pumpability.stabilityEvidence', 'pumpability.decisionStatus'],
      ruleId: screened ? 'DX-PUMPABILITY-STABILITY-SCREEN-001' : 'DX-PUMPABILITY-STABILITY-001',
      basis: screened ? 'engineering_screening' : 'project_qualified_evidence',
      validationStatus: 'candidate',
      recommendation: screened
        ? 'Review suspending-phase rheology, aggregate size/density, mixture stability measurements, and project-qualified evidence before pumping.'
        : 'Review the documented project evidence, material system, target flow, and qualification scope before proceeding.',
      ...common(center),
    });
  }

  if (pumpabilityDecision?.status === 'FAIL_BLOCKAGE') {
    const screened = pumpabilityDecision.blockageBasis === 'ENGINEERING_SCREENING';
    findings.push({
      id: 'diagnostic.pumpability.blockageUnacceptable',
      kind: 'BLOCKAGE_UNACCEPTABLE',
      severity: 'critical',
      title: screened ? 'Aggregate-to-pipe blockage screen is unacceptable' : 'Project-qualified blockage evidence is unacceptable',
      message: screened
        ? 'The nominal maximum aggregate size exceeds the conservative one-third limit of the smallest known straight-pipe inside diameter.'
        : 'The supplied in-domain project-qualified blockage evidence reports an unacceptable outcome. This is project-specific and is not a universal blockage model.',
      sourceResultIds: screened
        ? ['pumpability.blockageScreening', 'pumpability.blockageAggregatePipeRatio', 'pumpability.decisionStatus']
        : ['pumpability.blockageEvidence', 'pumpability.decisionStatus'],
      ruleId: screened ? 'DX-PUMPABILITY-BLOCKAGE-SCREEN-001' : 'DX-PUMPABILITY-BLOCKAGE-001',
      basis: screened ? 'engineering_screening' : 'project_qualified_evidence',
      validationStatus: 'candidate',
      recommendation: screened
        ? 'Review nominal maximum aggregate size and the minimum inside diameter of the complete pumping route, especially reducers, bends, hoses, valves, and boom components.'
        : 'Review the documented project evidence, route/material system, target flow, and qualification scope before proceeding.',
      ...common(center),
    });
  }

  if (pumpabilityDecision?.status === 'PROJECT_QUALIFIED_ACCEPTABLE') {
    findings.push({ id: 'diagnostic.pumpability.projectQualified', kind: 'PUMPABILITY_PROJECT_QUALIFIED', severity: 'info', title: 'Project-qualified pumpability evidence is acceptable', message: 'Pressure feasibility, stability evidence, and blockage evidence are acceptable for the supplied project-qualified domains. This is not a universal certification.', sourceResultIds: ['pumpability.stabilityEvidence', 'pumpability.blockageEvidence', 'pumpability.decisionStatus'], ruleId: 'DX-PUMPABILITY-QUALIFIED-001', basis: 'project_qualified_evidence', validationStatus: 'candidate', recommendation: null, ...common(center) });
  }

  if (pumpabilityDecision?.status === 'PARTIALLY_QUALIFIED_ACCEPTABLE') {
    findings.push({ id: 'diagnostic.pumpability.partiallyQualified', kind: 'PUMPABILITY_PARTIALLY_QUALIFIED', severity: 'warning', title: 'Pumpability evidence is only partially qualified', message: 'Pressure is feasible and one project-qualified evidence domain is acceptable, but the other stability/blockage domain is not fully assessed in-domain.', sourceResultIds: ['pumpability.decisionStatus'], ruleId: 'DX-PUMPABILITY-QUALIFIED-002', basis: 'project_qualified_evidence', validationStatus: 'candidate', recommendation: 'Obtain project-qualified evidence for the missing or out-of-domain stability/blockage domain before treating pumpability as fully qualified.', ...common(center) });
  }

  if (pumpabilityDecision?.status === 'SCREENED_ACCEPTABLE') {
    findings.push({
      id: 'diagnostic.pumpability.screenedAcceptable',
      kind: 'PUMPABILITY_SCREENED_ACCEPTABLE',
      severity: 'info',
      title: 'Automatic stability and blockage engineering screens are acceptable',
      message: 'Pressure is feasible and the available automatic stability/blockage screening checks are acceptable. These screens are preliminary and do not replace project-qualified pumping trials or evidence.',
      sourceResultIds: ['pumpability.stabilityScreening', 'pumpability.blockageScreening', 'pumpability.decisionStatus'],
      ruleId: 'DX-PUMPABILITY-SCREEN-001',
      basis: 'engineering_screening',
      validationStatus: 'preliminary',
      recommendation: 'Use project-qualified trial, laboratory, or field evidence when a final project acceptance decision is required.',
      ...common(center),
    });
  }

  if (pumpabilityDecision?.status === 'PARTIALLY_SCREENED_ACCEPTABLE') {
    findings.push({
      id: 'diagnostic.pumpability.partiallyScreened',
      kind: 'PUMPABILITY_PARTIALLY_SCREENED',
      severity: 'warning',
      title: 'Automatic pumpability risk screening is incomplete',
      message: 'Pressure is feasible and one automatic risk domain is acceptable, but the other stability/blockage domain does not have enough screening input data.',
      sourceResultIds: ['pumpability.decisionStatus'],
      ruleId: 'DX-PUMPABILITY-SCREEN-002',
      basis: 'engineering_screening',
      validationStatus: 'preliminary',
      recommendation: 'Complete the missing automatic screening inputs and rerun the analysis before relying on the risk screen.',
      ...common(center),
    });
  }

  return { runId: center.runId, inputSnapshotHash: center.inputSnapshotHash, findings, method: 'tolue-diagnostics-v2' };
}
