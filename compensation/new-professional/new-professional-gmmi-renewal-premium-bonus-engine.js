const GMMI_RENEWAL_PREMIUM_BONUS_KEY = 'gmmi-renewal-premium-bonus';

const GMMI_RENEWAL_PREMIUM_BONUS_STATUS = Object.freeze({
  CALCULATED_CANDIDATE: 'calculated_candidate',
  INELIGIBLE_GMMI_RENEWAL_GOALS_NOT_MET: 'ineligible_gmmi_renewal_goals_not_met',
  BLOCKED_MISSING_INPUT: 'blocked_missing_input',
  INVALID_RULE_PACK: 'invalid_rule_pack',
  NOT_MODELED: 'not_modeled',
});

const PAYOUT_TRUTH_RULE = 'commission_statement_required';
const PAYMENT_MODES = Object.freeze(['monthly_advance', 'quarter_settlement']);

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
  return rulePack?.concepts?.[GMMI_RENEWAL_PREMIUM_BONUS_KEY] || null;
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
    conceptKey: GMMI_RENEWAL_PREMIUM_BONUS_KEY,
    status,
    reason,
    candidateAmount: calculation.payableCandidate ?? null,
    advisorFacts: advisorFacts ? clonePlain(advisorFacts) : null,
    eligibility: {
      premiumGoalMet: null,
      policyGoalMet: null,
      ...eligibility,
    },
    calculation: {
      quarterNumber: null,
      quarterMonth: null,
      group: null,
      premiumGoalUsed: null,
      policyGoalUsed: null,
      actualAccumulatedEligiblePaidGmmiRenewalNetPremium: null,
      actualAccumulatedGmmiInitialPoliciesPaid: null,
      candidateRate: null,
      calculatedGmmiRenewalBonusCandidate: null,
      priorPaidBonusesInQuarter: null,
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
      status: GMMI_RENEWAL_PREMIUM_BONUS_STATUS.NOT_MODELED,
      reason: 'missing_rule_pack',
    };
  }

  const concept = getConcept(rulePack);
  if (!isPlainObject(concept)) {
    return {
      valid: false,
      status: GMMI_RENEWAL_PREMIUM_BONUS_STATUS.NOT_MODELED,
      reason: 'missing_gmmi_renewal_premium_bonus_concept',
    };
  }

  const table = concept.gmmiRenewalPremiumQuarterlyBonusTable;
  if (!isPlainObject(table) || !isPlainObject(table.groups)) {
    return {
      valid: false,
      status: GMMI_RENEWAL_PREMIUM_BONUS_STATUS.INVALID_RULE_PACK,
      reason: 'invalid_rule_pack',
    };
  }

  for (let group = 1; group <= 5; group += 1) {
    const row = table.groups[String(group)];
    if (!isPlainObject(row) ||
      !isNumber(row.month1PremiumGoal) ||
      !isNumber(row.month2PremiumGoal) ||
      !isNumber(row.month3PremiumGoal) ||
      !isNumber(row.policyGoal) ||
      !isNumber(row.bonusRate)) {
      return {
        valid: false,
        status: GMMI_RENEWAL_PREMIUM_BONUS_STATUS.INVALID_RULE_PACK,
        reason: 'invalid_rule_pack',
      };
    }
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
    'quarterNumber',
    'quarterMonth',
    'paymentMode',
    'accumulatedEligiblePaidGmmiRenewalNetPremium',
    'accumulatedGmmiInitialPoliciesPaid',
    'priorPaidBonusesInQuarter',
    'gmmiInitialPoliciesBasisConfirmed',
    'productionResetScope',
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
    'quarterNumber',
    'quarterMonth',
    'accumulatedEligiblePaidGmmiRenewalNetPremium',
    'accumulatedGmmiInitialPoliciesPaid',
    'priorPaidBonusesInQuarter',
  ];
  const invalidInputs = numericFields.filter((field) => !isNumber(advisorFacts[field]));
  if (invalidInputs.length > 0) {
    return {
      valid: false,
      reason: invalidInputs[0],
      missingInputs: invalidInputs,
    };
  }

  if (![1, 2, 3, 4].includes(advisorFacts.quarterNumber)) {
    return {
      valid: false,
      reason: 'invalid_quarter_number',
      missingInputs: ['quarterNumber'],
    };
  }

  if (![1, 2, 3].includes(advisorFacts.quarterMonth)) {
    return {
      valid: false,
      reason: 'invalid_quarter_month',
      missingInputs: ['quarterMonth'],
    };
  }

  if (!PAYMENT_MODES.includes(advisorFacts.paymentMode)) {
    return {
      valid: false,
      reason: 'invalid_payment_mode',
      missingInputs: ['paymentMode'],
    };
  }

  if (advisorFacts.gmmiInitialPoliciesBasisConfirmed !== true) {
    return {
      valid: false,
      reason: 'gmmi_initial_policies_basis_not_confirmed',
      missingInputs: ['gmmiInitialPoliciesBasisConfirmed'],
    };
  }

  if (advisorFacts.productionResetScope !== 'current_quarter') {
    return {
      valid: false,
      reason: 'production_reset_scope_invalid',
      missingInputs: ['productionResetScope'],
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

function resolveGmmiRenewalPremiumGoalForQuarterMonth({ row, quarterMonth } = {}) {
  if (!isPlainObject(row)) return null;
  if (quarterMonth === 1) return row.month1PremiumGoal;
  if (quarterMonth === 2) return row.month2PremiumGoal;
  if (quarterMonth === 3) return row.month3PremiumGoal;

  return null;
}

function resolveGmmiRenewalPremiumBonusGroup({
  concept,
  quarterMonth,
  accumulatedEligiblePaidGmmiRenewalNetPremium,
  accumulatedGmmiInitialPoliciesPaid,
} = {}) {
  const groups = concept?.gmmiRenewalPremiumQuarterlyBonusTable?.groups;
  if (!isPlainObject(groups) ||
    ![1, 2, 3].includes(quarterMonth) ||
    !isNumber(accumulatedEligiblePaidGmmiRenewalNetPremium) ||
    !isNumber(accumulatedGmmiInitialPoliciesPaid)) {
    return null;
  }

  let closestGroup = null;
  for (let group = 1; group <= 5; group += 1) {
    const row = groups[String(group)];
    const premiumGoal = resolveGmmiRenewalPremiumGoalForQuarterMonth({ row, quarterMonth });
    if (!isNumber(premiumGoal) || !isNumber(row?.policyGoal) || !isNumber(row?.bonusRate)) continue;

    const premiumGoalMet = accumulatedEligiblePaidGmmiRenewalNetPremium >= premiumGoal;
    const policyGoalMet = accumulatedGmmiInitialPoliciesPaid >= row.policyGoal;
    const candidate = {
      group,
      premiumGoal,
      policyGoal: row.policyGoal,
      bonusRate: row.bonusRate,
      premiumGoalMet,
      policyGoalMet,
    };

    if (!closestGroup) closestGroup = candidate;
    if (premiumGoalMet && policyGoalMet) return candidate;
  }

  return closestGroup
    ? {
      ...closestGroup,
      group: null,
      bonusRate: null,
    }
    : null;
}

function resolveIneligibleReason(groupResolution) {
  if (groupResolution?.premiumGoalMet === false && groupResolution?.policyGoalMet === true) {
    return 'premium_goal_not_met';
  }
  if (groupResolution?.premiumGoalMet === true && groupResolution?.policyGoalMet === false) {
    return 'policy_goal_not_met';
  }

  return 'premium_and_policy_goals_not_met';
}

function reasonForBlockedInput(reason) {
  const reasonMap = {
    accumulatedEligiblePaidGmmiRenewalNetPremium:
      'accumulated_eligible_paid_gmmi_renewal_net_premium_missing',
    accumulatedGmmiInitialPoliciesPaid: 'accumulated_gmmi_initial_policies_paid_missing',
    priorPaidBonusesInQuarter: 'prior_paid_bonuses_in_quarter_missing',
    sourceEvidence: 'source_evidence_missing',
  };

  return reasonMap[reason] || reason;
}

function calculateNewProfessionalGmmiRenewalPremiumBonusCandidate({ rulePack, advisorFacts } = {}) {
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
      status: GMMI_RENEWAL_PREMIUM_BONUS_STATUS.BLOCKED_MISSING_INPUT,
      reason: reasonForBlockedInput(factsValidation.reason),
      advisorFacts,
      missingInputs: factsValidation.missingInputs,
    });
  }

  const groupResolution = resolveGmmiRenewalPremiumBonusGroup({
    concept: rulePackValidation.concept,
    quarterMonth: advisorFacts.quarterMonth,
    accumulatedEligiblePaidGmmiRenewalNetPremium:
      advisorFacts.accumulatedEligiblePaidGmmiRenewalNetPremium,
    accumulatedGmmiInitialPoliciesPaid: advisorFacts.accumulatedGmmiInitialPoliciesPaid,
  });

  if (!groupResolution?.group) {
    return buildResult({
      status: GMMI_RENEWAL_PREMIUM_BONUS_STATUS.INELIGIBLE_GMMI_RENEWAL_GOALS_NOT_MET,
      reason: resolveIneligibleReason(groupResolution),
      advisorFacts,
      eligibility: {
        premiumGoalMet: groupResolution?.premiumGoalMet ?? false,
        policyGoalMet: groupResolution?.policyGoalMet ?? false,
      },
      calculation: {
        quarterNumber: advisorFacts.quarterNumber,
        quarterMonth: advisorFacts.quarterMonth,
        premiumGoalUsed: groupResolution?.premiumGoal ?? null,
        policyGoalUsed: groupResolution?.policyGoal ?? null,
        actualAccumulatedEligiblePaidGmmiRenewalNetPremium:
          advisorFacts.accumulatedEligiblePaidGmmiRenewalNetPremium,
        actualAccumulatedGmmiInitialPoliciesPaid: advisorFacts.accumulatedGmmiInitialPoliciesPaid,
        priorPaidBonusesInQuarter: advisorFacts.priorPaidBonusesInQuarter,
      },
      explainability: {
        paymentMode: advisorFacts.paymentMode,
        productionResetScope: advisorFacts.productionResetScope,
        gmmiInitialPoliciesBasisConfirmed: advisorFacts.gmmiInitialPoliciesBasisConfirmed,
        sourceEvidence: advisorFacts.sourceEvidence,
        premiumGoalMet: groupResolution?.premiumGoalMet ?? false,
        policyGoalMet: groupResolution?.policyGoalMet ?? false,
        selectedGroup: null,
      },
    });
  }

  const calculatedGmmiRenewalBonusCandidate = roundMoney(
    advisorFacts.accumulatedEligiblePaidGmmiRenewalNetPremium * groupResolution.bonusRate,
  );
  const payableCandidate = roundMoney(
    calculatedGmmiRenewalBonusCandidate - advisorFacts.priorPaidBonusesInQuarter,
  );

  return buildResult({
    status: GMMI_RENEWAL_PREMIUM_BONUS_STATUS.CALCULATED_CANDIDATE,
    reason: 'gmmi_renewal_bonus_calculated',
    advisorFacts,
    eligibility: {
      premiumGoalMet: true,
      policyGoalMet: true,
    },
    calculation: {
      quarterNumber: advisorFacts.quarterNumber,
      quarterMonth: advisorFacts.quarterMonth,
      group: groupResolution.group,
      premiumGoalUsed: groupResolution.premiumGoal,
      policyGoalUsed: groupResolution.policyGoal,
      actualAccumulatedEligiblePaidGmmiRenewalNetPremium:
        advisorFacts.accumulatedEligiblePaidGmmiRenewalNetPremium,
      actualAccumulatedGmmiInitialPoliciesPaid: advisorFacts.accumulatedGmmiInitialPoliciesPaid,
      candidateRate: groupResolution.bonusRate,
      calculatedGmmiRenewalBonusCandidate,
      priorPaidBonusesInQuarter: advisorFacts.priorPaidBonusesInQuarter,
      payableCandidate,
    },
    explainability: {
      paymentMode: advisorFacts.paymentMode,
      productionResetScope: advisorFacts.productionResetScope,
      gmmiInitialPoliciesBasisConfirmed: advisorFacts.gmmiInitialPoliciesBasisConfirmed,
      sourceEvidence: advisorFacts.sourceEvidence,
      premiumGoalMet: true,
      policyGoalMet: true,
      selectedGroup: groupResolution.group,
    },
  });
}

export {
  GMMI_RENEWAL_PREMIUM_BONUS_KEY,
  GMMI_RENEWAL_PREMIUM_BONUS_STATUS,
  calculateNewProfessionalGmmiRenewalPremiumBonusCandidate,
  resolveGmmiRenewalPremiumBonusGroup,
  resolveGmmiRenewalPremiumGoalForQuarterMonth,
};
