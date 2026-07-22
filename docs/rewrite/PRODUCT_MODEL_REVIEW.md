# Product Model Review

Review ID: `FORGE_PRODUCT_MODEL_REVIEW_001`

Status: `COMPLETE`

Scope: Product Spec, capability manifest, requirements traceability, rewrite manifest and rewrite stages.

## Findings

The first scaffold model was structurally valid but conceptually over-coupled:

- SG-003 grouped Relationship Intelligence, Conversation Intelligence, Policy Operations and Product Quote Preview only because the advisor was a common user.
- SG-004 mixed Mick observable behavior with Manager Coaching recommendations.
- SG-005 treated Advisor Experience as an advanced deferred domain instead of a cross-cutting capability.
- SG-006 mixed always-active anti-legacy protection with blocked legacy functional evidence intake.
- Product Quote Preview hid distinct responsibilities: Product Catalog, Product Source Pack, Carrier Scope, Rule Pack, Eligibility, Calculation and Quote Preview.
- Generic CRM rejection risked false positives against valid Forge relationship, task, policy, activity and opportunity workflows.

## Decisions

- Capabilities must have one purpose and one primary output.
- Stages must have one responsibility and one evidence path.
- Product architecture is not blocked by missing commercial documentation when a contract can be modeled first.
- Product Source Packs remain blocked until owner-approved commercial documents exist.
- Legacy Reintroduction Guard is active from the beginning and independent from legacy evidence intake.
- Legacy Functional Evidence Intake remains blocked and classifies behavior only.
- Manager Coaching and Mick Observable Behavior remain decoupled.
- Advisor Experience is modeled as transversal, not as a deferred catch-all domain.
- CRM-like records are allowed when they support Forge decision and action workflows; only a generic CRM clone is rejected.

## Capabilities Divided

- `CAP-PRODUCT-QUOTE-PREVIEW` became:
  - `CAP-PRODUCT-CATALOG`
  - `CAP-PRODUCT-SOURCE-PACK`
  - `CAP-CARRIER-SCOPE`
  - `CAP-RULE-PACK-CONTRACT`
  - `CAP-ELIGIBILITY-CONTRACT`
  - `CAP-CALCULATION-CONTRACT`
  - `CAP-QUOTE-PREVIEW`
- `CAP-LEGACY-ORIGINAL-EVIDENCE` became:
  - `CAP-LEGACY-REINTRODUCTION-GUARD`
  - `CAP-LEGACY-FUNCTIONAL-EVIDENCE-INTAKE`

## Capabilities Reframed

- `CAP-GENERIC-CRM` became `CAP-GENERIC-CRM-CLONE`.
- `CAP-ADVISOR-EXPERIENCE` became a transversal redesign capability.
- `CAP-MICK-BEHAVIOR` is now explicitly observable behavior only.
- `CAP-MANAGER-COACHING` is now explicitly recommendation-only and consequence-safe.

## Capabilities Fused

No capabilities were fused. The review found excessive aggregation, not artificial fragmentation.

## Stages Created

Created independent stages:

- `SG-007` Product Source Pack Intake.
- `SG-008` Carrier Scope Contract.
- `SG-009` Rule Pack Contract.
- `SG-010` Eligibility Contract.
- `SG-011` Calculation Contract.
- `SG-012` Quote Preview Contract.
- `SG-013` Manager Coaching Contract.
- `SG-014` Mick Observable Behavior Contract.
- `SG-015` Advisor Experience Transversal Contract.
- `SG-016` Compensation And Economic Evidence Contract.
- `SG-017` Recruitment And Precontract Lifecycle Contract.
- `SG-018` Legacy Reintroduction Guard.
- `SG-019` Rejected Capability Guard.
- `SG-020` Legacy Functional Evidence Intake.

## Stages Replaced

- Old SG-003 advisor-domain bundle was replaced by SG-003, SG-004 and SG-005, plus product stages SG-006 through SG-012.
- Old SG-004 manager/behavior bundle was replaced by SG-013 and SG-014.
- Old SG-005 deferred advanced-domain bundle was replaced by SG-015, SG-016 and SG-017.
- Old SG-006 legacy/rejection bundle was replaced by SG-018, SG-019 and SG-020.

## Block Reduction

The old model blocked four advisor domains behind one owner decision. The refactor gives each domain its own blocker and allows `SG-006` Product Catalog Contract and `SG-018` Legacy Reintroduction Guard to be `READY`.

## New Risks

- More stages increase manifest maintenance surface.
- Product Catalog can be scaffolded before Source Packs, so validators must keep unknown commercial values explicit.
- Carrier Scope, Rule Pack, Eligibility and Calculation require later architectural decisions before implementation.

## Traceability Impact

Traceability expanded from 19 capability rows to 23 capability rows. Every capability now maps to a distinct requirement, authority, boundary, contract, stage, validation, evidence path and acceptance statement.

## Confirmations

- Product implemented: no.
- Rewrite stage executed: no.
- Legacy code copied: no.
- Main modified: no.
