import { describe, expect, it } from 'vitest';
import { assessProjectAndMaterialInputs } from './projectMaterialInput';

describe('project and material engineering inputs', () => {
  it('keeps undocumented project/material data preliminary instead of inventing defaults', () => {
    const result = assessProjectAndMaterialInputs(undefined, undefined);
    expect(result.status).toBe('PRELIMINARY');
    expect(result.findings.map(f => f.ruleId)).toEqual(expect.arrayContaining(['PMETA-001', 'MAT-000']));
  });

  it('blocks duplicate material IDs and invalid property values', () => {
    const result = assessProjectAndMaterialInputs(
      { name: 'Project A' },
      [
        { id: 'CEM-01', kind: 'cement', name: 'Cement A', source: 'Plant A', standardReference: 'ISIRI', properties: [] },
        { id: 'CEM-01', kind: 'cement', name: 'Cement B', source: 'Plant B', standardReference: 'ISIRI', properties: [{ key: 'density', value: Number.NaN }] },
      ],
    );
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.map(f => f.ruleId)).toEqual(expect.arrayContaining(['MAT-002', 'MAT-PROP-003']));
  });

  it('can classify a fully documented material record as documented', () => {
    const result = assessProjectAndMaterialInputs(
      { name: 'Project A', code: 'P-01' },
      [{
        id: 'CEM-01', kind: 'cement', name: 'Cement A', supplier: 'Supplier', source: 'Plant A', standardReference: 'ISIRI-389',
        properties: [{ key: 'specificGravity', value: 3.15, unit: '1', provenanceEntityId: 'prov-cement-sg-01' }],
      }],
    );
    expect(result.status).toBe('DOCUMENTED');
    expect(result.findings).toHaveLength(0);
  });
});
