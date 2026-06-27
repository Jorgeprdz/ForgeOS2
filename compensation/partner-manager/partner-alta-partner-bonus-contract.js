'use strict';

const ALTA_PARTNER_TOTAL_BONUS_AMOUNT = 300000;
const ALTA_PARTNER_FIRST_PAYMENT_AMOUNT = 60000;
const ALTA_PARTNER_RECURRING_PAYMENT_AMOUNT = 20000;
const ALTA_PARTNER_PAYMENT_COUNT = 13;
const ALTA_PARTNER_MAX_RECOVERY_MONTHS = 3;

const ALTA_PARTNER_PAYMENT_SCHEDULE = Object.freeze(
  Array.from({ length: ALTA_PARTNER_PAYMENT_COUNT }, (_, index) => {
    const paymentNumber = index + 1;

    return Object.freeze({
      paymentNumber,
      scheduledAmount:
        paymentNumber === 1
          ? ALTA_PARTNER_FIRST_PAYMENT_AMOUNT
          : ALTA_PARTNER_RECURRING_PAYMENT_AMOUNT
    });
  })
);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidPaymentNumber(value) {
  return Number.isInteger(value) && value >= 1 && value <= ALTA_PARTNER_PAYMENT_COUNT;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function evidenceIsConfirmed(evidence) {
  if (evidence === true) return true;
  if (!evidence || typeof evidence !== 'object') return false;

  if (
    evidence.confirmed === true ||
    evidence.passed === true ||
    evidence.verified === true ||
    evidence.active === true ||
    evidence.received === true
  ) {
    return true;
  }

  if (typeof evidence.status === 'string') {
    return ['confirmed', 'verified', 'present', 'passed', 'pass', 'ok', 'active', 'received'].includes(
      evidence.status.trim().toLowerCase()
    );
  }

  return false;
}

function getAltaPartnerPaymentAmount(paymentNumber) {
  if (!isValidPaymentNumber(paymentNumber)) return null;

  return paymentNumber === 1
    ? ALTA_PARTNER_FIRST_PAYMENT_AMOUNT
    : ALTA_PARTNER_RECURRING_PAYMENT_AMOUNT;
}

function getAltaPartnerScheduleTotal() {
  return ALTA_PARTNER_PAYMENT_SCHEDULE.reduce(
    (total, payment) => total + payment.scheduledAmount,
    0
  );
}

function validateAltaPartnerIdentity(input = {}) {
  const blockingReasons = [];

  if (!isNonEmptyString(input.partnerId)) {
    blockingReasons.push('MISSING_PARTNER_ID');
  }

  if (!isNonEmptyString(input.promotedAdvisorId)) {
    blockingReasons.push('MISSING_PROMOTED_ADVISOR_ID');
  }

  if (!isNonEmptyString(input.promotionEventId)) {
    blockingReasons.push('MISSING_PROMOTION_EVENT_ID');
  }

  if (!isNonEmptyString(input.altaDate)) {
    blockingReasons.push('MISSING_ALTA_DATE');
  }

  return {
    isValid: blockingReasons.length === 0,
    status: blockingReasons.length === 0 ? 'READY_FOR_CONTRACT' : 'BLOCKED_OR_UNKNOWN',
    blockingReasons
  };
}

function validateAltaPartnerPaymentGate(input = {}) {
  const blockingReasons = [];

  if (!isValidPaymentNumber(input.paymentNumber)) {
    blockingReasons.push('INVALID_PAYMENT_NUMBER');
  }

  if (!isNonEmptyString(input.paymentGenerationMonth)) {
    blockingReasons.push('MISSING_PAYMENT_GENERATION_MONTH');
  }

  if (!evidenceIsConfirmed(input.partnerActiveEvidence)) {
    blockingReasons.push('PARTNER_ACTIVE_EVIDENCE_NOT_CONFIRMED');
  }

  if (!evidenceIsConfirmed(input.promotedAdvisorActiveEvidence)) {
    blockingReasons.push('PROMOTED_ADVISOR_ACTIVE_EVIDENCE_NOT_CONFIRMED');
  }

  return {
    isValid: blockingReasons.length === 0,
    status: blockingReasons.length === 0 ? 'READY_FOR_CONTRACT' : 'BLOCKED_OR_UNKNOWN',
    blockingReasons
  };
}

function validateAltaPartnerRecoveryGate(input = {}) {
  const blockingReasons = [];

  if (input.recoveryRequested !== true) {
    return {
      isValid: false,
      status: 'NOT_REQUESTED',
      recoveryApplies: false,
      blockingReasons: ['RECOVERY_NOT_REQUESTED']
    };
  }

  if (!isPositiveInteger(input.recoveryMonthsRequested)) {
    blockingReasons.push('MISSING_RECOVERY_MONTHS_REQUESTED');
  } else if (input.recoveryMonthsRequested > ALTA_PARTNER_MAX_RECOVERY_MONTHS) {
    blockingReasons.push('RECOVERY_MONTH_LIMIT_EXCEEDED');
  }

  if (!evidenceIsConfirmed(input.recoveredSupportEvidence)) {
    blockingReasons.push('RECOVERED_APOYO_EVIDENCE_NOT_CONFIRMED');
  }

  if (!evidenceIsConfirmed(input.recoveryRequestEvidence)) {
    blockingReasons.push('RECOVERY_REQUEST_EVIDENCE_NOT_CONFIRMED');
  }

  if (!evidenceIsConfirmed(input.sameCalendarYearEvidence)) {
    blockingReasons.push('SAME_CALENDAR_YEAR_EVIDENCE_NOT_CONFIRMED');
  }

  return {
    isValid: blockingReasons.length === 0,
    status: blockingReasons.length === 0 ? 'READY_FOR_CONTRACT' : 'BLOCKED_OR_UNKNOWN',
    recoveryApplies: blockingReasons.length === 0,
    blockingReasons
  };
}

function validateAltaPartnerSupportGate(input = {}) {
  if (evidenceIsConfirmed(input.promotedAdvisorSupportEvidence)) {
    return {
      isValid: true,
      status: 'READY_FOR_CONTRACT',
      supportSatisfiedBy: 'CURRENT_APOYO_EVIDENCE',
      blockingReasons: []
    };
  }

  const recoveryGate = validateAltaPartnerRecoveryGate(input);

  if (recoveryGate.isValid) {
    return {
      isValid: true,
      status: 'READY_FOR_CONTRACT',
      supportSatisfiedBy: 'RECOVERED_APOYO_EVIDENCE',
      recoveryGate,
      blockingReasons: []
    };
  }

  return {
    isValid: false,
    status: 'BLOCKED_OR_UNKNOWN',
    supportSatisfiedBy: null,
    recoveryGate,
    blockingReasons: [
      'PROMOTED_ADVISOR_APOYO_EVIDENCE_NOT_CONFIRMED',
      ...recoveryGate.blockingReasons
    ]
  };
}

function validateAltaPartnerBonusContract(input = {}) {
  const identityGate = validateAltaPartnerIdentity(input);
  const paymentGate = validateAltaPartnerPaymentGate(input);
  const supportGate = validateAltaPartnerSupportGate(input);

  const blockingReasons = [
    ...identityGate.blockingReasons,
    ...paymentGate.blockingReasons,
    ...supportGate.blockingReasons
  ];

  if (input.payoutTruth === true) {
    blockingReasons.push('PAYOUT_TRUTH_INPUT_NOT_ALLOWED_FOR_CANDIDATE_CONTRACT');
  }

  const readyForCandidateCalculator = blockingReasons.length === 0;
  const scheduledAmount = getAltaPartnerPaymentAmount(input.paymentNumber);

  return {
    concept: 'partner-promotion-bonus',
    status: readyForCandidateCalculator ? 'READY_FOR_CANDIDATE_CALCULATOR' : 'BLOCKED_OR_UNKNOWN',
    readyForCandidateCalculator,
    calculationPerformed: false,
    candidateAmount: null,
    payoutTruth: false,
    paymentNumber: isValidPaymentNumber(input.paymentNumber) ? input.paymentNumber : null,
    scheduledAmount,
    totalScheduleAmount: ALTA_PARTNER_TOTAL_BONUS_AMOUNT,
    paymentCount: ALTA_PARTNER_PAYMENT_COUNT,
    maxRecoveryMonths: ALTA_PARTNER_MAX_RECOVERY_MONTHS,
    blockingReasons,
    identityGate,
    paymentGate,
    supportGate
  };
}

module.exports = {
  ALTA_PARTNER_TOTAL_BONUS_AMOUNT,
  ALTA_PARTNER_FIRST_PAYMENT_AMOUNT,
  ALTA_PARTNER_RECURRING_PAYMENT_AMOUNT,
  ALTA_PARTNER_PAYMENT_COUNT,
  ALTA_PARTNER_MAX_RECOVERY_MONTHS,
  ALTA_PARTNER_PAYMENT_SCHEDULE,
  evidenceIsConfirmed,
  getAltaPartnerPaymentAmount,
  getAltaPartnerScheduleTotal,
  validateAltaPartnerIdentity,
  validateAltaPartnerPaymentGate,
  validateAltaPartnerRecoveryGate,
  validateAltaPartnerSupportGate,
  validateAltaPartnerBonusContract
};
