# Stage 0.6 — Gao/Zhao Source Pressure Reproduction Audit

## Purpose
This audit checks whether the published Zhao et al. (2024) one-dimensional straight-pipe pressure-loss example can be reproduced from the source values already captured in TOLUE before any full Gao/Zhao pressure equation is admitted to executable engineering use.

Primary reference:
X. Zhao, G. Gao, M. Wan, J. Dai, *One-Dimensional Modeling of the Pressure Loss in Concrete Pumping and Experimental Verification*, Applied Sciences 14(7), 3101 (2024), DOI 10.3390/app14073101.

## Published source example
The paper reports the following state for its worked verification example:

- concrete pumping flow: `42 m^3/h`
- lubrication-layer viscosity: `2.50 Pa·s`
- lubrication-layer thickness: `2.09 mm`
- equivalent lubrication diameter: `d_e = 4.18 mm`
- relative aggregate roughness: `K_d = 3.7799`
- Reynolds number: `Re = 3.3392`
- resistance coefficient: `lambda = 0.4021`
- reported one-dimensional pressure loss per unit length: `Delta p_e = 0.02284 MPa`
- reported measured value: `0.02823 MPa`
- reported relative error: `19.09%`

The paper also states that the model omits the transition region between the lubrication layer and plug region, which it identifies as one reason the analytical value is lower than measurement.

## Reproduction check of the already captured primitives
The isolated TOLUE source-model primitives reproduce the reported source state to rounding:

- `d_e = 2 delta = 0.00418 m`
- `K_d = K / d_e = 3.7799` for `K = 15.8 mm`
- source-rounded velocity `v = 0.951 m/s`
- `Re = v d_e / nu = 3.3392`
- Modi resistance coefficient `lambda = 0.4021`

Therefore the discrepancy is not in the currently captured definitions of `d_e`, `K_d`, `Re`, or the Modi coefficient.

## Direct Darcy-form reconstruction
If the pressure-gradient expression is interpreted in the conventional form

`Delta p / L = lambda rho v^2 / (2 d_e)`

and the published/example values are inserted with `rho = 2100 kg/m^3`, the result is approximately:

`0.09135 MPa/m`

This is about four times the paper's reported:

`0.02284 MPa/m`

Ratio:

`0.09135 / 0.02284 ~= 3.9996`

The mismatch is therefore essentially an exact factor-of-four discrepancy, not ordinary rounding error.

## Engineering interpretation
TOLUE must not silently insert a factor `1/4` to force agreement.

At least one of the following source-convention issues must be resolved from the exact derivation/equation notation before implementation:

1. whether the published hydraulic quantity is based on radius, hydraulic radius, equivalent diameter, or a four-times-hydraulic-radius convention;
2. whether the paper's resistance coefficient is defined with a Darcy/Fanning-like convention different from the direct interpretation used above;
3. whether Equation (27) contains a geometric factor not preserved in the currently transcribed shorthand;
4. whether the reported `Delta p_e` is normalized over a section/length basis different from `1 m`;
5. whether a typographical or equation-transcription issue exists in the published source chain.

These are hypotheses only. None is accepted as the correction until the primary equation chain is resolved exactly.

## Admission decision

### Accepted
- `gaoZhao1dBaseModel.ts` primitive state calculations remain valid as an isolated research reproduction layer.
- The published `d_e`, `K_d`, `Re`, and `lambda` example is numerically reproducible.

### Blocked
- native source pressure-gradient evaluation;
- full Gao/Zhao straight-pipe pressure output;
- full Gao bend pressure `Delta p_w = lambda_bend Delta p_m`;
- any connection of Gao pressure values into `pipeline.ts`;
- any empirical factor introduced solely to force the 0.02284 MPa/m target.

## Required resolution before coding pressure
1. capture Equation (27) exactly from the version-of-record, including all geometric factors and the definition of the resistance coefficient;
2. freeze the exact meaning and unit basis of the reported `Delta p_e`;
3. reproduce `0.02284 MPa` from the published source chain with no fitted correction;
4. add the reproduction as a golden vector;
5. only then implement an isolated native pressure function;
6. keep it separate from the TOLUE two-fluid Bingham production candidate until independent compatibility/field validation is complete.

## Current conclusion
The audit has localized the unresolved issue to the final pressure-expression convention/source transcription, not to the already implemented `d_e`, `K_d`, `Re`, or Modi coefficient primitives.

This is a useful stop condition: the scientific chain is narrowed, the discrepancy is quantified, and TOLUE remains fail-closed rather than hiding an unexplained calibration factor.
