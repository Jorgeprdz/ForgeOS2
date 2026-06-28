const DEVELOPMENT_BONUS_KEY = 'development-bonus';

const DEVELOPMENT_BONUS_STATUS = Object.freeze({
  CALCULATED_CANDIDATE: 'calculated_candidate',
  BLOCKED_BY_MISSING_EVIDENCE: 'blocked_by_missing_evidence',
  UNKNOWN: 'unknown',
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

function getDevelopmentBonusConcept(rulePack) {
  return rulePack?.concepts?.[DEVELOPMENT_BONUS_KEY] || null;
}

function buildResult({
  status,
  reason = null,
  advisorFacts = null,
  calculation = {},
  blockedReasons = [],
  warnings = [],
  metadata = {},
} = {}) {
  return deepFreeze({
    conceptKey: DEVELOPMENT_BONUS_KEY,
    status,
    reason,
    candidateAmount: calculation.payableCandidate ?? null,
    advisorFacts: advisorFacts ? clonePlain(advisorFacts) : null,
    calculation: {
      advisorMonth: null,
      monthlyPolicies: null,
      baseAmount: null,
      developerShare: null,
      shareFactor: null,
      payableCandidate: null,
      ...calculation,
    },
    blockedReasons: [...blockedReasons],
    warnings: [...warnings],
    metadata: clonePlain(metadata),
    payoutTruth: false,
    payoutTruthRule: PAYOUT_TRUTH_RULE,
    evidenceRequirements: [PAYOUT_TRUTH_RULE],
  });
}

function resolveExactOrAboveScale({ scale = [], value = null, valueKey, resultKey } = {}) {
  if (!isNumber(value)) {
    return {
      value: null,
      matched: null,
      blockedReasons: ['missing_policy_scale_match'],
    };
  }

  const sorted = [...scale]
    .filter((row) => isPlainObject(row) && isNumber(row[valueKey]) && isNumber(row[resultKey]))
    .sort((left, right) => right[valueKey] - left[valueKey]);
  const matched = sorted.find((row) => value >= row[valueKey]) || null;

  return {
    value: matched ? matched[resultKey] : null,
    matched: matched ? clonePlain(matched) : null,
    blockedReasons: matched ? [] : ['missing_policy_scale_match'],
  };
}

function getDevelopmentBonusAmount(rulePack, {
  advisorMonth = null,
  validPolicyCount = null,
} = {}) {
  const development = getDevelopmentBonusConcept(rulePack);
  const range = development?.advisorMonthRange;

  if (!isNumber(advisorMonth) ||
    Number(advisorMonth) < Number(range?.from) ||
    Number(advisorMonth) > Number(range?.to)) {
    return {
      amount: null,
      matched: null,
      blockedReasons: ['advisor_month_4_to_15_required'],
    };
  }

  const match = resolveExactOrAboveScale({
    scale: development?.policyScale || [],
    value: validPolicyCount,
    valueKey: 'monthlyPolicies',
    resultKey: 'amount',
  });

  return {
    amount: match.value,
    matched: match.matched,
    blockedReasons: match.blockedReasons,
  };
}

function resolveDeveloperShare({ developerShare = null, developerCount = null } = {}) {
  if (isNumber(developerShare)) {
    if (developerShare === 1 || developerShare === 0.5) {
      return {
        status: 'confirmed',
        developerShare,
        shareFactor: developerShare,
        blockedReasons: [],
      };
    }

    return {
      status: 'not_modeled',
      reason: 'unsupported_developer_share',
      developerShare,
      shareFactor: null,
      blockedReasons: ['unsupported_developer_share'],
    };
  }

  if (!isMissing(developerShare)) {
    return {
      status: 'unknown',
      reason: 'invalid_developer_share',
      developerShare,
      shareFactor: null,
      blockedReasons: ['invalid_developer_share'],
    };
  }

  const shareFactor = Number(developerCount) === 2 ? 0.5 : 1;
  return {
    status: 'confirmed',
    developerShare: shareFactor,
    shareFactor,
    blockedReasons: [],
  };
}

function calculateNewProfessionalDevelopmentBonusCandidate({
  rulePack = null,
  advisorFacts = {},
} = {}) {
  if (!isPlainObject(rulePack)) {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.NOT_MODELED,
      reason: 'missing_rule_pack',
      advisorFacts,
      blockedReasons: ['missing_rule_pack'],
    });
  }

  const concept = getDevelopmentBonusConcept(rulePack);
  if (!isPlainObject(concept)) {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.NOT_MODELED,
      reason: 'missing_development_bonus_concept',
      advisorFacts,
      blockedReasons: ['missing_development_bonus_concept'],
    });
  }

  const blockedReasons = [];
  if (advisorFacts.developmentAttributionConfirmed !== true) {
    blockedReasons.push('missing_development_attribution_evidence');
  }
  if (advisorFacts.paidAppliedPolicyEvidence !== true) {
    blockedReasons.push('missing_paid_applied_policy_evidence');
  }
  if (advisorFacts.developerEligibilityEvidence !== true) {
    blockedReasons.push('missing_developer_eligibility_evidence');
  }
  if (advisorFacts.sourceEvidence !== PAYOUT_TRUTH_RULE) {
    blockedReasons.push(isMissing(advisorFacts.sourceEvidence) ? 'source_evidence_missing' : 'source_evidence_invalid');
  }

  const advisorMonth = advisorFacts.advisorMonth;
  if (isMissing(advisorMonth)) blockedReasons.push('missing_advisorMonth');
  if (!isMissing(advisorMonth) && !isNumber(advisorMonth)) {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.UNKNOWN,
      reason: 'invalid_advisorMonth',
      advisorFacts,
      blockedReasons: ['invalid_advisorMonth'],
    });
  }

  const monthlyPolicies = isNumber(advisorFacts.monthlyPolicies)
    ? advisorFacts.monthlyPolicies
    : (advisorFacts.policyInputIsMonthly === true ? advisorFacts.validPolicyCount : null);
  if (!isNumber(monthlyPolicies)) {
    blockedReasons.push(isNumber(advisorFacts.quarterPolicyTotal)
      ? 'blocked_by_missing_monthly_policy_breakdown'
      : 'missing_policy_scale_match');
  }

  const share = resolveDeveloperShare({
    developerShare: advisorFacts.developerShare,
    developerCount: advisorFacts.developerCount,
  });
  if (share.status === 'unknown') {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.UNKNOWN,
      reason: share.reason,
      advisorFacts,
      blockedReasons: share.blockedReasons,
      metadata: {
        developerShare: share.developerShare,
      },
    });
  }
  if (share.status === 'not_modeled') {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.NOT_MODELED,
      reason: share.reason,
      advisorFacts,
      blockedReasons: share.blockedReasons,
      metadata: {
        developerShare: share.developerShare,
      },
    });
  }

  const ruleAmount = getDevelopmentBonusAmount(rulePack, {
    advisorMonth,
    validPolicyCount: monthlyPolicies,
  });
  if (ruleAmount.amount === null) blockedReasons.push(...ruleAmount.blockedReasons);

  if (blockedReasons.length > 0) {
    return buildResult({
      status: DEVELOPMENT_BONUS_STATUS.BLOCKED_BY_MISSING_EVIDENCE,
      reason: 'blocked_by_missing_development_bonus_evidence',
      advisorFacts,
      calculation: {
        advisorMonth: isNumber(advisorMonth) ? advisorMonth : null,
        monthlyPolicies: isNumber(monthlyPolicies) ? monthlyPolicies : null,
        baseAmount: ruleAmount.amount,
        developerShare: share.developerShare,
        shareFactor: share.shareFactor,
        payableCandidate: null,
      },
      blockedReasons: [...new Set(blockedReasons)],
      metadata: {
        matchedTier: ruleAmount.matched,
        additionalMonth12BonusStatus: Number(advisorMonth) === 12
          ? 'blocked_without_month_12_evidence'
          : 'not_applicable',
      },
    });
  }

  const payableCandidate = Number(ruleAmount.amount) * share.shareFactor;

  return buildResult({
    status: DEVELOPMENT_BONUS_STATUS.CALCULATED_CANDIDATE,
    reason: 'development_bonus_calculated',
    advisorFacts,
    calculation: {
      advisorMonth,
      monthlyPolicies,
      baseAmount: ruleAmount.amount,
      developerShare: share.developerShare,
      shareFactor: share.shareFactor,
      payableCandidate,
    },
    metadata: {
      matchedTier: ruleAmount.matched,
      additionalMonth12BonusStatus: Number(advisorMonth) === 12
        ? 'blocked_without_month_12_evidence'
        : 'not_applicable',
    },
  });
}

export {
  DEVELOPMENT_BONUS_KEY,
  DEVELOPMENT_BONUS_STATUS,
  calculateNewProfessionalDevelopmentBonusCandidate,
  getDevelopmentBonusAmount,
  resolveDeveloperShare,
};
