# Forge Backend Approval And Audit Contracts Scope 064E

Status: SCOPED

Date: 2026-07-06

Phase:
`064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE`

Base:
`064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE`

## Purpose

064E defines the backend approval and audit contract layer required before Forge can connect any write-capable adapter or external-effect adapter.

064C scoped backend domains. 064D scoped backend read models. 064E scopes the approval, audit, evidence, capability, and idempotency rules that must surround any real effect.

This phase is documentation and scope only. It does not implement adapters, mutate UI, write CRM records, create calendar items, deliver messages, authenticate users, execute providers, or run a real engine.

## Global Approval Rule

Any action that can change truth, contact an external system, create an official artifact, schedule an event, deliver a message, or alter identity/settings must be blocked until it has:

- action contract id;
- target entity;
- current read model snapshot;
- proposed effect summary;
- required capability;
- approval requirement;
- approval artifact;
- audit correlation id;
- idempotency key;
- rollback or remediation note;
- blocked reason if not approved;
- immutable evidence link.

## Approval Request Contract

Every approval request must define:

```text
approvalRequestId
schemaVersion
actionId
domainId
targetType
targetId
requestedBy
requestedAt
readModelSnapshotId
proposedEffect
requiresHumanApproval
capabilityRequired
blockedReasons
previewPayload
approvalArtifact
expiresAt
status
auditCorrelationId
```

Allowed statuses:

- `draft`
- `preview_only`
- `requires_approval`
- `approved`
- `rejected`
- `expired`
- `revoked`
- `blocked`
- `executed`
- `failed`

## Approval Artifact Contract

Approval artifacts must be stable and reviewable:

```text
approvalArtifactId
approvalRequestId
humanReadableSummary
sourceEvidence
riskSummary
beforeSnapshot
afterPreview
blockedEffects
allowedEffect
reviewerId
decision
decisionAt
decisionReason
artifactHash
```

Rules:

- Any change to proposed effect invalidates prior approval.
- Any change to target entity invalidates prior approval.
- Any stale read model requires re-approval.
- Approval cannot be inferred from viewing, clicking, hovering, or opening a preview.
- Approval must be explicit.

## Audit Event Contract

Every meaningful read/action transition must emit an audit event shape:

```text
auditEventId
schemaVersion
correlationId
domainId
actionId
actorId
actorType
targetType
targetId
eventType
eventAt
sourceReadModelId
approvalRequestId
effectType
effectAllowed
effectExecuted
idempotencyKey
resultStatus
safeSummary
evidenceRefs
errorRef
```

Event types:

- `preview_created`
- `approval_requested`
- `approval_granted`
- `approval_rejected`
- `approval_revoked`
- `effect_blocked`
- `effect_attempted`
- `effect_succeeded`
- `effect_failed`
- `read_model_used`
- `stale_source_detected`
- `capability_denied`

## Idempotency Contract

Any future write/external-effect action must carry:

- idempotency key;
- target id;
- action id;
- actor id;
- requested effect hash;
- approval artifact id;
- expiration policy;
- duplicate handling policy.

No write-capable adapter can be connected without idempotency.

## Capability Contract

Approval is not permission.

Any effect requires both:

- required capability is present;
- human approval is present when the action requires it.

Capability evaluation must include:

- actor;
- role;
- tenant/workspace;
- domain;
- action id;
- target;
- effect type;
- blocked reasons.

## Domain Approval Matrix

| Domain | Effect Type | Approval Required | Audit Required | Capability Required | Connection Rule |
|---|---|---|---|---|---|
| Client / CRM | create/update/merge client | yes | yes | `client.write` | blocked until CRM write adapter and audit store exist |
| Opportunity / Pipeline | stage change, owner change, next action update | yes | yes | `opportunity.write` | blocked until stage taxonomy and approval artifact exist |
| Quote / Cotizacion | submit quote, issue official quote, send quote | yes | yes | `quote.prepare` or `quote.submit` | preview-only until carrier boundary exists |
| Policy / Poliza | policy update, renewal action, beneficiary update | yes | yes | `policy.write` | blocked until official evidence and remediation policy exist |
| Document / Evidence | create evidence truth, accept extraction | yes for truth creation | yes | `document.evidence.accept` | extraction alone is not truth |
| Follow-up / Task | complete, snooze, reassign, create task | conditional | yes | `task.write` | read-only until task write model exists |
| Calendar Intent | create/update/delete event | yes | yes | `calendar.write` | blocked until external calendar adapter is locked |
| Communication | deliver message or send notification | yes | yes | `message.send` | draft is allowed; delivery is blocked |
| Profile / Auth | identity/session/role change | yes for security changes | yes | `identity.write` | profile preview cannot mutate auth |
| Settings / Preferences | update preference | conditional | yes for persisted settings | `settings.write` | low-risk preferences still need persistence policy |
| Command / Action Router | route to real effect | yes if effectful | yes | per-domain capability | preview route remains default |
| Approval / Audit | approve/reject/revoke | yes by definition | yes | `approval.decide` | approval decisions are audited |
| Capability / Permission | grant/revoke capability | yes | yes | `capability.admin` | blocked until identity/auth contract |
| Backend API Boundary | execute write route | yes if effectful | yes | route capability | route cannot bypass approval/audit |
| Error / Empty State | retry effect | depends on effect | yes | original action capability | retries require idempotency |
| Sync / Freshness | resolve conflict | yes | yes | `sync.resolve` | stale/conflict actions blocked |

## Audit Storage Requirement

Real effects require a durable audit store. Until that exists:

- effects remain preview-only;
- approval artifacts remain documentation contracts;
- audit events can be shaped but not treated as durable truth;
- no external-effect adapter can be locked.

## Explicit Non-Scope

064E does not authorize:

- adapter implementation;
- audit database implementation;
- approval UI mutation;
- backend route implementation;
- CRM mutation;
- calendar creation;
- message delivery;
- authentication changes;
- provider execution;
- browser persistence behavior;
- browser request behavior;
- real engine execution.

## Recommended Next Work

064F should define backend API and adapter boundaries, including how routes prove capability, approval, idempotency, and audit.

064G should define a read-only backend adapter dry run only after write/external effects remain explicitly blocked.

## Final Decision

064E scopes backend approval and audit contracts for all domains.

DECISION=PASS_064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE

NEXT=064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE
