# Electron PDF boundary

The desktop adapter is connected to a minimal secure desktop shell.
Electron 44.2.0 and esbuild 0.28.2 are pinned development dependencies; the scientific core has no Electron imports. CI installs with --ignore-scripts and does not download or launch Electron.

Build with `npm run build:desktop`. The shell must wait for `app.whenReady()`, create a trusted local window with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, and the absolute main-owned path to `dist/desktop/preload/index.cjs`. Register `registerEngineeringPdfIpc(window, exactDocumentUrl)` once, and dispose the registration when the window closes. Main and preload are bundled separately; the sandbox preload has no runtime imports except Electron.

Renderer API: `window.tolue.exportEngineeringPdf(request)`. Only the fixed export channel is exposed. Main checks sender identity, main-frame identity and exact document URL. One export runs at a time. Invalid payloads are rejected before opening a dialog. Valid response identity includes runId, engineVersion and inputSnapshotHash; malformed requests have empty identity fields.

The report window uses an ephemeral session, no preload, disabled JavaScript, sandboxing, denied permissions/popups/navigation, an offline request filter and a restrictive CSP. HTML content is retained as presentation input; external assets and embedded scripts are unsupported. Rendering times out after 30 seconds and the window is destroyed on success or failure. A4 margins convert 14 mm to inches for Electron. This is a desktop unit conversion, not an engineering model change.

The native save dialog owns the destination. Writes are exclusive (`wx`): choosing an existing file fails without overwriting it. Empty output and dialog/render/write errors return structured responses without exposing native error text or absolute paths.

Validation: strict TypeScript, engineering golden tests, mocked Electron boundary tests and bundle build. These tests verify orchestration and security settings, not Chromium PDF typography or a native Windows save-dialog interaction. Native end-to-end export and Persian visual QA are acceptance gates for the forthcoming desktop shell.

API reference: https://www.electronjs.org/docs/latest/api/web-contents#contentsprinttopdfoptions


## Desktop shell (Phase A)

`npm run start:desktop` builds the separate CommonJS main/preload entries and starts Electron. A normal `npm ci` on the desktop host must first install the Electron runtime; CI intentionally skips that binary download. No dependencies were added for this phase.

The main entry owns the absolute preload path. Startup enables the sandbox before readiness, takes a single-instance lock, registers the `tolue` scheme, and waits for `app.whenReady()`. A dedicated session serves only `GET tolue://desktop/index.html` from a fixed in-memory document with a restrictive CSP. URLs never become filesystem paths. Network requests, downloads, permissions, popups, navigation, redirects and webviews are denied. The window registers the existing PDF IPC handler against its exact main-frame URL and disposes it on close or document load failure. Startup errors show a fixed Persian message, without native details. Windows/Linux exit when all windows close; macOS can recreate the owner window on activation.

The initial page is Persian RTL and intentionally contains no calculation controls. The existing `window.tolue.exportEngineeringPdf(request)` bridge is installed, but report selection/export controls await the engineering UI. No sample scientific results are invented. This phase does not change engineering contracts or add persistence, licensing, installer or React dependencies.

Verified: strict typecheck, 150 tests including five shell tests, and all three desktop bundles. Shell tests use Electron doubles; native Windows startup, Chromium PDF export and Persian PDF visual inspection remain acceptance gates and are not claimed by this commit.

Security references: https://www.electronjs.org/docs/latest/tutorial/security and https://www.electronjs.org/docs/latest/api/app
