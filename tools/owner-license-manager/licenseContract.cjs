'use strict';

const { createHash, createPrivateKey, createPublicKey, sign, verify } = require('node:crypto');

const PRODUCT_ID = 'tolue-concrete-rheology-pumpability';
const SCHEMA_VERSION = 'tolue-license-v1';
const PRODUCTION_KEY_ID = 'tolue-prod-2026-01';
const PRODUCTION_PUBLIC_PEM_SHA256 = '1e1c312326dfdb91aa2f1f54b1035ce2ccf30c5109972e831d8210a8a8723a64';

function normalizePem(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('LM-KEY-001: فایل کلید خصوصی خالی است.');
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() + '\n';
}

function canonicalLicensePayload(entitlement) {
  return JSON.stringify({
    licenseId: entitlement.licenseId,
    productId: entitlement.productId,
    machineId: entitlement.machineId,
    validFromIso: entitlement.validFromIso,
    validUntilIso: entitlement.validUntilIso,
  });
}

function inspectPrivateKey(privateKeyPem, expectedFingerprint = PRODUCTION_PUBLIC_PEM_SHA256) {
  let privateKey;
  try {
    privateKey = createPrivateKey(normalizePem(privateKeyPem));
  } catch {
    throw new Error('LM-KEY-002: فایل انتخاب‌شده یک کلید خصوصی معتبر نیست.');
  }
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('LM-KEY-003: کلید خصوصی باید Ed25519 باشد.');
  const publicKey = createPublicKey(privateKey);
  const publicKeyPem = normalizePem(publicKey.export({ type: 'spki', format: 'pem' }).toString());
  const fingerprint = createHash('sha256').update(publicKeyPem, 'utf8').digest('hex');
  if (fingerprint !== expectedFingerprint.toLowerCase()) {
    throw new Error(`LM-KEY-004: این کلید متعلق به کلید تولیدی تأییدشده نیست. fingerprint=${fingerprint}`);
  }
  return Object.freeze({ privateKey, publicKey, fingerprint });
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('LM-INPUT-001: ورودی نامعتبر است.');
  const allowed = ['licenseId', 'machineCode', 'validFromIso', 'validUntilIso'];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new Error('LM-INPUT-002: فیلد ناشناخته در درخواست وجود دارد.');
  const licenseId = String(input.licenseId ?? '').trim();
  const machineId = String(input.machineCode ?? '').trim().toLowerCase();
  const validFromIso = String(input.validFromIso ?? '').trim();
  const validUntilIso = String(input.validUntilIso ?? '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/u.test(licenseId)) throw new Error('LM-LICENSE-001: شناسه لایسنس باید ۳ تا ۸۰ کاراکتر مجاز باشد.');
  if (!/^[a-f0-9]{64}$/u.test(machineId)) throw new Error('LM-MACHINE-001: کد سیستم باید دقیقاً ۶۴ کاراکتر hexadecimal باشد.');
  if (!Number.isFinite(Date.parse(validFromIso))) throw new Error('LM-TIME-001: تاریخ شروع معتبر نیست.');
  if (!Number.isFinite(Date.parse(validUntilIso))) throw new Error('LM-TIME-002: تاریخ پایان معتبر نیست.');
  if (Date.parse(validUntilIso) <= Date.parse(validFromIso)) throw new Error('LM-TIME-003: تاریخ پایان باید بعد از تاریخ شروع باشد.');
  return Object.freeze({ licenseId, machineId, validFromIso, validUntilIso });
}

function issueLicense(input, privateKeyPem, expectedFingerprint = PRODUCTION_PUBLIC_PEM_SHA256) {
  const normalized = normalizeInput(input);
  const key = inspectPrivateKey(privateKeyPem, expectedFingerprint);
  const entitlement = Object.freeze({
    licenseId: normalized.licenseId,
    productId: PRODUCT_ID,
    machineId: normalized.machineId,
    validFromIso: normalized.validFromIso,
    validUntilIso: normalized.validUntilIso,
  });
  const payload = Buffer.from(canonicalLicensePayload(entitlement), 'utf8');
  const signature = sign(null, payload, key.privateKey);
  if (signature.byteLength !== 64 || !verify(null, payload, key.publicKey, signature)) throw new Error('LM-SIGN-001: بررسی امضای تولیدشده ناموفق بود.');
  const envelope = Object.freeze({ schemaVersion: SCHEMA_VERSION, entitlement, signatureBase64: signature.toString('base64') });
  return Object.freeze({ envelope, fingerprint: key.fingerprint, keyId: PRODUCTION_KEY_ID });
}

function verifyLicenseEnvelope(envelope, publicKey) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return false;
  if (Object.keys(envelope).some(key => !['schemaVersion', 'entitlement', 'signatureBase64'].includes(key))) return false;
  if (envelope.schemaVersion !== SCHEMA_VERSION || !envelope.entitlement || typeof envelope.signatureBase64 !== 'string') return false;
  const signature = Buffer.from(envelope.signatureBase64, 'base64');
  if (signature.byteLength !== 64) return false;
  return verify(null, Buffer.from(canonicalLicensePayload(envelope.entitlement), 'utf8'), publicKey, signature);
}

module.exports = {
  PRODUCT_ID,
  PRODUCTION_KEY_ID,
  PRODUCTION_PUBLIC_PEM_SHA256,
  SCHEMA_VERSION,
  canonicalLicensePayload,
  inspectPrivateKey,
  issueLicense,
  verifyLicenseEnvelope,
};
