import { describe, expect, it } from 'vitest';
import { assessPumpabilityRiskScreening } from './pumpabilityRiskScreening';

const pipeline = {
  targetFlowRateM3s: 0.01,
  densityKgM3: 2350,
  lubricationLayerThicknessM: 0.002,
  bulk: { yieldStressPa: 70, plasticViscosityPaS: 35 },
  lubricationLayer: { yieldStressPa: 5, plasticViscosityPaS: 2 },
  segments: [
    { id: 'P-125', kind: 'straight' as const, lengthM: 20, pipeRadiusM: 0.0625, elevationChangeM: 0 },
    { id: 'P-100', kind: 'straight' as const, lengthM: 10, pipeRadiusM: 0.05, elevationChangeM: 0 },
  ],
};

describe('pumpability risk screening', () => {
  it('uses the smallest known pipe ID and the conservative one-third aggregate ratio', () => {
    const result = assessPumpabilityRiskScreening(pipeline, {
      nominalMaximumAggregateSizeM: 0.019,
      suspendingPhaseYieldStressPa: 18,
      suspendingPhaseDensityKgM3: 2200,
      coarseAggregateDensityKgM3: 2650,
    });
    expect(result.blockage.minimumKnownPipeInsideDiameterM).toBeCloseTo(0.1, 12);
    expect(result.blockage.governingSegmentId).toBe('P-100');
    expect(result.blockage.aggregateToPipeDiameterRatio).toBeCloseTo(0.19, 12);
    expect(result.blockage.conservativeLimitRatio).toBeCloseTo(1 / 3, 12);
    expect(result.blockage.status).toBe('ACCEPTABLE');
  });

  it('flags geometric blockage screening when NMS exceeds one-third of the smallest pipe ID', () => {
    const result = assessPumpabilityRiskScreening(pipeline, {
      nominalMaximumAggregateSizeM: 0.04,
      suspendingPhaseYieldStressPa: 18,
      suspendingPhaseDensityKgM3: 2200,
      coarseAggregateDensityKgM3: 2650,
    });
    expect(result.blockage.aggregateToPipeDiameterRatio).toBeCloseTo(0.4, 12);
    expect(result.blockage.status).toBe('UNACCEPTABLE');
  });

  it('computes the Roussel static segregation critical yield stress explicitly', () => {
    const result = assessPumpabilityRiskScreening(pipeline, {
      nominalMaximumAggregateSizeM: 0.02,
      suspendingPhaseYieldStressPa: 10,
      suspendingPhaseDensityKgM3: 2200,
      coarseAggregateDensityKgM3: 2700,
    });
    const expectedCritical = Math.abs(2700 - 2200) * 9.80665 * 0.02 / 18;
    expect(result.stability.criticalYieldStressPa).toBeCloseTo(expectedCritical, 12);
    expect(result.stability.status).toBe('ACCEPTABLE');
    expect(result.stability.stabilityRatio).toBeCloseTo(10 / expectedCritical, 12);
  });

  it('flags static segregation screen when suspending-phase yield stress is below critical', () => {
    const result = assessPumpabilityRiskScreening(pipeline, {
      nominalMaximumAggregateSizeM: 0.02,
      suspendingPhaseYieldStressPa: 2,
      suspendingPhaseDensityKgM3: 2200,
      coarseAggregateDensityKgM3: 2700,
    });
    expect(result.stability.status).toBe('UNACCEPTABLE');
    expect(result.stability.yieldStressMarginPa).toBeLessThan(0);
  });
});
