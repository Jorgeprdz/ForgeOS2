# Forge OS V2 — Legacy Capability Map Candidate

- Source legacy HEAD: `e4441e794abaaf983472591e7c80ae545b0b3f67`
- Source discovery hash: `a35c4b80689a50f70a8ddcae701859e5ba9303d8c87109eeacb237efbc531644`
- Capability-map hash: `e49c11ba74e7c8bcf6f56a38da51f5997aa6737e3dab36e5d126d2f06642e803`

## Honest status

- Status: **CAPABILITY_MAP_CANDIDATE_NOT_LOCKED**
- This document does not grant legacy parity.
- Every ambiguous merge remains in the human-review queue.

## Counts

- Raw technical surfaces: 1699
- Normalized capability candidates: 1693
- Business candidates: 361
- Infrastructure candidates: 294
- Unclassified candidates: 1038
- Surfaces merged: 6
- Potential alias groups: 109
- Human review required: 1679
- Parity verified: 0

## Domains

| Domain | Kind | Capabilities | High risk | Review | Code | Tests | Rules | Priority |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| quoting | BUSINESS | 236 | 58 | 232 | 225 | 44 | 0 | 2763 |
| compensation | BUSINESS | 78 | 71 | 73 | 87 | 47 | 5 | 1539 |
| tooling | INFRASTRUCTURE | 191 | 5 | 190 | 52 | 148 | 0 | 1121 |
| recruitment | BUSINESS | 47 | 2 | 43 | 22 | 24 | 3 | 606 |
| integrations | INFRASTRUCTURE | 49 | 35 | 49 | 38 | 19 | 0 | 353 |
| product-intelligence | UNCLASSIFIED | 84 | 68 | 84 | 77 | 21 | 0 | 171 |
| policy-operations | UNCLASSIFIED | 98 | 96 | 98 | 100 | 5 | 0 | 134 |
| governance | INFRASTRUCTURE | 44 | 1 | 44 | 44 | 0 | 0 | 51 |
| persistence | INFRASTRUCTURE | 10 | 6 | 10 | 10 | 1 | 0 | 49 |
| advisor-development | UNCLASSIFIED | 18 | 1 | 18 | 10 | 15 | 0 | 30 |
| identity-security | UNCLASSIFIED | 15 | 5 | 15 | 8 | 8 | 0 | 14 |
| user-experience | UNCLASSIFIED | 1 | 0 | 1 | 1 | 0 | 0 | -4 |
| analytics-planning | UNCLASSIFIED | 26 | 0 | 26 | 15 | 11 | 0 | -38 |
| crm-client | UNCLASSIFIED | 65 | 14 | 65 | 51 | 18 | 0 | -68 |
| manager-team | UNCLASSIFIED | 218 | 11 | 218 | 112 | 106 | 0 | -171 |
| unclassified | UNCLASSIFIED | 513 | 24 | 513 | 507 | 46 | 1 | -1578 |

## Highest-priority business candidates

| Capability | Domain | Tests | Rules | Risks | Review | Priority |
|---|---|---:|---:|---|---|---:|
| partner-annual-productivity-bonus | compensation | 3 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | YES | 44 |
| partner-alta-partner-bonus | compensation | 3 | 0 | FINANCIAL_TRUTH | YES | 39 |
| partner-transition-bonus | compensation | 3 | 0 | FINANCIAL_TRUTH | YES | 39 |
| partner-production-bonus | compensation | 2 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | YES | 34 |
| partner-activity-bonus | compensation | 2 | 0 | FINANCIAL_TRUTH | YES | 29 |
| bonus-eligibility-result | compensation | 1 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | YES | 26 |
| bonus-payout-truth | compensation | 1 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | YES | 26 |
| commission-statement-evidence-packet | compensation | 1 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | YES | 26 |
| partner-payout-truth | compensation | 1 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | YES | 26 |
| partner-payout-truth-result | compensation | 1 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | YES | 26 |
| payment-event | compensation | 1 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | YES | 26 |
| payment-evidence-packet | compensation | 1 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | YES | 26 |
| quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b | quoting | 1 | 0 | EXTERNAL_BOUNDARY, TRUTH_CRITICAL | YES | 26 |
| quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b | quoting | 1 | 0 | EXTERNAL_BOUNDARY, TRUTH_CRITICAL | YES | 26 |
| quote-preview-pdf-engine-preview-vs-quote-truth-boundary-registry-adapter-085b | quoting | 1 | 0 | EXTERNAL_BOUNDARY, TRUTH_CRITICAL | YES | 26 |
| new-professional-life-bonus-total | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 23 |
| advisor-compensation-stage | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| advisor-development-connection-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| advisor-development-development-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| advisor-relationship-bonus-readiness | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| bonus-calculation-result | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| bonus-carrier-calculated | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| bonus-rule-pack | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| lifecycle-to-compensation | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| new-professional-connection-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| new-professional-development-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| new-professional-gmmi-initial-premium-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| new-professional-gmmi-initial-premium-growth-annual-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| new-professional-gmmi-renewal-premium-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| new-professional-life-initial-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| new-professional-life-renewal-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| partner-calculation-to-payout | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| partner-compensation-concept-registry | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| partner-compensation-input | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| partner-compensation-statement-match | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| partner-monthly-cashflow-projection | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| partner-partial-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| partner-partial-bonus-contracts | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| partner-payment-cadence | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| partner-quarterly-bonus | compensation | 1 | 0 | FINANCIAL_TRUTH | YES | 21 |
| quote-approval-gate-integration-072b | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |
| quote-preview-controlled-browser-confirmation-persistence | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |
| quote-preview-controlled-browser-confirmation-ui-surface-binding | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |
| quote-preview-controlled-browser-confirmation-ui-wiring | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |
| quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |
| quote-preview-pdf-engine-deterministic-input-source-trace-registry-adapter-084b | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |
| quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |
| quote-preview-pdf-engine-expected-value-source-trace-registry-adapter-082b | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |
| quote-preview-pdf-engine-parser-ownership-registry-adapter-083b | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |
| quote-preview-pdf-engine-real-pdf-file-hash-provenance-registry-adapter-081b | quoting | 1 | 0 | EXTERNAL_BOUNDARY | YES | 21 |

## Next action

**LOCK_CAPABILITY_MAP_AND_SELECT_PARITY_SCENARIOS**

The next stage reviews ambiguous groups, locks capability identities, and attaches legacy regression scenarios before any rewrite credit is allowed.
