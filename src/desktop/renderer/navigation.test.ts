import { describe, expect, it } from 'vitest';
import { createNavigationState, isTolueSectionId, TOLUE_SECTIONS } from './navigation';

describe('renderer navigation contract', () => {
  it('has a deterministic engineering workflow order', () => {
    expect(TOLUE_SECTIONS.map(section => section.id)).toEqual([
      'project', 'materials', 'rheology', 'pipeline', 'pump', 'evidence', 'visualization', 'results', 'diagnostics', 'report',
    ]);
  });

  it('defaults to project and returns frozen state', () => {
    const state = createNavigationState();
    expect(state.activeSection).toBe('project');
    expect(Object.isFrozen(state)).toBe(true);
  });

  it('accepts only declared presentation section identifiers', () => {
    expect(isTolueSectionId('results')).toBe(true);
    expect(isTolueSectionId('visualization')).toBe(true);
    expect(isTolueSectionId('electron')).toBe(false);
    expect(isTolueSectionId('filesystem')).toBe(false);
  });
});
