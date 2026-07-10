# 107Z15E3 — Canonical field source model decision

Status: **PASS**

## Verdict

`FIELD_SOURCE_MODEL_REQUIRES_ARCHITECTURE_APPROVAL`

This gate creates the final decision packet. It does not approve mappings.

## Field model

| Field | Previous status | Recommended class | Recommended source | Decision status | Top candidates |
|---|---|---|---|---|---|
| `name` | `AMBIGUOUS_EXPLICIT_MAPPINGS` | `AMBIGUOUS_ENGINE_CANDIDATES` | `None` | `ARCHITECTURE_APPROVAL_REQUIRED` | nativeResult.prospect (55), nativeResult.sumInsured (35) |
| `family` | `AMBIGUOUS_EXPLICIT_MAPPINGS` | `RUNTIME_CONTEXT` | `None` | `ARCHITECTURE_APPROVAL_REQUIRED` | nativeResult.product (55) |
| `product` | `RESOLVED_EXACT_SAME_NAME_ENGINE_TOP_LEVEL` | `ENGINE_DIRECT` | `nativeResult.product` | `PROVEN` | nativeResult.product (155), nativeResult.plan (55), nativeResult.premiumTable.plannedAnnual (35) |
| `insured` | `AMBIGUOUS_EXPLICIT_MAPPINGS` | `ENGINE_SEMANTIC_CANDIDATE` | `nativeResult.prospect` | `ARCHITECTURE_APPROVAL_REQUIRED` | nativeResult.prospect (120), nativeResult.sumInsured (35) |
| `sumAssured` | `AMBIGUOUS_EXPLICIT_MAPPINGS` | `ENGINE_SEMANTIC_CANDIDATE` | `nativeResult.sumInsured` | `ARCHITECTURE_APPROVAL_REQUIRED` | nativeResult.sumInsured (94) |
| `annualPremium` | `AMBIGUOUS_EXPLICIT_MAPPINGS` | `AMBIGUOUS_ENGINE_CANDIDATES` | `None` | `ARCHITECTURE_APPROVAL_REQUIRED` | nativeResult.baseAnnualPremium (60), nativeResult.premiumTable.annual (60), nativeResult.totalAnnualPremium (60) |
| `plannedOrAvePremium` | `UNRESOLVED_NO_EXPLICIT_SOURCE_CONTRACT` | `ENGINE_SEMANTIC_CANDIDATE` | `nativeResult.premiumTable.plannedAnnual` | `ARCHITECTURE_APPROVAL_REQUIRED` | nativeResult.premiumTable.plannedAnnual (70), nativeResult.age (35), nativeResult.plan (35) |
| `coveragePeriod` | `UNRESOLVED_NO_EXPLICIT_SOURCE_CONTRACT` | `PRODUCT_DEPENDENT_DERIVED_RULE` | `None` | `ARCHITECTURE_APPROVAL_REQUIRED` | nativeResult.guaranteePeriod (60), nativeResult.paymentTerm (60), nativeResult.policyTerm (60) |

## Counts

- Proven: `1`
- Architecture approval required: `7`
- Contract repair review required: `0`

## Boundary

- Mapping approved: `false`
- Bridge implementation authorized: `false`
- Source changes: `false`
- Schema changes: `false`
- Runtime/PDF/backend effects: `false`

## Next gate

`107Z15E3A_CANONICAL_FIELD_SOURCE_MODEL_APPROVAL_GATE`
