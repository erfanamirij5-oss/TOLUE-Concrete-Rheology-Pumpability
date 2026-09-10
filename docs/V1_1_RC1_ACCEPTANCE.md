# TOLUE v1.1 RC1 Acceptance

## Candidate purpose
Batch F is the consolidated release-candidate gate for v1.1. It verifies the product as a whole after Batches A–E rather than reopening small feature cycles.

## Required automated acceptance
1. TypeScript strict check passes on the exact candidate head.
2. Full automated test suite passes on the exact candidate head.
3. Windows packaging smoke produces exactly one non-empty installer.
4. Focused licensing regression passes, including activation shell, IPC, presentation and Main-owned authorization boundaries.
5. Focused persistence regression passes, including repository/migration and Electron run adapter coverage.

## Release invariants
- Engineering Core formulas/models are unchanged by Batch F.
- v1.0.0 remains the stable published baseline and is not rewritten.
- Production private signing/license key material must never enter the repository or CI artifacts.
- Release publication remains a separate explicit action after the integrated RC gate is green.

## Candidate baseline
Batch F starts from main commit `8be47dfdd7930994fe27ac6386919edd6e4724c9`, immediately after the integrated Batch E licensing/responsive merge.
