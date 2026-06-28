import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  loadNewProfessional2026RulePack,
} from '../compensation/new-professional/new-professional-rule-pack-loader.js';

import {
  LIFE_RENEWAL_BONUS_STATUS,
  calculateNewProfessionalLifeRenewalBonusCandidate,
  resolveLifeRenewalBonusRate,
  resolveLifeRenewalGroupForPaymentMode,
  resolveLifeRenewalIgcTier,
} from '../compensation/new-professional/new-professional-life-renewal-bonus-engine.js';

const { rulePack } = loadNewProfessional2026RulePack();
const concept = rulePack.concepts['life-renewal-bonus'];

function baseFacts(overrides = {}) {
  return {
    semesterNumber: 1,
    semesterMonth: 3,
    paymentMode: 'semester_settlement',
    lifeInitialBonusCalculated: true,
    lifeInitialCurrentGroup: 1,
    lifeInitialEffectiveAdvanceGroup: null,
    accumulatedPaidRenewalPremium: 100000,
    igc: 95.75,
    priorPaidBonusesInSemester: 5000,
    ...overrides,
  };
}

function calculate(overrides = {}) {
  return calculateNewProfessionalLifeRenewalBonusCandidate({
    rulePack,
    advisorFacts: baseFacts(overrides),
  });
}

function testRequiresLifeInitialBonusCalculatedTrue() {
  const result = calculate({
    lifeInitialBonusCalculated: false,
  });

  assert.equal(result.status, LIFE_RENEWAL_BONUS_STATUS.INELIGIBLE_LIFE_INITIAL_BONUS_REQUIRED);
  assert.equal(result.candidateAmount, null);

  console.log('PASS requires lifeInitialBonusCalculated=true');
}

function testMissingInputsBlock() {
  const missingRenewalPremium = calculate({ accumulatedPaidRenewalPremium: null });
  const missingIgc = calculate({ igc: null });
  const missingPriorPaid = calculate({ priorPaidBonusesInSemester: null });
  const missingCurrentGroup = calculate({ lifeInitialCurrentGroup: null });
  const missingAdvanceGroup = calculate({
    paymentMode: 'monthly_advance',
    lifeInitialEffectiveAdvanceGroup: null,
  });

  assert.equal(missingRenewalPremium.status, LIFE_RENEWAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert(missingRenewalPremium.missingInputs.includes('accumulatedPaidRenewalPremium'));
  assert.equal(missingIgc.status, LIFE_RENEWAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert(missingIgc.missingInputs.includes('igc'));
  assert.equal(missingPriorPaid.status, LIFE_RENEWAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert(missingPriorPaid.missingInputs.includes('priorPaidBonusesInSemester'));
  assert.equal(missingCurrentGroup.status, LIFE_RENEWAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert(missingCurrentGroup.missingInputs.includes('lifeInitialCurrentGroup'));
  assert.equal(missingAdvanceGroup.status, LIFE_RENEWAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert(missingAdvanceGroup.missingInputs.includes('lifeInitialEffectiveAdvanceGroup'));

  console.log('PASS missing required renewal inputs block');
}

function testIgcBelow91ReturnsIneligible() {
  const result = calculate({
    igc: 90.99,
  });

  assert.equal(result.status, LIFE_RENEWAL_BONUS_STATUS.INELIGIBLE_IGC_GOAL_NOT_MET);
  assert.equal(result.candidateAmount, null);

  console.log('PASS IGC below 91 returns ineligible_igc_goal_not_met');
}

function testResolvesIgcTiers() {
  assert.equal(resolveLifeRenewalIgcTier({ concept, igc: 91 }).tierKey, '91');
  assert.equal(resolveLifeRenewalIgcTier({ concept, igc: 92.5 }).tierKey, '92.5');
  assert.equal(resolveLifeRenewalIgcTier({ concept, igc: 95 }).tierKey, '95');
  assert.equal(resolveLifeRenewalIgcTier({ concept, igc: 95.75 }).tierKey, '95.75');

  console.log('PASS resolves IGC tiers 91, 92.5, 95 and 95.75');
}

function testUsesGroupOneIgc9575Rate() {
  const rate = resolveLifeRenewalBonusRate({
    concept,
    group: 1,
    igc: 95.75,
  });

  assert.equal(rate.rate, 0.16);
  assert.equal(rate.tierKey, '95.75');

  console.log('PASS uses group 1 / IGC 95.75 rate 16%');
}

function testUsesGroupSixteenIgc91Rate() {
  const rate = resolveLifeRenewalBonusRate({
    concept,
    group: 16,
    igc: 91,
  });

  assert.equal(rate.rate, 0.01);
  assert.equal(rate.tierKey, '91');

  console.log('PASS uses group 16 / IGC 91 rate 1%');
}

function testCalculatesRenewalPremiumTimesRateMinusPriorPaid() {
  const result = calculate({
    accumulatedPaidRenewalPremium: 100000,
    igc: 95.75,
    priorPaidBonusesInSemester: 5000,
  });

  assert.equal(result.status, LIFE_RENEWAL_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.calculation.candidateRate, 0.16);
  assert.equal(result.calculation.calculatedRenewalBonusCandidate, 16000);
  assert.equal(result.calculation.payableCandidate, 11000);
  assert.equal(result.candidateAmount, 11000);

  console.log('PASS calculates accumulatedPaidRenewalPremium * rate - priorPaidBonusesInSemester');
}

function testSemesterSettlementUsesLifeInitialCurrentGroup() {
  const group = resolveLifeRenewalGroupForPaymentMode({
    advisorFacts: baseFacts({
      paymentMode: 'semester_settlement',
      lifeInitialCurrentGroup: 4,
      lifeInitialEffectiveAdvanceGroup: 10,
    }),
  });

  assert.equal(group.group, 4);
  assert.equal(group.source, 'lifeInitialCurrentGroup');

  console.log('PASS semester_settlement uses lifeInitialCurrentGroup');
}

function testMonthlyAdvanceUsesLifeInitialEffectiveAdvanceGroup() {
  const group = resolveLifeRenewalGroupForPaymentMode({
    advisorFacts: baseFacts({
      paymentMode: 'monthly_advance',
      lifeInitialCurrentGroup: 4,
      lifeInitialEffectiveAdvanceGroup: 10,
    }),
  });
  const result = calculate({
    paymentMode: 'monthly_advance',
    lifeInitialEffectiveAdvanceGroup: 10,
  });

  assert.equal(group.group, 10);
  assert.equal(group.source, 'lifeInitialEffectiveAdvanceGroup');
  assert.equal(result.calculation.group, 10);

  console.log('PASS monthly_advance uses lifeInitialEffectiveAdvanceGroup');
}

function testPayoutTruthAlwaysFalse() {
  const results = [
    calculate(),
    calculate({ lifeInitialBonusCalculated: false }),
    calculate({ igc: 90 }),
  ];

  for (const result of results) {
    assert.equal(result.payoutTruth, false);
    assert.equal(result.payoutTruthRule, 'commission_statement_required');
    assert.deepEqual(result.evidenceRequirements, ['commission_statement_required']);
  }

  console.log('PASS payoutTruth always false');
}

function testDoesNotImportPartnerOrAdvisorDevelopment() {
  const source = readFileSync(
    'compensation/new-professional/new-professional-life-renewal-bonus-engine.js',
    'utf8',
  );

  assert.equal(source.includes('partner-manager'), false);
  assert.equal(source.includes('advisor-development'), false);

  console.log('PASS engine does not import Partner or Advisor Development');
}

function testRenewalOnlyCandidateDoesNotCombineWithLifeInitial() {
  const result = calculate({
    accumulatedPaidRenewalPremium: 100000,
    igc: 95.75,
    priorPaidBonusesInSemester: 0,
  });

  assert.equal(result.calculation.calculatedRenewalBonusCandidate, 16000);
  assert.equal(result.calculation.payableCandidate, 16000);
  assert.equal(result.explainability.renewalOnlyCandidate, true);
  assert.equal(result.explainability.combinedVidaPaymentDeferredToFutureOrchestrator, true);
  assert.equal(Object.hasOwn(result.calculation, 'lifeInitialCandidateAmount'), false);

  console.log('PASS renewal-only candidate does not combine with Life Initial');
}

testRequiresLifeInitialBonusCalculatedTrue();
testMissingInputsBlock();
testIgcBelow91ReturnsIneligible();
testResolvesIgcTiers();
testUsesGroupOneIgc9575Rate();
testUsesGroupSixteenIgc91Rate();
testCalculatesRenewalPremiumTimesRateMinusPriorPaid();
testSemesterSettlementUsesLifeInitialCurrentGroup();
testMonthlyAdvanceUsesLifeInitialEffectiveAdvanceGroup();
testPayoutTruthAlwaysFalse();
testDoesNotImportPartnerOrAdvisorDevelopment();
testRenewalOnlyCandidateDoesNotCombineWithLifeInitial();

console.log('PASS new-professional-life-renewal-bonus-engine-test');
