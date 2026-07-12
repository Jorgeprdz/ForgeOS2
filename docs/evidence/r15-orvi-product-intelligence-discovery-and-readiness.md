# R15 ORVI Product Intelligence Discovery And Readiness

## Decision

`PASS_R15_ORVI_PRODUCT_INTELLIGENCE_DISCOVERY_AND_READINESS`

Readiness: `DISCOVERY_LOCKED_IMPLEMENTATION_READY_WITH_CONDITIONS`

Next: `R15A_ORVI_PRODUCT_INTELLIGENCE_CANONICAL_MODEL_IMPLEMENTATION`

## Approvals

- Board Approval: explicit owner instruction to begin ORVI.
- Miranda Approval: sanitized discovery only.
- Robocop Gate: all required constitutional documents were discovered and read.

## Governance documents

- Constitution: `FORGE_CONSTITUTION_V3.md`
- ADR-003: `adr/ADR-003 — Recommendation vs Decision Authority Boundary.txt`
- ADR-004: `adr/ADR-004 — No Invented Recommendations.txt`
- ADR-005: `adr/ADR-005 — Product Truth Boundary.txt`
- ADR-007: `adr/ADR-007 — Forecast Truth Boundary.txt`
- ADR-008: `adr/ADR-008 — Economic Evidence Boundary.txt`
- Roadmap: `docs/architecture/source-truth/FORGE_UI_ACTION_CONTRACT_ROADMAP_BUILD_TREE_SYNC_059A1.md`
- Master Build Tree: `FORGE_MASTER_BUILD_TREE.md`
- Unified Build Tree: `docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md`
- Agent-document candidates read: `44`

## Sanitized repository findings

- Expected ORVI surfaces found: `8/8`.
- Tracked ORVI candidate files: `119`.
- ORVI text hits: `977`.
- Product Intelligence mapping evidence hits: `60`.
- Parser-ref-null evidence hits: `4`.
- Calculator-reference hits: `33`.
- Scenario/not-guaranteed guardrail hits: `21`.
- Fixture-specific 90,000 UDI hits: `0`.
- Timeline checkpoint-pattern hits: `4`.
- Missing-as-zero patterns requiring review: `1068`.

## Existing expected surfaces found

- `orvi-client-report-test.js`
- `orvi-event-engine.js`
- `orvi-guaranteed-value-timeline-engine.js`
- `orvi-master-test.js`
- `orvi-mxn-conversion-engine.js`
- `orvi-ocr-extractor.js`
- `orvi-wait-vs-cancel-engine.js`
- `orvi-decision-engine.js`

## Callable contracts discovered

- `orvi-client-report-test.js`: `decorate`, `main`, `money`
- `orvi-decision-engine.js`: `buildOrviDecision`
- `orvi-event-engine.js`: `buildOrviEvents`
- `orvi-master-test.js`: `format`
- `orvi-mxn-conversion-engine.js`: `convertAmountTodayMXN`, `convertOrviTimelineToMXN`
- `orvi-ocr-extractor.js`: `extractOrviQuote`, `number`, `pdfToText`

## Sanitized local-source findings

- PDFs considered: `30`.
- PDFs scanned: `30`.
- PDF scan timeouts: `0`.
- ORVI PDF candidates: `0`.
- ORVI workbook candidates: `1`.
- Workbook formula-function hits: `23`.
- Source readiness: `REAL_SOURCE_CANDIDATE_FOUND`.

No filenames, document text, formulas, cell values, screenshots, client data, or private artifacts were stored.

## Key findings

- Existing ORVI engines already cover timeline, UDI/MXN conversion, event, wait/cancel, and decision concerns.
- Existing test fixtures contain product-specific figures and ages that cannot become universal truth.
- Existing zero-default patterns must be reconciled because ForgeOS requires missing information to remain missing.
- Existing ORVI OCR/extractor code is evidence only and does not authorize parser ownership.
- Future MXN values must remain explicitly projected and non-guaranteed.
- Product Intelligence must become the canonical semantic owner before any dashboard work.

## Scope completed

- Repository inventory.
- Existing contract inventory.
- Sanitized local-source inventory.
- Constitutional interpretation.
- Candidate read model.
- Readiness decision and next-module lock.

## Not implemented

- Parser.
- Product adapter.
- Runtime wiring.
- Calculation changes.
- Dashboard or UI.
- Browser execution.
- Real client-file processing.
