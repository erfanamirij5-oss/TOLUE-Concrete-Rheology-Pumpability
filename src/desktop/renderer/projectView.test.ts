import { describe, expect, it } from 'vitest';
import { PROJECT_METADATA_FIELDS } from './projectView';

describe('project metadata presentation contract', () => {
  it('contains only project metadata fields', () => {
    expect(PROJECT_METADATA_FIELDS.map(field => field.id)).toEqual([
      'project-name',
      'project-code',
      'project-location',
      'project-client',
    ]);
  });

  it('does not define engineering values, coefficients or thresholds', () => {
    const serialized = JSON.stringify(PROJECT_METADATA_FIELDS).toLowerCase();
    expect(serialized).not.toContain('pressure');
    expect(serialized).not.toContain('yield');
    expect(serialized).not.toContain('viscosity');
    expect(serialized).not.toContain('threshold');
    expect(serialized).not.toContain('factor');
  });
});
