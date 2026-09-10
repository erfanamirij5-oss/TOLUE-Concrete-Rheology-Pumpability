import type { SimulationRunInput } from '../../engineering/core/simulationRun';

export type RheologyInputPath =
  | 'bulk.yieldStressPa'
  | 'bulk.plasticViscosityPaS'
  | 'lubricationLayer.yieldStressPa'
  | 'lubricationLayer.plasticViscosityPaS';

/**
 * Renderer-side draft editing only. This function does not infer defaults,
 * convert units, or apply engineering acceptance criteria.
 */
export function updateRheologyInputDraft(
  input: Readonly<SimulationRunInput>,
  path: RheologyInputPath,
  value: number,
): Readonly<SimulationRunInput> {
  if (!Number.isFinite(value)) throw new Error('ENGINEERING-INPUT-DRAFT-NUMBER-001');
  if (path.endsWith('yieldStressPa') && value < 0) throw new Error('ENGINEERING-INPUT-DRAFT-YIELD-001');
  if (path.endsWith('plasticViscosityPaS') && value <= 0) throw new Error('ENGINEERING-INPUT-DRAFT-VISCOSITY-001');

  const next = structuredClone(input) as SimulationRunInput;
  const [family, key] = path.split('.') as ['bulk' | 'lubricationLayer', 'yieldStressPa' | 'plasticViscosityPaS'];
  next.pipeline[family][key] = value;
  return Object.freeze(next);
}
