import { DiagnosticsResult } from './diagnostics';
import { EngineeringEvidenceStatus, EngineeringResult, EngineeringValidationStatus } from './engineeringResult';
import { PumpabilityDecisionResult } from './pumpabilityDecision';
import { EngineeringResultCenter } from './resultCenter';
import { SimulationRunResult } from './simulationRun';

export interface FinalEngineeringKeyResult {
  id: string;
  label: string;
  value: EngineeringResult['value'];
  unit: string | null;
  validationStatus: EngineeringValidationStatus;
  evidenceStatus: EngineeringEvidenceStatus;
  resultClass: EngineeringResult['resultClass'];
  methodId: string;
  provenanceEntityIds: string[];
  calibrationIds: string[];
}

export interface FinalEngineeringDecisionSummary {
  overallStatus: PumpabilityDecisionResult['status'];
  pressureFeasibility: PumpabilityDecisionResult['pressureFeasibility'];
  stability: PumpabilityDecisionResult['stability'];
  blockageRisk: PumpabilityDecisionResult['blockageRisk'];
  qualificationScope: 'project_qualified' | 'screened' | 'partially_qualified' | 'partially_screened' | 'pressure_only' | 'failed' | 'insufficient_data';
}

export interface FinalEngineeringTraceability {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  sourceMethodIds: string[];
  resultIds: string[];
  provenanceEntityIds: string[];
  calibrationIds: string[];
  diagnosticRuleIds: string[];
}

export interface FinalEngineeringOutput {
  runId: string;
  engineVersion: string;
  generatedAtIso: string;
  completeness: 'complete' | 'incomplete';
  decision: FinalEngineeringDecisionSummary;
  keyResults: FinalEngineeringKeyResult[];
  diagnostics: DiagnosticsResult['findings'];
  warnings: string[];
  limitations: string[];
  traceability: FinalEngineeringTraceability;
  renderTargets: readonly ['desktop_ui', 'pdf_report', 'json_export'];
  representation: 'engineering_output_contract';
  scientificClaim: 'derived_from_engineering_core_only';
  method: 'tolue-final-engineering-output-v1';
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(value => value.trim().length > 0))];
}

function qualificationScope(status: PumpabilityDecisionResult['status']): FinalEngineeringDecisionSummary['qualificationScope'] {
  if (status === 'PROJECT_QUALIFIED_ACCEPTABLE') return 'project_qualified';
  if (status === 'SCREENED_ACCEPTABLE') return 'screened';
  if (status === 'PARTIALLY_QUALIFIED_ACCEPTABLE') return 'partially_qualified';
  if (status === 'PARTIALLY_SCREENED_ACCEPTABLE') return 'partially_screened';
  if (status === 'PRESSURE_ONLY_ACCEPTABLE') return 'pressure_only';
  if (status === 'INSUFFICIENT_DATA') return 'insufficient_data';
  return 'failed';
}

const KEY_RESULT_IDS = [
  'pipeline.requiredPressure',
  'pressureProfile.peakRequiredPressure',
  'pump.availablePressure',
  'pump.pressureMargin',
  'pump.pressureUtilization',
  'pumpability.stabilityScreening',
  'pumpability.stabilityCriticalYieldStress',
  'pumpability.stabilityScreeningRatio',
  'pumpability.blockageScreening',
  'pumpability.blockageAggregatePipeRatio',
  'pumpability.blockageMinimumPipeDiameter',
  'pumpability.stabilityEvidence',
  'pumpability.blockageEvidence',
  'pumpability.decisionStatus',
] as const;

/**
 * Renderer-neutral final output contract for desktop UI, PDF generation and
 * machine-readable export. This function performs no new engineering inference.
 * It only packages already-computed Engineering Core results, decisions,
 * diagnostics and traceability metadata.
 */
export function buildFinalEngineeringOutput(
  run: SimulationRunResult,
  center: EngineeringResultCenter,
  diagnostics: DiagnosticsResult,
  decision: PumpabilityDecisionResult,
): FinalEngineeringOutput {
  if (run.runId !== center.runId || run.runId !== diagnostics.runId || run.runId !== decision.runId) {
    throw new Error('runId mismatch between final engineering output sources');
  }
  if (center.inputSnapshotHash !== diagnostics.inputSnapshotHash) {
    throw new Error('inputSnapshotHash mismatch between final engineering output sources');
  }

  const selectedResults = KEY_RESULT_IDS.map(id => center.results.find(result => result.id === id)).filter((result): result is EngineeringResult => result !== undefined);
  const keyResults: FinalEngineeringKeyResult[] = selectedResults.map(result => ({
    id: result.id,
    label: result.label,
    value: result.value,
    unit: result.unit,
    validationStatus: result.validationStatus,
    evidenceStatus: result.evidenceStatus,
    resultClass: result.resultClass,
    methodId: result.methodId,
    provenanceEntityIds: [...(result.provenanceEntityIds ?? [])],
    calibrationIds: [...(result.calibrationIds ?? [])],
  }));

  const provenanceEntityIds = unique(center.results.flatMap(result => result.provenanceEntityIds ?? []));
  const calibrationIds = unique(center.results.flatMap(result => result.calibrationIds ?? []));
  const limitations = unique([...decision.limitations, ...center.results.flatMap(result => result.limitations)]);

  return {
    runId: run.runId,
    engineVersion: run.engineVersion,
    generatedAtIso: run.createdAtIso,
    completeness: run.status,
    decision: {
      overallStatus: decision.status,
      pressureFeasibility: decision.pressureFeasibility,
      stability: decision.stability,
      blockageRisk: decision.blockageRisk,
      qualificationScope: qualificationScope(decision.status),
    },
    keyResults,
    diagnostics: diagnostics.findings.map(finding => ({ ...finding, sourceResultIds: [...finding.sourceResultIds] })),
    warnings: unique([...run.warnings, ...center.warnings]),
    limitations,
    traceability: {
      runId: run.runId,
      engineVersion: run.engineVersion,
      inputSnapshotHash: center.inputSnapshotHash,
      sourceMethodIds: unique([...run.methods, decision.method, center.method, diagnostics.method, ...decision.sourceMethodIds]),
      resultIds: center.results.map(result => result.id),
      provenanceEntityIds,
      calibrationIds,
      diagnosticRuleIds: unique(diagnostics.findings.map(finding => finding.ruleId)),
    },
    renderTargets: ['desktop_ui', 'pdf_report', 'json_export'],
    representation: 'engineering_output_contract',
    scientificClaim: 'derived_from_engineering_core_only',
    method: 'tolue-final-engineering-output-v1',
  };
}
