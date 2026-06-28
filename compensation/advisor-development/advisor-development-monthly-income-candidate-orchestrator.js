import { calculateTrainingAllowanceCandidate } from './advisor-development-training-allowance-engine.js';
import { calculateConnectionBonusCandidate } from './advisor-development-connection-bonus-engine.js';
import { calculateAdvisorDevelopmentDevelopmentBonusCandidate } from './advisor-development-development-bonus-engine.js';

export const ADVISOR_DEVELOPMENT_MONTHLY_INCOME_CONCEPT_KEY = 'advisor-development-monthly-income-candidate';

export const ADVISOR_DEVELOPMENT_MONTHLY_INCOME_STATUS = Object.freeze({
  CALCULATED_CANDIDATE: 'calculated_candidate',
  PARTIAL_CANDIDATE: 'partial_candidate',
  BLOCKED: 'blocked',
  NOT_MODELED: 'not_modeled',
});

function hasNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function numberOrNull(value) {
  if (hasNumber(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sumNumbers(values) {
  return values.reduce((sum, value) => sum + (hasNumber(value) ? value : 0), 0);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKey(value) {
  const date = parseDate(value);
  if (!date) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function resolveAdvisorDevelopmentCareerMonth(startDate, targetDate) {
  const start = parseDate(startDate);
  const target = parseDate(targetDate);
  if (!start || !target) return null;

  return ((target.getUTCFullYear() - start.getUTCFullYear()) * 12)
    + (target.getUTCMonth() - start.getUTCMonth())
    + 1;
}

function getMonthlyFacts(entity, evaluationMonth) {
  const key = monthKey(evaluationMonth);
  if (!entity || !key) return {};
  return entity.monthlyFacts?.[key]
    || entity.monthlyFacts?.[evaluationMonth]
    || entity.factsByMonth?.[key]
    || {};
}

function amountFrom(candidate) {
  return numberOrNull(
    candidate?.candidateAmount
      ?? candidate?.payableCandidate
      ?? candidate?.calculation?.candidateAmount
      ?? candidate?.calculation?.payableCandidate
      ?? candidate?.metadata?.candidateAmount
      ?? candidate?.metadata?.payableCandidate
  );
}

function normalizeConceptCandidate(conceptKey, candidate = {}) {
  const candidateAmount = amountFrom(candidate);

  return {
    conceptKey,
    status: hasNumber(candidateAmount) ? 'calculated_candidate' : (candidate.status || 'not_modeled'),
    candidateAmount,
    blockedReasons: Array.isArray(candidate.blockedReasons) ? candidate.blockedReasons : [],
    missingInputs: Array.isArray(candidate.missingInputs) ? candidate.missingInputs : [],
    warnings: Array.isArray(candidate.warnings) ? candidate.warnings : [],
    metadata: {
      ...(candidate.metadata || {}),
      originalCandidateAmount: candidateAmount,
    },
    payoutTruth: false,
  };
}

function genericAmountRule(rule) {
  return numberOrNull(rule?.amount ?? rule?.bonusAmount ?? rule?.candidateAmount);
}

function getConcept(rulePack, conceptKey) {
  return rulePack?.concepts?.[conceptKey] || null;
}

function tierMinimum(tier) {
  return numberOrNull(
    tier?.minPolicies
      ?? tier?.minimumPolicies
      ?? tier?.policyCountMinimum
      ?? tier?.policiesAtLeast
      ?? tier?.policies
      ?? tier?.policyCount
      ?? tier?.count
  );
}

function tierMaximum(tier) {
  return numberOrNull(
    tier?.maxPolicies
      ?? tier?.maximumPolicies
      ?? tier?.policyCountMaximum
      ?? tier?.policiesAtMost
  );
}

function tierAmount(tier) {
  return numberOrNull(tier?.amount ?? tier?.bonusAmount ?? tier?.monthlyAmount);
}

function isOpenEndedTier(tier) {
  return tier?.orMore === true
    || tier?.plus === true
    || tier?.openEnded === true
    || tier?.maxPolicies === null
    || tier?.maximumPolicies === null
    || tier?.policyCountMaximum === null;
}

function matchTier(tiers, policyCount) {
  if (!Array.isArray(tiers)) return null;

  const ordered = [...tiers].sort((a, b) => (tierMinimum(b) ?? 0) - (tierMinimum(a) ?? 0));

  for (const tier of ordered) {
    const min = tierMinimum(tier);
    const max = tierMaximum(tier);
    const amount = tierAmount(tier);

    if (!hasNumber(min) || !hasNumber(amount)) continue;

    if (isOpenEndedTier(tier) && policyCount >= min) return { tier, amount };
    if (hasNumber(max) && policyCount >= min && policyCount <= max) return { tier, amount };
    if (!hasNumber(max) && !isOpenEndedTier(tier) && policyCount === min) return { tier, amount };
  }

  return null;
}

function connectionAltaAmount(connectionConcept) {
  return numberOrNull(
    connectionConcept?.altaBonus?.amount
      ?? connectionConcept?.alta?.amount
      ?? connectionConcept?.onboardingBonus?.amount
      ?? connectionConcept?.semanticAmounts?.advisorOnboarding
      ?? connectionConcept?.semanticAmounts?.alta
      ?? connectionConcept?.amount
  );
}

function connectionMonthlyTiers(connectionConcept) {
  return connectionConcept?.monthlyBonus?.tiers
    || connectionConcept?.monthlyBonus?.policyScale
    || connectionConcept?.monthlyPolicyScale
    || connectionConcept?.policyScale
    || [];
}

function developmentMonthlyRange(developmentConcept) {
  const range = developmentConcept?.monthlyBonus?.advisorMonthRange || {};
  return {
    from: numberOrNull(range.from ?? range.start ?? range.min ?? range.careerMonthStart),
    to: numberOrNull(range.to ?? range.end ?? range.max ?? range.careerMonthEnd),
  };
}

function developmentMonthlyTiers(developmentConcept) {
  return developmentConcept?.monthlyBonus?.tiers
    || developmentConcept?.monthlyBonus?.policyScale
    || developmentConcept?.policyScale
    || [];
}

function requiredAccumulatedPolicies(rule) {
  return numberOrNull(
    rule?.requiredAccumulatedInitialPoliciesByMonth12
      ?? rule?.requiredAccumulatedInitialPolicies
      ?? rule?.requiredAccumulatedPolicies
      ?? rule?.minimumAccumulatedInitialPolicies
      ?? rule?.minimumAccumulatedPolicies
  );
}

function monthlyPaidPoliciesVector(event, developedAdvisor) {
  const raw = event.monthlyPaidPoliciesMonths1To12
    ?? developedAdvisor.monthlyPaidPoliciesMonths1To12
    ?? event.monthlyPolicyHistory
    ?? developedAdvisor.monthlyPolicyHistory
    ?? null;

  if (Array.isArray(raw)) return raw.slice(0, 12).map(numberOrNull);

  const byMonth = event.paidPoliciesByAdvisorMonth ?? developedAdvisor.paidPoliciesByAdvisorMonth ?? null;
  if (byMonth && typeof byMonth === 'object') {
    return Array.from({ length: 12 }, (_, index) => numberOrNull(byMonth[String(index + 1)] ?? byMonth[index + 1]));
  }

  return null;
}

function continuityPasses(rule, event, developedAdvisor) {
  const vector = monthlyPaidPoliciesVector(event, developedAdvisor);
  if (!vector || vector.length < 12 || vector.some((value) => !hasNumber(value))) return false;

  const zeroMonths = vector
    .map((value, index) => ({ value, month: index + 1 }))
    .filter((entry) => entry.value <= 0)
    .map((entry) => entry.month);

  const maxZero = numberOrNull(rule?.maxZeroPolicyMonthsAllowed) ?? 1;
  const excludedMonths = Array.isArray(rule?.zeroPolicyMonthsThatLoseAdditional)
    ? rule.zeroPolicyMonthsThatLoseAdditional
    : [10, 11, 12];

  return zeroMonths.length <= maxZero
    && !zeroMonths.some((month) => excludedMonths.includes(month));
}

function calculateTrainingAllowancePart({ rulePack, evaluationMonth, advisor, trainingAllowanceInput = null }) {
  const source = trainingAllowanceInput || advisor;
  if (!source) return null;

  const facts = getMonthlyFacts(source, evaluationMonth);
  const advisorMonth = numberOrNull(
    source.advisorMonth
      ?? facts.advisorMonth
      ?? resolveAdvisorDevelopmentCareerMonth(source.contestDate || source.connectionDate || source.connectedDate, evaluationMonth)
  );

  if (!hasNumber(advisorMonth) || advisorMonth < 1 || advisorMonth > 12) return null;

  const raw = calculateTrainingAllowanceCandidate({
    rulePack,
    activeRulePack: rulePack,
    advisorMonth,
    accumulatedInitialCommission: facts.accumulatedInitialCommission ?? source.accumulatedInitialCommission,
    accumulatedInitialCommissions: facts.accumulatedInitialCommissions ?? source.accumulatedInitialCommissions,
    accumulatedPolicies: facts.accumulatedPolicies ?? source.accumulatedPolicies,
    accumulatedLifePolicies: facts.accumulatedLifePolicies ?? source.accumulatedLifePolicies,
    priorPaidBonusesInSemester: facts.priorPaidBonusesInSemester
      ?? facts.priorPaidTrainingAllowanceInSemester
      ?? source.priorPaidBonusesInSemester
      ?? source.priorPaidTrainingAllowanceInSemester
      ?? 0,
    advisorFacts: {
      ...facts,
      advisorMonth,
    },
    facts,
  });

  return normalizeConceptCandidate('training-allowance', raw);
}

function calculateConnectionPart({ rulePack, evaluationMonth, event }) {
  const connectionConcept = getConcept(rulePack, 'connection-bonus');
  const connectedAdvisor = event.connectedAdvisor || event.advisor || {};
  const facts = getMonthlyFacts(connectedAdvisor, evaluationMonth);

  if (!connectionConcept) {
    return normalizeConceptCandidate('connection-bonus', {
      status: 'not_modeled',
      blockedReasons: ['missing_connection_bonus_concept'],
    });
  }

  const advisorMonth = numberOrNull(
    event.advisorMonth
      ?? facts.advisorMonth
      ?? resolveAdvisorDevelopmentCareerMonth(connectedAdvisor.contestDate || connectedAdvisor.connectionDate || connectedAdvisor.connectedDate, evaluationMonth)
  );

  if (!hasNumber(advisorMonth)) {
    return normalizeConceptCandidate('connection-bonus', {
      status: 'blocked',
      blockedReasons: ['missing_connection_advisor_month'],
      missingInputs: ['advisorMonth'],
    });
  }

  let candidateAmount = null;
  let status = 'not_modeled';

  if (advisorMonth === 1) {
    candidateAmount = connectionAltaAmount(connectionConcept);
    status = hasNumber(candidateAmount) ? 'calculated_candidate' : 'not_modeled';
  } else if ([2, 3].includes(advisorMonth)) {
    const validPolicyCount = numberOrNull(
      event.validPolicyCount
        ?? event.monthlyPolicyCount
        ?? facts.validPolicyCount
        ?? facts.monthlyPolicyCount
        ?? facts.includedCount
    );

    if (hasNumber(validPolicyCount)) {
      const tier = matchTier(connectionMonthlyTiers(connectionConcept), validPolicyCount);
      candidateAmount = tier?.amount ?? null;
      status = hasNumber(candidateAmount) ? 'calculated_candidate' : 'ineligible';
    } else {
      status = 'blocked';
    }
  }

  return normalizeConceptCandidate('connection-bonus', {
    status,
    candidateAmount,
    metadata: {
      advisorMonth,
      source: 'rule_pack_connection_bonus_monthly_candidate',
    },
  });
}

function calculateDevelopmentPart({ rulePack, evaluationMonth, event }) {
  const developmentConcept = getConcept(rulePack, 'development-bonus');
  const developedAdvisor = event.developedAdvisor || event.advisor || {};
  const facts = getMonthlyFacts(developedAdvisor, evaluationMonth);

  if (!developmentConcept) {
    return normalizeConceptCandidate('development-bonus', {
      status: 'not_modeled',
      blockedReasons: ['missing_development_bonus_concept'],
    });
  }

  const advisorMonth = numberOrNull(
    event.advisorMonth
      ?? facts.advisorMonth
      ?? resolveAdvisorDevelopmentCareerMonth(developedAdvisor.contestDate || developedAdvisor.connectionDate || developedAdvisor.connectedDate, evaluationMonth)
  );

  const range = developmentMonthlyRange(developmentConcept);

  if (!hasNumber(advisorMonth) || !hasNumber(range.from) || !hasNumber(range.to) || advisorMonth < range.from || advisorMonth > range.to) {
    return normalizeConceptCandidate('development-bonus', {
      status: 'not_modeled',
      candidateAmount: null,
      metadata: { advisorMonth, range },
    });
  }

  const validPolicyCount = numberOrNull(
    event.validPolicyCount
      ?? event.monthlyPolicyCount
      ?? facts.validPolicyCount
      ?? facts.monthlyPolicyCount
      ?? facts.includedCount
  );

  if (!hasNumber(validPolicyCount)) {
    return normalizeConceptCandidate('development-bonus', {
      status: 'blocked',
      blockedReasons: ['missing_development_valid_policy_count'],
      missingInputs: ['validPolicyCount'],
    });
  }

  const tier = matchTier(developmentMonthlyTiers(developmentConcept), validPolicyCount);
  if (!tier) {
    return normalizeConceptCandidate('development-bonus', {
      status: 'ineligible',
      candidateAmount: null,
      metadata: { advisorMonth, validPolicyCount },
    });
  }

  const developerShare = numberOrNull(event.developerShare ?? facts.developerShare ?? 1);
  if (![1, 0.5].includes(developerShare)) {
    return normalizeConceptCandidate('development-bonus', {
      status: 'not_modeled',
      blockedReasons: ['unsupported_developer_share'],
      metadata: { developerShare },
    });
  }

  let candidateBeforeShare = tier.amount;
  const month12Additional = developmentConcept.month12AdditionalBonuses || {};

  if (advisorMonth === 12) {
    const accumulatedPolicies = numberOrNull(
      event.accumulatedInitialPolicies
        ?? event.accumulatedPolicies
        ?? facts.accumulatedInitialPolicies
        ?? facts.accumulatedPolicies
        ?? developedAdvisor.accumulatedInitialPolicies
        ?? developedAdvisor.accumulatedPolicies
    );

    const taWon = event.trainingAllowanceMonth12Won === true
      || facts.trainingAllowanceMonth12Won === true
      || developedAdvisor.trainingAllowanceMonth12Won === true;

    const bonus20000 = month12Additional.bonus20000 || {};
    const bonus30000 = month12Additional.additionalBonus30000 || {};

    if (taWon && hasNumber(accumulatedPolicies) && accumulatedPolicies >= requiredAccumulatedPolicies(bonus20000)) {
      candidateBeforeShare += genericAmountRule(bonus20000) ?? 0;
    }

    if (
      taWon
      && hasNumber(accumulatedPolicies)
      && accumulatedPolicies >= requiredAccumulatedPolicies(bonus30000)
      && continuityPasses(bonus30000, event, developedAdvisor)
    ) {
      candidateBeforeShare += genericAmountRule(bonus30000) ?? 0;
    }
  }

  const candidateAmount = candidateBeforeShare * developerShare;

  return normalizeConceptCandidate('development-bonus', {
    status: 'calculated_candidate',
    candidateAmount,
    metadata: {
      advisorMonth,
      validPolicyCount,
      baseAmount: tier.amount,
      candidateBeforeShare,
      developerShare,
      source: 'rule_pack_development_bonus_monthly_candidate',
    },
  });
}

function aggregateConcept(conceptKey, parts) {
  const amount = sumNumbers(parts.map((part) => part.candidateAmount));
  const hasCalculated = parts.some((part) => part.status === 'calculated_candidate');

  return normalizeConceptCandidate(conceptKey, {
    status: hasCalculated ? 'calculated_candidate' : (parts.length > 0 ? 'partial_candidate' : 'not_modeled'),
    candidateAmount: amount,
    parts,
    blockedReasons: parts.flatMap((part) => part.blockedReasons || []),
    missingInputs: parts.flatMap((part) => part.missingInputs || []),
    warnings: parts.flatMap((part) => part.warnings || []),
    metadata: { partCount: parts.length },
  });
}

function result({
  status,
  candidateAmount = 0,
  concepts = {},
  parts = [],
  blockedReasons = [],
  missingInputs = [],
  warnings = [],
  metadata = {},
}) {
  return {
    conceptKey: ADVISOR_DEVELOPMENT_MONTHLY_INCOME_CONCEPT_KEY,
    status,
    candidateAmount,
    totalCandidateAmount: candidateAmount,
    concepts,
    parts,
    blockedReasons,
    missingInputs,
    warnings,
    metadata: {
      ...metadata,
      payoutTruth: false,
    },
    payoutTruth: false,
  };
}

export function calculateAdvisorDevelopmentMonthlyIncomeCandidate({
  rulePack = null,
  evaluationMonth = null,
  advisor = null,
  trainingAllowanceInput = null,
  connectionEvents = [],
  developmentEvents = [],
} = {}) {
  if (!rulePack) {
    return result({
      status: ADVISOR_DEVELOPMENT_MONTHLY_INCOME_STATUS.NOT_MODELED,
      candidateAmount: null,
      blockedReasons: ['advisor_development_rule_pack_required'],
      missingInputs: ['rulePack'],
      metadata: { evaluationMonth },
    });
  }

  if (!evaluationMonth) {
    return result({
      status: ADVISOR_DEVELOPMENT_MONTHLY_INCOME_STATUS.BLOCKED,
      candidateAmount: null,
      blockedReasons: ['evaluation_month_required'],
      missingInputs: ['evaluationMonth'],
    });
  }

  const trainingAllowance = calculateTrainingAllowancePart({
    rulePack,
    evaluationMonth,
    advisor,
    trainingAllowanceInput,
  }) || normalizeConceptCandidate('training-allowance', { status: 'not_modeled', candidateAmount: null });

  const connectionParts = connectionEvents.map((event) => calculateConnectionPart({
    rulePack,
    evaluationMonth,
    event,
  }));

  const developmentParts = developmentEvents.map((event) => calculateDevelopmentPart({
    rulePack,
    evaluationMonth,
    event,
  }));

  const connection = aggregateConcept('connection-bonus', connectionParts);
  const development = aggregateConcept('development-bonus', developmentParts);

  const concepts = {
    trainingAllowance,
    connection,
    development,
  };

  const parts = [
    trainingAllowance,
    ...connectionParts,
    ...developmentParts,
  ];

  const totalCandidateAmount = sumNumbers([
    trainingAllowance.candidateAmount,
    connection.candidateAmount,
    development.candidateAmount,
  ]);

  const calculatedParts = parts.filter((part) => hasNumber(part.candidateAmount)).length;

  return result({
    status: calculatedParts > 0
      ? ADVISOR_DEVELOPMENT_MONTHLY_INCOME_STATUS.CALCULATED_CANDIDATE
      : ADVISOR_DEVELOPMENT_MONTHLY_INCOME_STATUS.PARTIAL_CANDIDATE,
    candidateAmount: totalCandidateAmount,
    concepts,
    parts,
    blockedReasons: parts.flatMap((part) => part.blockedReasons || []),
    missingInputs: parts.flatMap((part) => part.missingInputs || []),
    warnings: parts.flatMap((part) => part.warnings || []),
    metadata: {
      evaluationMonth,
      calculatedParts,
      connectionEventCount: connectionEvents.length,
      developmentEventCount: developmentEvents.length,
      trainingAllowanceEngineAvailable: typeof calculateTrainingAllowanceCandidate === 'function',
      connectionBonusEngineAvailable: typeof calculateConnectionBonusCandidate === 'function',
      developmentBonusEngineAvailable: typeof calculateAdvisorDevelopmentDevelopmentBonusCandidate === 'function',
      connectionDevelopmentComputedFromRulePack: true,
    },
  });
}
