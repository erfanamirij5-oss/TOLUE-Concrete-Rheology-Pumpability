# Stage 0.6 — PRESSURE-ELBOW-002 Base-Model Compatibility Audit

## Purpose
Determine whether the Gao et al. (2024) bend correction factor can be safely integrated with the current TOLUE two-fluid Bingham pressure engine without changing model meaning or double-counting losses.

## Primary source chain

### Bend correction paper
Gao, G.; Wei, L.; Zhao, X.; Wan, M.; Li, H. (2024), *The One-Dimensional Flow Pressure Loss Correction Model Based on the Particle Flow through Concrete Bend*, Applied Sciences 14(19), 8824, DOI 10.3390/app14198824.

The bend model is:

`Δp_w = λ Δp_m`

with

`Δp_m = 0.0055 [1 + (20000 K_d + 10^6/Re)^(1/3)] (l ρ_s v^2)/(2 d_e)`

and

`d_e = 2 δ`

The fitted bend factor is Equation (19), already captured and numerically verified in the isolated TOLUE evaluator.

### Native straight-pipe source family
The bend paper explicitly builds on the authors' earlier one-dimensional straight-pipe model. In that model:

`Re = v d_e / ν`

`ν = μ / ρ_s`

`K_d = K / d_e`

`K = 6 V_a / S_a`

and the friction coefficient is derived from the Moody/Modi-style empirical relation used in the source family.

The source straight-pipe model therefore depends on:
- mortar density `ρ_s`;
- mortar kinematic/dynamic viscosity;
- lubrication-layer thickness `δ`;
- equivalent aggregate roughness `K` derived from particle geometry;
- lubrication-layer equivalent diameter `d_e`;
- mortar Reynolds number `Re`;
- source-model conveying length `l`;
- mean velocity `v`.

## Compatibility finding

### Current TOLUE straight-pipe engine
The current production candidate in TOLUE is a two-fluid coaxial Bingham formulation. It computes pressure gradient from:
- bulk concrete Bingham yield stress and plastic viscosity;
- lubrication-layer Bingham yield stress and plastic viscosity;
- pipe radius;
- lubrication-layer thickness;
- target volumetric flow rate.

It does **not** use Gao/Zhao's `K_d`, aggregate-equivalent roughness `K`, Moody/Modi friction factor, or mortar Reynolds number as governing variables.

### Consequence
The quantity `Δp_m` in Gao et al. is not merely a generic straight-pipe pressure value. It is the output of a different source model with a different constitutive basis and a different parameterization.

Therefore this operation is prohibited:

`Δp_elbow = λ_Gao × Δp_TOLUE_two-fluid`

because it would silently transfer an empirical correction factor calibrated against one base model to a different base model.

## Double-counting audit

Equation `Δp_w = λ Δp_m` is a corrected bend-section pressure loss, not an additive local-loss increment by itself.

If TOLUE were to compute:

`Δp_total = Δp_straight_equivalent + λ Δp_straight_equivalent`

then the base straight-pipe contribution would be counted twice.

If TOLUE were to compute:

`Δp_local = (λ - 1) Δp_TOLUE_two-fluid`

that would avoid arithmetic double-counting but would still be scientifically invalid unless the transferability of `λ - 1` across the two model families were independently demonstrated.

No such transferability evidence is currently accepted.

## Model-family decision

`PRESSURE-ELBOW-002` is split conceptually into two layers:

1. **Regression utility** — Equation (19) only (`λ` evaluator).
   - Status: numerically verified inside its published regression domain.
   - Allowed use: research comparison, sensitivity visualization, future model-family reproduction.
   - Not a pressure result by itself.

2. **Full Gao bend-pressure model** — `Δp_w = λ Δp_m` using the native Gao/Zhao one-dimensional base model.
   - Status: blocked from TOLUE pipeline integration.
   - Required before enablement: reproduce the native base model and one published full pressure case end-to-end.

## Required next verification

Before full pressure execution is allowed, TOLUE must reproduce the Gao/Zhao source chain natively:

1. implement the source-model definitions for `Re`, `ν`, `K_d`, `K`, and `d_e` in an isolated research module;
2. verify dimensional consistency and source unit conventions;
3. reproduce at least one published straight-pipe pressure-loss case;
4. reproduce at least one published bend case from Table 5 or equivalent source data;
5. quantify discrepancy against the reported source value;
6. keep the native source model isolated from the two-fluid Bingham production engine;
7. only after independent field/project comparison decide whether either family is suitable for production or whether a calibrated bridge model is required.

## Table 5 target cases from Gao et al. 2024
The paper reports engineering-comparison cases for pumping velocities:

| v (m/s) | One-dimensional flow correction model | Experimental measurement |
|---:|---:|---:|
| 0.63 | 0.0995 | 0.0901 |
| 0.77 | 0.1042 | 0.0942 |
| 0.89 | 0.1150 | 0.0968 |

These are candidate end-to-end verification targets. Their exact pressure unit / section interpretation must be frozen directly from the paper context before coding a golden vector.

## Engineering decision

- Keep `pipeline.ts` unchanged.
- Keep elbows fail-closed in the production hydraulic path.
- Keep the isolated `λ` evaluator and its golden tests.
- Do not multiply `λ` by the current TOLUE two-fluid pressure.
- Do not reinterpret `(λ - 1)` as a transferable local-loss coefficient.
- Next task: isolated reproduction of the native Gao/Zhao one-dimensional base-pressure model.
