import { readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';

const source = 'build/icons/tolue-valid.ico.b64';
const target = 'build/icons/tolue.ico';

const encoded = readFileSync(source, 'utf8').replace(/\s+/g, '');
if (!encoded) throw new Error('ICON-PREP-001: approved icon payload is empty');

const bytes = Buffer.from(encoded, 'base64');
if (bytes.length < 8) throw new Error('ICON-PREP-002: decoded ICO is too small');
if (bytes[0] !== 0x00 || bytes[1] !== 0x00 || bytes[2] !== 0x01 || bytes[3] !== 0x00) {
  throw new Error('ICON-PREP-003: decoded payload is not a Windows ICO');
}
const count = bytes.readUInt16LE(4);
if (count < 1) throw new Error('ICON-PREP-004: ICO contains no images');

writeFileSync(target, bytes);
console.log(`Prepared approved Windows icon: ${target} (${bytes.length} bytes, ${count} image${count === 1 ? '' : 's'})`);
