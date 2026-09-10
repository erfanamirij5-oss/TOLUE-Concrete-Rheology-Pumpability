# TOLUE Concrete Rheology & Pumpability v1.1.0-rc.3

## Release Candidate scope

This RC supersedes v1.1.0-rc.2 after a second controlled production licensing trust-root rotation because the previous owner-side private signing key was unavailable. It preserves the accepted v1.1 engineering and desktop behavior while moving production issuance to the replacement owner-controlled Ed25519 key.

### Included

- All accepted v1.1.0-rc.2 functionality and regression protections.
- Production licensing public-key rotation to `tolue-prod-2026-03`.
- Owner-only offline Windows License Manager v1.0.2 aligned to the replacement production key fingerprint.
- Strict machine binding, subscription validity, signature verification, and fail-closed activation behavior.
- Windows installer build, install, launch, uninstall, checksum, and missing-license smoke coverage.

## Engineering and security invariants

- Engineering Core formulas and scientific model behavior are unchanged.
- Published v1.0.0, v1.1.0-rc.1, and v1.1.0-rc.2 tags and assets remain immutable.
- The customer runtime and release assets contain public key material only.
- The production private signing key remains owner-side and is never committed, uploaded to GitHub, exposed to CI, or packaged.
- Existing persistence and licensing envelope schemas remain unchanged.

## RC acceptance

Publication is allowed only from exact `main` after all regression gates pass and the Release RC workflow validates the replacement production public key material, production installer, checksum, missing-license behavior, immutable main target, tag, and prerelease assets.
