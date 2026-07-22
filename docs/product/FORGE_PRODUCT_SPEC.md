# Forge Product Specification

Spec ID: `FORGE_PRODUCT_SPEC_001`

Revision: `PRODUCT_CAPABILITY_REFACTOR_001`

Status: `CANONICAL_PRODUCT_DEFINITION_FOR_REWRITE_SCAFFOLDING`

## Authority

This specification is subordinate to:

1. `governance/constitution/CONSTITUTION_UNIFIED.md`
2. `governance/FORGE_GOVERNANCE_REGISTRY.md`
3. `adr/`
4. Product capability contracts and rewrite manifests.

Inherited code has no normative authority. Original Forge OS evidence may classify behavior only when the owner supplies evidence; it cannot be copied or restored as implementation.

## Product Identity

Name: Forge OS 2.

Purpose: help financial advisors and managers convert reliable commercial, relationship, policy, product and development signals into accountable next actions.

Problem solved: advisors and managers have fragmented evidence, inconsistent follow-up, unclear metric ownership and too many non-actionable reports. Forge turns governed information into decisions and actions without replacing human judgment.

Operational vision: Forge tells an advisor what to do next, with which client or opportunity, and why. For managers, Forge identifies coaching and development actions without automating consequences.

Definition of success:

- each active capability has one purpose and one primary output;
- every strong output exposes evidence, owner, uncertainty and action boundary;
- stages can be built independently by domain;
- blocked capabilities fail closed instead of being guessed;
- Forge remains a Sales Operating System and Decision Intelligence System, not a generic CRM clone.

## Product Principles

- Decision clarity first.
- Evidence before judgment.
- Unknown values remain unknown.
- One metric has one conceptual owner.
- Forecasts are scenarios, not facts.
- Forge Core is universal and Rule Packs interpret facts.
- AI explains or drafts; Forge decides.
- Core behavior must degrade safely offline.
- Advisor-first and manager-aware.
- Relationship, task, policy and activity management are allowed only when they serve Forge decision/action workflows.

## Users And Roles

| Role | Responsibilities | Permissions | Expectations | Authority limits |
|---|---|---|---|---|
| Advisor | Sell responsibly, follow up, maintain relationships, use evidence in decisions | view own operational context and receive recommendations | clear next action, client reason, evidence and uncertainty | remains accountable human decision maker |
| Manager | Develop advisors, coach skills, watch commercial risks | consume manager-safe signals and team summaries | coaching guidance and people-development focus | no automated hiring, firing, punishment, promotion or human-worth judgment |
| Candidate / Precontract Participant | Participate in recruitment or precontract workflows when enabled | limited lifecycle-specific capture and review | clear requirements and progress | must not be reduced to final automated potential score |
| Project Owner | Ratify governance and staged execution | approve gates, owner decisions, merges and promotions | auditable controls and evidence | no silent authority changes |
| Termux Operator | Execute future scaffolds under owner control | run plan, dry-run, apply, validate, evidence, commit and push scripts | safe Android-compatible commands | cannot bypass manifests or constitutional gates |

## Functional Domains

- Decision Intelligence / Forge Core.
- Action Planning.
- Truth, Evidence and Ownership.
- Governance and Validation.
- Read-only Adapters.
- Relationship Intelligence.
- Conversation Intelligence.
- Policy Operations.
- Product Catalog.
- Product Source Packs.
- Carrier Scope.
- Rule Packs.
- Eligibility.
- Calculation.
- Quote Preview.
- Manager Coaching.
- Mick Observable Behavior.
- Advisor Experience Transversal.
- Compensation and Economic Evidence.
- Recruitment and Precontract Lifecycle.
- Legacy Reintroduction Guard.
- Legacy Functional Evidence Intake.

## Capabilities

The processable capability source is `scaffolds/manifest/forge-product-capabilities.json`.

Current counts:

- Total capabilities: 24.
- `PRESERVE`: 6.
- `REDESIGN`: 12.
- `DEFER`: 2.
- `REJECT`: 2.
- `REQUIRES_OWNER_DECISION`: 2.

Capability IDs:

- `CAP-DECISION-CORE`
- `CAP-ACTION-PLANNING`
- `CAP-TRUTH-EVIDENCE`
- `CAP-GOVERNANCE-GATE`
- `CAP-READ-ONLY-ADAPTERS`
- `CAP-RELATIONSHIP-INTELLIGENCE`
- `CAP-CONVERSATION-INTELLIGENCE`
- `CAP-POLICY-OPERATIONS`
- `CAP-PRODUCT-CATALOG`
- `CAP-PRODUCT-SOURCE-PACK`
- `CAP-CARRIER-SCOPE`
- `CAP-RULE-PACK-CONTRACT`
- `CAP-ELIGIBILITY-CONTRACT`
- `CAP-CALCULATION-CONTRACT`
- `CAP-QUOTE-PREVIEW`
- `CAP-MANAGER-COACHING`
- `CAP-MICK-BEHAVIOR`
- `CAP-ADVISOR-EXPERIENCE`
- `CAP-COMPENSATION-ECONOMIC`
- `CAP-RECRUITMENT-PRECONTRACT`
- `CAP-LEGACY-REINTRODUCTION-GUARD`
- `CAP-AUTONOMOUS-AI-DECISIONING`
- `CAP-GENERIC-CRM-CLONE`
- `CAP-LEGACY-FUNCTIONAL-EVIDENCE-INTAKE`

## Critical Flows

### Advisor Next Action

Actor: advisor.

Preconditions: relationship, policy, product or activity evidence exists and passes ownership validation.

Steps:

1. Domain capability emits a bounded signal.
2. Truth and evidence validation assigns owner, source and uncertainty.
3. Decision Core evaluates the signal.
4. Action Planning converts the approved decision into one next action.
5. Human advisor accepts, rejects or defers the action.

Expected result: an actionable recommendation with reason, evidence and no automated external effect.

Error states: missing evidence, ambiguous owner, prohibited action, unsupported product value.

Recovery: mark unknown, block strong output or request owner/source evidence.

Acceptance: no action plan executes a real effect without later approved integration and human authority.

### Manager Coaching Signal

Actor: manager.

Preconditions: observable behavior or business evidence exists.

Steps:

1. Mick emits observable behavior signal only.
2. Truth validation checks source and ownership.
3. Manager Coaching consumes the behavior signal and other evidence.
4. Manager Coaching recommends a coaching action.
5. Human manager decides how to act.

Expected result: coaching guidance, not consequence automation.

Error states: human-worth inference, missing evidence, automated consequence request.

Recovery: block output and require architectural or owner decision.

Acceptance: Manager Coaching and Mick remain decoupled.

### Product Quote Preview

Actor: advisor.

Preconditions: Product Catalog contract exists; source pack, carrier scope, rule pack, eligibility and calculation evidence are available when needed.

Steps:

1. Product Catalog defines source-required product fields.
2. Product Source Pack intake records approved commercial evidence.
3. Carrier Scope identifies applicable carrier/channel/period.
4. Rule Pack interprets facts.
5. Eligibility and Calculation contracts produce bounded results.
6. Quote Preview emits a non-binding read model.

Expected result: non-binding preview with source, assumptions and blocked effects.

Error states: missing source pack, missing rule snapshot, unknown premium, unsupported product.

Recovery: keep unknown values unknown and block strong preview claims.

Acceptance: no product, premium, benefit or rule is invented.

### Legacy Guard And Evidence Intake

Actor: owner or Termux operator.

Preconditions: rewrite stage planning is underway.

Steps:

1. Legacy Reintroduction Guard validates paths and prohibited files from the beginning.
2. Guard blocks restored legacy clusters and copied code without needing original Forge evidence.
3. Legacy Functional Evidence Intake remains blocked until owner-supplied evidence exists.
4. Intake classifies behavior only as preserve, redesign, defer, reject or owner decision.

Expected result: anti-legacy protection is active while evidence intake remains explicitly blocked.

Acceptance: no legacy code, architecture or removed modules are copied or restored.

## Non-Functional Requirements

- Security: no secrets in scaffolds, manifests or generated evidence.
- Privacy: personal or client evidence must be referenced by source, not copied into scaffolds.
- Auditability: every stage has traceability, evidence and rollback rule.
- Resilience: scripts fail closed and preserve exit codes.
- Portability: Termux scripts quote paths with spaces and detect repository root with Git.
- Maintainability: capabilities and stages have single responsibility.
- Offline/degraded operation: core contracts cannot depend on AI providers.
- Observability: validation and evidence outputs are explicit.

## Out Of Scope

- Functional Forge OS 2 implementation.
- Final UI screens.
- Product, premium, benefit or compensation values without source packs.
- Supabase production migrations.
- Secrets or provider integrations.
- Original Forge OS code copy.
- Restoring removed legacy clusters.
- Generic CRM clone behavior detached from Forge decision/action identity.
