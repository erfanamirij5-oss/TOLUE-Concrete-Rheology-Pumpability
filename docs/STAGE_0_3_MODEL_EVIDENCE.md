# Stage 0.3 — Model-Specific Evidence Review

Status: engineering research baseline; production enablement remains gated.

## 1. Purpose

This document narrows the scientific basis for the first TOLUE pumping engine. It does **not** authorize formulas merely because they appear in literature. A model becomes production-enabled only after its exact equation set, units, applicability domain, numerical implementation and verification cases are independently reproduced.

## 2. Primary straight-pipe model family

### 2.1 Khatib–Khayat two-fluid analytical model (2021)

Evidence class: experimental + analytical physics model.

Reference: R. Khatib and K. H. Khayat, *Pumping of Flowable Concrete: Analytical Prediction and Experimental Validation*, ACI Materials Journal 118(5), 2021, DOI 10.14359/51732928.

The published model predicts pumping pressure as a function of volumetric flow rate, pipe diameter, bulk-concrete rheology and lubrication-layer (LL) rheology. Concrete and LL are represented as Bingham materials and distinct flow zones are resolved analytically.

Reported validation used 14 high-strength flowable mixtures, slump flow 500–765 mm, and 113 comparison data points. Reported LL thickness obtained by reverse regression was approximately 2–5 mm for those tested mixtures.

**TOLUE decision:** adopt this as the leading candidate for the first validated straight-pipe pressure engine for flowable concrete, subject to exact equation reproduction and verification. The 2–5 mm observation MUST NOT become a universal default LL thickness.

Required inputs:
- Q — volumetric flow rate
- D/R — pipe internal diameter/radius
- bulk yield stress
- bulk plastic viscosity
- LL yield stress
- LL plastic viscosity
- LL thickness

Output candidates:
- pressure loss per unit length
- pressure-flow relation
- radial flow-zone state where supported by reproduced equations

Applicability gate:
- Bingham adequacy must be checked from measured/calibrated rheology.
- LL inputs must have provenance; no silent synthetic LL properties.

### 2.2 Nonlinear extension: Herschel–Bulkley / modified Bingham (2023)

Reference: *Analytical predictions of concrete pumping: Extending the Khatib–Khayat model to Herschel–Bulkley and modified Bingham fluids*, Cement and Concrete Research 163 (2023) 107035, DOI 10.1016/j.cemconres.2022.107035.

The work extends coaxial two-fluid pumping analysis to nonlinear rheological behavior and provides flow-rate/pressure-drop, shear-rate and velocity-distribution formulations.

**TOLUE decision:** retain as an advanced model family, not the default v1 model. It is selected when measured rheology demonstrates material nonlinearity and the required parameters are available.

## 3. Lubrication layer / interface model

The LL is a primary pumping mechanism, not a cosmetic visualization feature. Literature reports strong evidence that the near-wall layer is depleted in coarse particles and has rheology different from bulk concrete.

References:
- Kwon et al., *Prediction of Concrete Pumping: Part II—Analytical Prediction and Experimental Verification*, ACI Materials Journal 110(6), 2013, DOI 10.14359/51686333.
- *Lubrication layer properties during concrete pumping*, Cement and Concrete Research.
- Khatib & Khayat (2021), above.

Kwon et al. report full-scale tests using 350 m and 548 m pipelines and seven mixtures, with LL rheology measured by tribometer used to predict flow rate.

**TOLUE LL provenance classes:**
1. `measured_tribometer`
2. `measured_or_inferred_full_scale`
3. `calibrated_from_project_data`
4. `literature_correlation` — only inside demonstrated domain
5. `assumption` — preliminary analysis only; never silently treated as validated

LL thickness and LL rheology are separate inputs/uncertainties.

## 4. Rheology model selection

### Bingham
τ = τ0 + μp γdot, for yielded material.

Use only when linear post-yield behavior is an acceptable representation over the relevant shear-rate range.

### Herschel–Bulkley
τ = τ0 + K γdot^n.

Candidate for nonlinear/shear-thinning or shear-thickening behavior when fitted data support it.

### Modified Bingham
Candidate when nonlinear post-yield response is demonstrated and the selected literature implementation is reproduced.

**Rule:** concrete type alone never chooses the rheological equation. Model selection requires data-fit evidence, provenance and applicability checks.

## 5. Vertical pressure contribution

Static elevation contribution is treated separately from rheological frictional loss:

ΔP_static = ρ g Δz

where density and elevation difference must be project inputs or traceable measured/derived quantities.

**TOLUE decision:** deterministic physics component; eligible for production after unit/sign-convention tests.

## 6. Elbows, reducers, hoses and local losses

Stage 0.3 finding: do **not** import water-pipe K factors or equivalent-length tables as universal concrete-pumping physics. Concrete is non-Newtonian and LL/interface behavior is central. Until component-specific evidence and calibration are accepted, local-loss modules remain blocked or explicitly empirical/project-calibrated.

## 7. Pressure evolution along long lines

Published work reports nonlinear pressure-loss evolution associated with changes in bulk and LL rheology during pumping. Therefore TOLUE must distinguish:
- `stationary_segment_model` — properties assumed constant along a segment/run;
- `evolving_rheology_model` — future calibrated model where rheological evolution along the line is represented.

The v1 engine must disclose the stationary-property assumption whenever used.

## 8. CFD/DEM status

2024 four-way CFD–DEM research demonstrates a numerical route to model shear-induced particle migration and LL formation, including PSD, aggregate concentration and mortar rheology effects.

**TOLUE decision:** CFD/DEM is research/advanced validation scope, not a claim for the first commercial simulator. The first 3D product is an engineering digital twin that visualizes outputs of validated analytical/empirical engines.

## 9. Blocking / plugging risk

No universal production formula is approved in this stage. Blocking is multi-factorial (PSD, maximum aggregate size, pipe diameter, geometry, stability, rheology, LL, fibers where applicable, operational conditions). The initial module remains `blocked` until a defensible model and validation domain are documented.

Rule-based standard constraints may be shown independently and must not be mislabeled as a physical probability of blockage.

## 10. Pumpability score

The TOLUE Pumpability Score remains blocked. It may later be implemented as an explicitly proprietary Engineering Index after its inputs, weights, gates, sensitivity analysis and validation rationale are frozen. It must never masquerade as an ACI/ASTM/ISO requirement.

## 11. Minimum verification cases before pressure model enablement

- dimensional/unit verification
- zero/near-zero flow boundary behavior
- monotonic Q–ΔP behavior inside model domain
- pipe-radius sensitivity
- yield-stress sensitivity
- viscosity sensitivity
- LL thickness sensitivity
- LL rheology sensitivity
- independent reproduction of at least one published case with source data sufficient for reproduction
- numerical inversion convergence tests when solving ΔP from target Q
- deterministic repeatability
- out-of-domain rejection tests

## 12. Production status after Stage 0.3 evidence pass

| Module | Candidate basis | Status |
|---|---|---|
| Bulk Bingham rheology | constitutive model + measured fit | candidate |
| Nonlinear rheology | Herschel–Bulkley / modified Bingham | advanced candidate |
| Straight-pipe pressure | Khatib–Khayat two-fluid family | candidate, verification required |
| Static elevation pressure | ρgΔz | candidate, verification required |
| LL measured-input handling | tribometer/project data | candidate |
| LL prediction from mix alone | insufficient universal basis | blocked |
| Elbow/reducer/hose loss | evidence/calibration pending | blocked |
| Evolving pressure/rheology | research/calibration pending | blocked |
| Blocking probability | validated model pending | blocked |
| Pumpability Score | TOLUE index design pending | blocked |
| CFD/DEM | advanced research module | deferred |

## 13. Next engineering task

Stage 0.4 shall convert the accepted candidate models into an executable **Model Contract + Verification Specification** before UI implementation. It will define exact equations, SI units, numerical solver requirements, input provenance schema, uncertainty flags, applicability checks and golden verification cases.