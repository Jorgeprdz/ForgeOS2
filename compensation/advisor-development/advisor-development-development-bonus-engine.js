import {
  RELATIONSHIP_BONUS_READINESS_STATUS,
} from './advisor-relationship-bonus-readiness-gate.js';

const DEVELOPMENT_BONUS_CONCEPT_KEY = 'development-bonus';

const DEVELOPMENT_BONUS_STATUS = Object.freeze({
  CALCULATED_CANDIDATE: 'calculated_candidate',
  INELIGIBLE: 'ineligible',
  BLOCKED: 'blocked',
  PENDING: 'pending',
  UNKNOWN: 'unknown',
  NOT_MODELED: 'not_modeled',
});

const PAYOUT_TRUTH_RULE = 'commission_statement_required';

const EMPTY_CALCULATION = Object.freeze({
  validPolicyCount: null,
  tierMatched: null,
  baseAmount: null,
  developerShare: null,
  sharedBaseAmount: null,
  month12AdditionalBeforeShare: null,
  month12AdditionalAfterShare: null,
  candidateAmountBeforeShare: null,
  candidateAmount: null,
});

const EMPTY_MONTH_12_ADDITIONAL = Object.freeze({
  bonus20000Eligible: null,
  additionalBonus30000Eligible: null,
  accumulatedInitialPoliciesByMonth12: null,
  trainingAllowanceMonth12Won: null,
  zeroPolicyMonths: null,
  disallowedZeroPolicyMonths: null,
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStrictNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isMissing(value) {
  return value === undefined || value === null;
}

function clonePlain(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) return value;

  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) return value;

  Object.freeze(value);

  for (const child of Object.values(value)) {
    if ((isPlainObject(child) || Array.isArray(child)) && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }

  return value;
}

function roundMoney(value) {
  if (!isStrictNumber(value)) return null;

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getWarnings(developmentBonusReadinessResult) {
  if (!Array.isArray(developmentBonusReadinessResult?.warnings)) {
    return [];
  }

  return clonePlain(developmentBonusReadinessResult.warnings);
}

function buildResult({
  status,
  reason = null,
  advisorMonth = null,
  inputReadiness = null,
  calculation = {},
  month12Additional = {},
  blockedReasons = [],
  missingInputs = [],
  warnings = [],
  metadata = {},
}) {
  const normalizedCalculation = {
    ...EMPTY_CALCULATION,
    ...calculation,
  };

  return deepFreeze({
    conceptKey: DEVELOPMENT_BONUS_CONCEPT_KEY,
    status,
    reason,
    advisorMonth,
    candidateAmount: normalizedCalculation.candidateAmount,
    blockedReasons: [...blockedReasons],
    missingInputs: [...missingInputs],
    inputReadiness: inputReadiness ? clonePlain(inputReadiness) : null,
    calculation: normalizedCalculation,
    payoutTruth: false,
    payoutTruthRule: PAYOUT_TRUTH_RULE,
    evidenceRequirements: [PAYOUT_TRUTH_RULE],
    warnings: [...warnings],
    metadata: {
      advisorMonth,
      ...metadata,
      month12Additional: {
        ...EMPTY_MONTH_12_ADDITIONAL,
        ...month12Additional,
      },
    },
  });
}

function getDevelopmentBonusConcept(rulePack) {
  return rulePack?.concepts?.[DEVELOPMENT_BONUS_CONCEPT_KEY] || null;
}

function mapReadinessStatus(developmentBonusReadinessResult) {
  if (!isPlainObject(developmentBonusReadinessResult)) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.BLOCKED,
      reason: 'blocked_by_missing_development_bonus_readiness',
      blockedReasons: ['blocked_by_missing_development_bonus_readiness'],
      missingInputs: ['developmentBonusReadinessResult'],
    };
  }

  const readinessStatus = developmentBonusReadinessResult.status;

  if (readinessStatus === RELATIONSHIP_BONUS_READINESS_STATUS.READY_FOR_CANDIDATE_CALCULATION) {
    return null;
  }

  if (readinessStatus === RELATIONSHIP_BONUS_READINESS_STATUS.PENDING) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.PENDING,
      reason: 'pending_development_bonus_readiness',
      blockedReasons: ['pending_development_bonus_readiness'],
    };
  }

  if (readinessStatus === RELATIONSHIP_BONUS_READINESS_STATUS.BLOCKED) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.BLOCKED,
      reason: 'blocked_by_development_bonus_readiness',
      blockedReasons: ['blocked_by_development_bonus_readiness'],
    };
  }

  if (readinessStatus === RELATIONSHIP_BONUS_READINESS_STATUS.UNKNOWN) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.UNKNOWN,
      reason: 'unknown_development_bonus_readiness',
      blockedReasons: ['unknown_development_bonus_readiness'],
    };
  }

  if (
    readinessStatus === RELATIONSHIP_BONUS_READINESS_STATUS.NOT_MODELED
    || readinessStatus === 'not_modelled'
  ) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.NOT_MODELED,
      reason: 'development_bonus_readiness_not_modeled',
      blockedReasons: ['development_bonus_readiness_not_modeled'],
    };
  }

  return {
    status: DEVELOPMENT_BONUS_STATUS.UNKNOWN,
    reason: 'unknown_development_bonus_readiness_status',
    blockedReasons: ['unknown_development_bonus_readiness_status'],
  };
}

function validateMonthlyBonus(concept) {
  const monthlyBonus = concept?.monthlyBonus;

  if (!isPlainObject(monthlyBonus)) {
    return {
      isValid: false,
      reason: 'malformed_development_bonus_monthly_bonus',
    };
  }

  const range = monthlyBonus.advisorMonthRange;

  if (!isPlainObject(range) || !isStrictNumber(range.from) || !isStrictNumber(range.to)) {
    return {
      isValid: false,
      reason: 'malformed_development_bonus_month_range',
    };
  }

  if (!Array.isArray(monthlyBonus.tiers) || monthlyBonus.tiers.length === 0) {
    return {
      isValid: false,
      reason: 'malformed_development_bonus_tier_table',
    };
  }

  for (const tier of monthlyBonus.tiers) {
    if (!isPlainObject(tier)) {
      return {
        isValid: false,
        reason: 'malformed_development_bonus_tier_table',
      };
    }

    if (!isStrictNumber(tier.minimumPolicies) || !isStrictNumber(tier.amount)) {
      return {
        isValid: false,
        reason: 'malformed_development_bonus_tier_table',
      };
    }
  }

  const sortedTiers = [...monthlyBonus.tiers]
    .sort((left, right) => right.minimumPolicies - left.minimumPolicies);
  const topTier = sortedTiers[0];

  if (topTier.appliesToCountAndAbove !== true) {
    return {
      isValid: false,
      reason: 'malformed_development_bonus_top_tier',
    };
  }

  return {
    isValid: true,
    monthlyBonus,
    sortedTiers,
  };
}

function matchDevelopmentBonusTier({ sortedTiers, validPolicyCount }) {
  return sortedTiers.find((tier) => validPolicyCount >= tier.minimumPolicies) || null;
}

function validateDeveloperShare(concept, developerShare) {
  if (isMissing(developerShare)) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.BLOCKED,
      reason: 'missing_developerShare',
      blockedReasons: ['missing_developerShare'],
      missingInputs: ['developerShare'],
    };
  }

  if (!isStrictNumber(developerShare)) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.UNKNOWN,
      reason: 'invalid_developerShare',
      blockedReasons: ['invalid_developerShare'],
    };
  }

  const supportedShares = Array.isArray(concept?.supportedDeveloperShares)
    ? concept.supportedDeveloperShares
    : [];

  if (!supportedShares.includes(developerShare)) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.NOT_MODELED,
      reason: 'unsupported_developerShare',
      blockedReasons: ['unsupported_developerShare'],
    };
  }

  return {
    status: null,
    reason: null,
  };
}

function monthlyPaidPolicyCountsFrom(input = {}) {
  if (Array.isArray(input.monthlyPaidPolicyCountsByAdvisorMonth)) {
    return input.monthlyPaidPolicyCountsByAdvisorMonth.map((entry) => ({
      advisorMonth: entry?.advisorMonth,
      paidPolicyCount: entry?.paidPolicyCount,
    }));
  }

  if (Array.isArray(input.monthlyPaidPolicyCounts)) {
    return input.monthlyPaidPolicyCounts.map((paidPolicyCount, index) => ({
      advisorMonth: index + 1,
      paidPolicyCount,
    }));
  }

  return null;
}

function evaluateMonth12AdditionalBonuses({ concept, advisorFacts = {} } = {}) {
  const rules = concept?.month12AdditionalBonuses;
  const warnings = [];
  const result = {
    amountBeforeShare: 0,
    details: {
      bonus20000Eligible: false,
      additionalBonus30000Eligible: false,
      accumulatedInitialPoliciesByMonth12: null,
      trainingAllowanceMonth12Won: null,
      zeroPolicyMonths: null,
      disallowedZeroPolicyMonths: null,
    },
    warnings,
  };

  if (!isPlainObject(rules)) {
    warnings.push({
      code: 'development_bonus_month12_additional_rules_not_modeled',
    });
    return result;
  }

  const accumulatedPolicies = advisorFacts.accumulatedInitialPoliciesByMonth12 ??
    advisorFacts.accumulatedInitialPolicies;
  const trainingAllowanceWon = advisorFacts.trainingAllowanceMonth12Won;

  result.details.accumulatedInitialPoliciesByMonth12 = isStrictNumber(accumulatedPolicies)
    ? accumulatedPolicies
    : null;
  result.details.trainingAllowanceMonth12Won = typeof trainingAllowanceWon === 'boolean'
    ? trainingAllowanceWon
    : null;

  if (!isStrictNumber(accumulatedPolicies)) {
    warnings.push({
      code: 'missing_accumulated_initial_policies_by_month12',
    });
    return result;
  }

  if (typeof trainingAllowanceWon !== 'boolean') {
    warnings.push({
      code: 'missing_training_allowance_month12_won',
    });
    return result;
  }

  const bonus20000 = rules.bonus20000;
  if (
    isPlainObject(bonus20000) &&
    trainingAllowanceWon === true &&
    accumulatedPolicies >= bonus20000.requiredAccumulatedInitialPoliciesByMonth12
  ) {
    result.amountBeforeShare += bonus20000.amount;
    result.details.bonus20000Eligible = true;
  }

  const bonus30000 = rules.additionalBonus30000;
  if (!isPlainObject(bonus30000)) {
    warnings.push({
      code: 'development_bonus_30000_rule_not_modeled',
    });
    return result;
  }

  const monthlyCounts = monthlyPaidPolicyCountsFrom(advisorFacts);
  if (!monthlyCounts) {
    warnings.push({
      code: 'missing_monthly_paid_policy_counts_for_30000_additional',
    });
    return result;
  }

  const continuityRange = bonus30000.requiresAtLeastOnePaidPolicyEachMonth || {};
  const from = continuityRange.from;
  const to = continuityRange.to;
  const requiredMonths = [];

  for (let advisorMonth = from; advisorMonth <= to; advisorMonth += 1) {
    requiredMonths.push(advisorMonth);
  }

  const countsByMonth = new Map(monthlyCounts.map((entry) => [
    entry.advisorMonth,
    entry.paidPolicyCount,
  ]));

  if (!requiredMonths.every((advisorMonth) => isStrictNumber(countsByMonth.get(advisorMonth)))) {
    warnings.push({
      code: 'unknown_monthly_paid_policy_count_for_30000_additional',
    });
    return result;
  }

  const zeroPolicyMonths = requiredMonths.filter((advisorMonth) => countsByMonth.get(advisorMonth) === 0);
  const disallowedZeroPolicyMonths = zeroPolicyMonths.filter((advisorMonth) => (
    bonus30000.zeroPolicyMonthsThatLoseAdditional || []
  ).includes(advisorMonth));

  result.details.zeroPolicyMonths = zeroPolicyMonths;
  result.details.disallowedZeroPolicyMonths = disallowedZeroPolicyMonths;

  if (
    trainingAllowanceWon === true &&
    accumulatedPolicies >= bonus30000.requiredAccumulatedInitialPoliciesByMonth12 &&
    zeroPolicyMonths.length <= bonus30000.maxZeroPolicyMonthsAllowed &&
    disallowedZeroPolicyMonths.length === 0
  ) {
    result.amountBeforeShare += bonus30000.amount;
    result.details.additionalBonus30000Eligible = true;
  }

  return result;
}

function computeDevelopmentBonusFinancials({ concept, developmentBonusReadinessResult, advisorFacts }) {
  const monthlyValidation = validateMonthlyBonus(concept);

  if (!monthlyValidation.isValid) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.NOT_MODELED,
      reason: monthlyValidation.reason,
      blockedReasons: [monthlyValidation.reason],
    };
  }

  const advisorMonth = advisorFacts.advisorMonth;
  const range = monthlyValidation.monthlyBonus.advisorMonthRange;

  if (advisorMonth < range.from || advisorMonth > range.to) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.NOT_MODELED,
      reason: 'advisor_month_not_modeled_for_development_bonus',
      calculation: {
        candidateAmount: null,
      },
    };
  }

  const validPolicyCount = developmentBonusReadinessResult?.readiness?.validPolicyCount;

  if (isMissing(validPolicyCount)) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.BLOCKED,
      reason: 'missing_validPolicyCount',
      blockedReasons: ['missing_validPolicyCount'],
      missingInputs: ['validPolicyCount'],
      calculation: {
        validPolicyCount: null,
        candidateAmount: null,
      },
    };
  }

  if (!isStrictNumber(validPolicyCount)) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.UNKNOWN,
      reason: 'invalid_validPolicyCount',
      blockedReasons: ['invalid_validPolicyCount'],
      calculation: {
        validPolicyCount: null,
        candidateAmount: null,
      },
    };
  }

  const developerShare = developmentBonusReadinessResult?.readiness?.developerShare;
  const shareGate = validateDeveloperShare(concept, developerShare);

  if (shareGate.status) {
    return {
      ...shareGate,
      calculation: {
        validPolicyCount,
        developerShare: isStrictNumber(developerShare) ? developerShare : null,
        candidateAmount: null,
      },
    };
  }

  const tierMatched = matchDevelopmentBonusTier({
    sortedTiers: monthlyValidation.sortedTiers,
    validPolicyCount,
  });

  if (!tierMatched) {
    return {
      status: DEVELOPMENT_BONUS_STATUS.INELIGIBLE,
      reason: 'development_bonus_policy_threshold_not_met',
      calculation: {
        validPolicyCount,
        tierMatched: null,
        baseAmount: null,
        developerShare,
        sharedBaseAmount: null,
        candidateAmountBeforeShare: null,
        candidateAmount: null,
      },
    };
  }

  const month12Additional = advisorMonth === 12
    ? evaluateMonth12AdditionalBonuses({ concept, advisorFacts })
    : {
      amountBeforeShare: 0,
      details: {},
      warnings: [],
    };
  const baseAmount = tierMatched.amount;
  const candidateAmountBeforeShare = baseAmount + month12Additional.amountBeforeShare;
  const sharedBaseAmount = roundMoney(baseAmount * developerShare);
  const month12AdditionalAfterShare = roundMoney(month12Additional.amountBeforeShare * developerShare);
  const candidateAmount = roundMoney(candidateAmountBeforeShare * developerShare);

  return {
    status: DEVELOPMENT_BONUS_STATUS.CALCULATED_CANDIDATE,
    reason: null,
    calculation: {
      validPolicyCount,
      tierMatched: clonePlain(tierMatched),
      baseAmount,
      developerShare,
      sharedBaseAmount,
      month12AdditionalBeforeShare: month12Additional.amountBeforeShare,
      month12AdditionalAfterShare,
      candidateAmountBeforeShare,
      candidateAmount,
    },
    month12Additional: month12Additional.details,
    warnings: month12Additional.warnings,
  };
}

function calculateAdvisorDevelopmentDevelopmentBonusCandidate(input = {}) {
  if (!isPlainObject(input.rulePack)) {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.NOT_MODELED,
      reason: 'missing_rule_pack',
      blockedReasons: ['missing_rule_pack'],
      missingInputs: ['rulePack'],
      inputReadiness: input.developmentBonusReadinessResult,
    });
  }

  const concept = getDevelopmentBonusConcept(input.rulePack);

  if (!concept) {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.NOT_MODELED,
      reason: 'missing_development_bonus_concept',
      blockedReasons: ['missing_development_bonus_concept'],
      inputReadiness: input.developmentBonusReadinessResult,
    });
  }

  const readinessGate = mapReadinessStatus(input.developmentBonusReadinessResult);

  if (readinessGate) {
    return buildResult({
      status: readinessGate.status,
      reason: readinessGate.reason,
      inputReadiness: input.developmentBonusReadinessResult,
      blockedReasons: readinessGate.blockedReasons || [],
      missingInputs: readinessGate.missingInputs || [],
      warnings: getWarnings(input.developmentBonusReadinessResult),
    });
  }

  const advisorMonth = input.advisorFacts?.advisorMonth;

  if (isMissing(advisorMonth)) {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.BLOCKED,
      reason: 'missing_advisorMonth',
      inputReadiness: input.developmentBonusReadinessResult,
      blockedReasons: ['missing_advisorMonth'],
      missingInputs: ['advisorMonth'],
      warnings: getWarnings(input.developmentBonusReadinessResult),
    });
  }

  if (!isStrictNumber(advisorMonth)) {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.UNKNOWN,
      reason: 'invalid_advisorMonth',
      inputReadiness: input.developmentBonusReadinessResult,
      blockedReasons: ['invalid_advisorMonth'],
      warnings: getWarnings(input.developmentBonusReadinessResult),
    });
  }

  const financials = computeDevelopmentBonusFinancials({
    concept,
    developmentBonusReadinessResult: input.developmentBonusReadinessResult,
    advisorFacts: input.advisorFacts,
  });

  return buildResult({
    status: financials.status,
    reason: financials.reason,
    advisorMonth,
    inputReadiness: input.developmentBonusReadinessResult,
    calculation: financials.calculation || EMPTY_CALCULATION,
    month12Additional: financials.month12Additional || EMPTY_MONTH_12_ADDITIONAL,
    blockedReasons: financials.blockedReasons || [],
    missingInputs: financials.missingInputs || [],
    warnings: [
      ...getWarnings(input.developmentBonusReadinessResult),
      ...(financials.warnings || []),
    ],
    metadata: {
      validPolicyCount: financials.calculation?.validPolicyCount ?? null,
      baseAmount: financials.calculation?.baseAmount ?? null,
      developerShare: financials.calculation?.developerShare ?? null,
    },
  });
}

export {
  DEVELOPMENT_BONUS_CONCEPT_KEY,
  DEVELOPMENT_BONUS_STATUS,
  calculateAdvisorDevelopmentDevelopmentBonusCandidate,
  computeDevelopmentBonusFinancials,
  matchDevelopmentBonusTier,
};
