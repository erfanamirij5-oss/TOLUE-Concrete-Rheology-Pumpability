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

### S2 — Windows Authenticode policy for v1.0.0

- Authenticode code signing is **not a blocking gate for v1.0.0**.
- The v1.0.0 Windows installer and executable may be published unsigned, matching the established TOLUE Desktop release path.
- No signing certificate, publisher identity, password, private key, or managed signing service is required to publish v1.0.0.
- The release workflow MUST NOT fabricate, self-sign, or claim an Authenticode identity that is not backed by an approved production certificate.
- Authenticode may be introduced in a later separately reviewed release without changing scientific/engineering behavior.

### S3 — Approved TOLUE application icon

- The default Electron icon MUST NOT ship in v1.0.0.
- A final owner-approved `.ico` asset is required.
- The asset must be wired into Windows executable/installer resources and visually verified before stable publication.
- No generated substitute may be treated as owner-approved branding.

### S4 — Release workflow separation

- The one-shot `.github/workflows/release-rc-v0.9.0-rc.1.yml` workflow is RC-specific and must not be reused as the stable publication workflow.
- Stable publication must use an explicit v1.0.0 workflow with immutable-target checks, exact-version checks, exact CI-head checks, signed production licensing material, approved icon verification, checksum generation, and release-asset verification.
- Stable publication must not silently fall back to RC licensing material.

### S5 — Regression gates

Before stable publication, the exact candidate head must pass:

1. strict TypeScript/typecheck;
2. full engineering/regression/golden-vector test suite;
3. licensing and persistence tests;
4. secure Electron boundary tests;
5. Windows NSIS package build;
6. silent install / shortcut / activation-shell acceptance;
7. licensed-start and restart-persistence acceptance using production-compatible test fixtures without exposing a production private key;
8. exact installer filename/version verification;
9. SHA-256 checksum generation and verification.

## Current blockers after RC publication

The v0.9.0-rc.1 engineering candidate is published and verified. Stable v1.0.0 remains blocked only until the following are demonstrably complete on the exact final release SHA:

- production public licensing trust material is provisioned and validated;
- final owner-approved TOLUE `.ico` is packaged;
- stable publication workflow gates pass;
- licensed-start and restart-persistence acceptance passes for the exact final SHA.

Windows Authenticode is intentionally deferred and is not a v1.0.0 publication blocker.

## Non-goals

Stable-release hardening must not introduce new rheology, pumpability, blockage, local-loss, CFD, empirical threshold, or scoring models. It must not change renderer/main privilege boundaries or weaken licensing gates to make release automation pass.

## Release decision

`v1.0.0` may be tagged and published only when every applicable stable gate above is demonstrably satisfied on the exact immutable release commit. Until then, `v0.9.0-rc.1` remains the latest distributable candidate.
