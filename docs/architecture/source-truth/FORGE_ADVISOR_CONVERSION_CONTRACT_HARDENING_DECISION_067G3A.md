# Forge Advisor Conversion Contract Hardening Decision 067G3A

Module: `067G3A_ADVISOR_CONVERSION_CONTRACT_HARDENING`
Parent: `067G3_CANDIDATE_ADVISOR_IDENTITY_RATIFICATION`
Status: `IMPLEMENTED_AND_CLOSED_FOR_CONTRACTS_ONLY`
Date: 2026-07-16

## Constitutional gate

- Board approval: approved for bounded contract implementation.
- Miranda approval: approved for contract implementation.
- ROBOCOP LOCK 001: resolved for 067G3A only.
- Runtime writer: prohibited and not created.
- Advisor identity generation: prohibited and not created.
- Advisor activation: prohibited and not performed.
- UI, routes, browser storage, backend side effects, NASH, NBA and Pipeline writes: unchanged.

## Problem

Legacy `schemas/advisor-conversion.schema.json` combined a materialized conversion state, an Advisor identity link and unconstrained event history. It required `advisorId` and `convertedAt` even for `PENDING`, exposed only `PENDING`, `COMPLETED` and ambiguous `REVERSED` states, and had no distinct request, eligibility, human review, allocation, immutable receipt, failure, cancellation, correction, privacy allowlist or idempotency contract.

The legacy schema was consumed only by synthetic recruitment fixtures and a fixture validator. No runtime import, conversion writer or Advisor repository was discovered.

## Compatibility decision

Strategy: `DEPRECATED_V1_PLUS_NEW_FAMILY`.

- V1 remains structurally compatible for existing synthetic fixtures.
- V1 now carries `deprecated: true`, an explicit fixture-only description and a successor reference.
- New consumers must use `schemas/advisor-conversion-contract-family-v2.schema.json`.
- V2 is closed (`additionalProperties: false`) and versioned `2.0.0`.
- No V1 fixture becomes runtime truth.
- No silent semantic migration occurs.

## Ratified V2 contract family

The V2 family separates ten contracts:

1. `AdvisorConversionRequest`
2. `AdvisorConversionEligibilitySnapshot`
3. `AdvisorConversionReviewDecision`
4. `AdvisorIdentityAllocationReceipt`
5. `AdvisorConversionRecord`
6. `AdvisorConversionReceipt`
7. `AdvisorConversionFailure`
8. `AdvisorConversionCancellation`
9. `AdvisorConversionCorrection`
10. `AdvisorConversionEvent`

The family uses local `$defs` for actor, evidence reference, authority domain, privacy class and governed extension metadata. Repository discovery found no canonical JSON Schema with matching ownership and semantics. The existing Manager human-approval JavaScript boundary is delivery-preparation specific and explicitly cannot create Advisor Lifecycle truth; it was not reused as conversion approval authority.

## Authority boundaries

```text
Manager OS Recruitment or Precontract Handoff
  → may create a conversion request

Advisor Lifecycle Conversion Authority
  → owns conversion review coordination and materialized conversion state

Contracting or Advisor Lifecycle Approval Authority
  → supplies policy-authorized human approval

Advisor Lifecycle Identity Authority
  → may later allocate or link advisorId through an allocation receipt

Advisor Lifecycle Activation Authority
  → remains unresolved and outside 067G3A
```

Actor membership is not hardcoded. `policySnapshotId`, actor authority and separation-of-duties evaluation are mandatory. AI cannot be a reviewer. A Manager dashboard cannot approve. Fixture actors do not define authority.

## Request and identity separation

The request requires:

- `recruitIdentityId`
- `applicationId`
- attempt-scoped `candidateId`
- caller `idempotencyKey`
- logical `conversionIntentKey`
- requestor and authority domain
- eligibility, evidence and policy references

The request forbids `advisorId`. Advisor identity appears only after a future authorized identity writer produces `AdvisorIdentityAllocationReceipt`.

## Eligibility and human review

Eligibility is a captured evidence snapshot, not a decision. It has mandatory flags:

```text
humanReviewRequired=true
createsAdvisorTruth=false
approvesConversion=false
```

Review decisions are explicit enums, not Booleans:

- `APPROVED`
- `REJECTED`
- `NEEDS_MORE_EVIDENCE`
- `RETURNED_FOR_CORRECTION`
- `CANCELLED_BY_AUTHORITY`

Approval requires confirmed human decision, authority, policy snapshot, reviewed evidence and a passing/policy-allowed separation-of-duties result. Approval does not create Advisor identity.

## Idempotency rules

Logical intent:

```text
recruitIdentityId
+ applicationId
+ candidateId
+ targetLifecycleAuthority
```

Contract semantics:

- Same completed logical intent returns the existing receipt.
- Same idempotency key with a changed payload is rejected.
- Same attempt with a conflicting target Advisor ID is blocked for identity review.
- Timeout retry must not allocate a second Advisor.
- Duplicate Advisor creation is forbidden.
- Persistence, locking, transaction and outbox implementation remain future work.

## Materialized state and immutable receipt

`AdvisorConversionRecord` represents mutable current state only:

- `REQUESTED`
- `UNDER_REVIEW`
- `APPROVED`
- `IDENTITY_ALLOCATED`
- `COMPLETED`
- `FAILED`
- `CANCELLED`
- `CORRECTION_REQUIRED`
- `SUPERSEDED`

It references decisions and immutable records. It does not embed unconstrained event history.

`AdvisorConversionReceipt` is immutable and proves conversion completion only. It requires identity lineage, allocation receipt, human decision, policy/evidence, idempotency, version and integrity reference.

## Activation separation

```text
CONVERSION_STATUS_COMPLETED
DOES_NOT_IMPLY
ADVISOR_STATUS_ACTIVE
```

Both materialized record and completion receipt require `conversionCompletedImpliesActive=false`. An optional opaque `activationReceiptId` is only a future reference. `activationEffectiveAt` is not present and cannot be inferred from `conversionCompletedAt`.

Conversion does not prove:

- Advisor activation
- Advisor OS access
- Sales Pipeline existence or eligibility
- client-action capability
- Project 200 handoff eligibility

The exact activation authority actor and official evidence policy remain blocked.

## Failure and partial-failure semantics

Failure stages are constrained to request validation, eligibility validation, human review, identity allocation, receipt commit, event publication and reconciliation. Recoverability is explicit: retryable, correction required, terminal or human review required.

Future runtime requirements:

- Advisor ID allocated but receipt missing: reconcile; do not allocate another ID.
- Receipt committed but event publication failed: retry the same event through an idempotent outbox.
- Event observed but receipt unavailable: fail closed until authoritative receipt is recovered.
- Conflicting Advisor IDs: block and require privileged identity review.

067G3A documents these semantics but implements no persistence or execution.

## Cancellation and correction

Cancellation is allowed only before completion. Its `previousState` enum excludes `COMPLETED`, and it must preserve audit history.

Correction is append-only, references the original record and a superseding record, identifies affected fields, and requires human request and approval. Silent receipt rewrite and destructive history replacement are forbidden.

Advisor deactivation is not conversion cancellation or reversal. It remains a separate future Advisor Lifecycle event.

## Conversion events

The allowlist includes only conversion-domain events from request through correction. Every event requires identity lineage, authority, actor, policy, evidence, correlation, causation and idempotency.

`ADVISOR_ACTIVATED`, `ADVISOR_DEACTIVATED` and `ADVISOR_REACTIVATED` are intentionally absent.

## Privacy allowlist

Allowed categories:

- identity-link IDs
- authorized actor IDs
- policy references
- minimum provisioning identity
- evidence references
- decision metadata
- conversion timestamps
- audit metadata

Blocked by closed payloads and tests:

- Project 200 contacts
- NASAT assessments
- interview private notes
- psychological labels
- Manager opinions
- recruitment scoring details
- compensation negotiation
- prospect/client data
- quote/policy data
- Sales Pipeline data
- NASH memory
- arbitrary ungoverned properties

## Files

- `schemas/advisor-conversion.schema.json` — deprecated V1 notice only.
- `schemas/advisor-conversion-contract-family-v2.schema.json` — hardened V2 family.
- `fixtures/recruitment/advisor-conversion-contract-family-v2-valid.json` — synthetic validation fixture.
- `tests/advisor-conversion-contract-family-v2-test.js` — structural and cross-contract invariants.

## Tests and acceptance

The dedicated test validates all ten contracts and required negative scenarios for identity, approval, idempotency, privacy, lifecycle separation, failure, cancellation, correction and events.

Affected Recruitment, Precontract and Advisor Lifecycle suites remain passing. No real conversion, Advisor ID or activation was created.

## Acceptance status

```text
REQUEST_CONTRACT_SEPARATE=YES
REVIEW_CONTRACT_SEPARATE=YES
APPROVAL_DECISION_SEPARATE=YES
IDENTITY_ALLOCATION_RECEIPT_SEPARATE=YES
MATERIALIZED_CONVERSION_STATE_SEPARATE=YES
IMMUTABLE_COMPLETION_RECEIPT_SEPARATE=YES
FAILURE_CONTRACT_SEPARATE=YES
CANCELLATION_CONTRACT_SEPARATE=YES
CORRECTION_CONTRACT_SEPARATE=YES
HUMAN_APPROVAL_REQUIRED=YES
AI_APPROVAL_ALLOWED=NO
CONVERSION_INTENT_KEY_DEFINED=YES
CALLER_IDEMPOTENCY_KEY_REQUIRED=YES
CONVERSION_COMPLETED_IMPLIES_ACTIVE=NO
ACTIVATION_AUTHORITY_RATIFIED_IN_067G3A=NO
PRIVACY_ALLOWLIST_PRESENT=YES
UNBOUNDED_ADDITIONAL_PROPERTIES=NO
RUNTIME_WRITER_CREATED=NO
REAL_ADVISOR_ID_CREATED=NO
REAL_ADVISOR_ACTIVATED=NO
```

## Remaining blockers

- Exact Advisor activation authority actor and organizational policy.
- Official activation evidence policy and effective-time source.
- Canonical Advisor identity repository/provider.
- Runtime conversion authority, transaction, locking, outbox and reconciliation design.
- Deactivation/reactivation lifecycle contracts.
- Account/access, Sales Pipeline and Project 200 handoff eligibility implementation.

## Next bounded recommendation

`067G3B_ADVISOR_ACTIVATION_EVIDENCE_POLICY_RATIFICATION`

This recommendation is scope only. It does not authorize implementation and does not change the unrelated global `NEXT` sequence.
