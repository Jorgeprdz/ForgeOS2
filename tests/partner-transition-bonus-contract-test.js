'use strict';

const {
  VALID_TRANSITION_COMMISSION_TYPES,
  validatePartnerTransitionLineage,
  validateTransitionEligibilityEvidence,
  validateTransitionCommissionLedgerLine,
  assessTransitionContractReadiness
} = require('../compensation/partner-manager/partner-transition-bonus-contract');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function lineage(overrides = {}) {
  return {
    partnerId: 'partner-001',
    formerAdvisorId: 'advisor-001',
    formerAdvisorCode: 'ADV001',
    formerAdvisorCompensationKey: 'KEY-ADV-001',
    partnerContractDate: '2026-01-01',
    partnerCareerMonth: 1,
    directKey: 'DIRECT-ADV-001',
    assignedPortfolioId: 'PORT-ADV-001',
    lineageEvidence: { status: 'confirmed' },
    ...overrides
  };
}

function evidence(overrides = {}) {
  return {
    nonAdministrationEvidence: { status: 'confirmed' },
    nonClientInterventionEvidence: { status: 'confirmed' },
    directKeyAttributionEvidence: { status: 'confirmed' },
    assignedPortfolioEvidence: { status: 'confirmed' },
    ...overrides
  };
}

function ledger(overrides = {}) {
  return {
    ledgerLineId: 'ledger-001',
    partnerId: 'partner-001',
    formerAdvisorId: 'advisor-001',
    formerAdvisorCompensationKey: 'KEY-ADV-001',
    directKey: 'DIRECT-ADV-001',
    assignedPortfolioId: 'PORT-ADV-001',
    commissionType: 'initial',
    commissionAmount: 1000,
    premiumPaymentDate: '2026-01-15',
    commissionPaidDate: '2026-01-31',
    paidPremiumEvidence: { status: 'confirmed' },
    paidAppliedCommissionEvidence: { status: 'confirmed' },
    ...overrides
  };
}

function testReadyWithInitialAndRenewalButNoCalculation() {
  const result = assessTransitionContractReadiness({
    lineage: lineage(),
    eligibilityEvidence: evidence(),
    ledgerLines: [
      ledger({ ledgerLineId: 'initial-1', commissionType: 'initial', commissionAmount: 1000 }),
      ledger({ ledgerLineId: 'renewal-1', commissionType: 'renewal', commissionAmount: 500 })
    ]
  });

  assert(result.readyForCandidateCalculator === true, 'Should be ready for candidate calculator.');
  assert(result.calculationPerformed === false, 'Contract must not calculate.');
  assert(result.candidateAmount === null, 'Contract must not emit candidateAmount.');
  assert(result.payoutTruth === false, 'Contract must keep payoutTruth false.');
  assert(result.eligibleCommissionTypes.includes('initial'), 'Must support initial.');
  assert(result.eligibleCommissionTypes.includes('renewal'), 'Must support renewal.');
}

function testMissingFormerAdvisorKeyBlocks() {
  const result = validatePartnerTransitionLineage(
    lineage({ formerAdvisorCompensationKey: '' })
  );

  assert(result.isValid === false, 'Missing former advisor key must block.');
  assert(
    result.blockingReasons.includes('MISSING_FORMER_ADVISOR_COMPENSATION_KEY'),
    'Missing former advisor key reason required.'
  );
}

function testMonthSevenBlocks() {
  const result = validatePartnerTransitionLineage(
    lineage({ partnerCareerMonth: 7 })
  );

  assert(result.isValid === false, 'Month 7 must block.');
  assert(
    result.blockingReasons.includes('TRANSITION_WINDOW_OUTSIDE_MONTHS_1_6'),
    'Window block reason required.'
  );
}

function testInvalidCommissionTypeAndMissingAmountBlockWithoutZero() {
  const invalid = validateTransitionCommissionLedgerLine(
    ledger({ commissionType: 'bonus' }),
    lineage(),
    0
  );

  assert(invalid.isValid === false, 'Invalid commission type must block.');
  assert(
    invalid.blockingReasons.includes('LEDGER_0_INVALID_COMMISSION_TYPE'),
    'Invalid type reason required.'
  );

  const missingAmount = assessTransitionContractReadiness({
    lineage: lineage(),
    eligibilityEvidence: evidence(),
    ledgerLines: [ledger({ commissionAmount: undefined })]
  });

  assert(missingAmount.readyForCandidateCalculator === false, 'Missing amount must block.');
  assert(missingAmount.candidateAmount === null, 'Missing amount must not become zero.');
  assert(
    missingAmount.blockingReasons.includes('LEDGER_0_MISSING_OR_INVALID_COMMISSION_AMOUNT'),
    'Missing amount reason required.'
  );
}

function testEvidenceGatesBlock() {
  const result = validateTransitionEligibilityEvidence(
    evidence({
      nonAdministrationEvidence: false,
      nonClientInterventionEvidence: false
    })
  );

  assert(result.isValid === false, 'Evidence gates must block.');
  assert(
    result.blockingReasons.includes('NON_ADMINISTRATION_EVIDENCE_NOT_CONFIRMED'),
    'Non-admin reason required.'
  );
  assert(
    result.blockingReasons.includes('NON_CLIENT_INTERVENTION_EVIDENCE_NOT_CONFIRMED'),
    'Non-intervention reason required.'
  );
}

function testLedgerMustMatchLineageAndPaidEvidence() {
  const mismatch = validateTransitionCommissionLedgerLine(
    ledger({
      formerAdvisorCompensationKey: 'OTHER',
      directKey: 'OTHER',
      assignedPortfolioId: 'OTHER'
    }),
    lineage(),
    0
  );

  assert(mismatch.isValid === false, 'Mismatched ledger must block.');
  assert(
    mismatch.blockingReasons.includes('LEDGER_0_FORMER_ADVISOR_KEY_DOES_NOT_MATCH_LINEAGE'),
    'Advisor key mismatch reason required.'
  );
  assert(
    mismatch.blockingReasons.includes('LEDGER_0_DIRECT_KEY_OR_PORTFOLIO_DOES_NOT_MATCH_LINEAGE'),
    'Direct key/portfolio mismatch reason required.'
  );

  const unpaid = assessTransitionContractReadiness({
    lineage: lineage(),
    eligibilityEvidence: evidence(),
    ledgerLines: [
      ledger({
        paidPremiumEvidence: false,
        paidAppliedCommissionEvidence: false
      })
    ]
  });

  assert(unpaid.readyForCandidateCalculator === false, 'Unpaid evidence must block.');
  assert(
    unpaid.blockingReasons.includes('LEDGER_0_PAID_PREMIUM_EVIDENCE_NOT_CONFIRMED'),
    'Paid premium reason required.'
  );
  assert(
    unpaid.blockingReasons.includes('LEDGER_0_PAID_APPLIED_COMMISSION_EVIDENCE_NOT_CONFIRMED'),
    'Paid applied reason required.'
  );
}

function testSupportedTypesExactlyInitialAndRenewal() {
  assert(VALID_TRANSITION_COMMISSION_TYPES.length === 2, 'Only two types allowed.');
  assert(VALID_TRANSITION_COMMISSION_TYPES.includes('initial'), 'Initial required.');
  assert(VALID_TRANSITION_COMMISSION_TYPES.includes('renewal'), 'Renewal required.');
}

testReadyWithInitialAndRenewalButNoCalculation();
testMissingFormerAdvisorKeyBlocks();
testMonthSevenBlocks();
testInvalidCommissionTypeAndMissingAmountBlockWithoutZero();
testEvidenceGatesBlock();
testLedgerMustMatchLineageAndPaidEvidence();
testSupportedTypesExactlyInitialAndRenewal();

console.log('PASS partner-transition-bonus-contract-test');
