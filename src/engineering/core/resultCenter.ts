import { EngineeringResult, validateEngineeringResult } from './engineeringResult';
import { SimulationRunResult } from './simulationRun';

export interface EngineeringResultCenter {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  results: EngineeringResult[];
  warnings: string[];
  completeness: 'complete' | 'incomplete';
  method: 'tolue-engineering-result-center-v1';
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

export function buildEngineeringResultCenter(run: SimulationRunResult): EngineeringResultCenter {
  const hash = inputSnapshotFingerprint(run.inputSnapshot);
  const results: EngineeringResult[] = [];
  const physicalModelCommon = {
    resultClass: 'PHYSICAL_MODEL' as const,
    methodVersion: run.engineVersion,
    referenceIds: [] as string[],
    standardEditionIds: [] as string[],
    applicability: 'Current validated/candidate model domain and supplied input data.',
    assumptions: [...run.assumptions],
    limitations: [...run.warnings],
    inputSnapshotHash: hash,
    sourceRunId: run.runId,
  };

  results.push({ id: 'pipeline.requiredPressure', label: 'Required pipeline pressure', value: run.pipeline.requiredPressurePa, unit: 'Pa', methodId: run.pipeline.method, validationStatus: run.pipeline.completeness === 'complete' ? 'candidate' : 'insufficient_data', ...physicalModelCommon });
  results.push({ id: 'pipeline.elevationPressure', label: 'Elevation pressure contribution', value: run.pipeline.elevationPressurePa, unit: 'Pa', methodId: run.pipeline.method, validationStatus: 'candidate', ...physicalModelCommon });
  results.push({ id: 'pressureProfile.peakRequiredPressure', label: 'Peak required pressure', value: run.pressureProfile.peakRequiredPressurePa, unit: 'Pa', methodId: run.pressureProfile.method, validationStatus: run.pressureProfile.completeness === 'complete' ? 'candidate' : 'insufficient_data', ...physicalModelCommon });

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
    results.push({ id: 'pump.availablePressure', label: 'Available pump pressure at target flow', value: run.pumpAssessment.availablePressurePa, unit: 'Pa', resultClass: 'SOURCE_DATA', methodId: run.pumpAssessment.method, validationStatus: status, ...pumpCommon });
    results.push({ id: 'pump.pressureMargin', label: 'Pump pressure margin', value: run.pumpAssessment.pressureMarginPa, unit: 'Pa', resultClass: 'DERIVED_METRIC', methodId: run.pumpAssessment.method, validationStatus: status, ...pumpCommon });
    results.push({ id: 'pump.pressureUtilization', label: 'Pump pressure utilization', value: run.pumpAssessment.pressureUtilization, unit: '1', resultClass: 'DERIVED_METRIC', methodId: run.pumpAssessment.method, validationStatus: status, ...pumpCommon });
  }

  for (const result of results) validateEngineeringResult(result);

  return {
    runId: run.runId,
    engineVersion: run.engineVersion,
    inputSnapshotHash: hash,
    results,
    warnings: [...run.warnings],
    completeness: run.status,
    method: 'tolue-engineering-result-center-v1',
  };
}
