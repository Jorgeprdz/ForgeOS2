import assert from 'node:assert/strict';

import {
  ADVISOR_ECONOMIC_OUTPUT_REASONS,
  ADVISOR_ECONOMIC_OUTPUT_STATUSES,
  createAdvisorEconomicOutput,
} from '../compensation/partner-manager/advisor-economic-output.js';

const rawActivity = createAdvisorEconomicOutput({
  advisorId: 'ADV_1',
  rawActivityOnly: true,
  sourceType: 'activity',
});
assert.equal(rawActivity.economicStatus, ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED);
assert.ok(rawActivity.reasons.includes(ADVISOR_ECONOMIC_OUTPUT_REASONS.RAW_ACTIVITY_ONLY));

const policyCountOnly = createAdvisorEconomicOutput({
  advisorId: 'ADV_1',
  policyCountOnly: true,
  paidAppliedPolicyCount: 4,
});
assert.equal(policyCountOnly.economicStatus, ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED);
assert.equal(policyCountOnly.policyCountCreatesCommissionOutput, false);

const issuedWithoutPayment = createAdvisorEconomicOutput({
  advisorId: 'ADV_1',
  policyIssued: true,
  paymentApplied: false,
});
assert.equal(issuedWithoutPayment.economicStatus, ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED);
assert.ok(issuedWithoutPayment.reasons.includes(ADVISOR_ECONOMIC_OUTPUT_REASONS.ISSUED_WITHOUT_PAYMENT));

const separated = createAdvisorEconomicOutput({
  advisorId: 'ADV_1',
  initialCommissions: 10000,
  renewalCommissions: 2500,
  economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
});
assert.equal(separated.initialCommissions, 10000);
assert.equal(separated.renewalCommissions, 2500);
assert.equal(separated.totalCommissions, 12500);

const unknown = createAdvisorEconomicOutput({
  advisorId: 'ADV_1',
  economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.UNKNOWN,
});
assert.equal(unknown.initialCommissions, null);
assert.equal(unknown.unknownIsZero, false);

const candidate = createAdvisorEconomicOutput({
  advisorId: 'ADV_1',
  initialCommissions: 10000,
  economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.CANDIDATE,
});
assert.equal(candidate.eligibleForPartnerCalculation, false);

const payoutWithoutEvidence = createAdvisorEconomicOutput({
  advisorId: 'ADV_1',
  initialCommissions: 10000,
  economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAYOUT_CONFIRMED,
  payoutEvidenceConfirmed: false,
});
assert.equal(payoutWithoutEvidence.economicStatus, ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED);
assert.ok(payoutWithoutEvidence.reasons.includes(ADVISOR_ECONOMIC_OUTPUT_REASONS.MISSING_PAYOUT_EVIDENCE));

console.log('PASS advisor-economic-output-test');
