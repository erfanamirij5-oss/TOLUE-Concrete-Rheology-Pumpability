# Stage 0.6 — Gao/Zhao Friction-Convention Audit

## Purpose
Resolve whether the approximately fourfold discrepancy between the literal evaluation of Zhao et al. (2024) Equation (27) and the pressure value reported by the same paper can be explained by Darcy-vs-Fanning friction-factor convention or hydraulic-radius convention.

## Source equations under audit
Zhao et al. (2024), *One-Dimensional Modeling of the Pressure Loss in Concrete Pumping and Experimental Verification*, Applied Sciences 14(7), 3101, DOI 10.3390/app14073101.

The paper explicitly states that it uses Darcy's formula and gives:

`p_f = lambda (l/de) (rho_s v^2 / 2)`

with

`lambda = 0.0055 [1 + (20000 K_d + 10^6/Re)^(1/3)]`

and

`de = 4 A/P = 2 delta`

The published reference state reports approximately:
- `de = 4.18 mm`
- `K_d = 3.7799`
- `Re = 3.3392`
- `lambda = 0.4021`
- calculated pressure loss per unit length `0.02284 MPa`

Literal evaluation of the displayed Darcy equation with the displayed lambda and source state produces approximately `0.09135 MPa/m`, i.e. about four times the reported value.

## Darcy vs Fanning finding
For conventional internal-flow notation:

`f_Darcy = 4 f_Fanning`

and Darcy–Weisbach pressure loss is:

`Delta p = f_Darcy (L/D_h) rho v^2 / 2`.

The same physical loss written with the Fanning factor is:

`Delta p = 4 f_Fanning (L/D_h) rho v^2 / 2`.

Therefore a correctly paired Darcy/Fanning convention gives the same pressure loss; merely changing names does not change the physical answer.

The Moody explicit correlation used by Zhao et al.,

`f = 0.0055 [1 + (20000 epsilon/D + 10^6/Re)^(1/3)]`,

is widely documented and used as a Moody/Darcy friction-factor approximation, including implementations that place it directly in the Darcy–Weisbach relation.

### Numerical fingerprint
The source-reported pressure `0.02284 MPa/m` is numerically consistent with taking the displayed Moody/Darcy factor and dividing it by approximately four before substitution into the displayed Darcy equation.

That is equivalent to treating:

`f_effective ~= lambda_published / 4`

inside the Darcy equation.

This reproduces the factor-of-four fingerprint, but the article text and displayed equations do not provide an explicit justification for that conversion.

## Hydraulic diameter / hydraulic radius finding
The paper derives the lubrication-layer equivalent hydraulic diameter using the standard annular hydraulic-diameter definition:

`D_h = 4 A/P`

and simplifies it to:

`de = 2 delta`.

This is already a hydraulic **diameter**, not a hydraulic radius.

For a circular hydraulic convention:

`D_h = 4 R_h`.

Substituting hydraulic radius where hydraulic diameter is required would change the pressure in the opposite direction (increase it by a factor of four), not reduce the literal result to the reported value.

Therefore hydraulic-radius substitution does **not** explain the reported source value.

## Engineering conclusion
The current evidence does not support a scientifically defensible correction of Equation (27).

Most plausible numerical interpretation:
- the reported value carries a hidden `/4` friction-factor convention or arithmetic step;
- however the paper labels the correlation as a resistance coefficient used in Darcy's formula and does not expose that conversion in Equations (14), (25), (26), or (27).

Accordingly TOLUE must treat this as an unresolved source inconsistency, not as an authorized model coefficient.

## TOLUE decision
1. Keep the implemented Gao/Zhao primitive state evaluator and literal Equation (27) diagnostic for research/reproduction only.
2. Do not add an undocumented `/4` factor to production or candidate physics.
3. Do not use the Gao/Zhao one-dimensional base-pressure model as the production straight-pipe engine.
4. Keep `PRESSURE-ELBOW-002` isolated as a numerically verified empirical bend-factor research utility.
5. Full Gao bend-pressure integration remains blocked.
6. Prefer an independently reproducible elbow family for production admission, especially Park et al. 2020 real-scale bend evidence once the primary equation set can be captured and verified.

## Reopening condition
The Gao/Zhao full pressure path may be reconsidered only if at least one of the following becomes available:
- author correction/erratum explicitly resolving the factor of four;
- source code or calculation worksheet demonstrating the intended convention;
- an independently reproducible published case using the same equations and yielding the reported values without hidden calibration;
- direct clarification from the authors with enough detail to reproduce the calculation.

Until then, the discrepancy is part of the model's documented limitation and must remain visible in scientific provenance.
