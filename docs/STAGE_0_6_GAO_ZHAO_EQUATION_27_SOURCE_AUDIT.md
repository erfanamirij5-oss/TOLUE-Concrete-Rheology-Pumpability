# Stage 0.6 — Gao/Zhao Equation (27) Version-of-Record Audit

## Purpose
Freeze the exact published Equation (27) from Gao/Zhao's 2024 one-dimensional straight-pipe model and document the numerical inconsistency observed when the paper's own validation values are substituted literally.

Primary reference:
Gao et al., *One-Dimensional Modeling of the Pressure Loss in Concrete Pumping and Experimental Verification*, Applied Sciences 14(7), 3101, DOI 10.3390/app14073101.

## Version-of-record equation
The published straight-pipe pressure difference is:

`Δp_m = 0.0055 [1 + (20000 K_d + 10^6 / Re)^(1/3)] (l ρ_s v^2)/(2 d_e) + (z_2 - z_1) γ`

For a horizontal unit-length reproduction:

`Δp_m / L = λ ρ_s v^2 / (2 d_e)`

with:

`λ = 0.0055 [1 + (20000 K_d + 10^6 / Re)^(1/3)]`

`d_e = 2 δ`

The paper's validation paragraph reports the following reference state:
- pumping flow: `42 m³/h`
- source-rounded mean velocity: `v = 0.951 m/s`
- lubrication-layer viscosity: `2.50 Pa·s`
- lubrication-layer thickness: `δ = 2.09 mm`
- equivalent diameter: `d_e = 4.18 mm`
- equivalent aggregate diameter: `K = 15.8 mm`
- relative roughness: `K_d = 3.7799`
- Reynolds number: `Re = 3.3392`
- Modi resistance coefficient: `λ = 0.4021`
- reported calculated pressure loss per unit length: `0.02284 MPa`
- reported measured pressure loss: `0.02823 MPa`
- reported relative error: `19.09%`

## Literal reproduction
Using the published rounded values and `ρ_s = 2100 kg/m³` used in the TOLUE source reconstruction:

`λ ρ_s v² / (2 d_e)`

produces:

`0.0913499101 MPa/m`

The ratio to the source-reported `0.02284 MPa/m` is:

`3.999558...`

which is effectively a factor of four.

## Finding
The discrepancy does not originate in the already reproduced source values for:
- `d_e`
- `K_d`
- `Re`
- `λ`

Instead, it lies in the final mapping from the friction coefficient / velocity / hydraulic geometry to the reported pressure loss, or in an unstated convention/value in the worked example.

## Candidate explanations still requiring evidence
Possible causes include, but are not limited to:
- Darcy-vs-Fanning friction-factor convention;
- hydraulic-radius versus diameter convention;
- velocity definition differing between the worked example and the displayed equation;
- a hidden geometric factor in the derivation;
- use of a different mortar density or effective section quantity not repeated in the validation paragraph;
- typographical inconsistency in the published worked example.

None of these is accepted by TOLUE without source evidence.

## TOLUE engineering decision
1. Do not insert an arbitrary `1/4` correction.
2. Keep the literal Equation (27) evaluator diagnostic-only.
3. Do not expose it as a production pressure result.
4. Do not integrate it with `pipeline.ts`.
5. Preserve the discrepancy as a regression test so future refactors cannot silently normalize it away.
6. Full Gao/Zhao pressure execution remains blocked until the convention mismatch is independently resolved or a source-author/erratum/secondary derivation establishes the correct interpretation.

## Next task
Search for an authoritative derivation or erratum clarifying the friction-factor convention in this source family. If none is available, retain the Gao/Zhao model strictly as a research comparison path and do not promote it into TOLUE production hydraulics.
