import { solveTwoFluidBingham, type BinghamMaterial } from './twoFluidBingham';

export interface PublishedVerificationSource {
  readonly referenceId: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly publicationYear: number;
  readonly doi: string;
  readonly sourceVersion: string;
  readonly sourceHash: string;
  readonly peerReviewed: boolean;
  readonly fullScalePumping: boolean;
}

export interface PublishedFullScaleVerificationCase {
  readonly caseId: string;
  readonly source: Readonly<PublishedVerificationSource>;
  readonly targetFlowRateM3s: number;
  readonly pipeRadiusM: number;
  readonly lubricationLayerThicknessM: number;
  readonly bulk: Readonly<BinghamMaterial>;
  readonly lubricationLayer: Readonly<BinghamMaterial>;
  readonly measuredPressureGradientPaPerM: number;
  readonly assumptions: readonly string[];
  readonly sourceInputTrace: Readonly<Record<
    'targetFlowRateM3s' |
    'pipeRadiusM' |
    'lubricationLayerThicknessM' |
    'bulkYieldStressPa' |
    'bulkPlasticViscosityPaS' |
    'lubricationLayerYieldStressPa' |
    'lubricationLayerPlasticViscosityPaS' |
    'measuredPressureGradientPaPerM',
    string
  >>;
}

export interface PublishedVerificationResult {
  readonly caseId: string;
  readonly referenceId: string;
  readonly predictedPressureGradientPaPerM: number;
  readonly measuredPressureGradientPaPerM: number;
  readonly absoluteErrorPaPerM: number;
  readonly relativeErrorFraction: number | null;
  readonly solverConverged: boolean;
  readonly solverMethod: 'tolue-two-fluid-bingham-coaxial-v1';
  readonly sourceHash: string;
  readonly assumptions: readonly string[];
  readonly method: 'tolue-published-full-scale-verification-v1';
}

function finitePositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`TIER-B-CASE-INVALID:${field}`);
}

function finiteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`TIER-B-CASE-INVALID:${field}`);
}

function nonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new Error(`TIER-B-CASE-INVALID:${field}`);
}

export function validatePublishedFullScaleCase(input: Readonly<PublishedFullScaleVerificationCase>): void {
  nonEmpty(input.caseId, 'caseId');
  nonEmpty(input.source.referenceId, 'source.referenceId');
  nonEmpty(input.source.title, 'source.title');
  nonEmpty(input.source.doi, 'source.doi');
  nonEmpty(input.source.sourceVersion, 'source.sourceVersion');
  nonEmpty(input.source.sourceHash, 'source.sourceHash');
  if (!input.source.peerReviewed) throw new Error('TIER-B-CASE-NOT-PEER-REVIEWED');
  if (!input.source.fullScalePumping) throw new Error('TIER-B-CASE-NOT-FULL-SCALE');
  if (!Number.isInteger(input.source.publicationYear) || input.source.publicationYear < 1900) throw new Error('TIER-B-CASE-INVALID:source.publicationYear');
  if (input.source.authors.length === 0 || input.source.authors.some(author => !author.trim())) throw new Error('TIER-B-CASE-INVALID:source.authors');

  finitePositive(input.targetFlowRateM3s, 'targetFlowRateM3s');
  finitePositive(input.pipeRadiusM, 'pipeRadiusM');
  finitePositive(input.lubricationLayerThicknessM, 'lubricationLayerThicknessM');
  if (input.lubricationLayerThicknessM >= input.pipeRadiusM) throw new Error('TIER-B-CASE-INVALID:lubricationLayerThicknessM');
  finiteNonNegative(input.bulk.yieldStressPa, 'bulk.yieldStressPa');
  finitePositive(input.bulk.plasticViscosityPaS, 'bulk.plasticViscosityPaS');
  finiteNonNegative(input.lubricationLayer.yieldStressPa, 'lubricationLayer.yieldStressPa');
  finitePositive(input.lubricationLayer.plasticViscosityPaS, 'lubricationLayer.plasticViscosityPaS');
  finitePositive(input.measuredPressureGradientPaPerM, 'measuredPressureGradientPaPerM');

  const traceKeys = [
    'targetFlowRateM3s',
    'pipeRadiusM',
    'lubricationLayerThicknessM',
    'bulkYieldStressPa',
    'bulkPlasticViscosityPaS',
    'lubricationLayerYieldStressPa',
    'lubricationLayerPlasticViscosityPaS',
    'measuredPressureGradientPaPerM',
  ] as const;
  for (const key of traceKeys) nonEmpty(input.sourceInputTrace[key], `sourceInputTrace.${key}`);

  if (input.assumptions.some(item => /^unresolved:/i.test(item.trim()))) {
    throw new Error('TIER-B-CASE-UNRESOLVED-ASSUMPTION');
  }
}

export function evaluatePublishedFullScaleCase(
  input: Readonly<PublishedFullScaleVerificationCase>,
): Readonly<PublishedVerificationResult> {
  validatePublishedFullScaleCase(input);

  const solver = solveTwoFluidBingham({
    targetFlowRateM3s: input.targetFlowRateM3s,
    pipeRadiusM: input.pipeRadiusM,
    lubricationLayerThicknessM: input.lubricationLayerThicknessM,
    bulk: input.bulk,
    lubricationLayer: input.lubricationLayer,
  });

  const absoluteErrorPaPerM = solver.pressureGradientPaPerM - input.measuredPressureGradientPaPerM;
  const relativeErrorFraction = input.measuredPressureGradientPaPerM === 0
    ? null
    : absoluteErrorPaPerM / input.measuredPressureGradientPaPerM;

  return Object.freeze({
    caseId: input.caseId,
    referenceId: input.source.referenceId,
    predictedPressureGradientPaPerM: solver.pressureGradientPaPerM,
    measuredPressureGradientPaPerM: input.measuredPressureGradientPaPerM,
    absoluteErrorPaPerM,
    relativeErrorFraction,
    solverConverged: solver.converged,
    solverMethod: solver.method,
    sourceHash: input.source.sourceHash,
    assumptions: Object.freeze([...input.assumptions]),
    method: 'tolue-published-full-scale-verification-v1',
  });
}
