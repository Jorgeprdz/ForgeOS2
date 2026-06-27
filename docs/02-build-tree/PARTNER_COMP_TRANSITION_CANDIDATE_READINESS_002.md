# Partner Compensation — Transition Candidate Readiness 002

## Constitutional Status

Partner Compensation overall remains **PARTIAL / ACTIVE WORKSTREAM**.

The Partner Compensation Candidate Foundation Subset is **IMPLEMENTED_CANDIDATE / SUBSET STABILIZED**.

Full candidate completeness is **NOT CLOSED**.

This document does not implement a calculator, orchestrator, rule-data change, fixture, payout truth flow, or production payment operation.

## Scope

Phase:

`PARTNER-COMP-TRANSITION-READINESS-002B/C-1`

Mode:

`docs/test-only readiness lock`

Purpose:

Lock the correct domain design for the Bono de Transicion candidate before any calculator work.

## Current Status

Bono de Transicion remains **PARTIAL**.

CandidateAmount is not safely complete yet because Forge still requires:

- advisor-to-partner lineage
- former advisor code/key mapping
- direct key / assigned portfolio attribution
- initial commission ledger evidence
- renewal commission ledger evidence
- paid premium / paid-applied commission evidence
- no-administration evidence
- no-client-intervention evidence
- transition window months 1-6
- transition-specific calculator
- transition-specific orchestrator
- transition tests and fixtures

## Business Design Correction

The Bono de Transicion must be modeled as:

`advisor -> promoted/new partner`

It is not a generic portfolio-only bonus.

Required lineage:

`formerAdvisorId / formerAdvisorCode / formerAdvisorCompensationKey -> newPartnerId / partnerId -> partnerContractDate`

The transition candidate must use the former advisor direct key or assigned portfolio during the first 6 partner months.

## Commission Eligibility

Transition must include both:

- eligible initial commissions
- eligible renewal commissions

Transition must not reuse Productividad, Produccion, or Actividad logic because those are initial-commission concepts.

Transition requires a commission ledger line that can distinguish:

- `commissionType=initial`
- `commissionType=renewal`

Missing commission type is unknown and must not become zero.

## Required Data Model

### PartnerTransitionLineage

Required fields:

- `partnerId`
- `formerAdvisorId`
- `formerAdvisorCode`
- `formerAdvisorCompensationKey`
- `partnerContractDate`
- `partnerCareerMonth`
- `transitionWindowMonth`
- `directKey`
- `assignedPortfolioId`
- `lineageEvidence`

### TransitionCommissionLedgerLine

Required fields:

- `ledgerLineId`
- `partnerId`
- `formerAdvisorId`
- `formerAdvisorCompensationKey`
- `directKey`
- `assignedPortfolioId`
- `commissionType`
- `commissionAmount`
- `premiumPaymentDate`
- `commissionPaidDate`
- `paidPremiumEvidence`
- `paidAppliedCommissionEvidence`

Allowed `commissionType` values:

- `initial`
- `renewal`

### TransitionEligibilityEvidence

Required fields:

- `nonAdministrationEvidence`
- `nonClientInterventionEvidence`
- `directKeyAttributionEvidence`
- `assignedPortfolioEvidence`
- `lineageEvidence`

## Candidate Calculation Shape

Transition candidate calculation must only become eligible when all of these are true:

1. advisor-to-partner lineage exists
2. former advisor key/direct key is known
3. partner contract date is known
4. transition month is within months 1-6
5. ledger lines belong to former advisor key / assigned portfolio
6. ledger lines are paid-applied
7. ledger lines have commissionType `initial` or `renewal`
8. nonAdministrationEvidence passes
9. nonClientInterventionEvidence passes

Candidate formula:

`transitionBonusCandidate = eligibleInitialCommissions + eligibleRenewalCommissions`

If required evidence is missing:

`status = BLOCKED_OR_UNKNOWN`

Never convert missing evidence to zero.

## Payout Truth Boundary

`candidateAmount` is not `payoutTruth`.

`payoutTruth=true` remains `BLOCKED_BY_OFFICIAL_EVIDENCE` until official statement/account ingestion and statement line match exist.

This readiness document must not create or imply payoutTruth.

Expected transition candidate output must keep:

`payoutTruth=false`

## No-Go Boundaries

- Unknown is not zero.
- Semantic amount is not full candidateAmount.
- Raw activity logs are insufficient.
- Productividad, Produccion, and Actividad logic must not be reused for transition.
- Renewal commissions must be explicitly supported.
- Ownership source truth remains protected.
- No official statement adapter is introduced in this phase.
- No payoutTruth implementation is introduced in this phase.

## Future Implementation Phases

### 002B/C-2 — Transition Contract/Data Shape

Future allowed work:

- create transition contract helpers
- define lineage validation
- define transition ledger validation
- create tests for blocked/unknown states

No calculator yet unless explicitly gated.

### 002B/C-3 — Transition Candidate Calculator

Future allowed work:

- sum initial + renewal eligible ledger lines
- enforce months 1-6
- enforce no-administration and no-client-intervention gates
- return candidateAmount with payoutTruth=false
- preserve unknown-is-not-zero

### 002B/C-4 — Transition Orchestrator Integration

Future allowed work:

- integrate transition into appropriate monthly partner compensation flow
- keep it separate from quarterly initial-commission bonus flow
- add regression fixtures and no-payoutTruth tests

## Proposed Future Files

Potential future files:

- `compensation/partner-manager/partner-transition-bonus-contract.js`
- `compensation/partner-manager/partner-transition-bonus-calculator.js`
- `compensation/partner-manager/partner-transition-bonus-orchestrator.js`
- `tests/partner-transition-bonus-contract-test.js`
- `tests/partner-transition-bonus-calculator-test.js`
- `tests/partner-transition-bonus-orchestrator-test.js`

## Readiness Decision

Decision: **READINESS_LOCKED**

Meaning:

- The corrected business design is documented.
- Transition remains PARTIAL.
- Candidate implementation is not yet done.
- payoutTruth remains blocked.
