'use strict';

const {
  orchestratePartnerTransitionBonusCandidates
} = require('../compensation/partner-manager/partner-transition-bonus-orchestrator');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function lineage(month = 1, overrides = {}) {
  return {
    partnerId: 'partner-001',
    formerAdvisorId: 'advisor-001',
    formerAdvisorCode: 'ADV001',
    formerAdvisorCompensationKey: 'KEY-ADV-001',
    partnerContractDate: '2026-01-01',
    partnerCareerMonth: month,
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

function ledger(month, overrides = {}) {
  return {
    ledgerLineId: `ledger-${month}-initial`,
    partnerId: 'partner-001',
    formerAdvisorId: 'advisor-001',
    formerAdvisorCompensationKey: 'KEY-ADV-001',
    directKey: 'DIRECT-ADV-001',
    assignedPortfolioId: 'PORT-ADV-001',
    commissionType: 'initial',
    commissionAmount: 1000,
    premiumPaymentDate: `2026-0${month}-15`,
    commissionPaidDate: `2026-0${month}-28`,
    paidPremiumEvidence: { status: 'confirmed' },
    paidAppliedCommissionEvidence: { status: 'confirmed' },
    ...overrides
  };
}

function monthInput(month, lines) {
  return {
    monthId: `M${month}`,
    partnerCareerMonth: month,
    lineage: lineage(month),
    eligibilityEvidence: evidence(),
    ledgerLines: lines
  };
}

function testOrchestratesSixMonthTransitionCandidate() {
  const result = orchestratePartnerTransitionBonusCandidates({
    monthlyTransitionInputs: [
      monthInput(1, [
        ledger(1, { ledgerLineId: 'm1-i', commissionType: 'initial', commissionAmount: 1000 }),
        ledger(1, { ledgerLineId: 'm1-r', commissionType: 'renewal', commissionAmount: 400 })
      ]),
      monthInput(2, [
        ledger(2, { ledgerLineId: 'm2-i', commissionType: 'initial', commissionAmount: 1200 }),
        ledger(2, { ledgerLineId: 'm2-r', commissionType: 'renewal', commissionAmount: 500 })
      ]),
      monthInput(3, [
        ledger(3, { ledgerLineId: 'm3-i', commissionType: 'initial', commissionAmount: 800 })
      ]),
      monthInput(4, [
        ledger(4, { ledgerLineId: 'm4-r', commissionType: 'renewal', commissionAmount: 300 })
      ]),
      monthInput(5, [
        ledger(5, { ledgerLineId: 'm5-i', commissionType: 'initial', commissionAmount: 700 })
      ]),
      monthInput(6, [
        ledger(6, { ledgerLineId: 'm6-r', commissionType: 'renewal', commissionAmount: 600 })
      ])
    ]
  });

  assert(result.status === 'ALL_CANDIDATES_CALCULATED', 'All valid months should calculate.');
  assert(result.calculatedMonthCount === 6, 'Six months should calculate.');
  assert(result.blockedMonthCount === 0, 'No valid month should block.');
  assert(result.totalCandidateAmount === 5500, 'Total candidate should sum all six months.');
  assert(result.eligibleInitialCommissions === 3700, 'Initial total should be 3700.');
  assert(result.eligibleRenewalCommissions === 1800, 'Renewal total should be 1800.');
  assert(result.payoutTruth === false, 'Orchestrator must keep payoutTruth false.');
  assert(result.quarterlyFlowTouched === false, 'Orchestrator must not touch quarterly flow.');
}

function testMonthSevenIsBlockedAndNotSummed() {
  const result = orchestratePartnerTransitionBonusCandidates({
    monthlyTransitionInputs: [
      monthInput(1, [
        ledger(1, { commissionType: 'initial', commissionAmount: 1000 })
      ]),
      monthInput(7, [
        ledger(7, {
          ledgerLineId: 'm7-i',
          commissionType: 'initial',
          commissionAmount: 9999,
          premiumPaymentDate: '2026-07-15',
          commissionPaidDate: '2026-07-28'
        })
      ])
    ]
  });

  assert(result.status === 'PARTIAL_WITH_BLOCKS', 'Valid plus blocked months should be partial.');
  assert(result.calculatedMonthCount === 1, 'Only month 1 should calculate.');
  assert(result.blockedMonthCount === 1, 'Month 7 should block.');
  assert(result.totalCandidateAmount === 1000, 'Month 7 must not be summed.');
  assert(
    result.blockingReasons.includes('TRANSITION_WINDOW_OUTSIDE_MONTHS_1_6'),
    'Month 7 block reason required.'
  );
}

function testMissingMonthlyInputsBlocksWithoutZero() {
  const result = orchestratePartnerTransitionBonusCandidates({});

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Missing monthly inputs must block.');
  assert(result.totalCandidateAmount === null, 'Missing monthly inputs must not become zero.');
  assert(result.payoutTruth === false, 'Missing inputs must keep payoutTruth false.');
  assert(
    result.blockingReasons.includes('NO_MONTHLY_TRANSITION_INPUTS'),
    'Missing monthly input reason required.'
  );
}

function testMissingEvidenceBlocksMonthWithoutZero() {
  const result = orchestratePartnerTransitionBonusCandidates({
    monthlyTransitionInputs: [
      {
        monthId: 'M1',
        partnerCareerMonth: 1,
        lineage: lineage(1),
        eligibilityEvidence: evidence({
          nonAdministrationEvidence: false
        }),
        ledgerLines: [
          ledger(1, { commissionType: 'renewal', commissionAmount: 500 })
        ]
      }
    ]
  });

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Missing evidence must block.');
  assert(result.totalCandidateAmount === null, 'Blocked only month must not become zero.');
  assert(
    result.blockingReasons.includes('NON_ADMINISTRATION_EVIDENCE_NOT_CONFIRMED'),
    'Non-administration reason required.'
  );
}

function testMismatchedLedgerBlocks() {
  const result = orchestratePartnerTransitionBonusCandidates({
    monthlyTransitionInputs: [
      monthInput(1, [
        ledger(1, {
          formerAdvisorCompensationKey: 'OTHER-KEY',
          directKey: 'OTHER-DIRECT',
          assignedPortfolioId: 'OTHER-PORT',
          commissionAmount: 1000
        })
      ])
    ]
  });

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Mismatched ledger must block.');
  assert(result.totalCandidateAmount === null, 'Mismatched ledger must not become zero.');
  assert(
    result.blockingReasons.includes('LEDGER_0_FORMER_ADVISOR_KEY_DOES_NOT_MATCH_LINEAGE'),
    'Former advisor key mismatch reason required.'
  );
}

testOrchestratesSixMonthTransitionCandidate();
testMonthSevenIsBlockedAndNotSummed();
testMissingMonthlyInputsBlocksWithoutZero();
testMissingEvidenceBlocksMonthWithoutZero();
testMismatchedLedgerBlocks();

console.log('PASS partner-transition-bonus-orchestrator-test');
