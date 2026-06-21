import assert from 'node:assert/strict';

import {
  ADVISOR_ECONOMIC_OUTPUT_STATUSES,
  createAdvisorEconomicOutput,
} from '../compensation/partner-manager/advisor-economic-output.js';

import {
  DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  evaluateQualifiedAdvisorEconomicStatus,
} from '../compensation/partner-manager/qualified-advisor-economic-status.js';

import {
  TEAM_ECONOMIC_OUTPUT_STATUSES,
  createTeamEconomicOutput,
} from '../compensation/partner-manager/team-economic-output.js';

const visible = createAdvisorEconomicOutput({
  advisorId: 'ADV_1',
  initialCommissions: 12000,
  renewalCommissions: 3000,
  paidAppliedPolicyCount: 2,
  economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
});
const hidden = createAdvisorEconomicOutput({
  advisorId: 'ADV_2',
  initialCommissions: 50000,
  economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
  hiddenByScope: true,
});
const blocked = createAdvisorEconomicOutput({
  advisorId: 'ADV_3',
  economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED,
  reasons: ['blocked_by_missing_commission_evidence'],
});
const held = createAdvisorEconomicOutput({
  advisorId: 'ADV_4',
  initialCommissions: 20000,
  economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
  heldPrecontractCommission: true,
});
const qualified = evaluateQualifiedAdvisorEconomicStatus({
  advisorId: 'ADV_1',
  averageMonthlyInitialCommissions: 12000,
  threshold: DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  LIMRA: 0.8,
  IGC: 0.9,
  lifecycleStatus: 'connected_active',
  lifecycleGateAllowed: true,
  economicOutputStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
});

const team = createTeamEconomicOutput({
  partnerId: 'PARTNER_1',
  advisorOutputs: [visible, hidden, blocked, held],
  qualifiedAdvisorStatuses: [qualified],
});

assert.equal(team.status, TEAM_ECONOMIC_OUTPUT_STATUSES.TEAM_OUTPUT_PARTIAL);
assert.equal(team.teamTotalCommissions, 15000);
assert.equal(team.hiddenByScopeOutputs.length, 1);
assert.equal(team.blockedAdvisorOutputs.length, 2);
assert.ok(team.warnings.includes('hidden_by_scope_excluded_before_aggregation'));
assert.ok(team.warnings.includes('held_precontract_commission_not_summed_as_payable'));

const missing = createTeamEconomicOutput({ partnerId: 'PARTNER_1' });
assert.equal(missing.status, TEAM_ECONOMIC_OUTPUT_STATUSES.BLOCKED_BY_MISSING_ADVISOR_OUTPUTS);

console.log('PASS team-economic-output-test');
