import {
  calculatePcv2026FixedSupportCandidateAmount,
} from './partner-fixed-support-calculator.js';

const FIXED_SUPPORT_CONCEPT = 'fixed-support';
const BLOCKED_STATUS = 'BLOCKED_OR_UNKNOWN';
const CALCULATED_STATUS = 'CALCULATED_CANDIDATE';

function blockedFixedSupportResult(blockingReasons) {
  return {
    concept: FIXED_SUPPORT_CONCEPT,
    status: BLOCKED_STATUS,
    candidateAmount: null,
    totalCandidateAmount: null,
    payoutTruth: false,
    blockingReasons,
    sourceCalculation: null,
  };
}

function hasCalculatedCandidate(result) {
  return result?.status === CALCULATED_STATUS && result.candidateAmount !== null && result.candidateAmount !== undefined;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function orchestratePcv2026FixedSupportMonthlyCandidate(monthlyInput = null) {
  if (!monthlyInput || typeof monthlyInput !== 'object' || Array.isArray(monthlyInput)) {
    return blockedFixedSupportResult(['FIXED_SUPPORT_MONTHLY_INPUT_REQUIRED']);
  }

  const calculation = calculatePcv2026FixedSupportCandidateAmount(monthlyInput);

  return {
    concept: FIXED_SUPPORT_CONCEPT,
    status: calculation.status,
    candidateAmount: calculation.candidateAmount ?? null,
    totalCandidateAmount: calculation.totalCandidateAmount ?? calculation.candidateAmount ?? null,
    payoutTruth: false,
    blockingReasons: calculation.blockingReasons || [],
    sourceCalculation: calculation,
  };
}

export function orchestratePcv2026FixedSupportMonthlyPeriodCandidates(monthlyInputs = null) {
  if (!Array.isArray(monthlyInputs)) {
    return {
      concept: FIXED_SUPPORT_CONCEPT,
      status: BLOCKED_STATUS,
      candidateAmount: null,
      totalCandidateAmount: null,
      payoutTruth: false,
      monthlyResults: [],
      calculatedMonthCount: 0,
      blockedMonthCount: 0,
      blockingReasons: ['FIXED_SUPPORT_MONTHLY_INPUTS_ARRAY_REQUIRED'],
    };
  }

  const monthlyResults = monthlyInputs.map((monthlyInput, monthIndex) => ({
    monthIndex,
    month: monthlyInput?.month || null,
    ...orchestratePcv2026FixedSupportMonthlyCandidate(monthlyInput),
  }));

  const calculatedResults = monthlyResults.filter(hasCalculatedCandidate);
  const blockedResults = monthlyResults.filter((result) => !hasCalculatedCandidate(result));

  const totalCandidateAmount = calculatedResults.length > 0
    ? roundMoney(calculatedResults.reduce((total, result) => total + Number(result.totalCandidateAmount ?? result.candidateAmount), 0))
    : null;

  return {
    concept: FIXED_SUPPORT_CONCEPT,
    status: monthlyResults.length > 0 && blockedResults.length === 0
      ? 'ALL_CANDIDATES_CALCULATED'
      : (calculatedResults.length > 0 ? 'PARTIAL_WITH_BLOCKS' : BLOCKED_STATUS),
    candidateAmount: totalCandidateAmount,
    totalCandidateAmount,
    payoutTruth: false,
    monthlyResults,
    calculatedMonthCount: calculatedResults.length,
    blockedMonthCount: blockedResults.length,
    blockingReasons: monthlyResults.flatMap((result) => result.blockingReasons || []),
  };
}

export function orchestratePcv2026FixedSupportRecoveryCandidate({
  currentMonthInput = null,
  recoveryPreviousMonthsRequested = null,
} = {}) {
  if (!currentMonthInput || typeof currentMonthInput !== 'object' || Array.isArray(currentMonthInput)) {
    return {
      ...blockedFixedSupportResult(['FIXED_SUPPORT_CURRENT_MONTH_INPUT_REQUIRED']),
      recoveryCandidateAmount: null,
      recoveryPreviousMonthsRequested,
    };
  }

  const calculation = calculatePcv2026FixedSupportCandidateAmount({
    ...currentMonthInput,
    recoveryPreviousMonthsRequested,
  });

  return {
    concept: FIXED_SUPPORT_CONCEPT,
    status: calculation.status,
    candidateAmount: calculation.candidateAmount ?? null,
    recoveryCandidateAmount: calculation.recoveryCandidateAmount ?? null,
    totalCandidateAmount: calculation.totalCandidateAmount ?? null,
    payoutTruth: false,
    recoveryPreviousMonthsRequested: calculation.recoveryPreviousMonthsRequested ?? recoveryPreviousMonthsRequested,
    blockingReasons: calculation.blockingReasons || [],
    sourceCalculation: calculation,
  };
}
