export interface BinghamFluid {
  yieldStressPa: number;
  plasticViscosityPaS: number;
}

export interface StraightPipeInput {
  flowRateM3S: number;
  diameterM: number;
  lengthM: number;
  fluid: BinghamFluid;
}

export interface StraightPipeResult {
  pressureGradientPaM: number;
  pressureLossPa: number;
  wallShearStressPa: number;
  plugRadiusM: number;
  plugRadiusRatio: number;
  iterations: number;
  method: 'buckingham-reiner-inverse-bisection-v1';
}

const PI = Math.PI;

function assertFinitePositive(name: string, value: number, allowZero = false): void {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    throw new RangeError(`${name} must be ${allowZero ? 'non-negative' : 'positive'} and finite.`);
  }
}

/**
 * Exact Buckingham-Reiner volumetric flow for a Bingham fluid in a circular pipe.
 * SI units only. The expression reduces to Hagen-Poiseuille when yieldStressPa = 0.
 */
export function binghamFlowRateFromPressureGradient(
  pressureGradientPaM: number,
  diameterM: number,
  fluid: BinghamFluid,
): number {
  assertFinitePositive('pressureGradientPaM', pressureGradientPaM);
  assertFinitePositive('diameterM', diameterM);
  assertFinitePositive('plasticViscosityPaS', fluid.plasticViscosityPaS);
  assertFinitePositive('yieldStressPa', fluid.yieldStressPa, true);

  const radius = diameterM / 2;
  const wallShear = pressureGradientPaM * radius / 2;
  if (wallShear <= fluid.yieldStressPa) return 0;

  const a = fluid.yieldStressPa / wallShear;
  const correction = 1 - (4 / 3) * a + (1 / 3) * Math.pow(a, 4);
  return (PI * Math.pow(radius, 4) * pressureGradientPaM / (8 * fluid.plasticViscosityPaS)) * correction;
}

/**
 * Solves required pressure gradient for a target Q using a monotone bracketed bisection.
 * No empirical fitting, no hidden defaults, no water-pipe K factors.
 */
export function solveStraightPipeBingham(input: StraightPipeInput): StraightPipeResult {
  assertFinitePositive('flowRateM3S', input.flowRateM3S);
  assertFinitePositive('diameterM', input.diameterM);
  assertFinitePositive('lengthM', input.lengthM);
  assertFinitePositive('plasticViscosityPaS', input.fluid.plasticViscosityPaS);
  assertFinitePositive('yieldStressPa', input.fluid.yieldStressPa, true);

  const radius = input.diameterM / 2;
  const yieldGradient = radius > 0 ? (2 * input.fluid.yieldStressPa) / radius : 0;
  let low = Math.max(yieldGradient, Number.EPSILON);
  let high = Math.max(low * 2, 1);

  let expansion = 0;
  while (binghamFlowRateFromPressureGradient(high, input.diameterM, input.fluid) < input.flowRateM3S) {
    high *= 2;
    expansion += 1;
    if (expansion > 100 || !Number.isFinite(high)) {
      throw new RangeError('Unable to bracket pressure gradient for requested flow rate.');
    }
  }

  const relativeTolerance = 1e-10;
  const maxIterations = 200;
  let mid = high;
  let iterations = 0;

  for (; iterations < maxIterations; iterations += 1) {
    mid = (low + high) / 2;
    const q = binghamFlowRateFromPressureGradient(mid, input.diameterM, input.fluid);
    const relativeError = Math.abs(q - input.flowRateM3S) / input.flowRateM3S;
    if (relativeError <= relativeTolerance) break;
    if (q < input.flowRateM3S) low = mid;
    else high = mid;
  }

  const pressureGradientPaM = mid;
  const wallShearStressPa = pressureGradientPaM * radius / 2;
  const plugRadiusM = input.fluid.yieldStressPa === 0
    ? 0
    : Math.min(radius, (2 * input.fluid.yieldStressPa) / pressureGradientPaM);

  return {
    pressureGradientPaM,
    pressureLossPa: pressureGradientPaM * input.lengthM,
    wallShearStressPa,
    plugRadiusM,
    plugRadiusRatio: plugRadiusM / radius,
    iterations: iterations + 1,
    method: 'buckingham-reiner-inverse-bisection-v1',
  };
}
