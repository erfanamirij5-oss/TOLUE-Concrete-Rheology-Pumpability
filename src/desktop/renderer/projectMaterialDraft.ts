import type { MaterialEngineeringInput, MaterialKind, ProjectMetadataInput } from '../../engineering/core/projectMaterialInput';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';

export type ProjectMetadataField = keyof ProjectMetadataInput;
export type MaterialIdentityField = 'name' | 'supplier' | 'source' | 'standardReference';

function text(value: string): string { return value.trim(); }

export function updateProjectMetadataDraft(input: Readonly<SimulationRunInput>, field: ProjectMetadataField, value: string): Readonly<SimulationRunInput> {
  const next = structuredClone(input) as SimulationRunInput;
  const current: ProjectMetadataInput = next.projectMetadata ?? { name: '' };
  const clean = value.trim();
  if (field === 'name') next.projectMetadata = { ...current, name: value };
  else if (clean) next.projectMetadata = { ...current, [field]: value };
  else {
    const copy = { ...current } as Record<string, string | undefined>;
    delete copy[field];
    next.projectMetadata = copy as ProjectMetadataInput;
  }
  return Object.freeze(next);
}

export function addMaterialDraft(input: Readonly<SimulationRunInput>, kind: MaterialKind, id: string): Readonly<SimulationRunInput> {
  const cleanId = text(id);
  if (!cleanId) throw new Error('MATERIAL-DRAFT-ID-001');
  if ((input.materials ?? []).some(material => material.id === cleanId)) throw new Error('MATERIAL-DRAFT-ID-DUPLICATE-001');
  const next = structuredClone(input) as SimulationRunInput;
  next.materials = [...(next.materials ?? []), { id: cleanId, kind, name: '', properties: [] }];
  return Object.freeze(next);
}

export function removeMaterialDraft(input: Readonly<SimulationRunInput>, materialIndex: number): Readonly<SimulationRunInput> {
  if (!(input.materials ?? [])[materialIndex]) throw new Error('MATERIAL-DRAFT-INDEX-001');
  const next = structuredClone(input) as SimulationRunInput;
  next.materials!.splice(materialIndex, 1);
  return Object.freeze(next);
}

export function updateMaterialIdentityDraft(input: Readonly<SimulationRunInput>, materialIndex: number, field: MaterialIdentityField, value: string): Readonly<SimulationRunInput> {
  const material = (input.materials ?? [])[materialIndex];
  if (!material) throw new Error('MATERIAL-DRAFT-INDEX-001');
  const next = structuredClone(input) as SimulationRunInput;
  const target = next.materials![materialIndex] as MaterialEngineeringInput & Record<string, unknown>;
  const clean = value.trim();
  if (field === 'name') target.name = value;
  else if (clean) target[field] = value;
  else delete target[field];
  return Object.freeze(next);
}

export function addMaterialPropertyDraft(input: Readonly<SimulationRunInput>, materialIndex: number, key: string, value: string, unit?: string, provenanceEntityId?: string): Readonly<SimulationRunInput> {
  const material = (input.materials ?? [])[materialIndex];
  if (!material) throw new Error('MATERIAL-DRAFT-INDEX-001');
  const cleanKey = text(key);
  const cleanValue = text(value);
  if (!cleanKey) throw new Error('MATERIAL-DRAFT-PROPERTY-KEY-001');
  if (!cleanValue) throw new Error('MATERIAL-DRAFT-PROPERTY-VALUE-001');
  if (material.properties.some(property => property.key === cleanKey)) throw new Error('MATERIAL-DRAFT-PROPERTY-DUPLICATE-001');
  const numeric = Number(value);
  const storedValue: number | string = Number.isFinite(numeric) && value.trim() !== '' ? numeric : value;
  const next = structuredClone(input) as SimulationRunInput;
  next.materials![materialIndex]!.properties.push({
    key: cleanKey,
    value: storedValue,
    ...(unit?.trim() ? { unit: unit.trim() } : {}),
    ...(provenanceEntityId?.trim() ? { provenanceEntityId: provenanceEntityId.trim() } : {}),
  });
  return Object.freeze(next);
}

export function removeMaterialPropertyDraft(input: Readonly<SimulationRunInput>, materialIndex: number, propertyIndex: number): Readonly<SimulationRunInput> {
  const material = (input.materials ?? [])[materialIndex];
  if (!material?.properties[propertyIndex]) throw new Error('MATERIAL-DRAFT-PROPERTY-INDEX-001');
  const next = structuredClone(input) as SimulationRunInput;
  next.materials![materialIndex]!.properties.splice(propertyIndex, 1);
  return Object.freeze(next);
}
