import assert from 'node:assert/strict';

import {
  RELATIONSHIP_BONUS_READINESS_STATUS,
} from '../compensation/advisor-development/advisor-relationship-bonus-readiness-gate.js';

import {
  DEVELOPMENT_BONUS_STATUS,
  calculateAdvisorDevelopmentDevelopmentBonusCandidate,
  matchDevelopmentBonusTier,
} from '../compensation/advisor-development/advisor-development-development-bonus-engine.js';

function createDevelopmentBonusConcept(overrides = {}) {
  return {
    payoutTruth: false,
    supportedDeveloperShares: [1, 0.5],
    policyCountRule: {
      vidaPlusGmmiCountsAs: 0.5,
    },
    monthlyBonus: {
      advisorMonthRange: {
        from: 4,
        to: 15,
      },
      tiers: [
        {
          minimumPolicies: 2,
          amount: 5000,
        },
        {
          minimumPolicies: 3,
          amount: 9000,
        },
        {
          minimumPolicies: 4,
          amount: 15000,
          appliesToCountAndAbove: true,
        },
      ],
    },
    month12AdditionalBonuses: {
      bonus20000: {
        advisorMonth: 12,
        amount: 20000,
        requiredAccumulatedInitialPoliciesByMonth12: 36,
        requiresTrainingAllowanceMonth12Won: true,
      },
      additionalBonus30000: {
        advisorMonth: 12,
        amount: 30000,
        requiredAccumulatedInitialPoliciesByMonth12: 48,
        requiresTrainingAllowanceMonth12Won: true,
        requiresAtLeastOnePaidPolicyEachMonth: {
          from: 1,
          to: 12,
        },
        maxZeroPolicyMonthsAllowed: 1,
        zeroPolicyMonthsThatLoseAdditional: [10, 11, 12],
      },
    },
    ...overrides,
  };
}

function createRulePack(concept = createDevelopmentBonusConcept()) {
  return {
    concepts: {
      'development-bonus': concept,
    },
  };
}

function createReadyReadiness(validPolicyCount = 4, developerShare = 1) {
  return {
    status: RELATIONSHIP_BONUS_READINESS_STATUS.READY_FOR_CANDIDATE_CALCULATION,
    reason: null,
    readiness: {
      relationshipConfirmed: true,
      validPolicyCountAvailable: typeof validPolicyCount === 'number',
      validPolicyCount,
      shareAvailable: typeof developerShare === 'number',
      developerShare,
      readyForCandidateCalculation: true,
    },
    payoutTruth: false,
    warnings: [
      {
        code: 'test_development_readiness_warning',
      },
    ],
  };
}

function createReadinessStatus(status) {
  return {
    status,
    reason: `${status}_reason`,
    readiness: {
      relationshipConfirmed: false,
      validPolicyCountAvailable: false,
      validPolicyCount: null,
      shareAvailable: false,
      developerShare: null,
      readyForCandidateCalculation: false,
    },
    payoutTruth: false,
    warnings: [],
  };
}

function paidPolicyCounts({
  zeroMonths = [],
} = {}) {
  return Array.from({ length: 12 }, (_, index) => (
    zeroMonths.includes(index + 1) ? 0 : 1
  ));
}

function calculate(overrides = {}) {
  return calculateAdvisorDevelopmentDevelopmentBonusCandidate({
    rulePack: createRulePack(),
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
    advisorFacts: {
      advisorMonth: 4,
    },
    ...overrides,
  });
}

function assertPayoutTruthFalse(result) {
  assert.equal(result.conceptKey, 'development-bonus');
  assert.equal(result.payoutTruth, false);
  assert.equal(result.payoutTruthRule, 'commission_statement_required');
  assert.deepEqual(result.evidenceRequirements, ['commission_statement_required']);
}

function testMissingRulePackReturnsNotModeled() {
  const result = calculateAdvisorDevelopmentDevelopmentBonusCandidate({
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
    advisorFacts: {
      advisorMonth: 4,
    },
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'missing_rule_pack');
  assert.equal(result.candidateAmount, null);
  assert.deepEqual(result.missingInputs, ['rulePack']);

  console.log('PASS missing rulePack returns not_modeled');
}

function testMissingDevelopmentBonusConceptReturnsNotModeled() {
  const result = calculateAdvisorDevelopmentDevelopmentBonusCandidate({
    rulePack: {
      concepts: {},
    },
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
    advisorFacts: {
      advisorMonth: 4,
    },
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'missing_development_bonus_concept');
  assert.equal(result.candidateAmount, null);

  console.log('PASS missing development-bonus concept returns not_modeled');
}

function testMissingReadinessReturnsBlocked() {
  const result = calculateAdvisorDevelopmentDevelopmentBonusCandidate({
    rulePack: createRulePack(),
    advisorFacts: {
      advisorMonth: 4,
    },
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.BLOCKED);
  assert.equal(result.reason, 'blocked_by_missing_development_bonus_readiness');
  assert.deepEqual(result.missingInputs, ['developmentBonusReadinessResult']);

  console.log('PASS missing readiness result returns blocked');
}

function testReadinessPendingReturnsPending() {
  const result = calculate({
    developmentBonusReadinessResult: createReadinessStatus(RELATIONSHIP_BONUS_READINESS_STATUS.PENDING),
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.PENDING);
  assert.equal(result.reason, 'pending_development_bonus_readiness');

  console.log('PASS readiness pending returns pending');
}

function testReadinessBlockedReturnsBlocked() {
  const result = calculate({
    developmentBonusReadinessResult: createReadinessStatus(RELATIONSHIP_BONUS_READINESS_STATUS.BLOCKED),
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.BLOCKED);
  assert.equal(result.reason, 'blocked_by_development_bonus_readiness');

  console.log('PASS readiness blocked returns blocked');
}

function testReadinessUnknownReturnsUnknown() {
  const result = calculate({
    developmentBonusReadinessResult: createReadinessStatus(RELATIONSHIP_BONUS_READINESS_STATUS.UNKNOWN),
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.UNKNOWN);
  assert.equal(result.reason, 'unknown_development_bonus_readiness');

  console.log('PASS readiness unknown returns unknown');
}

function testReadinessNotModeledReturnsNotModeled() {
  const result = calculate({
    developmentBonusReadinessResult: createReadinessStatus(RELATIONSHIP_BONUS_READINESS_STATUS.NOT_MODELED),
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'development_bonus_readiness_not_modeled');

  console.log('PASS readiness not_modeled returns not_modeled');
}

function testReadyMissingAdvisorMonthReturnsBlocked() {
  const result = calculate({
    advisorFacts: {},
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.BLOCKED);
  assert.equal(result.reason, 'missing_advisorMonth');
  assert.deepEqual(result.missingInputs, ['advisorMonth']);

  console.log('PASS ready but missing advisorMonth returns blocked');
}

function testReadyAdvisorMonthNonNumericReturnsUnknown() {
  const result = calculate({
    advisorFacts: {
      advisorMonth: '4',
    },
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.UNKNOWN);
  assert.equal(result.reason, 'invalid_advisorMonth');

  console.log('PASS ready but advisorMonth non-numeric returns unknown');
}

function testAdvisorMonthThreeReturnsNotModeled() {
  const result = calculate({
    advisorFacts: {
      advisorMonth: 3,
    },
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'advisor_month_not_modeled_for_development_bonus');
  assert.equal(result.candidateAmount, null);

  console.log('PASS advisorMonth 3 returns not_modeled with null candidate');
}

function testMonthFourPolicyCountTwoReturnsFiveThousand() {
  const result = calculate({
    developmentBonusReadinessResult: createReadyReadiness(2, 1),
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.calculation.validPolicyCount, 2);
  assert.equal(result.calculation.baseAmount, 5000);
  assert.equal(result.calculation.candidateAmountBeforeShare, 5000);
  assert.equal(result.candidateAmount, 5000);

  console.log('PASS month 4 validPolicyCount 2 returns 5000 before share');
}

function testMonthFourPolicyCountThreeReturnsNineThousand() {
  const result = calculate({
    developmentBonusReadinessResult: createReadyReadiness(3, 1),
  });

  assert.equal(result.calculation.baseAmount, 9000);
  assert.equal(result.calculation.candidateAmountBeforeShare, 9000);
  assert.equal(result.candidateAmount, 9000);

  console.log('PASS month 4 validPolicyCount 3 returns 9000 before share');
}

function testMonthFourPolicyCountFourReturnsFifteenThousand() {
  const result = calculate({
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
  });

  assert.equal(result.calculation.baseAmount, 15000);
  assert.equal(result.calculation.candidateAmountBeforeShare, 15000);
  assert.equal(result.candidateAmount, 15000);

  console.log('PASS month 4 validPolicyCount 4 returns 15000 before share');
}

function testMonthFourPolicyCountFiveReturnsFifteenThousand() {
  const result = calculate({
    developmentBonusReadinessResult: createReadyReadiness(5, 1),
  });

  assert.equal(result.calculation.tierMatched.minimumPolicies, 4);
  assert.equal(result.calculation.tierMatched.appliesToCountAndAbove, true);
  assert.equal(result.calculation.baseAmount, 15000);
  assert.equal(result.calculation.candidateAmountBeforeShare, 15000);
  assert.equal(result.candidateAmount, 15000);

  console.log('PASS month 4 validPolicyCount 5 returns 15000 before share');
}

function testAdvisorMonthFifteenIsEligible() {
  const result = calculate({
    advisorFacts: {
      advisorMonth: 15,
    },
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.advisorMonth, 15);
  assert.equal(result.candidateAmount, 15000);

  console.log('PASS advisorMonth 15 is eligible');
}

function testAdvisorMonthSixteenReturnsNotModeled() {
  const result = calculate({
    advisorFacts: {
      advisorMonth: 16,
    },
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'advisor_month_not_modeled_for_development_bonus');
  assert.equal(result.candidateAmount, null);

  console.log('PASS advisorMonth 16 returns not_modeled with null candidate');
}

function testMissingValidPolicyCountReturnsBlocked() {
  const readiness = createReadyReadiness(4, 1);
  delete readiness.readiness.validPolicyCount;

  const result = calculate({
    developmentBonusReadinessResult: readiness,
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.BLOCKED);
  assert.equal(result.reason, 'missing_validPolicyCount');
  assert.deepEqual(result.missingInputs, ['validPolicyCount']);

  console.log('PASS missing validPolicyCount returns blocked');
}

function testNonNumericValidPolicyCountReturnsUnknown() {
  const result = calculate({
    developmentBonusReadinessResult: createReadyReadiness('4', 1),
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.UNKNOWN);
  assert.equal(result.reason, 'invalid_validPolicyCount');
  assert.equal(result.candidateAmount, null);

  console.log('PASS non-numeric validPolicyCount returns unknown');
}

function testPolicyCountBelowTwoReturnsIneligible() {
  const result = calculate({
    developmentBonusReadinessResult: createReadyReadiness(1.5, 1),
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.INELIGIBLE);
  assert.equal(result.reason, 'development_bonus_policy_threshold_not_met');
  assert.equal(result.candidateAmount, null);

  console.log('PASS count below 2 returns ineligible/null candidate');
}

function testDeveloperShareOneReturnsFullAmount() {
  const result = calculate({
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
  });

  assert.equal(result.calculation.developerShare, 1);
  assert.equal(result.candidateAmount, 15000);

  console.log('PASS developerShare 1.0 returns full amount');
}

function testDeveloperShareHalfReturnsHalfAmount() {
  const result = calculate({
    developmentBonusReadinessResult: createReadyReadiness(4, 0.5),
  });

  assert.equal(result.calculation.baseAmount, 15000);
  assert.equal(result.calculation.developerShare, 0.5);
  assert.equal(result.calculation.sharedBaseAmount, 7500);
  assert.equal(result.candidateAmount, 7500);

  console.log('PASS developerShare 0.5 returns half amount');
}

function testUnsupportedDeveloperShareReturnsNotModeled() {
  const result = calculate({
    developmentBonusReadinessResult: createReadyReadiness(4, 0.25),
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'unsupported_developerShare');
  assert.equal(result.candidateAmount, null);

  console.log('PASS unsupported developerShare returns not_modeled');
}

function testMonth12With36PoliciesAndTrainingAllowanceWonAddsTwentyThousand() {
  const result = calculate({
    advisorFacts: {
      advisorMonth: 12,
      accumulatedInitialPoliciesByMonth12: 36,
      trainingAllowanceMonth12Won: true,
      monthlyPaidPolicyCounts: paidPolicyCounts(),
    },
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
  });

  assert.equal(result.calculation.baseAmount, 15000);
  assert.equal(result.calculation.month12AdditionalBeforeShare, 20000);
  assert.equal(result.calculation.candidateAmountBeforeShare, 35000);
  assert.equal(result.candidateAmount, 35000);
  assert.equal(result.metadata.month12Additional.bonus20000Eligible, true);
  assert.equal(result.metadata.month12Additional.additionalBonus30000Eligible, false);

  console.log('PASS month 12 with 36 accumulated policies and TA won adds 20000');
}

function testMonth12With48PoliciesTrainingAllowanceWonAndContinuityAddsFiftyThousand() {
  const result = calculate({
    advisorFacts: {
      advisorMonth: 12,
      accumulatedInitialPoliciesByMonth12: 48,
      trainingAllowanceMonth12Won: true,
      monthlyPaidPolicyCounts: paidPolicyCounts(),
    },
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
  });

  assert.equal(result.calculation.baseAmount, 15000);
  assert.equal(result.calculation.month12AdditionalBeforeShare, 50000);
  assert.equal(result.calculation.candidateAmountBeforeShare, 65000);
  assert.equal(result.candidateAmount, 65000);
  assert.equal(result.metadata.month12Additional.bonus20000Eligible, true);
  assert.equal(result.metadata.month12Additional.additionalBonus30000Eligible, true);

  console.log('PASS month 12 with 48 policies, TA won, and continuity adds 20000 + 30000');
}

function testMonth12With48PoliciesButTrainingAllowanceNotWonDoesNotAddAdditional() {
  const result = calculate({
    advisorFacts: {
      advisorMonth: 12,
      accumulatedInitialPoliciesByMonth12: 48,
      trainingAllowanceMonth12Won: false,
      monthlyPaidPolicyCounts: paidPolicyCounts(),
    },
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
  });

  assert.equal(result.calculation.baseAmount, 15000);
  assert.equal(result.calculation.month12AdditionalBeforeShare, 0);
  assert.equal(result.candidateAmount, 15000);
  assert.equal(result.metadata.month12Additional.bonus20000Eligible, false);
  assert.equal(result.metadata.month12Additional.additionalBonus30000Eligible, false);

  console.log('PASS month 12 with 48 policies but TA not won does not add additional');
}

function testMonth12WithOneZeroPolicyMonthInOneThroughNineMayStillGetThirtyThousand() {
  const result = calculate({
    advisorFacts: {
      advisorMonth: 12,
      accumulatedInitialPoliciesByMonth12: 48,
      trainingAllowanceMonth12Won: true,
      monthlyPaidPolicyCounts: paidPolicyCounts({
        zeroMonths: [5],
      }),
    },
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
  });

  assert.equal(result.calculation.month12AdditionalBeforeShare, 50000);
  assert.equal(result.candidateAmount, 65000);
  assert.deepEqual(result.metadata.month12Additional.zeroPolicyMonths, [5]);
  assert.equal(result.metadata.month12Additional.additionalBonus30000Eligible, true);

  console.log('PASS one zero-policy month in months 1-9 may still get 30000 additional');
}

function testMonth12WithZeroPolicyMonthInTenThroughTwelveLosesThirtyThousand() {
  const result = calculate({
    advisorFacts: {
      advisorMonth: 12,
      accumulatedInitialPoliciesByMonth12: 48,
      trainingAllowanceMonth12Won: true,
      monthlyPaidPolicyCounts: paidPolicyCounts({
        zeroMonths: [10],
      }),
    },
    developmentBonusReadinessResult: createReadyReadiness(4, 1),
  });

  assert.equal(result.calculation.month12AdditionalBeforeShare, 20000);
  assert.equal(result.candidateAmount, 35000);
  assert.deepEqual(result.metadata.month12Additional.zeroPolicyMonths, [10]);
  assert.deepEqual(result.metadata.month12Additional.disallowedZeroPolicyMonths, [10]);
  assert.equal(result.metadata.month12Additional.additionalBonus30000Eligible, false);

  console.log('PASS zero-policy month in 10, 11, or 12 loses 30000 additional');
}

function testEngineAlwaysReturnsPayoutTruthFalse() {
  const results = [
    calculate({
      developmentBonusReadinessResult: createReadyReadiness(4, 1),
    }),
    calculate({
      developmentBonusReadinessResult: createReadyReadiness(1, 1),
    }),
    calculate({
      developmentBonusReadinessResult: createReadinessStatus(RELATIONSHIP_BONUS_READINESS_STATUS.PENDING),
    }),
    calculateAdvisorDevelopmentDevelopmentBonusCandidate({}),
  ];

  for (const result of results) {
    assertPayoutTruthFalse(result);
  }

  console.log('PASS development bonus engine always returns payoutTruth false');
}

function testTierMatcherConsumesRulePackTiers() {
  const tiers = createDevelopmentBonusConcept().monthlyBonus.tiers;

  assert.equal(matchDevelopmentBonusTier({ sortedTiers: [...tiers].sort((a, b) => b.minimumPolicies - a.minimumPolicies), validPolicyCount: 5 }).amount, 15000);

  console.log('PASS tier matcher consumes rule pack tiers');
}

testMissingRulePackReturnsNotModeled();
testMissingDevelopmentBonusConceptReturnsNotModeled();
testMissingReadinessReturnsBlocked();
testReadinessPendingReturnsPending();
testReadinessBlockedReturnsBlocked();
testReadinessUnknownReturnsUnknown();
testReadinessNotModeledReturnsNotModeled();
testReadyMissingAdvisorMonthReturnsBlocked();
testReadyAdvisorMonthNonNumericReturnsUnknown();
testAdvisorMonthThreeReturnsNotModeled();
testMonthFourPolicyCountTwoReturnsFiveThousand();
testMonthFourPolicyCountThreeReturnsNineThousand();
testMonthFourPolicyCountFourReturnsFifteenThousand();
testMonthFourPolicyCountFiveReturnsFifteenThousand();
testAdvisorMonthFifteenIsEligible();
testAdvisorMonthSixteenReturnsNotModeled();
testMissingValidPolicyCountReturnsBlocked();
testNonNumericValidPolicyCountReturnsUnknown();
testPolicyCountBelowTwoReturnsIneligible();
testDeveloperShareOneReturnsFullAmount();
testDeveloperShareHalfReturnsHalfAmount();
testUnsupportedDeveloperShareReturnsNotModeled();
testMonth12With36PoliciesAndTrainingAllowanceWonAddsTwentyThousand();
testMonth12With48PoliciesTrainingAllowanceWonAndContinuityAddsFiftyThousand();
testMonth12With48PoliciesButTrainingAllowanceNotWonDoesNotAddAdditional();
testMonth12WithOneZeroPolicyMonthInOneThroughNineMayStillGetThirtyThousand();
testMonth12WithZeroPolicyMonthInTenThroughTwelveLosesThirtyThousand();
testEngineAlwaysReturnsPayoutTruthFalse();
testTierMatcherConsumesRulePackTiers();

console.log('PASS advisor-development-development-bonus-engine-test');
