import { join } from 'node:path';
import { migratePersistenceSchema, type PersistenceMigrationResult } from './persistenceMigration';
import { openSqlitePersistenceAdapter, type SqlitePersistenceAdapter } from './sqlitePersistenceAdapter';

export const TOLUE_DATABASE_FILENAME = 'tolue-rheology.sqlite3' as const;

export interface PersistenceBootstrapResult {
  readonly databasePath: string;
  readonly migration: Readonly<PersistenceMigrationResult>;
  readonly close: () => void;
}

export function bootstrapPersistence(userDataPath: string, nowIso = new Date().toISOString()): Readonly<PersistenceBootstrapResult> {
  if (!userDataPath.trim()) throw new Error('PERSISTENCE-USER-DATA-PATH-001');
  const databasePath = join(userDataPath, TOLUE_DATABASE_FILENAME);
  let adapter: Readonly<SqlitePersistenceAdapter> | null = null;
  try {
    adapter = openSqlitePersistenceAdapter(databasePath);
    const migration = migratePersistenceSchema(adapter, nowIso);
    return Object.freeze({ databasePath, migration, close: adapter.close });
  } catch (error) {
    try { adapter?.close(); } catch { /* preserve bootstrap failure */ }
    throw error;
  }
}
