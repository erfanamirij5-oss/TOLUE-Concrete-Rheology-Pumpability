# TOLUE Concrete Rheology & Pumpability — Stable Release Hardening v1.0.0

## Purpose

This document defines the fail-closed gates required before promoting the verified v0.9.0-rc.1 baseline to a stable v1.0.0 Windows release.

## Golden baseline

- RC release: `v0.9.0-rc.1`
- Stable-hardening branch starts from main commit `f0d9b8994c1299d2228f7ea9743a3111f457a24e`.
- No scientific/engineering behavior may change as part of release hardening unless separately reviewed, evidenced, versioned, and regression-tested.

## Stable release gates

### S1 — Production licensing trust root

- The RC-scoped key `tolue-rc-2026-01` MUST NOT be the active stable-production trust root.
- A separately generated production Ed25519 keypair is required.
- The private production signing key MUST remain outside the repository, application bundle, logs, CI artifacts, and release assets.
- Only the production public key and validated public keyring may be packaged.
- Key ID, status, keyring method, active-key uniqueness, and Ed25519 parsing must be validated before packaging.
- Stable licensing material must preserve backward-verification policy explicitly; no implicit trust migration.

### S2 — Windows Authenticode code signing

- Stable Windows binaries and NSIS installer MUST be Authenticode-signed by an approved production publisher identity.
- Signing credentials/private keys MUST NOT be committed to the repository.
- CI must fail closed when stable signing credentials/configuration are absent.
- Post-build verification must confirm a valid signature and expected publisher identity before publication.
- Timestamping must be configured through the selected signing provider so signatures remain verifiable after certificate expiry where supported.

Supported implementation paths are intentionally limited to a reviewed production mechanism such as a CI-accessible certificate/HSM or a managed cloud signing service. Selection and credential provisioning are external release prerequisites, not values to invent in source control.

### S3 — Approved TOLUE application icon

- The default Electron icon MUST NOT ship in v1.0.0.
- A final owner-approved `.ico` asset is required.
- The asset must be wired into Windows executable/installer resources and visually verified before stable publication.
- No generated substitute may be treated as owner-approved branding.

### S4 — Release workflow separation

- The one-shot `.github/workflows/release-rc-v0.9.0-rc.1.yml` workflow is RC-specific and must not be reused as the stable publication workflow.
- Stable publication must use an explicit v1.0.0 workflow with immutable-target checks, exact-version checks, exact CI-head checks, signed production licensing material, Authenticode verification, checksum generation, and release-asset verification.
- Stable publication must not silently fall back to unsigned binaries or RC licensing material.

### S5 — Regression gates

Before stable publication, the exact candidate head must pass:

1. strict TypeScript/typecheck;
2. full engineering/regression/golden-vector test suite;
3. licensing and persistence tests;
4. secure Electron boundary tests;
5. Windows NSIS package build;
6. silent install / shortcut / activation-shell acceptance;
7. licensed-start and restart-persistence acceptance using production-compatible test fixtures without exposing a production private key;
8. Authenticode verification;
9. exact installer filename/version verification;
10. SHA-256 checksum generation and verification.

## Current blockers after RC publication

The v0.9.0-rc.1 engineering candidate is published and verified. Stable v1.0.0 remains blocked until all of the following are supplied/resolved:

- production licensing trust root and secure private-key custody;
- production Windows code-signing identity/credentials or managed signing service;
- final owner-approved TOLUE `.ico` asset;
- stable publication workflow and final stable acceptance run.

## Non-goals

Stable-release hardening must not introduce new rheology, pumpability, blockage, local-loss, CFD, empirical threshold, or scoring models. It must not change renderer/main privilege boundaries or weaken licensing gates to make release automation pass.

## Release decision

`v1.0.0` may be tagged and published only when every stable gate above is demonstrably satisfied on the exact immutable release commit. Until then, `v0.9.0-rc.1` remains the latest distributable candidate.
