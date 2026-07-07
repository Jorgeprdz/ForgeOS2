# Forge Product Intelligence Unified Read Model Decision Lock 073F

PHASE=073F_PRODUCT_INTELLIGENCE_UNIFIED_READ_MODEL_DECISION_LOCK

STATUS=PASS

DECISION=PASS_073F_PRODUCT_INTELLIGENCE_UNIFIED_READ_MODEL_DECISION_LOCK

LOCKED_DECISION=PRODUCT_INTELLIGENCE_UNIFIED_READ_MODEL_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_CATALOG

NEXT=074A_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_SCOPE

## Purpose

073F decision-locks the Product Intelligence Unified Read Model as a local/static/read-only reference catalog.

This lock allows Forge to return to Quote Preview promotion only through a Product Intelligence binding scope. Quote Preview must consume Product Intelligence references before using quote-specific preview engines.

## Base Confirmation

073E is closed in commit `1e90a5f docs: lock product intelligence read model qa`.

073E QA audit confirms:

- `status`: `PASS`
- `decision`: `PASS_073E_PRODUCT_INTELLIGENCE_UNIFIED_READ_MODEL_QA_LOCK`
- `lockedDecision`: `PRODUCT_INTELLIGENCE_UNIFIED_READ_MODEL_QA_LOCKED`
- `validations.stagedDiffCheck`: `PASS`

## Locked Adapter Meaning

The Product Intelligence Unified Read Model is approved only as:

- local/static;
- read-only;
- preview-safe;
- reference catalog only;
- evidence-backed;
- freshness-aware;
- source-ownership-aware.

It is not:

- quote issuance;
- policy truth;
- carrier truth without source ownership;
- recommendation as fact;
- product truth creation;
- premium truth creation;
- coverage truth creation;
- projection truth creation;
- quote truth creation;
- parser/calculator execution;
- Banxico call;
- PDF read;
- provider execution.

## Product Family Coverage

The locked catalog covers:

- GMM
- Vida Mujer
- AVE
- Imagina Ser
- ORVI
- SeguBeca

Future product families must extend the same Product Intelligence foundation. They must not promote product-specific bridges as universal architecture.

## Architectural Lock

- Imagina Ser is a proven case, not universal architecture.
- Quote PDF Preview is consumer/reference only.
- Quote promotion must bind to Product Intelligence before using quote-specific preview engines.
- Existing parsers, calculators, Banxico/currency utilities, projection engines, and Quote PDF preview surfaces must be reused by reference and not duplicated.
- No Product Intelligence consumer may treat read model references as canonical product/premium/coverage/projection/quote truth without source ownership, evidence, and freshness.

## Validation Summary

- `node --check platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js`
- `node --check tests/product-intelligence-read-model-adapter-073d-test.js`
- `node tests/product-intelligence-read-model-adapter-073d-test.js`
- `python3 -m json.tool docs/evidence/forge-product-intelligence-unified-read-model-decision-audit-073f.json`
- marker scan
- `git diff --check`
- scoped safety scan
- `git diff --cached --check`

## Final Decision

DECISION=PASS_073F_PRODUCT_INTELLIGENCE_UNIFIED_READ_MODEL_DECISION_LOCK

LOCKED_DECISION=PRODUCT_INTELLIGENCE_UNIFIED_READ_MODEL_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_CATALOG

NEXT=074A_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_SCOPE
