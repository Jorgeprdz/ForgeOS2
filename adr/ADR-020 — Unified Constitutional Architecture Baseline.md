# ADR-020 — Unified Constitutional Architecture Baseline

Status: `RATIFIED / LOCKED`

## Context

The Constitutional Rewrite found mixed architecture status, a missing historical ADR-0019 artifact and competing hierarchy representations. The Unified Constitution now supplies one normative root.

## Decision

Forge architecture is governed by these durable invariants:

- the Unified Constitution authorizes architecture;
- significant architecture is recorded by ratified ADRs;
- Forge Core is universal and Rule Packs are contextual interpretation;
- Production Events are facts; rules interpret facts;
- one metric has one owner;
- orchestrators consume and do not duplicate engines;
- Forge is offline-first;
- AI interprets/explains and never becomes source truth or execution authority;
- implementation and Build Tree status do not create architecture.

The historical label `ADR-0019` has no current authority because no canonical artifact exists. This ADR does not reconstruct, impersonate or retroactively ratify it.

## Consequences

The Architectural Constitution remains historical context. Any primitive not incorporated here, in the Unified Constitution or another active ADR requires a new decision. Core/Rule Pack separation controls conflicting historical descriptions.

No runtime, engine, schema, route, UI or software change is authorized.

## Dependencies

`governance/constitution/CONSTITUTION_UNIFIED.md`, AX-003A, ADR-001 through ADR-018 and the ADR-0019 status reconciliation.
