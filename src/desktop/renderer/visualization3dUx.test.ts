import { describe, expect, it } from 'vitest';
import {
  hydraulicStatusUx,
  pressureFeasibilityUx,
  visualizationCompletenessUx,
  visualizationSegmentKindLabel,
} from './visualization3dUx';

describe('3D visualization UX semantics', () => {
  it('maps Core completeness without changing meaning', () => {
    expect(visualizationCompletenessUx('complete')).toEqual({ label: 'نمایش مهندسی کامل', tone: 'nominal' });
    expect(visualizationCompletenessUx('incomplete')).toEqual({ label: 'نمایش مهندسی ناقص', tone: 'warning' });
  });

  it('maps Core hydraulic state without inventing thresholds', () => {
    expect(hydraulicStatusUx('computed').tone).toBe('nominal');
    expect(hydraulicStatusUx('incomplete').tone).toBe('warning');
  });

  it('maps pump pressure feasibility directly from Core status', () => {
    expect(pressureFeasibilityUx('PASS').tone).toBe('nominal');
    expect(pressureFeasibilityUx('FAIL').tone).toBe('critical');
    expect(pressureFeasibilityUx('INSUFFICIENT_DATA').tone).toBe('warning');
  });

  it('provides Persian labels for all segment kinds', () => {
    expect(visualizationSegmentKindLabel('straight')).toBe('خط مستقیم');
    expect(visualizationSegmentKindLabel('elbow')).toBe('زانویی');
    expect(visualizationSegmentKindLabel('reducer')).toBe('تبدیل');
    expect(visualizationSegmentKindLabel('hose')).toBe('شلنگ');
    expect(visualizationSegmentKindLabel('valve')).toBe('شیر');
    expect(visualizationSegmentKindLabel('boom')).toBe('بوم');
    expect(visualizationSegmentKindLabel('other')).toBe('جزء دیگر');
  });
});
