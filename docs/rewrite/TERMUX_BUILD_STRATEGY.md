# Termux Build Strategy

Strategy ID: `FORGE_TERMUX_BUILD_STRATEGY_002`

The future Termux rewrite is dependency-driven. It must read `scaffolds/manifest/rewrite-execution-plan.json` and choose from `next_eligible_modules`, not from a single linear next pointer.

Stage IDs are governance ownership only and must not be sorted numerically to determine execution order.

Current scaffold-eligible modules:

- `MOD-GOVERNANCE-GATE`
- `MOD-HUMAN-APPROVAL-GATE`
- `MOD-ADVISOR-CONVERSION`
- `MOD-ADVISOR-ACTIVATION`
- `MOD-READONLY-ADAPTERS`
- `MOD-PRODUCT-CATALOG`
- `MOD-ADVISOR-WORKSPACE`
- `MOD-ADVISOR-LIFECYCLE`
- `MOD-CLIENT-CRM-READMODEL`
- `MOD-NBA-REASON-WHY`
- `MOD-OPPORTUNITY-PIPELINE`

## Active Wave 2

- `MOD-GOVERNANCE-GATE`
- `MOD-READONLY-ADAPTERS`
- `MOD-ADVISOR-LIFECYCLE`

## Active Wave 3

- `MOD-HUMAN-APPROVAL-GATE`
- `MOD-PRODUCT-CATALOG`
- `MOD-CLIENT-CRM-READMODEL`
- `MOD-NBA-REASON-WHY`
- `MOD-OPPORTUNITY-PIPELINE`

## Active Wave 4

- `MOD-ADVISOR-CONVERSION`
- `MOD-ADVISOR-WORKSPACE`

## Active Wave 5

- `MOD-ADVISOR-ACTIVATION`

Rejected and deferred modules are excluded from active execution. Blocked modules remain visible in waiting sections with structured blocking conditions.
