# Forge Product Specification

Spec ID: `FORGE_PRODUCT_SPEC_001`

Status: `CANONICAL_PRODUCT_DEFINITION_FOR_REWRITE_SCAFFOLDING`

Authority:

- `governance/constitution/CONSTITUTION_UNIFIED.md`
- `AGENTS.md`
- `governance/FORGE_GOVERNANCE_REGISTRY.md`
- `adr/`
- `docs/architecture/scaffolds/`

## Product Identity

Name: Forge OS 2.

Purpose: help financial advisors and managers convert reliable commercial, relationship, policy, product and development signals into accountable next actions.

Problem solved: advisors and managers have fragmented evidence, inconsistent follow-up, unclear ownership of metrics and too many non-actionable reports. Forge must turn governed information into decisions and actions without replacing human judgment.

Operational vision: Forge tells an advisor what to do next, with which client or opportunity, and why. For managers, Forge identifies coaching/development actions and risks without automating human consequences.

Product principles:

- decision clarity first;
- evidence before judgment;
- unknown values remain unknown;
- one metric has one conceptual owner;
- forecasts are scenarios, not facts;
- Forge Core is universal and Rule Packs interpret facts;
- AI may explain or draft but never become source truth;
- offline-first core behavior;
- advisor-first and manager-aware;
- no inherited implementation is authoritative by existence.

Definition of success:

- each active capability produces an evidence-bounded actionable output;
- each output exposes source, owner, uncertainty and next action;
- each future module traces to product capability, constitutional authority, ADR, contract, validation and evidence;
- blocked or uncertain capabilities fail closed instead of being guessed.

## Users And Roles

| Role | Responsibilities | Permissions | Expectations | Authority limits |
|---|---|---|---|---|
| Advisor | Sell responsibly, follow up, maintain client relationships, use evidence in decisions | view own operational context, receive recommendations, draft messages | clear next action, client reason, evidence and uncertainty | remains accountable human decision maker |
| Manager | Develop advisors, coach skills, watch commercial risks | consume manager-safe signals and team summaries | coaching guidance and people-development focus | no automated hiring, firing, punishment, promotion or human-worth judgment |
| Candidate / Precontract Participant | Participate in recruitment or precontract workflows when enabled | limited lifecycle-specific capture and review | clear requirements and progress | must not be reduced to final automated potential score |
| Project Owner | Ratify governance and staged execution | approve gates, owner decisions, merges and promotions | auditable controls and evidence | no silent authority changes |
| Termux Operator | Execute future scaffolds under owner control | run plan, dry-run, apply, validate, evidence, commit and push scripts | safe Android-compatible commands | cannot bypass manifests or constitutional gates |

## Functional Domains

Domains are derived from `AGENTS.md`, the Unified Constitution, ADRs, Build Tree, SG-002 documentary instances and current platform adapters:

- Decision Intelligence / Forge Core;
- Action Planning;
- Truth, Evidence and Ownership;
- Conversation Intelligence / Nash;
- Relationship Intelligence;
- Product Intelligence;
- Policy and Sales Operations;
- Quote Preview and Read Models;
- Manager and Team Intelligence;
- Behavior Intelligence / Mick;
- Productivity Intelligence;
- Forecast Intelligence;
- Compensation and Economic Evidence;
- Advisor Experience / Benvenu;
- Recruitment and Precontract Intelligence;
- Governance and Validation;
- Termux Rewrite Execution.

## Capabilities

### `CAP-DECISION-CORE`

Name: Decision Core.

Classification: `PRESERVE`.

Purpose: select evidence-bounded decision candidates and return actionable output.

Users: advisor, manager, Termux operator for validation.

Problem resolved: prevents Forge from becoming a passive information display.

Inputs: facts, rules, policies, context envelope, evidence references.

Outputs: decision result, confidence, reasoning, evidence, actions.

Known rules: orchestrators consume engines; no metric duplication; unknown remains unknown.

Integrations: `platform/core`, future domain engines.

Risks: hidden business logic duplication, unsupported recommendations.

Authority: Constitution Articles III and V; ADR-001, ADR-002, ADR-003, ADR-004, ADR-020.

Acceptance: a generated module cannot expose a decision without evidence, owner, confidence and action boundary.

### `CAP-ACTION-PLANNING`

Name: Action Planning.

Classification: `PRESERVE`.

Purpose: convert approved decisions into bounded action plans.

Users: advisor, manager.

Problem resolved: intelligence without action.

Inputs: decision result, policy result, action contract.

Outputs: action plan, blocked effects, approval requirement.

Authority: Constitution Articles IV and V; ADR-003, ADR-009, ADR-012.

Acceptance: action output must distinguish recommendation from execution and block unauthorized real effects.

### `CAP-TRUTH-EVIDENCE`

Name: Truth, Evidence and Ownership.

Classification: `PRESERVE`.

Purpose: enforce source ownership, evidence states and one-owner metric rules.

Users: all domains.

Inputs: truth envelopes, source types, claim types, ownership registries.

Outputs: pass/fail/block validation, owner, evidence state and risk.

Authority: Constitution Article III; ADR-001, ADR-002, ADR-005, ADR-006, ADR-007, ADR-008, ADR-014, ADR-017.

Acceptance: unknown, ambiguous or conflicting ownership blocks strong output.

### `CAP-GOVERNANCE-GATE`

Name: Constitutional Governance Gate.

Classification: `PRESERVE`.

Purpose: require constitutional authority, ADRs, Build Tree area, readiness and approval before protected work.

Users: owner, Termux operator, Codex.

Inputs: stage contract, scope, prohibited surfaces, validation expectation.

Outputs: approved or blocked gate decision.

Authority: Constitution Article VIII; `governance/validation/FORGE_ROBOCOP_DIRECTIVES.md`.

Acceptance: missing gate fields produce `BLOCKED_BY_ROBOCOP_LOCK_001`.

### `CAP-READ-ONLY-ADAPTERS`

Name: Read-Only Adapters.

Classification: `PRESERVE`.

Purpose: expose modeled CRM, policy, quote, product and opportunity read models without writes.

Users: advisor, manager, future UI.

Inputs: modeled read requests.

Outputs: read-model envelopes, safe empty states, blocked effects.

Authority: Constitution Articles III-V; current `platform/adapters`.

Acceptance: adapters must not create writes, persistence or real effects.

### `CAP-RELATIONSHIP-INTELLIGENCE`

Name: Relationship Intelligence.

Classification: `REDESIGN`.

Purpose: help advisors know who to contact, why, when and what opportunity exists.

Users: advisor, manager where safe.

Inputs: relationship timeline, engagement, life events, referral opportunities.

Outputs: next relationship action with evidence and non-manipulation limits.

Authority: Constitution Articles III, IV, VI and VII; ADR-011.

Acceptance: recommendations must not manipulate, infer permission or hide uncertainty.

### `CAP-CONVERSATION-INTELLIGENCE`

Name: Nash Conversation Intelligence.

Classification: `REDESIGN`.

Purpose: help advisors know what to say, why and when.

Users: advisor.

Inputs: context envelope, conversation goal, objections, relationship evidence.

Outputs: draft, talking points, next best question, uncertainty.

Authority: Constitution Article VI; ADR-010.

Acceptance: AI or Nash drafts cannot become source truth or send messages directly.

### `CAP-POLICY-OPERATIONS`

Name: Policy and Sales Operations.

Classification: `REDESIGN`.

Purpose: support policy details, timeline, renewals, follow-up, tasks, OCR and operational center.

Users: advisor, operations user if later defined.

Inputs: policy read models, documents, tasks, operational events.

Outputs: policy action candidates and operational follow-up.

Authority: Constitution Articles III and V; ADR-006.

Acceptance: issued policy truth remains separate from quote, forecast or paid premium truth.

### `CAP-PRODUCT-QUOTE-PREVIEW`

Name: Product and Quote Preview.

Classification: `REDESIGN`.

Purpose: understand product/quote evidence and produce non-binding preview read models.

Users: advisor.

Inputs: product documentation, quote text/PDF evidence, parser outputs.

Outputs: preview read model, assumptions, warnings, blocked effects.

Authority: Constitution Articles III and V; ADR-005, ADR-008, ADR-017.

Acceptance: previews must be labeled non-binding and cannot invent products, benefits or premiums.

### `CAP-MANAGER-COACHING`

Name: Manager Coaching Intelligence.

Classification: `REDESIGN`.

Purpose: help managers develop people through coaching signals.

Users: manager.

Inputs: permitted performance, behavior and relationship signals.

Outputs: coaching action, skill focus, risk watch.

Authority: Constitution Articles IV and VI; ADR-015.

Acceptance: no automated consequences, rankings of human worth or sensitive leakage into Advisor OS.

### `CAP-MICK-BEHAVIOR`

Name: Mick Behavior Intelligence.

Classification: `REDESIGN`.

Purpose: measure observable behaviors that produce commercial outcomes.

Users: advisor, manager.

Inputs: activity evidence, consistency signals, coachability evidence.

Outputs: behavior pattern, coaching prompt, risk or consistency signal.

Authority: Constitution Article VI; ADR-013.

Acceptance: must measure observable behavior, not motivation or human worth.

### `CAP-ADVISOR-EXPERIENCE`

Name: Advisor Experience / Benvenu.

Classification: `DEFER`.

Purpose: create first value, progressive discovery and contextual help without generic onboarding.

Users: advisor.

Inputs: advisor context, learning state, behavior evidence.

Outputs: baseline snapshot, first action, contextual help state.

Authority: Article 0; ADR-016.

Acceptance: deferred until owner approves implementation details for non-UI and UI boundaries.

### `CAP-COMPENSATION-ECONOMIC`

Name: Compensation and Economic Evidence.

Classification: `DEFER`.

Purpose: interpret production events through rule packs and economic evidence.

Users: advisor, manager.

Inputs: production events, rule snapshots, period context, compensation schedules.

Outputs: scenario or evidence-bounded economic output.

Authority: Constitution Article III; ADR-008, ADR-017, ADR-018.

Acceptance: deferred until rule-pack contracts and owner-approved data sources exist.

### `CAP-RECRUITMENT-PRECONTRACT`

Name: Recruitment and Precontract Intelligence.

Classification: `DEFER`.

Purpose: support recruitment identity, applications, assessments, interviews, cycles and readiness.

Users: manager, candidate/precontract participant.

Inputs: recruit identity, applications, assessments, interviews, office rules.

Outputs: lifecycle stage, readiness, risk and coaching/development action.

Authority: Constitution Articles IV and VI; AGENTS recruitment/precontract section.

Acceptance: deferred until owner ratifies product definition, source truth and lifecycle rules.

### `CAP-LEGACY-WEB-SHELL`

Name: Legacy Root Web Shell.

Classification: `REJECT`.

Purpose: none in Forge OS 2 rewrite.

Problem: removed root web/PWA shell referenced missing `app.js` and legacy assets.

Authority: cleanup report and Constitution Article V.

Acceptance: future scaffolds must not regenerate root `index.html`, `app.js`, service worker or legacy monolith unless separately ratified.

### `CAP-AUTONOMOUS-AI-DECISIONING`

Name: Autonomous AI Decisioning.

Classification: `REJECT`.

Purpose: explicitly prohibited.

Authority: Article 0 and Article VI.

Acceptance: any scaffold attempting final AI authority returns `BLOCKED_CONSTITUTIONAL_VIOLATION`.

### `CAP-GENERIC-CRM`

Name: Generic CRM Reconstruction.

Classification: `REJECT`.

Purpose: explicitly outside Forge identity.

Authority: Constitution Article I and AGENTS identity.

Acceptance: no scaffold may create generic CRM modules without decision/action intelligence ownership.

### `CAP-LEGACY-ORIGINAL-EVIDENCE`

Name: Forge OS Original Evidence Intake.

Classification: `REQUIRES_OWNER_DECISION`.

Purpose: classify original Forge OS evidence if supplied later.

Status: `BLOCKED_REQUIRES_LEGACY_EVIDENCE`.

Acceptance: no capability from the original system may be admitted without evidence, owner decision and traceability.

### `CAP-PRODUCT-CATALOG-SCOPE`

Name: Product Catalog Scope.

Classification: `REQUIRES_OWNER_DECISION`.

Purpose: determine whether product documentation, carriers and rule packs are in scope for a future stage.

Status: `BLOCKED_REQUIRES_PRODUCT_DEFINITION`.

Acceptance: no product database, benefits or premiums are generated before owner approval and source documents.

## Critical Flows

### Advisor Next Action

Actor: advisor.

Preconditions: evidence exists, source owner is known, decision context is valid.

Steps:

1. Capture or import evidence once.
2. Validate truth ownership.
3. Build decision context.
4. Evaluate decision candidate.
5. Produce action plan.
6. Show evidence, uncertainty and blocked effects.

Expected result: an actionable recommendation with evidence.

Errors: unknown owner, missing evidence, constitutional violation, action requires approval.

Recovery: collect evidence, defer, or request owner decision.

Acceptance: no output hides uncertainty or executes real effects.

### Manager Coaching Signal

Actor: manager.

Preconditions: manager-safe evidence and coaching scope.

Steps: validate permitted signals, block sensitive leakage, produce coaching recommendation.

Expected result: coaching action, skill focus and risk watch.

Errors: human-consequence automation, human-worth ranking, insufficient evidence.

Acceptance: no enforcement or employment consequence.

### Quote Preview

Actor: advisor.

Preconditions: quote evidence exists and parser is modeled.

Steps: parse evidence, mark preview as non-binding, validate product/economic boundaries, emit read model.

Expected result: preview envelope with assumptions and warnings.

Errors: missing source document, invented value risk, issued-policy conflict.

Acceptance: no binding quote or policy truth claim.

### Termux Governed Stage Execution

Actor: Termux operator.

Preconditions: repo clean, branch not main, product spec and manifests valid.

Steps: bootstrap, inspect capabilities, plan, dry-run, apply, validate, evidence, commit, push.

Expected result: stage-generated files only when authorized.

Errors: dirty tree, blocked stage, missing traceability, overwrite risk, constitutional violation.

Acceptance: no automatic next stage and no main promotion.

## Non-Functional Requirements

- Security: no secrets in scaffolds, logs or evidence.
- Privacy: personal interpretation must expose purpose limits and human review.
- Data isolation: manager-sensitive signals must not leak into Advisor OS.
- Auditability: every stage produces evidence and validation result.
- Traceability: every scaffold links product capability to authority, ADR, contract, validation and evidence.
- Resilience: Termux scripts must fail closed and support resume/rollback for uncommitted stages.
- Portability: scripts must detect Git root and handle `/storage/emulated/0/Forge OS v2`.
- Offline/degraded operation: core scaffolding validation must work without external providers.
- Maintainability: generated files must be deterministic and minimal.

## Out Of Scope

- implementing Forge OS 2 functional modules;
- final UI/screens;
- production services or Supabase migrations;
- automatic main promotion;
- legacy root web shell reconstruction;
- generic CRM implementation;
- autonomous AI decisioning;
- invented products, financial values, premiums, coverage or forecasts;
- admitting Forge OS original behavior without evidence and owner decision.
