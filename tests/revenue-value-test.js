import assert from 'node:assert/strict';

import {
  CARRIER_ADAPTER_SOURCE_STATES,
  CARRIER_ADAPTER_VALUE_STATES,
  createCarrierAdapterResult,
} from '../revenue/carrier-revenue-adapter-contract.js';

import {
  BLOCKED_REASONS,
  NOT_MODELED_REASONS,
  REVENUE_BUCKETS,
  UNKNOWN_REASONS,
  classifyRevenueValue,
  countsAsGeneratedRevenue,
} from '../revenue/revenue-value.js';

import {
  ECONOMIC_EVENT_STATUSES,
} from '../revenue/economic-events/economic-event-status.js';

const potential = classifyRevenueValue({
  status: ECONOMIC_EVENT_STATUSES.POTENTIAL,
  amount: 1000,
  currency: 'MXN',
});

assert.equal(potential.bucket, REVENUE_BUCKETS.POTENTIAL);
assert.equal(countsAsGeneratedRevenue(potential), false);
assert.equal(potential.amount, null);

const pendingPolicy = classifyRevenueValue({
  status: ECONOMIC_EVENT_STATUSES.PENDING_POLICY_CONFIRMATION,
  amount: 1000,
  currency: 'MXN',
});

assert.equal(pendingPolicy.bucket, REVENUE_BUCKETS.PENDING_POLICY_CONFIRMATION);
assert.equal(pendingPolicy.generated, false);

const pendingPayment = classifyRevenueValue({
  status: ECONOMIC_EVENT_STATUSES.PENDING_PAYMENT,
  amount: 1000,
  currency: 'MXN',
});

assert.equal(pendingPayment.bucket, REVENUE_BUCKETS.PENDING_PAYMENT);
assert.equal(pendingPayment.generated, false);

const paymentOnly = classifyRevenueValue({
  status: ECONOMIC_EVENT_STATUSES.PAYMENT_CONFIRMED,
  carrierId: 'SMNYL',
  paymentAmount: 1000,
  currency: 'MXN',
});

assert.equal(paymentOnly.bucket, REVENUE_BUCKETS.PAYMENT_CONFIRMED);
assert.equal(paymentOnly.payoutTruth, false);
assert.equal(paymentOnly.generated, false);

const unknown = classifyRevenueValue({
  status: ECONOMIC_EVENT_STATUSES.UNKNOWN,
  amount: 500,
  currency: 'MXN',
});

assert.equal(unknown.bucket, REVENUE_BUCKETS.UNKNOWN);
assert.equal(unknown.amount, null);
assert.equal(unknown.reason, UNKNOWN_REASONS.UNKNOWN_VALUE);

const notModeled = classifyRevenueValue({
  status: ECONOMIC_EVENT_STATUSES.PAYMENT_CONFIRMED,
  carrierId: 'AXA',
  adapterResult: createCarrierAdapterResult({
    carrierId: 'AXA',
    valueState: CARRIER_ADAPTER_VALUE_STATES.NOT_MODELED,
    amount: null,
    sourceState: CARRIER_ADAPTER_SOURCE_STATES.NOT_MODELED,
    metadata: { notModeledReason: NOT_MODELED_REASONS.MISSING_ADAPTER },
  }),
});

assert.equal(notModeled.bucket, REVENUE_BUCKETS.NOT_MODELED);
assert.equal(notModeled.amount, null);
assert.equal(notModeled.reason, NOT_MODELED_REASONS.MISSING_ADAPTER);

const blocked = classifyRevenueValue({
  status: ECONOMIC_EVENT_STATUSES.BLOCKED_BY_MISSING_PAYMENT,
  amount: 500,
  currency: 'MXN',
});

assert.equal(blocked.bucket, REVENUE_BUCKETS.BLOCKED);
assert.equal(blocked.amount, null);
assert.equal(blocked.reason, BLOCKED_REASONS.MISSING_PAYMENT);

const paidWithoutStatement = classifyRevenueValue({
  status: ECONOMIC_EVENT_STATUSES.PAID_CONFIRMED,
  commissionAmount: 100,
  currency: 'MXN',
});

assert.equal(paidWithoutStatement.bucket, REVENUE_BUCKETS.BLOCKED);
assert.equal(paidWithoutStatement.reason, BLOCKED_REASONS.MISSING_STATEMENT);
assert.equal(paidWithoutStatement.payoutTruth, false);

const paidWithStatement = classifyRevenueValue({
  status: ECONOMIC_EVENT_STATUSES.PAID_CONFIRMED,
  commissionAmount: 100,
  currency: 'MXN',
  commissionStatementEvidence: {
    confirmationState: 'confirmed',
  },
});

assert.equal(paidWithStatement.bucket, REVENUE_BUCKETS.PAID_CONFIRMED);
assert.equal(paidWithStatement.amount, 100);
assert.equal(paidWithStatement.payoutTruth, true);

const forecast = classifyRevenueValue({
  isForecast: true,
  amount: 1000,
  currency: 'MXN',
});

assert.equal(forecast.bucket, REVENUE_BUCKETS.UNKNOWN);
assert.equal(forecast.amount, null);
assert.equal(forecast.reason, UNKNOWN_REASONS.FORECAST_ONLY);
assert.equal(forecast.payoutTruth, false);

console.log('PASS revenue-value-test');
