import { join } from 'node:path';
import { startDesktopShell } from './desktopShell';

// This entry is bundled as CommonJS; __dirname is owned by Electron Main.
startDesktopShell(
  join(__dirname, '../preload/index.cjs'),
  join(__dirname, '../renderer/index.js'),
);
