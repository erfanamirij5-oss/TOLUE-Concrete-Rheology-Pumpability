export type RheologyModelFamily = 'BINGHAM' | 'TWO_FLUID_BINGHAM' | 'OTHER_CORE_MODEL';

export interface RheologyInputPresentation {
  readonly modelFamily: RheologyModelFamily;
  readonly inputId: string;
  readonly label: string;
  readonly value: number | null;
  readonly unit: string;
  readonly provenanceEntityId?: string;
}

export interface RheologyResultPresentation {
  readonly resultId: string;
  readonly label: string;
  readonly value: number | null;
  readonly unit: string;
  readonly methodId: string;
  readonly referenceIds: readonly string[];
  readonly limitations: readonly string[];
}

export function createRheologyInputPresentation(input: RheologyInputPresentation): Readonly<RheologyInputPresentation> {
  return Object.freeze({ ...input });
}

export function createRheologyResultPresentation(result: RheologyResultPresentation): Readonly<RheologyResultPresentation> {
  return Object.freeze({
    ...result,
    referenceIds: Object.freeze([...result.referenceIds]),
    limitations: Object.freeze([...result.limitations]),
  });
}
