import { createPublicKey, verify } from 'node:crypto';

export interface LicenseTrustedTimeAnchor {
  readonly schemaVersion: 'tolue-trusted-time-v1';
  readonly keyId: string;
  readonly trustedAtIso: string;
  readonly signatureBase64: string;
}

export interface VerifiedTrustedTime {
  readonly keyId: string;
  readonly trustedAtIso: string;
  readonly method: 'tolue-trusted-time-v1';
}

const METHOD = 'tolue-trusted-time-v1' as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validIso(value: string): boolean {
  return value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

export function canonicalTrustedTimePayload(keyId: string, trustedAtIso: string): string {
  return JSON.stringify({ keyId, trustedAtIso });
}

export function verifyTrustedTimeAnchor(value: unknown, resolvePublicKey: (keyId: string) => string | null): Readonly<VerifiedTrustedTime> | null {
  if (!record(value)) return null;
  if (Object.keys(value).some(key => !['schemaVersion', 'keyId', 'trustedAtIso', 'signatureBase64'].includes(key))) return null;
  if (value.schemaVersion !== 'tolue-trusted-time-v1' || typeof value.keyId !== 'string' || typeof value.trustedAtIso !== 'string' || typeof value.signatureBase64 !== 'string') return null;
  const keyId = value.keyId.trim();
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/u.test(keyId) || !validIso(value.trustedAtIso) || !value.signatureBase64.trim()) return null;
  const publicKeyPem = resolvePublicKey(keyId);
  if (!publicKeyPem) return null;
  let signature: Buffer;
  try { signature = Buffer.from(value.signatureBase64, 'base64'); } catch { return null; }
  if (signature.byteLength !== 64) return null;
  try {
    const key = createPublicKey(publicKeyPem);
    if (key.asymmetricKeyType !== 'ed25519') return null;
    const ok = verify(null, Buffer.from(canonicalTrustedTimePayload(keyId, value.trustedAtIso), 'utf8'), key, signature);
    if (!ok) return null;
  } catch { return null; }
  return Object.freeze({ keyId, trustedAtIso: value.trustedAtIso, method: METHOD });
}

export function resolveEffectiveLicenseTime(localNowIso: string, trusted: Readonly<VerifiedTrustedTime> | null): string {
  const localMs = Date.parse(localNowIso);
  if (!localNowIso.trim() || !Number.isFinite(localMs)) throw new Error('LICENSE-TRUSTED-TIME-LOCAL-001');
  if (!trusted) return localNowIso;
  const trustedMs = Date.parse(trusted.trustedAtIso);
  if (!Number.isFinite(trustedMs)) throw new Error('LICENSE-TRUSTED-TIME-ANCHOR-001');
  return trustedMs > localMs ? trusted.trustedAtIso : localNowIso;
}
