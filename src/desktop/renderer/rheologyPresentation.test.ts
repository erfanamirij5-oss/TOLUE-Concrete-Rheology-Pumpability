import { describe, expect, it } from 'vitest';
import { createRheologyInputPresentation, createRheologyResultPresentation } from './rheologyPresentation';

describe('rheology presentation boundary', () => {
  it('preserves input value and unit without deriving engineering values', () => {
    const input = createRheologyInputPresentation({
      modelFamily: 'BINGHAM', inputId: 'tau0', label: 'تنش تسلیم', value: 50, unit: 'Pa', provenanceEntityId: 'entity-1',
    });
    expect(input).toEqual({ modelFamily: 'BINGHAM', inputId: 'tau0', label: 'تنش تسلیم', value: 50, unit: 'Pa', provenanceEntityId: 'entity-1' });
    expect(Object.isFrozen(input)).toBe(true);
  });

  it('preserves Core result traceability and limitations', () => {
    const result = createRheologyResultPresentation({
      resultId: 'result-1', label: 'نتیجه', value: 5000, unit: 'Pa/m', methodId: 'core-method', referenceIds: ['ref-1'], limitations: ['project domain only'],
    });
    expect(result.methodId).toBe('core-method');
    expect(result.referenceIds).toEqual(['ref-1']);
    expect(result.limitations).toEqual(['project domain only']);
    expect(Object.isFrozen(result.referenceIds)).toBe(true);
    expect(Object.isFrozen(result.limitations)).toBe(true);
  });
});
