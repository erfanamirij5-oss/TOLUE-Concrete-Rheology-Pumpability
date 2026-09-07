export type EngineeringResultClass =
  | 'STANDARD_REQUIREMENT'
  | 'PHYSICAL_MODEL'
  | 'EMPIRICAL_MODEL'
  | 'SOURCE_DATA'
  | 'PROJECT_CALIBRATED_DATA'
  | 'DERIVED_METRIC'
  | 'TOLUE_ENGINEERING_INDEX'
  | 'AI_PREDICTION';

export type EngineeringValidationStatus =
  | 'verified'
  | 'candidate'
  | 'preliminary'
  | 'out_of_domain'
  | 'insufficient_data'
  | 'blocked';

/**
 * Evidence/provenance completeness is intentionally independent from scientific
 * model validation. DOCUMENTED means the supporting lineage is structurally
 * documented; it does not mean the result is physically verified or fit for purpose.
 */
export type EngineeringEvidenceStatus =
  | 'DOCUMENTED'
  | 'PRELIMINARY'
  | 'BLOCKED'
  | 'NOT_ASSESSED';

export interface EngineeringResult<T = number | string | boolean | null> {
  id: string;
  label: string;
  value: T;
  unit: string | null;
  resultClass: EngineeringResultClass;
  methodId: string;
  methodVersion: string;
  referenceIds: string[];
  standardEditionIds: string[];
  applicability: string;
  assumptions: string[];
  limitations: string[];
  validationStatus: EngineeringValidationStatus;
  evidenceStatus: EngineeringEvidenceStatus;
  inputSnapshotHash: string;
  sourceRunId: string;
  provenanceEntityIds?: string[];
  calibrationIds?: string[];
}

export function validateEngineeringResult(result: EngineeringResult): void {
  if (!result.id.trim()) throw new Error('result id must not be empty');
  if (!result.label.trim()) throw new Error('result label must not be empty');
  if (!result.methodId.trim()) throw new Error('methodId must not be empty');
  if (!result.methodVersion.trim()) throw new Error('methodVersion must not be empty');
  if (!result.applicability.trim()) throw new Error('applicability must not be empty');
  if (!result.inputSnapshotHash.trim()) throw new Error('inputSnapshotHash must not be empty');
  if (!result.sourceRunId.trim()) throw new Error('sourceRunId must not be empty');
  if (result.provenanceEntityIds?.some(id => !id.trim())) throw new Error('provenanceEntityIds must not contain empty IDs');
  if (result.calibrationIds?.some(id => !id.trim())) throw new Error('calibrationIds must not contain empty IDs');
}
