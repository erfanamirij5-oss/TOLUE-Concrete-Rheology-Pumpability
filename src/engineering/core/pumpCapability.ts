export type PumpCapabilityProvenance = 'manufacturer_curve' | 'manufacturer_rated_point' | 'calibrated_project_data';

export interface PumpCapabilityPoint {
  flowRateM3s: number;
  availableConcretePressurePa: number;
}

export interface PumpCapabilityInput {
  targetFlowRateM3s: number;
  requiredPressurePa: number | null;
  pipelineCompleteness: 'complete' | 'incomplete';
  capabilityCurve: PumpCapabilityPoint[];
  provenance: PumpCapabilityProvenance;
}

export interface PumpCapabilityResult {
  targetFlowRateM3s: number;
  requiredPressurePa: number | null;
  availablePressurePa: number | null;
  pressureMarginPa: number | null;
  pressureUtilization: number | null;
  status: 'PASS' | 'FAIL' | 'INSUFFICIENT_DATA';
  interpolation: 'exact_point' | 'linear_between_verified_points' | 'not_available';
  provenance: PumpCapabilityProvenance;
  method: 'tolue-pump-capability-v1';
}

function validateCurve(points: PumpCapabilityPoint[]): void {
  if (!Array.isArray(points) || points.length === 0) throw new Error('capabilityCurve must contain at least one verified point');
  let previous = -Infinity;
  for (const point of points) {
    if (!Number.isFinite(point.flowRateM3s) || point.flowRateM3s < 0) throw new Error('flowRateM3s must be finite and >= 0');
    if (!Number.isFinite(point.availableConcretePressurePa) || point.availableConcretePressurePa < 0) throw new Error('availableConcretePressurePa must be finite and >= 0');
    if (point.flowRateM3s <= previous) throw new Error('capabilityCurve flow rates must be strictly increasing');
    previous = point.flowRateM3s;
  }
}

export function availablePressureAtFlow(points: PumpCapabilityPoint[], targetFlowRateM3s: number): { pressurePa: number | null; interpolation: PumpCapabilityResult['interpolation'] } {
  validateCurve(points);
  if (!Number.isFinite(targetFlowRateM3s) || targetFlowRateM3s < 0) throw new Error('targetFlowRateM3s must be finite and >= 0');

  for (const point of points) {
    if (point.flowRateM3s === targetFlowRateM3s) return { pressurePa: point.availableConcretePressurePa, interpolation: 'exact_point' };
  }

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (targetFlowRateM3s > a.flowRateM3s && targetFlowRateM3s < b.flowRateM3s) {
      const fraction = (targetFlowRateM3s - a.flowRateM3s) / (b.flowRateM3s - a.flowRateM3s);
      return { pressurePa: a.availableConcretePressurePa + fraction * (b.availableConcretePressurePa - a.availableConcretePressurePa), interpolation: 'linear_between_verified_points' };
    }
  }

  // No extrapolation beyond verified manufacturer/calibration data.
  return { pressurePa: null, interpolation: 'not_available' };
}

export function assessPumpCapability(input: PumpCapabilityInput): PumpCapabilityResult {
  const available = availablePressureAtFlow(input.capabilityCurve, input.targetFlowRateM3s);

  if (input.pipelineCompleteness !== 'complete' || input.requiredPressurePa === null || available.pressurePa === null) {
    return {
      targetFlowRateM3s: input.targetFlowRateM3s,
      requiredPressurePa: input.requiredPressurePa,
      availablePressurePa: available.pressurePa,
      pressureMarginPa: null,
      pressureUtilization: null,
      status: 'INSUFFICIENT_DATA',
      interpolation: available.interpolation,
      provenance: input.provenance,
      method: 'tolue-pump-capability-v1',
    };
  }

  if (!Number.isFinite(input.requiredPressurePa) || input.requiredPressurePa < 0) throw new Error('requiredPressurePa must be finite and >= 0 when provided');
  const margin = available.pressurePa - input.requiredPressurePa;
  const utilization = available.pressurePa === 0 ? (input.requiredPressurePa === 0 ? 0 : Infinity) : input.requiredPressurePa / available.pressurePa;

  return {
    targetFlowRateM3s: input.targetFlowRateM3s,
    requiredPressurePa: input.requiredPressurePa,
    availablePressurePa: available.pressurePa,
    pressureMarginPa: margin,
    pressureUtilization: utilization,
    status: margin >= 0 ? 'PASS' : 'FAIL',
    interpolation: available.interpolation,
    provenance: input.provenance,
    method: 'tolue-pump-capability-v1',
  };
}
