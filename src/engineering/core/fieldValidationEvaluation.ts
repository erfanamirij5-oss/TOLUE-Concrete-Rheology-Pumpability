import { solveTwoFluidBingham } from './twoFluidBingham';
import { validateFieldValidationCase, type FieldValidationCase } from './fieldValidationDataset';

export interface FieldValidationComparisonBasis {
  readonly hydraulicScope: 'STRAIGHT_PIPE_WITH_ELEVATION';
  readonly comparisonLengthM: number;
  readonly elevationChangeM: number;
  readonly concreteDensityKgM3: number;
  readonly measuredPressureDropPa: number;
  readonly pressureReferenceDescription: string;
  readonly sourceTrace: string;
}

export interface FieldValidationEvaluationInput {
  readonly fieldCase: Readonly<FieldValidationCase>;
  readonly comparison: Readonly<FieldValidationComparisonBasis>;
}

export interface FieldValidationEvaluationResult {
  readonly caseId: string;
  readonly projectId: string;
  readonly evidenceQuality: FieldValidationCase['evidenceQuality'];
  readonly predictedFrictionPressureDropPa: number;
  readonly predictedElevationPressurePa: number;
  readonly predictedTotalPressureDropPa: number;
  readonly measuredPressureDropPa: number;
  readonly absoluteErrorPa: number;
  readonly relativeErrorFraction: number | null;
  readonly solverConverged: boolean;
  readonly solverMethod: 'tolue-two-fluid-bingham-coaxial-v1';
  readonly sourceHash: string;
  readonly comparisonSourceTrace: string;
  readonly method: 'tolue-field-validation-comparison-v1';
}

const GRAVITY_M_S2 = 9.80665;

function positive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`FIELD-COMPARISON-INVALID:${field}`);
}
function finite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`FIELD-COMPARISON-INVALID:${field}`);
}
function text(value: string, field: string): void {
  if (!value.trim()) throw new Error(`FIELD-COMPARISON-INVALID:${field}`);
}

/**
 * Compares a controlled Tier-C field pressure-drop observation against the
 * current straight-pipe two-fluid solver. The comparison basis is explicit so
 * a gauge reading is never silently interpreted as a pressure drop, and
 * fittings/boom/hose losses are never hidden inside a straight-pipe claim.
 */
export function evaluateFieldValidationCase(
  input: Readonly<FieldValidationEvaluationInput>,
): Readonly<FieldValidationEvaluationResult> {
  validateFieldValidationCase(input.fieldCase);
  if (input.fieldCase.evidenceQuality === 'EXCLUDED') throw new Error('FIELD-COMPARISON-EXCLUDED');
  if (input.fieldCase.lubricationQualificationMode === 'UNAVAILABLE') throw new Error('FIELD-COMPARISON-LL-UNAVAILABLE');
  if (!input.fieldCase.lubricationLayerRheology || input.fieldCase.lubricationLayerThicknessM === undefined) throw new Error('FIELD-COMPARISON-LL-MISSING');

  const basis = input.comparison;
  if (basis.hydraulicScope !== 'STRAIGHT_PIPE_WITH_ELEVATION') throw new Error('FIELD-COMPARISON-SCOPE-001');
  positive(basis.comparisonLengthM, 'comparisonLengthM');
  finite(basis.elevationChangeM, 'elevationChangeM');
  positive(basis.concreteDensityKgM3, 'concreteDensityKgM3');
  positive(basis.measuredPressureDropPa, 'measuredPressureDropPa');
  text(basis.pressureReferenceDescription, 'pressureReferenceDescription');
  text(basis.sourceTrace, 'sourceTrace');
  if (basis.comparisonLengthM > input.fieldCase.pipelineLengthM) throw new Error('FIELD-COMPARISON-LENGTH-OUTSIDE-CASE');

  const solver = solveTwoFluidBingham({
    targetFlowRateM3s: input.fieldCase.measurement.measuredFlowRateM3s,
    pipeRadiusM: input.fieldCase.pipeInsideDiameterM / 2,
    lubricationLayerThicknessM: input.fieldCase.lubricationLayerThicknessM,
    bulk: input.fieldCase.bulkRheology,
    lubricationLayer: input.fieldCase.lubricationLayerRheology,
  });

  const predictedFrictionPressureDropPa = solver.pressureGradientPaPerM * basis.comparisonLengthM;
  const predictedElevationPressurePa = basis.concreteDensityKgM3 * GRAVITY_M_S2 * basis.elevationChangeM;
  const predictedTotalPressureDropPa = predictedFrictionPressureDropPa + predictedElevationPressurePa;
  const absoluteErrorPa = predictedTotalPressureDropPa - basis.measuredPressureDropPa;
  const relativeErrorFraction = basis.measuredPressureDropPa === 0 ? null : absoluteErrorPa / basis.measuredPressureDropPa;

  return Object.freeze({
    caseId: input.fieldCase.caseId,
    projectId: input.fieldCase.source.projectId,
    evidenceQuality: input.fieldCase.evidenceQuality,
    predictedFrictionPressureDropPa,
    predictedElevationPressurePa,
    predictedTotalPressureDropPa,
    measuredPressureDropPa: basis.measuredPressureDropPa,
    absoluteErrorPa,
    relativeErrorFraction,
    solverConverged: solver.converged,
    solverMethod: solver.method,
    sourceHash: input.fieldCase.source.sourceHash,
    comparisonSourceTrace: basis.sourceTrace,
    method: 'tolue-field-validation-comparison-v1',
  });
}
