import { readFileSync } from 'node:fs';

const target = 'build/icons/tolue.ico';
const bytes = readFileSync(target);
if (bytes.length < 8) throw new Error('ICON-PREP-001: approved ICO is too small');
if (bytes[0] !== 0x00 || bytes[1] !== 0x00 || bytes[2] !== 0x01 || bytes[3] !== 0x00) {
  throw new Error('ICON-PREP-002: approved payload is not a Windows ICO');
}
const count = bytes.readUInt16LE(4);
if (count < 1) throw new Error('ICON-PREP-003: ICO contains no images');

console.log(`Validated approved Windows icon: ${target} (${bytes.length} bytes, ${count} image${count === 1 ? '' : 's'})`);
