# TOLUE Concrete Rheology & Pumpability — v1.1 Roadmap

## Objective
Turn the stable v1.0.0 engineering product into a faster, clearer, more polished commercial desktop experience without changing the validated engineering/scientific core unless a separate evidence-based change is intentionally approved.

## Delivery style
- Fast iteration on a dedicated v1.1 branch.
- Small, reviewable increments instead of heavyweight release bureaucracy.
- Keep the existing regression suite as the safety net.
- No unnecessary process gates, duplicated documentation, or blocking ceremony.
- UI/UX work may proceed aggressively as long as engineering outputs remain regression-safe.

## v1.1 workstreams

### U01 — Information architecture and workflow clarity
- Establish a clear user journey: Project → Materials → Rheology → Pipeline → Pump → Analyze → Results → Diagnostics → Report.
- Group secondary tools such as Evidence, Visualization, History, and Comparison so the primary workflow stays obvious.
- Add consistent active-section and completion-state feedback.

### U02 — Professional application shell
- Upgrade the fixed functional sidebar into a polished engineering navigation shell.
- Add clear active state, section grouping, better spacing, compact brand header, and responsive collapse behavior.
- Improve desktop-window behavior for common laptop widths and high-DPI use.

### U03 — User-facing language and status model
- Replace internal/developer-facing strings such as `Session`, `Run`, `completeness`, and `STALE` with clear Persian product language.
- Preserve technical detail where useful, but separate machine state from user-facing state.
- Add explicit statuses such as ready, requires input, calculating, results current, recalculation required, failed.

### U04 — Input UX and validation
- Field-level validation near the affected input.
- Units displayed consistently beside every engineering input.
- Clear required/optional states.
- Prevent ambiguous or impossible input combinations before analysis.
- Improve keyboard flow and tab order.

### U05 — Analysis execution experience
- Add strong Analyze CTA.
- Busy/progress state during calculation.
- Prevent accidental duplicate submissions.
- Clear success/failure completion feedback.
- Surface stale-result state immediately when inputs change.

### U06 — Results and diagnostics experience
- Improve hierarchy for governing pressure, available pump pressure, margin, critical segment, and pumpability decision.
- Make warnings and engineering limits scannable.
- Distinguish errors, warnings, advisories, evidence limitations, and assumptions.
- Keep traceability to Engineering Core outputs.

### U07 — Visualization and charts
- Improve pressure-profile chart legibility, units, labels, legends, and critical-point emphasis.
- Improve 3D route presentation without implying CFD/DEM capability.
- Maintain strict separation between visualization and engineering calculation.

### U08 — Run history and comparison workspace
- Move history/comparison away from permanently occupying the bottom of every page.
- Provide a dedicated history/comparison workspace or drawer.
- Make baseline/candidate selection obvious.
- Improve comparison summaries and changed-input visibility.

### U09 — Reporting polish
- Improve report preview and export flow.
- Ensure report metadata, project identity, version, engine version, timestamps, assumptions, warnings, and provenance are presented consistently.
- Preserve validated PDF export behavior.

### U10 — Licensing UX
- Keep the v1.0 production license trust model.
- Improve activation screen, machine-code copy action, import feedback, expiry messaging, and invalid-license guidance.
- Never expose private signing material in the distributed application.

### U11 — Product metadata and commercial polish
- Add author/company/product metadata where missing.
- Standardize application title/version presentation.
- Remove avoidable build warnings.
- Keep the approved product icon.

### U12 — Accessibility and resilience
- Improve focus visibility, keyboard access, semantic labels, contrast, and error announcement.
- Verify UI with resize/high-DPI scenarios.
- Add resilient empty/loading/error states.

## Implementation order

### Phase 1 — Shell and language
U02 + U03 + U11

### Phase 2 — Primary engineering workflow
U01 + U04 + U05

### Phase 3 — Results, diagnostics, visualization
U06 + U07

### Phase 4 — History, comparison, report, licensing polish
U08 + U09 + U10

### Phase 5 — Accessibility and final regression
U12 + full regression + Windows package acceptance

## Acceptance target for v1.1
- Existing engineering regression suite remains green.
- Windows installer builds and launches successfully.
- Licensing and persistence remain regression-free.
- No scientific result changes unless explicitly documented and separately validated.
- Primary workflow is understandable without developer terminology.
- Navigation, input, analysis, result, history/comparison, report, and activation flows have coherent empty/loading/success/error states.
- UX is suitable for a commercial engineering desktop application.

## First implementation slice
Start with application-shell polish and user-facing status language because it produces immediate UX improvement with minimal engineering-core risk.
