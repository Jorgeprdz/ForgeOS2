# Forge Backend API And Adapter Boundary Scope 064F

Status: SCOPED

Date: 2026-07-06

Phase:
`064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE`

Base:
`064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE`

## Purpose

064F scopes the backend API and adapter boundary required before Forge can connect real modules.

064B mapped module ownership. 064C scoped domain contracts. 064D scoped read model contracts. 064E scoped approval and audit contracts. 064F defines the route, adapter, provider, secret, auth, retry, and dry-run boundaries that must exist before any backend connection.

This phase is documentation and scope only. It does not implement backend routes, connect adapters, execute providers, read secrets, authenticate users, mutate UI, write CRM records, create calendar items, deliver messages, or run a real engine.

## Global API Boundary Rule

No UI surface may call a real backend route until the target module has:

- domain contract;
- read model contract;
- approval and audit contract;
- capability rule;
- route contract;
- adapter boundary;
- error envelope;
- freshness policy;
- idempotency rule;
- blocked-effect policy;
- QA evidence.

## Backend API Envelope

Every future backend route must use a canonical envelope:

```text
requestId
schemaVersion
routeId
routeClass
domainId
actionId
actor
tenant
capabilities
readModelSnapshotId
approvalRequestId
idempotencyKey
dryRun
previewOnly
payload
sourceEvidence
clientContext
```

Every response must use:

```text
requestId
schemaVersion
routeId
status
result
readModelDelta
auditEventId
approvalRequestId
blockedReasons
errors
freshness
sourceEvidence
realEffectsAllowed
```

## Route Classes

Future routes must be grouped into explicit classes:

- `read_only`: may read modeled backend truth and return read envelopes.
- `preview_prepare`: may prepare preview payloads with no real effect.
- `approval_request`: may create an approval request artifact only after 064E rules are implemented.
- `approved_execute`: reserved for future approved execution after all gates pass.
- `audit_read`: may read immutable audit/event history.
- `health_check`: may report service readiness without sensitive data.

## Adapter Modes

Every adapter must declare one mode:

- `disabled`: no calls allowed.
- `read_only`: non-mutating reads only.
- `preview_only`: prepares payloads, no write or provider effect.
- `approval_required`: can propose an effect but cannot execute it.
- `execute_approved`: reserved for future explicit approved execution.

Default mode is always `disabled`.

## Adapter Boundary Contract

Every future adapter must define:

```text
adapterId
adapterType
domainId
owner
mode
capabilityRequired
sourceOfTruth
authBoundary
secretBoundary
rateLimitPolicy
retryPolicy
idempotencyPolicy
freshnessPolicy
errorMap
auditEvents
blockedEffects
qaEvidence
```

## Provider Boundary

Provider calls remain blocked until a provider registry exists. A provider adapter must never be called directly by UI code.

Provider boundary requirements:

- provider id;
- tenant/account binding;
- allowed route classes;
- allowed adapter modes;
- secret reference only, never raw secret in logs or docs;
- rate limit;
- retry class;
- idempotency behavior;
- audit event mapping;
- failure taxonomy;
- rollback or remediation note.

## Secret Boundary

064F does not create secrets and does not read secrets.

Future secret handling must require:

- named secret reference;
- no secret value in repo;
- no secret value in audit body;
- no secret value in screenshots;
- least-privilege provider capability;
- rotation policy;
- missing-secret error envelope.

## Auth Boundary

064F does not implement auth.

Future backend auth must separate:

- actor identity;
- tenant identity;
- role;
- capability;
- approval authority;
- provider account access;
- session freshness;
- impersonation prohibition.

## Retry And Idempotency

All non-read requests must carry an idempotency key before any future execution path can exist.

Retry policy classes:

- `no_retry`;
- `safe_read_retry`;
- `preview_retry`;
- `approval_artifact_retry`;
- `manual_recovery_required`.

Execution retries remain blocked until approved execution is separately designed.

## No-Effect Dry Run Rule

The first backend adapter dry run after this scope must be read-only or preview-only.

It must prove:

- no CRM write;
- no calendar creation;
- no message delivery;
- no auth mutation;
- no provider effect;
- no browser storage dependency;
- no real engine execution;
- audit and read model envelopes are produced.

## Domain Route Matrix

| Domain | First Allowed Route Class | First Adapter Mode | Blocked Effects |
|---|---|---|---|
| `client_crm` | `read_only` | `read_only` | client create/update/delete |
| `opportunity_pipeline` | `read_only` | `read_only` | stage mutation, opportunity create/update |
| `quote` | `preview_prepare` | `preview_only` | official quote issue, carrier call |
| `policy` | `read_only` | `read_only` | policy update, endorsement, renewal action |
| `document_evidence` | `read_only` | `read_only` | upload/storage truth, OCR persistence |
| `followup_task` | `preview_prepare` | `preview_only` | task create/update |
| `calendar_intent` | `preview_prepare` | `preview_only` | calendar event create/update |
| `communication` | `preview_prepare` | `preview_only` | delivery/send |
| `profile_auth` | `read_only` | `disabled` | auth/session/profile mutation |
| `settings_preferences` | `read_only` | `disabled` | preference persistence |
| `command_action_router` | `preview_prepare` | `preview_only` | command execution |
| `approval_audit` | `audit_read` | `read_only` | audit mutation outside contract |
| `capability_permission` | `read_only` | `read_only` | policy override |
| `backend_api_boundary` | `health_check` | `disabled` | route execution |
| `error_empty_state` | `read_only` | `read_only` | none |
| `sync_freshness` | `read_only` | `read_only` | sync write queue |

## First Safe Dry Run Candidate

The recommended next dry run is:

`064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN`

Allowed candidate:

- route class: `read_only`;
- adapter mode: `read_only`;
- domain: one of `client_crm`, `policy`, `capability_permission`, or `sync_freshness`;
- source: local/static/non-sensitive adapter only unless a real backend source is separately approved and scoped;
- output: backend read envelope plus audit-shaped event;
- effects: all real effects disabled.

## Explicit Non-Scope

064F does not:

- implement a backend server;
- define final REST/GraphQL endpoints;
- connect CRM;
- create calendar events;
- deliver communications;
- authenticate users;
- read provider secrets;
- call external providers;
- mutate browser storage;
- execute actions;
- replace approval/audit scope;
- replace read model scope.

## Decision

DECISION=PASS_064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE

NEXT=064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN
