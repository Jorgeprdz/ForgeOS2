# ORVI Real Quote PDF Source Intake R15C

## Decision

- Canonical semantic owner: `product-intelligence`.
- Primary extraction source owner: `REAL_ORVI_SOLUCIONLINE_QUOTE_PDF_CONFIRMED`.
- Source classification: `ILLUSTRATIVE_QUOTE_PRIMARY_EXTRACTION_SOURCE_NOT_CONTRACT`.
- Parser readiness: `READY_FOR_PARSER_CONTRACT_AND_SYNTHETIC_FIXTURE`.
- Privacy status: `REAL_SOURCE_PII_REDACTION_REQUIRED`.
- Parser implementation: `NOT_AUTHORIZED_IN_R15C`.
- Next: `R15D_ORVI_PDF_PARSER_CONTRACT_AND_SYNTHETIC_FIXTURE`.

## Qualified source

A real Solucionline ORVI quote PDF was confirmed by exact private SHA-256 match.

The committed record stores only structural facts:

- Pages: `3`.
- Text layer: `true`.
- Producer family: `CRYSTAL_REPORTS`.
- Timeline rows: `64`.
- Timeline columns: `7`.
- Explicit-zero rows: `44`.
- `SIN COSTO` state present: `true`.
- Identity section: present.
- Coverage section: present.
- Recommended-benefits section: present.
- Guaranteed-values table: present.
- Glossary: present.
- Notes: present.

No local filename, path, PDF text, identity, contact detail, birth date, premium, sum assured, or timeline value is committed.

## Authority hierarchy

1. Real Solucionline ORVI quote PDF as primary extraction source.
2. R15A Product Intelligence as canonical semantic owner.
3. Future authorized parser.
4. Authorized calculation engines.
5. Runtime and renderer consumers.
6. Dashboard and UI consumers.

The quote is an illustrative study, not the insurance contract. Conditions General and Particular remain the contractual authority outside this parser scope.

## Parser-contract requirements

The future parser must extract without inference:

- Product and plan label.
- Currency denomination.
- Non-identifying insured attributes required by Product Intelligence.
- Coverage rows and their displayed states.
- Base and additional premiums.
- Displayed totals.
- Recommended-benefit rows.
- Guaranteed-value timeline headers and rows.
- Glossary definitions.
- Notes and disclaimers.
- Source provenance and parser confidence.

It must preserve distinct states for:

- Explicit numeric zero.
- Missing value.
- Unreadable value.
- `SIN COSTO`.
- `Amparado`.
- Not applicable.
- Source-displayed total that does not reconcile with visible line items.

## Arithmetic boundary

Status: `DISPLAYED_TOTAL_DIFFERS_FROM_VISIBLE_LINE_ITEM_SUM`.

Policy: `CAPTURE_SOURCE_VALUES_AND_FLAG_NON_RECONCILIATION_DO_NOT_RECOMPUTE`.

A parser must capture the displayed source total and visible line items independently. It must not silently replace a displayed value with a recomputed value.

## Privacy boundary

The source contains identity and contact-data categories. All future fixtures must be synthetic. Real names, phones, emails, dates, paths, filenames, or quote values may not be copied into Git.

## Prohibited in R15C

- No PDF committed.
- No real quote values committed.
- No parser implementation.
- No OCR fallback.
- No extractor execution against runtime.
- No UDI-to-MXN conversion.
- No recommendation or decision engine.
- No renderer, dashboard, route, or UI change.

## Next

`R15D_ORVI_PDF_PARSER_CONTRACT_AND_SYNTHETIC_FIXTURE`
