# TOLUE Tier-B Published / Full-Scale Verification Source Register

Status: P0-02 in progress

## Admission rule
A publication is only promoted from `candidate` to `accepted_verification_case` when the exact numerical inputs required by the executable model and the measured comparison output are traceable to the source material. Missing values are never back-filled from TOLUE output, generic defaults, or memory.

## Candidate TB-FEYS-2015-001

- Status: `candidate_source_acquisition`
- Reference ID: `FEYS-KHAYAT-PEREZ-SCHELL-KHATIB-2015-CCC-57-102-115`
- Title: *Prediction of pumping pressure by means of new tribometer for highly-workable concrete*
- Authors: Dimitri Feys; Kamal H. Khayat; Aurelien Perez-Schell; Rami Khatib
- Journal: Cement and Concrete Composites, Volume 57, pages 102-115
- Publication year: 2015
- DOI: `10.1016/j.cemconcomp.2014.12.007`
- Evidence class: peer-reviewed full-scale pumping study

### Publicly confirmed study facts
- The experimental program pumped 25 concrete mixtures, including 18 self-consolidating mixtures.
- The pumping circuit was a 30 m closed loop.
- The article reports pump/circuit configuration, pressure and flow-rate measurements, rheometer measurements, and tribometer measurements used to predict pumping pressure.
- The study includes horizontal straight sections with pressure measurements suitable in principle for pressure-gradient comparison.

### Required before a TOLUE verification fixture may be created
For at least one individual mixture / operating point, all of the following must be extracted from the controlled source and recorded with page/table/figure trace:
1. volumetric flow rate Q;
2. pipe internal radius/diameter for the measured straight section;
3. bulk Bingham yield stress;
4. bulk Bingham plastic viscosity;
5. lubrication-layer Bingham yield stress / interface yield parameter in a form demonstrably compatible with the TOLUE model;
6. lubrication-layer plastic viscosity / viscous parameter in a form demonstrably compatible with the TOLUE model;
7. lubrication-layer thickness, or an independently documented reconstruction method compatible with the source model;
8. measured pressure loss and sensor spacing, or directly reported pressure gradient;
9. units and any transformations;
10. source artifact version/hash.

### Current exclusion from accepted Tier-B evidence
This candidate is **not yet an accepted TOLUE verification case** because the exact per-mixture numerical table values required by the current two-fluid solver have not yet been acquired in a controlled, auditable form. No placeholder literature numbers will be committed.

## Verification implementation
The executable verification contract is implemented in:
- `src/engineering/core/publishedFullScaleVerification.ts`
- `src/engineering/core/publishedFullScaleVerification.test.ts`

The harness intentionally has no universal pass/fail percentage. It reports signed absolute and relative error. Acceptance tolerances, if any, must be justified per evidence family after uncertainty, instrumentation, model-form limitations, and source methodology are reviewed.
