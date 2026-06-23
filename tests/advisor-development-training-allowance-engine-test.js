import assert from 'node:assert/strict';

import {
  TRAINING_ALLOWANCE_STATUS,
  SUPPORTED_STRATEGIES,
  calculateTrainingAllowanceCandidate,
} from '../compensation/advisor-development/advisor-development-training-allowance-engine.js';

function createTrainingAllowanceConcept(overrides = {}) {
  return {
    displayName: 'Training Allowance',
    targetPopulation: 'first_year_advisors',
    calculationFrequency: 'monthly',
    paymentFrequency: 'semiannual_with_monthly_advances',
    paymentTiming: 'month_after_semester_close',
    payoutTruth: false,
    payoutTruthRule: 'commission_statement_required',
    policyAccumulationRule: {
      vidaPlusGmmiCountsAs: 0.5,
    },
    calculationRules: {
      baseBonusStrategy: SUPPORTED_STRATEGIES.BASE_BONUS,
      excessBonusStrategy: SUPPORTED_STRATEGIES.EXCESS_BONUS,
      excessMultiplierRate: 0.35,
      paymentDeductionStrategy: SUPPORTED_STRATEGIES.PAYMENT_DEDUCTION,
    },
    table: [
      [1, 1, 9000, 3, 1, 1, 9000, 33000],
      [2, 1, 15000, 6, 2, 1, 15000, 56000],
      [3, 1, 21000, 9, 3, 1, 21000, 69000],
      [4, 1, 31000, 12, 4, 1, 31000, 102000],
      [5, 1, 39000, 15, 5, 1, 39000, 129000],
      [6, 1, 51000, 18, 6, 1, 51000, 167000],
      [7, 2, 13000, 3, 1, 1, 13000, 38000],
      [8, 2, 21000, 6, 2, 1, 21000, 64000],
      [9, 2, 32000, 9, 3, 1, 32000, 95000],
      [10, 2, 43000, 12, 4, 1, 43000, 130000],
      [11, 2, 55000, 15, 5, 1, 55000, 165000],
      [12, 2, 70000, 18, 6, 1, 70000, 210000],
    ].map(([
      advisorMonth,
      semester,
      accumulatedCommissionGoal,
      accumulatedPolicyGoal,
      minimumLifePolicyGoal,
      bonusPercentage,
      minimumAward,
      maximumAward,
    ]) => ({
      advisorMonth,
      semester,
      accumulatedCommissionGoal,
      accumulatedPolicyGoal,
      minimumLifePolicyGoal,
      bonusPercentage,
      minimumAward,
      maximumAward,
    })),
    ...overrides,
  };
}

function createRulePack(concept = createTrainingAllowanceConcept()) {
  return {
    concepts: {
      'training-allowance': concept,
    },
  };
}

function createFacts(overrides = {}) {
  return {
    advisorMonth: 1,
    accumulatedInitialCommission: 9000,
    accumulatedPolicies: 3,
    accumulatedLifePolicies: 1,
    priorPaidBonusesInCurrentSemester: 0,
    ...overrides,
  };
}

function testMissingRulePackReturnsNotModeled() {
  const result = calculateTrainingAllowanceCandidate({
    advisorFacts: createFacts(),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'missing_rule_pack_or_training_allowance_concept');
  assert.equal(result.calculation.payableCandidate, null);

  console.log('PASS missing rulePack returns not_modeled');
}

function testMissingConceptReturnsNotModeled() {
  const result = calculateTrainingAllowanceCandidate({
    rulePack: {
      concepts: {},
    },
    advisorFacts: createFacts(),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'missing_training_allowance_concept');

  console.log('PASS missing training-allowance concept returns not_modeled');
}

function testAdvisorMonthOutOfRangeReturnsNotModeled() {
  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: createFacts({
      advisorMonth: 13,
    }),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'advisor_month_not_modeled');

  console.log('PASS advisorMonth outside 1-12 returns not_modeled');
}

function testMissingAccumulatedInitialCommissionReturnsBlocked() {
  const facts = createFacts();

  delete facts.accumulatedInitialCommission;

  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: facts,
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.BLOCKED);
  assert.equal(result.reason, 'missing_accumulatedInitialCommission');

  console.log('PASS missing accumulatedInitialCommission returns blocked');
}

function testMissingAccumulatedPoliciesReturnsBlocked() {
  const facts = createFacts();

  delete facts.accumulatedPolicies;

  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: facts,
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.BLOCKED);
  assert.equal(result.reason, 'missing_accumulatedPolicies');

  console.log('PASS missing accumulatedPolicies returns blocked');
}

function testMissingAccumulatedLifePoliciesReturnsBlocked() {
  const facts = createFacts();

  delete facts.accumulatedLifePolicies;

  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: facts,
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.BLOCKED);
  assert.equal(result.reason, 'missing_accumulatedLifePolicies');

  console.log('PASS missing accumulatedLifePolicies returns blocked');
}

function testMonthOneEligibleAtExactGoals() {
  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: createFacts(),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.ELIGIBLE);
  assert.equal(result.advisorMonth, 1);
  assert.equal(result.semester, 1);
  assert.equal(result.eligibility.commissionGoalMet, true);
  assert.equal(result.eligibility.accumulatedPolicyGoalMet, true);
  assert.equal(result.eligibility.minimumLifePolicyGoalMet, true);
  assert.equal(result.calculation.baseBonusCalculated, 9000);
  assert.equal(result.calculation.baseBonusCapped, 9000);
  assert.equal(result.calculation.excessAmount, 0);
  assert.equal(result.calculation.excessBonusCalculated, 0);
  assert.equal(result.calculation.totalCalculatedCandidate, 9000);
  assert.equal(result.calculation.payableCandidate, 9000);
  assert.equal(result.payoutTruth, false);
  assert.deepEqual(result.evidenceRequirements, ['commission_statement_required']);

  console.log('PASS month 1 exact goals returns eligible candidate');
}

function testMonthOneBelowCommissionGoalReturnsIneligibleNullPayable() {
  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: createFacts({
      accumulatedInitialCommission: 8999,
    }),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.INELIGIBLE);
  assert.equal(result.reason, 'training_allowance_goals_not_met');
  assert.equal(result.eligibility.commissionGoalMet, false);
  assert.equal(result.eligibility.accumulatedPolicyGoalMet, true);
  assert.equal(result.eligibility.minimumLifePolicyGoalMet, true);
  assert.equal(result.calculation.payableCandidate, null);

  console.log('PASS ineligible returns null payableCandidate');
}

function testMonthSixAboveMaximumAwardCalculatesCapAndExcess() {
  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: createFacts({
      advisorMonth: 6,
      accumulatedInitialCommission: 200000,
      accumulatedPolicies: 18,
      accumulatedLifePolicies: 6,
    }),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.ELIGIBLE);
  assert.equal(result.semester, 1);
  assert.equal(result.calculation.baseBonusCalculated, 200000);
  assert.equal(result.calculation.baseBonusCapped, 167000);
  assert.equal(result.calculation.excessAmount, 33000);
  assert.equal(result.calculation.excessMultiplierRate, 0.35);
  assert.equal(result.calculation.excessBonusCalculated, 11550);
  assert.equal(result.calculation.totalCalculatedCandidate, 178550);
  assert.equal(result.calculation.payableCandidate, 178550);

  console.log('PASS month 6 cap and 35 percent excess are calculated');
}

function testPriorPaidBonusesReducePayableCandidate() {
  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: createFacts({
      advisorMonth: 2,
      accumulatedInitialCommission: 20000,
      accumulatedPolicies: 6,
      accumulatedLifePolicies: 2,
      priorPaidBonusesInCurrentSemester: 5000,
    }),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.ELIGIBLE);
  assert.equal(result.calculation.totalCalculatedCandidate, 20000);
  assert.equal(result.calculation.priorPaidBonusesInCurrentSemester, 5000);
  assert.equal(result.calculation.payableCandidate, 15000);

  console.log('PASS prior paid bonuses reduce payableCandidate');
}

function testPriorPaidHigherThanTotalCapsPayableAtZero() {
  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: createFacts({
      advisorMonth: 2,
      accumulatedInitialCommission: 20000,
      accumulatedPolicies: 6,
      accumulatedLifePolicies: 2,
      priorPaidBonusesInCurrentSemester: 25000,
    }),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.ELIGIBLE);
  assert.equal(result.calculation.totalCalculatedCandidate, 20000);
  assert.equal(result.calculation.payableCandidate, 0);

  console.log('PASS prior paid above total caps payableCandidate at zero');
}

function testMonthSevenUsesSemesterTwoRow() {
  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: createFacts({
      advisorMonth: 7,
      accumulatedInitialCommission: 13000,
      accumulatedPolicies: 3,
      accumulatedLifePolicies: 1,
    }),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.ELIGIBLE);
  assert.equal(result.semester, 2);
  assert.equal(result.tableRow.accumulatedCommissionGoal, 13000);
  assert.equal(result.calculation.totalCalculatedCandidate, 13000);

  console.log('PASS month 7 uses semester 2 row');
}

function testNonNumericCommissionReturnsUnknown() {
  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: createFacts({
      accumulatedInitialCommission: '9000',
    }),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.UNKNOWN);
  assert.equal(result.reason, 'invalid_accumulatedInitialCommission');
  assert.equal(result.calculation.payableCandidate, null);

  console.log('PASS non numeric commission returns unknown');
}

function testUnsupportedStrategyReturnsNotModeled() {
  const concept = createTrainingAllowanceConcept({
    calculationRules: {
      baseBonusStrategy: 'unsupported_strategy',
      excessBonusStrategy: SUPPORTED_STRATEGIES.EXCESS_BONUS,
      excessMultiplierRate: 0.35,
      paymentDeductionStrategy: SUPPORTED_STRATEGIES.PAYMENT_DEDUCTION,
    },
  });

  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(concept),
    advisorFacts: createFacts(),
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'unsupported_base_bonus_strategy');

  console.log('PASS unsupported strategy returns not_modeled');
}

function testMissingPriorPaidDefaultsToZeroWithWarning() {
  const facts = createFacts();

  delete facts.priorPaidBonusesInCurrentSemester;

  const result = calculateTrainingAllowanceCandidate({
    rulePack: createRulePack(),
    advisorFacts: facts,
  });

  assert.equal(result.status, TRAINING_ALLOWANCE_STATUS.ELIGIBLE);
  assert.equal(result.calculation.priorPaidBonusesInCurrentSemester, 0);
  assert(result.warnings.some((warning) => warning.code === 'prior_paid_bonuses_defaulted_to_zero'));

  console.log('PASS missing prior paid defaults to zero with warning');
}

testMissingRulePackReturnsNotModeled();
testMissingConceptReturnsNotModeled();
testAdvisorMonthOutOfRangeReturnsNotModeled();
testMissingAccumulatedInitialCommissionReturnsBlocked();
testMissingAccumulatedPoliciesReturnsBlocked();
testMissingAccumulatedLifePoliciesReturnsBlocked();
testMonthOneEligibleAtExactGoals();
testMonthOneBelowCommissionGoalReturnsIneligibleNullPayable();
testMonthSixAboveMaximumAwardCalculatesCapAndExcess();
testPriorPaidBonusesReducePayableCandidate();
testPriorPaidHigherThanTotalCapsPayableAtZero();
testMonthSevenUsesSemesterTwoRow();
testNonNumericCommissionReturnsUnknown();
testUnsupportedStrategyReturnsNotModeled();
testMissingPriorPaidDefaultsToZeroWithWarning();

console.log('PASS advisor-development-training-allowance-engine-test');
