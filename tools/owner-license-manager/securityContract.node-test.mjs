import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const main = readFileSync(new URL('./main.cjs', import.meta.url), 'utf8');
const preload = readFileSync(new URL('./preload.cjs', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const contract = readFileSync(new URL('./licenseContract.cjs', import.meta.url), 'utf8');

test('keeps privileged key access in main and exposes only narrow IPC', () => {
  assert.match(main, /readFileSync\(keyPath/);
  assert.doesNotMatch(preload, /readFileSync|node:fs|privateKeyPem/);
  assert.match(main, /contextIsolation: true/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /setWindowOpenHandler/);
  assert.match(main, /will-navigate/);
  assert.match(html, /Content-Security-Policy/);
});

test('contains no embedded PEM key material and never overwrites license output', () => {
  const all = `${main}\n${preload}\n${contract}\n${html}`;
  assert.doesNotMatch(all, /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/);
  assert.doesNotMatch(all, /-----BEGIN PUBLIC KEY-----/);
  assert.match(main, /flag: 'wx'/);
});
