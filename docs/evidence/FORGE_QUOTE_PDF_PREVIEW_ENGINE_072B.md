# FORGE 072B Quote PDF Preview Engine

Status: PASS

This module promotes the personal quote PDF parser into a Forge repo-local preview engine.

## Boundary

- Local PDF text preview only.
- No provider runtime.
- No official quote issuance.
- No CRM write.
- No calendar/task/message action.
- No binding quote truth claim.
- No UDI projection without explicit Forge UDI growth evidence.

## Exports

| Export | Purpose |
|---|---|
| `summarizeForgeQuotePdfText` | Parse PDF text and build preview summary |
| `buildForgeQuoteExcelTables` | Return workbook/table-ready arrays |
| `detectQuoteDomain` | Detect `life`, `gmm`, or `unknown` |
| `extractSolucionlineLifeQuoteFields` | Extract Solucionline Imagina Ser layout |
| `buildCalculation` | Convert UDI values using caller-provided UDI and evidenced growth rule |

## Decision

The engine is repo-local and preview-only. It can be wired later to `quote.prepare_preview` after approval-gate integration, but it must not create official quote truth or call carrier/provider systems.
