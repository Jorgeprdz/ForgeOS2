# R15A ORVI Product Intelligence Canonical Model Implementation

## Decision

`PASS_R15A_ORVI_PRODUCT_INTELLIGENCE_CANONICAL_MODEL_IMPLEMENTATION`

Status: `IMPLEMENTED_PENDING_SOURCE_ADAPTER`

Next: `R15B_ORVI_REAL_SOURCE_OWNERSHIP_AND_PARSER_READINESS`

## Approvals

- Board Approval: repository owner explicitly continued with ORVI.
- Miranda Approval: synthetic tests only; no client data or source-file contents committed.
- Robocop Scope: canonical Product Intelligence only.

## Root cause

ORVI had multiple root-level engines and tests but no neutral canonical semantic owner.

Observed legacy boundaries:

- The extractor can coerce absent values and `SIN COSTO` to zero.
- The decision engine emits recommendation language.
- The wait/cancel engine can return zero growth when the denominator is unavailable or zero.
- The MXN engine produces projected scenarios.
- Event and presentation engines explain results but do not own product truth.

R15A does not modify or execute those surfaces as canonical truth.

## Implementation

Created:

- `product-intelligence/knowledge/orvi-product-intelligence.js`
- `tests/orvi-product-intelligence-canonical-model-test.mjs`

Updated:

- `FORGE_MASTER_BUILD_TREE.md`
- `docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md`

## Canonical model

The model owns:

- ORVI identity and plan variant.
- Currency declaration.
- Non-identifying participant attributes.
- Premium structure.
- Protection summary.
- Guaranteed value timeline.
- Source trace.
- Missing information.
- Decision boundary.
- MXN-conversion boundary.
- Runtime/parser/renderer ownership status.

## Truth rules

- Product type `orvi` is canonical identity.
- Product-specific figures are never defaulted.
- Payment term, maturity age, sum assured, premiums, and timeline values require supplied evidence.
- Zero is accepted only when explicitly marked as source-confirmed zero.
- Otherwise zero becomes `null` and remains visible in `missing_information`.
- Timeline rows are normalized but not recalculated.
- Total annual outflow is not inferred by R15A.
- Client name is outside Product Intelligence and is not stored.
- Unsafe source-trace entries are rejected.
- Future MXN values remain uncalculated and non-guaranteed.
- Recommendation remains `null`.
- Human decision remains mandatory.

## Engine reconciliation

- Extractor: `evidence_only_not_parser_owner`.
- Guaranteed-value timeline: `candidate_calculation_surface_not_canonical_owner`.
- MXN conversion: `scenario_engine_not_guarantee_owner`.
- Wait versus cancel: `comparison_candidate_not_recommendation_authority`.
- Decision engine: `legacy_explanation_candidate_not_decision_authority`.
- Event engine: `presentation_candidate_not_product_truth_owner`.

## Validation

The synthetic test verifies:

- Input immutability.
- No client-name retention.
- No default payment term or maturity age.
- Missing is not zero.
- Explicit zero preservation.
- Parser/runtime/renderer refs remain null.
- No automatic recommendation.
- Human decision gate.
- No MXN execution.
- No future-MXN guarantee.
- Safe source-trace deduplication.
- Frozen canonical output.
- JSON-safe finite values.

## Not implemented

- Real PDF or workbook intake.
- Parser.
- Source adapter.
- Timeline calculation changes.
- UDI/MXN execution.
- Wait/cancel execution.
- Recommendation.
- Runtime wiring.
- Dashboard, renderer, layout, route, or UI.

## Next gate

`R15B_ORVI_REAL_SOURCE_OWNERSHIP_AND_PARSER_READINESS` must identify the real ORVI source owner, inspect the workbook candidate under privacy controls, and define parser readiness before any source adapter is implemented.
