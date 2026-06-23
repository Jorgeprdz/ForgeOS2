const TRAINING_ALLOWANCE_CONCEPT_KEY = 'training-allowance';

const TRAINING_ALLOWANCE_STATUS = Object.freeze({
  ELIGIBLE: 'eligible',
  INELIGIBLE: 'ineligible',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown',
  NOT_MODELED: 'not_modeled',
});

const SUPPORTED_STRATEGIES = Object.freeze({
  BASE_BONUS: 'min_between_calculated_and_max_award',
  EXCESS_BONUS: 'apply_rate_to_excess_above_max_award',
  PAYMENT_DEDUCTION: 'subtract_prior_paid_bonuses_in_current_semester',
});

const EMPTY_ELIGIBILITY = Object.freeze({
  commissionGoalMet: null,
  accumulatedPolicyGoalMet: null,
  minimumLifePolicyGoalMet: null,
});

const EMPTY_CALCULATION = Object.freeze({
  accumulatedInitialCommission: null,
  bonusPercentage: null,
  baseBonusCalculated: null,
  baseBonusCapped: null,
  excessAmount: null,
  excessMultiplierRate: null,
  excessBonusCalculated: null,
  totalCalculatedCandidate: null,
  priorPaidBonusesInCurrentSemester: null,
  payableCandidate: null,
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function isMissing(value) {
  return value === undefined || value === null;
}

function isStrictNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function roundMoney(value) {
  if (!isStrictNumber(value)) return null;

  return Math.round((value + Number.EPSILON) * 100) / 100;
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

function clonePlain(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) return value;

  return JSON.parse(JSON.stringify(value));
}

function buildResult({
  status,
  reason = null,
  advisorMonth = null,
  semester = null,
  tableRow = null,
  inputFacts = {},
  eligibility = EMPTY_ELIGIBILITY,
  calculation = EMPTY_CALCULATION,
  warnings = [],
}) {
  return deepFreeze({
    status,
    reason,
    advisorMonth,
    semester,
    tableRow: tableRow ? clonePlain(tableRow) : null,
    inputFacts: clonePlain(inputFacts),
    eligibility: {
      ...EMPTY_ELIGIBILITY,
      ...eligibility,
    },
    calculation: {
      ...EMPTY_CALCULATION,
      ...calculation,
    },
    payoutTruth: false,
    payoutTruthRule: 'commission_statement_required',
    evidenceRequirements: ['commission_statement_required'],
    warnings: [...warnings],
  });
}

function getTrainingAllowanceConcept(input) {
  if (isPlainObject(input?.trainingAllowanceConcept)) {
    return input.trainingAllowanceConcept;
  }

  return input?.rulePack?.concepts?.[TRAINING_ALLOWANCE_CONCEPT_KEY] || null;
}

function assertSupportedStrategies(concept) {
  const rules = concept?.calculationRules;

  if (!isPlainObject(rules)) {
    return {
      isSupported: false,
      reason: 'missing_training_allowance_calculation_rules',
    };
  }

  if (rules.baseBonusStrategy !== SUPPORTED_STRATEGIES.BASE_BONUS) {
    return {
      isSupported: false,
      reason: 'unsupported_base_bonus_strategy',
    };
  }

  if (rules.excessBonusStrategy !== SUPPORTED_STRATEGIES.EXCESS_BONUS) {
    return {
      isSupported: false,
      reason: 'unsupported_excess_bonus_strategy',
    };
  }

  if (rules.paymentDeductionStrategy !== SUPPORTED_STRATEGIES.PAYMENT_DEDUCTION) {
    return {
      isSupported: false,
      reason: 'unsupported_payment_deduction_strategy',
    };
  }

  if (!isStrictNumber(rules.excessMultiplierRate)) {
    return {
      isSupported: false,
      reason: 'unsupported_or_missing_excess_multiplier_rate',
    };
  }

  return {
    isSupported: true,
    reason: null,
  };
}

function findAdvisorMonthRow(concept, advisorMonth) {
  if (!Array.isArray(concept?.table)) {
    return {
      row: null,
      reason: 'missing_training_allowance_table',
    };
  }

  const row = concept.table.find((candidate) => candidate?.advisorMonth === advisorMonth);

  if (!row) {
    return {
      row: null,
      reason: 'missing_training_allowance_table_row',
    };
  }

  return {
    row,
    reason: null,
  };
}

function validateTableRow(row) {
  const requiredFields = [
    'advisorMonth',
    'semester',
    'accumulatedCommissionGoal',
    'accumulatedPolicyGoal',
    'minimumLifePolicyGoal',
    'bonusPercentage',
    'maximumAward',
  ];

  for (const field of requiredFields) {
    if (!isStrictNumber(row?.[field])) {
      return {
        isValid: false,
        reason: `invalid_training_allowance_table_row_${field}`,
      };
    }
  }

  return {
    isValid: true,
    reason: null,
  };
}

function validateAdvisorFacts(advisorFacts) {
  const warnings = [];

  if (!isPlainObject(advisorFacts)) {
    return {
      status: TRAINING_ALLOWANCE_STATUS.BLOCKED,
      reason: 'missing_advisor_facts',
      facts: {},
      warnings,
    };
  }

  const requiredFields = [
    'advisorMonth',
    'accumulatedInitialCommission',
    'accumulatedPolicies',
    'accumulatedLifePolicies',
  ];

  for (const field of requiredFields) {
    if (!hasOwn(advisorFacts, field) || isMissing(advisorFacts[field])) {
      return {
        status: TRAINING_ALLOWANCE_STATUS.BLOCKED,
        reason: `missing_${field}`,
        facts: clonePlain(advisorFacts),
        warnings,
      };
    }
  }

  for (const field of requiredFields) {
    if (!isStrictNumber(advisorFacts[field])) {
      return {
        status: TRAINING_ALLOWANCE_STATUS.UNKNOWN,
        reason: `invalid_${field}`,
        facts: clonePlain(advisorFacts),
        warnings,
      };
    }
  }

  let priorPaidBonusesInCurrentSemester = advisorFacts.priorPaidBonusesInCurrentSemester;

  if (isMissing(priorPaidBonusesInCurrentSemester)) {
    priorPaidBonusesInCurrentSemester = 0;
    warnings.push({
      code: 'prior_paid_bonuses_defaulted_to_zero',
      message: 'priorPaidBonusesInCurrentSemester was missing and defaulted to 0',
      path: 'advisorFacts.priorPaidBonusesInCurrentSemester',
    });
  } else if (!isStrictNumber(priorPaidBonusesInCurrentSemester)) {
    return {
      status: TRAINING_ALLOWANCE_STATUS.UNKNOWN,
      reason: 'invalid_priorPaidBonusesInCurrentSemester',
      facts: clonePlain(advisorFacts),
      warnings,
    };
  }

  return {
    status: null,
    reason: null,
    facts: {
      advisorMonth: advisorFacts.advisorMonth,
      accumulatedInitialCommission: advisorFacts.accumulatedInitialCommission,
      accumulatedPolicies: advisorFacts.accumulatedPolicies,
      accumulatedLifePolicies: advisorFacts.accumulatedLifePolicies,
      priorPaidBonusesInCurrentSemester,
    },
    warnings,
  };
}

function evaluateTrainingAllowanceEligibility({ facts, row }) {
  const commissionGoalMet = facts.accumulatedInitialCommission >= row.accumulatedCommissionGoal;
  const accumulatedPolicyGoalMet = facts.accumulatedPolicies >= row.accumulatedPolicyGoal;
  const minimumLifePolicyGoalMet = facts.accumulatedLifePolicies >= row.minimumLifePolicyGoal;

  return {
    commissionGoalMet,
    accumulatedPolicyGoalMet,
    minimumLifePolicyGoalMet,
    isEligible: commissionGoalMet && accumulatedPolicyGoalMet && minimumLifePolicyGoalMet,
  };
}

function computeTrainingAllowanceFinancials({ facts, row, strategies }) {
  const baseBonusCalculated = roundMoney(facts.accumulatedInitialCommission * row.bonusPercentage);
  const baseBonusCapped = roundMoney(Math.min(baseBonusCalculated, row.maximumAward));
  const excessAmount = roundMoney(Math.max(baseBonusCalculated - row.maximumAward, 0));
  const excessBonusCalculated = roundMoney(excessAmount * strategies.excessMultiplierRate);
  const totalCalculatedCandidate = roundMoney(baseBonusCapped + excessBonusCalculated);
  const payableCandidate = roundMoney(Math.max(
    totalCalculatedCandidate - facts.priorPaidBonusesInCurrentSemester,
    0,
  ));

  return {
    accumulatedInitialCommission: facts.accumulatedInitialCommission,
    bonusPercentage: row.bonusPercentage,
    baseBonusCalculated,
    baseBonusCapped,
    excessAmount,
    excessMultiplierRate: strategies.excessMultiplierRate,
    excessBonusCalculated,
    totalCalculatedCandidate,
    priorPaidBonusesInCurrentSemester: facts.priorPaidBonusesInCurrentSemester,
    payableCandidate,
  };
}

function createIneligibleCalculation(facts, row, strategies) {
  return {
    accumulatedInitialCommission: facts.accumulatedInitialCommission,
    bonusPercentage: row.bonusPercentage,
    excessMultiplierRate: strategies.excessMultiplierRate,
    priorPaidBonusesInCurrentSemester: facts.priorPaidBonusesInCurrentSemester,
    payableCandidate: null,
  };
}

function calculateTrainingAllowanceCandidate(input = {}) {
  const concept = getTrainingAllowanceConcept(input);

  if (!concept) {
    return buildResult({
      status: TRAINING_ALLOWANCE_STATUS.NOT_MODELED,
      reason: isPlainObject(input?.rulePack)
        ? 'missing_training_allowance_concept'
        : 'missing_rule_pack_or_training_allowance_concept',
      inputFacts: input?.advisorFacts || {},
    });
  }

  const strategyCheck = assertSupportedStrategies(concept);

  if (!strategyCheck.isSupported) {
    return buildResult({
      status: TRAINING_ALLOWANCE_STATUS.NOT_MODELED,
      reason: strategyCheck.reason,
      inputFacts: input?.advisorFacts || {},
    });
  }

  const factsCheck = validateAdvisorFacts(input.advisorFacts);

  if (factsCheck.status) {
    return buildResult({
      status: factsCheck.status,
      reason: factsCheck.reason,
      inputFacts: factsCheck.facts,
      warnings: factsCheck.warnings,
    });
  }

  const facts = factsCheck.facts;

  if (facts.advisorMonth < 1 || facts.advisorMonth > 12) {
    return buildResult({
      status: TRAINING_ALLOWANCE_STATUS.NOT_MODELED,
      reason: 'advisor_month_not_modeled',
      advisorMonth: facts.advisorMonth,
      inputFacts: facts,
      warnings: factsCheck.warnings,
    });
  }

  const { row, reason: rowReason } = findAdvisorMonthRow(concept, facts.advisorMonth);

  if (!row) {
    return buildResult({
      status: TRAINING_ALLOWANCE_STATUS.NOT_MODELED,
      reason: rowReason,
      advisorMonth: facts.advisorMonth,
      inputFacts: facts,
      warnings: factsCheck.warnings,
    });
  }

  const rowValidation = validateTableRow(row);

  if (!rowValidation.isValid) {
    return buildResult({
      status: TRAINING_ALLOWANCE_STATUS.NOT_MODELED,
      reason: rowValidation.reason,
      advisorMonth: facts.advisorMonth,
      semester: row?.semester ?? null,
      tableRow: row,
      inputFacts: facts,
      warnings: factsCheck.warnings,
    });
  }

  const eligibilityResult = evaluateTrainingAllowanceEligibility({ facts, row });

  const eligibility = {
    commissionGoalMet: eligibilityResult.commissionGoalMet,
    accumulatedPolicyGoalMet: eligibilityResult.accumulatedPolicyGoalMet,
    minimumLifePolicyGoalMet: eligibilityResult.minimumLifePolicyGoalMet,
  };

  if (!eligibilityResult.isEligible) {
    return buildResult({
      status: TRAINING_ALLOWANCE_STATUS.INELIGIBLE,
      reason: 'training_allowance_goals_not_met',
      advisorMonth: facts.advisorMonth,
      semester: row.semester,
      tableRow: row,
      inputFacts: facts,
      eligibility,
      calculation: createIneligibleCalculation(facts, row, concept.calculationRules),
      warnings: factsCheck.warnings,
    });
  }

  return buildResult({
    status: TRAINING_ALLOWANCE_STATUS.ELIGIBLE,
    reason: null,
    advisorMonth: facts.advisorMonth,
    semester: row.semester,
    tableRow: row,
    inputFacts: facts,
    eligibility,
    calculation: computeTrainingAllowanceFinancials({
      facts,
      row,
      strategies: concept.calculationRules,
    }),
    warnings: factsCheck.warnings,
  });
}

export {
  TRAINING_ALLOWANCE_CONCEPT_KEY,
  TRAINING_ALLOWANCE_STATUS,
  SUPPORTED_STRATEGIES,
  calculateTrainingAllowanceCandidate,
  computeTrainingAllowanceFinancials,
  evaluateTrainingAllowanceEligibility,
};
