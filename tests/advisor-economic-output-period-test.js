import assert from 'node:assert/strict';

import {
  ADVISOR_ECONOMIC_OUTPUT_STATUSES,
  createAdvisorEconomicOutput,
} from '../compensation/partner-manager/advisor-economic-output.js';

import {
  ADVISOR_ECONOMIC_PERIOD_REASONS,
  ADVISOR_ECONOMIC_PERIOD_STATES,
  ADVISOR_ECONOMIC_PERIOD_TYPES,
  createAdvisorEconomicOutputPeriod,
} from '../compensation/partner-manager/advisor-economic-output-period.js';

const initial = createAdvisorEconomicOutput({
  advisorId: 'ADV_1',
  initialCommissions: 12000,
  renewalCommissions: 6000,
  economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
});

const period = createAdvisorEconomicOutputPeriod({
  periodType: ADVISOR_ECONOMIC_PERIOD_TYPES.MONTHLY,
  periodStart: '2026-01-01',
  periodEnd: '2026-01-31',
  advisorOutputs: [initial],
});

assert.equal(period.state, ADVISOR_ECONOMIC_PERIOD_STATES.READY);
assert.equal(period.averageMonthlyInitialCommissions, 12000);
assert.equal(period.renewalCommissionsIncludedInInitialAverage, false);

const missingInitial = createAdvisorEconomicOutputPeriod({
  periodType: ADVISOR_ECONOMIC_PERIOD_TYPES.MONTHLY,
  periodStart: '2026-01-01',
  periodEnd: '2026-01-31',
  advisorOutputs: [
    createAdvisorEconomicOutput({
      advisorId: 'ADV_2',
      renewalCommissions: 9000,
      economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
    }),
  ],
});
assert.equal(missingInitial.state, ADVISOR_ECONOMIC_PERIOD_STATES.BLOCKED);
assert.ok(missingInitial.blockedReasons.includes(ADVISOR_ECONOMIC_PERIOD_REASONS.MISSING_INITIAL_COMMISSIONS));
assert.equal(missingInitial.averageMonthlyInitialCommissions, null);

const invalidPeriod = createAdvisorEconomicOutputPeriod({
  periodType: ADVISOR_ECONOMIC_PERIOD_TYPES.CUSTOM,
  periodStart: '2026-02-01',
  periodEnd: '2026-01-01',
  advisorOutputs: [initial],
});
assert.ok(invalidPeriod.blockedReasons.includes(ADVISOR_ECONOMIC_PERIOD_REASONS.INVALID_PERIOD));

console.log('PASS advisor-economic-output-period-test');
