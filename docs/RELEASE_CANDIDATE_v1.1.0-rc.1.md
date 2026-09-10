# TOLUE Concrete Rheology & Pumpability v1.1.0-rc.1

## Release Candidate scope

This release candidate consolidates the approved v1.1 UX/UI and desktop workflow work on top of the immutable v1.0.0 stable baseline.

### Included

- Refined desktop shell, navigation, status presentation, and package metadata.
- Improved engineering input components, inline validation, pipeline/pump input UX, and loading states.
- Improved results, diagnostics, pressure/profile presentation, and 3D visualization hierarchy.
- Dedicated history and run-comparison workspace with Candidate − Baseline semantics preserved.
- Report workspace and report/PDF presentation hardening.
- Licensing UX and responsive desktop polish without weakening authorization boundaries.
- Integrated v1.1 RC regression gate plus Windows packaging, install, shortcut, licensing, launch, and persistence smoke coverage.
- Hardened Windows NSIS CI handling for the known transient installer access-violation case while retaining fail-closed behavior for other failures.

## Engineering and security invariants

- Engineering Core formulas and scientific model behavior are unchanged by the v1.1 UX/UI work.
- Published v1.0.0 artifacts remain immutable.
- Customer runtime remains public-key-only for production licensing.
- The production private signing key is not included in the repository, CI, installer, or release assets.
- Persistence schema and licensing cryptographic contract remain regression-protected.

## RC acceptance

Publication of this RC is allowed only after the exact release-candidate head passes the relevant v1.1 regression gates and the final release workflow completes successfully from `main`.
