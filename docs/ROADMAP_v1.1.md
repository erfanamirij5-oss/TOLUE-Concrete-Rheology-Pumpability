# TOLUE Concrete Rheology & Pumpability — v1.1 Roadmap

## Goal
Turn the stable v1.0.0 engineering product into a faster, clearer and more commercial-grade desktop experience without rewriting the Engineering Core.

## Delivery mode
Fast-track. Keep only essential regression protection: typecheck, existing test suite, Windows package smoke, licensing startup/import and persistence restart. Avoid heavyweight release bureaucracy during feature development.

## Scope

### P0 — Immediate UX polish
- Replace developer-facing session/status wording with user-facing Persian states.
- Make the active navigation section visually obvious.
- Improve spacing, hierarchy, buttons and cards using the existing design tokens.
- Add clear empty states and action guidance.
- Improve loading/error feedback and prevent duplicate actions.
- Add package author/company metadata.

### P1 — Workflow navigation
- Organize the app around the engineering flow: Project → Materials → Rheology → Pipeline → Pump → Analysis → Results → Report.
- Group secondary tools: Evidence, Diagnostics, 3D, History and Comparison.
- Add current-step/progress cues and contextual primary action.
- Make run history/comparison a dedicated workspace instead of permanent bottom-page content.

### P1 — Inputs and validation
- Consistent field components, units, helper text and engineering constraints.
- Inline validation next to the offending field.
- Dirty/stale state translated to clear user guidance.
- Preserve entered data while moving between sections.

### P1 — Results workspace
- Strong KPI hierarchy for pressure, pump margin, rheology and feasibility.
- Better warning/critical/nominal visual semantics.
- Clear traceability to inputs, method and evidence.
- Improve engineering charts and 3D presentation without changing underlying calculations.

### P1 — Reporting
- Improve report preview and export affordance.
- Better project metadata and executive summary.
- Consistent Persian/English terminology and units.

### P2 — Desktop polish
- Responsive behavior for common Windows laptop resolutions and DPI scaling.
- Keyboard/focus accessibility and clearer hover/focus states.
- Better window-size resilience.
- Installer/package metadata cleanup.

### P2 — Licensing experience
- Cleaner activation screen.
- Copy-machine-code action.
- Clear expired/wrong-machine/invalid-file messages.
- Show license validity details after activation.

## Non-goals for v1.1
- No rewrite of the Engineering Core.
- No formula/model changes unless a separately evidenced engineering defect is found.
- No replacement of the stable v1.0.0 release.

## Fast acceptance gates
Every merge candidate should normally satisfy:
1. `npm run typecheck`
2. `npm test`
3. Windows package smoke when installer/runtime code is touched
4. Licensing and persistence regression when those areas are touched

## Planned batches
- Batch A: shell/navigation/status/package metadata
- Batch B: input components + inline validation + loading states
- Batch C: results/diagnostics/3D hierarchy
- Batch D: history/comparison workspace
- Batch E: report + licensing UX + responsive polish
- Batch F: full v1.1 regression and Windows release candidate

## Baseline
v1.0.0 / commit `a6a8dea1a90108f007a5864ab758c75dd5d29ffc` remains the stable reference point.
