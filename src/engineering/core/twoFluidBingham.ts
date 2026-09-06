export interface BinghamMaterial {
  yieldStressPa: number;
  plasticViscosityPaS: number;
}

export interface TwoFluidBinghamInput {
  targetFlowRateM3s: number;
  pipeRadiusM: number;
  lubricationLayerThicknessM: number;
  bulk: BinghamMaterial;
  lubricationLayer: BinghamMaterial;
  toleranceM3s?: number;
  maxIterations?: number;
}

export interface TwoFluidBinghamForwardInput {
  pressureGradientPaPerM: number;
  pipeRadiusM: number;
  lubricationLayerThicknessM: number;
  bulk: BinghamMaterial;
  lubricationLayer: BinghamMaterial;
}

export interface TwoFluidBinghamResult {
  pressureGradientPaPerM: number;
  flowRateM3s: number;
  wallShearStressPa: number;
  interfaceShearStressPa: number;
  bulkPlugRadiusM: number;
  bulkRadiusM: number;
  iterations: number;
  converged: boolean;
  method: 'tolue-two-fluid-bingham-coaxial-v1';
}

function validateMaterial(material: BinghamMaterial, name: string): void {
  if (!Number.isFinite(material.yieldStressPa) || material.yieldStressPa < 0) {
    throw new Error(`${name}.yieldStressPa must be finite and >= 0`);
  }
  if (!Number.isFinite(material.plasticViscosityPaS) || material.plasticViscosityPaS <= 0) {
    throw new Error(`${name}.plasticViscosityPaS must be finite and > 0`);
  }
}

function validateGeometry(radius: number, llThickness: number): number {
  if (!Number.isFinite(radius) || radius <= 0) throw new Error('pipeRadiusM must be finite and > 0');
  if (!Number.isFinite(llThickness) || llThickness < 0 || llThickness >= radius) {
    throw new Error('lubricationLayerThicknessM must be finite and satisfy 0 <= thickness < pipe radius');
  }
  return radius - llThickness;
}

/**
 * Shear stress magnitude for fully-developed axisymmetric pressure-driven flow:
 * tau(r) = G r / 2, where G = DeltaP/L.
 */
function shearStressAtRadius(g: number, r: number): number {
  return 0.5 * g * r;
}

function binghamShearRate(tau: number, material: BinghamMaterial): number {
  if (tau <= material.yieldStressPa) return 0;
  return (tau - material.yieldStressPa) / material.plasticViscosityPaS;
}

/**
 * Numerical reference implementation of steady coaxial two-fluid Bingham flow.
 *
 * Assumptions:
 * - circular straight pipe
 * - steady, laminar, fully developed, incompressible flow
 * - concentric bulk concrete + lubrication layer
 * - no slip at wall
 * - velocity continuity at the bulk/LL interface
 * - common pressure gradient across both domains
 *
 * The radial velocity field is reconstructed by integrating dv/dr = -gammaDot
 * inward from the no-slip wall. Flow rate is then integrated over the section.
 * This deliberately favors transparent verification over premature closed-form
 * optimization. It can later serve as an independent numerical oracle for an
 * analytical implementation.
 */
export function flowRateForTwoFluidBingham(input: TwoFluidBinghamForwardInput): Omit<TwoFluidBinghamResult, 'iterations' | 'converged'> {
  const { pressureGradientPaPerM: g, pipeRadiusM: R, lubricationLayerThicknessM: ll, bulk, lubricationLayer } = input;
  if (!Number.isFinite(g) || g < 0) throw new Error('pressureGradientPaPerM must be finite and >= 0');
  validateMaterial(bulk, 'bulk');
  validateMaterial(lubricationLayer, 'lubricationLayer');
  const Rc = validateGeometry(R, ll);

  if (g === 0) {
    return {
      pressureGradientPaPerM: 0,
      flowRateM3s: 0,
      wallShearStressPa: 0,
      interfaceShearStressPa: 0,
      bulkPlugRadiusM: Rc,
      bulkRadiusM: Rc,
      method: 'tolue-two-fluid-bingham-coaxial-v1',
    };
  }

  // Fixed high-resolution radial quadrature for deterministic engineering verification.
  const N = 4096;
  const dr = R / N;
  const r = new Float64Array(N + 1);
  const v = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) r[i] = i * dr;
  v[N] = 0; // no slip at wall

  // Integrate velocity from wall inward. Material is selected by radial domain.
  for (let i = N - 1; i >= 0; i--) {
    const rMid = (r[i] + r[i + 1]) / 2;
    const mat = rMid <= Rc ? bulk : lubricationLayer;
    const gamma = binghamShearRate(shearStressAtRadius(g, rMid), mat);
    v[i] = v[i + 1] + gamma * dr;
  }

  // Axisymmetric area integration: Q = integral 2*pi*r*v(r) dr.
  let q = 0;
  for (let i = 0; i < N; i++) {
    const f0 = 2 * Math.PI * r[i] * v[i];
    const f1 = 2 * Math.PI * r[i + 1] * v[i + 1];
    q += 0.5 * (f0 + f1) * dr;
  }

  const wallTau = shearStressAtRadius(g, R);
  const interfaceTau = shearStressAtRadius(g, Rc);
  const theoreticalBulkPlugRadius = bulk.yieldStressPa === 0 ? 0 : (2 * bulk.yieldStressPa) / g;
  const bulkPlugRadius = Math.min(Rc, theoreticalBulkPlugRadius);

  return {
    pressureGradientPaPerM: g,
    flowRateM3s: q,
    wallShearStressPa: wallTau,
    interfaceShearStressPa: interfaceTau,
    bulkPlugRadiusM: bulkPlugRadius,
    bulkRadiusM: Rc,
    method: 'tolue-two-fluid-bingham-coaxial-v1',
  };
}

/** Inverse solver: target Q -> required pressure gradient DeltaP/L. */
export function solveTwoFluidBingham(input: TwoFluidBinghamInput): TwoFluidBinghamResult {
  const { targetFlowRateM3s: target, pipeRadiusM: R, lubricationLayerThicknessM: ll, bulk, lubricationLayer } = input;
  if (!Number.isFinite(target) || target < 0) throw new Error('targetFlowRateM3s must be finite and >= 0');
  validateMaterial(bulk, 'bulk');
  validateMaterial(lubricationLayer, 'lubricationLayer');
  validateGeometry(R, ll);

  if (target === 0) {
    const f = flowRateForTwoFluidBingham({ pressureGradientPaPerM: 0, pipeRadiusM: R, lubricationLayerThicknessM: ll, bulk, lubricationLayer });
    return { ...f, iterations: 0, converged: true };
  }

  const tolerance = input.toleranceM3s ?? Math.max(1e-10, target * 1e-8);
  const maxIterations = input.maxIterations ?? 120;

  let lo = 0;
  let hi = Math.max(1, (2 * lubricationLayer.yieldStressPa) / R, (2 * bulk.yieldStressPa) / Math.max(R - ll, Number.EPSILON));
  let fHi = flowRateForTwoFluidBingham({ pressureGradientPaPerM: hi, pipeRadiusM: R, lubricationLayerThicknessM: ll, bulk, lubricationLayer });

  let expansions = 0;
  while (fHi.flowRateM3s < target && expansions < 80) {
    hi *= 2;
    fHi = flowRateForTwoFluidBingham({ pressureGradientPaPerM: hi, pipeRadiusM: R, lubricationLayerThicknessM: ll, bulk, lubricationLayer });
    expansions++;
  }
  if (fHi.flowRateM3s < target) throw new Error('Unable to bracket target flow rate');

  let last = fHi;
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const mid = 0.5 * (lo + hi);
    const current = flowRateForTwoFluidBingham({ pressureGradientPaPerM: mid, pipeRadiusM: R, lubricationLayerThicknessM: ll, bulk, lubricationLayer });
    last = current;
    const error = current.flowRateM3s - target;
    if (Math.abs(error) <= tolerance) return { ...current, iterations: iteration, converged: true };
    if (error < 0) lo = mid;
    else hi = mid;
  }

  return { ...last, iterations: maxIterations, converged: false };
}
