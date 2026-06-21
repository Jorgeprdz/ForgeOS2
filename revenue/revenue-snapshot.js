import {
  CARRIER_ADAPTER_VALUE_STATES,
} from './carrier-revenue-adapter-contract.js';

import {
  classifyRevenueValue,
  REVENUE_BUCKETS,
} from './revenue-value.js';

import {
  applyRevenueScope,
  createRevenueScopeGate,
} from './revenue-scope-gate.js';

import {
  ECONOMIC_EVENT_STATUSES,
} from './economic-events/economic-event-status.js';

function emptyBucketMap() {
  return Object.fromEntries(
    Object.values(REVENUE_BUCKETS).map((bucket) => [bucket, []])
  );
}

function addCurrencyAmount(target, currency, amount) {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) {
    return;
  }

  const key = currency || 'UNKNOWN_CURRENCY';
  target[key] = (target[key] || 0) + Number(amount);
}

function statusOf(item = {}) {
  return item.status || item.economicEventStatus?.status || item.revenueStatus || null;
}

function cloneForRouting(item = {}) {
  return {
    ...item,
    evidenceRefs: Array.isArray(item.evidenceRefs) ? [...item.evidenceRefs] : [],
  };
}

function adapterResultFromRouter(item = {}, carrierRuleRouter = null) {
  if (!carrierRuleRouter || item.adapterResult) {
    return item.adapterResult || null;
  }

  const status = statusOf(item);

  if (status === ECONOMIC_EVENT_STATUSES.PAYMENT_CONFIRMED) {
    return carrierRuleRouter.routePaymentEventToCarrierAdapter(cloneForRouting(item));
  }

  if (status === ECONOMIC_EVENT_STATUSES.PAID_CONFIRMED) {
    return carrierRuleRouter.routeCommissionStatementToCarrierAdapter(cloneForRouting(item));
  }

  return null;
}

function normalizeNotModeledReason(adapterResult = {}) {
  return adapterResult.metadata?.notModeledReason || 'adapter_returned_not_modeled';
}

function normalizeRoutedItem(item = {}, carrierRuleRouter = null) {
  const adapterResult = adapterResultFromRouter(item, carrierRuleRouter);

  if (!adapterResult) {
    return item;
  }

  if (
    adapterResult.valueState === CARRIER_ADAPTER_VALUE_STATES.NOT_MODELED &&
    !adapterResult.metadata?.notModeledReason
  ) {
    return {
      ...item,
      adapterResult: {
        ...adapterResult,
        metadata: {
          ...adapterResult.metadata,
          notModeledReason: normalizeNotModeledReason(adapterResult),
        },
      },
    };
  }

  return {
    ...item,
    adapterResult,
  };
}

export function createRevenueSnapshot({
  items = [],
  scopeGate = createRevenueScopeGate(),
  scopeContext = {},
  carrierRuleRouter = null,
  snapshotId = null,
  createdAt = null,
} = {}) {
  const buckets = emptyBucketMap();
  const visibleTotals = {
    generated: {},
    earnedEstimated: {},
    paidConfirmed: {},
    reversed: {},
    cancelled: {},
  };
  const excludedBuckets = emptyBucketMap();
  const warnings = [];
  const blockedReasons = {};
  const notModeledReasons = {};
  const unknownReasons = {};
  const values = [];

  items.forEach((item) => {
    const scoped = applyRevenueScope(item, { scopeGate, context: scopeContext });
    const revenueValue = scoped.visible
      ? classifyRevenueValue(normalizeRoutedItem(scoped.item, carrierRuleRouter))
      : scoped.revenueValue;

    values.push(revenueValue);
    buckets[revenueValue.bucket].push(revenueValue);

    if (revenueValue.bucket === REVENUE_BUCKETS.HIDDEN_BY_SCOPE) {
      excludedBuckets[revenueValue.bucket].push(revenueValue);
      return;
    }

    if (revenueValue.generated) {
      addCurrencyAmount(visibleTotals.generated, revenueValue.currency, revenueValue.amount);
    }

    if (revenueValue.bucket === REVENUE_BUCKETS.EARNED_ESTIMATED) {
      addCurrencyAmount(visibleTotals.earnedEstimated, revenueValue.currency, revenueValue.amount);
    }

    if (revenueValue.bucket === REVENUE_BUCKETS.PAID_CONFIRMED) {
      addCurrencyAmount(visibleTotals.paidConfirmed, revenueValue.currency, revenueValue.amount);
    }

    if (revenueValue.bucket === REVENUE_BUCKETS.REVERSED) {
      addCurrencyAmount(visibleTotals.reversed, revenueValue.currency, revenueValue.amount);
    }

    if (revenueValue.bucket === REVENUE_BUCKETS.CANCELLED) {
      addCurrencyAmount(visibleTotals.cancelled, revenueValue.currency, revenueValue.amount);
    }

    if (revenueValue.bucket !== REVENUE_BUCKETS.EARNED_ESTIMATED && revenueValue.bucket !== REVENUE_BUCKETS.PAID_CONFIRMED) {
      excludedBuckets[revenueValue.bucket].push(revenueValue);
    }

    revenueValue.warnings.forEach((warning) => warnings.push(warning));

    if (revenueValue.bucket === REVENUE_BUCKETS.BLOCKED && revenueValue.reason) {
      blockedReasons[revenueValue.reason] = (blockedReasons[revenueValue.reason] || 0) + 1;
    }

    if (revenueValue.bucket === REVENUE_BUCKETS.NOT_MODELED && revenueValue.reason) {
      notModeledReasons[revenueValue.reason] = (notModeledReasons[revenueValue.reason] || 0) + 1;
    }

    if (revenueValue.bucket === REVENUE_BUCKETS.UNKNOWN && revenueValue.reason) {
      unknownReasons[revenueValue.reason] = (unknownReasons[revenueValue.reason] || 0) + 1;
    }
  });

  return {
    snapshotId,
    createdAt: createdAt || new Date().toISOString(),
    values,
    buckets,
    visibleTotals,
    excludedBuckets,
    warnings,
    blockedReasons,
    notModeledReasons,
    unknownReasons,
    statusMetadata: {
      evidenceFirst: true,
      unknownIsNotZero: true,
      notModeledIsNotZero: true,
      blockedIsNotZero: true,
      hiddenByScopeIsNotZero: true,
      generatedBuckets: [
        REVENUE_BUCKETS.EARNED_ESTIMATED,
        REVENUE_BUCKETS.PAID_CONFIRMED,
      ],
    },
  };
}
