# Batch B.4 Acceptance

Batch B.4 is acceptable when the branch passes the fast-track v1.1 gates and the following behavioral invariants remain true:

- Pipeline and Pump edits update only the session input draft.
- Accepted edits make an existing analysis stale through `setAnalysisInput`.
- Renderer validation mirrors constraints already present in Engineering Core.
- Pump capability curve editing preserves non-negative values and strictly increasing flow-rate ordering.
- Straight-pipe radius remains greater than the lubrication-layer thickness.
- Engineering Core calculation functions are not imported or executed by the input views.
