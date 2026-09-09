import { createPublicKey, verify } from 'node:crypto';
import type { VerifiedLicenseEntitlement } from './licensePolicy';

export interface LicenseEntitlementPayload {
  readonly licenseId: string;
  readonly productId: 'tolue-concrete-rheology-pumpability';
  readonly machineId: string;
  readonly validFromIso: string;
  readonly validUntilIso: string;
}

export interface SignedLicenseEnvelope {
  readonly schemaVersion: 'tolue-license-v1';
  readonly entitlement: Readonly<LicenseEntitlementPayload>;
  readonly signatureBase64: string;
}

const PRODUCT_ID = 'tolue-concrete-rheology-pumpability' as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseEnvelope(value: unknown): Readonly<SignedLicenseEnvelope> | null {
  if (!record(value)) return null;
  if (Object.keys(value).some(key => !['schemaVersion', 'entitlement', 'signatureBase64'].includes(key))) return null;
  if (value.schemaVersion !== 'tolue-license-v1' || !record(value.entitlement) || !nonEmpty(value.signatureBase64)) return null;
  const entitlement = value.entitlement;
  if (Object.keys(entitlement).some(key => !['licenseId', 'productId', 'machineId', 'validFromIso', 'validUntilIso'].includes(key))) return null;
  if (!nonEmpty(entitlement.licenseId) || entitlement.productId !== PRODUCT_ID || !nonEmpty(entitlement.machineId) || !nonEmpty(entitlement.validFromIso) || !nonEmpty(entitlement.validUntilIso)) return null;
  return Object.freeze({
    schemaVersion: 'tolue-license-v1',
    entitlement: Object.freeze({
      licenseId: entitlement.licenseId,
      productId: PRODUCT_ID,
      machineId: entitlement.machineId,
      validFromIso: entitlement.validFromIso,
      validUntilIso: entitlement.validUntilIso,
    }),
    signatureBase64: value.signatureBase64,
  });
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

export function verifySignedLicenseEnvelope(value: unknown, publicKeyPem: string): Readonly<VerifiedLicenseEntitlement> | null {
  const envelope = parseEnvelope(value);
  if (!envelope || !publicKeyPem.trim()) return null;
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
