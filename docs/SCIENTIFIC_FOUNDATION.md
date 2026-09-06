# TOLUE Scientific Foundation — Baseline v0.1

## 1. هدف

این سند پایه علمی اولیه نرم‌افزار TOLUE Concrete Rheology & Pumpability است. هیچ مدل محاسباتی صرفاً به دلیل مناسب بودن برای UI یا تولید یک Score وارد Engineering Core نمی‌شود.

## 2. طبقه‌بندی اجباری خروجی‌ها

هر خروجی مهندسی باید یکی از این کلاس‌ها را داشته باشد:

1. `STANDARD_REQUIREMENT` — الزام یا معیار مستند استانداردی
2. `PHYSICAL_MODEL` — مدل مبتنی بر روابط فیزیکی/مکانیکی
3. `EMPIRICAL_MODEL` — رابطه تجربی با دامنه اعتبار و منبع مشخص
4. `TOLUE_ENGINEERING_INDEX` — شاخص اختصاصی با فرمول و وزن‌های شفاف
5. `AI_PREDICTION` — پیش‌بینی داده‌محور با مدل، Dataset، Version و عدم‌قطعیت مشخص

هیچ خروجی با منشأ نامعلوم مجاز نیست.

## 3. مراجع پایه تأییدشده

### ACI PRC-304.2-17 — Guide to Placing Concrete by Pumping Methods

دامنه اولیه استفاده در TOLUE:
- concrete pumps
- rigid/flexible pipelines, couplings and accessories
- pumpable mixture proportioning context
- trial mixture evaluation
- lightweight aggregate pumping considerations
- equipment placement and line routing
- mixture consistency and field pumping considerations

نکته Versioning: کمیته ACI 304 بازنگری سند Pumping را برای شروع در 2026 در برنامه خود اعلام کرده است؛ بنابراین Standards Engine نباید شماره ویرایش را Hard-code کند.

### ACI 211.9R-18 — Guide to Selecting Proportions for Pumpable Concrete

دامنه اولیه استفاده:
- proportioning hydraulic-cement concrete intended for pumping
- numerical guidance for mixture component proportions where applicable
- relationship between proportions and pumpability
- relationship between pumping and supplied concrete
- مکمل ACI 304.2R و اسناد proportioning مرتبط

### ACI PRC-238.1-26 — Measurements of Workability and Rheology of Fresh Concrete

دامنه اولیه استفاده:
- definitions of rheology/workability
- workability and rheological test landscape
- factors affecting fresh-concrete performance
- field application of rheology/material science
- applicability from zero-slump to self-consolidating concrete

### ASTM C1749-25 — Rheological Properties of Hydraulic Cementitious Paste

دامنه اولیه استفاده:
- rotational rheometer measurement framework for fresh hydraulic cement paste
- Bingham yield stress
- Bingham plastic viscosity
- apparent viscosity
- procedure sensitivity and reproducibility metadata

محدودیت مهم: این استاندارد مربوط به cementitious paste است و نباید بدون مدل انتقال/اعتبارسنجی به‌عنوان اندازه‌گیری مستقیم rheology بتن کامل استفاده شود.

### ASTM SCC / Workability family — baseline

در Standards Registry اولیه حداقل باید برای SCC و Workability رکوردهای Versioned داشته باشیم، از جمله:
- ASTM C1611/C1611M-21 — Slump Flow of SCC
- ASTM C1621/C1621M-17(2023) — Passing Ability of SCC by J-Ring
- ASTM C1874-20 — Rheological Properties of Cementitious Materials Using Coaxial Rotational Rheometer

## 4. زنجیره Engineering Core هدف

Material Characterization
→ Mix Composition
→ Aggregate PSD / Combined Gradation
→ Packing descriptors
→ Fresh Concrete State
→ Rheology
→ Lubrication / Interface behavior
→ Pipeline Geometry
→ Flow / Pressure Loss
→ Pump Demand
→ Blocking / Stability Risk
→ Pumpability Assessment
→ 3D Engineering Visualization
→ Diagnostics / Optimization
→ Report & Traceability

## 5. Concrete Type Routing

انتخاب «نوع بتن» فقط UI Selection نیست. Concrete Type باید تعیین کند:
- required inputs
- optional inputs
- applicable standards
- applicable engineering models
- invalid model combinations
- validation gates
- report sections

Baseline families:
- بتن معمولی پمپی
- بتن خودتراکم SCC
- بتن پرمقاومت HPC/HSC
- بتن فوق توانمند UHPC
- بتن سبک
- بتن سنگین
- بتن الیافی
- بتن حجیم، در صورت کاربرد پمپاژ
- خانواده‌های ویژه بعدی فقط پس از تعریف Scientific Applicability

## 6. Engineering Result Contract

هر نتیجه باید حداقل این metadata را حمل کند:

- `value`
- `unit`
- `resultClass`
- `methodId`
- `methodVersion`
- `referenceIds[]`
- `standardEditionIds[]`
- `applicability`
- `assumptions[]`
- `limitations[]`
- `validationStatus`
- `uncertainty` در صورت قابل تعریف بودن
- `inputSnapshotHash`

## 7. Simulation Integrity Rule

نمایش سه‌بعدی باید Visualization خروجی Engine باشد. تا زمانی که یک solver فیزیکی/عددی مشخص با Validation تعریف نشده است، Animation جریان نباید CFD/DEM/Physical Simulation نامیده شود.

## 8. Scoring Integrity Rule

TOLUE Pumpability Score و Sub-scoreها تا زمانی که:
- تعریف ریاضی
- وزن‌ها
- حساسیت
- دامنه کاربرد
- Validation/Calibration
- نحوه برخورد با Missing Data

مشخص نشده‌اند، حق ورود به نسخه Production را ندارند.

## 9. مرحله بعدی تحقیق

Scientific Reference Matrix باید برای هر Feature شامل این ستون‌ها شود:

`Feature | Concrete Type | Input | Output | Standard | Scientific Source | Equation/Method | Model Class | Applicability | Limitations | Calibration Need | Validation Case | Implementation Status`

ماتریس باید پیش از تثبیت Engineering Core تکمیل و در طول توسعه Versioned شود.
