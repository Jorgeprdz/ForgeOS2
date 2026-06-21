import assert from 'node:assert/strict';

import {
  createCarrierAdapterResult,
  createCarrierRuleAdapter,
  CARRIER_ADAPTER_SOURCE_STATES,
  CARRIER_ADAPTER_VALUE_STATES,
} from '../revenue/carrier-revenue-adapter-contract.js';

import {
  createCarrierRuleRouter,
} from '../revenue/carrier-rule-router.js';

import {
  createRevenueSnapshot,
} from '../revenue/revenue-snapshot.js';

import {
  createRevenueScopeGate,
} from '../revenue/revenue-scope-gate.js';

import {
  NOT_MODELED_REASONS,
  REVENUE_BUCKETS,
  UNKNOWN_REASONS,
} from '../revenue/revenue-value.js';

import {
  ECONOMIC_EVENT_STATUSES,
} from '../revenue/economic-events/economic-event-status.js';

function createModeledAdapter() {
  return createCarrierRuleAdapter({
    carrierId: 'MODEL',
    carrierName: 'Modeled Carrier',
    capabilities: [],
    sourceState: CARRIER_ADAPTER_SOURCE_STATES.SOURCE_LOCKED,
    warnings: [],
    canCalculate: () => true,
    calculateFromPaymentEvent: (input = {}) => createCarrierAdapterResult({
      carrierId: 'MODEL',
      carrierName: 'Modeled Carrier',
      calculationType: 'payment_event',
      valueState: CARRIER_ADAPTER_VALUE_STATES.KNOWN,
      amount: Number(input.paymentAmount) * 0.1,
      currency: input.currency,
      sourceState: CARRIER_ADAPTER_SOURCE_STATES.SOURCE_LOCKED,
      evidenceRefs: input.evidenceRefs,
    }),
    confirmPayoutFromStatement: (input = {}) => createCarrierAdapterResult({
      carrierId: 'MODEL',
      carrierName: 'Modeled Carrier',
      calculationType: 'payout_confirmation',
      valueState: CARRIER_ADAPTER_VALUE_STATES.KNOWN,
      amount: Number(input.commissionAmount),
      currency: input.currency,
      sourceState: CARRIER_ADAPTER_SOURCE_STATES.SOURCE_LOCKED,
      evidenceRefs: input.evidenceRefs,
    }),
  });
}

const router = createCarrierRuleRouter({
  adapters: [
    createModeledAdapter(),
  ],
});

const earnedSnapshot = createRevenueSnapshot({
  carrierRuleRouter: router,
  items: [
    {
      status: ECONOMIC_EVENT_STATUSES.PAYMENT_CONFIRMED,
      confirmationState: 'confirmed',
      hasPolicyAdvisorConfirmation: true,
      advisorId: 'ADV_1',
      carrierId: 'MODEL',
      policyNumber: 'POL-1',
      paymentAmount: 1000,
      currency: 'MXN',
      paymentDate: '2026-06-01',
      evidenceRefs: ['PAY_1'],
    },
  ],
});

assert.equal(earnedSnapshot.buckets[REVENUE_BUCKETS.EARNED_ESTIMATED].length, 1);
assert.equal(earnedSnapshot.visibleTotals.earnedEstimated.MXN, 100);
assert.equal(earnedSnapshot.visibleTotals.generated.MXN, 100);

const scopedSnapshot = createRevenueSnapshot({
  scopeGate: createRevenueScopeGate({
    authorizedAdvisorIds: ['ADV_1'],
  }),
  items: [
    {
      status: ECONOMIC_EVENT_STATUSES.PAID_CONFIRMED,
      advisorId: 'ADV_2',
      commissionAmount: 500,
      currency: 'MXN',
      commissionStatementEvidence: { confirmationState: 'confirmed' },
    },
  ],
});

assert.equal(scopedSnapshot.buckets[REVENUE_BUCKETS.HIDDEN_BY_SCOPE].length, 1);
assert.equal(scopedSnapshot.visibleTotals.generated.MXN, undefined);

const unknownCarrierSnapshot = createRevenueSnapshot({
  carrierRuleRouter: router,
  items: [
    {
      status: ECONOMIC_EVENT_STATUSES.PAYMENT_CONFIRMED,
      confirmationState: 'confirmed',
      hasPolicyAdvisorConfirmation: true,
      paymentAmount: 1000,
      currency: 'MXN',
      paymentDate: '2026-06-01',
    },
  ],
});

assert.equal(unknownCarrierSnapshot.buckets[REVENUE_BUCKETS.UNKNOWN].length, 1);
assert.equal(unknownCarrierSnapshot.unknownReasons[UNKNOWN_REASONS.UNKNOWN_CARRIER], 1);

const unsupportedCarrierSnapshot = createRevenueSnapshot({
  carrierRuleRouter: router,
  items: [
    {
      status: ECONOMIC_EVENT_STATUSES.PAYMENT_CONFIRMED,
      confirmationState: 'confirmed',
      hasPolicyAdvisorConfirmation: true,
      carrierId: 'CONNECTED',
      policyNumber: 'CON-1',
      paymentAmount: 1000,
      currency: 'MXN',
      paymentDate: '2026-06-01',
    },
  ],
});

assert.equal(unsupportedCarrierSnapshot.buckets[REVENUE_BUCKETS.NOT_MODELED].length, 1);
assert.equal(
  unsupportedCarrierSnapshot.notModeledReasons[NOT_MODELED_REASONS.ADAPTER_RETURNED_NOT_MODELED],
  1
);
assert.equal(unsupportedCarrierSnapshot.visibleTotals.generated.MXN, undefined);

const reversedCancelledSnapshot = createRevenueSnapshot({
  items: [
    {
      status: ECONOMIC_EVENT_STATUSES.REVERSED,
      commissionAmount: -50,
      currency: 'MXN',
    },
    {
      status: ECONOMIC_EVENT_STATUSES.CANCELLED,
      commissionAmount: 200,
      currency: 'MXN',
    },
  ],
});

assert.equal(reversedCancelledSnapshot.buckets[REVENUE_BUCKETS.REVERSED].length, 1);
assert.equal(reversedCancelledSnapshot.buckets[REVENUE_BUCKETS.CANCELLED].length, 1);
assert.equal(reversedCancelledSnapshot.visibleTotals.reversed.MXN, -50);
assert.equal(reversedCancelledSnapshot.visibleTotals.cancelled.MXN, 200);
assert.equal(reversedCancelledSnapshot.visibleTotals.generated.MXN, undefined);

console.log('PASS revenue-snapshot-test');
