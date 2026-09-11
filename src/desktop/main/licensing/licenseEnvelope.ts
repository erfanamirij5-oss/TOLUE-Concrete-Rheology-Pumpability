import { createHash, createPublicKey, verify } from 'node:crypto';
import type { VerifiedLicenseEntitlement } from './licensePolicy';

export interface LicenseEntitlementPayload {
  readonly licenseId: string;
  readonly productId: 'tolue-concrete-rheology-pumpability';
  readonly machineId: string;
  readonly validFromIso: string;
  readonly validUntilIso: string;
}

export interface SignedLicenseEnvelopeV1 {
  readonly schemaVersion: 'tolue-license-v1';
  readonly entitlement: Readonly<LicenseEntitlementPayload>;
  readonly signatureBase64: string;
}

export interface SignedLicenseEnvelopeV2 {
  readonly schemaVersion: 'tolue-license-v2';
  readonly keyId: 'tolue-prod-2026-03';
  readonly publicKeyPem: string;
  readonly entitlement: Readonly<LicenseEntitlementPayload>;
  readonly signatureBase64: string;
}

export type SignedLicenseEnvelope = SignedLicenseEnvelopeV1 | SignedLicenseEnvelopeV2;

const PRODUCT_ID = 'tolue-concrete-rheology-pumpability' as const;
export const PRODUCTION_KEY_ID = 'tolue-prod-2026-03' as const;
export const PRODUCTION_PUBLIC_PEM_SHA256 = '1cb27a3646b957ceb02d1d3649604a8677f702450a6f1f3293422e301b5b7517' as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizePem(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() + '\n';
}

function parseEntitlement(value: unknown): Readonly<LicenseEntitlementPayload> | null {
  if (!record(value)) return null;
  if (Object.keys(value).some(key => !['licenseId', 'productId', 'machineId', 'validFromIso', 'validUntilIso'].includes(key))) return null;
  if (!nonEmpty(value.licenseId) || value.productId !== PRODUCT_ID || !nonEmpty(value.machineId) || !nonEmpty(value.validFromIso) || !nonEmpty(value.validUntilIso)) return null;
  return Object.freeze({
    licenseId: value.licenseId,
    productId: PRODUCT_ID,
    machineId: value.machineId,
    validFromIso: value.validFromIso,
    validUntilIso: value.validUntilIso,
  });
}

function parseEnvelope(value: unknown): Readonly<SignedLicenseEnvelope> | null {
  if (!record(value)) return null;
  if (value.schemaVersion === 'tolue-license-v1') {
    if (Object.keys(value).some(key => !['schemaVersion', 'entitlement', 'signatureBase64'].includes(key)) || !nonEmpty(value.signatureBase64)) return null;
    const entitlement = parseEntitlement(value.entitlement);
    if (!entitlement) return null;
    return Object.freeze({ schemaVersion: 'tolue-license-v1', entitlement, signatureBase64: value.signatureBase64 });
  }
  if (value.schemaVersion === 'tolue-license-v2') {
    if (Object.keys(value).some(key => !['schemaVersion', 'keyId', 'publicKeyPem', 'entitlement', 'signatureBase64'].includes(key))) return null;
    if (value.keyId !== PRODUCTION_KEY_ID || !nonEmpty(value.publicKeyPem) || !nonEmpty(value.signatureBase64)) return null;
    const entitlement = parseEntitlement(value.entitlement);
    if (!entitlement) return null;
    return Object.freeze({
      schemaVersion: 'tolue-license-v2',
      keyId: PRODUCTION_KEY_ID,
      publicKeyPem: normalizePem(value.publicKeyPem),
      entitlement,
      signatureBase64: value.signatureBase64,
    });
  }
  return null;
}

export function canonicalLicensePayload(entitlement: Readonly<LicenseEntitlementPayload>): string {
  return JSON.stringify({
    licenseId: entitlement.licenseId,
    productId: entitlement.productId,
    machineId: entitlement.machineId,
    validFromIso: entitlement.validFromIso,
    validUntilIso: entitlement.validUntilIso,
  });
}

export function verifySignedLicenseEnvelope(value: unknown, legacyPublicKeyPem = '', expectedProductionFingerprint: string = PRODUCTION_PUBLIC_PEM_SHA256): Readonly<VerifiedLicenseEntitlement> | null {
  const envelope = parseEnvelope(value);
  if (!envelope) return null;
  const publicKeyPem = envelope.schemaVersion === 'tolue-license-v2' ? envelope.publicKeyPem : legacyPublicKeyPem;
  if (!publicKeyPem.trim()) return null;
  if (envelope.schemaVersion === 'tolue-license-v2') {
    const fingerprint = createHash('sha256').update(normalizePem(publicKeyPem), 'utf8').digest('hex');
    if (fingerprint !== expectedProductionFingerprint.toLowerCase()) return null;
  }
  let signature: Buffer;
  try {
    signature = Buffer.from(envelope.signatureBase64, 'base64');
  } catch {
    return null;
  }
  if (signature.byteLength !== 64) return null;
  try {
    const publicKey = createPublicKey(publicKeyPem);
    if (publicKey.asymmetricKeyType !== 'ed25519') return null;
    const valid = verify(null, Buffer.from(canonicalLicensePayload(envelope.entitlement), 'utf8'), publicKey, signature);
    if (!valid) return null;
  } catch {
    return null;
  }
  return Object.freeze({ ...envelope.entitlement, verification: 'VERIFIED' as const });
}
