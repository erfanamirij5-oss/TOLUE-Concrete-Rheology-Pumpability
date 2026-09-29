import { describe, expect, it } from 'vitest';
import { createPumpCapabilityPresentation } from './pumpPresentation';

const verifiedCapabilityCurve = [
  { flowRateM3s: 0.005, availableConcretePressurePa: 3_000_000 },
  { flowRateM3s: 0.015, availableConcretePressurePa: 2_000_000 },
];

describe('pump capability presentation boundary', () => {
  it('preserves Core pressure feasibility and verified source points without recomputing status or margins', () => {
    const presentation = createPumpCapabilityPresentation({
      targetFlowRateM3s: 0.01,
      requiredPressurePa: 2_000_000,
      availablePressurePa: 2_500_000,
      pressureMarginPa: 500_000,
      pressureUtilization: 0.8,
      status: 'PASS',
      interpolation: 'linear_between_verified_points',
      provenance: 'manufacturer_curve',
      operatingEnvelope: null,
      verifiedCapabilityCurve,
      method: 'tolue-pump-capability-v1',
    });
    expect(presentation.status).toBe('PASS');
    expect(presentation.pressureMarginPa).toBe(500_000);
    expect(presentation.pressureUtilization).toBe(0.8);
    expect(presentation.verifiedCapabilityCurve).toEqual(verifiedCapabilityCurve);
    expect(Object.isFrozen(presentation.verifiedCapabilityCurve)).toBe(true);
    expect(Object.isFrozen(presentation.verifiedCapabilityCurve[0])).toBe(true);
    expect(Object.isFrozen(presentation)).toBe(true);
  });

  it('preserves insufficient-data nulls instead of inventing availability', () => {
    const presentation = createPumpCapabilityPresentation({
      targetFlowRateM3s: 0.02,
      requiredPressurePa: null,
      availablePressurePa: null,
      pressureMarginPa: null,
      pressureUtilization: null,
      status: 'INSUFFICIENT_DATA',
      interpolation: 'not_available',
      provenance: 'calibrated_project_data',
      operatingEnvelope: null,
      verifiedCapabilityCurve,
      method: 'tolue-pump-capability-v1',
    });
    expect(presentation.status).toBe('INSUFFICIENT_DATA');
    expect(presentation.availablePressurePa).toBeNull();
    expect(presentation.pressureMarginPa).toBeNull();
    expect(presentation.verifiedCapabilityCurve).toHaveLength(2);
  });
});
