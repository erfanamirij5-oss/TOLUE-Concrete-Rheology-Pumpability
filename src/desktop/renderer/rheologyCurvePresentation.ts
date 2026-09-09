import type { SimulationRheologyCurves } from '../../engineering/core/simulationRun';

export interface RheologyCurveSeriesPresentation {
  readonly id: 'bulk' | 'lubrication-layer';
  readonly label: string;
  readonly yieldStressPa: number;
  readonly plasticViscosityPaS: number;
  readonly points: readonly Readonly<{ shearRateSInv: number; shearStressPa: number }>[];
  readonly method: 'tolue-bingham-rheology-curve-v1';
}

export interface RheologyCurvesPresentation {
  readonly series: readonly Readonly<RheologyCurveSeriesPresentation>[];
  readonly samplingShearRatesSInv: readonly number[];
  readonly method: SimulationRheologyCurves['method'];
}

export function createRheologyCurvesPresentation(curves: Readonly<SimulationRheologyCurves>): Readonly<RheologyCurvesPresentation> {
  const make = (id: RheologyCurveSeriesPresentation['id'], label: string, curve: SimulationRheologyCurves['bulk']) => Object.freeze({
    id, label, yieldStressPa: curve.yieldStressPa, plasticViscosityPaS: curve.plasticViscosityPaS,
    points: Object.freeze(curve.points.map(point => Object.freeze({ shearRateSInv: point.shearRateSInv, shearStressPa: point.shearStressPa }))),
    method: curve.method,
  });
  return Object.freeze({
    series: Object.freeze([
      make('bulk', 'بتن حجمی', curves.bulk),
      make('lubrication-layer', 'لایه روانکار', curves.lubricationLayer),
    ]),
    samplingShearRatesSInv: Object.freeze([...curves.samplingShearRatesSInv]),
    method: curves.method,
  });
}
