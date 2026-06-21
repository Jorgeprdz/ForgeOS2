export const ADVISOR_ECONOMIC_OUTPUT_STATUSES = Object.freeze({
  UNKNOWN: 'unknown',
  CANDIDATE: 'candidate',
  EVIDENCE_CONFIRMED: 'evidence_confirmed',
  PAID_APPLIED_CONFIRMED: 'paid_applied_confirmed',
  CARRIER_CALCULATED: 'carrier_calculated',
  PAYOUT_CONFIRMED: 'payout_confirmed',
  BLOCKED: 'blocked',
});

export const ADVISOR_ECONOMIC_OUTPUT_REASONS = Object.freeze({
  RAW_ACTIVITY_ONLY: 'raw_activity_is_not_economic_output',
  POLICY_COUNT_ONLY: 'policy_count_alone_is_not_commission_output',
  ISSUED_WITHOUT_PAYMENT: 'issued_policy_without_payment_application',
  MISSING_PAYOUT_EVIDENCE: 'payout_confirmed_requires_payout_evidence',
  UNKNOWN_NOT_ZERO: 'unknown_is_not_zero',
});

const PARTNER_ELIGIBLE_STATUSES = new Set([
  ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
  ADVISOR_ECONOMIC_OUTPUT_STATUSES.CARRIER_CALCULATED,
  ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAYOUT_CONFIRMED,
]);

function cloneArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function money(value) {
  return hasNumber(value) ? Number(value) : null;
}

function normalizeStatus(status) {
  return Object.values(ADVISOR_ECONOMIC_OUTPUT_STATUSES).includes(status)
    ? status
    : ADVISOR_ECONOMIC_OUTPUT_STATUSES.UNKNOWN;
}

export function createAdvisorEconomicOutput({
  advisorId = null,
  period = null,
  lifecycleStatus = 'unknown',
  advisorStage = null,
  initialCommissions = null,
  renewalCommissions = null,
  totalCommissions = null,
  paidAppliedProduction = null,
  paidAppliedPolicyCount = null,
  evidenceStatus = null,
  economicStatus = ADVISOR_ECONOMIC_OUTPUT_STATUSES.UNKNOWN,
  sourceType = 'unknown',
  reasons = [],
  warnings = [],
  metadata = {},
  rawActivityOnly = false,
  policyCountOnly = false,
  policyIssued = false,
  paymentApplied = false,
  payoutEvidenceConfirmed = false,
  hiddenByScope = false,
  heldPrecontractCommission = false,
} = {}) {
  const outputReasons = cloneArray(reasons);
  let status = normalizeStatus(economicStatus);

  if (rawActivityOnly || sourceType === 'activity') {
    outputReasons.push(ADVISOR_ECONOMIC_OUTPUT_REASONS.RAW_ACTIVITY_ONLY);
    status = ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED;
  }

  if (policyCountOnly) {
    outputReasons.push(ADVISOR_ECONOMIC_OUTPUT_REASONS.POLICY_COUNT_ONLY);
    status = ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED;
  }

  if (policyIssued && !paymentApplied) {
    outputReasons.push(ADVISOR_ECONOMIC_OUTPUT_REASONS.ISSUED_WITHOUT_PAYMENT);
    status = ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED;
  }

  if (status === ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAYOUT_CONFIRMED && !payoutEvidenceConfirmed) {
    outputReasons.push(ADVISOR_ECONOMIC_OUTPUT_REASONS.MISSING_PAYOUT_EVIDENCE);
    status = ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED;
  }

  if (status === ADVISOR_ECONOMIC_OUTPUT_STATUSES.UNKNOWN) {
    outputReasons.push(ADVISOR_ECONOMIC_OUTPUT_REASONS.UNKNOWN_NOT_ZERO);
  }

  const safeInitial = money(initialCommissions);
  const safeRenewal = money(renewalCommissions);
  const safeTotal = money(totalCommissions);
  const safePaidApplied = money(paidAppliedProduction);

  return {
    advisorId,
    period,
    lifecycleStatus,
    advisorStage,
    initialCommissions: safeInitial,
    renewalCommissions: safeRenewal,
    totalCommissions: safeTotal ?? (
      safeInitial !== null || safeRenewal !== null
        ? (safeInitial || 0) + (safeRenewal || 0)
        : null
    ),
    paidAppliedProduction: safePaidApplied,
    paidAppliedPolicyCount: hasNumber(paidAppliedPolicyCount) ? Number(paidAppliedPolicyCount) : null,
    evidenceStatus,
    economicStatus: status,
    sourceType,
    reasons: outputReasons,
    warnings: cloneArray(warnings),
    metadata: { ...metadata },
    generatedByRawActivity: false,
    policyCountCreatesCommissionOutput: false,
    unknownIsZero: false,
    blockedIsZero: false,
    notModeledIsZero: false,
    hiddenByScope,
    heldPrecontractCommission,
    eligibleForPartnerCalculation: PARTNER_ELIGIBLE_STATUSES.has(status) && !hiddenByScope && !heldPrecontractCommission,
    payoutTruth: status === ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAYOUT_CONFIRMED,
  };
}

export function isAdvisorEconomicOutputEligibleForPartner(output = {}) {
  return output.eligibleForPartnerCalculation === true;
}
