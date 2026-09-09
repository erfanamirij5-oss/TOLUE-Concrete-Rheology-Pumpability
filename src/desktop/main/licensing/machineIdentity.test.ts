import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { deriveMachineId, normalizeWindowsMachineGuid } from './machineIdentity';

describe('machine identity', () => {
  it('parses MachineGuid from reg.exe output', () => {
    const output = '\r\nHKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography\r\n    MachineGuid    REG_SZ    ABCD-1234-EFGH\r\n';
    expect(normalizeWindowsMachineGuid(output)).toBe('ABCD-1234-EFGH');
  });

  it('derives a deterministic product-scoped SHA-256 machine id', () => {
    const machineId = deriveMachineId({ readWindowsMachineGuid: () => 'ABCD-1234-EFGH' });
    const expected = createHash('sha256').update('tolue-concrete-rheology-pumpability\nABCD-1234-EFGH', 'utf8').digest('hex');
    expect(machineId).toBe(expected);
    expect(machineId).toHaveLength(64);
  });

  it('fails closed when registry output or reader is empty', () => {
    expect(() => normalizeWindowsMachineGuid('no-machine-guid')).toThrow('LICENSE-MACHINE-GUID-001');
    expect(() => deriveMachineId({ readWindowsMachineGuid: () => '   ' })).toThrow('LICENSE-MACHINE-GUID-002');
  });
});
