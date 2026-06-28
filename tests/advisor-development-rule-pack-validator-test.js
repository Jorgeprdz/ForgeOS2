import assert from 'node:assert/strict';

import {
  DEVELOPMENT_BONUS_CONCEPT_KEY,
  EXPECTED_RULE_PACK_ID,
  EXPECTED_SOURCE_EVIDENCE_REF,
  TRAINING_ALLOWANCE_CONCEPT_KEY,
  validateAdvisorDevelopmentRulePack,
} from '../compensation/advisor-development/advisor-development-rule-pack-validator.js';

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
      baseBonusStrategy: 'min_between_calculated_and_max_award',
      excessBonusStrategy: 'apply_rate_to_excess_above_max_award',
      excessMultiplierRate: 0.35,
      paymentDeductionStrategy: 'subtract_prior_paid_bonuses_in_current_semester',
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

function createDevelopmentBonusConcept(overrides = {}) {
  return {
    displayName: 'Bono de Desarrollo',
    targetPopulation: 'relationship_attributed_developers',
    calculationStatus: 'blocked_until_relationship_attribution_evidence',
    calculationFrequency: 'monthly',
    paymentFrequency: 'following_month_when_monthly_goal_reached',
    payoutTruth: false,
    payoutTruthRule: 'commission_statement_required',
    attributionModel: 'advisor_development_attribution',
    sourceNotes: [
      'CC 2026 Asesores en Desarrollo - Bono de Desarrollo',
    ],
    supportedDeveloperShares: [
      1,
      0.5,
    ],
    requiredAttributionEvidence: [
      'developerId',
      'developedAdvisorId',
      'developmentStartDate',
      'developerEligibilityEvidence',
      'developerActiveAtMonthClose',
      'developedAdvisorActiveAtMonthClose',
      'developerShare',
      'attributionEvidenceStatus',
    ],
    policyCountSource: 'advisor-development-counting-weighting-engine.summary.includedCount',
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
        zeroPolicyMonthsThatLoseAdditional: [
          10,
          11,
          12,
        ],
      },
    },
    blockedReason: 'blocked_by_missing_development_assignment_evidence',
    ...overrides,
  };
}

function createValidDraft(overrides = {}) {
  return {
    schemaVersion: '1.0.0',
    rulePackId: EXPECTED_RULE_PACK_ID,
    metadata: {
      rulePackId: EXPECTED_RULE_PACK_ID,
      rulePackVersion: '1.0.0-draft',
      rulePackHash: 'draft:not-sealed',
      rulePackEffectiveDate: '2026-01-01',
      governanceStatus: 'draft',
      sourceEvidenceRefs: [EXPECTED_SOURCE_EVIDENCE_REF],
    },
    source: {
      documentName: 'CC 2026 Asesores en Desarrollo',
      sourceEvidenceRefs: [EXPECTED_SOURCE_EVIDENCE_REF],
    },
    globalRules: {
      payoutTruth: false,
    },
    countingAndWeightingRules: {
      excludedProducts: ['tempo_vida_1', 'star_temporal_1'],
      excludedComponents: ['ave', 'avecp', 'cvd'],
      vidaIndividual: {
        commissionFactor: 0.9,
      },
      gmmi: {
        commissionFactor: 1,
        ageExclusion: {
          minAgeExcluded: 60,
        },
      },
    },
    qualificationRules: {
      minimumIndexes: {
        LIMRA: 75.5,
        IGC: 91,
      },
    },
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: createDevelopmentBonusConcept(),
    },
    ...overrides,
  };
}

function testValidDraftPassesWithoutDraftWarnings() {
  const result = validateAdvisorDevelopmentRulePack(createValidDraft());

  assert.equal(result.isValid, true);
  assert.equal(result.validationErrors.length, 0);
  assert.equal(result.validationWarnings.length, 0);

  console.log('PASS valid advisor development draft with Training Allowance passes');
}

function testMissingIdentityFails() {
  const draft = createValidDraft({
    metadata: {
      rulePackId: EXPECTED_RULE_PACK_ID,
      rulePackEffectiveDate: '2026-01-01',
      governanceStatus: 'draft',
      sourceEvidenceRefs: [EXPECTED_SOURCE_EVIDENCE_REF],
    },
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'missing_rule_pack_version'));
  assert(result.validationErrors.some((error) => error.code === 'missing_rule_pack_hash'));

  console.log('PASS missing identity fields fail validation');
}

function testInvalidRulePackIdFails() {
  const draft = createValidDraft({
    metadata: {
      rulePackId: 'smnyl_partner_compensation_2026',
      rulePackVersion: '1.0.0-draft',
      rulePackHash: 'draft:not-sealed',
      rulePackEffectiveDate: '2026-01-01',
      governanceStatus: 'draft',
      sourceEvidenceRefs: [EXPECTED_SOURCE_EVIDENCE_REF],
    },
    rulePackId: 'smnyl_partner_compensation_2026',
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_rule_pack_id'));

  console.log('PASS partner rulePackId is rejected');
}

function testMissingCountingAndWeightingRulesFails() {
  const draft = createValidDraft({
    countingAndWeightingRules: undefined,
  });

  delete draft.countingAndWeightingRules;

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'missing_counting_and_weighting_rules'));

  console.log('PASS missing countingAndWeightingRules fails validation');
}

function testInvalidPayoutTruthFails() {
  const draft = createValidDraft({
    globalRules: {
      payoutTruth: true,
    },
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_payout_truth_default'));

  console.log('PASS payoutTruth must be explicitly false');
}

function testMissingOfficialSourceFails() {
  const draft = createValidDraft({
    metadata: {
      rulePackId: EXPECTED_RULE_PACK_ID,
      rulePackVersion: '1.0.0-draft',
      rulePackHash: 'draft:not-sealed',
      rulePackEffectiveDate: '2026-01-01',
      governanceStatus: 'draft',
      sourceEvidenceRefs: ['PCV 2026 Partners.pdf'],
    },
    source: {
      sourceEvidenceRefs: ['PCV 2026 Partners.pdf'],
    },
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'missing_official_source_evidence_ref'));

  console.log('PASS official advisor development source evidence is required');
}

function testMissingTrainingAllowanceConceptFails() {
  const draft = createValidDraft({
    concepts: {},
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'missing_training_allowance_concept'));

  console.log('PASS missing Training Allowance concept fails validation');
}

function testMissingDevelopmentBonusConceptFails() {
  const draft = createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
    },
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'missing_development_bonus_concept'));

  console.log('PASS missing Development Bonus concept fails validation');
}

function testDevelopmentBonusPayoutTruthMustBeFalse() {
  const draft = createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: createDevelopmentBonusConcept({
        payoutTruth: true,
      }),
    },
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_development_bonus_payout_truth'));

  console.log('PASS Development Bonus payoutTruth must be explicitly false');
}

function testMissingDevelopmentBonusMonthRangeFails() {
  const developmentBonus = createDevelopmentBonusConcept({
    monthlyBonus: {
      ...createDevelopmentBonusConcept().monthlyBonus,
      advisorMonthRange: undefined,
    },
  });
  delete developmentBonus.monthlyBonus.advisorMonthRange;

  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: developmentBonus,
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_development_bonus_month_range'));

  console.log('PASS missing Development Bonus monthly eligible range fails validation');
}

function testWrongDevelopmentBonusMonthRangeFails() {
  const developmentBonus = createDevelopmentBonusConcept({
    monthlyBonus: {
      ...createDevelopmentBonusConcept().monthlyBonus,
      advisorMonthRange: {
        from: 3,
        to: 15,
      },
    },
  });

  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: developmentBonus,
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_development_bonus_month_range'));

  console.log('PASS wrong Development Bonus monthly eligible range fails validation');
}

function testMissingDevelopmentBonusPolicyScaleFails() {
  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: createDevelopmentBonusConcept({
        monthlyBonus: {
          advisorMonthRange: {
            from: 4,
            to: 15,
          },
        },
      }),
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'missing_development_bonus_policy_scale'));

  console.log('PASS missing Development Bonus policy scale fails validation');
}

function testWrongDevelopmentBonusTierAmountFails() {
  const developmentBonus = createDevelopmentBonusConcept();
  developmentBonus.monthlyBonus.tiers = developmentBonus.monthlyBonus.tiers.map((tier) => (
    tier.minimumPolicies === 3
      ? { ...tier, amount: 8000 }
      : tier
  ));

  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: developmentBonus,
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_development_bonus_policy_tier_amount'));

  console.log('PASS wrong Development Bonus policy tier amount fails validation');
}

function testMissingDevelopmentBonusVidaGmmiCountingRuleFails() {
  const developmentBonus = createDevelopmentBonusConcept();
  delete developmentBonus.policyCountRule;

  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: developmentBonus,
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_development_bonus_policy_count_rule'));

  console.log('PASS missing Development Bonus Vida + GMMI 0.5 counting rule fails validation');
}

function testMissingDevelopmentBonusMonth12AdditionalRulesFails() {
  const developmentBonus = createDevelopmentBonusConcept();
  delete developmentBonus.month12AdditionalBonuses;

  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: developmentBonus,
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'missing_development_bonus_month12_additional_rules'));

  console.log('PASS missing Development Bonus month 12 additional rules fails validation');
}

function testMissingDevelopmentBonus36PolicyRuleFails() {
  const developmentBonus = createDevelopmentBonusConcept();
  delete developmentBonus.month12AdditionalBonuses.bonus20000;

  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: developmentBonus,
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_development_bonus_36_policy_rule'));

  console.log('PASS missing Development Bonus 36-policy / 20k rule fails validation');
}

function testMissingDevelopmentBonus48PolicyRuleFails() {
  const developmentBonus = createDevelopmentBonusConcept();
  delete developmentBonus.month12AdditionalBonuses.additionalBonus30000;

  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: developmentBonus,
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_development_bonus_48_policy_rule'));

  console.log('PASS missing Development Bonus 48-policy / 30k rule fails validation');
}

function testMissingDevelopmentBonusTrainingAllowanceMonth12RequirementFails() {
  const developmentBonus = createDevelopmentBonusConcept();
  developmentBonus.month12AdditionalBonuses.additionalBonus30000.requiresTrainingAllowanceMonth12Won = false;

  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: developmentBonus,
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'missing_development_bonus_ta_month12_requirement'));

  console.log('PASS missing Development Bonus TA month 12 requirement fails validation');
}

function testMissingDevelopmentBonusZeroPolicyMonthExclusionFails() {
  const developmentBonus = createDevelopmentBonusConcept();
  developmentBonus.month12AdditionalBonuses.additionalBonus30000.zeroPolicyMonthsThatLoseAdditional = [11, 12];

  const result = validateAdvisorDevelopmentRulePack(createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept(),
      [DEVELOPMENT_BONUS_CONCEPT_KEY]: developmentBonus,
    },
  }));

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'missing_development_bonus_zero_policy_month_10_12_exclusion'));

  console.log('PASS missing Development Bonus zero-policy months 10-12 exclusion fails validation');
}

function testTrainingAllowanceTableRequiresTwelveRows() {
  const trainingAllowance = createTrainingAllowanceConcept({
    table: createTrainingAllowanceConcept().table.slice(0, 11),
  });

  const draft = createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: trainingAllowance,
    },
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_training_allowance_table_length'));

  console.log('PASS Training Allowance table requires 12 rows');
}

function testTrainingAllowanceNumericFieldsAreStrict() {
  const table = createTrainingAllowanceConcept().table;
  table[0] = {
    ...table[0],
    accumulatedCommissionGoal: '9000',
  };

  const draft = createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept({ table }),
    },
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_training_allowance_numeric_field'));

  console.log('PASS Training Allowance numeric fields are strict numbers');
}

function testTrainingAllowanceExcessMultiplierRateIsStrictNumber() {
  const draft = createValidDraft({
    concepts: {
      [TRAINING_ALLOWANCE_CONCEPT_KEY]: createTrainingAllowanceConcept({
        calculationRules: {
          baseBonusStrategy: 'min_between_calculated_and_max_award',
          excessBonusStrategy: 'apply_rate_to_excess_above_max_award',
          excessMultiplierRate: '0.35',
          paymentDeductionStrategy: 'subtract_prior_paid_bonuses_in_current_semester',
        },
      }),
    },
  });

  const result = validateAdvisorDevelopmentRulePack(draft);

  assert.equal(result.isValid, false);
  assert(result.validationErrors.some((error) => error.code === 'invalid_training_allowance_excess_multiplier_rate'));

  console.log('PASS Training Allowance excessMultiplierRate is strict number');
}

function testValidatorDoesNotMutateInput() {
  const draft = createValidDraft();
  const before = JSON.stringify(draft);

  validateAdvisorDevelopmentRulePack(draft);

  assert.equal(JSON.stringify(draft), before);

  console.log('PASS validator does not mutate input');
}

testValidDraftPassesWithoutDraftWarnings();
testMissingIdentityFails();
testInvalidRulePackIdFails();
testMissingCountingAndWeightingRulesFails();
testInvalidPayoutTruthFails();
testMissingOfficialSourceFails();
testMissingTrainingAllowanceConceptFails();
testMissingDevelopmentBonusConceptFails();
testDevelopmentBonusPayoutTruthMustBeFalse();
testMissingDevelopmentBonusMonthRangeFails();
testWrongDevelopmentBonusMonthRangeFails();
testMissingDevelopmentBonusPolicyScaleFails();
testWrongDevelopmentBonusTierAmountFails();
testMissingDevelopmentBonusVidaGmmiCountingRuleFails();
testMissingDevelopmentBonusMonth12AdditionalRulesFails();
testMissingDevelopmentBonus36PolicyRuleFails();
testMissingDevelopmentBonus48PolicyRuleFails();
testMissingDevelopmentBonusTrainingAllowanceMonth12RequirementFails();
testMissingDevelopmentBonusZeroPolicyMonthExclusionFails();
testTrainingAllowanceTableRequiresTwelveRows();
testTrainingAllowanceNumericFieldsAreStrict();
testTrainingAllowanceExcessMultiplierRateIsStrictNumber();
testValidatorDoesNotMutateInput();

console.log('PASS advisor-development-rule-pack-validator-test');
