# 042A UI Rendering Boundary Scope

## Phase

- Phase: `042A_UI_RENDERING_BOUNDARY_SCOPE`
- Status: SCOPE CLOSED after validation.
- Next: `042B_UI_RENDERING_BOUNDARY_IMPLEMENTATION`.

## Roadmap Pivot

After `041B_CANONICAL_TRUTH_REGISTRY_IMPLEMENTATION`, Forge intentionally pivots to UI Rendering Boundary before Metric / Economic Truth.

Reason: Forge has enough protected read-only intelligence to feel alive without enabling economic truth, compensation truth, CRM mutation, actions, or automatic execution.

Metric / Economic Truth remains planned and separate.

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
-> Audit / Persistence Boundary
-> Truth Promotion Boundary
-> Canonical Truth Registry Boundary
```

Canonical truth entry candidate is not canonical truth write.

UI rendering candidate is not user interface execution.

Forge Alive view is not dashboard truth.

UI Rendering Boundary is the next constitutional boundary.

It defines how Forge may prepare a safe read-only rendering candidate for humans to see Forge status, warnings, limitations, source trace, reason why, and next review action without rendering screens, mutating state, executing actions, creating truth, creating tasks/calendar, calculating metrics, or modifying CRM.

042A scopes the boundary only.

042A does not implement UI.

042A does not render components.

042A does not create dashboards.

042A does not persist UI state.

042A does not create business, metric, compensation, revenue, payout, HR, ranking, lifecycle, or personality truth.

042A does not mutate CRM.

042A does not create tasks or calendar events.

042A does not execute actions.

## Current upstream closed layers

- `040B_TRUTH_PROMOTION_BOUNDARY_IMPLEMENTATION`
- `041B_CANONICAL_TRUTH_REGISTRY_IMPLEMENTATION`

## UI Rendering Boundary definition

The UI Rendering Boundary separates:

- canonical truth entry candidate
- UI presentation model candidate
- truth promotion review candidate
- read-only action card candidate
- Forge Alive shell candidate
- visible status
- visible reason why
- visible next review action
- visible warnings
- visible limitations
- immutable source trace
- source evidence IDs
- source owners
- source freshness
- viewer role
- display policy
- safety policy
- privacy policy
- audit trail

from:

- actual UI rendering
- front-end component execution
- dashboard creation
- route creation
- browser/runtime rendering
- persistence write
- canonical truth write
- business/metric/economic truth creation
- compensation/revenue/payout truth
- ranking/punishment/HR/personality truth
- advisor lifecycle truth
- task/calendar creation
- CRM mutation
- provider/external API calls
- send/action execution

This boundary may later validate UI rendering readiness and prepare a read-only render model candidate, but it must not render it or make the UI interactive.

## Future input shape

The future 042B contract may consume:

- uiRenderingRequestId
- canonicalTruthRegistryRequestId
- truthPromotionRequestId
- auditPersistenceRequestId
- uiReadModelRequestId
- advisorId
- managerId
- personId
- personType
- viewerId
- viewerRole
- canonicalTruthRegistrySnapshot
- canonicalTruthEntryCandidate
- uiPresentationModelCandidate
- forgeAliveCardCandidate
- visibleStatus
- visibleSeverity
- visibleReasonWhy
- visibleNextReviewAction
- visibleWarnings
- visibleLimitations
- immutableSourceTrace
- displayPolicySnapshot
- safetyPolicySnapshot
- privacyPolicySnapshot
- interactionPolicySnapshot
- sourceEvidence
- sourceFreshness
- sourceOwners
- auditTrail
- idempotencyKey
- requestedUse
- createdAt
- expiresAt
- now

## Future output shape

The future 042B contract should output:

- uiRenderingBoundaryStatus
- decision
- uiRenderingRequestId
- canonicalTruthRegistryRequestId
- truthPromotionRequestId
- auditPersistenceRequestId
- uiReadModelRequestId
- advisorId
- managerId
- personId
- personType
- viewerId
- viewerRole
- forgeAliveRenderModelCandidate
- readOnlyActionCardCandidate
- visibleStatus
- visibleSeverity
- visibleReasonWhy
- visibleNextReviewAction
- visibleWarnings
- visibleLimitations
- eligibleForReadOnlyRenderModel
- approvedForUiRendering
- rendersUi
- createsDashboard
- createsRoute
- persistsUiState
- writesCanonicalTruth
- createsBusinessTruth
- createsMetricTruth
- createsEconomicTruth
- createsDeliveryTruth
- createsMessageTruth
- createsCompensationTruth
- createsPayoutTruth
- createsRevenueTruth
- createsRankingTruth
- createsPunishmentTruth
- createsHrTruth
- createsPromotionTruth
- createsAdvisorLifecycleTruth
- createsPersonalityTruth
- createsTask
- createsCalendarEvent
- mutatesCrm
- providerApiCallAllowed
- externalApiCallAllowed
- executesAction
- sendsMessage
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

- READY_FOR_UI_RENDERING_REVIEW
- APPROVED_FOR_READ_ONLY_RENDER_MODEL_CANDIDATE
- NEEDS_CANONICAL_TRUTH_REGISTRY
- NEEDS_CANONICAL_TRUTH_ENTRY_CANDIDATE
- NEEDS_UI_PRESENTATION_MODEL
- NEEDS_DISPLAY_POLICY
- NEEDS_SAFETY_POLICY
- NEEDS_PRIVACY_POLICY
- NEEDS_INTERACTION_POLICY
- NEEDS_VIEWER_ROLE
- NEEDS_SOURCE_EVIDENCE
- NEEDS_SOURCE_OWNER
- NEEDS_SOURCE_FRESHNESS
- STALE_SOURCE_FRESHNESS
- NEEDS_IDEMPOTENCY_KEY
- NEEDS_AUDIT_TRAIL
- UNSUPPORTED_VIEWER_ROLE
- UNSUPPORTED_CARD_TYPE
- EXPIRED_UI_RENDERING_WINDOW
- BLOCKED
- UNKNOWN
- NOT_MODELED

## Proposed decisions

- REQUEST_UI_RENDERING_REVIEW
- APPROVE_READ_ONLY_RENDER_MODEL_CANDIDATE
- BLOCK_UI_RENDERING
- NEEDS_MORE_CONTEXT
- EXPIRED
- NOT_MODELED

## Allowed uses

- UI_RENDERING_REVIEW
- READ_ONLY_RENDER_MODEL_PREP
- FORGE_ALIVE_CARD_PREP
- ADVISOR_STATUS_CARD_PREP
- MANAGER_REVIEW_CARD_PREP
- WARNING_LIMITATION_DISPLAY_PREP
- SOURCE_TRACE_DISPLAY_PREP

## Forbidden uses

- UI_RENDERING
- DASHBOARD_CREATION
- ROUTE_CREATION
- COMPONENT_EXECUTION
- INTERACTIVE_ACTION
- PERSISTENCE_WRITE
- CANONICAL_TRUTH_WRITE
- BUSINESS_TRUTH_CREATION
- METRIC_TRUTH_CREATION
- ECONOMIC_TRUTH_CREATION
- DELIVERY_TRUTH_CREATION
- MESSAGE_TRUTH_CREATION
- COMPENSATION_TRUTH
- PAYOUT_TRUTH
- REVENUE_TRUTH
- HUMAN_RANKING
- HR_DECISION
- PROMOTION_DECISION
- TERMINATION
- ADVISOR_LIFECYCLE_TRUTH
- PERSONALITY_TRUTH
- TASK_CREATION
- CALENDAR_CREATION
- CRM_MUTATION
- PROVIDER_API_CALL
- EXTERNAL_API_CALL
- SEND_MESSAGE
- ACTION_EXECUTION
- MANIPULATION
- SURVEILLANCE

## Required rules for 042B implementation

Tests must prove:

1. Missing Canonical Truth Registry snapshot blocks render model candidate preparation.
2. Missing canonical truth entry candidate blocks.
3. Missing UI presentation model blocks.
4. Missing display policy blocks.
5. Missing safety policy blocks.
6. Missing privacy policy blocks.
7. Missing interaction policy blocks.
8. Missing viewer role blocks.
9. Missing source evidence blocks.
10. Missing source owner blocks.
11. Missing source freshness blocks.
12. Stale source freshness blocks or requires review.
13. Missing idempotency key blocks.
14. Missing audit trail blocks.
15. Unsupported viewer role blocks.
16. Unsupported card type blocks.
17. Expired UI rendering window blocks.
18. Read-only render model candidate can be prepared.
19. Actual UI rendering remains false.
20. Dashboard creation remains false.
21. Route/component execution remains false.
22. Interactive action remains false.
23. UI state persistence remains false.
24. Canonical truth write remains false.
25. Business/metric/economic truth creation remains false.
26. Delivery/message truth creation remains false.
27. Compensation/revenue/payout truth remains false.
28. Ranking/punishment/HR/personality truth remains false.
29. Advisor lifecycle truth remains false.
30. Task/calendar creation remains false.
31. CRM mutation remains false.
32. Provider/external API calls remain false.
33. Send/action execution remains false.
34. Forbidden uses are blocked.
35. Allowed uses are allowed.
36. Inputs are not mutated.
37. Evidence/source/sourceOwners dedupe.
38. Warnings and limitations remain visible.
39. Immutable source trace remains visible.
40. Forge Alive card candidate is read-only.
41. Metric / Economic Truth remains separate.
42. Explicit zero/false values are preserved as display context, not treated as missing.

## Forge Alive MVP Direction

After 042B, Forge can prepare a read-only model for:

- signal cards
- status cards
- reason-why cards
- blocked/review cards
- source trace cards
- warning/limitation cards
- next review action cards

Still not allowed:

- buttons that execute
- automatic follow-up
- sending messages
- CRM mutation
- task/calendar creation
- persistence write
- truth write
- metric/economic truth calculation

## Relationship to Metric / Economic Truth

Metric / Economic Truth remains separate and planned.

The roadmap pivot does not cancel economic truth.

It delays it so Forge can become visible first through a safe, read-only Alive Shell.

## Open next phases

- `042B_UI_RENDERING_BOUNDARY_IMPLEMENTATION`
- `043A_FORGE_ALIVE_SHELL_SCOPE`
- `043B_FORGE_ALIVE_SHELL_IMPLEMENTATION`
- Metric / Economic Truth Scope

## Forge Council Review

- Miranda: UI is scoped as read-only before any rendering exists.
- Arqui Juve: Architecture stays maintainable because rendering, persistence, truth, and action execution remain separate.
- Joy Mangano: Practical utility increases because Forge becomes visible without becoming unsafe.
- Nash: Conversation intelligence can be shown as context, not converted into automatic action.
- Mick: Behavior signals can be displayed without premature scoring or punishment.
- Patch Adams: Trust is preserved because warnings and limitations remain visible.
- Chris Gardner: Execution improves because advisors see what needs review.
- Rocky: Consistency improves because every visible card keeps evidence and freshness.
- Nicky Spurgeon: Outreach remains ethical because interactive action is blocked.
- Jordan Belfort: Conversion remains bounded by no auto-send and no manipulation.
- Jurgen Klaric: Psychology supports voluntary action through explainable visible context.

## Final decision

SEMAFORO=PASS
DECISION=PASS_042A_UI_RENDERING_BOUNDARY_SCOPE_READY_FOR_IMPLEMENTATION
NEXT=042B_UI_RENDERING_BOUNDARY_IMPLEMENTATION

<!-- BEGIN FORGEOS:UI_RENDERING_BOUNDARY_IMPLEMENTATION_APPENDIX_042B -->
## 042B Implementation Appendix

- `042B_UI_RENDERING_BOUNDARY_IMPLEMENTATION` implemented UI Rendering Boundary Contract.
- UI rendering candidate is not user interface execution.
- Forge Alive view is not dashboard truth.
- Read-only render model candidate can be prepared.
- Actual UI rendering remains false.
- Dashboard, route, component, and interactive action remain false.
- Persistence, truth, CRM mutation, task/calendar, API calls, and send/action execution remain false.
- Metric / Economic Truth remains separate and planned.
- Unified Build Tree updated.
- Next: `043A_FORGE_ALIVE_SHELL_SCOPE`
<!-- END FORGEOS:UI_RENDERING_BOUNDARY_IMPLEMENTATION_APPENDIX_042B -->
