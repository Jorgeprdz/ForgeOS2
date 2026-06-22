import assert from 'node:assert/strict';

import {
  PARTNER_COMPENSATION_CONCEPT_KEYS,
  PARTNER_INPUT_READINESS,
  evaluatePartnerCompensationInput,
} from '../compensation/partner-manager/partner-compensation-input-gate.js';

import {
  DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  evaluateQualifiedAdvisorEconomicStatus,
} from '../compensation/partner-manager/qualified-advisor-economic-status.js';

import {
  ADVISOR_ECONOMIC_OUTPUT_STATUSES,
  createAdvisorEconomicOutput,
} from '../compensation/partner-manager/advisor-economic-output.js';

const qualifiedStatus = evaluateQualifiedAdvisorEconomicStatus({
  advisorId: 'ADV_1',
  averageMonthlyInitialCommissions: 12000,
  threshold: DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD,
  LIMRA: 0.8,
  IGC: 0.9,
  lifeIndividualShare: 0.6,
  lifecycleStatus: 'connected_active',
  lifecycleGateAllowed: true,
  economicOutputStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
});

const blockedProductivity = evaluatePartnerCompensationInput({
  conceptKey: PARTNER_COMPENSATION_CONCEPT_KEYS.PRODUCTIVITY_BASE,
});
assert.equal(blockedProductivity.allowed, false);
assert.ok(blockedProductivity.blockedReasons.includes('missing_qualified_advisor_economic_status'));

const readyProductivity = evaluatePartnerCompensationInput({
  conceptKey: PARTNER_COMPENSATION_CONCEPT_KEYS.PRODUCTIVITY_BASE,
  qualifiedAdvisorEconomicStatus: qualifiedStatus,
  averageMonthlyInitialCommissions: 12000,
  hasPaidAppliedEconomicEvidence: true,
  lifecycleOfficial: true,
});
assert.equal(readyProductivity.allowed, true);

const rawProduction = evaluatePartnerCompensationInput({
  conceptKey: PARTNER_COMPENSATION_CONCEPT_KEYS.PRODUCTION_BONUS,
  nonQualifiedAdvisorEconomicOutput: createAdvisorEconomicOutput({
    advisorId: 'ADV_2',
    economicStatus: ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
    totalCommissions: 1000,
  }),
  rawActivityOnly: true,
});
assert.equal(rawProduction.allowed, false);
assert.ok(rawProduction.blockedReasons.includes('raw_activity_only'));

const fixedSupport = evaluatePartnerCompensationInput({
  conceptKey: PARTNER_COMPENSATION_CONCEPT_KEYS.FIXED_SUPPORT,
  TAWinnerEvidence: true,
});
assert.equal(fixedSupport.allowed, false);
assert.ok(fixedSupport.blockedReasons.includes('missing_accumulated_commission_evidence'));

const transition = evaluatePartnerCompensationInput({
  conceptKey: PARTNER_COMPENSATION_CONCEPT_KEYS.TRANSITION_BONUS,
  directKeyAttribution: true,
});
assert.equal(transition.allowed, false);
assert.ok(transition.blockedReasons.includes('blocked_by_missing_commission_evidence'));

const partialConnection = evaluatePartnerCompensationInput({
  conceptKey: PARTNER_COMPENSATION_CONCEPT_KEYS.CONNECTION_BONUS,
});
assert.equal(partialConnection.allowed, false);
assert.equal(partialConnection.inputReadiness, PARTNER_INPUT_READINESS.PARTIAL_CONTRACT_ALLOWED);

const unknown = evaluatePartnerCompensationInput({
  conceptKey: PARTNER_COMPENSATION_CONCEPT_KEYS.UNKNOWN,
});
assert.equal(unknown.allowed, false);
assert.ok(unknown.blockedReasons.includes('unknown_concept'));

console.log('PASS partner-compensation-input-gate-test');
