# Architectural Risk Report

Report ID: `FORGE_ARCHITECTURAL_RISK_REPORT_002`

- Active modules with mandatory deferred/rejected dependencies fail validation.
- Blocked modules without structured blocking conditions fail validation.
- Rejected modules in active execution fail validation.
- Event fields containing file paths fail validation.

Highest fan-out modules:

- `MOD-TRUTH-GOVERNANCE`: 11
- `MOD-GOVERNANCE-GATE`: 3
- `MOD-READONLY-ADAPTERS`: 3
- `MOD-RULE-PACK-CONTRACT`: 3
- `MOD-CALCULATION-CONTRACT`: 3
