# 035A Connector Executor Boundary Scope

## Phase

- Phase: `035A_CONNECTOR_EXECUTOR_BOUNDARY_SCOPE`
- Status: SCOPE CLOSED after validation.
- Next: `035B_CONNECTOR_EXECUTOR_BOUNDARY_IMPLEMENTATION`.

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
```

Connector invocation candidate is not connector execution.

Connector execution handoff is not connector executor execution.

Connector Executor Boundary is the next constitutional boundary.

It defines how Forge may model executor readiness and prepare an executor command candidate without actually invoking a connector, calling an external API, dispatching a provider message, or sending.

035A scopes the boundary only.

035A does not implement an executor.

035A does not call WhatsApp, SMS, email, calendar, tasks, CRM, queue, webhook, or any external API.

## Current upstream closed layers

- `033B_PROVIDER_CONNECTOR_BOUNDARY_IMPLEMENTATION`
- `034B_CONNECTOR_EXECUTION_GATE_IMPLEMENTATION`

## Connector Executor Boundary definition

The Connector Executor Boundary separates:

- connector execution handoff
- final connector execution confirmation
- connector invocation candidate
- idempotency key
- audit trail
- connector executor name
- execution mode
- credential review
- rate-limit review
- retry policy

from:

- real connector invocation
- external API call
- provider dispatch
- WhatsApp/SMS/email send
- credential material exposure
- queue execution
- scheduled execution
- webhook side effects
- task/calendar creation

This boundary may later prepare an executor command candidate, but it must not execute it.

## Future input shape

The future 035B contract may consume:

- connectorExecutorRequestId
- connectorExecutionGateRequestId
- providerConnectorRequestId
- providerRuntimeRequestId
- sendRequestId
- deliveryRequestId
- approvalRequestId
- advisorId
- managerId
- senderId
- senderRole
- personId
- personType
- connectorExecutionGateSnapshot
- connectorInvocationCandidate
- executorCommandCandidate
- providerPayloadCandidate
- providerName
- providerConnectorName
- connectorExecutorName
- connectorExecutorMode
- channel
- recipientDestination
- finalSendText
- idempotencyKey
- dryRun
- environment
- finalExecutorConfirmation
- credentialReviewSnapshot
- connectorCapabilitySnapshot
- connectorPolicySnapshot
- executorCapabilitySnapshot
- executorPolicySnapshot
- rateLimitSnapshot
- retryPolicySnapshot
- auditTrail
- sourceEvidence
- warnings
- limitations
- requestedUse
- createdAt
- confirmedAt
- expiresAt
- now

## Future output shape

The future 035B contract should output:

- connectorExecutorBoundaryStatus
- decision
- connectorExecutorRequestId
- connectorExecutionGateRequestId
- providerConnectorRequestId
- sendRequestId
- providerName
- providerConnectorName
- connectorExecutorName
- connectorExecutorMode
- channel
- idempotencyKey
- dryRun
- executorCommandCandidate
- connectorInvocationCandidate
- approvedForExecutorCommandPreparation
- approvedForExecutorInvocation
- executorInvocationAllowed
- connectorInvocationAllowed
- externalApiCallAllowed
- providerDispatchAllowed
- sendsMessage
- credentialMaterialExposed
- retryAllowed
- queueExecutionAllowed
- scheduledExecutionAllowed
- webhookSideEffectAllowed
- automaticSendAllowed
- silentSendAllowed
- humanSendConfirmationRequired
- connectorExecutionGateRequired
- connectorExecutorAuditRequired
- dispatchExecutorRequired
- blockedUses
- allowedUses
- missingSignals
- unknownSignals
- warnings
- limitations
- createsTask: false
- createsCalendarEvent: false
- createsCompensationTruth: false
- createsPayoutTruth: false
- createsRevenueTruth: false
- createsRankingTruth: false
- createsPunishmentTruth: false
- createsHrTruth: false
- createsPromotionTruth: false
- createsAdvisorLifecycleTruth: false
- createsPersonalityTruth: false

## Proposed statuses

- READY_FOR_EXECUTOR_REVIEW
- APPROVED_FOR_EXECUTOR_COMMAND_PREPARATION
- APPROVED_FOR_EXECUTOR_DRY_RUN_ONLY
- NEEDS_CONNECTOR_EXECUTION_GATE
- NEEDS_CONNECTOR_INVOCATION_CANDIDATE
- NEEDS_EXECUTOR_CONFIRMATION
- NEEDS_CONNECTOR_EXECUTOR
- NEEDS_EXECUTOR_CAPABILITY
- NEEDS_EXECUTOR_POLICY
- NEEDS_IDEMPOTENCY_KEY
- NEEDS_AUDIT_TRAIL
- NEEDS_CREDENTIAL_REVIEW
- NEEDS_RATE_LIMIT_REVIEW
- NEEDS_RETRY_POLICY
- UNSUPPORTED_CONNECTOR_EXECUTOR
- UNSUPPORTED_CONNECTOR
- UNSUPPORTED_PROVIDER
- UNSUPPORTED_CHANNEL
- EXPIRED_EXECUTOR_WINDOW
- BLOCKED
- UNKNOWN
- NOT_MODELED

## Proposed decisions

- REQUEST_EXECUTOR_REVIEW
- APPROVE_EXECUTOR_COMMAND_PREPARATION
- APPROVE_EXECUTOR_DRY_RUN_ONLY
- BLOCK_EXECUTOR
- NEEDS_MORE_CONTEXT
- EXPIRED
- NOT_MODELED

## Allowed uses

- EXECUTOR_REVIEW
- EXECUTOR_COMMAND_PREP
- EXECUTOR_DRY_RUN_PREP
- WHATSAPP_EXECUTOR_REVIEW
- SMS_EXECUTOR_REVIEW
- EMAIL_EXECUTOR_REVIEW

## Forbidden uses

- AUTOMATIC_SEND
- SILENT_SEND
- AI_SELF_SEND
- EXTERNAL_API_CALL
- CONNECTOR_INVOCATION
- CONNECTOR_EXECUTION
- EXECUTOR_INVOCATION
- PROVIDER_DISPATCH
- SEND_MESSAGE
- EXECUTOR_WITHOUT_EXECUTION_GATE
- EXECUTOR_WITHOUT_HUMAN_CONFIRMATION
- EXECUTOR_WITHOUT_IDEMPOTENCY
- EXECUTOR_WITHOUT_AUDIT
- EXECUTOR_WITHOUT_CREDENTIAL_REVIEW
- CREDENTIAL_MATERIAL_EXPOSURE
- WHATSAPP_API_SEND
- SMS_API_SEND
- EMAIL_API_SEND
- SCHEDULED_SEND
- QUEUE_EXECUTION
- RETRY_WITHOUT_POLICY
- WEBHOOK_SIDE_EFFECT
- AUTOMATIC_TASK_CREATION
- AUTOMATIC_CALENDAR_CREATION
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

## Required rules for 035B implementation

Tests must prove:

1. Missing Connector Execution Gate snapshot blocks executor command preparation.
2. Missing connector invocation candidate blocks executor command preparation.
3. Missing final executor confirmation blocks executor command preparation.
4. Missing connector executor blocks executor command preparation.
5. Missing executor capability blocks executor command preparation.
6. Missing executor policy blocks executor command preparation.
7. Missing idempotency key blocks executor command preparation.
8. Missing audit trail blocks executor command preparation.
9. Missing credential review blocks executor command preparation.
10. Missing rate-limit review blocks executor command preparation.
11. Retry without policy blocks executor command preparation.
12. Unsupported connector executor blocks executor command preparation.
13. Unsupported connector blocks executor command preparation.
14. Unsupported provider blocks executor command preparation.
15. Unsupported channel blocks executor command preparation.
16. Expired executor window blocks executor command preparation.
17. External API call remains false.
18. Connector invocation remains false.
19. Connector execution remains false.
20. Executor invocation remains false.
21. Provider dispatch remains false.
22. Sends message remains false.
23. Credential material exposure remains false.
24. Queue execution remains false.
25. Scheduled execution remains false.
26. Webhook side effects remain false.
27. Dry-run can be modeled without invocation.
28. Executor command candidate can be prepared without external call.
29. Automatic send is blocked.
30. Silent send is blocked.
31. AI self-send is blocked.
32. Boundary does not create tasks/calendar.
33. Boundary does not create compensation/revenue/payout truth.
34. Boundary does not create ranking/punishment/HR/personality truth.
35. Inputs are not mutated.
36. Forbidden uses are blocked.
37. Allowed uses are allowed.
38. Audit is required.

## Relationship to Connector Execution Gate

Connector Execution Gate approves connector execution handoff.

Connector Executor Boundary consumes that handoff.

A connector execution handoff is not executor invocation.

## Relationship to actual external dispatch

Actual external dispatch must remain separate.

035B may prepare an executor command candidate when all gates pass.

035B must not directly call external APIs unless a later explicitly approved external dispatch executor is created and gated.

## Example scenarios

- Connector Execution Gate approves a WhatsApp execution handoff. Connector Executor Boundary may prepare a WhatsApp executor command candidate, but must not call WhatsApp.
- Executor capability is missing. Connector Executor Boundary blocks.
- Final executor confirmation is missing. Connector Executor Boundary blocks.
- Dry-run mode may approve command preparation without invocation.

## Open next phases

- `035B_CONNECTOR_EXECUTOR_BOUNDARY_IMPLEMENTATION`
- External Dispatch Boundary Scope
- Provider Webhook Boundary Scope
- UI / Read Model
- Audit / Persistence

## Forge Council Review

- Miranda: Executor scope is defined before any execution exists.
- Arqui Juve: Architecture stays maintainable because executor and external dispatch remain separate.
- Joy Mangano: Practical utility increases while preserving human control.
- Nash: Conversation delivery remains protected before real dispatch.
- Mick: Execution remains accountable, not automatic pressure.
- Patch Adams: Trust is preserved because executor invocation is not silent.
- Chris Gardner: Execution improves because command readiness becomes auditable.
- Rocky: Consistency improves because confirmation, idempotency, and audit are mandatory.
- Nicky Spurgeon: Outreach remains ethical because external dispatch is blocked.
- Jordan Belfort: Conversion remains bounded by anti-manipulation and no-auto-send rules.
- Jurgen Klaric: Psychology supports voluntary action, not coercive automation.

## Final decision

SEMAFORO=PASS
DECISION=PASS_035A_CONNECTOR_EXECUTOR_BOUNDARY_SCOPE_READY_FOR_IMPLEMENTATION
NEXT=035B_CONNECTOR_EXECUTOR_BOUNDARY_IMPLEMENTATION

<!-- BEGIN FORGEOS:CONNECTOR_EXECUTOR_BOUNDARY_IMPLEMENTATION_APPENDIX_035B -->
## 035B Implementation Appendix

- `035B_CONNECTOR_EXECUTOR_BOUNDARY_IMPLEMENTATION` implemented Connector Executor Boundary Contract.
- Connector execution handoff is not connector executor execution.
- Executor command candidate can be prepared.
- External API call remains false.
- Executor invocation remains false.
- External Dispatch Boundary remains separate.
- Unified Build Tree updated.
- Next: `036A_EXTERNAL_DISPATCH_BOUNDARY_SCOPE`
<!-- END FORGEOS:CONNECTOR_EXECUTOR_BOUNDARY_IMPLEMENTATION_APPENDIX_035B -->
