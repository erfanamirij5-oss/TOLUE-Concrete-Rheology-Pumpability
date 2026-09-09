import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import type { LicenseStatus } from './licensePolicy';

export type LicenseAuditEvent = 'STARTUP_EVALUATION' | 'IMPORT_ACCEPTED' | 'IMPORT_REJECTED' | 'IMPORT_CANCELLED';

export interface LicenseAuditEntry {
  readonly schemaVersion: 'tolue-license-audit-v1';
  readonly occurredAtIso: string;
  readonly event: LicenseAuditEvent;
  readonly status: LicenseStatus;
  readonly licenseId: string | null;
  readonly errorCode: string | null;
  readonly method: 'tolue-license-audit-v1';
}

const FILE_NAME = 'tolue-license-audit.jsonl';
const METHOD = 'tolue-license-audit-v1' as const;

function clean(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 256 || /[\r\n]/u.test(trimmed)) throw new Error('LICENSE-AUDIT-VALUE-001');
  return trimmed;
}

export function appendLicenseAudit(userDataPath: string, input: Omit<LicenseAuditEntry, 'schemaVersion' | 'method'>): Readonly<LicenseAuditEntry> {
  if (!isAbsolute(userDataPath)) throw new Error('LICENSE-AUDIT-PATH-001');
  if (!input.occurredAtIso.trim() || !Number.isFinite(Date.parse(input.occurredAtIso))) throw new Error('LICENSE-AUDIT-TIME-001');
  const entry = Object.freeze({ schemaVersion: 'tolue-license-audit-v1' as const, occurredAtIso: input.occurredAtIso, event: input.event, status: input.status, licenseId: clean(input.licenseId), errorCode: clean(input.errorCode), method: METHOD });
  const path = join(userDataPath, FILE_NAME);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(entry)}\n`, { encoding: 'utf8' });
  return entry;
}

export function readLicenseAudit(userDataPath: string): readonly Readonly<LicenseAuditEntry>[] {
  if (!isAbsolute(userDataPath)) throw new Error('LICENSE-AUDIT-PATH-001');
  const path = join(userDataPath, FILE_NAME);
  let raw = '';
  try { raw = readFileSync(path, 'utf8'); } catch { return Object.freeze([]); }
  const entries = raw.split(/\r?\n/u).filter(Boolean).map(line => JSON.parse(line) as LicenseAuditEntry);
  return Object.freeze(entries.map(entry => Object.freeze(entry)));
}
