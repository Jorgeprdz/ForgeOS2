# 107Z15DR — Targeted adapter dataflow discovery repair

Status: **PASS**

## Why 107Z15D held

The previous analyzer assumed that all eight canonical fields would be visible
inside one object literal. The adapter does not have to construct its output
that way.

This repair records the target function, recursive helper closure, field
references, assignments, spreads, `getField` calls, validator calls and result
delivery sites without claiming that one particular projection shape exists.

## Target function

- Function: `integrateQuotePreviewPdfEngineWithProductIntelligence`
- Lines: `230-230`
- Parameters: `['request = {}']`
- Direct internal calls: `[]`
- Recursive call closure: `['integrateQuotePreviewPdfEngineWithProductIntelligence']`

## Projection construction modes

`['DISTRIBUTED_ACROSS_HELPERS']`

The discovery intentionally sets:

`PROJECTION_RESOLVED_CLAIMED=false`

The next review must interpret the captured dataflow before authorizing any
source change.

## Field dataflow

| Canonical field | Declared owner | Source mode | Owning functions | getField alias groups |
|---|---|---|---|---|
| `name` | `adapter` | `REFERENCE_ONLY_OR_DYNAMIC` | `['for']` | `[]` |
| `family` | `adapter` | `REFERENCE_ONLY_OR_DYNAMIC` | `['if']` | `[]` |
| `product` | `engine` | `REFERENCE_ONLY_OR_DYNAMIC` | `['<top-level>', 'if']` | `[]` |
| `insured` | `engine` | `NO_DIRECT_SOURCE_REFERENCE` | `[]` | `[]` |
| `sumAssured` | `engine` | `NO_DIRECT_SOURCE_REFERENCE` | `[]` | `[]` |
| `annualPremium` | `engine` | `NO_DIRECT_SOURCE_REFERENCE` | `[]` | `[]` |
| `plannedOrAvePremium` | `engine` | `NO_DIRECT_SOURCE_REFERENCE` | `[]` | `[]` |
| `coveragePeriod` | `engine` | `NO_DIRECT_SOURCE_REFERENCE` | `[]` | `[]` |

## Function-level evidence

| Function | Canonical fields mentioned | getField calls | spreads | event sites |
|---|---|---:|---:|---:|
| `if` | `['family', 'product']` | 0 | 0 | 0 |
| `for` | `['name']` | 0 | 0 | 0 |
| `integrateQuotePreviewPdfEngineWithProductIntelligence` | `[]` | 0 | 0 | 0 |
| `validateQuotePreviewPdfProductIntelligenceIntegrationShape` | `[]` | 0 | 0 | 0 |

## Validator and delivery

- Validator: `validateQuotePreviewPdfProductIntelligenceIntegrationShape`
- Validator call sites: `0`
- Result delivery sites: `3`
- Manual review required: `true`

## Boundaries

- Source-change authorization: `false`
- Source changes: `false`
- Engine/parser/browser/PDF/backend execution: `false`
- Projection-resolved claim: `false`
- New module or bridge: `false`

## Next gate

`107Z15D2_ADAPTER_DATAFLOW_DISCOVERY_REVIEW_GATE`
