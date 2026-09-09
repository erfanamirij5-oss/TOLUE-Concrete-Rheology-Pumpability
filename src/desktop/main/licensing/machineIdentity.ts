import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const PRODUCT_NAMESPACE = 'tolue-concrete-rheology-pumpability';
const MACHINE_GUID_PATH = 'HKLM\\SOFTWARE\\Microsoft\\Cryptography';

export interface MachineGuidReader {
  readonly readWindowsMachineGuid: () => string;
}

export function normalizeWindowsMachineGuid(output: string): string {
  const match = output.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i);
  const guid = match?.[1]?.trim() ?? '';
  if (!guid) throw new Error('LICENSE-MACHINE-GUID-001');
  return guid;
}

export const windowsRegistryMachineGuidReader: Readonly<MachineGuidReader> = Object.freeze({
  readWindowsMachineGuid: () => {
    if (process.platform !== 'win32') throw new Error('LICENSE-MACHINE-PLATFORM-001');
    const output = execFileSync('reg.exe', ['query', MACHINE_GUID_PATH, '/v', 'MachineGuid'], {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return normalizeWindowsMachineGuid(output);
  },
});

export function deriveMachineId(reader: Readonly<MachineGuidReader> = windowsRegistryMachineGuidReader): string {
  const raw = reader.readWindowsMachineGuid().trim();
  if (!raw) throw new Error('LICENSE-MACHINE-GUID-002');
  return createHash('sha256').update(`${PRODUCT_NAMESPACE}\n${raw}`, 'utf8').digest('hex');
}
