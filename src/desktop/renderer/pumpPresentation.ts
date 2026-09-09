import type { PumpCapabilityPoint, PumpCapabilityResult } from '../../engineering/core/pumpCapability';

export interface PumpCapabilityPresentation {
  readonly targetFlowRateM3s: number;
  readonly requiredPressurePa: number | null;
  readonly availablePressurePa: number | null;
  readonly pressureMarginPa: number | null;
  readonly pressureUtilization: number | null;
  readonly status: PumpCapabilityResult['status'];
  readonly interpolation: PumpCapabilityResult['interpolation'];
  readonly provenance: PumpCapabilityResult['provenance'];
  readonly verifiedCapabilityCurve: readonly Readonly<PumpCapabilityPoint>[];
  readonly method: PumpCapabilityResult['method'];
}

export function createPumpCapabilityPresentation(result: PumpCapabilityResult): Readonly<PumpCapabilityPresentation> {
  return Object.freeze({
    targetFlowRateM3s: result.targetFlowRateM3s,
    requiredPressurePa: result.requiredPressurePa,
    availablePressurePa: result.availablePressurePa,
    pressureMarginPa: result.pressureMarginPa,
    pressureUtilization: result.pressureUtilization,
    status: result.status,
    interpolation: result.interpolation,
    provenance: result.provenance,
    verifiedCapabilityCurve: Object.freeze(result.verifiedCapabilityCurve.map(point => Object.freeze({ ...point }))),
    method: result.method,
  });
}
