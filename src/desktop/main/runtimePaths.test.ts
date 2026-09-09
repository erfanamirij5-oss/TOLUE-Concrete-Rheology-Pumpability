import { describe, expect, it } from 'vitest';
import { isAbsolute } from 'node:path';
import { resolveDesktopRuntimePaths } from './runtimePaths';

describe('desktop runtime paths', () => {
  it('resolves preload and renderer relative to the main bundle directory, never cwd', () => {
    const main = process.platform === 'win32' ? 'C:\\Program Files\\TOLUE\\resources\\app\\dist\\desktop\\main' : '/opt/tolue/resources/app/dist/desktop/main';
    const runtime = resolveDesktopRuntimePaths(main);
    expect(runtime.mainBundleDir).toBe(main);
    expect(isAbsolute(runtime.preloadBundlePath)).toBe(true);
    expect(isAbsolute(runtime.rendererBundlePath)).toBe(true);
    expect(runtime.preloadBundlePath.replaceAll('\\','/')).toContain('/dist/desktop/preload/index.cjs');
    expect(runtime.rendererBundlePath.replaceAll('\\','/')).toContain('/dist/desktop/renderer/index.js');
    expect(Object.isFrozen(runtime)).toBe(true);
  });

  it.each(['', 'relative/path'])('rejects non-absolute runtime root: %s', value => {
    expect(() => resolveDesktopRuntimePaths(value)).toThrow('DESKTOP-RUNTIME-PATH-001');
  });
});
