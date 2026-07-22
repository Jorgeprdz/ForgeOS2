# Forge Requirements Traceability Matrix

Matrix ID: `FORGE_REQUIREMENTS_TRACEABILITY_001`

Status: `CANONICAL_FOR_REWRITE_SCAFFOLDING`

Rule: no scaffold may be generated unless its capability, requirement, constitutional authority, boundary, ADR, contract, stage, validation, evidence and acceptance criteria are present.

| Capability | Requirement | Authority | Boundary | ADR / decision | Contract | Stage | Scaffold | Validation | Evidence | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|
| `CAP-DECISION-CORE` | `REQ-DECISION-EVIDENCE-ACTION` | Articles III/V | `BOUND-EVIDENCE-OWNERSHIP` | ADR-001/002/003/004/020 | `scaffold-contract.schema.json` | `SG-002` | module template | manifest + stage validation | stage evidence | output includes evidence, owner, confidence and action boundary |
| `CAP-ACTION-PLANNING` | `REQ-ACTION-RECOMMENDATION-NOT-EXECUTION` | Articles IV/V | `BOUND-ACTION-NO-EXECUTION` | ADR-003/009/012 | `scaffold-contract.schema.json` | `SG-002` | service template | manifest + stage validation | stage evidence | real effects blocked |
| `CAP-TRUTH-EVIDENCE` | `REQ-TRUTH-OWNER-VALIDATION` | Article III | `BOUND-ONE-METRIC-ONE-OWNER` | ADR-001/002/014 | `traceability.schema.json` | `SG-001` | documentation template | traceability validation | validation report | unknown/ambiguous owners block |
| `CAP-GOVERNANCE-GATE` | `REQ-ROBOCOP-GATE` | Article VIII | `BOUND-ROBOCOP-GATE` | ROBOCOP LOCK 001 | `promotion-gate.schema.json` | `SG-001` | documentation template | boundary validation | gate evidence | missing fields block |
| `CAP-READ-ONLY-ADAPTERS` | `REQ-READ-ONLY-NO-WRITES` | Articles III-V | `BOUND-READ-ONLY` | current platform adapters | `scaffold-contract.schema.json` | `SG-002` | service template | stage validation | adapter evidence | no writes or real effects |
| `CAP-RELATIONSHIP-INTELLIGENCE` | `REQ-RELATIONSHIP-NON-MANIPULATION` | Articles III/IV/VI | `BOUND-RELATIONSHIP-NON-MANIPULATION` | ADR-011 | `stage-contract.schema.json` | `SG-003` | domain template | blocked stage validation | owner decision evidence | no manipulation or hidden uncertainty |
| `CAP-CONVERSATION-INTELLIGENCE` | `REQ-NASH-DRAFTS-NOT-TRUTH` | Article VI | `BOUND-NASH-NO-TRUTH` | ADR-010 | `stage-contract.schema.json` | `SG-003` | domain template | blocked stage validation | owner decision evidence | no source-truth or send authority |
| `CAP-POLICY-OPERATIONS` | `REQ-POLICY-TRUTH-SEPARATION` | Articles III/V | `BOUND-POLICY-TRUTH` | ADR-006 | `stage-contract.schema.json` | `SG-003` | domain template | blocked stage validation | owner decision evidence | issued policy truth is not quote truth |
| `CAP-PRODUCT-QUOTE-PREVIEW` | `REQ-QUOTE-PREVIEW-NON-BINDING` | Articles III/V | `BOUND-PRODUCT-TRUTH` | ADR-005/008/017 | `stage-contract.schema.json` | `SG-003` | feature template | blocked stage validation | owner decision evidence | no invented product or premium |
| `CAP-MANAGER-COACHING` | `REQ-MANAGER-COACHING-ONLY` | Articles IV/VI | `BOUND-MANAGER-COACHING-ONLY` | ADR-015 | `stage-contract.schema.json` | `SG-004` | domain template | blocked stage validation | owner decision evidence | no automated consequence |
| `CAP-MICK-BEHAVIOR` | `REQ-MICK-OBSERVABLE-ONLY` | Article VI | `BOUND-MICK-OBSERVABLE-BEHAVIOR` | ADR-013 | `stage-contract.schema.json` | `SG-004` | domain template | blocked stage validation | owner decision evidence | observable behavior only |
| `CAP-ADVISOR-EXPERIENCE` | `REQ-BENVENU-FIRST-VALUE` | Article 0 | `BOUND-ADVISOR-EXPERIENCE-ANTI-DEPENDENCE` | ADR-016 | `stage-contract.schema.json` | `SG-005` | ui template | blocked stage validation | owner decision evidence | deferred until approved |
| `CAP-COMPENSATION-ECONOMIC` | `REQ-ECONOMIC-EVIDENCE-RULESNAPSHOT` | Article III | `BOUND-ECONOMIC-EVIDENCE` | ADR-008/017/018 | `stage-contract.schema.json` | `SG-005` | domain template | blocked stage validation | owner decision evidence | deferred until rule contracts |
| `CAP-RECRUITMENT-PRECONTRACT` | `REQ-RECRUITMENT-LIFECYCLE-RULES` | Articles IV/VI | `BOUND-NO-HUMAN-CONSEQUENCE-AUTOMATION` | AGENTS | `stage-contract.schema.json` | `SG-005` | domain template | blocked stage validation | owner decision evidence | deferred until ratified lifecycle |
| `CAP-LEGACY-WEB-SHELL` | `REQ-NO-LEGACY-ROOT-SHELL` | Article V | `BOUND-NO-LEGACY-REINTRODUCTION` | cleanup report | `path-policy.schema.json` | `SG-006` | none | path validation | rejection evidence | root shell not regenerated |
| `CAP-AUTONOMOUS-AI-DECISIONING` | `REQ-AI-NO-FINAL-AUTHORITY` | Article 0/VI | `BOUND-AI-EXPLAINS-FORGE-DECIDES` | ADR-003/004 | `constitutional-boundary.schema.json` | `SG-006` | none | boundary validation | rejection evidence | final AI authority blocked |
| `CAP-GENERIC-CRM` | `REQ-NO-GENERIC-CRM` | Article I | `BOUND-FORGE-NOT-CRM` | AGENTS | `path-policy.schema.json` | `SG-006` | none | path validation | rejection evidence | generic CRM not scaffolded |
| `CAP-LEGACY-ORIGINAL-EVIDENCE` | `REQ-LEGACY-EVIDENCE-OWNER-DECISION` | directive section 4 | `BOUND-NO-LEGACY-CODE-COPY` | cleanup report | `evidence-contract.schema.json` | `SG-006` | migration template | evidence validation | owner evidence | blocked until supplied |
| `CAP-PRODUCT-CATALOG-SCOPE` | `REQ-PRODUCT-SOURCE-DOCUMENTS` | Articles III/V | `BOUND-PRODUCT-TRUTH` | ADR-005 | `evidence-contract.schema.json` | `SG-006` | migration template | evidence validation | source documents | blocked until approved |
