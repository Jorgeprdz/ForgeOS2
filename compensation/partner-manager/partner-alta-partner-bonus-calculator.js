'use strict';

const {
  ALTA_PARTNER_PAYMENT_COUNT,
  ALTA_PARTNER_PAYMENT_SCHEDULE,
  ALTA_PARTNER_TOTAL_BONUS_AMOUNT,
  getAltaPartnerScheduleTotal,
  validateAltaPartnerBonusContract
} = require('./partner-alta-partner-bonus-contract');

function normalizePaymentInputs(input = {}) {
  if (Array.isArray(input)) return input;

  if (Array.isArray(input.paymentInputs)) {
    return input.paymentInputs;
  }

  if (input.paymentInput && typeof input.paymentInput === 'object') {
    return [input.paymentInput];
  }

  if (input.partnerId || input.promotedAdvisorId || input.paymentNumber) {
    return [input];
  }

  return [];
}

function calculateAltaPartnerPaymentCandidate(input = {}) {
  const contractReadiness = validateAltaPartnerBonusContract(input);

  if (!contractReadiness.readyForCandidateCalculator) {
    return {
      concept: 'partner-promotion-bonus',
      status: 'BLOCKED_OR_UNKNOWN',
      candidateAmount: null,
      payoutTruth: false,
      calculationPerformed: false,
      paymentNumber: contractReadiness.paymentNumber,
      scheduledAmount: contractReadiness.scheduledAmount,
      totalScheduleAmount: contractReadiness.totalScheduleAmount,
      blockingReasons: contractReadiness.blockingReasons,
      contractReadiness
    };
  }

  return {
    concept: 'partner-promotion-bonus',
    status: 'CANDIDATE_CALCULATED',
    candidateAmount: contractReadiness.scheduledAmount,
    payoutTruth: false,
    calculationPerformed: true,
    paymentNumber: contractReadiness.paymentNumber,
    scheduledAmount: contractReadiness.scheduledAmount,
    totalScheduleAmount: contractReadiness.totalScheduleAmount,
    blockingReasons: [],
    contractReadiness
  };
}

function getScheduleCompletenessBlockingReasons(paymentResults) {
  const blockingReasons = [];
  const seen = new Map();

  for (const result of paymentResults) {
    if (!result.paymentNumber) continue;

    seen.set(result.paymentNumber, (seen.get(result.paymentNumber) || 0) + 1);
  }

  for (const scheduleLine of ALTA_PARTNER_PAYMENT_SCHEDULE) {
    if (!seen.has(scheduleLine.paymentNumber)) {
      blockingReasons.push(`SCHEDULE_MISSING_PAYMENT_${scheduleLine.paymentNumber}`);
    }
  }

  for (const [paymentNumber, count] of seen.entries()) {
    if (count > 1) {
      blockingReasons.push(`SCHEDULE_DUPLICATE_PAYMENT_${paymentNumber}`);
    }
  }

  return blockingReasons;
}

function calculateAltaPartnerScheduleCandidate(input = {}) {
  const paymentInputs = normalizePaymentInputs(input);

  if (paymentInputs.length === 0) {
    return {
      concept: 'partner-promotion-bonus',
      status: 'BLOCKED_OR_UNKNOWN',
      candidateAmount: null,
      totalCandidateAmount: null,
      payoutTruth: false,
      calculationPerformed: false,
      paymentResults: [],
      blockingReasons: ['NO_ALTA_PARTNER_PAYMENT_INPUTS'],
      totalScheduleAmount: ALTA_PARTNER_TOTAL_BONUS_AMOUNT,
      expectedPaymentCount: ALTA_PARTNER_PAYMENT_COUNT
    };
  }

  const paymentResults = paymentInputs.map(calculateAltaPartnerPaymentCandidate);
  const scheduleBlockingReasons = getScheduleCompletenessBlockingReasons(paymentResults);
  const paymentBlockingReasons = paymentResults.flatMap((result) => result.blockingReasons || []);
  const blockingReasons = [...scheduleBlockingReasons, ...paymentBlockingReasons];

  if (blockingReasons.length > 0) {
    return {
      concept: 'partner-promotion-bonus',
      status: 'BLOCKED_OR_UNKNOWN',
      candidateAmount: null,
      totalCandidateAmount: null,
      payoutTruth: false,
      calculationPerformed: false,
      paymentResults,
      blockingReasons,
      totalScheduleAmount: ALTA_PARTNER_TOTAL_BONUS_AMOUNT,
      expectedPaymentCount: ALTA_PARTNER_PAYMENT_COUNT
    };
  }

  const totalCandidateAmount = paymentResults.reduce(
    (total, result) => total + result.candidateAmount,
    0
  );

  return {
    concept: 'partner-promotion-bonus',
    status: 'CANDIDATE_CALCULATED',
    candidateAmount: totalCandidateAmount,
    totalCandidateAmount,
    payoutTruth: false,
    calculationPerformed: true,
    paymentResults,
    blockingReasons: [],
    totalScheduleAmount: getAltaPartnerScheduleTotal(),
    expectedPaymentCount: ALTA_PARTNER_PAYMENT_COUNT
  };
}

module.exports = {
  calculateAltaPartnerPaymentCandidate,
  calculateAltaPartnerScheduleCandidate
};
