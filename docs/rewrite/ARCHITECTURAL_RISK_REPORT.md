# Architectural Risk Report

Report ID: `FORGE_ARCHITECTURAL_RISK_REPORT_001`

Primary risks are derived from fan-in, fan-out and blocked stage ownership. This report does not infer runtime behavior.

- High fan-in: `MOD-QUOTE-PREVIEW` depends on 4 modules.
- High fan-in: `MOD-ADVISOR-WORKSPACE` depends on 2 modules.
- High fan-in: `MOD-RELATIONSHIP-INTELLIGENCE` depends on 2 modules.
- High fan-in: `MOD-POLICY-OPERATIONS` depends on 2 modules.
- High fan-in: `MOD-MANAGER-COACHING` depends on 2 modules.
- High fan-out: `MOD-TRUTH-GOVERNANCE` supports 11 consumers.
- High fan-out: `MOD-GOVERNANCE-GATE` supports 3 consumers.
- High fan-out: `MOD-READONLY-ADAPTERS` supports 3 consumers.
- High fan-out: `MOD-RULE-PACK-CONTRACT` supports 3 consumers.
- High fan-out: `MOD-CALCULATION-CONTRACT` supports 3 consumers.
- Blocked: `MOD-MANAGER-WORKSPACE` is owned by `SG-013`.
- Blocked: `MOD-RELATIONSHIP-INTELLIGENCE` is owned by `SG-003`.
- Blocked: `MOD-CONVERSATION-INTELLIGENCE` is owned by `SG-004`.
- Blocked: `MOD-POLICY-OPERATIONS` is owned by `SG-005`.
- Blocked: `MOD-PRODUCT-SOURCE-PACK` is owned by `SG-007`.
- Blocked: `MOD-CARRIER-SCOPE` is owned by `SG-008`.
- Blocked: `MOD-RULE-PACK-CONTRACT` is owned by `SG-009`.
- Blocked: `MOD-ELIGIBILITY-CONTRACT` is owned by `SG-010`.
