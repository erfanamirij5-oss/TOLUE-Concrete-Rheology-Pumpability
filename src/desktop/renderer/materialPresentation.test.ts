import { describe, expect, it } from 'vitest';
import { createMaterialCardPresentation } from './materialPresentation';

describe('material presentation contract', () => {
  it('preserves supplied values exactly and freezes the presentation object', () => {
    const card = createMaterialCardPresentation(
      {
        id: 'cement-1',
        kind: 'cement',
        name: 'CEM I 42.5',
        supplier: 'Supplier A',
        source: 'Plant A',
        standardReference: 'documented reference',
      },
      [
        {
          key: 'specific-gravity',
          label: 'وزن مخصوص',
          value: '3.15',
          unit: null,
          provenanceEntityId: 'entity-1',
        },
      ],
    );

    expect(card.identity.name).toBe('CEM I 42.5');
    expect(card.properties[0]?.value).toBe('3.15');
    expect(card.properties[0]?.provenanceEntityId).toBe('entity-1');
    expect(Object.isFrozen(card)).toBe(true);
    expect(Object.isFrozen(card.identity)).toBe(true);
    expect(Object.isFrozen(card.properties)).toBe(true);
  });

  it('does not create engineering defaults or derived properties', () => {
    const card = createMaterialCardPresentation(
      { id: 'water-1', kind: 'water', name: '', supplier: '', source: '', standardReference: '' },
      [],
    );
    expect(card.properties).toEqual([]);
    expect(Object.keys(card.identity)).toEqual(['id', 'kind', 'name', 'supplier', 'source', 'standardReference']);
  });
});
