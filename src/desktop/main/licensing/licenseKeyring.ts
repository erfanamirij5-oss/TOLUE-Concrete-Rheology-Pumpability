import { createPublicKey } from 'node:crypto';

export interface LicensePublicKeyRecord {
  readonly keyId: string;
  readonly publicKeyPem: string;
  readonly status: 'ACTIVE' | 'LEGACY_VERIFY_ONLY';
}

export interface LicensePublicKeyring {
  readonly activeKeyId: string;
  readonly keys: readonly Readonly<LicensePublicKeyRecord>[];
  readonly method: 'tolue-license-public-keyring-v1';
}

const METHOD = 'tolue-license-public-keyring-v1' as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateKeyId(value: string): string {
  const keyId = value.trim();
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/u.test(keyId)) throw new Error('LICENSE-KEYRING-KEYID-001');
  return keyId;
}

function validateEd25519Pem(value: string): string {
  if (!value.trim()) throw new Error('LICENSE-KEYRING-PEM-001');
  try {
    const key = createPublicKey(value);
    if (key.asymmetricKeyType !== 'ed25519') throw new Error('LICENSE-KEYRING-PEM-002');
  } catch (error) {
    if (error instanceof Error && error.message === 'LICENSE-KEYRING-PEM-002') throw error;
    throw new Error('LICENSE-KEYRING-PEM-001');
  }
  return value;
}

export function createLicensePublicKeyring(activeKeyId: string, records: readonly Readonly<LicensePublicKeyRecord>[]): Readonly<LicensePublicKeyring> {
  const normalizedActive = validateKeyId(activeKeyId);
  if (records.length === 0) throw new Error('LICENSE-KEYRING-EMPTY-001');
  const seen = new Set<string>();
  const keys = records.map(record => {
    const keyId = validateKeyId(record.keyId);
    if (seen.has(keyId)) throw new Error('LICENSE-KEYRING-DUPLICATE-001');
    seen.add(keyId);
    if (record.status !== 'ACTIVE' && record.status !== 'LEGACY_VERIFY_ONLY') throw new Error('LICENSE-KEYRING-STATUS-001');
    return Object.freeze({ keyId, publicKeyPem: validateEd25519Pem(record.publicKeyPem), status: record.status });
  });
  const active = keys.find(key => key.keyId === normalizedActive);
  if (!active || active.status !== 'ACTIVE') throw new Error('LICENSE-KEYRING-ACTIVE-001');
  if (keys.filter(key => key.status === 'ACTIVE').length !== 1) throw new Error('LICENSE-KEYRING-ACTIVE-002');
  return Object.freeze({ activeKeyId: normalizedActive, keys: Object.freeze(keys), method: METHOD });
}

export function parseLicensePublicKeyring(value: unknown): Readonly<LicensePublicKeyring> | null {
  try {
    if (!record(value) || Object.keys(value).some(key => !['activeKeyId', 'keys', 'method'].includes(key))) return null;
    if (value.method !== METHOD || typeof value.activeKeyId !== 'string' || !Array.isArray(value.keys)) return null;
    const records: LicensePublicKeyRecord[] = [];
    for (const entry of value.keys) {
      if (!record(entry) || Object.keys(entry).some(key => !['keyId', 'publicKeyPem', 'status'].includes(key))) return null;
      if (typeof entry.keyId !== 'string' || typeof entry.publicKeyPem !== 'string') return null;
      if (entry.status !== 'ACTIVE' && entry.status !== 'LEGACY_VERIFY_ONLY') return null;
      records.push({ keyId: entry.keyId, publicKeyPem: entry.publicKeyPem, status: entry.status });
    }
    return createLicensePublicKeyring(value.activeKeyId, records);
  } catch {
    return null;
  }
}

export function resolveLicensePublicKey(keyring: Readonly<LicensePublicKeyring>, keyId: string): string | null {
  const normalized = keyId.trim();
  if (!normalized) return null;
  return keyring.keys.find(key => key.keyId === normalized)?.publicKeyPem ?? null;
}
