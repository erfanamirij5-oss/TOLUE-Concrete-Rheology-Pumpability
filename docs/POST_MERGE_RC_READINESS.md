# Post-Merge RC Readiness

This document records the post-merge verification gate for the first release-candidate preparation cycle.

## Baseline

- Main baseline merge commit: `950162d4f4fa895a48434d0e6bf7103de907629d`
- Engineering tests: 66 files / 289 tests passed on Windows post-merge verification run before packaging.
- Windows packaging reached completed NSIS generation but CI failed because electron-builder attempted CI auto-publish without `GH_TOKEN`.

## Corrective action

Windows packaging is explicitly configured with `--publish never` for CI/package generation. Packaging and publishing are now separate concerns. A build must not require repository publishing credentials to produce and verify the installer.

## RC gate

The hotfix may merge only after both Engineering Core CI and Windows Package CI succeed on the pull request head. RC versioning and release creation remain blocked until the merged `main` head passes both post-merge workflows.
