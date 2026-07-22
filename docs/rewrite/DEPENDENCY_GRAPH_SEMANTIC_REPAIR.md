# Dependency Graph Semantic Repair

Report ID: `FORGE_DEPENDENCY_GRAPH_SEMANTIC_REPAIR_001`

## Scope

This repair updates the existing dependency graph, build order and rewrite execution plan. It does not recreate the product architecture, implement Forge OS, execute rewrite stages, modify `main` or copy legacy code.

## Repairs

- Replaced ambiguous readiness with separate definition, scaffold, implementation, execution, validation and promotion readiness fields.
- Recomputed the critical path as a directed mandatory dependency chain instead of using the full topological order.
- Excluded `REJECTED` modules from active build order, active waves and execution selection.
- Excluded `DEFERRED` modules from active execution while preserving them in architecture reports.
- Added structured blocking conditions for all blocked or waiting modules.
- Added implementation blocking conditions for `MOD-NBA-REASON-WHY`, `MOD-PRODUCT-CATALOG` and `MOD-QUOTE-PREVIEW`.
- Replaced single next-module execution with dynamic `next_eligible_modules` and `next_eligible_wave`.
- Kept `stage_id` as governance ownership and added dependency execution fields outside stage numbering.
- Split event taxonomy into build, domain, integration, audit and forbidden event collections.
- Moved path-like evidence into evidence and artifact fields instead of event fields.
- Split promotion gate identity, state and requirements.
- Replaced copied dependency rollback data with explicit rollback strategy, checkpoint, scope, preconditions, impacted modules and evidence fields.

## Semantic Assertions

- `MOD-NBA-REASON-WHY` is not implementation eligible while `MOD-CONVERSATION-INTELLIGENCE` and `MOD-MICK-BEHAVIOR` remain blocked.
- `MOD-PRODUCT-CATALOG` is not implementation eligible while `MOD-CARRIER-SCOPE` remains blocked.
- `MOD-QUOTE-PREVIEW` is not implementation eligible until source, eligibility and calculation dependencies are satisfied.
- `MOD-AUTONOMOUS-AI-DECISIONING` and `MOD-GENERIC-CRM-CLONE` do not appear in active execution order.
- No blocked or waiting module has an empty blocking condition list.
- No path or document name appears in event collections.

## Current Metrics

- Modules analyzed: 37.
- Active modules: 32.
- Scaffold-eligible modules: 11.
- Implementation-eligible modules: 9.
- Waiting for dependencies: 0.
- Waiting for decisions: 15.
- Waiting for evidence: 1.
- Deferred modules: 3.
- Rejected modules: 2.
- Active execution waves: 4.
- Critical path length: 4.
- Topological order length: 37.

## Critical Path

`MOD-TRUTH-GOVERNANCE` -> `MOD-GOVERNANCE-GATE` -> `MOD-HUMAN-APPROVAL-GATE` -> `MOD-ADVISOR-CONVERSION` -> `MOD-ADVISOR-ACTIVATION`

## Validation

The validator `scaffolds/validation/validate-dependency-graph.mjs` now fails closed for:

- invalid critical path integrity;
- rejected modules in active execution;
- deferred modules in active execution;
- blocked modules without blocking conditions;
- readiness dependency inconsistencies;
- phase-specific dependency errors;
- mandatory active dependencies on rejected or deferred modules;
- invalid event taxonomy;
- path or document values in event fields;
- dynamic eligible set mismatches;
- unsafe execution waves;
- invalid promotion gate shape;
- invalid rollback model;
- required semantic assertions.
