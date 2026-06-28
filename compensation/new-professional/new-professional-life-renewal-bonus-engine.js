const LIFE_RENEWAL_BONUS_CONCEPT_KEY = 'life-renewal-bonus';

const LIFE_RENEWAL_BONUS_STATUS = Object.freeze({
  CALCULATED_CANDIDATE: 'calculated_candidate',
  INELIGIBLE_LIFE_INITIAL_BONUS_REQUIRED: 'ineligible_life_initial_bonus_required',
  INELIGIBLE_IGC_GOAL_NOT_MET: 'ineligible_igc_goal_not_met',
  BLOCKED_MISSING_INPUT: 'blocked_missing_input',
  NOT_MODELED: 'not_modeled',
  INVALID_RULE_PACK: 'invalid_rule_pack',
});

const PAYOUT_TRUTH_RULE = 'commission_statement_required';
const PAYMENT_MODE = Object.freeze({
  MONTHLY_ADVANCE: 'monthly_advance',
  SEMESTER_SETTLEMENT: 'semester_settlement',
});

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

function getLifeRenewalConcept(rulePack) {
  return rulePack?.concepts?.[LIFE_RENEWAL_BONUS_CONCEPT_KEY] || null;
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
    conceptKey: LIFE_RENEWAL_BONUS_CONCEPT_KEY,
    status,
    reason,
    candidateAmount: calculation.payableCandidate ?? null,
    advisorFacts: advisorFacts ? clonePlain(advisorFacts) : null,
    eligibility: {
      lifeInitialBonusCalculated: null,
      igcGoalMet: null,
      ...eligibility,
    },
    calculation: {
      group: null,
      igcTier: null,
      candidateRate: null,
      accumulatedPaidRenewalPremium: null,
      calculatedRenewalBonusCandidate: null,
      priorPaidBonusesInSemester: null,
      payableCandidate: null,
      ...calculation,
    },
    explainability: clonePlain(explainability),
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
      reason: 'missing_rule_pack',
    };
  }

  const concept = getLifeRenewalConcept(rulePack);
  if (!isPlainObject(concept)) {
    return {
      valid: false,
      reason: 'missing_life_renewal_bonus_concept',
    };
  }

  if (!isPlainObject(concept.bonusRateByGroupAndIgcTable) || !isPlainObject(concept.igcTierMetadata)) {
    return {
      valid: false,
      reason: 'missing_life_renewal_bonus_tables',
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
      missingInputs: ['advisorFacts'],
    };
  }

  const requiredFields = [
    'semesterNumber',
    'semesterMonth',
    'paymentMode',
    'lifeInitialBonusCalculated',
    'accumulatedPaidRenewalPremium',
    'igc',
    'priorPaidBonusesInSemester',
  ];

  if (advisorFacts.paymentMode === PAYMENT_MODE.MONTHLY_ADVANCE) {
    requiredFields.push('lifeInitialEffectiveAdvanceGroup');
  } else if (advisorFacts.paymentMode === PAYMENT_MODE.SEMESTER_SETTLEMENT) {
    requiredFields.push('lifeInitialCurrentGroup');
  } else {
    requiredFields.push('paymentMode');
  }

  const missingInputs = requiredFields.filter((field) => isMissing(advisorFacts[field]));
  if (missingInputs.length > 0) {
    return {
      valid: false,
      missingInputs,
    };
  }

  const numericFields = [
    'semesterNumber',
    'semesterMonth',
    'accumulatedPaidRenewalPremium',
    'igc',
    'priorPaidBonusesInSemester',
  ];

  if (advisorFacts.paymentMode === PAYMENT_MODE.MONTHLY_ADVANCE) {
    numericFields.push('lifeInitialEffectiveAdvanceGroup');
  }

  if (advisorFacts.paymentMode === PAYMENT_MODE.SEMESTER_SETTLEMENT) {
    numericFields.push('lifeInitialCurrentGroup');
  }

  const invalidInputs = numericFields.filter((field) => !isNumber(advisorFacts[field]));
  if (invalidInputs.length > 0) {
    return {
      valid: false,
      missingInputs: invalidInputs,
    };
  }

  if (![1, 2].includes(advisorFacts.semesterNumber)) {
    return {
      valid: false,
      missingInputs: ['semesterNumber'],
    };
  }

  if (advisorFacts.semesterMonth < 1 || advisorFacts.semesterMonth > 6) {
    return {
      valid: false,
      missingInputs: ['semesterMonth'],
    };
  }

  if (typeof advisorFacts.lifeInitialBonusCalculated !== 'boolean') {
    return {
      valid: false,
      missingInputs: ['lifeInitialBonusCalculated'],
    };
  }

  return {
    valid: true,
    missingInputs: [],
  };
}

function resolveLifeRenewalIgcTier({ concept, igc } = {}) {
  const metadata = concept?.igcTierMetadata;
  const minimumIgc = metadata?.minimumIgc;

  if (!isNumber(igc) || !isNumber(minimumIgc)) return null;
  if (igc < minimumIgc) return null;
  if (igc >= 95.75) return { tierKey: '95.75', minimumIgc };
  if (igc >= 95) return { tierKey: '95', minimumIgc };
  if (igc >= 92.5) return { tierKey: '92.5', minimumIgc };
  return { tierKey: '91', minimumIgc };
}

function resolveLifeRenewalBonusRate({ concept, group, igc } = {}) {
  const tier = resolveLifeRenewalIgcTier({ concept, igc });
  const row = concept?.bonusRateByGroupAndIgcTable?.[String(group)];

  if (!tier || !isPlainObject(row) || !isNumber(row[tier.tierKey])) return null;

  return {
    group,
    rate: row[tier.tierKey],
    tierKey: tier.tierKey,
    minimumIgc: tier.minimumIgc,
  };
}

function resolveLifeRenewalGroupForPaymentMode({ advisorFacts } = {}) {
  if (advisorFacts?.paymentMode === PAYMENT_MODE.MONTHLY_ADVANCE) {
    return {
      group: advisorFacts.lifeInitialEffectiveAdvanceGroup,
      source: 'lifeInitialEffectiveAdvanceGroup',
    };
  }

  if (advisorFacts?.paymentMode === PAYMENT_MODE.SEMESTER_SETTLEMENT) {
    return {
      group: advisorFacts.lifeInitialCurrentGroup,
      source: 'lifeInitialCurrentGroup',
    };
  }

  return null;
}

function validateGroup(group) {
  return isNumber(group) && Number.isInteger(group) && group >= 1 && group <= 16;
}

function calculateNewProfessionalLifeRenewalBonusCandidate({ rulePack, advisorFacts } = {}) {
  const rulePackValidation = validateRulePack(rulePack);
  if (!rulePackValidation.valid) {
    return buildResult({
      status: rulePackValidation.reason === 'missing_rule_pack'
        ? LIFE_RENEWAL_BONUS_STATUS.NOT_MODELED
        : LIFE_RENEWAL_BONUS_STATUS.INVALID_RULE_PACK,
      reason: rulePackValidation.reason,
      advisorFacts,
      missingInputs: [rulePackValidation.reason],
    });
  }

  const factsValidation = validateAdvisorFacts(advisorFacts);
  if (!factsValidation.valid) {
    return buildResult({
      status: LIFE_RENEWAL_BONUS_STATUS.BLOCKED_MISSING_INPUT,
      reason: 'blocked_by_missing_or_unknown_input',
      advisorFacts,
      missingInputs: factsValidation.missingInputs,
    });
  }

  if (advisorFacts.lifeInitialBonusCalculated !== true) {
    return buildResult({
      status: LIFE_RENEWAL_BONUS_STATUS.INELIGIBLE_LIFE_INITIAL_BONUS_REQUIRED,
      reason: 'life_initial_bonus_required',
      advisorFacts,
      eligibility: {
        lifeInitialBonusCalculated: false,
      },
    });
  }

  const concept = rulePackValidation.concept;
  const groupResolution = resolveLifeRenewalGroupForPaymentMode({ advisorFacts });
  if (!groupResolution || !validateGroup(groupResolution.group)) {
    return buildResult({
      status: LIFE_RENEWAL_BONUS_STATUS.BLOCKED_MISSING_INPUT,
      reason: 'blocked_by_missing_or_invalid_life_initial_group',
      advisorFacts,
      missingInputs: [groupResolution?.source || 'lifeInitialGroup'],
    });
  }

  const tier = resolveLifeRenewalIgcTier({
    concept,
    igc: advisorFacts.igc,
  });

  if (!tier) {
    return buildResult({
      status: LIFE_RENEWAL_BONUS_STATUS.INELIGIBLE_IGC_GOAL_NOT_MET,
      reason: 'igc_below_minimum',
      advisorFacts,
      eligibility: {
        lifeInitialBonusCalculated: true,
        igcGoalMet: false,
      },
      calculation: {
        group: groupResolution.group,
        accumulatedPaidRenewalPremium: advisorFacts.accumulatedPaidRenewalPremium,
        priorPaidBonusesInSemester: advisorFacts.priorPaidBonusesInSemester,
      },
    });
  }

  const rate = resolveLifeRenewalBonusRate({
    concept,
    group: groupResolution.group,
    igc: advisorFacts.igc,
  });

  if (!rate) {
    return buildResult({
      status: LIFE_RENEWAL_BONUS_STATUS.INVALID_RULE_PACK,
      reason: 'missing_life_renewal_bonus_rate',
      advisorFacts,
      missingInputs: ['bonusRateByGroupAndIgcTable'],
    });
  }

  const calculatedRenewalBonusCandidate = roundMoney(
    advisorFacts.accumulatedPaidRenewalPremium * rate.rate,
  );
  const payableCandidate = roundMoney(
    calculatedRenewalBonusCandidate - advisorFacts.priorPaidBonusesInSemester,
  );

  return buildResult({
    status: LIFE_RENEWAL_BONUS_STATUS.CALCULATED_CANDIDATE,
    reason: null,
    advisorFacts,
    eligibility: {
      lifeInitialBonusCalculated: true,
      igcGoalMet: true,
    },
    calculation: {
      group: groupResolution.group,
      igcTier: rate.tierKey,
      candidateRate: rate.rate,
      accumulatedPaidRenewalPremium: advisorFacts.accumulatedPaidRenewalPremium,
      calculatedRenewalBonusCandidate,
      priorPaidBonusesInSemester: advisorFacts.priorPaidBonusesInSemester,
      payableCandidate,
    },
    explainability: {
      paymentMode: advisorFacts.paymentMode,
      groupSource: groupResolution.source,
      renewalOnlyCandidate: true,
      combinedVidaPaymentDeferredToFutureOrchestrator: true,
    },
  });
}

export {
  LIFE_RENEWAL_BONUS_CONCEPT_KEY,
  LIFE_RENEWAL_BONUS_STATUS,
  calculateNewProfessionalLifeRenewalBonusCandidate,
  resolveLifeRenewalBonusRate,
  resolveLifeRenewalGroupForPaymentMode,
  resolveLifeRenewalIgcTier,
};
