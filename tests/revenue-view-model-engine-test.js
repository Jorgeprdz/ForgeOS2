import assert from 'node:assert/strict';

import {
  createRevenueViewModel,
} from '../revenue/revenue-view-model-engine.js';

import {
  BLOCKED_REASONS,
  NOT_MODELED_REASONS,
  REVENUE_BUCKETS,
  UNKNOWN_REASONS,
} from '../revenue/revenue-value.js';

const viewModel = createRevenueViewModel({
  items: [
    {
      bucket: REVENUE_BUCKETS.PAID_CONFIRMED,
      amount: 100,
      currency: 'MXN',
    },
    {
      bucket: REVENUE_BUCKETS.BLOCKED,
      reason: BLOCKED_REASONS.MISSING_STATEMENT,
    },
    {
      bucket: REVENUE_BUCKETS.NOT_MODELED,
      reason: NOT_MODELED_REASONS.UNSUPPORTED_PRODUCT,
    },
    {
      bucket: REVENUE_BUCKETS.UNKNOWN,
      reason: UNKNOWN_REASONS.FORECAST_ONLY,
    },
  ],
});

assert.equal(viewModel.visibleTotals.generated.MXN, 100);
assert.equal(viewModel.excludedBuckets.blocked, 1);
assert.equal(viewModel.excludedBuckets.not_modeled, 1);
assert.equal(viewModel.excludedBuckets.unknown, 1);
assert.equal(viewModel.blockedReasons[0].reason, BLOCKED_REASONS.MISSING_STATEMENT);
assert.equal(viewModel.notModeledReasons[0].reason, NOT_MODELED_REASONS.UNSUPPORTED_PRODUCT);
assert.equal(viewModel.unknownReasons[0].reason, UNKNOWN_REASONS.FORECAST_ONLY);
assert.equal(viewModel.confidence.paidConfirmedRequiresCommissionStatement, true);
assert.equal(viewModel.confidence.managerScopeAppliedBeforeAggregation, true);

console.log('PASS revenue-view-model-engine-test');
