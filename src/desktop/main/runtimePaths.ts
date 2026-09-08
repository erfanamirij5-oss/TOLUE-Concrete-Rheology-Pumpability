import { isAbsolute, join, normalize } from 'node:path';

export interface DesktopRuntimePaths {
  readonly mainBundleDir: string;
  readonly preloadBundlePath: string;
  readonly rendererBundlePath: string;
}

export function resolveDesktopRuntimePaths(mainBundleDir: string): Readonly<DesktopRuntimePaths> {
  if (!mainBundleDir.trim() || !isAbsolute(mainBundleDir)) throw new Error('DESKTOP-RUNTIME-PATH-001');
  const root = normalize(mainBundleDir);
  const preloadBundlePath = normalize(join(root, '../preload/index.cjs'));
  const rendererBundlePath = normalize(join(root, '../renderer/index.js'));
  if (!isAbsolute(preloadBundlePath) || !isAbsolute(rendererBundlePath)) throw new Error('DESKTOP-RUNTIME-PATH-002');
  return Object.freeze({ mainBundleDir: root, preloadBundlePath, rendererBundlePath });
}
