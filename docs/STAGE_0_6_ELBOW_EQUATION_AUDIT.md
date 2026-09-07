# Stage 0.6 — Elbow Equation Capture Audit

## Purpose
This document records the equation-capture status for the first elbow-specific concrete-pumping pressure-loss model candidate before any implementation is allowed in the TOLUE engineering core.

Candidate model ID: `PRESSURE-ELBOW-001`  
Current lifecycle status: `research`  
Implementation status: **blocked pending exact primary-equation capture**

## Primary candidate
Park et al. (2020), *Analysis on Pressure Losses in Pipe Bends Based on Real-Scale Concrete Pumping Tests*, ACI Materials Journal 117(3), 205–216, DOI 10.14359/51724616.

Why it remains the lead source:
- concrete-specific;
- real-scale pumping tests;
- directly studies additional pressure loss in pipe bends;
- rheology is part of the analysis rather than replaced by generic Newtonian fitting coefficients.

## Evidence-capture rule
Abstract-level or secondary-source descriptions are insufficient for code. TOLUE requires the complete equation set from the primary paper or an author/publisher copy that exposes all symbols, fitted coefficients, geometry definitions, calibration data and validation statistics.

Until that evidence is available, the following fields are intentionally unresolved and MUST NOT be guessed:
- mathematical definition of bend-only pressure loss;
- whether and how straight-pipe baseline pressure is subtracted;
- bend radius definition and normalization;
- bend angle dependence;
- pipe diameter/radius dependence;
- flow-rate dependence;
- bulk-concrete rheology variables;
- lubrication/interface variables, if present;
- fitted coefficients and their dimensions;
- calibration domain;
- validation error metrics;
- limits on mixture class, consistency, pipe size, pumping rate and bend geometry.

## Classification status
`PRESSURE-ELBOW-001` is not yet classified as `PHYSICAL_MODEL` or `EMPIRICAL_MODEL`.

Reason: the exact derivation/calibration structure has not yet been captured from the primary source. Classification must follow equation audit, not precede it.

## Secondary evidence
### Kwon et al. (2013)
Lubrication-layer evidence supports the general TOLUE architecture in which near-wall/interface behavior materially affects pumping pressure. This supports rejecting generic water-system bend coefficients as a default concrete model.

### Zhaidarbek et al. (2023)
Provides rigorous two-fluid straight-pipe analytical context for non-Newtonian concrete + lubrication-layer systems, but does not itself authorize elbow-loss equations.

### Applied Sciences (2024), 14(19), 8824
A concrete-specific bend correction model exists and may be retained as a comparison/research family. It must not be silently substituted for Park et al. or treated as universal. If its complete equations and domain are captured, it should receive a separate model ID rather than being mixed into `PRESSURE-ELBOW-001`.

## No-double-counting requirement
Any future elbow model must define whether its output represents:
1. total pressure drop across a bend-containing section, or
2. excess/local bend pressure drop above the straight-pipe baseline.

TOLUE integration may only add a local contribution to `pipeline.ts` if the source equation is explicitly an excess/local term. If the source predicts total section pressure, the straight-pipe component must be removed consistently before integration. Silent double counting is prohibited.

## Minimum input contract before implementation
The following must be resolved from the primary model before TypeScript interfaces are changed:
- `pipeRadiusM` or `pipeDiameterM`;
- `bendRadiusM` and its exact geometric definition;
- `bendAngleRad` or `bendAngleDeg`;
- `targetFlowRateM3s`;
- all required rheological quantities and their constitutive-model assumptions;
- lubrication-layer inputs if explicitly required;
- any source-specific calibrated coefficients with units and provenance.

## Verification gate
Before `PRESSURE-ELBOW-001` can move to `implemented`, TOLUE must have:
- dimensional consistency check;
- at least one published numerical case reproduced from the primary paper;
- zero/limiting-angle behavior where physically/source-defined;
- flow-rate monotonicity check only if supported by the model domain;
- bend-radius sensitivity check only if supported by the published equation;
- explicit out-of-domain rejection;
- comparison showing local loss is not double-counted with the existing straight-pipe solver;
- deterministic regression tests.

## Current engineering decision
Do **not** modify `pipeline.ts` yet.

`elbow` remains `not_computed` and keeps the full pipeline result `incomplete` until the primary equation set is captured and verified.

This is an intentional fail-closed state, not a missing feature to be patched with an arbitrary `K` factor or equivalent length.
