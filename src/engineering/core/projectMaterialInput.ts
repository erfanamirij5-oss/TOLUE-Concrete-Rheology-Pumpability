export type MaterialKind =
  | 'cement'
  | 'water'
  | 'fine_aggregate'
  | 'coarse_aggregate'
  | 'scm'
  | 'chemical_admixture'
  | 'fiber'
  | 'other_addition';

export interface ProjectMetadataInput {
  readonly name: string;
  readonly code?: string;
  readonly location?: string;
  readonly client?: string;
}

export interface MaterialPropertyInput {
  readonly key: string;
  readonly value: number | string;
  readonly unit?: string;
  readonly provenanceEntityId?: string;
}

export interface MaterialEngineeringInput {
  readonly id: string;
  readonly kind: MaterialKind;
  readonly name: string;
  readonly supplier?: string;
  readonly source?: string;
  readonly standardReference?: string;
  readonly properties: readonly MaterialPropertyInput[];
}

export interface ProjectMaterialInputAssessment {
  readonly status: 'DOCUMENTED' | 'PRELIMINARY' | 'BLOCKED';
  readonly findings: readonly {
    readonly severity: 'warning' | 'blocking';
    readonly field: string;
    readonly ruleId: string;
    readonly message: string;
  }[];
  readonly method: 'tolue-project-material-input-v1';
}

function nonEmpty(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

export function assessProjectAndMaterialInputs(
  project: ProjectMetadataInput | undefined,
  materials: readonly MaterialEngineeringInput[] | undefined,
): ProjectMaterialInputAssessment {
  const findings: Array<ProjectMaterialInputAssessment['findings'][number]> = [];
  const warn = (field: string, ruleId: string, message: string) => findings.push({ severity: 'warning', field, ruleId, message });
  const block = (field: string, ruleId: string, message: string) => findings.push({ severity: 'blocking', field, ruleId, message });

  if (!project || !nonEmpty(project.name)) warn('projectMetadata.name', 'PMETA-001', 'Project name is not documented; run traceability remains preliminary.');

  const ids = new Set<string>();
  for (const [index, material] of (materials ?? []).entries()) {
    const base = `materials.${index}`;
    if (!nonEmpty(material.id)) block(`${base}.id`, 'MAT-001', 'Material ID must be non-empty.');
    else if (ids.has(material.id)) block(`${base}.id`, 'MAT-002', `Duplicate material ID '${material.id}'.`);
    ids.add(material.id);
    if (!nonEmpty(material.name)) block(`${base}.name`, 'MAT-003', 'Material name must be non-empty.');
    if (!nonEmpty(material.source)) warn(`${base}.source`, 'MAT-004', 'Material source is not documented.');
    if (!nonEmpty(material.standardReference)) warn(`${base}.standardReference`, 'MAT-005', 'Material standard/reference is not documented.');

    const propertyKeys = new Set<string>();
    for (const [propertyIndex, property] of material.properties.entries()) {
      const field = `${base}.properties.${propertyIndex}`;
      if (!nonEmpty(property.key)) block(`${field}.key`, 'MAT-PROP-001', 'Material property key must be non-empty.');
      else if (propertyKeys.has(property.key)) block(`${field}.key`, 'MAT-PROP-002', `Duplicate property key '${property.key}' within material '${material.id}'.`);
      propertyKeys.add(property.key);
      if (typeof property.value === 'number' && !Number.isFinite(property.value)) block(`${field}.value`, 'MAT-PROP-003', 'Numeric material property values must be finite.');
      if (typeof property.value === 'string' && !property.value.trim()) block(`${field}.value`, 'MAT-PROP-004', 'String material property values must be non-empty.');
      if (!nonEmpty(property.provenanceEntityId)) warn(`${field}.provenanceEntityId`, 'MAT-PROP-005', 'Material property has no provenance entity binding.');
    }
  }

  if ((materials ?? []).length === 0) warn('materials', 'MAT-000', 'No project materials are documented.');

  const blocked = findings.some(f => f.severity === 'blocking');
  const preliminary = findings.some(f => f.severity === 'warning');
  return Object.freeze({
    status: blocked ? 'BLOCKED' : preliminary ? 'PRELIMINARY' : 'DOCUMENTED',
    findings: Object.freeze(findings),
    method: 'tolue-project-material-input-v1',
  });
}
