import type { PipelineAnalysisInput } from './pipeline';

export type PumpabilityRiskScreenStatus = 'ACCEPTABLE' | 'UNACCEPTABLE' | 'NOT_ASSESSED';

export interface PumpabilityRiskScreeningInput {
  /** Nominal maximum coarse-aggregate size used for the conservative geometric screen. */
  nominalMaximumAggregateSizeM: number;
  /** Yield stress of the suspending mortar/paste phase, not the bulk-concrete yield stress. */
  suspendingPhaseYieldStressPa: number;
  suspendingPhaseDensityKgM3: number;
  coarseAggregateDensityKgM3: number;
}

export interface BlockageGeometryScreenResult {
  status: PumpabilityRiskScreenStatus;
  nominalMaximumAggregateSizeM: number;
  minimumKnownPipeInsideDiameterM: number | null;
  governingSegmentId: string | null;
  aggregateToPipeDiameterRatio: number | null;
  conservativeLimitRatio: 0.3333333333333333;
  marginToLimit: number | null;
  referenceIds: readonly ['ACI-211.9R-18', 'ACI-304.2R-17'];
  applicability: string;
  limitations: string[];
  method: 'tolue-blockage-geometric-screen-v1';
}

export interface StaticSegregationScreenResult {
  status: PumpabilityRiskScreenStatus;
  nominalMaximumAggregateSizeM: number;
  suspendingPhaseYieldStressPa: number;
  criticalYieldStressPa: number | null;
  stabilityRatio: number | null;
  yieldStressMarginPa: number | null;
  densityDifferenceKgM3: number;
  referenceIds: readonly ['ROUSSEL-2006-STABILITY'];
  applicability: string;
  limitations: string[];
  method: 'tolue-static-segregation-screen-roussel-2006-v1';
}

export interface PumpabilityRiskScreeningResult {
  blockage: BlockageGeometryScreenResult;
  stability: StaticSegregationScreenResult;
  method: 'tolue-pumpability-risk-screening-v1';
}

const ONE_THIRD = 1 / 3 as 0.3333333333333333;
const STANDARD_GRAVITY_MS2 = 9.80665;

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Conservative pumpability screening. This is deliberately not an opaque score.
 *
 * Blockage: NMS / smallest known straight-pipe inside diameter <= 1/3.
 * The one-third criterion is the conservative ACI pumpable-concrete sizing screen.
 * It is not an exact plug-location or arching solver.
 *
 * Stability: single-particle static segregation criterion from Roussel (2006):
 * tau_critical = |rho_s-rho_f| g d / 18.
 * The suspending-phase yield stress must therefore be supplied explicitly and is
 * not substituted by the bulk-concrete yield stress.
 */
export function assessPumpabilityRiskScreening(
  pipeline: Readonly<PipelineAnalysisInput>,
  input: Readonly<PumpabilityRiskScreeningInput>,
): PumpabilityRiskScreeningResult {
  const nms = input.nominalMaximumAggregateSizeM;
  const straightSegments = pipeline.segments.filter(
    (segment): segment is Extract<PipelineAnalysisInput['segments'][number], { kind: 'straight' }> => segment.kind === 'straight',
  );
  const validPipes = straightSegments.filter(segment => finitePositive(segment.pipeRadiusM));
  const governing = validPipes.reduce<(typeof validPipes)[number] | null>((current, segment) => {
    if (!current) return segment;
    return segment.pipeRadiusM < current.pipeRadiusM ? segment : current;
  }, null);
  const minimumDiameter = governing ? governing.pipeRadiusM * 2 : null;

  const blockageLimitations = [
    'This is a conservative aggregate-to-pipe geometric screening criterion, not a physical plug-location or arching solver.',
    'The screen uses the smallest known straight-pipe inside diameter; local fittings without an explicit inside diameter are not geometrically screened.',
    'Aggregate grading, shape, concentration, lubrication loss, interruptions, bends, reducers, hose behavior, and field variability can create blockage mechanisms not represented by this ratio alone.',
  ];

  let blockageStatus: PumpabilityRiskScreenStatus = 'NOT_ASSESSED';
  let ratio: number | null = null;
  let marginToLimit: number | null = null;
  if (finitePositive(nms) && minimumDiameter !== null && finitePositive(minimumDiameter)) {
    ratio = nms / minimumDiameter;
    marginToLimit = ONE_THIRD - ratio;
    blockageStatus = ratio <= ONE_THIRD ? 'ACCEPTABLE' : 'UNACCEPTABLE';
  }

  const blockage: BlockageGeometryScreenResult = {
    status: blockageStatus,
    nominalMaximumAggregateSizeM: nms,
    minimumKnownPipeInsideDiameterM: minimumDiameter,
    governingSegmentId: governing?.id ?? null,
    aggregateToPipeDiameterRatio: ratio,
    conservativeLimitRatio: ONE_THIRD,
    marginToLimit,
    referenceIds: ['ACI-211.9R-18', 'ACI-304.2R-17'],
    applicability: 'Conservative geometric screening of nominal maximum coarse-aggregate size against the smallest known straight-pipeline inside diameter for pumped concrete.',
    limitations: blockageLimitations,
    method: 'tolue-blockage-geometric-screen-v1',
  };

  const rhoDifference = Math.abs(input.coarseAggregateDensityKgM3 - input.suspendingPhaseDensityKgM3);
  const stabilityLimitations = [
    'This is a static single-particle segregation screen based on a yield-stress suspending phase; it is not a universal dynamic pumping-stability certification.',
    'The supplied yield stress must represent the suspending mortar/paste phase. Bulk-concrete yield stress is not silently substituted.',
    'The Roussel criterion idealizes particle geometry and does not by itself represent full particle-size distribution, particle interactions, bleeding, thixotropy evolution, vibration, or pumping-induced migration.',
  ];

  let stabilityStatus: PumpabilityRiskScreenStatus = 'NOT_ASSESSED';
  let criticalYieldStressPa: number | null = null;
  let stabilityRatio: number | null = null;
  let yieldStressMarginPa: number | null = null;
  if (
    finitePositive(nms)
    && finiteNonNegative(input.suspendingPhaseYieldStressPa)
    && finitePositive(input.suspendingPhaseDensityKgM3)
    && finitePositive(input.coarseAggregateDensityKgM3)
  ) {
    criticalYieldStressPa = rhoDifference * STANDARD_GRAVITY_MS2 * nms / 18;
    yieldStressMarginPa = input.suspendingPhaseYieldStressPa - criticalYieldStressPa;
    stabilityRatio = criticalYieldStressPa === 0
      ? Number.POSITIVE_INFINITY
      : input.suspendingPhaseYieldStressPa / criticalYieldStressPa;
    stabilityStatus = input.suspendingPhaseYieldStressPa >= criticalYieldStressPa ? 'ACCEPTABLE' : 'UNACCEPTABLE';
  }

  const stability: StaticSegregationScreenResult = {
    status: stabilityStatus,
    nominalMaximumAggregateSizeM: nms,
    suspendingPhaseYieldStressPa: input.suspendingPhaseYieldStressPa,
    criticalYieldStressPa,
    stabilityRatio,
    yieldStressMarginPa,
    densityDifferenceKgM3: rhoDifference,
    referenceIds: ['ROUSSEL-2006-STABILITY'],
    applicability: 'Preliminary static segregation screening for coarse particles in a yield-stress suspending mortar/paste phase using the Roussel single-particle stability criterion.',
    limitations: stabilityLimitations,
    method: 'tolue-static-segregation-screen-roussel-2006-v1',
  };

  return { blockage, stability, method: 'tolue-pumpability-risk-screening-v1' };
}
