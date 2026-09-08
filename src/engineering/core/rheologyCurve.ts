import type { BinghamMaterial } from './twoFluidBingham';

export interface RheologyCurvePoint {
  readonly shearRateSInv: number;
  readonly shearStressPa: number;
}

export interface RheologyCurveResult {
  readonly modelFamily: 'BINGHAM';
  readonly yieldStressPa: number;
  readonly plasticViscosityPaS: number;
  readonly points: readonly Readonly<RheologyCurvePoint>[];
  readonly method: 'tolue-bingham-rheology-curve-v1';
  readonly interpretation: 'positive-shear-rate-constitutive-line';
}

function validateMaterial(material: BinghamMaterial): void {
  if (!Number.isFinite(material.yieldStressPa) || material.yieldStressPa < 0) throw new Error('yieldStressPa must be finite and >= 0');
  if (!Number.isFinite(material.plasticViscosityPaS) || material.plasticViscosityPaS <= 0) throw new Error('plasticViscosityPaS must be finite and > 0');
}

export function buildBinghamRheologyCurve(
  material: Readonly<BinghamMaterial>,
  shearRatesSInv: readonly number[],
): Readonly<RheologyCurveResult> {
  validateMaterial(material);
  if (!Array.isArray(shearRatesSInv) || shearRatesSInv.length === 0) throw new Error('shearRatesSInv must contain at least one positive sample');
  let previous = 0;
  const points = shearRatesSInv.map((shearRateSInv, index) => {
    if (!Number.isFinite(shearRateSInv) || shearRateSInv <= 0) throw new Error('shearRatesSInv values must be finite and > 0');
    if (index > 0 && shearRateSInv <= previous) throw new Error('shearRatesSInv must be strictly increasing');
    previous = shearRateSInv;
    return Object.freeze({ shearRateSInv, shearStressPa: material.yieldStressPa + material.plasticViscosityPaS * shearRateSInv });
  });
  return Object.freeze({
    modelFamily: 'BINGHAM',
    yieldStressPa: material.yieldStressPa,
    plasticViscosityPaS: material.plasticViscosityPaS,
    points: Object.freeze(points),
    method: 'tolue-bingham-rheology-curve-v1',
    interpretation: 'positive-shear-rate-constitutive-line',
  });
}
