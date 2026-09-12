import { EngineeringEvidenceStatus, EngineeringResult, validateEngineeringResult } from './engineeringResult';
import { InputEvidenceField, assessInputEvidence } from './inputProvenance';
import { PumpabilityDecisionResult } from './pumpabilityDecision';
import { SimulationRunResult } from './simulationRun';

export interface EngineeringResultCenter {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  results: EngineeringResult[];
  warnings: string[];
  completeness: 'complete' | 'incomplete';
  method: 'tolue-engineering-result-center-v4';
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(k => `${JSON.stringify(k)}:${stableSerialize(record[k])}`).join(',')}}`;
}

export function inputSnapshotFingerprint(value: unknown): string {
  const text = stableSerialize(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function evidenceStatusFor(run: SimulationRunResult, fields: InputEvidenceField[]): EngineeringEvidenceStatus {
  const provenance = run.inputSnapshot.provenance;
  if (!provenance) return 'NOT_ASSESSED';
  const assessment = assessInputEvidence(provenance);
  const relevant = assessment.findings.filter(finding => fields.includes(finding.field));
  if (relevant.some(finding => finding.severity === 'blocking')) return 'BLOCKED';
  if (relevant.some(finding => finding.severity === 'warning')) return 'PRELIMINARY';
  return 'DOCUMENTED';
}

function localEvidenceStatusFor(run: SimulationRunResult, provenanceEntityIds: string[]): EngineeringEvidenceStatus {
  if (provenanceEntityIds.length === 0) return 'DOCUMENTED';
  const provenance = run.inputSnapshot.provenance;
  if (!provenance) return 'NOT_ASSESSED';
  for (const entityId of provenanceEntityIds) {
    if (!entityId || !provenance.localLossCalibrations?.[entityId]) return 'BLOCKED';
  }
  const fields = provenanceEntityIds.map(entityId => `localLossCalibrations.${entityId}` as InputEvidenceField);
  return evidenceStatusFor(run, fields);
}

function combineEvidenceStatus(...statuses: EngineeringEvidenceStatus[]): EngineeringEvidenceStatus {
  if (statuses.includes('BLOCKED')) return 'BLOCKED';
  if (statuses.includes('PRELIMINARY')) return 'PRELIMINARY';
  if (statuses.includes('NOT_ASSESSED')) return 'NOT_ASSESSED';
  return 'DOCUMENTED';
}

export function buildEngineeringResultCenter(
  run: SimulationRunResult,
  pumpabilityDecision?: PumpabilityDecisionResult,
): EngineeringResultCenter {
  const hash = inputSnapshotFingerprint(run.inputSnapshot);
  const results: EngineeringResult[] = [];
  const baseHydraulicEvidenceStatus = evidenceStatusFor(run, ['bulkRheology', 'lubricationLayerRheology', 'lubricationLayerThickness']);
  const pumpEvidenceStatus = evidenceStatusFor(run, ['pumpCapability']);
  const calibratedLocalSegments = run.pipeline.segments.filter(segment => segment.pressureMethod === 'project-calibrated-local-loss');
  const localProvenanceEntityIds = calibratedLocalSegments.map(segment => segment.provenanceEntityId).filter((id): id is string => id !== null);
  const localCalibrationIds = calibratedLocalSegments.map(segment => segment.calibrationId).filter((id): id is string => id !== null);
  const localEvidenceStatus = localEvidenceStatusFor(run, localProvenanceEntityIds);
  const hydraulicEvidenceStatus = combineEvidenceStatus(baseHydraulicEvidenceStatus, localEvidenceStatus);
  const combinedEvidenceStatus = combineEvidenceStatus(hydraulicEvidenceStatus, pumpEvidenceStatus);
  const mixedHydraulicResultClass = calibratedLocalSegments.length > 0 ? 'COMPOSITE_ENGINEERING_RESULT' as const : 'PHYSICAL_MODEL' as const;

  const hydraulicCommon = {
    resultClass: mixedHydraulicResultClass,
    methodVersion: run.engineVersion,
    referenceIds: [] as string[],
    standardEditionIds: [] as string[],
    applicability: calibratedLocalSegments.length > 0
      ? 'Composite result combining the current physical hydraulic model with project-calibrated local-loss data within each supplied calibration domain.'
      : 'Current validated/candidate physical hydraulic model domain and supplied input data.',
    assumptions: [...run.assumptions],
    limitations: [...run.warnings],
    evidenceStatus: hydraulicEvidenceStatus,
    inputSnapshotHash: hash,
    sourceRunId: run.runId,
    provenanceEntityIds: localProvenanceEntityIds,
    calibrationIds: localCalibrationIds,
  };

  results.push({ id: 'pipeline.requiredPressure', label: 'Required pipeline pressure', value: run.pipeline.requiredPressurePa, unit: 'Pa', methodId: run.pipeline.method, validationStatus: run.pipeline.completeness === 'complete' ? 'candidate' : 'insufficient_data', ...hydraulicCommon });
  results.push({ id: 'pressureProfile.peakRequiredPressure', label: 'Peak required pressure', value: run.pressureProfile.peakRequiredPressurePa, unit: 'Pa', methodId: run.pressureProfile.method, validationStatus: run.pressureProfile.completeness === 'complete' ? 'candidate' : 'insufficient_data', ...hydraulicCommon });
  results.push({
    id: 'pipeline.elevationPressure', label: 'Elevation pressure contribution', value: run.pipeline.elevationPressurePa, unit: 'Pa', resultClass: 'PHYSICAL_MODEL', methodId: run.pipeline.method, methodVersion: run.engineVersion, referenceIds: [], standardEditionIds: [], applicability: 'Static elevation contribution computed from supplied density, gravity, and net elevation change.', assumptions: [...run.assumptions], limitations: [...run.warnings], validationStatus: 'candidate', evidenceStatus: baseHydraulicEvidenceStatus, inputSnapshotHash: hash, sourceRunId: run.runId,
  });

  for (const segment of calibratedLocalSegments) {
    const segmentEvidenceStatus = segment.provenanceEntityId ? localEvidenceStatusFor(run, [segment.provenanceEntityId]) : 'BLOCKED';
    results.push({
      id: `pipeline.segment.${segment.id}.calibratedLocalPressure`, label: `Project-calibrated local pressure loss — ${segment.id}`, value: segment.frictionPressurePa, unit: 'Pa', resultClass: 'PROJECT_CALIBRATED_DATA', methodId: 'tolue-project-calibrated-local-loss-v1', methodVersion: run.engineVersion, referenceIds: [], standardEditionIds: [], applicability: 'Project-calibrated data only; exact or interpolated use is limited to the supplied calibration curve domain and component identity.', assumptions: [...run.assumptions], limitations: [...run.warnings, 'This result is not a universal local-loss correlation and must not be transferred to another project/component without independent calibration evidence.'], validationStatus: segment.status === 'computed' && segment.frictionPressurePa !== null ? 'candidate' : 'insufficient_data', evidenceStatus: segmentEvidenceStatus, inputSnapshotHash: hash, sourceRunId: run.runId, provenanceEntityIds: segment.provenanceEntityId ? [segment.provenanceEntityId] : [], calibrationIds: segment.calibrationId ? [segment.calibrationId] : [],
    });
  }

  if (run.pumpAssessment) {
    const status = run.pumpAssessment.status === 'INSUFFICIENT_DATA' ? 'insufficient_data' : 'candidate';
    const pumpCommon = { methodVersion: run.engineVersion, referenceIds: [] as string[], standardEditionIds: [] as string[], applicability: 'Supplied pump capability data at the target flow; interpolation only within the documented capability curve domain.', assumptions: [...run.assumptions], limitations: [...run.warnings], inputSnapshotHash: hash, sourceRunId: run.runId };
    results.push({ id: 'pump.availablePressure', label: 'Available pump pressure at target flow', value: run.pumpAssessment.availablePressurePa, unit: 'Pa', resultClass: 'SOURCE_DATA', methodId: run.pumpAssessment.method, validationStatus: status, evidenceStatus: pumpEvidenceStatus, ...pumpCommon });
    results.push({ id: 'pump.pressureMargin', label: 'Pump pressure margin', value: run.pumpAssessment.pressureMarginPa, unit: 'Pa', resultClass: 'DERIVED_METRIC', methodId: run.pumpAssessment.method, validationStatus: status, evidenceStatus: combinedEvidenceStatus, ...pumpCommon });
    results.push({ id: 'pump.pressureUtilization', label: 'Pump pressure utilization', value: run.pumpAssessment.pressureUtilization, unit: '1', resultClass: 'DERIVED_METRIC', methodId: run.pumpAssessment.method, validationStatus: status, evidenceStatus: combinedEvidenceStatus, ...pumpCommon });
  }

  if (pumpabilityDecision) {
    const screening = pumpabilityDecision.riskScreening;
    if (screening) {
      const screenCommon = { methodVersion: run.engineVersion, standardEditionIds: [] as string[], assumptions: [...run.assumptions], validationStatus: 'preliminary' as const, evidenceStatus: 'PRELIMINARY' as const, inputSnapshotHash: hash, sourceRunId: run.runId };
      results.push({ id: 'pumpability.stabilityScreening', label: 'Automatic static stability screening', value: screening.stability.status, unit: null, resultClass: 'DERIVED_METRIC', methodId: screening.stability.method, referenceIds: [...screening.stability.referenceIds], applicability: screening.stability.applicability, limitations: [...screening.stability.limitations], ...screenCommon });
      results.push({ id: 'pumpability.stabilityCriticalYieldStress', label: 'Critical suspending-phase yield stress for static stability screen', value: screening.stability.criticalYieldStressPa, unit: 'Pa', resultClass: 'PHYSICAL_MODEL', methodId: screening.stability.method, referenceIds: [...screening.stability.referenceIds], applicability: screening.stability.applicability, limitations: [...screening.stability.limitations], ...screenCommon });
      results.push({ id: 'pumpability.stabilityScreeningRatio', label: 'Static stability yield-stress ratio', value: screening.stability.stabilityRatio, unit: '1', resultClass: 'DERIVED_METRIC', methodId: screening.stability.method, referenceIds: [...screening.stability.referenceIds], applicability: screening.stability.applicability, limitations: [...screening.stability.limitations], ...screenCommon });
      results.push({ id: 'pumpability.blockageScreening', label: 'Automatic aggregate-to-pipe blockage screening', value: screening.blockage.status, unit: null, resultClass: 'DERIVED_METRIC', methodId: screening.blockage.method, referenceIds: [...screening.blockage.referenceIds], applicability: screening.blockage.applicability, limitations: [...screening.blockage.limitations], ...screenCommon });
      results.push({ id: 'pumpability.blockageAggregatePipeRatio', label: 'Nominal maximum aggregate size to minimum pipe inside-diameter ratio', value: screening.blockage.aggregateToPipeDiameterRatio, unit: '1', resultClass: 'DERIVED_METRIC', methodId: screening.blockage.method, referenceIds: [...screening.blockage.referenceIds], applicability: screening.blockage.applicability, limitations: [...screening.blockage.limitations], ...screenCommon });
      results.push({ id: 'pumpability.blockageMinimumPipeDiameter', label: 'Governing minimum known straight-pipe inside diameter', value: screening.blockage.minimumKnownPipeInsideDiameterM, unit: 'm', resultClass: 'SOURCE_DATA', methodId: screening.blockage.method, referenceIds: [...screening.blockage.referenceIds], applicability: screening.blockage.applicability, limitations: [...screening.blockage.limitations], ...screenCommon });
    }

    const qualifiedEvidence = [pumpabilityDecision.stabilityEvidence, pumpabilityDecision.blockageEvidence].filter((item): item is NonNullable<typeof item> => item !== null);
    for (const evidence of qualifiedEvidence) {
      results.push({
        id: `pumpability.${evidence.domain}Evidence`, label: evidence.domain === 'stability' ? 'Project-qualified stability evidence' : 'Project-qualified blockage evidence', value: evidence.status === 'APPLICABLE' ? evidence.outcome : 'OUT_OF_DOMAIN', unit: null, resultClass: 'PROJECT_CALIBRATED_DATA', methodId: evidence.method, methodVersion: run.engineVersion, referenceIds: [...evidence.referenceIds], standardEditionIds: [], applicability: evidence.applicabilityStatement, assumptions: [...run.assumptions], limitations: [...evidence.limitations], validationStatus: evidence.status === 'APPLICABLE' ? 'candidate' : 'out_of_domain', evidenceStatus: 'PRELIMINARY', inputSnapshotHash: hash, sourceRunId: run.runId, provenanceEntityIds: [evidence.provenanceEntityId],
      });
    }

    const decisionHasProjectEvidence = qualifiedEvidence.some(item => item.status === 'APPLICABLE');
    const decisionReferences = [
      ...qualifiedEvidence.flatMap(item => item.referenceIds),
      ...(screening ? [...screening.stability.referenceIds, ...screening.blockage.referenceIds] : []),
    ];
    results.push({
      id: 'pumpability.decisionStatus', label: 'Pumpability decision status', value: pumpabilityDecision.status, unit: null, resultClass: 'DERIVED_METRIC', methodId: pumpabilityDecision.method, methodVersion: run.engineVersion, referenceIds: [...new Set(decisionReferences)], standardEditionIds: [], applicability: 'Three-axis decision using pressure feasibility, project-qualified evidence when available in-domain, and separately identified transparent engineering screening when its required inputs are supplied.', assumptions: [...run.assumptions], limitations: [...pumpabilityDecision.limitations], validationStatus: pumpabilityDecision.status === 'INSUFFICIENT_DATA' ? 'insufficient_data' : screening ? 'preliminary' : 'candidate', evidenceStatus: decisionHasProjectEvidence || screening ? 'PRELIMINARY' : combinedEvidenceStatus, inputSnapshotHash: hash, sourceRunId: run.runId, provenanceEntityIds: qualifiedEvidence.map(item => item.provenanceEntityId),
    });
  }

  for (const result of results) validateEngineeringResult(result);
  return { runId: run.runId, engineVersion: run.engineVersion, inputSnapshotHash: hash, results, warnings: [...run.warnings], completeness: run.status, method: 'tolue-engineering-result-center-v4' };
}
