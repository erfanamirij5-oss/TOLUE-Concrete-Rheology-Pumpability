# Stage 0.6 — Elbow Correction Model Contract (Open-Source Candidate)

## Model identity

- Model ID: `PRESSURE-ELBOW-002`
- Domain: pump hydraulics / concrete elbow pressure loss
- Status: `specified`
- Classification: `EMPIRICAL_MODEL`
- Primary reference: Gao, Wei, Zhao, Wan, Li (2024), *The One-Dimensional Flow Pressure Loss Correction Model Based on the Particle Flow through Concrete Bend*, Applied Sciences 14(19), 8824, DOI 10.3390/app14198824.
- Production status: **blocked** pending full base-model reproduction, source pressure-case reproduction, and model-family compatibility audit.

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
| `Δp_m` | one-dimensional base pressure loss | captured; integration blocked pending compatibility audit |
| `λ` | bend correction factor | captured and regression-unit semantics resolved |
| `K_d` | relative roughness for lubrication-layer contact | captured, implementation blocked pending exact base-model reproduction |
| `Re` | mortar/lubrication-layer Reynolds number | captured, implementation blocked pending exact constitutive reproduction |
| `l` | conveying/bend-reference length used by base equation | captured, exact geometric interpretation must be frozen before pressure code |
| `ρ_s` | mortar density | captured |
| `v` | mean concrete velocity | **m/s** in Equation (19) regression |
| `d_e` | equivalent lubrication-layer diameter | captured |
| `δ` | lubrication-layer thickness | captured |
| `r` | bend radius of curvature | **mm** in Equation (19) regression |
| `θ` | horizontal inclination angle | **degrees** in Equation (19) regression |

## Regression unit-resolution evidence

The paper studies a 125 mm internal pipe diameter and reports that a volumetric flow rate of `40 m³/h` corresponds to a pumping velocity of approximately `0.905 m/s`.

Using

`v = (Q/3600) / (πD²/4)`

with `Q = 40 m³/h` and `D = 0.125 m` gives:

`v = 0.9054147873672269 m/s`

which rounds to the source-reported `0.905 m/s`.

Together with Table 4 headings and Equation (19), this freezes the empirical regression basis as:
- `r` in millimetres;
- `θ` in degrees;
- `v` in metres per second;
- `λ` dimensionless.

These are regression-input units, not a claim that the fitted polynomial is dimensionally homogeneous physics.

## Reported study domain

The source reports a 125 mm-diameter bend simulation case and studies bend-radius / inclination / flow effects. The orthogonal study includes:

- inclination angles: `90°, 45°, 0°, -45°, -90°`
- pumping flow rates: `40, 55, 70, 100, 120 m³/h`
- bend radii of curvature: `195, 235, 275, 315, 355 mm`
- corresponding velocity span for 125 mm ID: approximately `0.9054–2.7162 m/s`

The paper reports that the correction-model error against engineering measurements was within 20%, with an overall comparison value reported as 15.8%.

These values define a **research calibration/verification domain only**. They are not universal limits for all concrete, pipe diameters, or pumping systems.

## Verification vectors

Regression verification vectors are frozen in:

`docs/STAGE_0_6_ELBOW_002_VERIFICATION_VECTORS.md`

They include:
- source flow-to-velocity identity for 125 mm ID;
- horizontal, +90°, and -90° regression cases;
- upper-flow and alternate-radius source-domain cases;
- negative tests against accidental metre/mm, radian/degree, and flow/velocity confusion.

These vectors verify Equation (19) transcription only. They do not yet validate the full pressure-loss chain.

## TOLUE admission decision

`PRESSURE-ELBOW-002` advances from `research` to `specified` because Equation (19), its empirical unit basis, source domain, and deterministic verification vectors are now captured.

It is still **not executable as a pressure-loss segment in the engineering core**.

Remaining blocking reasons:

1. `K_d`, `Re`, `d_e`, `l`, and the source one-dimensional base model must be reproduced numerically from the paper.
2. The source base model is not the current TOLUE two-fluid Bingham straight-pipe engine.
3. Directly multiplying TOLUE straight-pipe pressure by `λ` would mix model families and could double-count or misrepresent losses.
4. At least one complete published/field `Δp_w` case must be reproduced before pressure implementation.
5. Applicability is tied to the paper's tested/simulated concrete, 125 mm pipe geometry, bend radii, inclination range, and flow domain; extrapolation is prohibited.

## Required verification before pressure code

- Reconstruct the source one-dimensional base pressure calculation.
- Reproduce at least one published `Δp_w`/field comparison case.
- Confirm the geometric meaning of `l` in Equation (17).
- Freeze `K_d`, `Re`, `δ`, and material-parameter definitions exactly as used by the source.
- Decide whether Equation (19) can only operate with its native base model or whether a separately calibrated TOLUE adapter can be scientifically justified.
- Add out-of-domain rejection tests for radius, inclination, velocity/flow, pipe diameter, and required source-model inputs.
- Keep result class as `EMPIRICAL_MODEL`; evidence documentation must not upgrade scientific validation status.

## Integration rule

Until the checks above are complete:

- `pipeline.ts` behavior remains unchanged.
- `elbow` remains `not_computed`.
- `requiredPressurePa` remains `null` when an elbow is present.
- No generic K-factor or equivalent-length shortcut is permitted.

## Relationship to PRESSURE-ELBOW-001

- `PRESSURE-ELBOW-001`: Park et al. 2020, real-scale concrete pumping tests; preferred evidence family but exact equations still inaccessible in current evidence set.
- `PRESSURE-ELBOW-002`: Gao et al. 2024, openly accessible particle-flow-derived correction model; Equation (19) is now fully specified for isolated regression evaluation, while full pressure integration remains blocked.

TOLUE may later compare both families against a common project-calibration dataset. Neither is a universal bend law.