import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  loadNewProfessional2026RulePack,
} from '../compensation/new-professional/new-professional-rule-pack-loader.js';

import {
  GMMI_RENEWAL_PREMIUM_BONUS_STATUS,
  calculateNewProfessionalGmmiRenewalPremiumBonusCandidate,
  resolveGmmiRenewalPremiumBonusGroup,
  resolveGmmiRenewalPremiumGoalForQuarterMonth,
} from '../compensation/new-professional/new-professional-gmmi-renewal-premium-bonus-engine.js';

const { rulePack } = loadNewProfessional2026RulePack();
const concept = rulePack.concepts['gmmi-renewal-premium-bonus'];

function baseFacts(overrides = {}) {
  return {
    quarterNumber: 1,
    quarterMonth: 1,
    paymentMode: 'quarter_settlement',
    accumulatedEligiblePaidGmmiRenewalNetPremium: 1775000,
    accumulatedGmmiInitialPoliciesPaid: 5,
    priorPaidBonusesInQuarter: 10000,
    gmmiInitialPoliciesBasisConfirmed: true,
    productionResetScope: 'current_quarter',
    sourceEvidence: 'commission_statement_required',
    ...overrides,
  };
}

function calculate(overrides = {}) {
  return calculateNewProfessionalGmmiRenewalPremiumBonusCandidate({
    rulePack,
    advisorFacts: baseFacts(overrides),
  });
}

function testResolvesExactGroupThreshold() {
  const result = resolveGmmiRenewalPremiumBonusGroup({
    concept,
    quarterMonth: 1,
    accumulatedEligiblePaidGmmiRenewalNetPremium: 1775000,
    accumulatedGmmiInitialPoliciesPaid: 5,
  });

  assert.equal(result.group, 1);
  assert.equal(result.premiumGoal, 1775000);
  assert.equal(result.policyGoal, 5);

  console.log('PASS resolves exact group threshold where premium and policies both meet');
}

function testSelectsBetterGroupCorrectly() {
  const result = resolveGmmiRenewalPremiumBonusGroup({
    concept,
    quarterMonth: 2,
    accumulatedEligiblePaidGmmiRenewalNetPremium: 3560000,
    accumulatedGmmiInitialPoliciesPaid: 5,
  });

  assert.equal(result.group, 1);
  assert.equal(result.bonusRate, 0.03);

  console.log('PASS selects better group correctly');
}

function testGroupOnePremiumWithFourPoliciesFallsToGroupTwo() {
  const result = calculate({
    accumulatedEligiblePaidGmmiRenewalNetPremium: 1775000,
    accumulatedGmmiInitialPoliciesPaid: 4,
    priorPaidBonusesInQuarter: 0,
  });

  assert.equal(result.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.calculation.group, 2);
  assert.equal(result.calculation.policyGoalUsed, 4);
  assert.equal(result.calculation.candidateRate, 0.0265);

  console.log('PASS premium for group 1 but only 4 policies falls to group 2');
}

function testPremiumMeetsButPoliciesBelowAllGroupsReturnsIneligible() {
  const result = calculate({
    accumulatedEligiblePaidGmmiRenewalNetPremium: 1775000,
    accumulatedGmmiInitialPoliciesPaid: 2,
  });

  assert.equal(result.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.INELIGIBLE_GMMI_RENEWAL_GOALS_NOT_MET);
  assert.equal(result.reason, 'policy_goal_not_met');
  assert.equal(result.candidateAmount, null);

  console.log('PASS premium meets but policies below all groups returns ineligible');
}

function testPoliciesMeetButPremiumBelowAllGroupsReturnsIneligible() {
  const result = calculate({
    accumulatedEligiblePaidGmmiRenewalNetPremium: 379999,
    accumulatedGmmiInitialPoliciesPaid: 5,
  });

  assert.equal(result.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.INELIGIBLE_GMMI_RENEWAL_GOALS_NOT_MET);
  assert.equal(result.reason, 'premium_goal_not_met');

  console.log('PASS policies meet but premium below all groups returns ineligible');
}

function testPremiumBelowAllGroupsReturnsIneligible() {
  const result = calculate({
    accumulatedEligiblePaidGmmiRenewalNetPremium: 379999,
    accumulatedGmmiInitialPoliciesPaid: 2,
  });

  assert.equal(result.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.INELIGIBLE_GMMI_RENEWAL_GOALS_NOT_MET);
  assert.equal(result.reason, 'premium_and_policy_goals_not_met');

  console.log('PASS premium below all groups returns ineligible_gmmi_renewal_goals_not_met');
}

function testQuarterMonthPremiumGoalResolution() {
  const row = concept.gmmiRenewalPremiumQuarterlyBonusTable.groups['1'];

  assert.equal(resolveGmmiRenewalPremiumGoalForQuarterMonth({ row, quarterMonth: 1 }), 1775000);
  assert.equal(resolveGmmiRenewalPremiumGoalForQuarterMonth({ row, quarterMonth: 2 }), 3560000);
  assert.equal(resolveGmmiRenewalPremiumGoalForQuarterMonth({ row, quarterMonth: 3 }), 4440000);

  console.log('PASS month 1, 2 and 3 premium goals resolve correctly');
}

function testUsesGroupOneRate() {
  const result = calculate();

  assert.equal(result.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.calculation.group, 1);
  assert.equal(result.calculation.candidateRate, 0.03);

  console.log('PASS uses group 1 rate 3.00%');
}

function testUsesGroupFiveRate() {
  const result = calculate({
    accumulatedEligiblePaidGmmiRenewalNetPremium: 380000,
    accumulatedGmmiInitialPoliciesPaid: 3,
    priorPaidBonusesInQuarter: 0,
  });

  assert.equal(result.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.calculation.group, 5);
  assert.equal(result.calculation.candidateRate, 0.0125);

  console.log('PASS uses group 5 rate 1.25%');
}

function testCalculatesRenewalPremiumTimesRateMinusPriorPaid() {
  const result = calculate({
    accumulatedEligiblePaidGmmiRenewalNetPremium: 1775000,
    priorPaidBonusesInQuarter: 10000,
  });

  assert.equal(result.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.calculation.calculatedGmmiRenewalBonusCandidate, 53250);
  assert.equal(result.calculation.payableCandidate, 43250);
  assert.equal(result.candidateAmount, 43250);

  console.log('PASS calculates accumulated renewal premium * rate - prior paid');
}

function testMissingInputsBlock() {
  const missingPriorPaid = calculate({ priorPaidBonusesInQuarter: null });
  const missingPremium = calculate({ accumulatedEligiblePaidGmmiRenewalNetPremium: null });
  const missingPolicies = calculate({ accumulatedGmmiInitialPoliciesPaid: null });

  assert.equal(missingPriorPaid.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(missingPriorPaid.reason, 'prior_paid_bonuses_in_quarter_missing');
  assert.equal(missingPremium.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(missingPremium.reason, 'accumulated_eligible_paid_gmmi_renewal_net_premium_missing');
  assert.equal(missingPolicies.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(missingPolicies.reason, 'accumulated_gmmi_initial_policies_paid_missing');

  console.log('PASS missing prior paid, renewal premium, and policies block');
}

function testEvidenceAndBasisGuardrailsBlock() {
  const policyBasis = calculate({ gmmiInitialPoliciesBasisConfirmed: false });
  const resetScope = calculate({ productionResetScope: 'annual' });
  const missingEvidence = calculate({ sourceEvidence: null });
  const invalidEvidence = calculate({ sourceEvidence: 'spreadsheet_projection' });

  assert.equal(policyBasis.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(policyBasis.reason, 'gmmi_initial_policies_basis_not_confirmed');
  assert.equal(resetScope.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(resetScope.reason, 'production_reset_scope_invalid');
  assert.equal(missingEvidence.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(missingEvidence.reason, 'source_evidence_missing');
  assert.equal(invalidEvidence.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(invalidEvidence.reason, 'source_evidence_invalid');

  console.log('PASS basis, reset scope, and source evidence guardrails block');
}

function testInvalidQuarterAndPaymentModeBlock() {
  const invalidQuarterMonth = calculate({ quarterMonth: 4 });
  const invalidQuarterNumber = calculate({ quarterNumber: 5 });
  const invalidPaymentMode = calculate({ paymentMode: 'annual_settlement' });

  assert.equal(invalidQuarterMonth.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(invalidQuarterMonth.reason, 'invalid_quarter_month');
  assert.equal(invalidQuarterNumber.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(invalidQuarterNumber.reason, 'invalid_quarter_number');
  assert.equal(invalidPaymentMode.status, GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(invalidPaymentMode.reason, 'invalid_payment_mode');

  console.log('PASS invalid quarterMonth, quarterNumber, and paymentMode block');
}

function testPayoutTruthAlwaysFalse() {
  const results = [
    calculate(),
    calculate({ accumulatedEligiblePaidGmmiRenewalNetPremium: 1 }),
    calculate({ sourceEvidence: null }),
  ];

  for (const result of results) {
    assert.equal(result.payoutTruth, false);
    assert.equal(result.payoutTruthRule, 'commission_statement_required');
    assert.deepEqual(result.evidenceRequirements, ['commission_statement_required']);
    assert.equal(result.explainability.payoutTruth, false);
  }

  console.log('PASS payoutTruth always false');
}

function testEngineDoesNotImportOtherCompensationDomains() {
  const source = readFileSync(
    'compensation/new-professional/new-professional-gmmi-renewal-premium-bonus-engine.js',
    'utf8',
  );

  assert.equal(source.includes('partner-manager'), false);
  assert.equal(source.includes('advisor-development'), false);

  console.log('PASS engine does not import Partner or Advisor Development');
}

function testEngineDoesNotImplementOtherGmmiConcepts() {
  const source = readFileSync(
    'compensation/new-professional/new-professional-gmmi-renewal-premium-bonus-engine.js',
    'utf8',
  );

  assert.equal(source.includes('gmmiInitialPremiumQuarterlyBonusTable'), false);
  assert.equal(source.includes('gmmiInitialPremiumGrowthAnnualBonusTable'), false);
  assert.equal(source.includes('loss-ratio'), false);
  assert.equal(source.includes('siniestralidad'), false);

  console.log('PASS engine does not implement GMMI initial quarterly, initial annual growth, or siniestralidad');
}

function testPackageJsonIsNotChanged() {
  const packageJson = readFileSync('package.json', 'utf8');

  assert.equal(packageJson.includes('new-professional-gmmi-renewal-premium-bonus-engine'), false);

  console.log('PASS package.json is not changed');
}

testResolvesExactGroupThreshold();
testSelectsBetterGroupCorrectly();
testGroupOnePremiumWithFourPoliciesFallsToGroupTwo();
testPremiumMeetsButPoliciesBelowAllGroupsReturnsIneligible();
testPoliciesMeetButPremiumBelowAllGroupsReturnsIneligible();
testPremiumBelowAllGroupsReturnsIneligible();
testQuarterMonthPremiumGoalResolution();
testUsesGroupOneRate();
testUsesGroupFiveRate();
testCalculatesRenewalPremiumTimesRateMinusPriorPaid();
testMissingInputsBlock();
testEvidenceAndBasisGuardrailsBlock();
testInvalidQuarterAndPaymentModeBlock();
testPayoutTruthAlwaysFalse();
testEngineDoesNotImportOtherCompensationDomains();
testEngineDoesNotImplementOtherGmmiConcepts();
testPackageJsonIsNotChanged();

console.log('PASS new-professional-gmmi-renewal-premium-bonus-engine-test');
