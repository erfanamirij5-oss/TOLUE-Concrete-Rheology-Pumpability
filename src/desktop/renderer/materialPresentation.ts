export type MaterialPresentationKind =
  | 'cement'
  | 'water'
  | 'fine_aggregate'
  | 'coarse_aggregate'
  | 'scm'
  | 'chemical_admixture'
  | 'fiber'
  | 'other_addition';

export interface MaterialIdentityPresentation {
  readonly id: string;
  readonly kind: MaterialPresentationKind;
  readonly name: string;
  readonly supplier: string;
  readonly source: string;
  readonly standardReference: string;
}

export interface MaterialPropertyPresentation {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly unit: string | null;
  readonly provenanceEntityId: string | null;
}

export interface MaterialCardPresentation {
  readonly identity: MaterialIdentityPresentation;
  readonly properties: readonly MaterialPropertyPresentation[];
}

/**
 * Renderer presentation contract only.
 * Values are displayed exactly as supplied by trusted application/core layers.
 * No unit conversion, engineering inference, validation threshold or default is applied here.
 */
export function createMaterialCardPresentation(
  identity: MaterialIdentityPresentation,
  properties: readonly MaterialPropertyPresentation[],
): Readonly<MaterialCardPresentation> {
  return Object.freeze({
    identity: Object.freeze({ ...identity }),
    properties: Object.freeze(properties.map(property => Object.freeze({ ...property }))),
  });
}
