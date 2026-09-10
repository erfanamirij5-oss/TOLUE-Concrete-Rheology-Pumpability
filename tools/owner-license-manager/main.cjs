'use strict';

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { createHash, randomUUID } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  PRODUCTION_KEY_ID,
  PRODUCTION_PUBLIC_PEM_SHA256,
  inspectPrivateKey,
  issueLicense,
  verifyLicenseEnvelope,
} = require('./licenseContract.cjs');

let mainWindow = null;
const selectedKeys = new Map();
const trustedUrl = () => pathToFileURL(path.join(__dirname, 'index.html')).href;

function assertTrustedSender(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame || event.senderFrame.url !== trustedUrl()) {
    throw new Error('LM-IPC-001: فرستنده IPC معتبر نیست.');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 820,
    minWidth: 920,
    minHeight: 700,
    show: false,
    title: 'TOLUE Rheology License Manager',
    backgroundColor: '#071629',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false,
      webSecurity: true,
    },
  });
  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('tolue-lm:choose-key:v1', async event => {
  assertTrustedSender(event);
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'انتخاب کلید خصوصی تولیدی طلوع',
    properties: ['openFile'],
    filters: [{ name: 'PEM private key', extensions: ['pem'] }],
  });
  if (result.canceled || result.filePaths.length !== 1) return { canceled: true };
  const keyPath = path.resolve(result.filePaths[0]);
  const inspected = inspectPrivateKey(readFileSync(keyPath, 'utf8'));
  const token = randomUUID();
  selectedKeys.clear();
  selectedKeys.set(token, keyPath);
  return {
    canceled: false,
    token,
    fileName: path.basename(keyPath),
    keyId: PRODUCTION_KEY_ID,
    fingerprint: inspected.fingerprint,
  };
});

ipcMain.handle('tolue-lm:issue:v1', async (event, request) => {
  assertTrustedSender(event);
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('LM-REQUEST-001: درخواست صدور نامعتبر است.');
  if (Object.keys(request).some(key => !['keyToken', 'licenseId', 'machineCode', 'validFromIso', 'validUntilIso'].includes(key))) throw new Error('LM-REQUEST-002: فیلد ناشناخته در درخواست وجود دارد.');
  const keyPath = selectedKeys.get(String(request.keyToken ?? ''));
  if (!keyPath) throw new Error('LM-REQUEST-003: ابتدا کلید خصوصی تولیدی را انتخاب کنید.');
  const privateKeyPem = readFileSync(keyPath, 'utf8');
  const issued = issueLicense({
    licenseId: request.licenseId,
    machineCode: request.machineCode,
    validFromIso: request.validFromIso,
    validUntilIso: request.validUntilIso,
  }, privateKeyPem);
  const safeId = issued.envelope.entitlement.licenseId.replace(/[^A-Za-z0-9._-]/gu, '_');
  const save = await dialog.showSaveDialog(mainWindow, {
    title: 'ذخیره فایل لایسنس طلوع',
    defaultPath: `${safeId}.tolue-license.json`,
    filters: [{ name: 'TOLUE License', extensions: ['json'] }],
  });
  if (save.canceled || !save.filePath) return { canceled: true };
  try {
    writeFileSync(save.filePath, `${JSON.stringify(issued.envelope, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error && error.code === 'EEXIST') throw new Error('LM-OUTPUT-001: فایل مقصد از قبل وجود دارد؛ نام دیگری انتخاب کنید.');
    throw new Error('LM-OUTPUT-002: ذخیره فایل لایسنس ناموفق بود.');
  }
  const verified = verifyLicenseEnvelope(JSON.parse(readFileSync(save.filePath, 'utf8')), inspectPrivateKey(privateKeyPem).publicKey);
  if (!verified) throw new Error('LM-OUTPUT-003: بررسی نهایی فایل ذخیره‌شده ناموفق بود.');
  const bytes = readFileSync(save.filePath);
  return {
    canceled: false,
    fileName: path.basename(save.filePath),
    licenseId: issued.envelope.entitlement.licenseId,
    validUntilIso: issued.envelope.entitlement.validUntilIso,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
});

ipcMain.handle('tolue-lm:metadata:v1', event => {
  assertTrustedSender(event);
  return { appVersion: app.getVersion(), keyId: PRODUCTION_KEY_ID, fingerprint: PRODUCTION_PUBLIC_PEM_SHA256 };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
