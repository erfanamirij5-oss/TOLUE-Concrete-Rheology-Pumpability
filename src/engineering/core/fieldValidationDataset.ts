import type { BinghamMaterial } from './twoFluidBingham';

export type FieldEvidenceQuality = 'A' | 'B' | 'C' | 'EXCLUDED';
export type LubricationQualificationMode = 'MEASURED_TRIBOLOGY' | 'PROJECT_CALIBRATED' | 'VALIDATED_PREDICTION' | 'UNAVAILABLE';

export interface FieldValidationSourceTrace {
  readonly projectId: string;
  readonly mixRevisionId: string;
  readonly pipelineScenarioId: string;
  readonly pumpScenarioId: string;
  readonly sourceHash: string;
  readonly recordedAtIso: string;
  readonly recordedBy: string;
}

export interface FieldValidationMeasurement {
  readonly measuredFlowRateM3s: number;
  readonly measuredPressurePa: number;
  readonly pressureSensorId: string;
  readonly pressureSensorLocationM: number;
  readonly pressureSensorCalibrationRef: string;
  readonly concreteTemperatureC?: number;
  readonly workabilityBefore?: string;
  readonly workabilityAfter?: string;
}

export interface FieldValidationCase {
  readonly caseId: string;
  readonly source: Readonly<FieldValidationSourceTrace>;
  readonly evidenceQuality: FieldEvidenceQuality;
  readonly exclusionReason?: string;
  readonly bulkRheology: Readonly<BinghamMaterial>;
  readonly lubricationLayerRheology?: Readonly<BinghamMaterial>;
  readonly lubricationLayerThicknessM?: number;
  readonly lubricationQualificationMode: LubricationQualificationMode;
  readonly pipelineLengthM: number;
  readonly pipeInsideDiameterM: number;
  readonly elevationChangeM: number;
  readonly pumpMake: string;
  readonly pumpModel: string;
  readonly pumpRevision: string;
  readonly measurement: Readonly<FieldValidationMeasurement>;
  readonly assumptions: readonly string[];
}

function requireText(value: string, field: string): void {
  if (!value.trim()) throw new Error(`FIELD-CASE-INVALID:${field}`);
}

function requirePositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`FIELD-CASE-INVALID:${field}`);
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`FIELD-CASE-INVALID:${field}`);
}

export function validateFieldValidationCase(input: Readonly<FieldValidationCase>): void {
  requireText(input.caseId, 'caseId');
  requireText(input.source.projectId, 'source.projectId');
  requireText(input.source.mixRevisionId, 'source.mixRevisionId');
  requireText(input.source.pipelineScenarioId, 'source.pipelineScenarioId');
  requireText(input.source.pumpScenarioId, 'source.pumpScenarioId');
  requireText(input.source.sourceHash, 'source.sourceHash');
  requireText(input.source.recordedBy, 'source.recordedBy');
  if (!Number.isFinite(Date.parse(input.source.recordedAtIso))) throw new Error('FIELD-CASE-INVALID:source.recordedAtIso');

  requirePositive(input.pipelineLengthM, 'pipelineLengthM');
  requirePositive(input.pipeInsideDiameterM, 'pipeInsideDiameterM');
  requireFinite(input.elevationChangeM, 'elevationChangeM');
  requireText(input.pumpMake, 'pumpMake');
  requireText(input.pumpModel, 'pumpModel');
  requireText(input.pumpRevision, 'pumpRevision');

  requirePositive(input.measurement.measuredFlowRateM3s, 'measurement.measuredFlowRateM3s');
  requirePositive(input.measurement.measuredPressurePa, 'measurement.measuredPressurePa');
  requireText(input.measurement.pressureSensorId, 'measurement.pressureSensorId');
  requireFinite(input.measurement.pressureSensorLocationM, 'measurement.pressureSensorLocationM');
  requireText(input.measurement.pressureSensorCalibrationRef, 'measurement.pressureSensorCalibrationRef');

  if (input.evidenceQuality === 'EXCLUDED') {
    requireText(input.exclusionReason ?? '', 'exclusionReason');
  } else if (input.exclusionReason?.trim()) {
    throw new Error('FIELD-CASE-INVALID:exclusionReasonOnlyForExcluded');
  }

  if (input.lubricationQualificationMode === 'UNAVAILABLE') {
    if (input.lubricationLayerRheology || input.lubricationLayerThicknessM !== undefined) {
      throw new Error('FIELD-CASE-INVALID:lubricationUnavailableHasValues');
    }
  } else {
    if (!input.lubricationLayerRheology) throw new Error('FIELD-CASE-INVALID:lubricationLayerRheology');
    requirePositive(input.lubricationLayerThicknessM ?? Number.NaN, 'lubricationLayerThicknessM');
  }

  if (input.assumptions.some(item => /^unresolved:/i.test(item.trim()))) {
    throw new Error('FIELD-CASE-UNRESOLVED-ASSUMPTION');
  }
}
