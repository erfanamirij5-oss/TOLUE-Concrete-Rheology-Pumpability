import { describe, expect, it, vi } from 'vitest';
import { migratePersistenceSchema } from './persistenceMigration';
import { TOLUE_PERSISTENCE_MIGRATIONS, validatePersistenceMigrations } from './persistenceSchema';

describe('persistence migration foundation', () => {
  it('validates the committed migration sequence', () => {
    expect(() => validatePersistenceMigrations()).not.toThrow();
  });

  it('applies pending migrations atomically and records deterministic versions', () => {
    const applyMigrationAtomically = vi.fn();
    const result = migratePersistenceSchema(
      { readSchemaVersion: () => 0, applyMigrationAtomically },
      '2026-09-09T00:00:00.000Z',
    );

    expect(applyMigrationAtomically).toHaveBeenCalledTimes(1);
    expect(applyMigrationAtomically).toHaveBeenCalledWith(
      TOLUE_PERSISTENCE_MIGRATIONS[0],
      '2026-09-09T00:00:00.000Z',
    );
    expect(result).toEqual({
      fromVersion: 0,
      toVersion: 1,
      appliedVersions: [1],
      method: 'tolue-persistence-migration-v2',
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.appliedVersions)).toBe(true);
  });

  it('is a no-op when the store is already on the current schema', () => {
    const applyMigrationAtomically = vi.fn();
    const result = migratePersistenceSchema(
      { readSchemaVersion: () => 1, applyMigrationAtomically },
      '2026-09-09T00:00:00.000Z',
    );
    expect(applyMigrationAtomically).not.toHaveBeenCalled();
    expect(result.fromVersion).toBe(1);
    expect(result.toVersion).toBe(1);
    expect(result.appliedVersions).toEqual([]);
  });

  it('fails closed for an unknown future schema version', () => {
    expect(() => migratePersistenceSchema(
      { readSchemaVersion: () => 2, applyMigrationAtomically: vi.fn() },
      '2026-09-09T00:00:00.000Z',
    )).toThrow('PERSISTENCE-MIGRATION-FUTURE-001');
  });

  it('rejects invalid migration timestamps before any write', () => {
    const applyMigrationAtomically = vi.fn();
    expect(() => migratePersistenceSchema(
      { readSchemaVersion: () => 0, applyMigrationAtomically },
      'not-a-date',
    )).toThrow('PERSISTENCE-MIGRATION-DATE-001');
    expect(applyMigrationAtomically).not.toHaveBeenCalled();
  });
});
