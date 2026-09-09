import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LICENSE_IMPORT_CHANNEL, LICENSE_STATUS_CHANNEL } from '../ipc/licenseIpc';

const mock = vi.hoisted(() => ({
  handle: vi.fn(), remove: vi.fn(), open: vi.fn(), runtime: vi.fn(), provision: vi.fn(), audit: vi.fn(), activated: vi.fn(),
}));

vi.mock('electron', () => ({
  BrowserWindow: class {},
  dialog: { showOpenDialog: mock.open },
  ipcMain: { handle: mock.handle, removeHandler: mock.remove },
}));
vi.mock('./licensing/licenseRuntime', () => ({ evaluatePackagedLicenseRuntime: mock.runtime }));
vi.mock('./licensing/licenseProvisioning', () => ({ provisionSignedLicense: mock.provision }));
vi.mock('./licensing/licenseAudit', () => ({ appendLicenseAudit: mock.audit }));

import { registerLicenseIpc } from './electronLicenseAdapter';

const missingRuntime = () => ({
  machineId: 'scoped-machine-code',
  clock: { accepted: true, status: 'FORWARD_OR_EQUAL' },
  gate: { canStartApplication: false, evaluation: { status: 'MISSING', licenseId: null } },
});
const activeRuntime = () => ({
  machineId: 'scoped-machine-code',
  clock: { accepted: true, status: 'FORWARD_OR_EQUAL' },
  gate: { canStartApplication: true, evaluation: { status: 'ACTIVE', licenseId: 'license-001' } },
});

function setup() {
  const mainFrame = { url: 'tolue-activate://license/index.html' };
  const webContents = { mainFrame };
  const owner = { isDestroyed: () => false, webContents };
  registerLicenseIpc({
    owner: owner as never,
    trustedDocumentUrl: mainFrame.url,
    userDataPath: '/user-data',
    resourcesPath: '/resources',
    nowIso: () => '2026-09-09T20:00:00.000Z',
    onActivated: mock.activated,
  });
  const handlers = new Map<string, (event: unknown, request: unknown) => Promise<unknown>>(
    mock.handle.mock.calls.map(([channel, handler]) => [channel, handler]),
  );
  return { mainFrame, webContents, owner, handlers };
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.runtime.mockImplementation(missingRuntime);
  mock.open.mockResolvedValue({ canceled: true, filePaths: [] });
  mock.provision.mockReturnValue({ status: 'REJECTED', licenseId: null, validUntilIso: null, errorCode: 'LICENSE-PROVISION-SIGNATURE-001', method: 'tolue-license-provisioning-v2' });
});

describe('Electron licensing IPC adapter', () => {
  it('registers only typed license channels and disposes them exactly', () => {
    const { handlers } = setup();
    expect([...handlers.keys()].sort()).toEqual([LICENSE_IMPORT_CHANNEL, LICENSE_STATUS_CHANNEL].sort());
    const dispose = registerLicenseIpc({ owner: { isDestroyed: () => true } as never, trustedDocumentUrl: 'x', userDataPath: '/u', resourcesPath: '/r', nowIso: () => '2026-09-09T20:00:00.000Z' });
    dispose();
    expect(mock.remove).toHaveBeenCalledWith(LICENSE_IMPORT_CHANNEL);
    expect(mock.remove).toHaveBeenCalledWith(LICENSE_STATUS_CHANNEL);
  });

  it('rejects untrusted sender, non-main frame, and wrong trusted URL before privileged work', async () => {
    const { handlers, mainFrame, webContents } = setup();
    const handler = handlers.get(LICENSE_IMPORT_CHANNEL)!;
    const request = { channel: LICENSE_IMPORT_CHANNEL };
    expect((await handler({ sender: {}, senderFrame: mainFrame }, request) as { status: string }).status).toBe('REJECTED');
    expect((await handler({ sender: webContents, senderFrame: { url: mainFrame.url } }, request) as { status: string }).status).toBe('REJECTED');
    mainFrame.url = 'tolue-activate://license/other.html';
    expect((await handler({ sender: webContents, senderFrame: mainFrame }, request) as { status: string }).status).toBe('REJECTED');
    expect(mock.open).not.toHaveBeenCalled();
    expect(mock.provision).not.toHaveBeenCalled();
  });

  it('rejects renderer attempts to inject source paths, machine identity, or key material', async () => {
    const { handlers, mainFrame, webContents } = setup();
    const handler = handlers.get(LICENSE_IMPORT_CHANNEL)!;
    for (const extra of [
      { sourceLicensePath: 'C:\\evil.json' },
      { machineId: 'attacker-machine' },
      { publicKeyPath: 'C:\\attacker.pem' },
      { verified: true },
    ]) {
      const response = await handler({ sender: webContents, senderFrame: mainFrame }, { channel: LICENSE_IMPORT_CHANNEL, ...extra }) as { status: string; errorCode: string | null };
      expect(response.status).toBe('REJECTED');
      expect(response.errorCode).toBe('LICENSE-IMPORT-IPC-REQUEST-002');
    }
    expect(mock.open).not.toHaveBeenCalled();
  });

  it('returns cancellation without provisioning and records a minimal audit event', async () => {
    const { handlers, mainFrame, webContents } = setup();
    const response = await handlers.get(LICENSE_IMPORT_CHANNEL)!({ sender: webContents, senderFrame: mainFrame }, { channel: LICENSE_IMPORT_CHANNEL }) as { status: string };
    expect(response.status).toBe('CANCELLED');
    expect(mock.provision).not.toHaveBeenCalled();
    expect(mock.audit).toHaveBeenCalledWith('/user-data', expect.objectContaining({ event: 'IMPORT_CANCELLED', status: 'MISSING', licenseId: null, errorCode: null }));
  });

  it('requires a fresh Main-side ACTIVE runtime evaluation after successful provisioning before activation', async () => {
    const { handlers, mainFrame, webContents } = setup();
    mock.open.mockResolvedValue({ canceled: false, filePaths: ['C:\\selected-by-main.json'] });
    mock.provision.mockReturnValue({ status: 'IMPORTED', licenseId: 'license-001', validUntilIso: '2027-01-01T00:00:00.000Z', errorCode: null, method: 'tolue-license-provisioning-v2' });
    mock.runtime.mockImplementationOnce(missingRuntime).mockImplementationOnce(missingRuntime);
    const rejected = await handlers.get(LICENSE_IMPORT_CHANNEL)!({ sender: webContents, senderFrame: mainFrame }, { channel: LICENSE_IMPORT_CHANNEL }) as { status: string; errorCode: string | null };
    expect(rejected).toMatchObject({ status: 'REJECTED', errorCode: 'LICENSE-IMPORT-POSTVERIFY-001' });
    expect(mock.activated).not.toHaveBeenCalled();

    mock.runtime.mockReset().mockImplementationOnce(missingRuntime).mockImplementationOnce(activeRuntime);
    const accepted = await handlers.get(LICENSE_IMPORT_CHANNEL)!({ sender: webContents, senderFrame: mainFrame }, { channel: LICENSE_IMPORT_CHANNEL }) as { status: string; licenseStatus: string };
    expect(accepted).toMatchObject({ status: 'IMPORTED', licenseStatus: 'ACTIVE' });
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(mock.activated).toHaveBeenCalledOnce();
    expect(mock.provision).toHaveBeenLastCalledWith(expect.objectContaining({
      userDataPath: '/user-data', resourcesPath: undefined, machineId: 'scoped-machine-code', sourceLicensePath: 'C:\\selected-by-main.json',
    }));
  });

  it('status response exposes scoped machine code from Main runtime and fails closed on runtime exception', async () => {
    const { handlers, mainFrame, webContents } = setup();
    mock.runtime.mockImplementationOnce(activeRuntime);
    const active = await handlers.get(LICENSE_STATUS_CHANNEL)!({ sender: webContents, senderFrame: mainFrame }, { channel: LICENSE_STATUS_CHANNEL }) as { status: string; machineCode: string; canUseApplication: boolean };
    expect(active).toMatchObject({ status: 'ACTIVE', machineCode: 'scoped-machine-code', canUseApplication: true });
    mock.runtime.mockImplementationOnce(() => { throw new Error('secret'); });
    const invalid = await handlers.get(LICENSE_STATUS_CHANNEL)!({ sender: webContents, senderFrame: mainFrame }, { channel: LICENSE_STATUS_CHANNEL }) as { status: string; machineCode: string; canUseApplication: boolean; errorCode: string };
    expect(invalid).toMatchObject({ status: 'INVALID', machineCode: '', canUseApplication: false, errorCode: 'LICENSE-STATUS-RUNTIME-001' });
    expect(JSON.stringify(invalid)).not.toContain('secret');
  });
});
