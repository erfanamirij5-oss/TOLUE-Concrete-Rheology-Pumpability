import { describe, expect, it } from 'vitest';
import { LICENSE_IMPORT_CHANNEL, LICENSE_STATUS_CHANNEL, validateLicenseImportIpcRequest, validateLicenseStatusIpcRequest } from './licenseIpc';

describe('license IPC contracts', () => {
  it('accepts only the exact status request shape', () => {
    expect(() => validateLicenseStatusIpcRequest({ channel: LICENSE_STATUS_CHANNEL })).not.toThrow();
    expect(() => validateLicenseStatusIpcRequest({ channel: LICENSE_STATUS_CHANNEL, machineId: 'renderer-controlled' })).toThrow('LICENSE-STATUS-IPC-REQUEST-002');
  });

  it('accepts only the exact import request shape and no renderer path/key/machine override', () => {
    expect(() => validateLicenseImportIpcRequest({ channel: LICENSE_IMPORT_CHANNEL })).not.toThrow();
    expect(() => validateLicenseImportIpcRequest({ channel: LICENSE_IMPORT_CHANNEL, sourceLicensePath: 'C:/x.json' })).toThrow('LICENSE-IMPORT-IPC-REQUEST-002');
    expect(() => validateLicenseImportIpcRequest({ channel: LICENSE_IMPORT_CHANNEL, publicKeyPem: 'fake' })).toThrow('LICENSE-IMPORT-IPC-REQUEST-002');
    expect(() => validateLicenseImportIpcRequest({ channel: LICENSE_IMPORT_CHANNEL, machineId: 'fake' })).toThrow('LICENSE-IMPORT-IPC-REQUEST-002');
  });
});
