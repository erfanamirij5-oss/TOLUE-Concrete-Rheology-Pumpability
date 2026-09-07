# Stage 0.6 — Elbow Correction Model Contract (Open-Source Candidate)

## Model identity

- Model ID: `PRESSURE-ELBOW-002`
- Domain: pump hydraulics / concrete elbow pressure loss
- Status: `research`
- Classification: `EMPIRICAL_MODEL`
- Primary reference: Gao, Wei, Zhao, Wan, Li (2024), *The One-Dimensional Flow Pressure Loss Correction Model Based on the Particle Flow through Concrete Bend*, Applied Sciences 14(19), 8824, DOI 10.3390/app14198824.
- Production status: **blocked** pending unit-resolution audit, source-case reproduction, and independent verification.

This model is captured because the full equation set is openly accessible. It is not a replacement for `PRESSURE-ELBOW-001` (Park et al. 2020), which remains the preferred full-scale-evidence family once the complete primary paper is available for exact transcription.

## Published equation set captured

The paper defines bend pressure loss as a correction of a one-dimensional base pressure-loss model:

`Δp_w = λ Δp_m`

with

`Δp_m = 0.0055 [1 + (20000 K_d + 10^6/Re)^(1/3)] (l ρ_s v^2)/(2 d_e)`

and

`d_e = 2 δ`

The correction-factor family is written as:

`λ = c1 r^2 θ + c2 r θ + c3 v θ + c4 r v + c5 r + c6 θ + c7 v + c8`

The published fitted form is:

`λ1 = -2.0663×10^-8 r^2 θ + 1.2749×10^-5 r θ - 0.00157 v θ + 0.0021 r v + 0.0025 r + 0.00807 θ + 0.7545 v + 0.3001`

## Variable inventory

| Symbol | Meaning reported in source | Contract state |
|---|---|---|
| `Δp_w` | bend pressure loss | captured |
| `Δp_m` | one-dimensional base pressure loss | captured |
| `λ` | bend correction factor | captured |
| `K_d` | relative roughness for lubrication-layer contact | captured, implementation blocked pending exact unit/definition audit |
| `Re` | mortar/lubrication-layer Reynolds number | captured, implementation blocked pending exact constitutive definition audit |
| `l` | conveying/bend-reference length used by base equation | captured, exact geometric interpretation must be frozen before code |
| `ρ_s` | mortar density | captured |
| `v` | velocity/flow descriptor appearing in published equations | **unit semantics unresolved for implementation**; paper discusses pumping flow rate and speed in the fitted study, so TOLUE must not guess whether regression `v` is m/s, converted flow, or another normalized variable |
| `d_e` | equivalent lubrication-layer diameter | captured |
| `δ` | lubrication-layer thickness | captured |
| `r` | bend radius of curvature | captured; regression unit basis must be frozen from source data before code |
| `θ` | horizontal inclination angle | captured; degree/radian basis must be frozen before code |

## Reported study domain

The source reports a 125 mm-diameter bend simulation case and studies bend-radius / inclination / flow effects. The orthogonal study includes:

- inclination angles: `90°, 45°, 0°, -45°, -90°`
- pumping flow rates: `40, 55, 70, 100, 120 m³/h`
- bend radii of curvature: `195, 235, 275, 315, 355 mm`

The paper reports that the correction-model error against engineering measurements was within 20%, with an overall comparison value reported as 15.8% in the abstract.

These values define a **research calibration/verification domain only**. They are not universal limits for all concrete, pipe diameters, or pumping systems.

## TOLUE admission decision

`PRESSURE-ELBOW-002` remains `research` and is **not executable** in the engineering core yet.

Blocking reasons:

1. Regression-variable unit semantics for `r`, `θ`, and especially `v` must be resolved directly from the source tables/equation definitions.
2. `K_d` and `Re` depend on a specific one-dimensional particle/lubrication-layer model that is not the current TOLUE straight-pipe Bingham engine.
3. Directly multiplying the TOLUE two-fluid straight-pipe pressure by `λ` would mix incompatible model families and could double-count or misrepresent losses.
4. A source verification vector must be reproduced numerically from published data before implementation.
5. Applicability is tied to the paper's tested/simulated concrete, geometry, and flow domain; extrapolation is prohibited.

## Required verification before code

- Reconstruct one published case from source table data.
- Verify the exact unit basis used in Equation (19).
- Reproduce the published `λ` and `Δp_w` value to stated rounding tolerance.
- Confirm whether `Δp_m` is total bend-section baseline loss or a straight-equivalent baseline so no double counting occurs.
- Document mixture/rheology and aggregate assumptions used by the source.
- Add out-of-domain rejection tests for radius, inclination, flow, and required source-model inputs.
- Keep result class as `EMPIRICAL_MODEL`; evidence documentation must not upgrade scientific validation status.

## Integration rule

Until the checks above are complete:

- `pipeline.ts` behavior remains unchanged.
- `elbow` remains `not_computed`.
- `requiredPressurePa` remains `null` when an elbow is present.
- No generic K-factor or equivalent-length shortcut is permitted.

## Relationship to PRESSURE-ELBOW-001

- `PRESSURE-ELBOW-001`: Park et al. 2020, real-scale concrete pumping tests; preferred evidence family but exact equations still inaccessible in current evidence set.
- `PRESSURE-ELBOW-002`: Gao et al. 2024, openly accessible particle-flow-derived correction model; equations captured but not yet admitted to executable core.

TOLUE may later compare both families against a common project-calibration dataset. Neither is a universal bend law.