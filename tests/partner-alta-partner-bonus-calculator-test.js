'use strict';

const {
  calculateAltaPartnerPaymentCandidate,
  calculateAltaPartnerScheduleCandidate
} = require('../compensation/partner-manager/partner-alta-partner-bonus-calculator');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function confirmedEvidence(overrides = {}) {
  return {
    status: 'confirmed',
    ...overrides
  };
}

function paymentInput(paymentNumber, overrides = {}) {
  return {
    partnerId: 'partner-001',
    promotedAdvisorId: 'advisor-promoted-001',
    promotionEventId: 'promotion-event-001',
    altaDate: '2026-03-15',
    paymentNumber,
    paymentGenerationMonth: `2026-${String(paymentNumber + 3).padStart(2, '0')}`,
    partnerActiveEvidence: confirmedEvidence(),
    promotedAdvisorActiveEvidence: confirmedEvidence(),
    promotedAdvisorSupportEvidence: confirmedEvidence({ received: true }),
    payoutTruth: false,
    ...overrides
  };
}

function fullScheduleInputs(overridesByPayment = {}) {
  return Array.from({ length: 13 }, (_, index) => {
    const paymentNumber = index + 1;
    return paymentInput(paymentNumber, overridesByPayment[paymentNumber] || {});
  });
}

function testCalculatesPaymentOneCandidate() {
  const result = calculateAltaPartnerPaymentCandidate(paymentInput(1));

  assert(result.status === 'CANDIDATE_CALCULATED', 'Payment 1 should calculate.');
  assert(result.candidateAmount === 60000, 'Payment 1 candidateAmount should be 60000.');
  assert(result.scheduledAmount === 60000, 'Payment 1 scheduledAmount should be 60000.');
  assert(result.calculationPerformed === true, 'Payment 1 should perform calculation.');
  assert(result.payoutTruth === false, 'Payment candidate must keep payoutTruth false.');
}

function testCalculatesRecurringPaymentCandidate() {
  const result = calculateAltaPartnerPaymentCandidate(paymentInput(2));

  assert(result.status === 'CANDIDATE_CALCULATED', 'Payment 2 should calculate.');
  assert(result.candidateAmount === 20000, 'Payment 2 candidateAmount should be 20000.');
  assert(result.scheduledAmount === 20000, 'Payment 2 scheduledAmount should be 20000.');
  assert(result.payoutTruth === false, 'Payment 2 must keep payoutTruth false.');
}

function testCalculatesFullThirteenPaymentSchedule() {
  const result = calculateAltaPartnerScheduleCandidate({
    paymentInputs: fullScheduleInputs()
  });

  assert(result.status === 'CANDIDATE_CALCULATED', 'Full 13-payment schedule should calculate.');
  assert(result.calculationPerformed === true, 'Full schedule should perform calculation.');
  assert(result.candidateAmount === 300000, 'Full schedule candidateAmount should be 300000.');
  assert(result.totalCandidateAmount === 300000, 'Full schedule totalCandidateAmount should be 300000.');
  assert(result.totalScheduleAmount === 300000, 'Full schedule totalScheduleAmount should be 300000.');
  assert(result.expectedPaymentCount === 13, 'Expected payment count should be 13.');
  assert(result.paymentResults.length === 13, 'Payment results should have 13 lines.');
  assert(result.payoutTruth === false, 'Full schedule must keep payoutTruth false.');
}

function testMissingScheduleLineBlocksWithoutZero() {
  const inputs = fullScheduleInputs().filter((item) => item.paymentNumber !== 13);
  const result = calculateAltaPartnerScheduleCandidate({ paymentInputs: inputs });

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Missing payment 13 should block.');
  assert(result.calculationPerformed === false, 'Missing schedule must not calculate.');
  assert(result.candidateAmount === null, 'Missing schedule must not become zero.');
  assert(result.totalCandidateAmount === null, 'Missing schedule total must be null.');
  assert(
    result.blockingReasons.includes('SCHEDULE_MISSING_PAYMENT_13'),
    'Missing payment 13 reason required.'
  );
}

function testDuplicateScheduleLineBlocksWithoutZero() {
  const inputs = fullScheduleInputs();
  inputs.push(paymentInput(13));

  const result = calculateAltaPartnerScheduleCandidate({ paymentInputs: inputs });

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Duplicate payment should block.');
  assert(result.candidateAmount === null, 'Duplicate schedule must not become zero.');
  assert(
    result.blockingReasons.includes('SCHEDULE_DUPLICATE_PAYMENT_13'),
    'Duplicate payment 13 reason required.'
  );
}

function testMissingApoyoBlocksPaymentWithoutZero() {
  const result = calculateAltaPartnerPaymentCandidate(
    paymentInput(3, {
      promotedAdvisorSupportEvidence: false
    })
  );

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Missing Apoyo should block payment.');
  assert(result.calculationPerformed === false, 'Blocked payment must not calculate.');
  assert(result.candidateAmount === null, 'Missing Apoyo must not become zero.');
  assert(
    result.blockingReasons.includes('PROMOTED_ADVISOR_APOYO_EVIDENCE_NOT_CONFIRMED'),
    'Missing Apoyo reason required.'
  );
}

function testRecoveredApoyoCalculatesPayment() {
  const result = calculateAltaPartnerPaymentCandidate(
    paymentInput(4, {
      promotedAdvisorSupportEvidence: false,
      recoveryRequested: true,
      recoveryMonthsRequested: 3,
      recoveredSupportEvidence: confirmedEvidence(),
      recoveryRequestEvidence: confirmedEvidence(),
      sameCalendarYearEvidence: confirmedEvidence()
    })
  );

  assert(result.status === 'CANDIDATE_CALCULATED', 'Recovered Apoyo should calculate payment.');
  assert(result.candidateAmount === 20000, 'Recovered recurring payment should calculate 20000.');
  assert(result.payoutTruth === false, 'Recovered payment must keep payoutTruth false.');
}

function testRecoveryOverThreeMonthsBlocksPayment() {
  const result = calculateAltaPartnerPaymentCandidate(
    paymentInput(5, {
      promotedAdvisorSupportEvidence: false,
      recoveryRequested: true,
      recoveryMonthsRequested: 4,
      recoveredSupportEvidence: confirmedEvidence(),
      recoveryRequestEvidence: confirmedEvidence(),
      sameCalendarYearEvidence: confirmedEvidence()
    })
  );

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Recovery over 3 months should block.');
  assert(result.candidateAmount === null, 'Recovery over 3 months must not become zero.');
  assert(
    result.blockingReasons.includes('RECOVERY_MONTH_LIMIT_EXCEEDED'),
    'Recovery limit reason required.'
  );
}

function testInactivePartnerBlocksPayment() {
  const result = calculateAltaPartnerPaymentCandidate(
    paymentInput(6, {
      partnerActiveEvidence: false
    })
  );

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Inactive Partner should block payment.');
  assert(result.candidateAmount === null, 'Inactive Partner must not become zero.');
  assert(
    result.blockingReasons.includes('PARTNER_ACTIVE_EVIDENCE_NOT_CONFIRMED'),
    'Partner active reason required.'
  );
}

function testPayoutTruthInputBlocksPayment() {
  const result = calculateAltaPartnerPaymentCandidate(
    paymentInput(7, {
      payoutTruth: true
    })
  );

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'payoutTruth input should block candidate payment.');
  assert(result.payoutTruth === false, 'Output must force payoutTruth false.');
  assert(result.candidateAmount === null, 'payoutTruth input must not become zero.');
  assert(
    result.blockingReasons.includes('PAYOUT_TRUTH_INPUT_NOT_ALLOWED_FOR_CANDIDATE_CONTRACT'),
    'payoutTruth boundary reason required.'
  );
}

function testMissingPaymentInputsBlockScheduleWithoutZero() {
  const result = calculateAltaPartnerScheduleCandidate({});

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Missing payment inputs should block schedule.');
  assert(result.candidateAmount === null, 'Missing inputs must not become zero.');
  assert(result.totalCandidateAmount === null, 'Missing inputs total must be null.');
  assert(
    result.blockingReasons.includes('NO_ALTA_PARTNER_PAYMENT_INPUTS'),
    'Missing inputs reason required.'
  );
}

testCalculatesPaymentOneCandidate();
testCalculatesRecurringPaymentCandidate();
testCalculatesFullThirteenPaymentSchedule();
testMissingScheduleLineBlocksWithoutZero();
testDuplicateScheduleLineBlocksWithoutZero();
testMissingApoyoBlocksPaymentWithoutZero();
testRecoveredApoyoCalculatesPayment();
testRecoveryOverThreeMonthsBlocksPayment();
testInactivePartnerBlocksPayment();
testPayoutTruthInputBlocksPayment();
testMissingPaymentInputsBlockScheduleWithoutZero();

console.log('PASS partner-alta-partner-bonus-calculator-test');
