import { DatabaseSync } from 'node:sqlite';
import type { EngineeringRunRowStore, PersistedEngineeringRunRow } from './engineeringRunRepository';
import type { PersistenceMigrationStore } from './persistenceMigration';
import type { PersistenceMigration } from './persistenceSchema';
import type { PersistedVerificationEvidencePackageRow, VerificationEvidencePackageRowStore } from './verificationEvidenceRepository';

export interface SqlitePersistenceAdapter extends PersistenceMigrationStore, EngineeringRunRowStore, VerificationEvidencePackageRowStore {
  readonly databasePath: string;
  readonly close: () => void;
}

export function openSqlitePersistenceAdapter(databasePath: string): Readonly<SqlitePersistenceAdapter> {
  if (!databasePath.trim()) throw new Error('PERSISTENCE-SQLITE-PATH-001');
  const database = new DatabaseSync(databasePath);
  database.exec('PRAGMA foreign_keys = ON');

  const readSchemaVersion = (): number => {
    const table = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_meta'").get() as { name?: string } | undefined;
    if (!table?.name) return 0;
    const row = database.prepare('SELECT schema_version FROM schema_meta WHERE singleton_id = 1').get() as { schema_version?: number } | undefined;
    if (!row) return 0;
    return row.schema_version ?? 0;
  };

  const applyMigrationAtomically = (migration: Readonly<PersistenceMigration>, migratedAtIso: string): void => {
    database.exec('BEGIN IMMEDIATE');
    try {
      for (const statement of migration.statements) database.exec(statement);
      database.prepare(`INSERT INTO schema_meta (singleton_id, schema_version, migrated_at_iso)
        VALUES (1, ?, ?)
        ON CONFLICT(singleton_id) DO UPDATE SET schema_version=excluded.schema_version, migrated_at_iso=excluded.migrated_at_iso`)
        .run(migration.version, migratedAtIso);
      database.exec('COMMIT');
    } catch (error) {
      try { database.exec('ROLLBACK'); } catch { }
      throw error;
    }
  };

  const insertEngineeringRun = (row: Readonly<PersistedEngineeringRunRow>): void => {
    database.prepare(`INSERT INTO engineering_runs (
      run_id, engine_version, created_at_iso, input_snapshot_hash, execution_status, completeness, input_json, result_json, method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(row.runId, row.engineVersion, row.createdAtIso, row.inputSnapshotHash, row.executionStatus, row.completeness, row.inputJson, row.resultJson, row.method);
  };

  const rowSelect = `SELECT run_id AS runId, engine_version AS engineVersion, created_at_iso AS createdAtIso,
    input_snapshot_hash AS inputSnapshotHash, execution_status AS executionStatus, completeness,
    input_json AS inputJson, result_json AS resultJson, method FROM engineering_runs`;

  const readEngineeringRun = (runId: string): Readonly<PersistedEngineeringRunRow> | null => {
    const row = database.prepare(`${rowSelect} WHERE run_id = ?`).get(runId) as PersistedEngineeringRunRow | undefined;
    return row ? Object.freeze(row) : null;
  };

  const listEngineeringRuns = (): readonly Readonly<PersistedEngineeringRunRow>[] => {
    const rows = database.prepare(`${rowSelect} ORDER BY created_at_iso DESC, run_id ASC`).all() as unknown as PersistedEngineeringRunRow[];
    return Object.freeze(rows.map(row => Object.freeze(row)));
  };

  const insertVerificationEvidencePackage = (row: Readonly<PersistedVerificationEvidencePackageRow>): void => {
    database.prepare(`INSERT INTO verification_evidence_packages (
      package_id, generated_at_iso, generated_by, purpose, entry_count, package_json, imported_at_iso
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(row.packageId, row.generatedAtIso, row.generatedBy, row.purpose, row.entryCount, row.packageJson, row.importedAtIso);
  };

  const verificationSelect = `SELECT package_id AS packageId, generated_at_iso AS generatedAtIso, generated_by AS generatedBy,
    purpose, entry_count AS entryCount, package_json AS packageJson, imported_at_iso AS importedAtIso
    FROM verification_evidence_packages`;

  const readVerificationEvidencePackage = (packageId: string): Readonly<PersistedVerificationEvidencePackageRow> | null => {
    const row = database.prepare(`${verificationSelect} WHERE package_id = ?`).get(packageId) as PersistedVerificationEvidencePackageRow | undefined;
    return row ? Object.freeze(row) : null;
  };

  const listVerificationEvidencePackages = (): readonly Readonly<PersistedVerificationEvidencePackageRow>[] => {
    const rows = database.prepare(`${verificationSelect} ORDER BY imported_at_iso DESC, package_id ASC`).all() as unknown as PersistedVerificationEvidencePackageRow[];
    return Object.freeze(rows.map(row => Object.freeze(row)));
  };

  return Object.freeze({
    databasePath,
    readSchemaVersion,
    applyMigrationAtomically,
    insertEngineeringRun,
    readEngineeringRun,
    listEngineeringRuns,
    insertVerificationEvidencePackage,
    readVerificationEvidencePackage,
    listVerificationEvidencePackages,
    close: () => database.close(),
  });
}
