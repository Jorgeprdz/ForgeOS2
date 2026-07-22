# Forge Requirements Traceability Matrix

Matrix ID: `FORGE_REQUIREMENTS_TRACEABILITY_001`

Revision: `PRODUCT_CAPABILITY_REFACTOR_001`

Status: `CANONICAL_FOR_REWRITE_SCAFFOLDING`

Rule: no scaffold may be generated unless its capability, requirement, constitutional authority, boundary, ADR or decision, contract, stage, validation, evidence and acceptance criteria are present.

| Capability | Requirement | Authority | Primary boundary | Stage | Acceptance |
|---|---|---|---|---|---|
| `CAP-DECISION-CORE` | `REQ-DECISION-EVIDENCE-ACTION` | Articles III/V; ADR-001/002/003/004/020 | `BOUND-EVIDENCE-OWNERSHIP` | `SG-002` | decision output includes evidence, owner, confidence and action boundary |
| `CAP-ACTION-PLANNING` | `REQ-ACTION-RECOMMENDATION-NOT-EXECUTION` | Articles IV/V; ADR-003/009/012 | `BOUND-ACTION-NO-EXECUTION` | `SG-002` | recommendations do not execute real-world effects |
| `CAP-TRUTH-EVIDENCE` | `REQ-TRUTH-OWNER-VALIDATION` | Article III; ADR-001/002/014 | `BOUND-ONE-METRIC-ONE-OWNER` | `SG-001` | unknown or ambiguous owners block generation |
| `CAP-GOVERNANCE-GATE` | `REQ-ROBOCOP-GATE` | Article VIII; ROBOCOP LOCK 001 | `BOUND-ROBOCOP-GATE` | `SG-001` | missing governance gate fields block |
| `CAP-READ-ONLY-ADAPTERS` | `REQ-READ-ONLY-NO-WRITES` | Articles III-IV-V | `BOUND-READ-ONLY` | `SG-002` | adapters expose reads and evidence only |
| `CAP-RELATIONSHIP-INTELLIGENCE` | `REQ-RELATIONSHIP-NON-MANIPULATION` | Articles III/IV/VI; ADR-011 | `BOUND-RELATIONSHIP-NON-MANIPULATION` | `SG-003` | one evidenced next action without manipulation |
| `CAP-CONVERSATION-INTELLIGENCE` | `REQ-NASH-DRAFTS-NOT-TRUTH` | Article VI; ADR-010/020 | `BOUND-NASH-NO-TRUTH` | `SG-004` | drafts do not own truth, decide or send |
| `CAP-POLICY-OPERATIONS` | `REQ-POLICY-TRUTH-SEPARATION` | Articles III/V; ADR-006 | `BOUND-POLICY-TRUTH` | `SG-005` | policy truth remains separate from quote and forecast truth |
| `CAP-PRODUCT-CATALOG` | `REQ-PRODUCT-CATALOG-CONTRACT` | Articles III/V; ADR-005 | `BOUND-PRODUCT-TRUTH` | `SG-006` | catalog contract exists without invented commercial values |
| `CAP-PRODUCT-SOURCE-PACK` | `REQ-PRODUCT-SOURCE-PACK-INTAKE` | Article III; ADR-005 | `BOUND-PRODUCT-TRUTH` | `SG-007` | source packs require approved commercial documents |
| `CAP-CARRIER-SCOPE` | `REQ-CARRIER-SCOPE-SEPARATION` | Article V; ADR-005/008 | `BOUND-RULE-PACK-SEPARATION` | `SG-008` | carrier scope stays outside universal Forge Core |
| `CAP-RULE-PACK-CONTRACT` | `REQ-RULE-PACK-CONTRACT` | Article V; ADR-008/017/018 | `BOUND-RULE-PACK-SEPARATION` | `SG-009` | carrier, channel, period and snapshot boundaries are preserved |
| `CAP-ELIGIBILITY-CONTRACT` | `REQ-ELIGIBILITY-CONTRACT` | Articles III/V; ADR-008 | `BOUND-UNKNOWN-REMAINS-UNKNOWN` | `SG-010` | eligibility exposes facts, rules, confidence and unknown states |
| `CAP-CALCULATION-CONTRACT` | `REQ-CALCULATION-CONTRACT` | Article III; ADR-008/017 | `BOUND-ECONOMIC-EVIDENCE` | `SG-011` | calculations do not invent values or mix periods |
| `CAP-QUOTE-PREVIEW` | `REQ-QUOTE-PREVIEW-NON-BINDING` | Articles III/V; ADR-005/008/017 | `BOUND-PRODUCT-TRUTH` | `SG-012` | quote preview is non-binding and evidence-labeled |
| `CAP-MANAGER-COACHING` | `REQ-MANAGER-COACHING-ONLY` | Articles IV/VI; ADR-015 | `BOUND-MANAGER-COACHING-ONLY` | `SG-013` | coaching recommendation without automated consequence |
| `CAP-MICK-BEHAVIOR` | `REQ-MICK-OBSERVABLE-ONLY` | Article VI; ADR-013 | `BOUND-MICK-OBSERVABLE-BEHAVIOR` | `SG-014` | observable behavior signal only |
| `CAP-ADVISOR-EXPERIENCE` | `REQ-ADVISOR-EXPERIENCE-TRANSVERSAL` | Article 0; ADR-016 | `BOUND-ADVISOR-EXPERIENCE-ANTI-DEPENDENCE` | `SG-015` | cross-cutting, non-invasive and value-first |
| `CAP-COMPENSATION-ECONOMIC` | `REQ-ECONOMIC-EVIDENCE-RULESNAPSHOT` | Article III; ADR-008/017/018 | `BOUND-ECONOMIC-EVIDENCE` | `SG-016` | deferred until snapshots and source packs are ratified |
| `CAP-RECRUITMENT-PRECONTRACT` | `REQ-RECRUITMENT-LIFECYCLE-RULES` | Articles IV/VI; AGENTS | `BOUND-NO-HUMAN-CONSEQUENCE-AUTOMATION` | `SG-017` | no automated selection, rejection or worth judgment |
| `CAP-LEGACY-REINTRODUCTION-GUARD` | `REQ-LEGACY-REINTRODUCTION-GUARD` | Article V; directive section 4 | `BOUND-NO-LEGACY-REINTRODUCTION` | `SG-018` | active guard blocks legacy without needing legacy evidence |
| `CAP-AUTONOMOUS-AI-DECISIONING` | `REQ-AI-NO-FINAL-AUTHORITY` | Article 0/VI; ADR-003/004/020 | `BOUND-AI-EXPLAINS-FORGE-DECIDES` | `SG-019` | final AI authority blocked |
| `CAP-GENERIC-CRM-CLONE` | `REQ-NO-GENERIC-CRM-CLONE` | Article I; AGENTS | `BOUND-FORGE-NOT-CRM` | `SG-019` | CRM-like data allowed only for Forge decision/action workflows |
| `CAP-LEGACY-FUNCTIONAL-EVIDENCE-INTAKE` | `REQ-LEGACY-FUNCTIONAL-EVIDENCE-INTAKE` | directive section 4 | `BOUND-NO-LEGACY-CODE-COPY` | `SG-020` | evidence intake classifies behavior only |

The processable matrix is `scaffolds/manifest/requirements-traceability.json`.
