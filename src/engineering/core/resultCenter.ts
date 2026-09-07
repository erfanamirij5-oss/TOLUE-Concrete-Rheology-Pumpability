import { EngineeringEvidenceStatus, EngineeringResult, validateEngineeringResult } from './engineeringResult';
import { InputEvidenceField, assessInputEvidence } from './inputProvenance';
import { SimulationRunResult } from './simulationRun';

export interface EngineeringResultCenter {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  results: EngineeringResult[];
  warnings: string[];
  completeness: 'complete' | 'incomplete';
  method: 'tolue-engineering-result-center-v2';
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(k => `${JSON.stringify(k)}:${stableSerialize(record[k])}`).join(',')}}`;
}

// Deterministic FNV-1a 32-bit fingerprint for run traceability. This is not a cryptographic integrity signature.
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

function combineEvidenceStatus(...statuses: EngineeringEvidenceStatus[]): EngineeringEvidenceStatus {
  if (statuses.includes('BLOCKED')) return 'BLOCKED';
  if (statuses.includes('PRELIMINARY')) return 'PRELIMINARY';
  if (statuses.includes('NOT_ASSESSED')) return 'NOT_ASSESSED';
  return 'DOCUMENTED';
}

export function buildEngineeringResultCenter(run: SimulationRunResult): EngineeringResultCenter {
  const hash = inputSnapshotFingerprint(run.inputSnapshot);
  const results: EngineeringResult[] = [];
  const baseHydraulicEvidenceStatus = evidenceStatusFor(run, ['bulkRheology', 'lubricationLayerRheology', 'lubricationLayerThickness']);
  const pumpEvidenceStatus = evidenceStatusFor(run, ['pumpCapability']);
  const calibratedLocalSegments = run.pipeline.segments.filter(segment => segment.pressureMethod === 'project-calibrated-local-loss');

  // Local-loss calibration currently carries stable calibration/provenance identities,
  // but is not yet represented in SimulationInputProvenance v2 as a fully assessed record.
  // Therefore it must remain PRELIMINARY rather than being silently promoted to DOCUMENTED.
  const localEvidenceStatus: EngineeringEvidenceStatus = calibratedLocalSegments.length > 0 ? 'PRELIMINARY' : 'DOCUMENTED';
  const hydraulicEvidenceStatus = combineEvidenceStatus(baseHydraulicEvidenceStatus, localEvidenceStatus);
  const combinedEvidenceStatus = combineEvidenceStatus(hydraulicEvidenceStatus, pumpEvidenceStatus);

  const physicalModelCommon = {
    resultClass: 'PHYSICAL_MODEL' as const,
    methodVersion: run.engineVersion,
    referenceIds: [] as string[],
    standardEditionIds: [] as string[],
    applicability: 'Current validated/candidate model domain and supplied input data.',
    assumptions: [...run.assumptions],
    limitations: [...run.warnings],
    evidenceStatus: hydraulicEvidenceStatus,
    inputSnapshotHash: hash,
    sourceRunId: run.runId,
  };

  results.push({ id: 'pipeline.requiredPressure', label: 'Required pipeline pressure', value: run.pipeline.requiredPressurePa, unit: 'Pa', methodId: run.pipeline.method, validationStatus: run.pipeline.completeness === 'complete' ? 'candidate' : 'insufficient_data', ...physicalModelCommon });
  results.push({ id: 'pipeline.elevationPressure', label: 'Elevation pressure contribution', value: run.pipeline.elevationPressurePa, unit: 'Pa', methodId: run.pipeline.method, validationStatus: 'candidate', ...physicalModelCommon });
  results.push({ id: 'pressureProfile.peakRequiredPressure', label: 'Peak required pressure', value: run.pressureProfile.peakRequiredPressurePa, unit: 'Pa', methodId: run.pressureProfile.method, validationStatus: run.pressureProfile.completeness === 'complete' ? 'candidate' : 'insufficient_data', ...physicalModelCommon });

  for (const segment of calibratedLocalSegments) {
    results.push({
      id: `pipeline.segment.${segment.id}.calibratedLocalPressure`,
      label: `Project-calibrated local pressure loss — ${segment.id}`,
      value: segment.frictionPressurePa,
      unit: 'Pa',
      resultClass: 'PROJECT_CALIBRATED_DATA',
      methodId: 'tolue-project-calibrated-local-loss-v1',
      methodVersion: run.engineVersion,
      referenceIds: [],
      standardEditionIds: [],
      applicability: 'Project-calibrated data only; exact or interpolated use is limited to the supplied calibration curve domain and component identity.',
      assumptions: [...run.assumptions],
      limitations: [
        ...run.warnings,
        'This result is not a universal local-loss correlation and must not be transferred to another project/component without independent calibration evidence.',
      ],
      validationStatus: segment.status === 'computed' && segment.frictionPressurePa !== null ? 'candidate' : 'insufficient_data',
      evidenceStatus: 'PRELIMINARY',
      inputSnapshotHash: hash,
      sourceRunId: run.runId,
      provenanceEntityIds: segment.provenanceEntityId ? [segment.provenanceEntityId] : [],
      calibrationIds: segment.calibrationId ? [segment.calibrationId] : [],
    });
  }

  if (run.pumpAssessment) {
    const status = run.pumpAssessment.status === 'INSUFFICIENT_DATA' ? 'insufficient_data' : 'candidate';
    const pumpCommon = {
      methodVersion: run.engineVersion,
      referenceIds: [] as string[],
      standardEditionIds: [] as string[],
      applicability: 'Supplied pump capability data at the target flow; interpolation only within the documented capability curve domain.',
      assumptions: [...run.assumptions],
      limitations: [...run.warnings],
      inputSnapshotHash: hash,
      sourceRunId: run.runId,
    };
    results.push({ id: 'pump.availablePressure', label: 'Available pump pressure at target flow', value: run.pumpAssessment.availablePressurePa, unit: 'Pa', resultClass: 'SOURCE_DATA', methodId: run.pumpAssessment.method, validationStatus: status, evidenceStatus: pumpEvidenceStatus, ...pumpCommon });
    results.push({ id: 'pump.pressureMargin', label: 'Pump pressure margin', value: run.pumpAssessment.pressureMarginPa, unit: 'Pa', resultClass: 'DERIVED_METRIC', methodId: run.pumpAssessment.method, validationStatus: status, evidenceStatus: combinedEvidenceStatus, ...pumpCommon });
    results.push({ id: 'pump.pressureUtilization', label: 'Pump pressure utilization', value: run.pumpAssessment.pressureUtilization, unit: '1', resultClass: 'DERIVED_METRIC', methodId: run.pumpAssessment.method, validationStatus: status, evidenceStatus: combinedEvidenceStatus, ...pumpCommon });
  }

  for (const result of results) validateEngineeringResult(result);

  return {
    runId: run.runId,
    engineVersion: run.engineVersion,
    inputSnapshotHash: hash,
    results,
    warnings: [...run.warnings],
    completeness: run.status,
    method: 'tolue-engineering-result-center-v2',
  };
}
