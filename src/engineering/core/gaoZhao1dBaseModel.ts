export interface GaoZhaoBaseStateInput {
  meanVelocityMS: number;
  lubricationLayerThicknessM: number;
  mortarDensityKgM3: number;
  mortarDynamicViscosityPaS: number;
  equivalentAggregateDiameterM: number;
}

export interface GaoZhaoBaseState {
  equivalentDiameterM: number;
  mortarKinematicViscosityM2S: number;
  reynoldsNumber: number;
  relativeRoughness: number;
  modiFrictionCoefficient: number;
  method: 'gao-zhao-1d-base-primitives-v1';
}

function finitePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be finite and > 0`);
  }
}

export function equivalentLubricationDiameterM(lubricationLayerThicknessM: number): number {
  finitePositive('lubricationLayerThicknessM', lubricationLayerThicknessM);
  return 2 * lubricationLayerThicknessM;
}

export function mortarKinematicViscosityM2S(
  mortarDynamicViscosityPaS: number,
  mortarDensityKgM3: number,
): number {
  finitePositive('mortarDynamicViscosityPaS', mortarDynamicViscosityPaS);
  finitePositive('mortarDensityKgM3', mortarDensityKgM3);
  return mortarDynamicViscosityPaS / mortarDensityKgM3;
}

export function gaoZhaoReynoldsNumber(
  meanVelocityMS: number,
  equivalentDiameterM: number,
  kinematicViscosityM2S: number,
): number {
  finitePositive('meanVelocityMS', meanVelocityMS);
  finitePositive('equivalentDiameterM', equivalentDiameterM);
  finitePositive('kinematicViscosityM2S', kinematicViscosityM2S);
  return meanVelocityMS * equivalentDiameterM / kinematicViscosityM2S;
}

export function relativeAggregateRoughness(
  equivalentAggregateDiameterM: number,
  equivalentDiameterM: number,
): number {
  finitePositive('equivalentAggregateDiameterM', equivalentAggregateDiameterM);
  finitePositive('equivalentDiameterM', equivalentDiameterM);
  return equivalentAggregateDiameterM / equivalentDiameterM;
}

export function modiFrictionCoefficient(relativeRoughness: number, reynoldsNumber: number): number {
  finitePositive('relativeRoughness', relativeRoughness);
  finitePositive('reynoldsNumber', reynoldsNumber);
  return 0.0055 * (1 + Math.cbrt(20_000 * relativeRoughness + 1_000_000 / reynoldsNumber));
}

export function evaluateGaoZhaoBaseState(input: GaoZhaoBaseStateInput): GaoZhaoBaseState {
  finitePositive('meanVelocityMS', input.meanVelocityMS);
  const equivalentDiameterM = equivalentLubricationDiameterM(input.lubricationLayerThicknessM);
  const mortarKinematicViscosity = mortarKinematicViscosityM2S(
    input.mortarDynamicViscosityPaS,
    input.mortarDensityKgM3,
  );
  const reynoldsNumber = gaoZhaoReynoldsNumber(
    input.meanVelocityMS,
    equivalentDiameterM,
    mortarKinematicViscosity,
  );
  const relativeRoughness = relativeAggregateRoughness(
    input.equivalentAggregateDiameterM,
    equivalentDiameterM,
  );
  return {
    equivalentDiameterM,
    mortarKinematicViscosityM2S: mortarKinematicViscosity,
    reynoldsNumber,
    relativeRoughness,
    modiFrictionCoefficient: modiFrictionCoefficient(relativeRoughness, reynoldsNumber),
    method: 'gao-zhao-1d-base-primitives-v1',
  };
}
