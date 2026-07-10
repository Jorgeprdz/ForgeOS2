# 107Z15E — Repository-wide canonical mapper discovery

Status: **PASS**

## Meaning of PASS

PASS means the complete Git-tracked text inventory was inspected and candidate
owners were classified. It does not mean a mapper was found.

## Owner resolution

- Schema owner resolved: `true`
- Schema owner: `platform/adapters/quote-preview/quote-preview-pdf-result-persistence-contract.js`
- Mapper owner resolved: `false`
- Mapper owner: `None`
- Validator owner resolved: `true`
- Validator owner: `platform/adapters/quote-preview/quote-preview-pdf-result-persistence-contract.js`
- Modal consumer owner resolved: `true`
- Modal consumer owner: `platform/adapters/quote-preview/quote-preview-pdf-result-persistence-contract.js`

## Inventory

- Tracked files: `4082`
- Text files inspected: `3901`
- Contract reverse importers: `2`

## Schema candidates

| Path | Category | Score | Canonical fields | Native terms | Exports | Imports |
|---|---|---:|---:|---:|---|---|
| `platform/adapters/quote-preview/quote-preview-pdf-result-persistence-contract.js` | `production_source` | 271 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z12r-quote-preview-pdf-runtime-persistence-scoped-implementation-repair-evidence.md` | `documentation` | 265 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z12r-quote-preview-pdf-runtime-persistence-scoped-implementation-repair.json` | `documentation` | 265 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r3-existing-owner-static-contract-review-evidence.md` | `documentation` | 246 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r3-existing-owner-static-contract-review.json` | `documentation` | 246 | 8 | 14 | `[]` | `[]` |
| `docs/architecture/quote-preview/107z15r3-existing-owner-static-contract-review.md` | `documentation` | 242 | 8 | 12 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s-canonical-schema-owner-reconciliation-evidence.md` | `documentation` | 242 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s-canonical-schema-owner-reconciliation.json` | `documentation` | 242 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r-existing-extractor-api-contract-resolution-evidence.md` | `documentation` | 238 | 8 | 6 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r-existing-extractor-api-contract-resolution.json` | `documentation` | 238 | 8 | 6 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s1-canonical-schema-correction-authorization-evidence.md` | `documentation` | 238 | 8 | 11 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s1-canonical-schema-correction-authorization.json` | `documentation` | 238 | 8 | 11 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z7-quote-preview-pdf-runtime-persistence-adr-draft.json` | `documentation` | 234 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z7r-quote-preview-pdf-runtime-persistence-adr-revision.json` | `documentation` | 234 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z8s3r-source-authority-normalization-validator-repair.json` | `documentation` | 234 | 8 | 1 | `[]` | `[]` |

## Mapper or transformer candidates

| Path | Category | Score | Canonical fields | Native terms | Exports | Imports |
|---|---|---:|---:|---:|---|---|
| `docs/evidence/quote-preview/107z15s-canonical-schema-owner-reconciliation-evidence.md` | `documentation` | 312 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s-canonical-schema-owner-reconciliation.json` | `documentation` | 312 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r3-existing-owner-static-contract-review-evidence.md` | `documentation` | 302 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r3-existing-owner-static-contract-review.json` | `documentation` | 302 | 8 | 14 | `[]` | `[]` |
| `docs/architecture/quote-preview/107z15r3-existing-owner-static-contract-review.md` | `documentation` | 281 | 8 | 12 | `[]` | `[]` |
| `product-intelligence/evidence/forge-quote-pdf-preview-engine.js` | `test_or_evidence` | 232 | 2 | 14 | `['buildCalculation', 'buildForgeQuoteExcelTables', 'detectQuoteDomain', 'extractSolucionlineLifeQuoteFields', 'summarizeForgeQuotePdfText']` | `[]` |
| `docs/evidence/quote-preview/107z15r-existing-extractor-api-contract-resolution-evidence.md` | `documentation` | 223 | 8 | 6 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r-existing-extractor-api-contract-resolution.json` | `documentation` | 223 | 8 | 6 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s1-canonical-schema-correction-authorization-evidence.md` | `documentation` | 218 | 8 | 11 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s1-canonical-schema-correction-authorization.json` | `documentation` | 218 | 8 | 11 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z3-targeted-canonical-pdf-cache-writer-reader-review-evidence.md` | `documentation` | 185 | 2 | 5 | `['ADAPTER_ID', 'QUOTE_READ_MODEL_ADAPTER_ID', 'QUOTE_READ_MODEL_SAFE_ERROR', 'QUOTE_READ_MODEL_SCHEMA_VERSION', 'QUOTE_READ_MODEL_SOURCE_ENGINE', 'SCHEMA_VERSION', 'bindQuotePreviewToProductIntelligence', 'buildQuotePreviewBindingNotBoundError', 'construirContextoPresentacionDesdeCotizacion', 'crearQuotationExtractionResult', 'detectarProductoCotizacion', 'getProductIntelligenceReadModelByFamily', 'getProductIntelligenceReadModelCatalog', 'getQuoteDetail', 'getQuoteReadModelManifest', 'getVerifiedUdiRateMetadata', 'listQuotes', 'normalizarCotizacionAMXN', 'validateProductIntelligenceReadModelShape', 'validateQuotePreviewBindingShape']` | `[]` |
| `docs/evidence/quote-preview/107z3-targeted-canonical-pdf-cache-writer-reader-review.json` | `documentation` | 185 | 2 | 5 | `['ADAPTER_ID', 'QUOTE_READ_MODEL_ADAPTER_ID', 'QUOTE_READ_MODEL_SAFE_ERROR', 'QUOTE_READ_MODEL_SCHEMA_VERSION', 'QUOTE_READ_MODEL_SOURCE_ENGINE', 'SCHEMA_VERSION', 'bindQuotePreviewToProductIntelligence', 'buildQuotePreviewBindingNotBoundError', 'construirContextoPresentacionDesdeCotizacion', 'crearQuotationExtractionResult', 'detectarProductoCotizacion', 'getProductIntelligenceReadModelByFamily', 'getProductIntelligenceReadModelCatalog', 'getQuoteDetail', 'getQuoteReadModelManifest', 'getVerifiedUdiRateMetadata', 'listQuotes', 'normalizarCotizacionAMXN', 'validateProductIntelligenceReadModelShape', 'validateQuotePreviewBindingShape']` | `[]` |
| `docs/evidence/quote-preview/107z7-quote-preview-pdf-runtime-persistence-adr-draft.json` | `documentation` | 183 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z7r-quote-preview-pdf-runtime-persistence-adr-revision.json` | `documentation` | 183 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z8s3r-source-authority-normalization-validator-repair.json` | `documentation` | 183 | 8 | 1 | `[]` | `[]` |

## Validator candidates

| Path | Category | Score | Canonical fields | Native terms | Exports | Imports |
|---|---|---:|---:|---:|---|---|
| `platform/adapters/quote-preview/quote-preview-pdf-result-persistence-contract.js` | `production_source` | 174 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r3-existing-owner-static-contract-review-evidence.md` | `documentation` | 149 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r3-existing-owner-static-contract-review.json` | `documentation` | 149 | 8 | 14 | `[]` | `[]` |
| `docs/architecture/quote-preview/107z15r3-existing-owner-static-contract-review.md` | `documentation` | 139 | 8 | 12 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s-canonical-schema-owner-reconciliation-evidence.md` | `documentation` | 139 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s-canonical-schema-owner-reconciliation.json` | `documentation` | 139 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r-existing-extractor-api-contract-resolution-evidence.md` | `documentation` | 129 | 8 | 6 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15r-existing-extractor-api-contract-resolution.json` | `documentation` | 129 | 8 | 6 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s1-canonical-schema-correction-authorization-evidence.md` | `documentation` | 129 | 8 | 11 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s1-canonical-schema-correction-authorization.json` | `documentation` | 129 | 8 | 11 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15dr-targeted-adapter-dataflow-discovery-repair-evidence.md` | `documentation` | 124 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15dr-targeted-adapter-dataflow-discovery-repair.json` | `documentation` | 124 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z7-quote-preview-pdf-runtime-persistence-adr-draft.json` | `documentation` | 119 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z7r-quote-preview-pdf-runtime-persistence-adr-revision.json` | `documentation` | 119 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z8s3r-source-authority-normalization-validator-repair.json` | `documentation` | 119 | 8 | 1 | `[]` | `[]` |

## Consumer candidates

| Path | Category | Score | Canonical fields | Native terms | Exports | Imports |
|---|---|---:|---:|---:|---|---|
| `platform/adapters/quote-preview/quote-preview-pdf-result-persistence-contract.js` | `production_source` | 109 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z12r-quote-preview-pdf-runtime-persistence-scoped-implementation-repair-evidence.md` | `documentation` | 108 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z12r-quote-preview-pdf-runtime-persistence-scoped-implementation-repair.json` | `documentation` | 108 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z14r1-controlled-browser-integration-targeted-repair-evidence.md` | `documentation` | 108 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z14r1-controlled-browser-integration-targeted-repair.json` | `documentation` | 108 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s-canonical-schema-owner-reconciliation-evidence.md` | `documentation` | 108 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s-canonical-schema-owner-reconciliation.json` | `documentation` | 108 | 8 | 14 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z7-quote-preview-pdf-runtime-persistence-adr-draft.json` | `documentation` | 108 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z7r-quote-preview-pdf-runtime-persistence-adr-revision.json` | `documentation` | 108 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z8s3r-source-authority-normalization-validator-repair.json` | `documentation` | 108 | 8 | 1 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z9-quote-preview-pdf-runtime-persistence-adr-approval.json` | `documentation` | 108 | 8 | 1 | `[]` | `[]` |
| `platform/adapters/quote-preview/quote-preview-pdf-result-persistence-coordinator.js` | `production_source` | 103 | 0 | 0 | `[]` | `['platform/runtime/quote-preview/quote-preview-pdf-result-store.js', 'platform/adapters/quote-preview/quote-preview-pdf-result-persistence-contract.js']` |
| `docs/evidence/quote-preview/107z15s1-canonical-schema-correction-authorization-evidence.md` | `documentation` | 96 | 8 | 11 | `[]` | `[]` |
| `docs/evidence/quote-preview/107z15s1-canonical-schema-correction-authorization.json` | `documentation` | 96 | 8 | 11 | `[]` | `[]` |
| `platform/runtime/quote-preview/quote-preview-pdf-result-store.js` | `production_source` | 91 | 0 | 0 | `[]` | `['platform/adapters/quote-preview/quote-preview-pdf-result-persistence-contract.js']` |

## Contract reverse importers

```json
[
  "platform/adapters/quote-preview/quote-preview-pdf-result-persistence-coordinator.js",
  "platform/runtime/quote-preview/quote-preview-pdf-result-store.js"
]
```

## Boundary

No source change, new bridge or implementation is authorized by this
discovery. If no mapper owner meets the threshold, the next phase must review
the origin of the canonical contract and determine whether a bridge is truly
missing.

## Next gate

`107Z15E0_CANONICAL_CONTRACT_ORIGIN_AND_MISSING_BRIDGE_REVIEW_GATE`
