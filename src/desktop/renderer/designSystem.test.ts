import { describe, expect, it } from 'vitest';
import { statusToneColor, TOLUE_DESIGN_TOKENS } from './designSystem';

describe('TOLUE design system', () => {
  it('keeps the token registry immutable and deterministic', () => {
    expect(Object.isFrozen(TOLUE_DESIGN_TOKENS)).toBe(true);
    expect(Object.isFrozen(TOLUE_DESIGN_TOKENS.color)).toBe(true);
    expect(Object.isFrozen(TOLUE_DESIGN_TOKENS.spacing)).toBe(true);
    expect(TOLUE_DESIGN_TOKENS.typography.fontFamily).toContain('Vazirmatn');
    expect(TOLUE_DESIGN_TOKENS.color.background).toBe('#f4f5f2');
  });

  it('maps only presentation status tones to fixed colors', () => {
    expect(statusToneColor('nominal')).toBe(TOLUE_DESIGN_TOKENS.color.statusNominal);
    expect(statusToneColor('warning')).toBe(TOLUE_DESIGN_TOKENS.color.statusWarning);
    expect(statusToneColor('critical')).toBe(TOLUE_DESIGN_TOKENS.color.statusCritical);
    expect(statusToneColor('unknown')).toBe(TOLUE_DESIGN_TOKENS.color.statusUnknown);
  });
});
