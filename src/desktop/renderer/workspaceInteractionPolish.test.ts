import { describe, expect, it } from 'vitest';
import { DEFAULT_BOTTOM_PANE_HEIGHT } from './resizableWorkspace';
import { commercialWorkspaceGridRows, deriveCommercialRunState } from './workspaceInteractionPolish';

describe('commercial workspace interaction state', () => {
  it('prioritizes running over all other presentation states', () => {
    expect(deriveCommercialRunState('true', true, 'نتایج قدیمی / ورودی تغییر کرده')).toBe('running');
  });

  it('marks changed inputs as stale so rerun is visually explicit', () => {
    expect(deriveCommercialRunState('false', false, 'نتایج قدیمی / ورودی تغییر کرده')).toBe('stale');
  });

  it('marks disabled execution as blocked and available execution as ready', () => {
    expect(deriveCommercialRunState('false', true, 'آماده')).toBe('blocked');
    expect(deriveCommercialRunState('false', false, 'آماده')).toBe('ready');
  });

  it('keeps the default bottom pane at the compact menu height while preserving four explicit shell rows', () => {
    expect(DEFAULT_BOTTOM_PANE_HEIGHT).toBe(94);
    expect(commercialWorkspaceGridRows()).toBe('54px minmax(220px,1fr) 6px var(--tolue-bottom-height,94px)');
  });
});
