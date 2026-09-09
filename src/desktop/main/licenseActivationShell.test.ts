import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  setPath: vi.fn(), enableSandbox: vi.fn(), requestLock: vi.fn(), quit: vi.fn(), relaunch: vi.fn(), exit: vi.fn(), onApp: vi.fn(), whenReady: vi.fn(),
  registerScheme: vi.fn(), error: vi.fn(), fromPartition: vi.fn(), permissionRequest: vi.fn(), permissionCheck: vi.fn(), beforeRequest: vi.fn(), sessionOn: vi.fn(), protocolHandle: vi.fn(),
  windowOptions: vi.fn(), loadURL: vi.fn(), show: vi.fn(), isDestroyed: vi.fn(), setWindowOpenHandler: vi.fn(), webOn: vi.fn(), once: vi.fn(), isMinimized: vi.fn(), restore: vi.fn(), focus: vi.fn(),
  registerLicense: vi.fn(), disposeLicense: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    setPath: mock.setPath,
    enableSandbox: mock.enableSandbox,
    requestSingleInstanceLock: mock.requestLock,
    quit: mock.quit,
    relaunch: mock.relaunch,
    exit: mock.exit,
    on: mock.onApp,
    whenReady: mock.whenReady,
  },
  protocol: { registerSchemesAsPrivileged: mock.registerScheme },
  dialog: { showErrorBox: mock.error },
  session: { fromPartition: mock.fromPartition },
  BrowserWindow: class {
    constructor(options: unknown) { mock.windowOptions(options); }
    webContents = { setWindowOpenHandler: mock.setWindowOpenHandler, on: mock.webOn };
    once = mock.once;
    loadURL = mock.loadURL;
    show = mock.show;
    isDestroyed = mock.isDestroyed;
    isMinimized = mock.isMinimized;
    restore = mock.restore;
    focus = mock.focus;
  },
}));
vi.mock('./electronLicenseAdapter', () => ({ registerLicenseIpc: mock.registerLicense }));

import { startLicenseActivationShell } from './licenseActivationShell';

beforeEach(() => {
  vi.clearAllMocks();
  mock.requestLock.mockReturnValue(true);
  mock.whenReady.mockResolvedValue(undefined);
  mock.isDestroyed.mockReturnValue(false);
  mock.isMinimized.mockReturnValue(false);
  mock.registerLicense.mockReturnValue(mock.disposeLicense);
  mock.fromPartition.mockReturnValue({
    setPermissionRequestHandler: mock.permissionRequest,
    setPermissionCheckHandler: mock.permissionCheck,
    webRequest: { onBeforeRequest: mock.beforeRequest },
    on: mock.sessionOn,
    protocol: { handle: mock.protocolHandle },
  });
});

describe('license activation shell', () => {
  it('rejects relative privileged paths before Electron startup', () => {
    expect(() => startLicenseActivationShell('relative-preload.js', '/absolute-user-data')).toThrow('LICENSE-ACTIVATION-PRELOAD-001');
    expect(() => startLicenseActivationShell('/absolute-preload.js', 'relative-user-data')).toThrow('LICENSE-ACTIVATION-USERDATA-001');
    expect(mock.enableSandbox).not.toHaveBeenCalled();
  });

  it('creates only a hardened activation window and registers only licensing IPC', async () => {
    startLicenseActivationShell('/absolute/preload.js', '/absolute/user-data');
    await Promise.resolve(); await Promise.resolve();
    expect(mock.setPath).toHaveBeenCalledWith('userData', '/absolute/user-data');
    expect(mock.enableSandbox).toHaveBeenCalledOnce();
    expect(mock.registerScheme).toHaveBeenCalledWith([{ scheme: 'tolue-activate', privileges: { standard: true, secure: true } }]);
    expect(mock.windowOptions).toHaveBeenCalledWith(expect.objectContaining({
      show: false,
      autoHideMenuBar: true,
      webPreferences: expect.objectContaining({
        preload: '/absolute/preload.js', sandbox: true, contextIsolation: true, nodeIntegration: false,
        nodeIntegrationInWorker: false, webSecurity: true, webviewTag: false, devTools: false,
      }),
    }));
    expect(mock.registerLicense).toHaveBeenCalledTimes(1);
    expect(mock.registerLicense).toHaveBeenCalledWith(expect.objectContaining({
      trustedDocumentUrl: 'tolue-activate://license/index.html',
      userDataPath: '/absolute/user-data',
      onActivated: expect.any(Function),
    }));
  });

  it('denies permissions, downloads, popups, navigation, redirects, webviews and all non-allowlisted requests', async () => {
    startLicenseActivationShell('/absolute/preload.js', '/absolute/user-data');
    await Promise.resolve(); await Promise.resolve();
    const popupHandler = mock.setWindowOpenHandler.mock.calls[0]![0] as () => unknown;
    expect(popupHandler()).toEqual({ action: 'deny' });
    for (const eventName of ['will-navigate', 'will-redirect', 'will-attach-webview']) {
      const call = mock.webOn.mock.calls.find(([name]) => name === eventName);
      expect(call).toBeTruthy();
      const preventDefault = vi.fn();
      call![1]({ preventDefault });
      expect(preventDefault).toHaveBeenCalledOnce();
    }
    const permissionCallback = vi.fn();
    mock.permissionRequest.mock.calls[0]![0]({}, 'camera', permissionCallback);
    expect(permissionCallback).toHaveBeenCalledWith(false);
    expect(mock.permissionCheck.mock.calls[0]![0]()).toBe(false);
    const requestCallback = vi.fn();
    mock.beforeRequest.mock.calls[0]![0]({ url: 'https://evil.example' }, requestCallback);
    expect(requestCallback).toHaveBeenCalledWith({ cancel: true });
    const allowedCallback = vi.fn();
    mock.beforeRequest.mock.calls[0]![0]({ url: 'tolue-activate://license/renderer.js' }, allowedCallback);
    expect(allowedCallback).toHaveBeenCalledWith({ cancel: false });
    const download = mock.sessionOn.mock.calls.find(([name]) => name === 'will-download');
    const preventDownload = vi.fn();
    download![1]({ preventDefault: preventDownload });
    expect(preventDownload).toHaveBeenCalledOnce();
  });

  it('relaunches only through Main-owned activation callback', async () => {
    startLicenseActivationShell('/absolute/preload.js', '/absolute/user-data');
    await Promise.resolve(); await Promise.resolve();
    const options = mock.registerLicense.mock.calls[0]![0] as { onActivated: () => void };
    expect(mock.relaunch).not.toHaveBeenCalled();
    expect(mock.exit).not.toHaveBeenCalled();
    options.onActivated();
    expect(mock.relaunch).toHaveBeenCalledOnce();
    expect(mock.exit).toHaveBeenCalledWith(0);
  });
});
