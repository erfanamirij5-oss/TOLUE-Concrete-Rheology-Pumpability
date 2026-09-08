import { startDesktopShell } from './desktopShell';
import { resolveDesktopRuntimePaths } from './runtimePaths';

// This entry is bundled as CommonJS; __dirname is owned by Electron Main.
const runtime = resolveDesktopRuntimePaths(__dirname);
startDesktopShell(runtime.preloadBundlePath, runtime.rendererBundlePath);
