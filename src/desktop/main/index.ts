import { app } from 'electron';
import { join } from 'node:path';
import { DESKTOP_USER_DATA_DIRECTORY, startDesktopShell } from './desktopShell';
import { startLicenseActivationShell } from './licenseActivationShell';
import { appendLicenseAudit } from './licensing/licenseAudit';
import { evaluatePackagedLicenseRuntime } from './licensing/licenseRuntime';
import { resolveDesktopRuntimePaths } from './runtimePaths';

// This entry is bundled as CommonJS; __dirname is owned by Electron Main.
const runtime = resolveDesktopRuntimePaths(__dirname);
const userDataPath = join(app.getPath('userData'), DESKTOP_USER_DATA_DIRECTORY);
const nowIso = new Date().toISOString();

let licensed = false;
try {
  const result = evaluatePackagedLicenseRuntime({
    userDataPath,
    resourcesPath: process.resourcesPath,
    nowIso,
  });
  licensed = result.gate.canStartApplication;
  try {
    appendLicenseAudit(userDataPath, {
      occurredAtIso: nowIso,
      event: 'STARTUP_EVALUATION',
      status: result.gate.evaluation.status,
      licenseId: result.gate.evaluation.licenseId,
      errorCode: result.clock.accepted ? null : `LICENSE-CLOCK-${result.clock.status}`,
    });
  } catch { /* audit must not alter startup authorization */ }
} catch {
  licensed = false;
  try {
    appendLicenseAudit(userDataPath, {
      occurredAtIso: nowIso,
      event: 'STARTUP_EVALUATION',
      status: 'INVALID',
      licenseId: null,
      errorCode: 'LICENSE-STARTUP-RUNTIME-001',
    });
  } catch { /* audit must not alter startup authorization */ }
}

if (licensed) {
  startDesktopShell(runtime.preloadBundlePath, runtime.rendererBundlePath);
} else {
  startLicenseActivationShell(runtime.preloadBundlePath, userDataPath);
}
