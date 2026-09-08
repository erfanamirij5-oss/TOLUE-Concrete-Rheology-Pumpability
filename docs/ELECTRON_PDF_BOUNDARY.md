# Electron PDF boundary

The desktop adapter is deliberately a thin library until the app shell is introduced.
Electron 44.2.0 and esbuild 0.28.2 are pinned development dependencies; the scientific core has no Electron imports. CI installs with --ignore-scripts and does not download or launch Electron.

Build with `npm run build:desktop`. The shell must wait for `app.whenReady()`, create a trusted local window with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, and the absolute main-owned path to `dist/desktop/preload/index.cjs`. Register `registerEngineeringPdfIpc(window, exactDocumentUrl)` once, and dispose the registration when the window closes. Main and preload are bundled separately; the sandbox preload has no runtime imports except Electron.

Renderer API: `window.tolue.exportEngineeringPdf(request)`. Only the fixed export channel is exposed. Main checks sender identity, main-frame identity and exact document URL. One export runs at a time. Invalid payloads are rejected before opening a dialog. Valid response identity includes runId, engineVersion and inputSnapshotHash; malformed requests have empty identity fields.

The report window uses an ephemeral session, no preload, disabled JavaScript, sandboxing, denied permissions/popups/navigation, an offline request filter and a restrictive CSP. HTML content is retained as presentation input; external assets and embedded scripts are unsupported. Rendering times out after 30 seconds and the window is destroyed on success or failure. A4 margins convert 14 mm to inches for Electron. This is a desktop unit conversion, not an engineering model change.

The native save dialog owns the destination. Writes are exclusive (`wx`): choosing an existing file fails without overwriting it. Empty output and dialog/render/write errors return structured responses without exposing native error text or absolute paths.

Validation: strict TypeScript, engineering golden tests, mocked Electron boundary tests and bundle build. These tests verify orchestration and security settings, not Chromium PDF typography or a native Windows save-dialog interaction. Native end-to-end export and Persian visual QA are acceptance gates for the forthcoming desktop shell.

API reference: https://www.electronjs.org/docs/latest/api/web-contents#contentsprinttopdfoptions
