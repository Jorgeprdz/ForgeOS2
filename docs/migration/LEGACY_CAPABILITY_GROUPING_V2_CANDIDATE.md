# Forge OS V2 — Capability Grouping V2 Candidate

- Legacy HEAD: `e4441e794abaaf983472591e7c80ae545b0b3f67`
- Input capability-map hash: `e49c11ba74e7c8bcf6f56a38da51f5997aa6737e3dab36e5d126d2f06642e803`
- Grouping report hash: `47019e7100208db576f47f1d026235516dac59837c131d2f193268cb575c0bc0`
- Dependency graph source: `LEGACY_GIT_HEAD_BLOBS`
- Dependency edges: 673

## Honest status

- Status: **GROUPING_V2_CANDIDATE_NOT_LOCKED**
- Grouping proposals are not parity claims.
- Cross-domain and unresolved candidates are never automatically merged.

## Reduction

- Input candidates: 1693
- Proposed groups: 1228
- Grouped reduction: 465
- Multi-member groups: 69
- Members inside grouped proposals: 534
- Accepted evidence edges: 2283
- Inferred domain candidates: 1
- Unresolved unclassified: 512
- Verified parity capabilities: 0

## Domain summary

| Domain | Kind | Groups | Multi-member | Members | Tests | Rules | Review | Priority |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| quoting | BUSINESS | 178 | 6 | 236 | 44 | 0 | 32 | 3041 |
| compensation | BUSINESS | 21 | 4 | 78 | 47 | 5 | 19 | 1778 |
| tooling | INFRASTRUCTURE | 188 | 2 | 191 | 148 | 0 | 7 | 1442 |
| recruitment | BUSINESS | 19 | 2 | 47 | 24 | 3 | 2 | 676 |
| integrations | INFRASTRUCTURE | 40 | 7 | 49 | 19 | 0 | 26 | 526 |
| product-intelligence | UNCLASSIFIED | 14 | 8 | 84 | 21 | 0 | 12 | 288 |
| policy-operations | UNCLASSIFIED | 17 | 5 | 98 | 5 | 0 | 14 | 224 |
| manager-team | UNCLASSIFIED | 135 | 23 | 218 | 106 | 0 | 27 | 86 |
| persistence | INFRASTRUCTURE | 9 | 1 | 10 | 1 | 0 | 5 | 76 |
| advisor-development | UNCLASSIFIED | 10 | 1 | 18 | 15 | 0 | 1 | 65 |
| governance | INFRASTRUCTURE | 5 | 3 | 44 | 0 | 0 | 3 | 56 |
| identity-security | UNCLASSIFIED | 15 | 0 | 15 | 8 | 0 | 5 | 55 |
| crm-client | UNCLASSIFIED | 39 | 5 | 65 | 18 | 0 | 11 | 33 |
| user-experience | UNCLASSIFIED | 1 | 0 | 1 | 0 | 0 | 0 | -4 |
| userExperience | INFRASTRUCTURE | 1 | 0 | 1 | 0 | 0 | 0 | -4 |
| analytics-planning | UNCLASSIFIED | 24 | 2 | 26 | 11 | 0 | 2 | -16 |
| unclassified | UNCLASSIFIED | 512 | 0 | 512 | 46 | 1 | 512 | -1358 |

## Highest-priority grouped business proposals

| Group | Domain | Members | Tests | Rules | Risks | Priority |
|---|---|---:|---:|---:|---|---:|
| partner-rule | compensation | 39 | 24 | 3 | EXTERNAL_BOUNDARY, FINANCIAL_TRUTH, TRUTH_CRITICAL | 875 |
| quote-preview | quoting | 24 | 21 | 0 | EXTERNAL_BOUNDARY, TRUTH_CRITICAL | 535 |
| app | quoting | 31 | 1 | 0 | EXTERNAL_BOUNDARY, TRUTH_CRITICAL, USER_ENTRYPOINT | 367 |
| recruitment | recruitment | 27 | 14 | 0 | TRUTH_CRITICAL | 365 |
| new-professional-bonus | compensation | 10 | 8 | 1 | FINANCIAL_TRUTH | 228 |
| development | compensation | 9 | 3 | 1 | FINANCIAL_TRUTH | 169 |
| evidence-packet-payment | compensation | 3 | 3 | 0 | FINANCIAL_TRUTH, TRUTH_CRITICAL | 94 |
| office-rules | recruitment | 3 | 0 | 3 | — | 66 |
| gmm-sprint-smoke | quoting | 3 | 3 | 0 | — | 51 |
| quote-action-contract-071b | quoting | 2 | 2 | 0 | EXTERNAL_BOUNDARY | 46 |
| gmm-smnyl | quoting | 2 | 0 | 0 | TRUTH_CRITICAL | 28 |
| quote-action-dock-r16j1b | quoting | 2 | 0 | 0 | — | 18 |

## Next governed action

**REVIEW_HIGH_CONFIDENCE_GROUPS_AND_LOCK_CAPABILITY_IDENTITIES**

The next stage locks only reviewed capability identities, then attaches parity scenarios before rewrite credit is possible.
