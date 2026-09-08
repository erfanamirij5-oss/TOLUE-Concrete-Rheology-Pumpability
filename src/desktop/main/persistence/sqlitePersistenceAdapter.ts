import { DatabaseSync } from 'node:sqlite';
import type { EngineeringRunRowStore, PersistedEngineeringRunRow } from './engineeringRunRepository';
import type { PersistenceMigrationStore } from './persistenceMigration';
import type { PersistenceMigration } from './persistenceSchema';

export interface SqlitePersistenceAdapter extends PersistenceMigrationStore, EngineeringRunRowStore {
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

  const upsertEngineeringRun = (row: Readonly<PersistedEngineeringRunRow>): void => {
    database.prepare(`INSERT INTO engineering_runs (
      run_id, engine_version, created_at_iso, input_snapshot_hash, execution_status, completeness, input_json, result_json, method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(run_id) DO UPDATE SET
      engine_version=excluded.engine_version,
      created_at_iso=excluded.created_at_iso,
      input_snapshot_hash=excluded.input_snapshot_hash,
      execution_status=excluded.execution_status,
      completeness=excluded.completeness,
      input_json=excluded.input_json,
      result_json=excluded.result_json,
      method=excluded.method`)
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
    const rows = database.prepare(`${rowSelect} ORDER BY created_at_iso DESC, run_id ASC`).all() as PersistedEngineeringRunRow[];
    return Object.freeze(rows.map(row => Object.freeze(row)));
  };

  return Object.freeze({ databasePath, readSchemaVersion, applyMigrationAtomically, upsertEngineeringRun, readEngineeringRun, listEngineeringRuns, close: () => database.close() });
}
