const GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_KEY =
  'gmmi-initial-premium-growth-annual-bonus';

const GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS = Object.freeze({
  CALCULATED_CANDIDATE: 'calculated_candidate',
  INELIGIBLE_GMMI_INITIAL_PREMIUM_GROWTH_GOAL_NOT_MET:
    'ineligible_gmmi_initial_premium_growth_goal_not_met',
  BLOCKED_MISSING_INPUT: 'blocked_missing_input',
  INVALID_RULE_PACK: 'invalid_rule_pack',
  NOT_MODELED: 'not_modeled',
});

const PAYOUT_TRUTH_RULE = 'commission_statement_required';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isMissing(value) {
  return value === null || value === undefined;
}

function clonePlain(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) return value;

  return JSON.parse(JSON.stringify(value));
}

function roundMoney(value) {
  if (!isNumber(value)) return null;

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getConcept(rulePack) {
  return rulePack?.concepts?.[GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_KEY] || null;
}

function buildResult({
  status,
  reason = null,
  advisorFacts = null,
  eligibility = {},
  calculation = {},
  explainability = {},
  missingInputs = [],
  warnings = [],
} = {}) {
  return Object.freeze({
    conceptKey: GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_KEY,
    status,
    reason,
    candidateAmount: calculation.payableCandidate ?? null,
    advisorFacts: advisorFacts ? clonePlain(advisorFacts) : null,
    eligibility: {
      growthGoalMet: null,
      ...eligibility,
    },
    calculation: {
      contestYear: null,
      currentContestYearEligibleGmmiInitialNetPremium: null,
      previousContestYearEligibleGmmiInitialNetPremium: null,
      growthRate: null,
      growthRatePercent: null,
      selectedTier: null,
      candidateRate: null,
      annualGmmiInitialPremiumMonthlyBonusBase: null,
      calculatedGmmiInitialPremiumGrowthAnnualBonusCandidate: null,
      payableCandidate: null,
      ...calculation,
    },
    explainability: {
      payoutTruth: false,
      ...clonePlain(explainability),
    },
    missingInputs: [...missingInputs],
    warnings: [...warnings],
    payoutTruth: false,
    payoutTruthRule: PAYOUT_TRUTH_RULE,
    evidenceRequirements: [PAYOUT_TRUTH_RULE],
  });
}

function validateRulePack(rulePack) {
  if (!isPlainObject(rulePack)) {
    return {
      valid: false,
      status: GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.NOT_MODELED,
      reason: 'missing_rule_pack',
    };
  }

  const concept = getConcept(rulePack);
  if (!isPlainObject(concept)) {
    return {
      valid: false,
      status: GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.NOT_MODELED,
      reason: 'missing_gmmi_initial_premium_growth_annual_bonus_concept',
    };
  }

  const table = concept.gmmiInitialPremiumGrowthAnnualBonusTable;
  if (!isPlainObject(table) || !Array.isArray(table.tiers) || table.tiers.length !== 3) {
    return {
      valid: false,
      status: GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.INVALID_RULE_PACK,
      reason: 'invalid_rule_pack',
    };
  }

  const tiersValid = table.tiers.every((tier) => (
    isPlainObject(tier) &&
    isNumber(tier.minimumGrowthRate) &&
    (isNumber(tier.maximumGrowthRateExclusive) || tier.maximumGrowthRateExclusive === null) &&
    isNumber(tier.bonusRate)
  ));
  if (!tiersValid) {
    return {
      valid: false,
      status: GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.INVALID_RULE_PACK,
      reason: 'invalid_rule_pack',
    };
  }

  return {
    valid: true,
    concept,
  };
}

function validateAdvisorFacts(advisorFacts = {}) {
  if (!isPlainObject(advisorFacts)) {
    return {
      valid: false,
      reason: 'source_evidence_missing',
      missingInputs: ['advisorFacts'],
    };
  }

  const requiredFields = [
    'contestYear',
    'currentContestYearEligibleGmmiInitialNetPremium',
    'previousContestYearEligibleGmmiInitialNetPremium',
    'annualGmmiInitialPremiumMonthlyBonusBase',
    'sourceEvidence',
  ];
  const missingInputs = requiredFields.filter((field) => isMissing(advisorFacts[field]));
  if (missingInputs.length > 0) {
    return {
      valid: false,
      reason: missingInputs[0],
      missingInputs,
    };
  }

  const numericFields = [
    'contestYear',
    'currentContestYearEligibleGmmiInitialNetPremium',
    'previousContestYearEligibleGmmiInitialNetPremium',
    'annualGmmiInitialPremiumMonthlyBonusBase',
  ];
  const invalidInputs = numericFields.filter((field) => !isNumber(advisorFacts[field]));
  if (invalidInputs.length > 0) {
    return {
      valid: false,
      reason: invalidInputs[0],
      missingInputs: invalidInputs,
    };
  }

  if (advisorFacts.previousContestYearEligibleGmmiInitialNetPremium <= 0) {
    return {
      valid: false,
      reason: 'previous_contest_year_premium_must_be_greater_than_zero',
      missingInputs: ['previousContestYearEligibleGmmiInitialNetPremium'],
    };
  }

  if (advisorFacts.sourceEvidence !== PAYOUT_TRUTH_RULE) {
    return {
      valid: false,
      reason: 'source_evidence_invalid',
      missingInputs: ['sourceEvidence'],
    };
  }

  return {
    valid: true,
    missingInputs: [],
  };
}

function calculateGmmiInitialPremiumGrowthRate({
  currentContestYearEligibleGmmiInitialNetPremium,
  previousContestYearEligibleGmmiInitialNetPremium,
} = {}) {
  if (!isNumber(currentContestYearEligibleGmmiInitialNetPremium) ||
    !isNumber(previousContestYearEligibleGmmiInitialNetPremium) ||
    previousContestYearEligibleGmmiInitialNetPremium <= 0) {
    return null;
  }

  return (
    currentContestYearEligibleGmmiInitialNetPremium -
    previousContestYearEligibleGmmiInitialNetPremium
  ) / previousContestYearEligibleGmmiInitialNetPremium;
}

function resolveGmmiInitialPremiumGrowthAnnualTier({ concept, growthRate } = {}) {
  const tiers = concept?.gmmiInitialPremiumGrowthAnnualBonusTable?.tiers;
  if (!Array.isArray(tiers) || !isNumber(growthRate)) return null;

  return tiers.find((tier) => (
    growthRate >= tier.minimumGrowthRate &&
    (tier.maximumGrowthRateExclusive === null || growthRate < tier.maximumGrowthRateExclusive)
  )) || null;
}

function reasonForBlockedInput(reason) {
  const reasonMap = {
    currentContestYearEligibleGmmiInitialNetPremium:
      'current_contest_year_eligible_gmmi_initial_net_premium_missing',
    previousContestYearEligibleGmmiInitialNetPremium:
      'previous_contest_year_eligible_gmmi_initial_net_premium_missing',
    annualGmmiInitialPremiumMonthlyBonusBase:
      'annual_gmmi_initial_premium_monthly_bonus_base_missing',
    sourceEvidence: 'source_evidence_missing',
  };

  return reasonMap[reason] || reason;
}

function calculateNewProfessionalGmmiInitialPremiumGrowthAnnualBonusCandidate({
  rulePack,
  advisorFacts,
} = {}) {
  const rulePackValidation = validateRulePack(rulePack);
  if (!rulePackValidation.valid) {
    return buildResult({
      status: rulePackValidation.status,
      reason: rulePackValidation.reason,
      advisorFacts,
      missingInputs: [rulePackValidation.reason],
    });
  }

  const factsValidation = validateAdvisorFacts(advisorFacts);
  if (!factsValidation.valid) {
    return buildResult({
      status: GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.BLOCKED_MISSING_INPUT,
      reason: reasonForBlockedInput(factsValidation.reason),
      advisorFacts,
      missingInputs: factsValidation.missingInputs,
    });
  }

  const growthRate = calculateGmmiInitialPremiumGrowthRate({
    currentContestYearEligibleGmmiInitialNetPremium:
      advisorFacts.currentContestYearEligibleGmmiInitialNetPremium,
    previousContestYearEligibleGmmiInitialNetPremium:
      advisorFacts.previousContestYearEligibleGmmiInitialNetPremium,
  });
  const selectedTier = resolveGmmiInitialPremiumGrowthAnnualTier({
    concept: rulePackValidation.concept,
    growthRate,
  });

  if (!selectedTier) {
    return buildResult({
      status: GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS
        .INELIGIBLE_GMMI_INITIAL_PREMIUM_GROWTH_GOAL_NOT_MET,
      reason: 'growth_goal_not_met',
      advisorFacts,
      eligibility: {
        growthGoalMet: false,
      },
      calculation: {
        contestYear: advisorFacts.contestYear,
        currentContestYearEligibleGmmiInitialNetPremium:
          advisorFacts.currentContestYearEligibleGmmiInitialNetPremium,
        previousContestYearEligibleGmmiInitialNetPremium:
          advisorFacts.previousContestYearEligibleGmmiInitialNetPremium,
        growthRate,
        growthRatePercent: roundMoney(growthRate * 100),
        annualGmmiInitialPremiumMonthlyBonusBase:
          advisorFacts.annualGmmiInitialPremiumMonthlyBonusBase,
      },
      explainability: {
        sourceEvidence: advisorFacts.sourceEvidence,
        growthGoalMet: false,
      },
    });
  }

  const calculatedGmmiInitialPremiumGrowthAnnualBonusCandidate = roundMoney(
    advisorFacts.annualGmmiInitialPremiumMonthlyBonusBase * selectedTier.bonusRate,
  );

  return buildResult({
    status: GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.CALCULATED_CANDIDATE,
    reason: 'gmmi_initial_premium_growth_annual_bonus_calculated',
    advisorFacts,
    eligibility: {
      growthGoalMet: true,
    },
    calculation: {
      contestYear: advisorFacts.contestYear,
      currentContestYearEligibleGmmiInitialNetPremium:
        advisorFacts.currentContestYearEligibleGmmiInitialNetPremium,
      previousContestYearEligibleGmmiInitialNetPremium:
        advisorFacts.previousContestYearEligibleGmmiInitialNetPremium,
      growthRate,
      growthRatePercent: roundMoney(growthRate * 100),
      selectedTier: selectedTier.tier,
      candidateRate: selectedTier.bonusRate,
      annualGmmiInitialPremiumMonthlyBonusBase:
        advisorFacts.annualGmmiInitialPremiumMonthlyBonusBase,
      calculatedGmmiInitialPremiumGrowthAnnualBonusCandidate,
      payableCandidate: calculatedGmmiInitialPremiumGrowthAnnualBonusCandidate,
    },
    explainability: {
      sourceEvidence: advisorFacts.sourceEvidence,
      growthGoalMet: true,
    },
  });
}

export {
  GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_KEY,
  GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS,
  calculateGmmiInitialPremiumGrowthRate,
  calculateNewProfessionalGmmiInitialPremiumGrowthAnnualBonusCandidate,
  resolveGmmiInitialPremiumGrowthAnnualTier,
};
