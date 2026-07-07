# Forge Opportunity Pipeline Read-Only Adapter Decision Lock 066D

Status: LOCKED

Phase:
`066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK`

Decision:
`PASS_066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK`

Decision lock:
`OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_LOCKED_AS_TEMPORARY_LOCAL_STATIC_SHIM`

Next:
`067A_OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPE`

## Robocop Gate

- Applicable Constitution: Article 0, Decision Clarity First, Advisor-first, no invented truth, AI explains and Forge decides.
- Applicable ADRs: 064F through 066C backend/read-only adapter boundary continuity.
- Build Tree area: Opportunity Pipeline / Read-only Adapter / Decision Lock.
- Discovery status: 066B implementation complete; 066B1 reconciliation complete; 066C QA lock complete.
- Implementation readiness: decision/docs only.
- Miranda approval: PASS for bounded decision lock only.
- Board approval status: bounded to local/static read-only shim decision.
- Scope boundary: decision lock for the 066B adapter after 066B1 reconciliation and 066C QA.
- Prohibited surfaces: UI, backend connection, provider runtime, auth, secrets, writes, browser persistence, real engine execution.
- Validation expectation: audit JSON, exact decision markers, diff check, safety scan, staged boundary.

## Inputs

066D is based on:

- `066A_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_SCOPE`
- `066B_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_IMPLEMENTATION`
- `066B1_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION`
- `066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK`

Key files:

- `platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js`
- `tests/opportunity-pipeline-read-only-adapter-066b-test.js`
- `docs/evidence/forge-opportunity-pipeline-existing-module-reconciliation-audit-066b1.json`
- `docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json`

## Decision

The Opportunity Pipeline read-only adapter is locked for its current purpose:

`OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_LOCKED_AS_TEMPORARY_LOCAL_STATIC_SHIM`

This means:

- the adapter is approved as a local/static/read-only preview shim;
- it may support QA and preview-safe read model flows;
- it must not be treated as canonical backend truth;
- it must not become a permanent fixture source;
- it must not connect real backend, CRM, provider, auth, storage, calendar, messaging, or write paths;
- it must remain subordinate to the future canonical source mapping phase.

## What Is Locked

Locked adapter identity:
`forge.opportunity_pipeline.read_only.adapter.v1`

Locked route class:
`read_only`

Locked adapter type:
`local_static_fixture`

Locked adapter mode:
`read_only`

Locked domain:
`opportunity_pipeline`

Locked schema:
`forge.backend.read_model.v1`

Locked freshness:
`preview_static`

Locked safe error:
`OPPORTUNITY_PIPELINE_NOT_MODELED`

Locked audit event:
`read_model_used`

Locked reconciliation decision:
`KEEP_066B_AS_TEMPORARY_LOCAL_STATIC_SHIM`

## Why This Is Not A Backend Integration

066B1 confirmed that Forge already contains older opportunity, pipeline, prospecting, relationship, referral, widget, and rule-pack modules.

Those modules are reusable as future source candidates, but none currently exposes the full adapter contract required by 066A/066B:

- read route identity;
- source freshness;
- source evidence;
- preview-safe audit;
- blocked effects;
- disabled safety flags;
- safe empty state;
- safe error behavior;
- `forge.backend.read_model.v1` normalization.

Therefore, 066D does not authorize direct use of older modules as backend source truth.

## Safety Lock

The adapter remains locked with no real effects:

- no backend connection;
- no CRM write;
- no pipeline write;
- no task creation;
- no calendar creation;
- no message send;
- no auth;
- no provider execution;
- no secret access;
- no browser persistence;
- no real engine execution.

## Required Next Phase

Before replacing the shim or connecting real opportunity data, Forge must scope:

`067A_OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPE`

That phase must decide canonical source ownership, source priority, read model normalization, evidence/freshness policy, and no-effect adapter mapping.

## Final Decision

DECISION=PASS_066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK

NEXT=067A_OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPE
