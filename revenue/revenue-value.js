import {
  CARRIER_ADAPTER_VALUE_STATES,
} from './carrier-revenue-adapter-contract.js';

import {
  ECONOMIC_EVENT_STATUSES,
} from './economic-events/economic-event-status.js';

export const REVENUE_BUCKETS = Object.freeze({
  POTENTIAL: 'potential',
  PENDING_POLICY_CONFIRMATION: 'pending_policy_confirmation',
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  EARNED_ESTIMATED: 'earned_estimated',
  PAID_CONFIRMED: 'paid_confirmed',
  REVERSED: 'reversed',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown',
  BLOCKED: 'blocked',
  NOT_MODELED: 'not_modeled',
  HIDDEN_BY_SCOPE: 'hidden_by_scope',
});

export const NOT_MODELED_REASONS = Object.freeze({
  MISSING_ADAPTER: 'missing_adapter',
  UNSUPPORTED_CARRIER: 'unsupported_carrier',
  UNSUPPORTED_PRODUCT: 'unsupported_product',
  MISSING_RULE_PACK: 'missing_rule_pack',
  ADAPTER_RETURNED_NOT_MODELED: 'adapter_returned_not_modeled',
});

export const BLOCKED_REASONS = Object.freeze({
  MISSING_POLICY: 'blocked_by_missing_policy',
  MISSING_PAYMENT: 'blocked_by_missing_payment',
  MISSING_STATEMENT: 'blocked_by_missing_statement',
  MISSING_CLASSIFICATION: 'blocked_by_missing_classification',
});

export const UNKNOWN_REASONS = Object.freeze({
  UNKNOWN_STATUS: 'unknown_status',
  UNKNOWN_CARRIER: 'unknown_carrier',
  UNKNOWN_VALUE: 'unknown_value',
  FORECAST_ONLY: 'forecast_only',
  ADAPTER_RETURNED_UNKNOWN: 'adapter_returned_unknown',
});

const BLOCKED_STATUS_TO_REASON = Object.freeze({
  [ECONOMIC_EVENT_STATUSES.BLOCKED_BY_MISSING_POLICY]: BLOCKED_REASONS.MISSING_POLICY,
  [ECONOMIC_EVENT_STATUSES.BLOCKED_BY_MISSING_PAYMENT]: BLOCKED_REASONS.MISSING_PAYMENT,
  [ECONOMIC_EVENT_STATUSES.BLOCKED_BY_MISSING_STATEMENT]: BLOCKED_REASONS.MISSING_STATEMENT,
  [ECONOMIC_EVENT_STATUSES.BLOCKED_BY_MISSING_CLASSIFICATION]: BLOCKED_REASONS.MISSING_CLASSIFICATION,
});

const DIRECT_STATUS_TO_BUCKET = Object.freeze({
  [ECONOMIC_EVENT_STATUSES.POTENTIAL]: REVENUE_BUCKETS.POTENTIAL,
  [ECONOMIC_EVENT_STATUSES.PENDING_POLICY_CONFIRMATION]: REVENUE_BUCKETS.PENDING_POLICY_CONFIRMATION,
  [ECONOMIC_EVENT_STATUSES.PENDING_PAYMENT]: REVENUE_BUCKETS.PENDING_PAYMENT,
  [ECONOMIC_EVENT_STATUSES.PAYMENT_CONFIRMED]: REVENUE_BUCKETS.PAYMENT_CONFIRMED,
  [ECONOMIC_EVENT_STATUSES.EARNED_ESTIMATED]: REVENUE_BUCKETS.EARNED_ESTIMATED,
  [ECONOMIC_EVENT_STATUSES.PAID_CONFIRMED]: REVENUE_BUCKETS.PAID_CONFIRMED,
  [ECONOMIC_EVENT_STATUSES.REVERSED]: REVENUE_BUCKETS.REVERSED,
  [ECONOMIC_EVENT_STATUSES.CANCELLED]: REVENUE_BUCKETS.CANCELLED,
  [ECONOMIC_EVENT_STATUSES.UNKNOWN]: REVENUE_BUCKETS.UNKNOWN,
});

function cloneArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function normalizeAmount(value) {
  return hasNumber(value) ? Number(value) : null;
}

function normalizeStatus(input = {}) {
  return input.status || input.economicEventStatus?.status || input.revenueStatus || null;
}

function hasConfirmedCommissionStatement(input = {}) {
  return Boolean(
    input.hasConfirmedCommissionStatement ||
    input.commissionStatementConfirmed ||
    input.commissionStatementEvidence?.confirmationState === 'confirmed' ||
    input.payoutData?.confirmationState === 'confirmed'
  );
}

function hasPolicyAdvisorConfirmation(input = {}) {
  return Boolean(
    input.hasPolicyAdvisorConfirmation ||
    input.policyAdvisorConfirmed ||
    input.policyConfirmationState === 'confirmed' ||
    input.policyData?.confirmationState === 'confirmed' ||
    input.confirmationState === 'confirmed'
  );
}

function adapterNotModeledReason(adapterResult = {}) {
  const reason = adapterResult.metadata?.notModeledReason || adapterResult.metadata?.reason;
  if (Object.values(NOT_MODELED_REASONS).includes(reason)) {
    return reason;
  }

  return NOT_MODELED_REASONS.ADAPTER_RETURNED_NOT_MODELED;
}

function adapterBlockedReason(adapterResult = {}) {
  const reason = adapterResult.metadata?.blockReason;
  if (Object.values(BLOCKED_REASONS).includes(reason)) {
    return reason;
  }

  if (reason === 'missing_policy_number' || reason === 'missing_required_selectors') {
    return BLOCKED_REASONS.MISSING_POLICY;
  }

  if (reason === 'missing_payment_amount') {
    return BLOCKED_REASONS.MISSING_PAYMENT;
  }

  if (reason === 'missing_statement') {
    return BLOCKED_REASONS.MISSING_STATEMENT;
  }

  return reason || BLOCKED_REASONS.MISSING_CLASSIFICATION;
}

export function createRevenueValue({
  bucket = REVENUE_BUCKETS.UNKNOWN,
  amount = null,
  currency = null,
  reason = null,
  sourceState = 'unknown',
  evidenceRefs = [],
  warnings = [],
  confidence = 'unknown',
  statusMetadata = {},
  originalStatus = null,
  metadata = {},
} = {}) {
  const safeAmount = normalizeAmount(amount);
  const generated = (
    (bucket === REVENUE_BUCKETS.EARNED_ESTIMATED || bucket === REVENUE_BUCKETS.PAID_CONFIRMED) &&
    safeAmount !== null
  );

  return {
    bucket,
    amount: safeAmount,
    currency: safeAmount === null ? currency || null : currency,
    reason,
    generated,
    payoutTruth: bucket === REVENUE_BUCKETS.PAID_CONFIRMED && safeAmount !== null,
    sourceState,
    evidenceRefs: cloneArray(evidenceRefs),
    warnings: cloneArray(warnings),
    confidence,
    originalStatus,
    statusMetadata: { ...statusMetadata },
    metadata: { ...metadata },
  };
}

export function createHiddenByScopeRevenueValue(input = {}, {
  reason = 'hidden_by_scope',
  scopeMetadata = {},
} = {}) {
  return createRevenueValue({
    bucket: REVENUE_BUCKETS.HIDDEN_BY_SCOPE,
    amount: null,
    currency: input.currency || input.adapterResult?.currency || null,
    reason,
    sourceState: 'hidden_by_scope',
    evidenceRefs: input.evidenceRefs || input.adapterResult?.evidenceRefs || [],
    warnings: ['Revenue value hidden before visible aggregation.'],
    confidence: 'scope_denied',
    originalStatus: normalizeStatus(input),
    metadata: {
      scopeMetadata,
    },
  });
}

export function classifyRevenueValue(input = {}) {
  if (input.bucket && Object.values(REVENUE_BUCKETS).includes(input.bucket)) {
    return createRevenueValue(input);
  }

  if (input.isForecast || input.forecast === true || input.sourceType === 'forecast') {
    return createRevenueValue({
      bucket: REVENUE_BUCKETS.UNKNOWN,
      amount: null,
      currency: input.currency || null,
      reason: UNKNOWN_REASONS.FORECAST_ONLY,
      sourceState: 'forecast',
      evidenceRefs: input.evidenceRefs,
      warnings: ['Forecast is not payout truth.'],
      confidence: 'not_payout_truth',
      originalStatus: normalizeStatus(input),
    });
  }

  const status = normalizeStatus(input);
  const adapterResult = input.adapterResult || null;

  if (!input.carrierId && (status === ECONOMIC_EVENT_STATUSES.PAYMENT_CONFIRMED || input.requiresCarrierRouting)) {
    return createRevenueValue({
      bucket: REVENUE_BUCKETS.UNKNOWN,
      amount: null,
      currency: input.currency || null,
      reason: UNKNOWN_REASONS.UNKNOWN_CARRIER,
      sourceState: 'unknown_carrier',
      evidenceRefs: input.evidenceRefs,
      warnings: ['Unknown carrier does not default to SMNYL.'],
      confidence: 'unknown',
      originalStatus: status,
    });
  }

  if (adapterResult?.valueState === CARRIER_ADAPTER_VALUE_STATES.NOT_MODELED) {
    return createRevenueValue({
      bucket: REVENUE_BUCKETS.NOT_MODELED,
      amount: null,
      currency: adapterResult.currency || input.currency || null,
      reason: adapterNotModeledReason(adapterResult),
      sourceState: adapterResult.sourceState || 'not_modeled',
      evidenceRefs: adapterResult.evidenceRefs || input.evidenceRefs,
      warnings: adapterResult.warnings || [],
      confidence: 'not_modeled',
      originalStatus: status,
      metadata: { adapterResult },
    });
  }

  if (adapterResult?.valueState === CARRIER_ADAPTER_VALUE_STATES.BLOCKED) {
    return createRevenueValue({
      bucket: REVENUE_BUCKETS.BLOCKED,
      amount: null,
      currency: adapterResult.currency || input.currency || null,
      reason: adapterBlockedReason(adapterResult),
      sourceState: adapterResult.sourceState || 'blocked',
      evidenceRefs: adapterResult.evidenceRefs || input.evidenceRefs,
      warnings: adapterResult.warnings || [],
      confidence: 'blocked',
      originalStatus: status,
      metadata: { adapterResult },
    });
  }

  if (adapterResult?.valueState === CARRIER_ADAPTER_VALUE_STATES.UNKNOWN) {
    return createRevenueValue({
      bucket: REVENUE_BUCKETS.UNKNOWN,
      amount: null,
      currency: adapterResult.currency || input.currency || null,
      reason: UNKNOWN_REASONS.ADAPTER_RETURNED_UNKNOWN,
      sourceState: adapterResult.sourceState || 'unknown',
      evidenceRefs: adapterResult.evidenceRefs || input.evidenceRefs,
      warnings: adapterResult.warnings || [],
      confidence: 'unknown',
      originalStatus: status,
      metadata: { adapterResult },
    });
  }

  if (status && BLOCKED_STATUS_TO_REASON[status]) {
    return createRevenueValue({
      bucket: REVENUE_BUCKETS.BLOCKED,
      amount: null,
      currency: input.currency || null,
      reason: BLOCKED_STATUS_TO_REASON[status],
      sourceState: input.economicEventStatus?.sourceState || 'blocked',
      evidenceRefs: input.evidenceRefs || input.economicEventStatus?.evidenceRefs || [],
      warnings: input.warnings || input.economicEventStatus?.warnings || [],
      confidence: 'blocked',
      originalStatus: status,
    });
  }

  if (status === ECONOMIC_EVENT_STATUSES.PAID_CONFIRMED) {
    if (!hasConfirmedCommissionStatement(input)) {
      return createRevenueValue({
        bucket: REVENUE_BUCKETS.BLOCKED,
        amount: null,
        currency: input.currency || null,
        reason: BLOCKED_REASONS.MISSING_STATEMENT,
        sourceState: 'blocked',
        evidenceRefs: input.evidenceRefs,
        warnings: ['paid_confirmed requires confirmed commission statement evidence.'],
        confidence: 'blocked',
        originalStatus: status,
      });
    }

    return createRevenueValue({
      bucket: REVENUE_BUCKETS.PAID_CONFIRMED,
      amount: input.commissionAmount ?? input.amount,
      currency: input.currency || null,
      reason: null,
      sourceState: 'commission_statement',
      evidenceRefs: input.evidenceRefs,
      warnings: input.warnings,
      confidence: 'carrier_confirmed',
      originalStatus: status,
    });
  }

  if (status === ECONOMIC_EVENT_STATUSES.PAYMENT_CONFIRMED && adapterResult) {
    if (!hasPolicyAdvisorConfirmation(input)) {
      return createRevenueValue({
        bucket: REVENUE_BUCKETS.BLOCKED,
        amount: null,
        currency: input.currency || adapterResult.currency || null,
        reason: BLOCKED_REASONS.MISSING_POLICY,
        sourceState: 'blocked',
        evidenceRefs: input.evidenceRefs || adapterResult.evidenceRefs || [],
        warnings: ['earned_estimated requires policy/advisor confirmation.'],
        confidence: 'blocked',
        originalStatus: status,
      });
    }

    if (adapterResult.valueState === CARRIER_ADAPTER_VALUE_STATES.KNOWN && hasNumber(adapterResult.amount)) {
      return createRevenueValue({
        bucket: REVENUE_BUCKETS.EARNED_ESTIMATED,
        amount: adapterResult.amount,
        currency: adapterResult.currency || input.currency || null,
        reason: null,
        sourceState: adapterResult.sourceState || 'carrier_rule_estimate',
        evidenceRefs: adapterResult.evidenceRefs || input.evidenceRefs || [],
        warnings: adapterResult.warnings || [],
        confidence: 'payment_confirmed_adapter_estimate',
        originalStatus: status,
        metadata: { adapterResult },
      });
    }
  }

  if (status === ECONOMIC_EVENT_STATUSES.EARNED_ESTIMATED) {
    return createRevenueValue({
      bucket: REVENUE_BUCKETS.EARNED_ESTIMATED,
      amount: input.estimatedCommissionAmount ?? input.amount,
      currency: input.currency || null,
      sourceState: input.economicEventStatus?.sourceState || 'carrier_rule_estimate',
      evidenceRefs: input.evidenceRefs || input.economicEventStatus?.evidenceRefs || [],
      warnings: input.warnings || [],
      confidence: 'payment_confirmed_adapter_estimate',
      originalStatus: status,
    });
  }

  if (status && DIRECT_STATUS_TO_BUCKET[status]) {
    const bucket = DIRECT_STATUS_TO_BUCKET[status];
    const amount = (
      bucket === REVENUE_BUCKETS.REVERSED ||
      bucket === REVENUE_BUCKETS.CANCELLED
    )
      ? input.commissionAmount ?? input.amount
      : null;

    return createRevenueValue({
      bucket,
      amount,
      currency: input.currency || null,
      reason: bucket === REVENUE_BUCKETS.UNKNOWN ? UNKNOWN_REASONS.UNKNOWN_VALUE : null,
      sourceState: input.economicEventStatus?.sourceState || bucket,
      evidenceRefs: input.evidenceRefs || input.economicEventStatus?.evidenceRefs || [],
      warnings: input.warnings || input.economicEventStatus?.warnings || [],
      confidence: input.economicEventStatus?.trustLevel || bucket,
      originalStatus: status,
    });
  }

  return createRevenueValue({
    bucket: REVENUE_BUCKETS.UNKNOWN,
    amount: null,
    currency: input.currency || null,
    reason: input.reason || UNKNOWN_REASONS.UNKNOWN_STATUS,
    sourceState: input.sourceState || 'unknown',
    evidenceRefs: input.evidenceRefs,
    warnings: input.warnings,
    confidence: 'unknown',
    originalStatus: status,
  });
}

export function countsAsGeneratedRevenue(value = {}) {
  return value.generated === true;
}
