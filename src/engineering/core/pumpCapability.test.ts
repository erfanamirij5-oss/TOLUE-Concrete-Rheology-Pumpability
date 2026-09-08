import { describe, expect, it } from 'vitest';
import { assessPumpCapability, availablePressureAtFlow } from './pumpCapability';

const curve = [
  { flowRateM3s: 0.005, availableConcretePressurePa: 14_000_000 },
  { flowRateM3s: 0.010, availableConcretePressurePa: 12_000_000 },
  { flowRateM3s: 0.015, availableConcretePressurePa: 9_000_000 },
];

describe('pump capability engine', () => {
  it('uses an exact verified capability point', () => {
    const r = availablePressureAtFlow(curve, 0.010);
    expect(r.pressurePa).toBe(12_000_000);
    expect(r.interpolation).toBe('exact_point');
  });

  it('linearly interpolates only between verified points', () => {
    const r = availablePressureAtFlow(curve, 0.0125);
    expect(r.pressurePa).toBeCloseTo(10_500_000, 6);
    expect(r.interpolation).toBe('linear_between_verified_points');
  });

  it('refuses extrapolation outside verified pump data', () => {
    expect(availablePressureAtFlow(curve, 0.020).pressurePa).toBeNull();
    expect(availablePressureAtFlow(curve, 0.001).pressurePa).toBeNull();
  });

  it('computes positive pressure margin as PASS', () => {
    const r = assessPumpCapability({ targetFlowRateM3s: 0.010, requiredPressurePa: 10_000_000, pipelineCompleteness: 'complete', capabilityCurve: curve, provenance: 'manufacturer_curve' });
    expect(r.status).toBe('PASS');
    expect(r.pressureMarginPa).toBe(2_000_000);
    expect(r.pressureUtilization).toBeCloseTo(10 / 12, 12);
  });

  it('computes negative pressure margin as FAIL', () => {
    const r = assessPumpCapability({ targetFlowRateM3s: 0.010, requiredPressurePa: 13_000_000, pipelineCompleteness: 'complete', capabilityCurve: curve, provenance: 'manufacturer_curve' });
    expect(r.status).toBe('FAIL');
    expect(r.pressureMarginPa).toBe(-1_000_000);
  });

  it('does not certify a pump against an incomplete pipeline model', () => {
    const r = assessPumpCapability({ targetFlowRateM3s: 0.010, requiredPressurePa: null, pipelineCompleteness: 'incomplete', capabilityCurve: curve, provenance: 'manufacturer_curve' });
    expect(r.status).toBe('INSUFFICIENT_DATA');
    expect(r.pressureMarginPa).toBeNull();
  });

  it('does not treat nominal max pressure as available outside supplied flow data', () => {
    const r = assessPumpCapability({ targetFlowRateM3s: 0.020, requiredPressurePa: 5_000_000, pipelineCompleteness: 'complete', capabilityCurve: curve, provenance: 'manufacturer_rated_point' });
    expect(r.status).toBe('INSUFFICIENT_DATA');
    expect(r.availablePressurePa).toBeNull();
  });

  it('preserves a detached immutable copy of verified source points', () => {
    const source = curve.map(point => ({ ...point }));
    const r = assessPumpCapability({ targetFlowRateM3s: 0.010, requiredPressurePa: 10_000_000, pipelineCompleteness: 'complete', capabilityCurve: source, provenance: 'manufacturer_curve' });
    expect(r.verifiedCapabilityCurve).toEqual(curve);
    expect(r.verifiedCapabilityCurve).not.toBe(source);
    expect(Object.isFrozen(r.verifiedCapabilityCurve)).toBe(true);
    expect(Object.isFrozen(r.verifiedCapabilityCurve[0])).toBe(true);
    source[0]!.availableConcretePressurePa = 1;
    expect(r.verifiedCapabilityCurve[0]!.availableConcretePressurePa).toBe(14_000_000);
  });
});
