import { describe, expect, it } from 'vitest';
import {
  assertModelMayProduceProductionQualifiedResult,
  evaluateModelReadinessGovernance,
  getExecutableModelRecord,
  listExecutableModelRecords,
} from './modelRegistry';

describe('executable model registry', () => {
  it('registers the current straight-pipe solver as numerically verified but not production eligible', () => {
    const record = getExecutableModelRecord('PRESSURE-STRAIGHT-TWOFLUID-BINGHAM-001');
    expect(record?.status).toBe('numerically_verified');
    expect(record?.productionEligible).toBe(false);
    expect(record?.implementationPath).toBe('src/engineering/core/twoFluidBingham.ts');
  });

  it('maps the straight-pipe solver to PRELIMINARY readiness from registry state', () => {
    const result = evaluateModelReadinessGovernance('PRESSURE-STRAIGHT-TWOFLUID-BINGHAM-001');
    expect(result.disposition).toBe('PRELIMINARY');
    expect(result.status).toBe('numerically_verified');
    expect(result.requiredEvidence).toContain('Tier-B published/full-scale verification');
    expect(result.requiredEvidence).toContain('Tier-C TOLUE field validation');
  });

  it('fails closed at readiness for unknown and blocked models', () => {
    const unknown = evaluateModelReadinessGovernance('UNKNOWN-MODEL');
    expect(unknown.disposition).toBe('BLOCKED');
    expect(unknown.status).toBe('unknown');
    const blockage = evaluateModelReadinessGovernance('BLOCKAGE-001');
    expect(blockage.disposition).toBe('BLOCKED');
    expect(blockage.status).toBe('blocked');
  });

  it('keeps implemented local-loss and pump-envelope models preliminary until production approval', () => {
    expect(evaluateModelReadinessGovernance('PRESSURE-LOCAL-CAL-001').disposition).toBe('PRELIMINARY');
    expect(evaluateModelReadinessGovernance('PUMP-OPERATING-ENVELOPE-001').disposition).toBe('PRELIMINARY');
  });

  it('fails closed for production qualification while evidence gates remain open', () => {
    expect(() => assertModelMayProduceProductionQualifiedResult('PRESSURE-STRAIGHT-TWOFLUID-BINGHAM-001'))
      .toThrow('MODEL-REGISTRY-NOT-PRODUCTION:PRESSURE-STRAIGHT-TWOFLUID-BINGHAM-001:numerically_verified');
  });

  it('fails closed for unknown model IDs', () => {
    expect(() => assertModelMayProduceProductionQualifiedResult('UNKNOWN-MODEL'))
      .toThrow('MODEL-REGISTRY-UNKNOWN:UNKNOWN-MODEL');
  });

  it('keeps blockage physically blocked', () => {
    const blockage = getExecutableModelRecord('BLOCKAGE-001');
    expect(blockage?.status).toBe('blocked');
    expect(blockage?.productionEligible).toBe(false);
    expect(listExecutableModelRecords().length).toBeGreaterThanOrEqual(4);
  });
});
