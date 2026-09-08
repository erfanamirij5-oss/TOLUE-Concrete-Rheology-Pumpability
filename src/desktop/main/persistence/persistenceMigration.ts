import {
  TOLUE_PERSISTENCE_MIGRATIONS,
  TOLUE_PERSISTENCE_SCHEMA_VERSION,
  validatePersistenceMigrations,
  type PersistenceMigration,
} from './persistenceSchema';

export interface PersistenceMigrationStore {
  readonly readSchemaVersion: () => number;
  readonly executeTransaction: (statements: readonly string[]) => void;
  readonly writeSchemaVersion: (version: number, migratedAtIso: string) => void;
}

export interface PersistenceMigrationResult {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly appliedVersions: readonly number[];
  readonly method: 'tolue-persistence-migration-v1';
}

export function migratePersistenceSchema(
  store: Readonly<PersistenceMigrationStore>,
  migratedAtIso: string,
  migrations: readonly Readonly<PersistenceMigration>[] = TOLUE_PERSISTENCE_MIGRATIONS,
): Readonly<PersistenceMigrationResult> {
  validatePersistenceMigrations(migrations);
  if (!Number.isFinite(Date.parse(migratedAtIso))) throw new Error('PERSISTENCE-MIGRATION-DATE-001');

  const currentVersion = store.readSchemaVersion();
  if (!Number.isInteger(currentVersion) || currentVersion < 0) throw new Error('PERSISTENCE-MIGRATION-CURRENT-001');
  if (currentVersion > TOLUE_PERSISTENCE_SCHEMA_VERSION) throw new Error('PERSISTENCE-MIGRATION-FUTURE-001');

  const pending = migrations.filter(migration => migration.version > currentVersion);
  const appliedVersions: number[] = [];

  for (const migration of pending) {
    store.executeTransaction(migration.statements);
    store.writeSchemaVersion(migration.version, migratedAtIso);
    appliedVersions.push(migration.version);
  }

  return Object.freeze({
    fromVersion: currentVersion,
    toVersion: pending.at(-1)?.version ?? currentVersion,
    appliedVersions: Object.freeze(appliedVersions),
    method: 'tolue-persistence-migration-v1',
  });
}
