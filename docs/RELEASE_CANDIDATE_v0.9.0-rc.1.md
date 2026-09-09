# TOLUE Concrete Rheology & Pumpability — v0.9.0-rc.1

## Release candidate scope

This release candidate freezes the verified baseline for engineering core, secure Electron desktop boundaries, persistence, reporting/PDF export, Windows NSIS packaging, machine-bound commercial licensing, activation-only startup gating, privacy-preserving license audit, key rotation support, and signed trusted-time anchoring.

## RC acceptance gates

- Engineering Core CI: strict TypeScript, golden verification vectors, regression tests, renderer/main boundary tests, licensing and persistence tests.
- Windows Package CI: NSIS build, installer artifact verification, silent install, shortcut validation, activation-only acceptance for missing/expired/wrong-machine licenses, licensed launch, and restart persistence.
- Packaging must not automatically publish from CI; artifact publication is a separate explicit release action.
- No private signing key may be committed or shipped.
- No unverified scientific model, universal blockage formula, arbitrary pumpability score, or unsupported local-loss coefficient may be enabled for production.

## Known pre-release limitations

- Production code signing infrastructure is not established in this repository.
- The packaged application still uses the default Electron application icon until a final approved TOLUE icon asset is supplied.
- Trusted time is implemented as a signed cryptographic time floor; it is not live server time.
- `main` currently has no enforceable branch protection through the connected GitHub App permission scope; release changes therefore continue through dedicated PR branches and verified CI before merge.

## Candidate version

`0.9.0-rc.1`

The RC may be tagged/released only after the exact RC head passes both Engineering Core CI and Windows Package CI and the resulting main merge commit passes post-merge verification.
