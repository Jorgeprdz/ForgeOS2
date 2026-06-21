import assert from 'node:assert/strict';

import {
  createRevenueScopeGate,
} from '../revenue/revenue-scope-gate.js';

import {
  REVENUE_BUCKETS,
} from '../revenue/revenue-value.js';

const gate = createRevenueScopeGate({
  authorizedAdvisorIds: ['ADV_1'],
});

const allowed = gate.apply({
  advisorId: 'ADV_1',
  amount: 100,
});

assert.equal(allowed.visible, true);

const denied = gate.apply({
  advisorId: 'ADV_2',
  amount: 100,
  currency: 'MXN',
});

assert.equal(denied.visible, false);
assert.equal(denied.revenueValue.bucket, REVENUE_BUCKETS.HIDDEN_BY_SCOPE);
assert.equal(denied.revenueValue.amount, null);
assert.equal(denied.revenueValue.reason, 'advisor_out_of_scope');

const policyGate = createRevenueScopeGate({
  authorizedPolicyIds: ['POL-1'],
});

const policyDenied = policyGate.apply({
  policyNumber: 'POL-2',
});

assert.equal(policyDenied.visible, false);
assert.equal(policyDenied.revenueValue.bucket, REVENUE_BUCKETS.HIDDEN_BY_SCOPE);

console.log('PASS revenue-scope-gate-test');
