# Scaffold Instantiation Gate 002

Gate ID: `SG-002`

Name: `Scaffold Instantiation 002`

Version: `1.0.0`

Effective date: `2026-07-21`

Status: `RATIFIED / APPROVED / ACTIVE FOR SG-002 ONLY`

## Constitutional Gate

- Applicable Constitution: `CONSTITUTION_UNIFIED.md` v4.0, including Article 0 / Ley Zero and Articles II–X.
- Applicable ADRs: ADR-001–018 according to each named instance and ADR-020 for the architecture baseline.
- Excluded authority: ADR-016A, historical ADR-0019 references, SKYNET, Russell and historical/candidate documents.
- Build Tree Area: Constitutional Rewrite → Post-Rewrite Architecture → Scaffold Instantiation 002.
- Discovery Status: `READY WITH CONDITIONS`.
- Implementation Readiness: `READY WITH CONDITIONS / DOCUMENTATION ONLY`.
- Miranda Approval: `APPROVED` for the exact manifest and fail-closed conditions in this gate.
- Board Approval: `APPROVED`; Single Human Authority Board, Project Owner, quorum 1 of 1.
- Validation Expectation: every validation in this gate must PASS.

## Purpose

Authorize one documentary execution that instantiates the SG-001 canonical templates only for the exact evidence-backed domains, owners and filenames listed below.

## Implementation Authorization

`IMPLEMENTATION_AUTHORIZED=true`

`IMPLEMENTATION_SCOPE=SG002_DOCUMENTARY_SCAFFOLD_INSTANTIATION_ONLY`

`SOFTWARE_IMPLEMENTATION_AUTHORIZED=false`

This authorization creates lower-tier documentary instances. It does not create or amend architecture, domains, owners, Source of Truth meaning, ADRs, rules, software or runtime.

## Authorized Domain Set

The only authorized domain candidates are:

1. Product Intelligence — ADR-005.
2. Policy Intelligence — ADR-006.
3. Forecast Intelligence — ADR-007.
4. NASH / Conversation Intelligence — Constitution Article VI and ADR-010; no Source of Truth instance.
5. Relationship Intelligence — ADR-011.
6. Business Planning — ADR-012.
7. Mick / Behavior Intelligence — Constitution Article VI and ADR-013.
8. Productivity — ADR-014.
9. Manager Intelligence — Constitution Articles IV/VI and ADR-015.
10. Advisor Experience with Benvenù — Article 0 and ADR-016; Benvenù remains nested except for its already-established Source of Truth entry.
11. Compensation Intelligence — ADR-017.
12. Economic Motivation — ADR-018.

## Exact Allowlist

Only the following Markdown files may be created:

### Domain Responsibility Instances

- `docs/architecture/scaffolds/instances/domains/PRODUCT_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/POLICY_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/FORECAST_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/NASH_CONVERSATION_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/RELATIONSHIP_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/BUSINESS_PLANNING_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/MICK_BEHAVIOR_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/PRODUCTIVITY_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/MANAGER_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/ADVISOR_EXPERIENCE_BENVENU_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/COMPENSATION_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md`
- `docs/architecture/scaffolds/instances/domains/ECONOMIC_MOTIVATION_DOMAIN_RESPONSIBILITY.md`

### Existing-Owner Source of Truth Instances

- `docs/architecture/scaffolds/instances/source-truth/PRODUCT_TRUTH_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/POLICY_TRUTH_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/FORECAST_SCENARIO_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/RELATIONSHIP_SIGNAL_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/ACTION_PATH_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/OBSERVABLE_BEHAVIOR_PATTERN_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/PRODUCTIVITY_METRIC_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/MANAGER_COACHING_CONTEXT_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/ADVISOR_EXPERIENCE_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/BENVENU_FIRST_VALUE_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/COMPENSATION_RULE_INTERPRETATION_OWNERSHIP.md`
- `docs/architecture/scaffolds/instances/source-truth/ECONOMIC_MOTIVATION_PRESENTATION_OWNERSHIP.md`

NASH receives no Source of Truth instance because current authority does not establish a separate “Conversation Truth” owner.

### Domain-Owned Boundary Instances

- `docs/architecture/scaffolds/instances/boundaries/PRODUCT_TRUTH_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/POLICY_TRUTH_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/FORECAST_TRUTH_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/NASH_CONVERSATION_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/RELATIONSHIP_NON_MANIPULATION_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/BUSINESS_PLANNING_PLAN_TO_ACTION_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/MICK_BEHAVIOR_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/PRODUCTIVITY_METRIC_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/MANAGER_INTELLIGENCE_AUTHORITY_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/ADVISOR_EXPERIENCE_BENVENU_ANTI_DEPENDENCE_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/COMPENSATION_EVIDENCE_BOUNDARY.md`
- `docs/architecture/scaffolds/instances/boundaries/ECONOMIC_MOTIVATION_CLIENT_FIRST_BOUNDARY.md`

### SG-002 Control Documents

- `docs/architecture/scaffolds/sg-002/SG002_PREFLIGHT_REPORT.md`
- `docs/architecture/scaffolds/sg-002/SG002_INSTANTIATION_INVENTORY.md`
- `docs/architecture/scaffolds/sg-002/SG002_BLOCKED_CANDIDATE_REGISTER.md`
- `docs/architecture/scaffolds/sg-002/SG002_INSTANCE_TRACEABILITY_MATRIX.md`
- `docs/architecture/scaffolds/sg-002/SG002_CHANGELOG.md`

Only the following existing files may be modified:

- `docs/architecture/source-truth/SCAFFOLD_SOURCE_OF_TRUTH_INDEX.md`
- `governance/scaffolds/INDEX.md`
- `governance/scaffolds/SCAFFOLD_INVENTORY.md`
- the SG-002 registration block inside `FORGE_MASTER_BUILD_TREE.md`

Directory permission is not implied. Any path absent from this manifest is read-only.

## Prohibited Surfaces

SG-002 may not create a scaffold or owner for Economic Evidence, NBA, Career Intelligence, Conservation Intelligence, Revenue Generation, Andrey/HCA, Russell or SKYNET.

SG-002 may not create standalone Dependency/Relationship instances. Evidenced dependencies may be referenced inside allowed instances without transferring ownership.

SG-002 may not modify:

- Constitution, Article 0 provenance, Ley Zero identity or Constitution Map;
- ADR files, ADR meaning or ADR status;
- Governance Registry, governance policies, axioms, gates, approvals or Constitutional Locks;
- Organization Profiles, Rule Packs or business rules;
- historical or archived artifacts, including `/storage/emulated/0/Forge OS`;
- source code, runtime, engines, services, APIs, UI, schemas, migrations, RLS, tests, scripts, packages, fixtures or executable artifacts;
- any non-Markdown file.

## Thirteen-Section Requirement

Every instantiated scaffold must preserve these thirteen sections in this order:

1. Purpose
2. Scope
3. Responsibilities
4. Authority
5. Boundaries
6. Dependencies
7. Source of Truth
8. Related Documents
9. Related ADRs
10. Constitutional References
11. Status
12. Version
13. Traceability

The SG-001 wording inconsistency that says “twelve” while enumerating thirteen is not authorized for repair by SG-002. The enumerated thirteen control this execution.

## Required Validations

1. SG-001 Preflight Validation.
2. Constitution Validation.
3. Article 0 / Ley Zero Validation.
4. ADR-020 and applicable ADR Validation.
5. Owner Evidence Validation using exact active authority.
6. Unknown Owner Fail-Closed Validation.
7. Thirteen-Section Template Validation.
8. Domain Boundary Validation.
9. Source of Truth Non-Duplication Validation.
10. Dependency Reference Validation.
11. NASH Non-Truth/Non-Execution Validation.
12. Human Authority Validation.
13. Inventory and Index Validation.
14. Cross-Reference and Cross-Link Validation.
15. Build Tree Status Validation.
16. Historical Non-Restoration Validation.
17. Constitutional Locks Non-Regression Validation.
18. Markdown-Only / Software-Zero-Diff Validation.
19. Exact Allowlist Validation.
20. Git Diff and Working Tree Isolation Validation.

Every validation must PASS. Missing or ambiguous owner evidence blocks the affected instance; it does not authorize inference.

## Remote Policy

IF all required validations PASS, THEN one SG-002-scoped commit and push to the active branch are authorized.

ELSE STOP immediately, produce an allowlisted diagnostic, and perform no commit or push.

Unrelated or pre-existing working-tree files must not be staged. Push does not authorize merge, deployment, release or later software work.

## Phase Boundary

`NEXT_STAGE=Scaffold Instantiation 002`

The next stage is authorized only for the exact manifest above. No post-SG-002 phase is authorized.

## Final Declaration

`GATE_ID=SG-002`

`STATUS=APPROVED`

`IMPLEMENTATION_READINESS=READY_WITH_CONDITIONS`

`IMPLEMENTATION_AUTHORIZED=true`

`IMPLEMENTATION_SCOPE=DOCUMENTARY_SCAFFOLD_INSTANTIATION_ONLY`

`ALLOWLIST=EXACT_MANIFEST_IN_THIS_GATE`

`PROHIBITED_SURFACES=ALL_NON_ALLOWLISTED_AND_ALL_SOFTWARE_SURFACES`

`REQUIRED_VALIDATIONS=20_BLOCKING_VALIDATIONS`

`REMOTE_POLICY=COMMIT_AND_PUSH_ONLY_AFTER_ALL_PASS`

`NEXT_STAGE=Scaffold Instantiation 002`

`SOFTWARE_IMPLEMENTATION_AUTHORIZED=false`
