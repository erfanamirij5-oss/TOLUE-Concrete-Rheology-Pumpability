import { describe, expect, it } from 'vitest';
import { createPressureCompositionPresentation } from './pressureCompositionPresentation';

describe('pressure composition presentation', () => {
  it('preserves exact Core pressure components including negative elevation and incomplete required pressure', () => {
    const presentation = createPressureCompositionPresentation({
      segments: [], straightFrictionPressurePa: 120000, calibratedLocalFrictionPressurePa: 30000,
      elevationPressurePa: -50000, requiredPressurePa: null, completeness: 'incomplete', method: 'tolue-pipeline-pressure-v2',
    });
    expect(presentation.items.map(item => item.valuePa)).toEqual([120000, 30000, -50000]);
    expect(presentation.requiredPressurePa).toBeNull();
    expect(presentation.completeness).toBe('incomplete');
    expect(presentation.items[2]?.valuePa).toBe(-50000);
    expect(Object.isFrozen(presentation.items)).toBe(true);
    expect(Object.isFrozen(presentation.items[0])).toBe(true);
  });
});
