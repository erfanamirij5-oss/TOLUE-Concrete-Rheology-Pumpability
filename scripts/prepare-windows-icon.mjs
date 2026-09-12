import { readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';

const source = 'build/icons/tolue-brand-256.png.b64';
const target = 'build/icons/tolue.ico';

const encoded = readFileSync(source, 'utf8').replace(/\s+/g, '');
if (!encoded) throw new Error('ICON-PREP-001: approved PNG payload is empty');

const png = Buffer.from(encoded, 'base64');
const pngSignature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
if (png.length < 33 || !png.subarray(0, 8).equals(pngSignature)) throw new Error('ICON-PREP-002: approved payload is not a PNG');
if (png.toString('ascii', 12, 16) !== 'IHDR') throw new Error('ICON-PREP-003: PNG IHDR is missing');
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width !== 256 || height !== 256) throw new Error(`ICON-PREP-004: approved icon must be exactly 256x256, received ${width}x${height}`);

// ICO header + one 256x256 directory entry + PNG image payload.
const header = Buffer.alloc(6 + 16);
header.writeUInt16LE(0, 0);      // reserved
header.writeUInt16LE(1, 2);      // type = icon
header.writeUInt16LE(1, 4);      // image count
header[6] = 0;                   // 0 means 256 px width
header[7] = 0;                   // 0 means 256 px height
header[8] = 0;                   // palette size
header[9] = 0;                   // reserved
header.writeUInt16LE(1, 10);     // color planes
header.writeUInt16LE(32, 12);    // nominal bits per pixel
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(header.length, 18);

const ico = Buffer.concat([header, png]);
writeFileSync(target, ico);
console.log(`Prepared approved Windows icon: ${target} (${width}x${height}, ${ico.length} bytes)`);
