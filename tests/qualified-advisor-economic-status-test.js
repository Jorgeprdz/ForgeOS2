import assert from 'node:assert/strict';

import {
  ADVISOR_ECONOMIC_OUTPUT_STATUSES,
} from '../compensation/partner-manager/advisor-economic-output.js';

import {
  DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  QUALIFIED_ADVISOR_ECONOMIC_STATUSES,
  evaluateQualifiedAdvisorEconomicStatus,
} from '../compensation/partner-manager/qualified-advisor-economic-status.js';

const qualified = evaluateQualifiedAdvisorEconomicStatus({
  advisorId: 'ADV_1',
  averageMonthlyInitialCommissions: 9500,
  threshold: DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  LIMRA: 0.8,
  IGC: 0.9,
  lifecycleStatus: 'connected_active',
  lifecycleGateAllowed: true,
  economicOutputStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
});
assert.equal(qualified.status, QUALIFIED_ADVISOR_ECONOMIC_STATUSES.QUALIFIED_CONFIRMED);

const missingThreshold = evaluateQualifiedAdvisorEconomicStatus({
  averageMonthlyInitialCommissions: 9500,
  LIMRA: 0.8,
  IGC: 0.9,
  lifecycleStatus: 'connected_active',
  lifecycleGateAllowed: true,
});
assert.equal(missingThreshold.status, QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_THRESHOLD);

const missingLimra = evaluateQualifiedAdvisorEconomicStatus({
  averageMonthlyInitialCommissions: 9500,
  threshold: DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  IGC: 0.9,
  lifecycleStatus: 'connected_active',
  lifecycleGateAllowed: true,
});
assert.equal(missingLimra.status, QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_LIMRA);

const missingIgc = evaluateQualifiedAdvisorEconomicStatus({
  averageMonthlyInitialCommissions: 9500,
  threshold: DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  LIMRA: 0.8,
  lifecycleStatus: 'connected_active',
  lifecycleGateAllowed: true,
});
assert.equal(missingIgc.status, QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_IGC);

const precontract = evaluateQualifiedAdvisorEconomicStatus({
  averageMonthlyInitialCommissions: 9500,
  threshold: DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  LIMRA: 0.8,
  IGC: 0.9,
  lifecycleStatus: 'precontract',
  lifecycleGateAllowed: true,
});
assert.equal(precontract.status, QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_PRECONTRACT_STATUS);

const candidate = evaluateQualifiedAdvisorEconomicStatus({
  averageMonthlyInitialCommissions: 9500,
  threshold: DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  LIMRA: 0.8,
  IGC: 0.9,
  lifecycleStatus: 'connected_active',
  lifecycleGateAllowed: true,
  economicOutputStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.CANDIDATE,
});
assert.equal(candidate.status, QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_COMMISSION_EVIDENCE);

console.log('PASS qualified-advisor-economic-status-test');
