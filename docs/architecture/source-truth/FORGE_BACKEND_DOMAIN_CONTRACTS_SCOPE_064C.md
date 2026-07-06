# Forge Backend Domain Contracts Scope 064C

Status: SCOPED

Date: 2026-07-06

Phase:
`064C_BACKEND_DOMAIN_CONTRACTS_SCOPE`

Base:
`064B_BACKEND_MODULE_OWNERSHIP_MAP`

## Purpose

064C defines the backend domain contract scope required before Forge connects any real module adapter.

The scope converts the 064B ownership map into domain-level contracts for the business modules that the premium static preview already presents: clients, opportunities, quotes, policies, documents, follow-up, communications, calendar intent, profile/auth, settings, command actions, and supporting platform domains.

This phase is documentation and scope only. It does not connect a backend, mutate UI, run providers, write CRM records, create calendar items, deliver messages, authenticate users, or execute a real engine.

## Global Domain Contract Rule

No domain can be connected to a real backend until it has all of the following:

- canonical entity schema;
- read model envelope;
- write model envelope, even when writes remain blocked;
- action contract references;
- approval gate requirement;
- audit event schema;
- capability requirement;
- error envelope;
- freshness/source evidence policy;
- empty-state semantics;
- adapter boundary;
- blocked effects list;
- QA path.

## Domain Contract Inventory

| Domain | Scope Status | Canonical Entities | Required Read Contract | Required Action/Write Contract | Approval/Audit Requirement | Connection Rule |
|---|---|---|---|---|---|---|
| Client / CRM | DESIGN_REQUIRED | client, household, contact channel, consent, relationship, segment | client summary, client detail, client risk context, dedupe hints | create/update client remain blocked until CRM write model exists | required for every mutation or merge | read-only adapter can come only after client source ownership and freshness are defined |
| Opportunity / Pipeline | DESIGN_REQUIRED | opportunity, stage, probability, source, next action, owner, timeline | opportunity list, priority opportunity, pipeline stage read model | stage change, next action, close/lost, reassignment remain blocked | required for any stage or next-action mutation | no pipeline adapter until stage taxonomy is canonical |
| Quote / Cotizacion | DESIGN_REQUIRED | quote request, quote workspace, product, coverage, premium, assumptions, carrier evidence | quote preview read model, quote comparison, quote status | prepare quote preview allowed only as no-effect contract; issue/submit blocked | approval required before carrier-facing action | quote adapter must separate preview from carrier truth |
| Policy / Poliza | DESIGN_REQUIRED | policy, insured, coverage, premium, renewal, beneficiary, evidence link | policy summary, policy detail, renewal list, policy timeline | policy update, beneficiary update, renewal action blocked | approval and evidence required for any official-policy mutation | read-only first; write adapter later |
| Document / Evidence | DESIGN_REQUIRED | document, evidence item, extraction, OCR confidence, provenance, source file | document list, extraction summary, confidence report, source evidence | upload/import/classify contracts scoped separately; truth creation blocked | audit required for every evidence claim | no document truth until provenance registry is defined |
| Follow-up / Task | DESIGN_REQUIRED | task, reminder, follow-up reason, due date, owner, contact method | task list, risk follow-up, due/overdue summary | snooze, complete, reschedule, assign blocked until task write contract exists | approval required when task affects external workflow | read-only task view before task write adapter |
| Calendar Intent | DESIGN_REQUIRED | calendar intent, availability window, meeting draft, attendee, location | upcoming appointment read model, meeting draft preview | create/update/delete event blocked until adapter contract exists | explicit human approval required before external calendar mutation | design with approval/audit before adapter |
| Communication | DESIGN_REQUIRED | message draft, channel, recipient, template, approval artifact, delivery state | message draft preview, communication history read model | send/deliver blocked; draft generation preview-only until approval/delivery contract | approval artifact required before any delivery | no channel adapter until delivery gate is locked |
| Profile / Auth | DESIGN_REQUIRED | user, profile, role, tenant, session, identity provider, avatar | profile read model, role/capability context, account menu context | sign out/theme/settings actions remain preview-only until auth/settings contract | audit required for identity and capability changes | do not connect profile menu to real auth yet |
| Settings / Preferences | DESIGN_REQUIRED | setting, preference, theme, notification preference, workspace preference | settings read model, theme read model | update preference blocked until persistence and auth policy exist | audit optional for low-risk settings, required for security settings | design separately from auth |
| Command / Action Router | PARTIAL_FROM_PREVIEW | command, command result, action id, target, preview payload | command catalog, action registry, preview payload | action selection routes to preview payload until backend contracts exist | audit event required for real routing | keep preview-only until domain contracts are locked |
| Approval / Audit | PARTIAL_FROM_PREVIEW | approval request, approval artifact, audit event, evidence hash, decision | approval status, audit trail, blocked reason | approve/reject/revoke scoped in 064E | mandatory for any real effect | must be complete before write adapters |
| Capability / Permission | DESIGN_REQUIRED | capability, role, policy, module permission, effect type | capability context, allowed/blocked effects | capability evaluation contract only; no grants in 064C | audit required for permission changes | must be central, not per-widget |
| Backend API Boundary | DESIGN_REQUIRED | route, request, response, error, idempotency key, correlation id | API read response envelope | write response envelope with no-effect default | audit/correlation required | no route implementation until 064F |
| Error / Empty State | DESIGN_REQUIRED | error code, severity, recoverability, empty reason, stale reason | safe error read model, empty-state read model | retry/action hints preview-only | audit required for backend/action failures | define before first adapter |
| Sync / Freshness | DESIGN_REQUIRED | source timestamp, freshness status, sync status, conflict, stale warning | freshness envelope, source evidence envelope | sync write queue blocked | audit required for conflict resolution | define before backend read adapter |

## Required Contract Shape

Each backend domain contract should eventually define:

```text
domainId
domainName
owner
sourceOfTruth
canonicalEntities
readModels
writeModels
actionContracts
approvalPolicy
auditEvents
capabilities
errors
emptyStates
freshnessPolicy
adapterBoundary
blockedEffects
qaEvidence
```

## Explicit Non-Scope

064C does not authorize:

- UI mutation;
- backend route implementation;
- database schema implementation;
- CRM mutation;
- calendar creation;
- message delivery;
- authentication changes;
- provider execution;
- browser persistence behavior;
- browser request behavior;
- real engine execution.

## Recommended Next Work

064D should define backend read model contracts. It should turn these domain contracts into concrete read model envelopes for workspace, client, opportunity, quote, policy, task, document, communication, profile, settings, capability, error, empty-state, and freshness reads.

064E should then define approval and audit contracts.

064F should define backend API and adapter boundaries.

Only after those phases should Forge attempt a read-only backend adapter dry run.

## Final Decision

064C scopes the backend domain contracts required before real module connection.

DECISION=PASS_064C_BACKEND_DOMAIN_CONTRACTS_SCOPE

NEXT=064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE
