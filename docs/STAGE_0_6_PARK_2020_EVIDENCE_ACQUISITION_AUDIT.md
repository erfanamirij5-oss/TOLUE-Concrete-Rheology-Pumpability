# Stage 0.6 — Park et al. (2020) Elbow Evidence Acquisition Audit

## Purpose
Determine what can be admitted into TOLUE for `PRESSURE-ELBOW-001` from currently accessible primary/secondary evidence without inventing equations, coefficients, or geometry rules.

## Primary reference
Park, C. K.; Jang, K. P.; Jeong, J. H.; Sohn, Y. S.; Kwon, S. H. (2020), *Analysis on Pressure Losses in Pipe Bends Based on Real-Scale Concrete Pumping Tests*, ACI Materials Journal 117(3), 205–216, DOI 10.14359/51724616.

## Primary-source facts verified
The ACI record confirms:
- publication: ACI Materials Journal, Volume 117, Issue 3;
- pages: 205–216;
- date: May 2020;
- subject: concrete pumping pressure loss in pipe bends;
- model context: rheological properties of concrete and lubricating layer;
- method: real-scale pumping tests.

The abstract/transport-index record additionally states:
- horizontal pipeline lengths of 133 m, 369 m, and 560 m were used;
- four concrete mixtures were used in those tests;
- data from earlier 350 m and 548 m pumping tests were also analyzed;
- the observed pressure loss associated with pipe bends was approximately two times that of a straight pipeline in the studied data.

## Critical interpretation rule
The reported "approximately two times" observation is **not** a universal coefficient and must not be implemented as:

`DeltaP_elbow = 2 * DeltaP_straight`

or

`DeltaP_local = DeltaP_straight`

without the complete paper's definition of comparison length, bend geometry, pressure-tap locations, flow/rheology state, normalization basis, and statistical treatment.

The abstract-level statement is evidence that bend losses are materially larger in the tested concrete-pumping systems, not an executable engineering law.

## Full-text acquisition result
Current accessible sources checked:
- ACI abstract portal: bibliographic metadata + abstract only;
- TRID/TRB record: abstract-level summary only;
- ResearchGate: publication metadata and request-full-text path; no accessible full text;
- scholarly index mirrors: bibliographic metadata only.

No accessible source in the current evidence set exposes the exact Park et al. equation set, fitted coefficients, tables, figures, test geometry details, or verification values required for deterministic reproduction.

## What is still missing before implementation
TOLUE must obtain and transcribe from the full primary paper:

1. exact definition of bend pressure loss;
2. exact definition of the straight-pipe comparison/baseline;
3. pipe internal diameter(s);
4. bend radius/diameter ratio and bend angle(s);
5. physical bend arc length and any equivalent-length construction;
6. locations and spacing of pressure sensors around bends;
7. flow-rate/velocity range;
8. concrete mixture identities and fresh-state/rheology data;
9. lubrication-layer assumptions or measured parameters;
10. any regression/equation coefficients and their units;
11. any dimensionless groups used;
12. calibration/validation split, if any;
13. error metrics and scatter;
14. at least one fully reproducible numerical case.

## Admission decision
`PRESSURE-ELBOW-001` remains **research / evidence-confirmed / equation-blocked**.

Allowed now:
- cite Park et al. as strong full-scale evidence that bend loss is non-negligible and concrete-specific;
- use the study to justify an elbow-specific model family;
- use the reported approximately-two-times observation only as qualitative/benchmark evidence in research documentation.

Not allowed now:
- hard-code factor 2;
- derive a K-factor from the abstract;
- derive an equivalent length from the abstract;
- infer bend-radius or angle dependence not explicitly available;
- classify the model as implemented or numerically verified;
- connect it to `pipeline.ts`.

## Relationship to PRESSURE-ELBOW-002
- `PRESSURE-ELBOW-001` (Park 2020): stronger real-scale experimental evidence, but exact executable equation is unavailable in the current evidence set.
- `PRESSURE-ELBOW-002` (Gao 2024): equation/regression openly accessible and isolated lambda evaluator numerically verified, but the full source pressure chain contains an unresolved factor-of-four inconsistency and therefore remains research-only.

Neither family is currently eligible for production elbow pressure integration.

## Engineering next path
Until the Park full paper is obtained, the safest implementable path for real projects is a **traceable project-calibrated local-loss input** rather than a universal elbow formula. Such a path must be clearly classified as source/calibrated data, retain provenance and uncertainty, and never be silently generalized across projects, geometries, mixtures, or pump systems.
