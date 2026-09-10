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
- stale-result state remains visible after inputs change
- existing Engineering Core, typed IPC, persistence and licensing boundaries are preserved

Existing material, rheology, pump, pipeline, result, diagnostics, history, comparison and report renderers are reused inside the new workspace rather than rewritten as fake replacements.

## 3D / spatial truth boundary

The current engineering domain does **not** store full spatial coordinates or connectivity primitives required for a truthful free-form 3D pipeline editor. `VisualizationSegment3D` currently exposes station/elevation/radius plus hydraulic result metadata. Therefore this recovery does not fabricate x/y/z coordinates, mesh topology, heatmaps or pump geometry.

The central viewport is now a persistent selectable engineering representation driven by real Core data. A later spatial-domain extension must introduce authoritative geometry/topology before true WebGL object authoring can be implemented safely.

## Preserved boundaries

- Engineering calculations remain in `src/engineering/core`.
- Renderer does not gain direct filesystem, SQLite or process access.
- Existing typed IPC remains the execution boundary.
- Licensing and production trust root are untouched.
- Published tags and `v1.1.0-rc.3` assets are untouched.

## Validation commands

```bash
npm ci
npm run typecheck
npm test
npm run build:desktop
npm run start:desktop
```

Visual acceptance should be checked at minimum at 1366×768 and 1920×1080.
