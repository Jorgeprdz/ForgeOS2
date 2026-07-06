# Forge Client CRM Read-Only Adapter Scope 065A

Status: SCOPED

Date: 2026-07-06

Phase:
`065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE`

Base:
`064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK`

## Purpose

065A scopes the first Client CRM read-only adapter boundary after the read-only backend adapter dry run was locked.

This is a design/scope phase only. It does not connect a backend, read a real CRM, write a CRM record, authenticate a user, access secrets, call providers, mutate UI, persist browser data, or run a real engine.

## Adapter Identity

Adapter id:
`forge.client_crm.read_only.adapter.v1`

Adapter mode:
`read_only`

Route class:
`read_only`

Domain:
`client_crm`

First route candidate:
`forge.api.read.client_crm.list.v1`

Second route candidate:
`forge.api.read.client_crm.detail.v1`

## Allowed Reads

The adapter may eventually read:

- client id;
- display name;
- segment;
- relationship owner;
- contact readiness state;
- last interaction date;
- follow-up risk flag;
- policy summary references;
- opportunity summary references;
- source evidence ids;
- freshness metadata.

## Forbidden Fields

The first read-only adapter must not expose:

- raw secrets;
- full medical detail;
- payment instrument data;
- private document bodies;
- unredacted identity documents;
- provider tokens;
- internal credentials;
- unsupported inferred facts.

## Forbidden Effects

The adapter must not:

- create clients;
- update clients;
- delete clients;
- merge clients;
- create tasks;
- create calendar events;
- send messages;
- create quotes;
- update policies;
- call external providers;
- persist browser state;
- execute actions.

## Canonical Read Envelope

Every read must return the backend read model envelope from 064D:

```text
readModelId
schemaVersion
domainId
sourceOfTruth
sourceEvidence
generatedAt
freshness
capabilities
approvalContext
entities
relationships
metrics
emptyState
errors
blockedEffects
audit
uiProjection
```

## Client Entity Shape

The first client entity shape is:

```text
entityType
entityId
displayName
status
segment
ownerId
ownerName
contactReadiness
lastInteractionAt
followupRisk
policyRefs
opportunityRefs
sourceEvidence
freshness
```

## Empty States

The adapter must distinguish:

- `no_records`;
- `not_connected`;
- `permission_blocked`;
- `source_unavailable`;
- `filter_no_match`;
- `pending_sync`;
- `preview_placeholder`.

## Error Model

The adapter must map errors into safe backend envelopes:

- `CLIENT_CRM_SOURCE_UNAVAILABLE`;
- `CLIENT_CRM_PERMISSION_BLOCKED`;
- `CLIENT_CRM_SCHEMA_MISMATCH`;
- `CLIENT_CRM_STALE_SOURCE`;
- `CLIENT_CRM_NOT_MODELED`;
- `CLIENT_CRM_UNSAFE_FIELD_BLOCKED`.

## Capability Requirements

Required capabilities:

- `client.read.preview`;
- `client.read.summary`;
- `client.read.detail`;

Explicitly not granted:

- `client.write`;
- `client.merge`;
- `client.delete`;
- `provider.call`;
- `message.send`;
- `calendar.create`.

## Audit Events

The adapter must emit audit-shaped events:

- `read_model_used`;
- `stale_source_detected`;
- `capability_denied`;
- `unsafe_field_blocked`;
- `source_unavailable`;

No write audit event may be emitted by this adapter.

## Freshness Policy

Allowed freshness statuses:

- `fresh`;
- `possibly_stale`;
- `stale`;
- `source_unavailable`;
- `not_connected`;
- `preview_static`.

Any non-fresh data must be visible in the envelope and must not silently drive a recommended action.

## First Implementation Constraint

The first implementation after this scope must use one of:

- local static fixture;
- committed non-sensitive sample fixture;
- generated fixture with no personal data;
- read-only adapter mock.

It must not connect to a production CRM or provider.

## Decision

DECISION=PASS_065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE

NEXT=065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION
