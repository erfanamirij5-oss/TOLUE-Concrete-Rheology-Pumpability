# TOLUE Concrete Rheology & Pumpability v1.0.0 — Stable Candidate

## Candidate intent

This branch advances product metadata from `0.9.0-rc.1` to the stable target `1.0.0` without weakening any stable publication gate. It is a candidate-preparation change, not a stable publication.

## Invariants

- Engineering/scientific behavior is unchanged.
- No formula, coefficient, threshold, rheology model, hydraulic model, pumpability rule, blockage rule, or engineering decision logic is changed.
- Stable publication remains manual-only and fail-closed.
- The RC licensing key `tolue-rc-2026-01` is not accepted as the stable production trust root.
- No production private licensing key is committed.
- No Authenticode certificate/private key/password is committed.
- No generated or substitute icon is treated as owner-approved.

## Candidate metadata

- Product: `TOLUE Concrete Rheology & Pumpability`
- Stable target: `v1.0.0`
- package.json target version: `1.0.0`
- Expected installer: `TOLUE-Concrete-Rheology-Pumpability-1.0.0-Setup.exe`

## Remaining fail-closed blockers

Stable publication MUST remain blocked until all of the following are true on the exact publication commit:

1. `package-lock.json` root metadata is synchronized to `1.0.0`.
2. Separate production Ed25519 public trust material exists under `release/stable/v1.0.0/` and passes `scripts/validate-stable-license-trust.mjs`.
3. The owner-approved final TOLUE `.ico` is present and explicitly configured for Windows packaging.
4. Authenticode signing credentials are available to CI and the signed installer/executable validate against the exact expected publisher with timestamp evidence.
5. Exact-commit licensed restart/persistence verification evidence is available using production-compatible fixtures.
6. Engineering Core CI, Windows Package CI, and Stable v1.0.0 Readiness are successful for the exact publication commit.
7. The `v1.0.0` tag and stable GitHub release do not already exist.

## Release rule

Do not call this build stable/final/production merely because the version is `1.0.0`. The stable release exists only after the dedicated stable publication workflow passes every hard gate and publishes the immutable tag/assets/checksum.
