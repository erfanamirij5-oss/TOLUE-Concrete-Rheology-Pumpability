# Stage 0.6 — PRESSURE-ELBOW-002 Verification Vectors

## Purpose
These vectors verify transcription and unit semantics for Gao et al. (2024) Equation (19) before any pressure-loss integration is permitted in the executable TOLUE core.

They verify only the empirical correction factor `lambda`. They do **not** yet verify the full bend pressure-loss equation `Delta p_w = lambda Delta p_m`, because the paper's base one-dimensional model `Delta p_m` is a separate model family and is not yet reconciled with the current TOLUE two-fluid Bingham straight-pipe engine.

## Source basis
Primary source:
Gao, G.; Wei, L.; Zhao, X.; Wan, M.; Li, H. (2024), *The One-Dimensional Flow Pressure Loss Correction Model Based on the Particle Flow through Concrete Bend*, Applied Sciences 14(19), 8824, DOI 10.3390/app14198824.

Published regression:

`lambda = -2.0663e-8 r^2 theta + 1.2749e-5 r theta - 0.00157 v theta + 0.0021 r v + 0.0025 r + 0.00807 theta + 0.7545 v + 0.3001`

Resolved unit basis from the source study:
- `r`: bend radius of curvature in **mm**
- `theta`: horizontal inclination angle in **degrees**
- `v`: mean concrete velocity in **m/s**
- `lambda`: dimensionless

For the reported 125 mm internal pipe diameter, flow-rate conversion is:

`v = (Q / 3600) / (pi D^2 / 4)`

with `Q` in m^3/h and `D = 0.125 m`.

The paper explicitly reports that `Q = 40 m^3/h` corresponds to approximately `v = 0.905 m/s`, which resolves the regression velocity semantics.

## Vector EV-001 — flow conversion identity
Input:
- `D = 0.125 m`
- `Q = 40 m^3/h`

Expected:
- `A = pi D^2 / 4`
- `v = 0.9054147873672269 m/s`
- rounded source-compatible value: `0.905 m/s`

Acceptance:
- absolute error <= `1e-12 m/s` against the equation result.
- source-text comparison accepts `0.905 m/s` after rounding to three decimals.

## Vector EV-002 — baseline horizontal bend regression
Input:
- `r = 195 mm`
- `theta = 0 deg`
- `Q = 40 m^3/h`
- `v = 0.9054147873672269 m/s`

Expected:
- `lambda = 1.841502812495452`

Acceptance:
- absolute error <= `1e-12` for direct double-precision evaluation.

## Vector EV-003 — positive inclination sensitivity
Input:
- `r = 195 mm`
- `theta = 90 deg`
- `Q = 40 m^3/h`
- `v = 0.9054147873672269 m/s`

Expected:
- `lambda = 2.592898701290463`

Consistency requirement:
- `lambda(theta=90 deg) > lambda(theta=0 deg)` for this source-domain case.

## Vector EV-004 — negative inclination sensitivity
Input:
- `r = 195 mm`
- `theta = -90 deg`
- `Q = 40 m^3/h`
- `v = 0.9054147873672269 m/s`

Expected:
- `lambda = 1.0901069237004413`

Consistency requirement:
- `lambda(theta=-90 deg) < lambda(theta=0 deg)` for this source-domain case.

## Vector EV-005 — upper flow level at source radius
Input:
- `r = 195 mm`
- `theta = 90 deg`
- `Q = 120 m^3/h`
- `v = 2.7162443621016803 m/s`

Expected:
- `lambda = 4.4448341073713875`

Consistency requirement:
- at fixed `r=195 mm`, `theta=90 deg`, the regression result at `120 m^3/h` must exceed the result at `40 m^3/h`.

## Vector EV-006 — alternate source-domain corner
Input:
- `r = 355 mm`
- `theta = -90 deg`
- `Q = 120 m^3/h`
- `v = 2.7162443621016803 m/s`

Expected:
- `lambda = 4.746506233267487`

Purpose:
- catches accidental unit conversion of `r` from mm to m and accidental degree/radian conversion of `theta` inside the empirical regression.

## Critical unit-rule tests
Any future implementation of Equation (19) must reject or explicitly convert inputs before evaluation. The regression coefficients are tied to the source unit basis and must never be interpreted as SI-homogeneous physical constants.

Required negative tests:
- passing `r = 0.195` directly as if metres must be rejected by the source-regression API contract;
- passing `theta = pi/2` directly as if radians must be rejected by the source-regression API contract;
- passing `Q` directly in m^3/h into the `v` slot must be rejected by API typing/validation;
- flow values outside 40–120 m^3/h, radii outside 195–355 mm, or inclination outside -90 to +90 degrees must not silently extrapolate in an engineering-result path.

## Relationship to Table 4
Table 4 reports the 125 orthogonal particle-flow simulation pressure-loss results used to fit Equation (19). These verification vectors validate exact regression transcription and source unit semantics; they do not claim exact reproduction of each Table 4 pressure-loss value because that requires the paper's full `Delta p_m` base-model inputs (`K_d`, `Re`, `delta`, `rho_s`, reference length interpretation, and associated material parameters).

## Admission decision after these vectors
Equation (19) is sufficiently specified for an isolated, non-integrated `lambda` evaluator with strict source-domain checks.

The full `PRESSURE-ELBOW-002` pressure model remains blocked from `pipeline.ts` until:
1. the complete base one-dimensional model is numerically reproduced from a published case;
2. double-counting relative to TOLUE straight-pipe friction is resolved;
3. at least one full `Delta p_w` published/field verification case is reproduced;
4. model-family compatibility is explicitly documented.
