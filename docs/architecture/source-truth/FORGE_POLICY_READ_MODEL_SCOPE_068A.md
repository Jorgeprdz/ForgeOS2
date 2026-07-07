# Forge Policy Read Model Scope 068A

Status: SCOPED

Phase:
`068A_POLICY_READ_MODEL_SCOPE`

Decision:
`PASS_068A_POLICY_READ_MODEL_SCOPE`

Locked decision:
`POLICY_READ_MODEL_SCOPED`

Next:
`068B_POLICY_READ_MODEL_IMPLEMENTATION`

## Robocop Gate

- Applicable Constitution: Forge OS Article 0, Decision Clarity First, advisor-first, no invented financial values, no invented products, no projections without explicit data, unknown remains unknown.
- Applicable ADRs: ADR-006 Policy Truth Boundary; 067F candidate-only read model decision continuity.
- Build Tree area: Policy Operations / Policy Read Model / Scope.
- Discovery status: 067F is closed; existing policy modules, schema, evidence, detail, timeline, renewal, and task surfaces were inventoried read-only.
- Implementation readiness: Scope only. Implementation deferred to 068B.
- Miranda approval: PASS for defining policy read boundaries before any adapter or real source connection.
- Board approval status: Scope-only contract accepted for planning; no runtime or backend authorization.
- Scope boundary: Define read-only/preview-safe Policy Read Model contract, fields, prohibited actions, future source candidates, and required pre-implementation contracts.
- Prohibited surfaces: UI mutation, backend real, CRM write, pipeline write, policy write, quote write, task creation, calendar creation, message send, auth, provider execution, secret access, browser persistence, real engine execution, canonical policy truth claim.
- Validation expectation: JSON audit, required markers, diff checks, scoped safety scan, staged boundary.

## What Policy Read Model Is

Policy Read Model is a read-only, preview-safe representation of policy records for Forge decision surfaces.

It is not:

- a policy issuance system;
- a canonical policy source;
- a policy mutation layer;
- a provider or carrier runtime;
- a payment, claim, renewal, or cancellation execution surface.

It must not invent premium, effective dates, expiration dates, policy status, carrier, coverage, payment state, renewal state, or recommendations as facts.

The first implementation must remain local/static/read-only until source ownership, evidence, permissions, freshness, and adapter contracts are locked.

## Existing Policy Surfaces Found

Read-only discovery found candidate surfaces that may inform future mapping:

- `adr/ADR-006 — Policy Truth Boundary.txt`
- `schemas/policy.schema.json`
- `fixtures/policy-demo.json`
- `policy-operations/evidence/policy-evidence-packet.js`
- `policy-operations/evidence/*`
- `policy-operations/policy-detail/*`
- `policy-operations/policy-timeline/*`
- `policy-operations/renewals/*`
- `policy-operations/tasks/policy-*`
- `policy-operations/client-records/policy-client-summary-engine.js`
- `policy-field-confidence-map.js`
- `gmm-policy-caratula-summary-engine.js`
- `quote-to-policy-comparison-engine.js`
- `shared-policy-currency-timeline-engine.js`
- `tests/policy-evidence-packet-test.js`
- `tests/policy-advisor-confirmation-gate-test.js`

068A does not connect or modify any of those surfaces.

## Minimum Allowed Read Model Fields

- `policy_id`
- `client_ref`
- `display_name`
- `policy_type`
- `carrier_ref`
- `policy_status`
- `coverage_summary`
- `effective_date`
- `expiration_date`
- `renewal_state`
- `premium_preview`
- `payment_state`
- `document_refs`
- `opportunity_refs`
- `quote_refs`
- `advisor_notes_refs`
- `risk_flags`
- `next_action`
- `source_evidence_ids`
- `freshness_metadata`
- `audit_event`
- `blocked_effects`
- `safety_flags`

Every non-empty factual field must be evidence-backed and freshness-aware.

## Not Authorized Yet

- policy create, update, delete, cancel, renew;
- premium real value without evidence;
- coverage fact without source evidence;
- carrier or provider truth without source ownership;
- payment truth without evidence;
- claim handling;
- document upload as truth;
- CRM write;
- pipeline write;
- quote write;
- task, calendar, or message action;
- provider call;
- auth or secret access;
- browser persistence;
- real engine execution;
- recommendations invented as facts.

## Future Candidate Sources

The following are candidates only and are not connected by 068A:

- existing CRM or read-only client context;
- document extraction and manual evidence;
- future provider policy adapter;
- future quote read model;
- Opportunity Pipeline references;
- advisor notes and communication references;
- imported policy evidence.

## Required Contracts Before Implementation

068B or later must not claim production readiness until these contracts exist:

- canonical policy source ownership;
- source priority;
- input schema;
- output read model schema;
- freshness model;
- evidence model;
- error model;
- permission and capability model;
- no-effect adapter policy;
- audit event mapping;
- empty state rules;
- redaction and privacy rules for sensitive policy fields.

## Safe Behavior

Safe empty state:
absence of modeled policies must return an explicit empty state, not invented rows.

Safe error:
`POLICY_READ_MODEL_NOT_MODELED`

Recommended audit event:
`read_model_used`

Schema version:
`forge.backend.read_model.v1`

Adapter/read-model mode:
`read_only`

Initial freshness status:
`preview_static` or `unknown_source_pending_mapping`

All safety flags must be false:

- `crmWrite`
- `pipelineWrite`
- `policyWrite`
- `quoteWrite`
- `taskCreate`
- `calendarCreate`
- `messageSend`
- `authReal`
- `providerRuntime`
- `secretAccess`
- `browserPersistence`
- `realEngineExecution`
- `realEffectsAllowed`
- `realEffectsEnabled`
- `backendConnection`

## Final

DECISION=PASS_068A_POLICY_READ_MODEL_SCOPE

LOCKED_DECISION=POLICY_READ_MODEL_SCOPED

NEXT=068B_POLICY_READ_MODEL_IMPLEMENTATION
