import { describe, expect, it } from 'vitest';
import {
  assertModelMayProduceProductionQualifiedResult,
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
