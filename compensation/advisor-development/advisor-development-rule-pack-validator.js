const EXPECTED_RULE_PACK_ID = 'smnyl-advisor-development-2026';
const EXPECTED_SOURCE_EVIDENCE_REF = 'CC 2026 Asesores en Desarrollo.pdf';
const TRAINING_ALLOWANCE_CONCEPT_KEY = 'training-allowance';
const DEVELOPMENT_BONUS_CONCEPT_KEY = 'development-bonus';

const VALID_GOVERNANCE_STATUSES = new Set(['draft', 'official']);

function createIssue(code, message, path = null) {
  return {
    code,
    message,
    path,
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function getIdentityContainer(rulePack) {
  if (isPlainObject(rulePack?.metadata)) return rulePack.metadata;
  if (isPlainObject(rulePack?.identity)) return rulePack.identity;

  return rulePack || {};
}

function readIdentity(rulePack) {
  const identity = getIdentityContainer(rulePack);

  return {
    rulePackId: identity.rulePackId ?? rulePack?.rulePackId,
    rulePackVersion: identity.rulePackVersion ?? identity.version ?? rulePack?.rulePackVersion,
    rulePackHash: identity.rulePackHash ?? rulePack?.rulePackHash,
    rulePackEffectiveDate: identity.rulePackEffectiveDate ?? identity.effectiveDate ?? rulePack?.rulePackEffectiveDate,
    governanceStatus: identity.governanceStatus ?? rulePack?.governanceStatus ?? rulePack?.status,
  };
}

function collectSourceEvidenceRefs(rulePack) {
  const refs = [];

  const candidates = [
    rulePack?.sourceEvidenceRefs,
    rulePack?.metadata?.sourceEvidenceRefs,
    rulePack?.identity?.sourceEvidenceRefs,
    rulePack?.source?.sourceEvidenceRefs,
    rulePack?.source?.evidenceRefs,
    rulePack?.source?.documents,
    rulePack?.source?.document,
    rulePack?.source?.fileName,
    rulePack?.source?.filename,
    rulePack?.source?.pdf,
    rulePack?.source?.name,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      refs.push(...candidate);
    } else if (typeof candidate === 'string') {
      refs.push(candidate);
    } else if (isPlainObject(candidate)) {
      for (const value of Object.values(candidate)) {
        if (typeof value === 'string') refs.push(value);
      }
    }
  }

  return refs.filter(Boolean);
}

function isValidDateString(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;

  const time = Date.parse(value);

  return Number.isFinite(time);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function validateIdentity(rulePack, validationErrors) {
  const identity = readIdentity(rulePack);

  if (identity.rulePackId !== EXPECTED_RULE_PACK_ID) {
    validationErrors.push(createIssue(
      'invalid_rule_pack_id',
      `rulePackId must be ${EXPECTED_RULE_PACK_ID}`,
      'metadata.rulePackId',
    ));
  }

  if (!identity.rulePackVersion || typeof identity.rulePackVersion !== 'string') {
    validationErrors.push(createIssue(
      'missing_rule_pack_version',
      'rulePackVersion is required',
      'metadata.rulePackVersion',
    ));
  }

  if (!identity.rulePackHash || typeof identity.rulePackHash !== 'string') {
    validationErrors.push(createIssue(
      'missing_rule_pack_hash',
      'rulePackHash is required',
      'metadata.rulePackHash',
    ));
  }

  if (!isValidDateString(identity.rulePackEffectiveDate)) {
    validationErrors.push(createIssue(
      'missing_or_invalid_rule_pack_effective_date',
      'rulePackEffectiveDate must be a valid date string',
      'metadata.rulePackEffectiveDate',
    ));
  }

  if (!VALID_GOVERNANCE_STATUSES.has(identity.governanceStatus)) {
    validationErrors.push(createIssue(
      'invalid_governance_status',
      'governanceStatus must be draft or official',
      'metadata.governanceStatus',
    ));
  }

  if (identity.rulePackHash === 'draft:not-sealed' && identity.governanceStatus !== 'draft') {
    validationErrors.push(createIssue(
      'draft_hash_requires_draft_status',
      'draft:not-sealed hash is only allowed when governanceStatus is draft',
      'metadata.rulePackHash',
    ));
  }
}

function validateSourceEvidence(rulePack, validationErrors) {
  const refs = collectSourceEvidenceRefs(rulePack);

  if (!refs.includes(EXPECTED_SOURCE_EVIDENCE_REF)) {
    validationErrors.push(createIssue(
      'missing_official_source_evidence_ref',
      `sourceEvidenceRefs must include ${EXPECTED_SOURCE_EVIDENCE_REF}`,
      'sourceEvidenceRefs',
    ));
  }
}

function validatePayoutTruthRule(rulePack, validationErrors) {
  if (!isPlainObject(rulePack?.globalRules)) {
    validationErrors.push(createIssue(
      'missing_global_rules',
      'globalRules is required',
      'globalRules',
    ));
    return;
  }

  if (rulePack.globalRules.payoutTruth !== false) {
    validationErrors.push(createIssue(
      'invalid_payout_truth_default',
      'globalRules.payoutTruth must be explicitly false',
      'globalRules.payoutTruth',
    ));
  }
}

function validateCountingAndWeightingRules(rulePack, validationErrors) {
  const rules = rulePack?.countingAndWeightingRules;

  if (!isPlainObject(rules)) {
    validationErrors.push(createIssue(
      'missing_counting_and_weighting_rules',
      'countingAndWeightingRules is required',
      'countingAndWeightingRules',
    ));
    return;
  }

  if (!Array.isArray(rules.excludedProducts)) {
    validationErrors.push(createIssue(
      'missing_excluded_products',
      'countingAndWeightingRules.excludedProducts must be an array',
      'countingAndWeightingRules.excludedProducts',
    ));
  }

  if (!Array.isArray(rules.excludedComponents)) {
    validationErrors.push(createIssue(
      'missing_excluded_components',
      'countingAndWeightingRules.excludedComponents must be an array',
      'countingAndWeightingRules.excludedComponents',
    ));
  }

  if (!isNumber(rules?.vidaIndividual?.commissionFactor)) {
    validationErrors.push(createIssue(
      'missing_life_commission_factor',
      'vidaIndividual.commissionFactor must be a number',
      'countingAndWeightingRules.vidaIndividual.commissionFactor',
    ));
  }

  if (!isNumber(rules?.gmmi?.commissionFactor)) {
    validationErrors.push(createIssue(
      'missing_gmmi_commission_factor',
      'gmmi.commissionFactor must be a number',
      'countingAndWeightingRules.gmmi.commissionFactor',
    ));
  }

  if (!isNumber(rules?.gmmi?.ageExclusion?.minAgeExcluded)) {
    validationErrors.push(createIssue(
      'missing_gmmi_min_age_excluded',
      'gmmi.ageExclusion.minAgeExcluded must be a number',
      'countingAndWeightingRules.gmmi.ageExclusion.minAgeExcluded',
    ));
  }
}

function validateTrainingAllowanceRow(row, index, validationErrors) {
  if (!isPlainObject(row)) {
    validationErrors.push(createIssue(
      'invalid_training_allowance_table_row',
      'Training Allowance table rows must be objects',
      `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.table[${index}]`,
    ));
    return;
  }

  const numericFields = [
    'advisorMonth',
    'semester',
    'accumulatedCommissionGoal',
    'accumulatedPolicyGoal',
    'minimumLifePolicyGoal',
    'bonusPercentage',
    'minimumAward',
    'maximumAward',
  ];

  for (const field of numericFields) {
    if (!isNumber(row[field])) {
      validationErrors.push(createIssue(
        'invalid_training_allowance_numeric_field',
        `Training Allowance table row ${index + 1} requires numeric ${field}`,
        `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.table[${index}].${field}`,
      ));
    }
  }
}

function validateTrainingAllowanceConcept(rulePack, validationErrors) {
  const concepts = rulePack?.concepts;

  if (!isPlainObject(concepts)) {
    validationErrors.push(createIssue(
      'missing_concepts',
      'concepts is required and must include training-allowance',
      'concepts',
    ));
    return;
  }

  const trainingAllowance = concepts[TRAINING_ALLOWANCE_CONCEPT_KEY];

  if (!isPlainObject(trainingAllowance)) {
    validationErrors.push(createIssue(
      'missing_training_allowance_concept',
      'concepts.training-allowance is required',
      `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}`,
    ));
    return;
  }

  const requiredStringFields = [
    'displayName',
    'targetPopulation',
    'calculationFrequency',
    'paymentFrequency',
  ];

  for (const field of requiredStringFields) {
    if (!isString(trainingAllowance[field])) {
      validationErrors.push(createIssue(
        'invalid_training_allowance_string_field',
        `Training Allowance requires string ${field}`,
        `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.${field}`,
      ));
    }
  }

  if (trainingAllowance.payoutTruth !== false) {
    validationErrors.push(createIssue(
      'invalid_training_allowance_payout_truth',
      'Training Allowance payoutTruth must be explicitly false',
      `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.payoutTruth`,
    ));
  }

  if (!isNumber(trainingAllowance?.policyAccumulationRule?.vidaPlusGmmiCountsAs)) {
    validationErrors.push(createIssue(
      'invalid_training_allowance_policy_accumulation_rule',
      'Training Allowance policyAccumulationRule.vidaPlusGmmiCountsAs must be numeric',
      `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.policyAccumulationRule.vidaPlusGmmiCountsAs`,
    ));
  }

  const calculationRules = trainingAllowance.calculationRules;

  if (!isPlainObject(calculationRules)) {
    validationErrors.push(createIssue(
      'missing_training_allowance_calculation_rules',
      'Training Allowance calculationRules is required',
      `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.calculationRules`,
    ));
  } else {
    const requiredStrategyFields = [
      'baseBonusStrategy',
      'excessBonusStrategy',
      'paymentDeductionStrategy',
    ];

    for (const field of requiredStrategyFields) {
      if (!isString(calculationRules[field])) {
        validationErrors.push(createIssue(
          'invalid_training_allowance_strategy_field',
          `Training Allowance calculationRules requires string ${field}`,
          `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.calculationRules.${field}`,
        ));
      }
    }

    if (!isNumber(calculationRules.excessMultiplierRate)) {
      validationErrors.push(createIssue(
        'invalid_training_allowance_excess_multiplier_rate',
        'Training Allowance calculationRules.excessMultiplierRate must be numeric',
        `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.calculationRules.excessMultiplierRate`,
      ));
    }
  }

  if (!Array.isArray(trainingAllowance.table)) {
    validationErrors.push(createIssue(
      'missing_training_allowance_table',
      'Training Allowance table must be an array',
      `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.table`,
    ));
    return;
  }

  if (trainingAllowance.table.length !== 12) {
    validationErrors.push(createIssue(
      'invalid_training_allowance_table_length',
      'Training Allowance table must contain exactly 12 rows',
      `concepts.${TRAINING_ALLOWANCE_CONCEPT_KEY}.table`,
    ));
  }

  trainingAllowance.table.forEach((row, index) => {
    validateTrainingAllowanceRow(row, index, validationErrors);
  });
}

function findTier(tiers, minimumPolicies) {
  return Array.isArray(tiers)
    ? tiers.find((tier) => tier?.minimumPolicies === minimumPolicies)
    : null;
}

function validateDevelopmentBonusConcept(rulePack, validationErrors) {
  const concepts = rulePack?.concepts;

  if (!isPlainObject(concepts)) {
    return;
  }

  const developmentBonus = concepts[DEVELOPMENT_BONUS_CONCEPT_KEY];
  const officialAdvisorDevelopmentDocument = rulePack?.source?.documentName === 'CC 2026 Asesores en Desarrollo';

  if (!officialAdvisorDevelopmentDocument && !isPlainObject(developmentBonus)) {
    return;
  }

  if (!isPlainObject(developmentBonus)) {
    validationErrors.push(createIssue(
      'missing_development_bonus_concept',
      'concepts.development-bonus is required',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}`,
    ));
    return;
  }

  if (developmentBonus.payoutTruth !== false) {
    validationErrors.push(createIssue(
      'invalid_development_bonus_payout_truth',
      'Development Bonus payoutTruth must be explicitly false',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.payoutTruth`,
    ));
  }

  if (!Array.isArray(developmentBonus.supportedDeveloperShares) ||
    !developmentBonus.supportedDeveloperShares.includes(1) ||
    !developmentBonus.supportedDeveloperShares.includes(0.5)) {
    validationErrors.push(createIssue(
      'invalid_development_bonus_supported_developer_shares',
      'Development Bonus must support full and 50 percent developer shares',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.supportedDeveloperShares`,
    ));
  }

  if (developmentBonus?.policyCountRule?.vidaPlusGmmiCountsAs !== 0.5) {
    validationErrors.push(createIssue(
      'invalid_development_bonus_policy_count_rule',
      'Development Bonus policyCountRule.vidaPlusGmmiCountsAs must be 0.5',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.policyCountRule.vidaPlusGmmiCountsAs`,
    ));
  }

  const monthlyBonus = developmentBonus.monthlyBonus;

  if (!isPlainObject(monthlyBonus)) {
    validationErrors.push(createIssue(
      'missing_development_bonus_monthly_bonus',
      'Development Bonus monthlyBonus is required',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.monthlyBonus`,
    ));
  } else {
    const range = monthlyBonus.advisorMonthRange;

    if (!isPlainObject(range) || range.from !== 4 || range.to !== 15) {
      validationErrors.push(createIssue(
        'invalid_development_bonus_month_range',
        'Development Bonus advisorMonthRange must be 4 through 15',
        `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.monthlyBonus.advisorMonthRange`,
      ));
    }

    if (!Array.isArray(monthlyBonus.tiers)) {
      validationErrors.push(createIssue(
        'missing_development_bonus_policy_scale',
        'Development Bonus monthlyBonus.tiers is required',
        `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.monthlyBonus.tiers`,
      ));
    } else {
      const tier2 = findTier(monthlyBonus.tiers, 2);
      const tier3 = findTier(monthlyBonus.tiers, 3);
      const tier4 = findTier(monthlyBonus.tiers, 4);

      if (!tier2 || !tier3 || !tier4) {
        validationErrors.push(createIssue(
          'missing_development_bonus_policy_scale',
          'Development Bonus must include 2, 3, and 4+ policy tiers',
          `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.monthlyBonus.tiers`,
        ));
      } else {
        if (tier2.amount !== 5000) {
          validationErrors.push(createIssue(
            'invalid_development_bonus_policy_tier_amount',
            'Development Bonus 2-policy tier amount must be 5000',
            `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.monthlyBonus.tiers`,
          ));
        }

        if (tier3.amount !== 9000) {
          validationErrors.push(createIssue(
            'invalid_development_bonus_policy_tier_amount',
            'Development Bonus 3-policy tier amount must be 9000',
            `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.monthlyBonus.tiers`,
          ));
        }

        if (tier4.amount !== 15000 || tier4.appliesToCountAndAbove !== true) {
          validationErrors.push(createIssue(
            'invalid_development_bonus_policy_tier_amount',
            'Development Bonus 4+ policy tier amount must be 15000 and apply to count and above',
            `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.monthlyBonus.tiers`,
          ));
        }
      }
    }
  }

  const additionalBonuses = developmentBonus.month12AdditionalBonuses;

  if (!isPlainObject(additionalBonuses)) {
    validationErrors.push(createIssue(
      'missing_development_bonus_month12_additional_rules',
      'Development Bonus month12AdditionalBonuses is required',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.month12AdditionalBonuses`,
    ));
    return;
  }

  const bonus20000 = additionalBonuses.bonus20000;
  const bonus30000 = additionalBonuses.additionalBonus30000;

  if (!isPlainObject(bonus20000) ||
    bonus20000.advisorMonth !== 12 ||
    bonus20000.amount !== 20000 ||
    bonus20000.requiredAccumulatedInitialPoliciesByMonth12 !== 36) {
    validationErrors.push(createIssue(
      'invalid_development_bonus_36_policy_rule',
      'Development Bonus month 12 36-policy rule must pay 20000',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.month12AdditionalBonuses.bonus20000`,
    ));
  }

  if (isPlainObject(bonus20000) && bonus20000.requiresTrainingAllowanceMonth12Won !== true) {
    validationErrors.push(createIssue(
      'missing_development_bonus_ta_month12_requirement',
      'Development Bonus 20000 additional requires Training Allowance month 12 won',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.month12AdditionalBonuses.bonus20000.requiresTrainingAllowanceMonth12Won`,
    ));
  }

  if (!isPlainObject(bonus30000) ||
    bonus30000.advisorMonth !== 12 ||
    bonus30000.amount !== 30000 ||
    bonus30000.requiredAccumulatedInitialPoliciesByMonth12 !== 48) {
    validationErrors.push(createIssue(
      'invalid_development_bonus_48_policy_rule',
      'Development Bonus month 12 48-policy rule must pay 30000',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.month12AdditionalBonuses.additionalBonus30000`,
    ));
  }

  if (isPlainObject(bonus30000) && bonus30000.requiresTrainingAllowanceMonth12Won !== true) {
    validationErrors.push(createIssue(
      'missing_development_bonus_ta_month12_requirement',
      'Development Bonus 30000 additional requires Training Allowance month 12 won',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.month12AdditionalBonuses.additionalBonus30000.requiresTrainingAllowanceMonth12Won`,
    ));
  }

  if (!isPlainObject(bonus30000?.requiresAtLeastOnePaidPolicyEachMonth) ||
    bonus30000.requiresAtLeastOnePaidPolicyEachMonth.from !== 1 ||
    bonus30000.requiresAtLeastOnePaidPolicyEachMonth.to !== 12 ||
    bonus30000.maxZeroPolicyMonthsAllowed !== 1) {
    validationErrors.push(createIssue(
      'invalid_development_bonus_paid_policy_months_rule',
      'Development Bonus 30000 additional requires paid policy evidence for months 1 through 12 with at most one zero-policy month',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.month12AdditionalBonuses.additionalBonus30000`,
    ));
  }

  if (!Array.isArray(bonus30000?.zeroPolicyMonthsThatLoseAdditional) ||
    bonus30000.zeroPolicyMonthsThatLoseAdditional.length !== 3 ||
    ![10, 11, 12].every((month) => bonus30000.zeroPolicyMonthsThatLoseAdditional.includes(month))) {
    validationErrors.push(createIssue(
      'missing_development_bonus_zero_policy_month_10_12_exclusion',
      'Development Bonus 30000 additional must exclude zero-policy months 10, 11, or 12',
      `concepts.${DEVELOPMENT_BONUS_CONCEPT_KEY}.month12AdditionalBonuses.additionalBonus30000.zeroPolicyMonthsThatLoseAdditional`,
    ));
  }
}

function validateDraftCompleteness(rulePack, validationWarnings) {
  if (!hasOwn(rulePack, 'qualificationRules')) {
    validationWarnings.push(createIssue(
      'qualification_rules_allowed_missing_in_draft',
      'qualificationRules is allowed as draft warning, but must be added before official sealing',
      'qualificationRules',
    ));
  }
}

export function validateAdvisorDevelopmentRulePack(rulePack) {
  const validationErrors = [];
  const validationWarnings = [];

  if (!isPlainObject(rulePack)) {
    return {
      isValid: false,
      validationErrors: [
        createIssue(
          'invalid_rule_pack_object',
          'rulePack must be a plain object',
          null,
        ),
      ],
      validationWarnings,
    };
  }

  validateIdentity(rulePack, validationErrors);
  validateSourceEvidence(rulePack, validationErrors);
  validatePayoutTruthRule(rulePack, validationErrors);
  validateCountingAndWeightingRules(rulePack, validationErrors);
  validateTrainingAllowanceConcept(rulePack, validationErrors);
  validateDevelopmentBonusConcept(rulePack, validationErrors);
  validateDraftCompleteness(rulePack, validationWarnings);

  return {
    isValid: validationErrors.length === 0,
    validationErrors,
    validationWarnings,
  };
}

export {
  DEVELOPMENT_BONUS_CONCEPT_KEY,
  EXPECTED_RULE_PACK_ID,
  EXPECTED_SOURCE_EVIDENCE_REF,
  TRAINING_ALLOWANCE_CONCEPT_KEY,
};
