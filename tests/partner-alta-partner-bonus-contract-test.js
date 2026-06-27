'use strict';

const {
  ALTA_PARTNER_TOTAL_BONUS_AMOUNT,
  ALTA_PARTNER_PAYMENT_COUNT,
  ALTA_PARTNER_MAX_RECOVERY_MONTHS,
  getAltaPartnerPaymentAmount,
  getAltaPartnerScheduleTotal,
  validateAltaPartnerBonusContract,
  validateAltaPartnerRecoveryGate,
  validateAltaPartnerSupportGate
} = require('../compensation/partner-manager/partner-alta-partner-bonus-contract');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function confirmedEvidence(overrides = {}) {
  return {
    status: 'confirmed',
    ...overrides
  };
}

function baseInput(overrides = {}) {
  return {
    partnerId: 'partner-001',
    promotedAdvisorId: 'advisor-promoted-001',
    promotionEventId: 'promotion-event-001',
    altaDate: '2026-03-15',
    paymentNumber: 1,
    paymentGenerationMonth: '2026-04',
    partnerActiveEvidence: confirmedEvidence(),
    promotedAdvisorActiveEvidence: confirmedEvidence(),
    promotedAdvisorSupportEvidence: confirmedEvidence({ received: true }),
    payoutTruth: false,
    ...overrides
  };
}

function testReadyContractPaymentOneWithoutCalculation() {
  const result = validateAltaPartnerBonusContract(baseInput());

  assert(result.status === 'READY_FOR_CANDIDATE_CALCULATOR', 'Complete Alta Partner evidence should be ready.');
  assert(result.readyForCandidateCalculator === true, 'Contract should be ready.');
  assert(result.calculationPerformed === false, 'Contract must not calculate.');
  assert(result.candidateAmount === null, 'Contract must not emit candidateAmount.');
  assert(result.payoutTruth === false, 'Contract must keep payoutTruth false.');
  assert(result.paymentNumber === 1, 'Payment number should be 1.');
  assert(result.scheduledAmount === 60000, 'Payment 1 scheduled amount should be 60000.');
  assert(result.totalScheduleAmount === 300000, 'Total schedule amount should be 300000.');
}

function testScheduleConstants() {
  assert(ALTA_PARTNER_TOTAL_BONUS_AMOUNT === 300000, 'Total Alta Partner bonus should be 300000.');
  assert(ALTA_PARTNER_PAYMENT_COUNT === 13, 'Schedule should have 13 payments.');
  assert(ALTA_PARTNER_MAX_RECOVERY_MONTHS === 3, 'Recovery max should be 3 months.');
  assert(getAltaPartnerPaymentAmount(1) === 60000, 'Payment 1 should be 60000.');
  assert(getAltaPartnerPaymentAmount(2) === 20000, 'Payment 2 should be 20000.');
  assert(getAltaPartnerPaymentAmount(13) === 20000, 'Payment 13 should be 20000.');
  assert(getAltaPartnerPaymentAmount(14) === null, 'Payment 14 should be invalid.');
  assert(getAltaPartnerScheduleTotal() === 300000, 'Schedule total should be 300000.');
}

function testPaymentThirteenReady() {
  const result = validateAltaPartnerBonusContract(
    baseInput({
      paymentNumber: 13,
      paymentGenerationMonth: '2027-04'
    })
  );

  assert(result.readyForCandidateCalculator === true, 'Payment 13 should be ready with evidence.');
  assert(result.scheduledAmount === 20000, 'Payment 13 should be 20000.');
}

function testMissingApoyoBlocksWithoutZero() {
  const result = validateAltaPartnerBonusContract(
    baseInput({
      promotedAdvisorSupportEvidence: false
    })
  );

  assert(result.readyForCandidateCalculator === false, 'Missing Apoyo should block.');
  assert(result.candidateAmount === null, 'Missing Apoyo must not become zero.');
  assert(
    result.blockingReasons.includes('PROMOTED_ADVISOR_APOYO_EVIDENCE_NOT_CONFIRMED'),
    'Missing Apoyo reason required.'
  );
}

function testRecoveryAllowsSupportGateOnlyWithEvidence() {
  const supportGate = validateAltaPartnerSupportGate({
    promotedAdvisorSupportEvidence: false,
    recoveryRequested: true,
    recoveryMonthsRequested: 3,
    recoveredSupportEvidence: confirmedEvidence(),
    recoveryRequestEvidence: confirmedEvidence(),
    sameCalendarYearEvidence: confirmedEvidence()
  });

  assert(supportGate.isValid === true, 'Recovery gate should satisfy support with complete evidence.');
  assert(supportGate.supportSatisfiedBy === 'RECOVERED_APOYO_EVIDENCE', 'Support should be recovered.');

  const result = validateAltaPartnerBonusContract(
    baseInput({
      promotedAdvisorSupportEvidence: false,
      recoveryRequested: true,
      recoveryMonthsRequested: 3,
      recoveredSupportEvidence: confirmedEvidence(),
      recoveryRequestEvidence: confirmedEvidence(),
      sameCalendarYearEvidence: confirmedEvidence()
    })
  );

  assert(result.readyForCandidateCalculator === true, 'Recovered Apoyo should allow contract readiness.');
  assert(result.candidateAmount === null, 'Contract still must not calculate.');
}

function testRecoveryMoreThanThreeMonthsBlocks() {
  const result = validateAltaPartnerBonusContract(
    baseInput({
      promotedAdvisorSupportEvidence: false,
      recoveryRequested: true,
      recoveryMonthsRequested: 4,
      recoveredSupportEvidence: confirmedEvidence(),
      recoveryRequestEvidence: confirmedEvidence(),
      sameCalendarYearEvidence: confirmedEvidence()
    })
  );

  assert(result.readyForCandidateCalculator === false, 'Recovery over 3 months must block.');
  assert(result.candidateAmount === null, 'Recovery over 3 months must not become zero.');
  assert(
    result.blockingReasons.includes('RECOVERY_MONTH_LIMIT_EXCEEDED'),
    'Recovery limit reason required.'
  );
}

function testRecoveryRequiresSameCalendarYearEvidence() {
  const recoveryGate = validateAltaPartnerRecoveryGate({
    recoveryRequested: true,
    recoveryMonthsRequested: 2,
    recoveredSupportEvidence: confirmedEvidence(),
    recoveryRequestEvidence: confirmedEvidence(),
    sameCalendarYearEvidence: false
  });

  assert(recoveryGate.isValid === false, 'Missing same calendar year evidence must block.');
  assert(
    recoveryGate.blockingReasons.includes('SAME_CALENDAR_YEAR_EVIDENCE_NOT_CONFIRMED'),
    'Same calendar year reason required.'
  );
}

function testInactivePartnerBlocks() {
  const result = validateAltaPartnerBonusContract(
    baseInput({
      partnerActiveEvidence: false
    })
  );

  assert(result.readyForCandidateCalculator === false, 'Inactive Partner should block.');
  assert(result.candidateAmount === null, 'Inactive Partner must not become zero.');
  assert(
    result.blockingReasons.includes('PARTNER_ACTIVE_EVIDENCE_NOT_CONFIRMED'),
    'Partner active reason required.'
  );
}

function testInactivePromotedAdvisorBlocks() {
  const result = validateAltaPartnerBonusContract(
    baseInput({
      promotedAdvisorActiveEvidence: false
    })
  );

  assert(result.readyForCandidateCalculator === false, 'Inactive promoted advisor should block.');
  assert(result.candidateAmount === null, 'Inactive promoted advisor must not become zero.');
  assert(
    result.blockingReasons.includes('PROMOTED_ADVISOR_ACTIVE_EVIDENCE_NOT_CONFIRMED'),
    'Promoted advisor active reason required.'
  );
}

function testInvalidPaymentNumberBlocks() {
  const result = validateAltaPartnerBonusContract(
    baseInput({
      paymentNumber: 14
    })
  );

  assert(result.readyForCandidateCalculator === false, 'Invalid payment number should block.');
  assert(result.candidateAmount === null, 'Invalid payment must not become zero.');
  assert(result.scheduledAmount === null, 'Invalid payment should not have scheduled amount.');
  assert(
    result.blockingReasons.includes('INVALID_PAYMENT_NUMBER'),
    'Invalid payment reason required.'
  );
}

function testPayoutTruthInputBlocks() {
  const result = validateAltaPartnerBonusContract(
    baseInput({
      payoutTruth: true
    })
  );

  assert(result.readyForCandidateCalculator === false, 'payoutTruth input should block candidate contract.');
  assert(result.payoutTruth === false, 'Output must still force payoutTruth false.');
  assert(
    result.blockingReasons.includes('PAYOUT_TRUTH_INPUT_NOT_ALLOWED_FOR_CANDIDATE_CONTRACT'),
    'payoutTruth boundary reason required.'
  );
}

testReadyContractPaymentOneWithoutCalculation();
testScheduleConstants();
testPaymentThirteenReady();
testMissingApoyoBlocksWithoutZero();
testRecoveryAllowsSupportGateOnlyWithEvidence();
testRecoveryMoreThanThreeMonthsBlocks();
testRecoveryRequiresSameCalendarYearEvidence();
testInactivePartnerBlocks();
testInactivePromotedAdvisorBlocks();
testInvalidPaymentNumberBlocks();
testPayoutTruthInputBlocks();

console.log('PASS partner-alta-partner-bonus-contract-test');
