export interface Gao2024ElbowCorrectionInput {
  bendRadiusMm: number;
  inclinationDeg: number;
  meanVelocityMS: number;
}

export interface Gao2024FlowConversionInput {
  flowRateM3H: number;
  pipeInnerDiameterM: number;
}

export interface Gao2024ElbowCorrectionResult {
  lambda: number;
  method: 'pressure-elbow-002-gao-2024-lambda-v1';
  validationStatus: 'candidate';
  sourceDomain: 'gao-2024-calibration-domain';
}

const MIN_RADIUS_MM = 195;
const MAX_RADIUS_MM = 355;
const MIN_INCLINATION_DEG = -90;
const MAX_INCLINATION_DEG = 90;
const SOURCE_PIPE_DIAMETER_M = 0.125;
const MIN_FLOW_M3H = 40;
const MAX_FLOW_M3H = 120;

function requireFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
}

export function meanVelocityFromFlowRateM3H(input: Gao2024FlowConversionInput): number {
  requireFinite('flowRateM3H', input.flowRateM3H);
  requireFinite('pipeInnerDiameterM', input.pipeInnerDiameterM);
  if (input.flowRateM3H < 0) throw new Error('flowRateM3H must be >= 0');
  if (input.pipeInnerDiameterM <= 0) throw new Error('pipeInnerDiameterM must be > 0');

  const flowRateM3S = input.flowRateM3H / 3600;
  const areaM2 = Math.PI * input.pipeInnerDiameterM ** 2 / 4;
  return flowRateM3S / areaM2;
}

export function sourceDomainVelocityRangeMS(): { min: number; max: number } {
  return {
    min: meanVelocityFromFlowRateM3H({ flowRateM3H: MIN_FLOW_M3H, pipeInnerDiameterM: SOURCE_PIPE_DIAMETER_M }),
    max: meanVelocityFromFlowRateM3H({ flowRateM3H: MAX_FLOW_M3H, pipeInnerDiameterM: SOURCE_PIPE_DIAMETER_M }),
  };
}

export function evaluateGao2024ElbowCorrection(input: Gao2024ElbowCorrectionInput): Gao2024ElbowCorrectionResult {
  requireFinite('bendRadiusMm', input.bendRadiusMm);
  requireFinite('inclinationDeg', input.inclinationDeg);
  requireFinite('meanVelocityMS', input.meanVelocityMS);

  if (input.bendRadiusMm < MIN_RADIUS_MM || input.bendRadiusMm > MAX_RADIUS_MM) {
    throw new Error(`bendRadiusMm is outside Gao 2024 source domain [${MIN_RADIUS_MM}, ${MAX_RADIUS_MM}] mm`);
  }
  if (input.inclinationDeg < MIN_INCLINATION_DEG || input.inclinationDeg > MAX_INCLINATION_DEG) {
    throw new Error(`inclinationDeg is outside Gao 2024 source domain [${MIN_INCLINATION_DEG}, ${MAX_INCLINATION_DEG}] deg`);
  }

  const velocityRange = sourceDomainVelocityRangeMS();
  if (input.meanVelocityMS < velocityRange.min || input.meanVelocityMS > velocityRange.max) {
    throw new Error(`meanVelocityMS is outside Gao 2024 source domain [${velocityRange.min}, ${velocityRange.max}] m/s`);
  }

  const r = input.bendRadiusMm;
  const theta = input.inclinationDeg;
  const v = input.meanVelocityMS;

  const lambda =
    -2.0663e-8 * r ** 2 * theta
    + 1.2749e-5 * r * theta
    - 0.00157 * v * theta
    + 0.0021 * r * v
    + 0.0025 * r
    + 0.00807 * theta
    + 0.7545 * v
    + 0.3001;

  return {
    lambda,
    method: 'pressure-elbow-002-gao-2024-lambda-v1',
    validationStatus: 'candidate',
    sourceDomain: 'gao-2024-calibration-domain',
  };
}
