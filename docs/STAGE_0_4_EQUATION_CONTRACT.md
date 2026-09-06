# Stage 0.4 — Equation & Solver Contract

Status: engineering specification; production equations remain evidence-gated.

## Purpose
Translate the Stage 0 scientific evidence into an executable contract without inventing coefficients, defaults, or unsupported correlations.

## 1. Canonical SI units
All engineering-core calculations use SI internally.

- length: m
- diameter/radius: m
- area: m²
- volume: m³
- flow rate: m³/s
- velocity: m/s
- pressure / pressure loss: Pa
- pressure gradient: Pa/m
- shear stress / yield stress: Pa
- dynamic/plastic viscosity: Pa·s
- density: kg/m³
- mass: kg
- gravitational acceleration: m/s²
- temperature: °C for stored project data; K only where an equation explicitly requires absolute temperature

Display conversions are UI/report concerns and MUST NOT alter stored canonical values.

## 2. Provenance classes
Every numerical input used by a solver MUST carry one provenance class:

- measured — laboratory/field instrument result
- manufacturer — pump/pipe/equipment certified data
- standard — value or limit explicitly sourced to a controlled standard
- calibrated — derived from a documented calibration dataset
- inferred — computed from another measured quantity using a documented equation
- assumed — engineer-entered assumption; never silent
- predicted — empirical/ML prediction with model/version/domain metadata

Critical solver inputs may not be silently defaulted.

## 3. Rheology contract
Supported constitutive families are registered, versioned models rather than free-form equations.

### Bingham
Required parameters:
- bulk yield stress τ0 [Pa]
- bulk plastic viscosity μp [Pa·s]

Constitutive relation in yielded material:
τ = τ0 + μp·γdot

The implementation MUST distinguish yielded and unyielded/plug regions. It MUST NOT apply the yielded relation below the yield condition.

### Advanced families
Herschel–Bulkley and Modified Bingham are reserved model families. They remain disabled until their exact equation forms, parameter conventions, numerical implementation, and verification cases are separately registered.

## 4. Lubrication-layer contract
The lubrication layer is a separate material/tribological domain, not a cosmetic pipe-wall effect.

A production simulation MUST identify the LL input mode:
- measured tribology
- calibrated from a project-specific pumping dataset
- validated empirical prediction
- unavailable

If unavailable, a pressure prediction requiring LL properties MUST be blocked or explicitly downgraded to a non-production preliminary study. No universal LL thickness, yield stress, or viscosity is permitted.

## 5. Straight-pipe solver interface
Input contract:
- modelId + modelVersion
- pipe internal radius R [m]
- pipe length L [m]
- target volumetric flow Q [m³/s]
- bulk rheology + provenance
- LL rheology/tribology + provenance
- LL thickness only when required by the selected model and supported by evidence
- temperature/time/sample metadata where relevant

Output contract:
- pressure gradient ΔP/L [Pa/m]
- straight-pipe pressure loss ΔP [Pa]
- flow regime classification
- plug/yielded-region information when the model supports it
- velocity/shear profile when the model supports it
- convergence status
- applicability status
- assumptions
- warnings
- uncertainty/validation metadata
- complete model/reference provenance

The primary Stage-1 solver candidate is the experimentally validated two-fluid Bingham family represented by Khatib & Khayat (2021), subject to exact equation transcription and independent numerical verification before production enablement.

## 6. Elevation term
The hydrostatic contribution is treated separately from rheological friction:

ΔP_elevation = ρ g Δz

Sign convention MUST be explicit. Upward pumping increases required pressure; downward elevation reduces the static contribution but MUST NOT be allowed to create physically invalid pump states.

Density provenance is required.

## 7. Fittings and flexible elements
Elbows, reducers, transitions, hoses, valves and boom components are separate segment classes.

Until concrete-specific validated models are registered:
- no water-flow Darcy/K-factor substitution is allowed as a production concrete model;
- no arbitrary equivalent-length constants are allowed;
- their pressure contribution is `not_computed` rather than zero.

This prevents under-reporting total required pump pressure.

## 8. Pipeline aggregation
Total required pressure may only be declared when every material pressure-contributing segment is computed with an enabled model.

Conceptually:
P_required = ΣΔP_straight + ΣΔP_fittings + ΔP_elevation + other validated contributions

If one required contribution is unavailable, the result state is `incomplete` and MUST NOT be presented as a complete pump selection pressure.

## 9. Pump operating margin
When certified pump capability at the required operating condition is available:

margin = P_available - P_required

A percentage margin may be reported only when its denominator and interpretation are explicitly defined. Pump nominal maximum pressure MUST NOT automatically be treated as available pressure at every flow rate.

## 10. Applicability gate
Before solver execution, validate at minimum:
- positive finite geometry
- Q > 0
- physically valid rheological parameters
- required LL parameters present
- model supports selected concrete/rheology family
- inputs lie inside documented calibration/validation domain where such bounds exist
- provenance quality satisfies selected analysis class

Gate states:
- valid-production
- valid-preliminary
- out-of-domain
- insufficient-data
- invalid-input

Only `valid-production` may generate an unqualified engineering pressure result.

## 11. Numerical requirements
- deterministic solvers must be reproducible for identical input + model version
- numerical tolerances are version-controlled
- iterative solvers return iteration count, residual/error metric and convergence state
- failure to converge is a failed result, never a plausible fallback number
- internal precision is not rounded for presentation until the UI/report layer

## 12. Uncertainty contract
The engine MUST separate:
- measurement uncertainty
- calibration/model error
- numerical error
- scenario/assumption uncertainty

A confidence label without documented basis is prohibited.

## 13. Golden verification cases
The first solver implementation MUST include independent cases for:

G01 — Newtonian limiting case (τ0 = 0) where mathematically applicable.
G02 — Bingham plug-flow regime.
G03 — Bingham case with yielded bulk region.
G04 — monotonic Q increase: pressure demand must respond consistently within model domain.
G05 — pipe diameter sensitivity.
G06 — LL viscosity/tribology sensitivity.
G07 — vertical static head checked independently against ρgΔz.
G08 — unit-conversion invariance at the application boundary.
G09 — invalid negative/zero geometry rejection.
G10 — missing LL data rejection for LL-dependent production model.
G11 — out-of-domain model rejection/downgrade.
G12 — reproducibility: identical input/model version yields identical output.

Golden expected values MUST come from independent analytical calculations, published validation data, or a separately implemented reference calculation—not from copying the production solver output into fixtures.

## 14. Scientific references controlling this contract
- Khatib, R.; Khayat, K.H. (2021), Pumping of Flowable Concrete: Analytical Prediction and Experimental Validation, ACI Materials Journal 118(5), DOI 10.14359/51732928.
- Feys, D.; Khayat, K.H.; Perez-Schell, A.; Khatib, R. (2015), Prediction of pumping pressure by means of new tribometer for highly-workable concrete, Cement and Concrete Composites 57, 102–115, DOI 10.1016/j.cemconcomp.2014.12.007.
- Kwon, S.H. et al. (2013), Prediction of Concrete Pumping Part I and Part II, ACI Materials Journal 110(6), DOI 10.14359/51686332 and 10.14359/51686333.

## 15. Production-enable rule
No equation is production-enabled merely because it appears in this specification. Enablement requires:
1. exact source/equation review,
2. parameter/unit convention review,
3. applicability-domain record,
4. independent implementation test,
5. golden verification cases,
6. regression tests,
7. model-registry status = verified.
