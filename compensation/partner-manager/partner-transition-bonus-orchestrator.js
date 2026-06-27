'use strict';

const {
  calculatePartnerTransitionBonusCandidate
} = require('./partner-transition-bonus-calculator');

function normalizeMonthlyTransitionInput(monthInput) {
  const safeInput = monthInput || {};
  const lineage = safeInput.lineage || {};

  const partnerCareerMonth = Number.isInteger(safeInput.partnerCareerMonth)
    ? safeInput.partnerCareerMonth
    : lineage.partnerCareerMonth;

  return {
    monthId: safeInput.monthId || safeInput.month || null,
    partnerCareerMonth,
    calculatorInput: {
      lineage: {
        ...lineage,
        partnerCareerMonth
      },
      eligibilityEvidence: safeInput.eligibilityEvidence,
      ledgerLines: safeInput.ledgerLines
    }
  };
}

function summarizeMonthlyResults(monthlyResults) {
  const calculatedResults = monthlyResults.filter(
    (result) => result.status === 'CANDIDATE_CALCULATED'
  );

  const blockedResults = monthlyResults.filter(
    (result) => result.status !== 'CANDIDATE_CALCULATED'
  );

  const totalCandidateAmount = calculatedResults.reduce(
    (total, result) => total + result.candidateAmount,
    0
  );

  const eligibleInitialCommissions = calculatedResults.reduce(
    (total, result) => total + result.eligibleInitialCommissions,
    0
  );

  const eligibleRenewalCommissions = calculatedResults.reduce(
    (total, result) => total + result.eligibleRenewalCommissions,
    0
  );

  let status = 'BLOCKED_OR_UNKNOWN';

  if (monthlyResults.length > 0 && blockedResults.length === 0) {
    status = 'ALL_CANDIDATES_CALCULATED';
  } else if (calculatedResults.length > 0 && blockedResults.length > 0) {
    status = 'PARTIAL_WITH_BLOCKS';
  }

  return {
    status,
    calculatedMonthCount: calculatedResults.length,
    blockedMonthCount: blockedResults.length,
    totalCandidateAmount: calculatedResults.length > 0 ? totalCandidateAmount : null,
    eligibleInitialCommissions: calculatedResults.length > 0 ? eligibleInitialCommissions : null,
    eligibleRenewalCommissions: calculatedResults.length > 0 ? eligibleRenewalCommissions : null
  };
}

function orchestratePartnerTransitionBonusCandidates(input = {}) {
  const monthlyInputs = Array.isArray(input.monthlyTransitionInputs)
    ? input.monthlyTransitionInputs
    : [];

  if (monthlyInputs.length === 0) {
    return {
      concept: 'transition-bonus',
      status: 'BLOCKED_OR_UNKNOWN',
      payoutTruth: false,
      totalCandidateAmount: null,
      eligibleInitialCommissions: null,
      eligibleRenewalCommissions: null,
      calculatedMonthCount: 0,
      blockedMonthCount: 0,
      monthlyResults: [],
      blockingReasons: ['NO_MONTHLY_TRANSITION_INPUTS'],
      quarterlyFlowTouched: false
    };
  }

  const monthlyResults = monthlyInputs.map((monthInput, index) => {
    const normalized = normalizeMonthlyTransitionInput(monthInput);
    const calculatorResult = calculatePartnerTransitionBonusCandidate(
      normalized.calculatorInput
    );

    return {
      monthIndex: index,
      monthId: normalized.monthId,
      partnerCareerMonth: normalized.partnerCareerMonth,
      ...calculatorResult
    };
  });

  const summary = summarizeMonthlyResults(monthlyResults);

  return {
    concept: 'transition-bonus',
    status: summary.status,
    payoutTruth: false,
    totalCandidateAmount: summary.totalCandidateAmount,
    eligibleInitialCommissions: summary.eligibleInitialCommissions,
    eligibleRenewalCommissions: summary.eligibleRenewalCommissions,
    calculatedMonthCount: summary.calculatedMonthCount,
    blockedMonthCount: summary.blockedMonthCount,
    monthlyResults,
    blockingReasons: monthlyResults.flatMap((result) => result.blockingReasons || []),
    quarterlyFlowTouched: false
  };
}

module.exports = {
  orchestratePartnerTransitionBonusCandidates
};
