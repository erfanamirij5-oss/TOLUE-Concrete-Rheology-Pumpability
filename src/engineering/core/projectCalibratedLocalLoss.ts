export type CalibratedLocalComponentKind = 'elbow' | 'reducer' | 'hose' | 'valve' | 'boom' | 'other';

export interface CalibratedLocalLossPoint {
  flowRateM3s: number;
  pressureLossPa: number;
}

export interface ProjectCalibratedLocalLossInput {
  componentKind: CalibratedLocalComponentKind;
  targetFlowRateM3s: number;
  calibrationCurve: CalibratedLocalLossPoint[];
  provenanceEntityId: string;
  calibrationId: string;
}

export interface ProjectCalibratedLocalLossResult {
  componentKind: CalibratedLocalComponentKind;
  targetFlowRateM3s: number;
  pressureLossPa: number | null;
  status: 'computed' | 'insufficient_data';
  interpolation: 'exact' | 'linear' | 'none';
  provenanceEntityId: string;
  calibrationId: string;
  method: 'tolue-project-calibrated-local-loss-v1';
  validationStatus: 'candidate' | 'insufficient_data';
  applicability: 'project-calibrated-data-only';
}

function finiteNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be finite and >= 0`);
}

function nonEmpty(name: string, value: string): void {
  if (!value.trim()) throw new Error(`${name} must not be empty`);
}

function validateCurve(points: CalibratedLocalLossPoint[]): void {
  if (!Array.isArray(points) || points.length === 0) throw new Error('calibrationCurve must contain at least one point');
  let previousFlow = -Infinity;
  for (const [index, point] of points.entries()) {
    finiteNonNegative(`calibrationCurve[${index}].flowRateM3s`, point.flowRateM3s);
    finiteNonNegative(`calibrationCurve[${index}].pressureLossPa`, point.pressureLossPa);
    if (point.flowRateM3s <= previousFlow) throw new Error('calibrationCurve flowRateM3s values must be strictly increasing');
    previousFlow = point.flowRateM3s;
  }
}

/**
 * Evaluates project-calibrated local pressure loss without claiming a universal
 * elbow/reducer/hose correlation. Exact points and interpolation inside the
 * supplied project curve are allowed; extrapolation is deliberately prohibited.
 */
export function evaluateProjectCalibratedLocalLoss(
  input: ProjectCalibratedLocalLossInput,
): ProjectCalibratedLocalLossResult {
  finiteNonNegative('targetFlowRateM3s', input.targetFlowRateM3s);
  nonEmpty('provenanceEntityId', input.provenanceEntityId);
  nonEmpty('calibrationId', input.calibrationId);
  validateCurve(input.calibrationCurve);

  const base = {
    componentKind: input.componentKind,
    targetFlowRateM3s: input.targetFlowRateM3s,
    provenanceEntityId: input.provenanceEntityId,
    calibrationId: input.calibrationId,
    method: 'tolue-project-calibrated-local-loss-v1' as const,
    applicability: 'project-calibrated-data-only' as const,
  };

  const first = input.calibrationCurve[0]!;
  const last = input.calibrationCurve[input.calibrationCurve.length - 1]!;
  if (input.targetFlowRateM3s < first.flowRateM3s || input.targetFlowRateM3s > last.flowRateM3s) {
    return { ...base, pressureLossPa: null, status: 'insufficient_data', interpolation: 'none', validationStatus: 'insufficient_data' };
  }

  const exact = input.calibrationCurve.find(point => point.flowRateM3s === input.targetFlowRateM3s);
  if (exact) {
    return { ...base, pressureLossPa: exact.pressureLossPa, status: 'computed', interpolation: 'exact', validationStatus: 'candidate' };
  }

  for (let i = 0; i < input.calibrationCurve.length - 1; i++) {
    const left = input.calibrationCurve[i]!;
    const right = input.calibrationCurve[i + 1]!;
    if (input.targetFlowRateM3s > left.flowRateM3s && input.targetFlowRateM3s < right.flowRateM3s) {
      const fraction = (input.targetFlowRateM3s - left.flowRateM3s) / (right.flowRateM3s - left.flowRateM3s);
      const pressureLossPa = left.pressureLossPa + fraction * (right.pressureLossPa - left.pressureLossPa);
      return { ...base, pressureLossPa, status: 'computed', interpolation: 'linear', validationStatus: 'candidate' };
    }
  }

  return { ...base, pressureLossPa: null, status: 'insufficient_data', interpolation: 'none', validationStatus: 'insufficient_data' };
}
