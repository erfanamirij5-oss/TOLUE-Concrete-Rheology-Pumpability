# TOLUE Concrete Rheology & Pumpability — Functional Recovery

## Recovery branch

`upgrade/ux-ui-3d-functional-recovery`

Baseline: `082ac1fb1e2d5d551d03c3560b7faa6600286a1c`

## Root cause

The renderer evolved around `navigation.ts` plus independent `*View.ts` full-page render functions. `applicationShell.ts` treated Project, Materials, Rheology, Pipeline, Pump, Visualization, Results, Diagnostics and Report as mutually exclusive pages. The engineering core, IPC, persistence and result contracts remained separate and substantially stronger than the UI architecture. As a result, system state was presented through page switching instead of one persistent engineering workspace.

The former `visualization3dView.ts` was also a standalone navigation page and rendered a horizontally-scrolling schematic card sequence. It consumed real Core visualization data, but it did not function as the persistent spatial context of the product.

## Implemented architectural correction

The renderer shell is now system-centric:

- top application / project / simulation bar
- persistent Project / Scene Tree
- persistent central Engineering Viewport
- contextual Engineering Inspector
- persistent bottom Simulation / Results / Warnings / History / Compare / Report panel
- synchronized segment selection between Scene Tree, Viewport and Inspector
- stale-result state remains visible after inputs change while stale hydraulic overlays are hidden
- existing Engineering Core, typed IPC, persistence and licensing boundaries are preserved

Existing material, rheology, pump, pipeline, result, diagnostics, history, comparison and report renderers are reused inside the new workspace rather than rewritten as fake replacements.

## Spatial engineering contract

The recovery branch now contains an optional, backward-compatible spatial extension on pipeline segments:

- authoritative `startPoint` / `endPoint` XYZ coordinates in metres
- optional `connectedFromSegmentId`
- deterministic derivation of straight-segment `lengthM` and `elevationChangeM` from authored coordinates
- independent spatial-topology validation
- propagation of spatial geometry through the engineering visualization contract (`tolue-3d-visualization-contract-v3`)
- draft Scene construction directly from current input before simulation
- current-result overlay only when the analysis is non-stale
- JSON persistence round-trip through existing `input_json` storage without a schema migration

Legacy projects without spatial metadata remain valid. No arbitrary XYZ coordinates are synthesized for them.

## Engineering viewport truth boundary

The current viewport renders an interactive spatial projection only from authoritative segment XYZ data. It supports orbit, pan, zoom, fit-to-scene, camera-aware depth ordering, reference grid rendering and segment selection. Legacy/non-spatial segments do not receive fabricated geometry.

This is an engineering geometric viewport, not a physical CFD/DEM simulation. `physicalSimulationClaim` remains `false`.

Three.js is not currently a project dependency. The recovery deliberately avoids adding it without a validated dependency/lockfile/build path; the current renderer therefore remains dependency-free and preserves the existing `esbuild` desktop pipeline.

## Persistence contract

Engineering runs persist the complete `SimulationRunInput` as JSON in `engineering_runs.input_json`. Spatial metadata therefore survives Save / History / Load as part of the existing immutable run snapshot. SQLite does not map pipeline segment properties into individual columns, so no persistence schema migration is required for the optional spatial metadata.

Regression coverage now checks spatial round-trip through the repository and application data-flow hydration.

## End-to-end spatial workflow coverage

The integration path covered by `spatialWorkflow.integration.test.ts` is:

`Authoring → Draft Scene → Engineering Analysis → Visualization v3 → Save → History → Load → Hydrate → Scene`

The test asserts authoritative XYZ preservation, predecessor connectivity, valid spatial topology, current analysis overlay after reload and retained pressure results.

## Recovery static audit

Static audit findings resolved on this branch:

1. Updated stale engineering-analysis test expectation from visualization contract v2 to v3.
2. Removed Scene hydraulic-status contract drift: Scene now derives its result-status type directly from `VisualizationSegment3D['hydraulicStatus']` and adds only the renderer-owned `not_run` state.
3. Replaced a Scene test fixture `as unknown as Visualization3DPresentation` escape hatch with `satisfies Visualization3DPresentation`, so future contract drift is compile-visible.
4. Corrected this recovery document after the spatial-domain extension so it no longer claims XYZ/topology are absent.

## Preserved boundaries

- Engineering calculations remain in `src/engineering/core`.
- Spatial metadata does not alter the hydraulic solver calculation path.
- Renderer does not gain direct filesystem, SQLite or process access.
- Existing typed IPC remains the execution boundary.
- Licensing and production trust root `tolue-prod-2026-03` are untouched.
- Published tags and `v1.1.0-rc.3` assets are untouched.
- `main` is not mutated by recovery work.

## Validation gate

Required local/runtime validation before this branch can be described as build-validated:

```bash
npm ci
npm run typecheck
npm test
npm run build:desktop
npm run start:desktop
```

Visual acceptance should be checked at minimum at 1366×768 and 1920×1080.

Until those commands are actually executed successfully, this recovery branch must not be described as typecheck-, test-, build- or runtime-passed solely from static inspection.
