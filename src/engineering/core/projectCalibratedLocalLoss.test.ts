import { describe, expect, it } from 'vitest';
import { evaluateProjectCalibratedLocalLoss } from './projectCalibratedLocalLoss';

const base = {
  componentKind: 'elbow' as const,
  provenanceEntityId: 'entity:field-elbow-01',
  calibrationId: 'cal:field-elbow-01',
  calibrationCurve: [
    { flowRateM3s: 0.01, pressureLossPa: 80_000 },
    { flowRateM3s: 0.02, pressureLossPa: 140_000 },
    { flowRateM3s: 0.03, pressureLossPa: 230_000 },
  ],
};

describe('project-calibrated local pressure loss', () => {
  it('returns an exact measured/calibrated point', () => {
    const result = evaluateProjectCalibratedLocalLoss({ ...base, targetFlowRateM3s: 0.02 });
    expect(result.pressureLossPa).toBe(140_000);
    expect(result.interpolation).toBe('exact');
    expect(result.status).toBe('computed');
  });

  it('linearly interpolates only inside the supplied project curve', () => {
    const result = evaluateProjectCalibratedLocalLoss({ ...base, targetFlowRateM3s: 0.015 });
    expect(result.pressureLossPa).toBeCloseTo(110_000, 9);
    expect(result.interpolation).toBe('linear');
  });

  it('fails closed instead of extrapolating below the curve', () => {
    const result = evaluateProjectCalibratedLocalLoss({ ...base, targetFlowRateM3s: 0.005 });
    expect(result.pressureLossPa).toBeNull();
    expect(result.status).toBe('insufficient_data');
    expect(result.interpolation).toBe('none');
  });

  it('fails closed instead of extrapolating above the curve', () => {
    const result = evaluateProjectCalibratedLocalLoss({ ...base, targetFlowRateM3s: 0.04 });
    expect(result.pressureLossPa).toBeNull();
    expect(result.status).toBe('insufficient_data');
  });

  it('rejects unordered or duplicate calibration flow points', () => {
    expect(() => evaluateProjectCalibratedLocalLoss({
      ...base,
      targetFlowRateM3s: 0.02,
      calibrationCurve: [
        { flowRateM3s: 0.02, pressureLossPa: 140_000 },
        { flowRateM3s: 0.02, pressureLossPa: 150_000 },
      ],
    })).toThrow(/strictly increasing/);
  });

  it('requires traceability identifiers', () => {
    expect(() => evaluateProjectCalibratedLocalLoss({ ...base, targetFlowRateM3s: 0.02, provenanceEntityId: '' })).toThrow(/provenanceEntityId/);
    expect(() => evaluateProjectCalibratedLocalLoss({ ...base, targetFlowRateM3s: 0.02, calibrationId: '' })).toThrow(/calibrationId/);
  });
});
