import { app } from 'electron';
import { join } from 'node:path';
import { DESKTOP_USER_DATA_DIRECTORY, startDesktopShell } from './desktopShell';
import { startLicenseActivationShell } from './licenseActivationShell';
import { evaluatePackagedLicenseRuntime } from './licensing/licenseRuntime';
import { resolveDesktopRuntimePaths } from './runtimePaths';

// This entry is bundled as CommonJS; __dirname is owned by Electron Main.
const runtime = resolveDesktopRuntimePaths(__dirname);
const userDataPath = join(app.getPath('userData'), DESKTOP_USER_DATA_DIRECTORY);

let licensed = false;
try {
  const result = evaluatePackagedLicenseRuntime({
    userDataPath,
    resourcesPath: process.resourcesPath,
    nowIso: new Date().toISOString(),
  });
  licensed = result.gate.canStartApplication;
} catch {
  licensed = false;
}

if (licensed) {
  startDesktopShell(runtime.preloadBundlePath, runtime.rendererBundlePath);
} else {
  startLicenseActivationShell(runtime.preloadBundlePath, userDataPath);
}
