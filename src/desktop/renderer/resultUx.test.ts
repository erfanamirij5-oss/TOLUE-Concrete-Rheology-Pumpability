import { describe, expect, it } from 'vitest';
import { evidenceStatusUx, pressureFeasibilityUx, pumpabilityDecisionUx, validationStatusUx } from './resultUx';

describe('result UX semantics', () => {
  it('maps validation statuses without changing engineering meaning', () => {
    expect(validationStatusUx('verified')).toEqual({ label: 'تأییدشده', tone: 'nominal' });
    expect(validationStatusUx('candidate').tone).toBe('warning');
    expect(validationStatusUx('out_of_domain').tone).toBe('critical');
    expect(validationStatusUx('insufficient_data').tone).toBe('unknown');
  });

  it('maps evidence completeness independently from validation', () => {
    expect(evidenceStatusUx('DOCUMENTED').tone).toBe('nominal');
    expect(evidenceStatusUx('PRELIMINARY').tone).toBe('warning');
    expect(evidenceStatusUx('BLOCKED').tone).toBe('critical');
    expect(evidenceStatusUx('NOT_ASSESSED').tone).toBe('unknown');
  });

  it('preserves conservative pumpability decision semantics', () => {
    expect(pumpabilityDecisionUx('PROJECT_QUALIFIED_ACCEPTABLE').tone).toBe('nominal');
    expect(pumpabilityDecisionUx('PRESSURE_ONLY_ACCEPTABLE').tone).toBe('warning');
    expect(pumpabilityDecisionUx('FAIL_PRESSURE').tone).toBe('critical');
    expect(pumpabilityDecisionUx('INSUFFICIENT_DATA').tone).toBe('unknown');
    expect(pressureFeasibilityUx('FAIL').label).toBe('غیرقابل تأمین');
  });
});
