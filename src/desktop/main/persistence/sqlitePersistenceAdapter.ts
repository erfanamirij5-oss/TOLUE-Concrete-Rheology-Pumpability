import { DatabaseSync } from 'node:sqlite';
import type { PersistenceMigrationStore } from './persistenceMigration';

export interface SqlitePersistenceAdapter extends PersistenceMigrationStore {
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

  const executeMigrationTransaction = (
    statements: readonly string[],
    version: number,
    migratedAtIso: string,
  ): void => {
    database.exec('BEGIN IMMEDIATE');
    try {
      for (const statement of statements) database.exec(statement);
      database.prepare(`INSERT INTO schema_meta (singleton_id, schema_version, migrated_at_iso)
        VALUES (1, ?, ?)
        ON CONFLICT(singleton_id) DO UPDATE SET schema_version=excluded.schema_version, migrated_at_iso=excluded.migrated_at_iso`)
        .run(version, migratedAtIso);
      database.exec('COMMIT');
    } catch (error) {
      try { database.exec('ROLLBACK'); } catch { /* preserve original migration failure */ }
      throw error;
    }
  };

  return Object.freeze({
    databasePath,
    readSchemaVersion,
    executeMigrationTransaction,
    close: () => database.close(),
  });
}
