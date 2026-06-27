'use strict';

const {
  calculateAnnualProductivityBonusCandidate
} = require('./partner-annual-productivity-bonus-calculator');

function normalizeAnnualProductivityInputs(input = {}) {
  if (Array.isArray(input.annualProductivityInputs)) {
    return input.annualProductivityInputs;
  }

  if (input.annualProductivityInput && typeof input.annualProductivityInput === 'object') {
    return [input.annualProductivityInput];
  }

  if (input.partnerId || input.year || input.quarterlyProductivityBonusCandidates) {
    return [input];
  }

  return [];
}

function summarizeAnnualResults(annualResults) {
  const calculatedResults = annualResults.filter(
    (result) => result.status === 'CANDIDATE_CALCULATED'
  );

  const blockedResults = annualResults.filter(
    (result) => result.status !== 'CANDIDATE_CALCULATED'
  );

  const totalCandidateAmount = calculatedResults.reduce(
    (total, result) => total + result.candidateAmount,
    0
  );

  const annualProductivityBonusBase = calculatedResults.reduce(
    (total, result) => total + result.annualProductivityBonusBase,
    0
  );

  let status = 'BLOCKED_OR_UNKNOWN';

  if (annualResults.length > 0 && blockedResults.length === 0) {
    status = 'ALL_CANDIDATES_CALCULATED';
  } else if (calculatedResults.length > 0 && blockedResults.length > 0) {
    status = 'PARTIAL_WITH_BLOCKS';
  }

  return {
    status,
    calculatedAnnualCount: calculatedResults.length,
    blockedAnnualCount: blockedResults.length,
    totalCandidateAmount: calculatedResults.length > 0 ? totalCandidateAmount : null,
    annualProductivityBonusBase: calculatedResults.length > 0 ? annualProductivityBonusBase : null
  };
}

function orchestrateAnnualProductivityBonusCandidates(input = {}) {
  const annualInputs = normalizeAnnualProductivityInputs(input);

  if (annualInputs.length === 0) {
    return {
      concept: 'productivity-annual-additional-bonus',
      status: 'BLOCKED_OR_UNKNOWN',
      payoutTruth: false,
      totalCandidateAmount: null,
      annualProductivityBonusBase: null,
      calculatedAnnualCount: 0,
      blockedAnnualCount: 0,
      annualResults: [],
      blockingReasons: ['NO_ANNUAL_PRODUCTIVITY_INPUTS'],
      quarterlyProductivityFlowTouched: false
    };
  }

  const annualResults = annualInputs.map((annualInput, index) => {
    const calculatorResult = calculateAnnualProductivityBonusCandidate(annualInput);

    return {
      annualIndex: index,
      partnerId: annualInput.partnerId || null,
      year: annualInput.year || null,
      connectionContext: annualInput.connectionContext || null,
      ...calculatorResult
    };
  });

  const summary = summarizeAnnualResults(annualResults);

  return {
    concept: 'productivity-annual-additional-bonus',
    status: summary.status,
    payoutTruth: false,
    totalCandidateAmount: summary.totalCandidateAmount,
    annualProductivityBonusBase: summary.annualProductivityBonusBase,
    calculatedAnnualCount: summary.calculatedAnnualCount,
    blockedAnnualCount: summary.blockedAnnualCount,
    annualResults,
    blockingReasons: annualResults.flatMap((result) => result.blockingReasons || []),
    quarterlyProductivityFlowTouched: false
  };
}

module.exports = {
  orchestrateAnnualProductivityBonusCandidates
};
