import { validateVerificationEvidencePackage, type VerificationEvidencePackage } from '../../../engineering/core/verificationEvidencePackage';

export interface PersistedVerificationEvidencePackageRow {
  readonly packageId: string;
  readonly generatedAtIso: string;
  readonly generatedBy: string;
  readonly purpose: string;
  readonly entryCount: number;
  readonly packageJson: string;
  readonly importedAtIso: string;
}

export interface VerificationEvidencePackageHistoryItem {
  readonly packageId: string;
  readonly generatedAtIso: string;
  readonly generatedBy: string;
  readonly purpose: string;
  readonly entryCount: number;
  readonly importedAtIso: string;
}

export interface VerificationEvidencePackageRowStore {
  readonly insertVerificationEvidencePackage: (row: Readonly<PersistedVerificationEvidencePackageRow>) => void;
  readonly readVerificationEvidencePackage: (packageId: string) => Readonly<PersistedVerificationEvidencePackageRow> | null;
  readonly listVerificationEvidencePackages: () => readonly Readonly<PersistedVerificationEvidencePackageRow>[];
}

function rowFor(input: Readonly<VerificationEvidencePackage>, importedAtIso: string): Readonly<PersistedVerificationEvidencePackageRow> {
  validateVerificationEvidencePackage(input);
  if (!Number.isFinite(Date.parse(importedAtIso))) throw new Error('VERIFICATION-PERSISTENCE-IMPORTED-AT-001');
  return Object.freeze({
    packageId: input.packageId,
    generatedAtIso: input.generatedAtIso,
    generatedBy: input.generatedBy,
    purpose: input.purpose,
    entryCount: input.entries.length,
    packageJson: JSON.stringify(input),
    importedAtIso,
  });
}

function parseRow(row: Readonly<PersistedVerificationEvidencePackageRow>): Readonly<VerificationEvidencePackage> {
  let parsed: VerificationEvidencePackage;
  try { parsed = JSON.parse(row.packageJson) as VerificationEvidencePackage; }
  catch { throw new Error('VERIFICATION-PERSISTENCE-JSON-001'); }
  try { validateVerificationEvidencePackage(parsed); }
  catch { throw new Error('VERIFICATION-PERSISTENCE-INTEGRITY-001'); }
  if (parsed.packageId !== row.packageId || parsed.generatedAtIso !== row.generatedAtIso || parsed.generatedBy !== row.generatedBy || parsed.purpose !== row.purpose || parsed.entries.length !== row.entryCount) {
    throw new Error('VERIFICATION-PERSISTENCE-INTEGRITY-002');
  }
  return Object.freeze(structuredClone(parsed));
}

function same(left: Readonly<PersistedVerificationEvidencePackageRow>, right: Readonly<PersistedVerificationEvidencePackageRow>): boolean {
  return left.packageId === right.packageId && left.generatedAtIso === right.generatedAtIso && left.generatedBy === right.generatedBy && left.purpose === right.purpose && left.entryCount === right.entryCount && left.packageJson === right.packageJson;
}

export function createVerificationEvidenceRepository(store: Readonly<VerificationEvidencePackageRowStore>) {
  return Object.freeze({
    save(input: Readonly<VerificationEvidencePackage>, importedAtIso: string): void {
      const next = rowFor(input, importedAtIso);
      const existing = store.readVerificationEvidencePackage(next.packageId);
      if (existing) {
        if (same(existing, next)) return;
        throw new Error('VERIFICATION-PERSISTENCE-IMMUTABLE-001');
      }
      store.insertVerificationEvidencePackage(next);
    },
    findByPackageId(packageId: string): Readonly<VerificationEvidencePackage> | null {
      if (!packageId.trim()) throw new Error('VERIFICATION-PERSISTENCE-ID-001');
      const row = store.readVerificationEvidencePackage(packageId);
      return row ? parseRow(row) : null;
    },
    listHistory(): readonly Readonly<VerificationEvidencePackageHistoryItem>[] {
      return Object.freeze(store.listVerificationEvidencePackages().map(row => {
        parseRow(row);
        return Object.freeze({ packageId: row.packageId, generatedAtIso: row.generatedAtIso, generatedBy: row.generatedBy, purpose: row.purpose, entryCount: row.entryCount, importedAtIso: row.importedAtIso });
      }));
    },
  });
}

export type VerificationEvidenceRepository = ReturnType<typeof createVerificationEvidenceRepository>;
