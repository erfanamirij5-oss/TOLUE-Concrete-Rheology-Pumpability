import { describe, expect, it } from 'vitest';
import { createPumpCapabilityPresentation } from './pumpPresentation';

describe('pump capability presentation boundary', () => {
  it('preserves Core pressure feasibility without recomputing status or margins', () => {
    const presentation = createPumpCapabilityPresentation({
      targetFlowRateM3s: 0.01,
      requiredPressurePa: 2_000_000,
      availablePressurePa: 2_500_000,
      pressureMarginPa: 500_000,
      pressureUtilization: 0.8,
      status: 'PASS',
      interpolation: 'linear_between_verified_points',
      provenance: 'manufacturer_curve',
      method: 'tolue-pump-capability-v1',
    });
    expect(presentation.status).toBe('PASS');
    expect(presentation.pressureMarginPa).toBe(500_000);
    expect(presentation.pressureUtilization).toBe(0.8);
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
      method: 'tolue-pump-capability-v1',
    });
    expect(presentation.status).toBe('INSUFFICIENT_DATA');
    expect(presentation.availablePressurePa).toBeNull();
    expect(presentation.pressureMarginPa).toBeNull();
  });
});
