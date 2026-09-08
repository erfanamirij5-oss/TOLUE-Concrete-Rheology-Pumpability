export const TOLUE_PERSISTENCE_SCHEMA_VERSION = 1 as const;

export interface PersistenceMigration {
  readonly version: number;
  readonly name: string;
  readonly statements: readonly string[];
}

const V1_STATEMENTS = Object.freeze([
  `CREATE TABLE IF NOT EXISTS schema_meta (
    singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
    schema_version INTEGER NOT NULL,
    migrated_at_iso TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS engineering_runs (
    run_id TEXT PRIMARY KEY NOT NULL,
    engine_version TEXT NOT NULL,
    created_at_iso TEXT NOT NULL,
    input_snapshot_hash TEXT,
    execution_status TEXT NOT NULL CHECK (execution_status IN ('EXECUTED','BLOCKED')),
    completeness TEXT NOT NULL CHECK (completeness IN ('complete','incomplete')),
    input_json TEXT NOT NULL,
    result_json TEXT,
    method TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_engineering_runs_created_at
    ON engineering_runs(created_at_iso)`,
  `CREATE INDEX IF NOT EXISTS idx_engineering_runs_input_hash
    ON engineering_runs(input_snapshot_hash)`,
] as const);

export const TOLUE_PERSISTENCE_MIGRATIONS: readonly Readonly<PersistenceMigration>[] = Object.freeze([
  Object.freeze({ version: 1, name: 'initial-engineering-run-store', statements: V1_STATEMENTS }),
]);

export function validatePersistenceMigrations(
  migrations: readonly Readonly<PersistenceMigration>[] = TOLUE_PERSISTENCE_MIGRATIONS,
): void {
  let expectedVersion = 1;
  for (const migration of migrations) {
    if (migration.version !== expectedVersion) throw new Error('PERSISTENCE-MIGRATION-VERSION-001');
    if (!migration.name.trim()) throw new Error('PERSISTENCE-MIGRATION-NAME-001');
    if (migration.statements.length === 0 || migration.statements.some(statement => !statement.trim())) {
      throw new Error('PERSISTENCE-MIGRATION-SQL-001');
    }
    expectedVersion += 1;
  }
  if (migrations.length !== TOLUE_PERSISTENCE_SCHEMA_VERSION) throw new Error('PERSISTENCE-SCHEMA-VERSION-001');
}
