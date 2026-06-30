# 039A Audit / Persistence Boundary Scope

## Phase

- Phase: `039A_AUDIT_PERSISTENCE_SCOPE`
- Status: SCOPE CLOSED after validation.
- Next: `039B_AUDIT_PERSISTENCE_IMPLEMENTATION`.

## Closure Visibility Rule

Modulo cerrado sin Unified Build Tree actualizado = NO CERRADO.

## Why this exists

Forge now has:

```text
NBA Reason Why
-> Prompt Builder
-> LLM Draft Intake
-> Message Safety Validator
-> Human Approval Gate
-> Delivery Adapter Boundary
-> Send Execution Gate
-> Provider Runtime Boundary
-> Provider Connector Boundary
-> Connector Execution Gate
-> Connector Executor Boundary
-> External Dispatch Boundary
-> Provider Webhook Boundary
-> UI / Read Model Boundary
```

UI read model candidate is not UI rendering truth.

Read-only presentation model candidate is not audit persistence.

Audit event candidate is not persistence.

Audit persistence candidate is not business truth.

Audit / Persistence Boundary is the next constitutional boundary.

It defines how Forge may prepare auditable persistence candidates for already-reviewed non-truth records without writing to disk/database, mutating CRM, creating truth, creating tasks/calendar, rendering UI, or executing actions.

039A scopes the boundary only.

039A does not implement persistence.

039A does not write files.

039A does not write databases.

039A does not create audit records.

039A does not create business truth.

039A does not mutate CRM.

039A does not execute actions.

## Current upstream closed layers

- `037B_PROVIDER_WEBHOOK_BOUNDARY_IMPLEMENTATION`
- `038B_UI_READ_MODEL_IMPLEMENTATION`

## Audit / Persistence Boundary definition

The Audit / Persistence Boundary separates:

- read-only presentation model candidate
- audit event candidate
- persistence record candidate
- immutable evidence refs
- source evidence IDs
- source owners
- source freshness
- actor metadata
- action boundary metadata
- non-execution flags
- warnings and limitations
- retention policy snapshot
- idempotency key
- audit trail

from:

- actual persistence write
- file/database write
- CRM mutation
- business truth creation
- delivery/message truth creation
- compensation/revenue/payout truth
- ranking/punishment/HR/personality truth
- task/calendar creation
- UI rendering
- send/action execution
- provider/external API calls

This boundary may later validate audit persistence readiness and prepare a persistence write candidate, but it must not write or create truth.

## Future input shape

The future 039B contract may consume:

- auditPersistenceRequestId
- uiReadModelRequestId
- providerWebhookBoundaryRequestId
- externalDispatchRequestId
- sendRequestId
- advisorId
- managerId
- personId
- personType
- actorId
- actorRole
- uiReadModelSnapshot
- uiPresentationModelCandidate
- auditEventCandidate
- persistenceRecordCandidate
- retentionPolicySnapshot
- persistencePolicySnapshot
- immutabilityPolicySnapshot
- privacyPolicySnapshot
- idempotencyKey
- sourceEvidence
- sourceFreshness
- sourceOwners
- warnings
- limitations
- auditTrail
- requestedUse
- createdAt
- expiresAt
- now

## Future output shape

The future 039B contract should output:

- auditPersistenceStatus
- decision
- auditPersistenceRequestId
- uiReadModelRequestId
- providerWebhookBoundaryRequestId
- externalDispatchRequestId
- advisorId
- managerId
- personId
- personType
- actorId
- actorRole
- auditPersistenceRecordCandidate
- persistenceWriteCandidate
- approvedForPersistenceCandidatePreparation
- approvedForPersistenceWrite
- persistsRecord
- writesFile
- writesDatabase
- mutatesCrm
- createsBusinessTruth
- createsDeliveryTruth
- createsMessageTruth
- createsTask
- createsCalendarEvent
- createsCompensationTruth
- createsPayoutTruth
- createsRevenueTruth
- createsRankingTruth
- createsPunishmentTruth
- createsHrTruth
- createsPromotionTruth
- createsAdvisorLifecycleTruth
- createsPersonalityTruth
- rendersUi
- executesAction
- sendsMessage
- providerApiCallAllowed
- externalApiCallAllowed
- blockedUses
- allowedUses
- missingSignals
- unknownSignals
- warnings
- limitations
- evidenceRefs
- sourceEvidenceIds
- sourceOwners

## Proposed statuses

- READY_FOR_AUDIT_PERSISTENCE_REVIEW
- APPROVED_FOR_PERSISTENCE_CANDIDATE_PREPARATION
- NEEDS_UI_READ_MODEL
- NEEDS_PRESENTATION_MODEL_CANDIDATE
- NEEDS_AUDIT_EVENT_CANDIDATE
- NEEDS_PERSISTENCE_RECORD_CANDIDATE
- NEEDS_RETENTION_POLICY
- NEEDS_PERSISTENCE_POLICY
- NEEDS_IMMUTABILITY_POLICY
- NEEDS_PRIVACY_POLICY
- NEEDS_IDEMPOTENCY_KEY
- NEEDS_SOURCE_EVIDENCE
- NEEDS_SOURCE_OWNER
- NEEDS_SOURCE_FRESHNESS
- STALE_SOURCE_FRESHNESS
- NEEDS_AUDIT_TRAIL
- UNSUPPORTED_ACTOR_ROLE
- UNSUPPORTED_RECORD_TYPE
- EXPIRED_PERSISTENCE_WINDOW
- BLOCKED
- UNKNOWN
- NOT_MODELED

## Proposed decisions

- REQUEST_AUDIT_PERSISTENCE_REVIEW
- APPROVE_PERSISTENCE_CANDIDATE_PREPARATION
- BLOCK_AUDIT_PERSISTENCE
- NEEDS_MORE_CONTEXT
- EXPIRED
- NOT_MODELED

## Allowed uses

- AUDIT_PERSISTENCE_REVIEW
- PERSISTENCE_CANDIDATE_PREP
- AUDIT_RECORD_PREP
- READ_MODEL_AUDIT_PREP
- COMPLIANCE_REVIEW_PREP
- EVIDENCE_CHAIN_PREP

## Forbidden uses

- PERSISTENCE_WRITE
- FILE_WRITE
- DATABASE_WRITE
- CRM_MUTATION
- BUSINESS_TRUTH_CREATION
- DELIVERY_TRUTH_CREATION
- MESSAGE_TRUTH_CREATION
- TASK_CREATION
- CALENDAR_CREATION
- UI_RENDERING
- DASHBOARD_CREATION
- SEND_MESSAGE
- ACTION_EXECUTION
- PROVIDER_API_CALL
- EXTERNAL_API_CALL
- COMPENSATION_TRUTH
- PAYOUT_TRUTH
- REVENUE_TRUTH
- HUMAN_RANKING
- HR_DECISION
- PROMOTION_DECISION
- TERMINATION
- MANIPULATION
- SURVEILLANCE
- PERSONALITY_TRUTH

## Required rules for 039B implementation

Tests must prove:

1. Missing UI Read Model snapshot blocks persistence candidate preparation.
2. Missing presentation model candidate blocks.
3. Missing audit event candidate blocks.
4. Missing persistence record candidate blocks.
5. Missing retention policy blocks.
6. Missing persistence policy blocks.
7. Missing immutability policy blocks.
8. Missing privacy policy blocks.
9. Missing idempotency key blocks.
10. Missing source evidence blocks.
11. Missing source owner blocks.
12. Missing source freshness blocks.
13. Stale source freshness blocks or requires review.
14. Missing audit trail blocks.
15. Unsupported actor role blocks.
16. Unsupported record type blocks.
17. Expired persistence window blocks.
18. Audit persistence candidate can be prepared.
19. Actual persistence write remains false.
20. File/database writes remain false.
21. CRM mutation remains false.
22. Business truth creation remains false.
23. Delivery/message truth creation remains false.
24. Task/calendar creation remains false.
25. UI rendering remains false.
26. Provider/external API calls remain false.
27. Send/action execution remains false.
28. Compensation/revenue/payout truth remains false.
29. Ranking/punishment/HR/personality truth remains false.
30. Forbidden uses are blocked.
31. Allowed uses are allowed.
32. Inputs are not mutated.
33. Evidence/source/sourceOwners dedupe.
34. Warnings and limitations remain visible.
35. Retention, immutability, and privacy remain policy snapshots only.

## Relationship to UI / Read Model Boundary

UI / Read Model Boundary prepares a read-only presentation model candidate.

Audit / Persistence Boundary consumes that candidate.

A persistence candidate is not a persistence write.

A persistence candidate is not business truth.

## Relationship to Truth Promotion Boundary

Truth Promotion Boundary remains separate.

039B may prepare audit/persistence candidates.

039B must not promote any fact into business truth.

## Example scenarios

- UI / Read Model prepares a visible status card candidate. Audit / Persistence may prepare a candidate to record the reviewed state, but must not write it.
- Retention policy is missing. Audit / Persistence blocks.
- Persistence policy allows write. Audit / Persistence blocks because this boundary prepares candidates only.
- Provider event says delivered. Audit / Persistence may preserve evidence refs, but cannot create delivery truth.

## Open next phases

- `039B_AUDIT_PERSISTENCE_IMPLEMENTATION`
- Truth Promotion Boundary Scope
- UI Rendering Boundary Scope

## Forge Council Review

- Miranda: Persistence is scoped before any write exists.
- Arqui Juve: Architecture stays maintainable because candidate preparation, writes, and truth promotion remain separate.
- Joy Mangano: Practical utility increases because evidence chains become reviewable.
- Nash: Conversation feedback can be recorded only as candidate context, not automatic truth.
- Mick: Behavior coaching avoids false conclusions from unpromoted persisted records.
- Patch Adams: Trust is preserved because warnings and limitations remain visible.
- Chris Gardner: Execution improves because audit readiness becomes traceable.
- Rocky: Consistency improves because idempotency, evidence, freshness, retention, privacy, and audit are mandatory.
- Nicky Spurgeon: Outreach remains ethical because automatic follow-up and CRM mutation are blocked.
- Jordan Belfort: Conversion remains bounded by anti-manipulation and no-auto-send rules.
- Jurgen Klaric: Psychology supports voluntary action through clarity, not coercive automation.

## Final decision

SEMAFORO=PASS
DECISION=PASS_039A_AUDIT_PERSISTENCE_SCOPE_READY_FOR_IMPLEMENTATION
NEXT=039B_AUDIT_PERSISTENCE_IMPLEMENTATION
