import type { MaterialEngineeringInput, MaterialKind, MaterialPropertyInput, ProjectMetadataInput } from '../../engineering/core/projectMaterialInput';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';

export type ProjectMetadataField = keyof ProjectMetadataInput;
export type MaterialIdentityField = 'name' | 'supplier' | 'source' | 'standardReference';

type MutableProjectMetadata = { -readonly [K in keyof ProjectMetadataInput]: ProjectMetadataInput[K] };
type MutableMaterial = Omit<MaterialEngineeringInput, 'properties'> & { properties: MaterialPropertyInput[] };

function text(value: string): string { return value.trim(); }

export function updateProjectMetadataDraft(input: Readonly<SimulationRunInput>, field: ProjectMetadataField, value: string): Readonly<SimulationRunInput> {
  const next = structuredClone(input) as SimulationRunInput;
  const current: MutableProjectMetadata = { ...(next.projectMetadata ?? { name: '' }) };
  const clean = value.trim();
  if (field === 'name') current.name = value;
  else if (clean) current[field] = value;
  else delete current[field];
  next.projectMetadata = current;
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
  next.materials = (next.materials ?? []).filter((_material, index) => index !== materialIndex);
  return Object.freeze(next);
}

export function updateMaterialIdentityDraft(input: Readonly<SimulationRunInput>, materialIndex: number, field: MaterialIdentityField, value: string): Readonly<SimulationRunInput> {
  const material = (input.materials ?? [])[materialIndex];
  if (!material) throw new Error('MATERIAL-DRAFT-INDEX-001');
  const next = structuredClone(input) as SimulationRunInput;
  const materials = [...(next.materials ?? [])];
  const target = { ...materials[materialIndex] } as MutableMaterial;
  const clean = value.trim();
  if (field === 'name') target.name = value;
  else if (clean) target[field] = value;
  else delete target[field];
  materials[materialIndex] = target;
  next.materials = materials;
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
  const materials = [...(next.materials ?? [])];
  const target = materials[materialIndex];
  if (!target) throw new Error('MATERIAL-DRAFT-INDEX-001');
  materials[materialIndex] = {
    ...target,
    properties: [...target.properties, {
      key: cleanKey,
      value: storedValue,
      ...(unit?.trim() ? { unit: unit.trim() } : {}),
      ...(provenanceEntityId?.trim() ? { provenanceEntityId: provenanceEntityId.trim() } : {}),
    }],
  };
  next.materials = materials;
  return Object.freeze(next);
}

export function removeMaterialPropertyDraft(input: Readonly<SimulationRunInput>, materialIndex: number, propertyIndex: number): Readonly<SimulationRunInput> {
  const material = (input.materials ?? [])[materialIndex];
  if (!material?.properties[propertyIndex]) throw new Error('MATERIAL-DRAFT-PROPERTY-INDEX-001');
  const next = structuredClone(input) as SimulationRunInput;
  const materials = [...(next.materials ?? [])];
  const target = materials[materialIndex];
  if (!target) throw new Error('MATERIAL-DRAFT-INDEX-001');
  materials[materialIndex] = { ...target, properties: target.properties.filter((_property, index) => index !== propertyIndex) };
  next.materials = materials;
  return Object.freeze(next);
}
