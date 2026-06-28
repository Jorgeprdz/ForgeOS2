import {
  LIFE_INITIAL_BONUS_STATUS,
  calculateNewProfessionalLifeInitialBonusCandidate,
} from './new-professional-life-initial-bonus-engine.js';

import {
  LIFE_RENEWAL_BONUS_STATUS,
  calculateNewProfessionalLifeRenewalBonusCandidate,
} from './new-professional-life-renewal-bonus-engine.js';

const LIFE_BONUS_TOTAL_ORCHESTRATOR_KEY = 'life-bonus-total-orchestrator';

const LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS = Object.freeze({
  CALCULATED_CANDIDATE: 'calculated_candidate',
  CALCULATED_CANDIDATE_WITH_RENEWAL_INELIGIBLE: 'calculated_candidate_with_renewal_ineligible',
  INELIGIBLE_LIFE_INITIAL_BONUS_REQUIRED: 'ineligible_life_initial_bonus_required',
  BLOCKED_MISSING_INPUT: 'blocked_missing_input',
  INVALID_RULE_PACK: 'invalid_rule_pack',
  NOT_MODELED: 'not_modeled',
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

function buildResult({
  status,
  reason = null,
  childResults = {},
  eligibility = {},
  calculation = {},
  explainability = {},
  missingInputs = [],
  warnings = [],
} = {}) {
  return Object.freeze({
    conceptKey: LIFE_BONUS_TOTAL_ORCHESTRATOR_KEY,
    status,
    reason,
    candidateAmount: calculation.payableCandidate ?? null,
    childResults: clonePlain(childResults),
    eligibility: clonePlain(eligibility),
    calculation: {
      grossLifeInitialCandidate: null,
      grossLifeRenewalCandidate: null,
      grossLifeBonusCandidate: null,
      priorPaidBonusesInSemester: null,
      payableCandidate: null,
      ...calculation,
    },
    explainability: {
      priorPaidSubtractedOnce: true,
      ...clonePlain(explainability),
    },
    missingInputs: [...missingInputs],
    warnings: [...warnings],
    payoutTruth: false,
    payoutTruthRule: PAYOUT_TRUTH_RULE,
    evidenceRequirements: [PAYOUT_TRUTH_RULE],
  });
}

function requiredInputNames(advisorFacts = {}) {
  return [
    'semesterNumber',
    'semesterMonth',
    'advisorContestMonth',
    'firstSemesterInNewProfessionalBook',
    'paymentMode',
    'accumulatedTargetPremium',
    'accumulatedPaidInitialPremium',
    'accumulatedInitialLifePoliciesPaid',
    'limra',
    'accumulatedPaidRenewalPremium',
    'igc',
    'priorPaidBonusesInSemester',
  ];
}

function validateAdvisorFacts(advisorFacts = {}) {
  if (!isPlainObject(advisorFacts)) {
    return {
      valid: false,
      missingInputs: ['advisorFacts'],
    };
  }

  const requiredInputs = requiredInputNames(advisorFacts);
  const missingInputs = requiredInputs.filter((field) => isMissing(advisorFacts[field]));
  if (missingInputs.length > 0) {
    return {
      valid: false,
      missingInputs,
    };
  }

  const numericFields = [
    'semesterNumber',
    'semesterMonth',
    'advisorContestMonth',
    'accumulatedTargetPremium',
    'accumulatedPaidInitialPremium',
    'accumulatedInitialLifePoliciesPaid',
    'limra',
    'accumulatedPaidRenewalPremium',
    'igc',
    'priorPaidBonusesInSemester',
  ];
  const invalidInputs = numericFields.filter((field) => !isNumber(advisorFacts[field]));
  if (invalidInputs.length > 0) {
    return {
      valid: false,
      missingInputs: invalidInputs,
    };
  }

  if (advisorFacts.semesterMonth >= 1 && advisorFacts.semesterMonth <= 5) {
    if (!isNumber(advisorFacts.monthlyInitialLifePoliciesPaid)) {
      return {
        valid: false,
        missingInputs: ['monthlyInitialLifePoliciesPaid'],
      };
    }
  }

  if (advisorFacts.semesterNumber === 2 && !isNumber(advisorFacts.annualInitialLifePoliciesPaid)) {
    return {
      valid: false,
      missingInputs: ['annualInitialLifePoliciesPaid'],
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

  if (typeof advisorFacts.firstSemesterInNewProfessionalBook !== 'boolean') {
    return {
      valid: false,
      missingInputs: ['firstSemesterInNewProfessionalBook'],
    };
  }

  if (!Object.values(PAYMENT_MODE).includes(advisorFacts.paymentMode)) {
    return {
      valid: false,
      missingInputs: ['paymentMode'],
    };
  }

  if (!isMissing(advisorFacts.previousSemesterGroup) && !isNumber(advisorFacts.previousSemesterGroup)) {
    return {
      valid: false,
      missingInputs: ['previousSemesterGroup'],
    };
  }

  return {
    valid: true,
    missingInputs: [],
  };
}

function extractNumberFromPaths(result, paths) {
  for (const path of paths) {
    const value = path.reduce((cursor, key) => cursor?.[key], result);
    if (isNumber(value)) return value;
  }

  return null;
}

function extractLifeInitialGrossCandidate(result) {
  return extractNumberFromPaths(result, [
    ['calculation', 'calculatedInitialBonusCandidate'],
    ['calculation', 'grossLifeInitialCandidate'],
    ['calculation', 'initialGrossCandidate'],
  ]);
}

function extractLifeRenewalGrossCandidate(result) {
  return extractNumberFromPaths(result, [
    ['calculation', 'calculatedRenewalBonusCandidate'],
    ['calculation', 'grossLifeRenewalCandidate'],
    ['calculation', 'renewalGrossCandidate'],
  ]);
}

function resolveLifeInitialGroupOutputsForRenewal(lifeInitialResult, paymentMode) {
  const lifeInitialCurrentGroup = extractNumberFromPaths(lifeInitialResult, [
    ['calculation', 'currentGroup'],
    ['calculation', 'group'],
    ['explainability', 'lifeInitialGroup'],
  ]);
  const lifeInitialEffectiveAdvanceGroup = extractNumberFromPaths(lifeInitialResult, [
    ['calculation', 'effectiveGroup'],
    ['calculation', 'monthlyAdvanceEffectiveGroup'],
    ['explainability', 'monthlyAdvanceGroupCap', 'effectiveGroup'],
  ]);

  if (!isNumber(lifeInitialCurrentGroup)) {
    return {
      valid: false,
      missingInputs: ['lifeInitialCurrentGroup'],
      lifeInitialCurrentGroup,
      lifeInitialEffectiveAdvanceGroup,
    };
  }

  if (paymentMode === PAYMENT_MODE.MONTHLY_ADVANCE && !isNumber(lifeInitialEffectiveAdvanceGroup)) {
    return {
      valid: false,
      missingInputs: ['lifeInitialEffectiveAdvanceGroup'],
      lifeInitialCurrentGroup,
      lifeInitialEffectiveAdvanceGroup,
    };
  }

  return {
    valid: true,
    missingInputs: [],
    lifeInitialCurrentGroup,
    lifeInitialEffectiveAdvanceGroup,
  };
}

function mapInitialStatus(status) {
  if (status === LIFE_INITIAL_BONUS_STATUS.BLOCKED_MISSING_INPUT) {
    return LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT;
  }
  if (status === LIFE_INITIAL_BONUS_STATUS.INVALID_RULE_PACK) {
    return LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.INVALID_RULE_PACK;
  }
  if (status === LIFE_INITIAL_BONUS_STATUS.NOT_MODELED) {
    return LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.NOT_MODELED;
  }
  if (typeof status === 'string' && status.startsWith('ineligible_')) {
    return LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.INELIGIBLE_LIFE_INITIAL_BONUS_REQUIRED;
  }

  return LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT;
}

function mapRenewalStatus(status) {
  if (status === LIFE_RENEWAL_BONUS_STATUS.BLOCKED_MISSING_INPUT) {
    return LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT;
  }
  if (status === LIFE_RENEWAL_BONUS_STATUS.INVALID_RULE_PACK) {
    return LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.INVALID_RULE_PACK;
  }
  if (status === LIFE_RENEWAL_BONUS_STATUS.NOT_MODELED) {
    return LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.NOT_MODELED;
  }

  return LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT;
}

function calculateNewProfessionalLifeBonusTotalCandidate({ rulePack, advisorFacts } = {}) {
  const factsValidation = validateAdvisorFacts(advisorFacts);
  if (!factsValidation.valid) {
    return buildResult({
      status: LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT,
      reason: 'blocked_by_missing_or_unknown_input',
      missingInputs: factsValidation.missingInputs,
      explainability: {
        paymentMode: advisorFacts?.paymentMode ?? null,
        lifeInitialStatus: null,
        lifeRenewalStatus: null,
        lifeInitialGroup: null,
        lifeInitialEffectiveAdvanceGroup: null,
        renewalComponentIncluded: false,
      },
    });
  }

  const childFacts = {
    ...advisorFacts,
    priorPaidBonusesInSemester: 0,
  };
  const lifeInitial = calculateNewProfessionalLifeInitialBonusCandidate({
    rulePack,
    advisorFacts: childFacts,
  });

  if (lifeInitial.status !== LIFE_INITIAL_BONUS_STATUS.CALCULATED_CANDIDATE) {
    return buildResult({
      status: mapInitialStatus(lifeInitial.status),
      reason: lifeInitial.reason || 'life_initial_bonus_not_calculated',
      childResults: {
        lifeInitial,
        lifeRenewal: null,
      },
      eligibility: {
        lifeInitialCalculated: false,
      },
      missingInputs: lifeInitial.missingInputs || [],
      explainability: {
        paymentMode: advisorFacts.paymentMode,
        lifeInitialStatus: lifeInitial.status,
        lifeRenewalStatus: null,
        lifeInitialGroup: null,
        lifeInitialEffectiveAdvanceGroup: null,
        renewalComponentIncluded: false,
      },
    });
  }

  const grossLifeInitialCandidate = extractLifeInitialGrossCandidate(lifeInitial);
  if (!isNumber(grossLifeInitialCandidate)) {
    return buildResult({
      status: LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT,
      reason: 'blocked_by_missing_life_initial_gross_candidate',
      childResults: {
        lifeInitial,
        lifeRenewal: null,
      },
      missingInputs: ['calculatedInitialBonusCandidate'],
      explainability: {
        paymentMode: advisorFacts.paymentMode,
        lifeInitialStatus: lifeInitial.status,
        lifeRenewalStatus: null,
        lifeInitialGroup: null,
        lifeInitialEffectiveAdvanceGroup: null,
        renewalComponentIncluded: false,
      },
    });
  }

  const groupOutputs = resolveLifeInitialGroupOutputsForRenewal(lifeInitial, advisorFacts.paymentMode);
  if (!groupOutputs.valid) {
    return buildResult({
      status: LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT,
      reason: 'blocked_by_missing_life_initial_group_output',
      childResults: {
        lifeInitial,
        lifeRenewal: null,
      },
      missingInputs: groupOutputs.missingInputs,
      explainability: {
        paymentMode: advisorFacts.paymentMode,
        lifeInitialStatus: lifeInitial.status,
        lifeRenewalStatus: null,
        lifeInitialGroup: groupOutputs.lifeInitialCurrentGroup,
        lifeInitialEffectiveAdvanceGroup: groupOutputs.lifeInitialEffectiveAdvanceGroup,
        renewalComponentIncluded: false,
      },
    });
  }

  const lifeRenewal = calculateNewProfessionalLifeRenewalBonusCandidate({
    rulePack,
    advisorFacts: {
      semesterNumber: advisorFacts.semesterNumber,
      semesterMonth: advisorFacts.semesterMonth,
      paymentMode: advisorFacts.paymentMode,
      lifeInitialBonusCalculated: true,
      lifeInitialCurrentGroup: groupOutputs.lifeInitialCurrentGroup,
      lifeInitialEffectiveAdvanceGroup: groupOutputs.lifeInitialEffectiveAdvanceGroup,
      accumulatedPaidRenewalPremium: advisorFacts.accumulatedPaidRenewalPremium,
      igc: advisorFacts.igc,
      priorPaidBonusesInSemester: 0,
    },
  });

  if (lifeRenewal.status === LIFE_RENEWAL_BONUS_STATUS.INELIGIBLE_IGC_GOAL_NOT_MET) {
    const grossLifeRenewalCandidate = 0;
    const grossLifeBonusCandidate = roundMoney(grossLifeInitialCandidate + grossLifeRenewalCandidate);
    const payableCandidate = roundMoney(grossLifeBonusCandidate - advisorFacts.priorPaidBonusesInSemester);

    return buildResult({
      status: LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.CALCULATED_CANDIDATE_WITH_RENEWAL_INELIGIBLE,
      reason: 'renewal_igc_goal_not_met',
      childResults: {
        lifeInitial,
        lifeRenewal,
      },
      eligibility: {
        lifeInitialCalculated: true,
        lifeRenewalCalculated: false,
      },
      calculation: {
        grossLifeInitialCandidate,
        grossLifeRenewalCandidate,
        grossLifeBonusCandidate,
        priorPaidBonusesInSemester: advisorFacts.priorPaidBonusesInSemester,
        payableCandidate,
      },
      explainability: {
        paymentMode: advisorFacts.paymentMode,
        lifeInitialStatus: lifeInitial.status,
        lifeRenewalStatus: lifeRenewal.status,
        lifeInitialGroup: groupOutputs.lifeInitialCurrentGroup,
        lifeInitialEffectiveAdvanceGroup: groupOutputs.lifeInitialEffectiveAdvanceGroup,
        renewalComponentIncluded: false,
      },
    });
  }

  if (lifeRenewal.status !== LIFE_RENEWAL_BONUS_STATUS.CALCULATED_CANDIDATE) {
    return buildResult({
      status: mapRenewalStatus(lifeRenewal.status),
      reason: lifeRenewal.reason || 'life_renewal_bonus_not_calculated',
      childResults: {
        lifeInitial,
        lifeRenewal,
      },
      eligibility: {
        lifeInitialCalculated: true,
        lifeRenewalCalculated: false,
      },
      missingInputs: lifeRenewal.missingInputs || [],
      explainability: {
        paymentMode: advisorFacts.paymentMode,
        lifeInitialStatus: lifeInitial.status,
        lifeRenewalStatus: lifeRenewal.status,
        lifeInitialGroup: groupOutputs.lifeInitialCurrentGroup,
        lifeInitialEffectiveAdvanceGroup: groupOutputs.lifeInitialEffectiveAdvanceGroup,
        renewalComponentIncluded: false,
      },
    });
  }

  const grossLifeRenewalCandidate = extractLifeRenewalGrossCandidate(lifeRenewal);
  if (!isNumber(grossLifeRenewalCandidate)) {
    return buildResult({
      status: LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT,
      reason: 'blocked_by_missing_life_renewal_gross_candidate',
      childResults: {
        lifeInitial,
        lifeRenewal,
      },
      missingInputs: ['calculatedRenewalBonusCandidate'],
      explainability: {
        paymentMode: advisorFacts.paymentMode,
        lifeInitialStatus: lifeInitial.status,
        lifeRenewalStatus: lifeRenewal.status,
        lifeInitialGroup: groupOutputs.lifeInitialCurrentGroup,
        lifeInitialEffectiveAdvanceGroup: groupOutputs.lifeInitialEffectiveAdvanceGroup,
        renewalComponentIncluded: false,
      },
    });
  }

  const grossLifeBonusCandidate = roundMoney(grossLifeInitialCandidate + grossLifeRenewalCandidate);
  const payableCandidate = roundMoney(grossLifeBonusCandidate - advisorFacts.priorPaidBonusesInSemester);

  return buildResult({
    status: LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.CALCULATED_CANDIDATE,
    reason: null,
    childResults: {
      lifeInitial,
      lifeRenewal,
    },
    eligibility: {
      lifeInitialCalculated: true,
      lifeRenewalCalculated: true,
    },
    calculation: {
      grossLifeInitialCandidate,
      grossLifeRenewalCandidate,
      grossLifeBonusCandidate,
      priorPaidBonusesInSemester: advisorFacts.priorPaidBonusesInSemester,
      payableCandidate,
    },
    explainability: {
      paymentMode: advisorFacts.paymentMode,
      lifeInitialStatus: lifeInitial.status,
      lifeRenewalStatus: lifeRenewal.status,
      lifeInitialGroup: groupOutputs.lifeInitialCurrentGroup,
      lifeInitialEffectiveAdvanceGroup: groupOutputs.lifeInitialEffectiveAdvanceGroup,
      renewalComponentIncluded: true,
    },
  });
}

export {
  LIFE_BONUS_TOTAL_ORCHESTRATOR_KEY,
  LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS,
  calculateNewProfessionalLifeBonusTotalCandidate,
  extractLifeInitialGrossCandidate,
  extractLifeRenewalGrossCandidate,
  resolveLifeInitialGroupOutputsForRenewal,
};
