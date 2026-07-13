# ORVI Solucionline PDF Text Parser And Canonical Mapping R15E

## Decision

- Parser status: `IMPLEMENTED`.
- Parser ID: `orvi.solucionline.pdf.text-parser.v1`.
- Adapter ID: `orvi.pdf-to-product-intelligence.v1`.
- Canonical owner: `product-intelligence`.
- Private real-source regression: `PASS`.
- Runtime and dashboard wiring: `NOT_AUTHORIZED`.
- Next: `R15F_ORVI_GUARANTEED_VALUE_DYNAMIC_CHECKPOINT_ANALYTICS`.

## Parser

The parser consumes text extracted from a Solucionline ORVI PDF and extracts only privacy-safe product information:

- displayed plan label;
- source currency as UDI or USD;
- dynamic payment term and displayed coverage duration;
- non-identifying insured attributes;
- coverage and recommended-benefit rows;
- source-displayed premium totals;
- seven-column guaranteed-value timeline;
- safe glossary and note indicators;
- source provenance and confidence.

It never retains names, contact fields, dates of birth, local paths, filenames, or source fingerprints.

## Stateful values

The parser preserves `numeric`, `explicit_zero`, `sin_costo`, `amparado`, `missing`, `unreadable`, and `not_applicable`. Explicit zero is not missing. `SIN COSTO` is not silently converted to zero. `Amparado` is not converted into an invented amount.

## Arithmetic boundary

Displayed source total and visible line-item comparison remain separate. A mismatch is flagged. The source total is not silently replaced.

## Canonical mapping

The adapter maps the envelope into Product Intelligence without mutating the envelope. The model accepts only the exact authorized parser reference while retaining `null` as the compatible default.

Canonical timeline rows now preserve annual premium, additional premium, guaranteed surrender value, cash value, and total recovery as distinct fields. Coverage duration remains separate from maturity age; no maturity age is inferred.

## Validation

The synthetic fixture proves USD, a dynamic non-20 payment term, three pages, 16 timeline rows, explicit zeros, `SIN COSTO`, `Amparado`, and an unreconciled displayed total.

The exact qualified real PDF is parsed privately. Temporary extracted text is deleted. Only sanitized structure enters the report.

## Downstream boundary

R15E does not calculate dynamic recovery checkpoints, cumulative paid, recovery difference, recovery ratio, UDI/USD-to-MXN scenarios, recommendations, or dashboard cards.

## Next

`R15F_ORVI_GUARANTEED_VALUE_DYNAMIC_CHECKPOINT_ANALYTICS`
