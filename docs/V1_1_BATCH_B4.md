# TOLUE v1.1 — Batch B.4

Scope: connect existing Pipeline and Pump engineering inputs to the renderer session draft without changing Engineering Core equations.

Implemented:
- Pipeline scalar editing for target flow, density, and lubrication-layer thickness.
- Straight-segment editing for length, pipe radius, and elevation change.
- Pump capability curve point editing for verified flow/pressure points.
- Inline validation mirrors existing Engineering Core domain constraints only.
- Every accepted edit routes through `setAnalysisInput`, preserving the session draft and marking previous analysis stale.
- No formula, solver, interpolation, local-loss, pumpability, or acceptance-rule changes.

Acceptance gates:
1. TypeScript strict check.
2. Existing engineering/golden tests plus renderer draft tests.
3. Windows package smoke.
4. Existing licensing/persistence regressions remain intact.
