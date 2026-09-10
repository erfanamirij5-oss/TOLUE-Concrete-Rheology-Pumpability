'use strict';

const elements = Object.freeze({
  chooseKey: document.getElementById('chooseKey'),
  fingerprint: document.getElementById('fingerprint'),
  issueLicense: document.getElementById('issueLicense'),
  keyId: document.getElementById('keyId'),
  keyName: document.getElementById('keyName'),
  licenseId: document.getElementById('licenseId'),
  machineCode: document.getElementById('machineCode'),
  result: document.getElementById('result'),
  validFrom: document.getElementById('validFrom'),
  validUntil: document.getElementById('validUntil'),
  version: document.getElementById('version'),
});

let keyToken = '';
const localDateTime = date => {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
};
const toIso = value => value ? new Date(value).toISOString() : '';

function setResult(kind, title, detail) {
  elements.result.className = `result ${kind}`;
  elements.result.querySelector('strong').textContent = title;
  elements.result.querySelector('span').textContent = detail;
}

function validate() {
  const ready = Boolean(keyToken && /^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(elements.licenseId.value.trim()) && /^[a-fA-F0-9]{64}$/.test(elements.machineCode.value.trim()) && elements.validFrom.value && elements.validUntil.value && Date.parse(elements.validUntil.value) > Date.parse(elements.validFrom.value));
  elements.issueLicense.disabled = !ready;
  return ready;
}

const now = new Date();
elements.validFrom.value = localDateTime(now);
elements.validUntil.value = localDateTime(new Date(now.getTime() + 365 * 86400000));

for (const input of [elements.licenseId, elements.machineCode, elements.validFrom, elements.validUntil]) input.addEventListener('input', validate);
for (const chip of document.querySelectorAll('[data-days]')) chip.addEventListener('click', () => {
  const from = elements.validFrom.value ? new Date(elements.validFrom.value) : new Date();
  elements.validUntil.value = localDateTime(new Date(from.getTime() + Number(chip.dataset.days) * 86400000));
  validate();
});

elements.chooseKey.addEventListener('click', async () => {
  setResult('', 'در حال بررسی کلید…', 'Fingerprint کلید با Trust Root تولیدی مقایسه می‌شود.');
  try {
    const result = await window.tolueLicenseManager.choosePrivateKey();
    if (result.canceled) return setResult('', 'انتخاب لغو شد', 'کلیدی در حافظه برنامه نگهداری نشد.');
    keyToken = result.token;
    elements.keyName.textContent = result.fileName;
    elements.fingerprint.textContent = result.fingerprint;
    setResult('success', 'کلید تولیدی تأیید شد', `${result.keyId} • ${result.fingerprint}`);
    validate();
  } catch (error) {
    keyToken = '';
    elements.keyName.textContent = 'کلید معتبر انتخاب نشده است';
    elements.fingerprint.textContent = 'Fingerprint نامعتبر';
    setResult('error', 'کلید رد شد', error?.message || String(error));
    validate();
  }
});

elements.issueLicense.addEventListener('click', async () => {
  if (!validate()) return;
  elements.issueLicense.disabled = true;
  setResult('', 'در حال امضا و بررسی…', 'فایل پس از امضا دوباره با Public Key بررسی خواهد شد.');
  try {
    const result = await window.tolueLicenseManager.issueLicense({
      keyToken,
      licenseId: elements.licenseId.value.trim(),
      machineCode: elements.machineCode.value.trim(),
      validFromIso: toIso(elements.validFrom.value),
      validUntilIso: toIso(elements.validUntil.value),
    });
    if (result.canceled) setResult('', 'ذخیره لغو شد', 'هیچ فایل لایسنسی ایجاد نشد.');
    else setResult('success', 'لایسنس با موفقیت ساخته شد', `${result.fileName} • SHA-256: ${result.sha256}`);
  } catch (error) {
    setResult('error', 'صدور لایسنس ناموفق بود', error?.message || String(error));
  } finally {
    validate();
  }
});

window.tolueLicenseManager.metadata().then(meta => {
  elements.version.textContent = `نسخه ${meta.appVersion}`;
  elements.keyId.textContent = meta.keyId;
  elements.fingerprint.title = meta.fingerprint;
}).catch(() => setResult('error', 'خطای راه‌اندازی', 'دریافت مشخصات امنیتی برنامه ناموفق بود.'));
