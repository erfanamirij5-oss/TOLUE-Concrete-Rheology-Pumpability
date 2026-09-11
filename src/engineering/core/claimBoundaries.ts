export const PUMPABILITY_SCIENTIFIC_CLAIM_BOUNDARIES = Object.freeze([
  'Stability and blockage conclusions are project-qualified evidence decisions, not universal physical predictions.',
  'The current engineering core does not compute an exact physical blockage location; any spatial blockage marker is illustrative/diagnostic only.',
  'The current visualization is not CFD or DEM and must not be represented as a CFD/DEM simulation.',
  'A non-negative pump pressure margin is a modeled pressure-feasibility result, not a reliability, safety-factor, or operational certification.',
] as const);

export type PumpabilityScientificClaimBoundary = typeof PUMPABILITY_SCIENTIFIC_CLAIM_BOUNDARIES[number];

export function mergeScientificClaimBoundaries(limitations: readonly string[]): string[] {
  return [...new Set([...limitations, ...PUMPABILITY_SCIENTIFIC_CLAIM_BOUNDARIES])];
}
