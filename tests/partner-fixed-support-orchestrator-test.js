import assert from 'node:assert/strict';

import {
  orchestratePcv2026FixedSupportMonthlyCandidate,
  orchestratePcv2026FixedSupportMonthlyPeriodCandidates,
  orchestratePcv2026FixedSupportRecoveryCandidate,
} from '../compensation/partner-manager/partner-fixed-support-orchestrator.js';

function monthlyInput(overrides = {}) {
  return {
    careerMonth: 1,
    initialCommissionsLifeAndIndividualGmm: 14500,
    firstTwoHiresExclusionApplied: true,
    trainingAdvisorWinnersLastSixMonths: 0,
    payoutTruth: false,
    ...overrides,
  };
}

function assertNoProductionPayoutOperationFields(result) {
  const serialized = JSON.stringify(result);

  assert.equal(Object.hasOwn(result, 'productionPayoutOperationsTouched'), false);
  assert.equal(Object.hasOwn(result, 'officialStatementIngestion'), false);
  assert.equal(serialized.includes('productionPayout'), false);
  assert.equal(serialized.includes('officialStatementAdapter'), false);
}

const monthlyFullSupport = orchestratePcv2026FixedSupportMonthlyCandidate(monthlyInput());

assert.equal(monthlyFullSupport.concept, 'fixed-support');
assert.equal(monthlyFullSupport.status, 'CALCULATED_CANDIDATE');
assert.equal(monthlyFullSupport.candidateAmount, 65000);
assert.equal(monthlyFullSupport.totalCandidateAmount, 65000);
assert.equal(monthlyFullSupport.payoutTruth, false);
assert.deepEqual(monthlyFullSupport.blockingReasons, []);
assert.equal(monthlyFullSupport.sourceCalculation.candidateAmount, 65000);
assertNoProductionPayoutOperationFields(monthlyFullSupport);

const monthlyProportionalSupport = orchestratePcv2026FixedSupportMonthlyCandidate(monthlyInput({
  initialCommissionsLifeAndIndividualGmm: 11600,
}));

assert.equal(monthlyProportionalSupport.status, 'CALCULATED_CANDIDATE');
assert.equal(monthlyProportionalSupport.candidateAmount, 52000);
assert.equal(monthlyProportionalSupport.totalCandidateAmount, 52000);
assert.equal(monthlyProportionalSupport.payoutTruth, false);

const monthlyBelowMinimum = orchestratePcv2026FixedSupportMonthlyCandidate(monthlyInput({
  initialCommissionsLifeAndIndividualGmm: 11599,
}));

assert.equal(monthlyBelowMinimum.status, 'BLOCKED_OR_UNKNOWN');
assert.equal(monthlyBelowMinimum.candidateAmount, null);
assert.equal(monthlyBelowMinimum.totalCandidateAmount, null);
assert.equal(monthlyBelowMinimum.payoutTruth, false);
assert.equal(monthlyBelowMinimum.blockingReasons.includes('MINIMUM_80_PERCENT_COMPLIANCE_NOT_MET'), true);

const missingMonthlyInput = orchestratePcv2026FixedSupportMonthlyCandidate(null);

assert.equal(missingMonthlyInput.status, 'BLOCKED_OR_UNKNOWN');
assert.equal(missingMonthlyInput.candidateAmount, null);
assert.equal(missingMonthlyInput.totalCandidateAmount, null);
assert.equal(missingMonthlyInput.payoutTruth, false);
assert.equal(missingMonthlyInput.blockingReasons.includes('FIXED_SUPPORT_MONTHLY_INPUT_REQUIRED'), true);

const monthlyBatch = orchestratePcv2026FixedSupportMonthlyPeriodCandidates([
  monthlyInput({ month: '2026-01' }),
  monthlyInput({
    month: '2026-02',
    initialCommissionsLifeAndIndividualGmm: 11599,
  }),
]);

assert.equal(monthlyBatch.status, 'PARTIAL_WITH_BLOCKS');
assert.equal(monthlyBatch.candidateAmount, 65000);
assert.equal(monthlyBatch.totalCandidateAmount, 65000);
assert.equal(monthlyBatch.calculatedMonthCount, 1);
assert.equal(monthlyBatch.blockedMonthCount, 1);
assert.equal(monthlyBatch.monthlyResults[1].candidateAmount, null);
assert.equal(monthlyBatch.payoutTruth, false);
assert.equal(monthlyBatch.blockingReasons.includes('MINIMUM_80_PERCENT_COMPLIANCE_NOT_MET'), true);

const missingBatchInput = orchestratePcv2026FixedSupportMonthlyPeriodCandidates(null);

assert.equal(missingBatchInput.status, 'BLOCKED_OR_UNKNOWN');
assert.equal(missingBatchInput.candidateAmount, null);
assert.equal(missingBatchInput.totalCandidateAmount, null);
assert.equal(missingBatchInput.blockingReasons.includes('FIXED_SUPPORT_MONTHLY_INPUTS_ARRAY_REQUIRED'), true);

const recoveryTwoMonths = orchestratePcv2026FixedSupportRecoveryCandidate({
  currentMonthInput: monthlyInput({
    careerMonth: 7,
    accumulatedCommissionActual: 182000,
    trainingAdvisorWinnersLastSixMonths: 3,
    samePartnerYearRecoveryEvidence: true,
  }),
  recoveryPreviousMonthsRequested: 2,
});

assert.equal(recoveryTwoMonths.status, 'CALCULATED_CANDIDATE');
assert.equal(recoveryTwoMonths.candidateAmount, 54000);
assert.equal(recoveryTwoMonths.recoveryCandidateAmount, 108000);
assert.equal(recoveryTwoMonths.totalCandidateAmount, 162000);
assert.equal(recoveryTwoMonths.payoutTruth, false);

const recoveryOverThree = orchestratePcv2026FixedSupportRecoveryCandidate({
  currentMonthInput: monthlyInput({
    careerMonth: 7,
    accumulatedCommissionActual: 182000,
    trainingAdvisorWinnersLastSixMonths: 3,
    samePartnerYearRecoveryEvidence: true,
  }),
  recoveryPreviousMonthsRequested: 4,
});

assert.equal(recoveryOverThree.status, 'BLOCKED_OR_UNKNOWN');
assert.equal(recoveryOverThree.candidateAmount, null);
assert.equal(recoveryOverThree.recoveryCandidateAmount, null);
assert.equal(recoveryOverThree.payoutTruth, false);
assert.equal(recoveryOverThree.blockingReasons.includes('RECOVERY_MAX_THREE_PREVIOUS_MONTHS_EXCEEDED'), true);

const recoveryWithoutSameYearEvidence = orchestratePcv2026FixedSupportRecoveryCandidate({
  currentMonthInput: monthlyInput({
    careerMonth: 7,
    accumulatedCommissionActual: 182000,
    trainingAdvisorWinnersLastSixMonths: 3,
  }),
  recoveryPreviousMonthsRequested: 2,
});

assert.equal(recoveryWithoutSameYearEvidence.status, 'BLOCKED_OR_UNKNOWN');
assert.equal(recoveryWithoutSameYearEvidence.candidateAmount, null);
assert.equal(recoveryWithoutSameYearEvidence.recoveryCandidateAmount, null);
assert.equal(recoveryWithoutSameYearEvidence.payoutTruth, false);
assert.equal(recoveryWithoutSameYearEvidence.blockingReasons.includes('SAME_PARTNER_YEAR_RECOVERY_EVIDENCE_REQUIRED'), true);

const payoutTruthBlocked = orchestratePcv2026FixedSupportMonthlyCandidate(monthlyInput({
  payoutTruth: true,
}));

assert.equal(payoutTruthBlocked.status, 'BLOCKED_OR_UNKNOWN');
assert.equal(payoutTruthBlocked.candidateAmount, null);
assert.equal(payoutTruthBlocked.totalCandidateAmount, null);
assert.equal(payoutTruthBlocked.payoutTruth, false);
assert.equal(payoutTruthBlocked.blockingReasons.includes('PAYOUT_TRUTH_INPUT_NOT_ALLOWED_FOR_CANDIDATE_CONTRACT'), true);

assertNoProductionPayoutOperationFields(payoutTruthBlocked);
assertNoProductionPayoutOperationFields(monthlyBatch);
assertNoProductionPayoutOperationFields(recoveryTwoMonths);

console.log('PASS partner-fixed-support-orchestrator-test');
