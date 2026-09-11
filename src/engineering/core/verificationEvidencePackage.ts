import { evaluateVerificationEvidencePortfolio, type VerificationEvidenceEntry, type VerificationEvidencePortfolioResult } from './verificationEvidencePortfolio';

export type VerificationEvidencePackageSchemaVersion = 'tolue-verification-evidence-package-v1';

export interface VerificationEvidencePackage {
  readonly schemaVersion: VerificationEvidencePackageSchemaVersion;
  readonly packageId: string;
  readonly generatedAtIso: string;
  readonly generatedBy: string;
  readonly purpose: string;
  readonly entries: readonly Readonly<VerificationEvidenceEntry>[];
}

export interface VerificationEvidencePackageEvaluation {
  readonly packageId: string;
  readonly entryCount: number;
  readonly uniqueCaseCount: number;
  readonly portfolio: Readonly<VerificationEvidencePortfolioResult>;
  readonly method: 'tolue-verification-evidence-package-evaluation-v1';
}

function text(value: string, field: string): void {
  if (!value.trim()) throw new Error(`VERIFICATION-PACKAGE-INVALID:${field}`);
}

function caseId(entry: Readonly<VerificationEvidenceEntry>): string {
  return entry.tier === 'TIER_B_PUBLISHED_FULL_SCALE'
    ? entry.case.caseId
    : entry.evaluationInput.fieldCase.caseId;
}

function sourceHash(entry: Readonly<VerificationEvidenceEntry>): string {
  return entry.tier === 'TIER_B_PUBLISHED_FULL_SCALE'
    ? entry.case.source.sourceHash
    : entry.evaluationInput.fieldCase.source.sourceHash;
}

export function validateVerificationEvidencePackage(input: Readonly<VerificationEvidencePackage>): void {
  if (input.schemaVersion !== 'tolue-verification-evidence-package-v1') throw new Error('VERIFICATION-PACKAGE-SCHEMA-001');
  text(input.packageId, 'packageId');
  text(input.generatedBy, 'generatedBy');
  text(input.purpose, 'purpose');
  if (!Number.isFinite(Date.parse(input.generatedAtIso))) throw new Error('VERIFICATION-PACKAGE-INVALID:generatedAtIso');
  if (!Array.isArray(input.entries) || input.entries.length === 0) throw new Error('VERIFICATION-PACKAGE-EMPTY-001');

  const keys = new Set<string>();
  for (const entry of input.entries) {
    const id = caseId(entry);
    const hash = sourceHash(entry);
    text(id, 'entry.caseId');
    text(hash, 'entry.sourceHash');
    const key = `${entry.tier}:${id}`;
    if (keys.has(key)) throw new Error(`VERIFICATION-PACKAGE-DUPLICATE-CASE:${key}`);
    keys.add(key);
  }

  // Portfolio evaluation is part of package validation so reviewed ADMITTED and
  // EXCLUDED entries cannot bypass source-hash/reviewer governance.
  evaluateVerificationEvidencePortfolio(input.entries);
}

export function evaluateVerificationEvidencePackage(
  input: Readonly<VerificationEvidencePackage>,
): Readonly<VerificationEvidencePackageEvaluation> {
  validateVerificationEvidencePackage(input);
  const portfolio = evaluateVerificationEvidencePortfolio(input.entries);
  const uniqueCaseCount = new Set(input.entries.map(entry => `${entry.tier}:${caseId(entry)}`)).size;
  return Object.freeze({
    packageId: input.packageId,
    entryCount: input.entries.length,
    uniqueCaseCount,
    portfolio,
    method: 'tolue-verification-evidence-package-evaluation-v1',
  });
}
