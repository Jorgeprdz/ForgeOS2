import assert from 'node:assert/strict';

import {
  FIXED_SUPPORT_AMOUNTS_BY_SEMESTER,
  assessPartnerFixedSupport,
} from '../compensation/partner-manager/partner-fixed-support-contract.js';

import {
  loadPartner2026RulePack,
} from '../compensation/partner-manager/partner-2026-rule-pack-loader.js';

const rulePack = loadPartner2026RulePack();

const blockedSupportGate = {
  allowed: false,
  blockedReasons: ['blocked_by_insufficient_qualified_advisors_for_partner_month'],
  missingInputs: [],
};

for (const [semester, amount] of Object.entries(FIXED_SUPPORT_AMOUNTS_BY_SEMESTER)) {
  const assessment = assessPartnerFixedSupport({
    semesterIndex: Number(semester),
    accumulatedCommissions: 100000,
    accumulatedCommissionGoal: 90000,
    accumulatedCommissionGoalsEvidence: true,
    taCountingPrecontractCount: 1,
    taCountingEventEvidence: true,
    supportTableEvidence: true,
    partnerLifecycleStatus: 'partner_active',
  });
  assert.equal(assessment.amountCandidate, amount);
  assert.equal(assessment.payoutTruth, false);
  assert.equal(assessment.metadata.createsPartnerEconomicGain, false);
  assert.equal(assessment.metadata.releasesHeldCommission, false);
}

const missingGoals = assessPartnerFixedSupport({
  semesterIndex: 1,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoal: 90000,
  taCountingPrecontractCount: 1,
  taCountingEventEvidence: true,
  supportTableEvidence: true,
  partnerLifecycleStatus: 'partner_active',
});
assert.equal(missingGoals.blockedReasons.includes('blocked_by_missing_accumulated_commission_evidence'), false);
assert.equal(missingGoals.amountCandidate, 65000);

const officialJsonMonth25 = assessPartnerFixedSupport({
  rulePack,
  partnerCareerMonth: 25,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoal: 90000,
  accumulatedCommissionGoalsEvidence: true,
  taCountingPrecontractCount: 3,
  supportTableEvidence: true,
  partnerLifecycleStatus: 'partner_active',
});
assert.equal(officialJsonMonth25.metadata.semesterIndex, 5);
assert.equal(officialJsonMonth25.amountCandidate, 21500);

const missingOfficialGoal = assessPartnerFixedSupport({
  rulePack,
  partnerCareerMonth: 25,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoalsEvidence: true,
  taCountingPrecontractCount: 3,
  taCountingEventEvidence: true,
  supportTableEvidence: true,
  partnerLifecycleStatus: 'partner_active',
});
assert.equal(missingOfficialGoal.metadata.accumulatedCommissionGoal, 76500);
assert.equal(missingOfficialGoal.amountCandidate, 21500);

const missingTa = assessPartnerFixedSupport({
  semesterIndex: 1,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoal: 90000,
  accumulatedCommissionGoalsEvidence: true,
  supportTableEvidence: true,
});
assert.ok(missingTa.blockedReasons.includes('blocked_by_missing_training_winner_count'));

const precontractCountsButNotPaidBonus = assessPartnerFixedSupport({
  semesterIndex: 1,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoal: 90000,
  accumulatedCommissionGoalsEvidence: true,
  taCountingPrecontractCount: 1,
  taCountingEventEvidence: true,
  supportTableEvidence: true,
  partnerLifecycleStatus: 'partner_active',
});
assert.equal(precontractCountsButNotPaidBonus.payoutTruth, false);
assert.equal(precontractCountsButNotPaidBonus.metadata.taCountingPrecontractCount, 1);
assert.ok(precontractCountsButNotPaidBonus.warnings.some((warning) => warning.includes('not a paid bonus')));

const monthGateBlocked = assessPartnerFixedSupport({
  semesterIndex: 1,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoal: 90000,
  supportRequirementGateResult: blockedSupportGate,
  accumulatedCommissionGoalsEvidence: true,
  taCountingPrecontractCount: 1,
  taCountingEventEvidence: true,
  supportTableEvidence: true,
});
assert.equal(monthGateBlocked.calculationAllowed, false);
assert.equal(monthGateBlocked.amountCandidate, null);
assert.ok(monthGateBlocked.blockedReasons.includes('blocked_by_insufficient_qualified_advisors_for_partner_month'));

// PCV_2026_FIXED_SUPPORT_OFFICIAL_TABLES_CONTRACT_TEST
{
  const pcv2026FixedSupportContract = await import('../compensation/partner-manager/partner-fixed-support-contract.js');

  assert.deepEqual(
    pcv2026FixedSupportContract.PCV_2026_FIXED_SUPPORT_MONTHLY_SUPPORT_AMOUNTS_BY_SEMESTER.map(
      (entry) => entry.monthlySupportAmount
    ),
    [65000, 54000, 43500, 32500, 21500, 11000]
  );

  assert.equal(
    pcv2026FixedSupportContract.PCV_2026_FIXED_SUPPORT_INITIAL_COMMISSION_GOALS_BY_CAREER_MONTH.length,
    36
  );

  assert.deepEqual(
    pcv2026FixedSupportContract.PCV_2026_FIXED_SUPPORT_INITIAL_COMMISSION_GOALS_BY_CAREER_MONTH.map(
      (entry) => entry.initialCommissionGoal
    ),
    [
      14500, 18500, 22000, 25000, 29000, 33000, 40000, 47500, 55000, 62000, 63000, 63500,
      63500, 64500, 65500, 67500, 69000, 70000, 71000, 72500, 73500, 74500, 75500, 76500,
      76500, 78000, 80000, 81000, 82000, 83000, 84500, 85500, 86500, 87500, 88500, 90500
    ]
  );

  assert.equal(
    pcv2026FixedSupportContract.getPcv2026FixedSupportMonthlyAmountForCareerMonth(1),
    65000
  );
  assert.equal(
    pcv2026FixedSupportContract.getPcv2026FixedSupportMonthlyAmountForCareerMonth(7),
    54000
  );
  assert.equal(
    pcv2026FixedSupportContract.getPcv2026FixedSupportMonthlyAmountForCareerMonth(36),
    11000
  );

  assert.equal(
    pcv2026FixedSupportContract.getPcv2026FixedSupportInitialCommissionGoalForCareerMonth(1),
    14500
  );
  assert.equal(
    pcv2026FixedSupportContract.getPcv2026FixedSupportInitialCommissionGoalForCareerMonth(36),
    90500
  );

  assert.equal(
    pcv2026FixedSupportContract.getPcv2026FixedSupportTrainingAdvisorTargetForCareerMonth(1),
    0
  );
  assert.equal(
    pcv2026FixedSupportContract.getPcv2026FixedSupportTrainingAdvisorTargetForCareerMonth(3),
    1
  );
  assert.equal(
    pcv2026FixedSupportContract.getPcv2026FixedSupportTrainingAdvisorTargetForCareerMonth(5),
    2
  );
  assert.equal(
    pcv2026FixedSupportContract.getPcv2026FixedSupportTrainingAdvisorTargetForCareerMonth(6),
    3
  );

  assert.equal(
    pcv2026FixedSupportContract.PCV_2026_FIXED_SUPPORT_FIRST_TWO_HIRES_EXCLUSION.excludedHireCount,
    2
  );
  assert.equal(
    pcv2026FixedSupportContract.PCV_2026_FIXED_SUPPORT_FIRST_TWO_HIRES_EXCLUSION.appliesTo,
    'training_advisor_winner_goal'
  );

  const contractReadiness = pcv2026FixedSupportContract.validatePcv2026FixedSupportOfficialContract({
    careerMonth: 1,
    payoutTruth: false,
  });

  assert.equal(contractReadiness.status, 'CONTRACT_TABLES_AVAILABLE');
  assert.equal(contractReadiness.readyForCandidateCalculator, true);
  assert.equal(contractReadiness.calculationPerformed, false);
  assert.equal(contractReadiness.candidateAmount, null);
  assert.equal(contractReadiness.payoutTruth, false);
  assert.equal(contractReadiness.monthlySupportAmount, 65000);
  assert.equal(contractReadiness.initialCommissionGoal, 14500);
  assert.equal(contractReadiness.trainingAdvisorTarget, 0);

  const blockedByPayoutTruth = pcv2026FixedSupportContract.validatePcv2026FixedSupportOfficialContract({
    careerMonth: 1,
    payoutTruth: true,
  });

  assert.equal(blockedByPayoutTruth.status, 'BLOCKED_OR_UNKNOWN');
  assert.equal(blockedByPayoutTruth.candidateAmount, null);
  assert.equal(blockedByPayoutTruth.payoutTruth, false);
  assert.equal(
    blockedByPayoutTruth.blockingReasons.includes('PAYOUT_TRUTH_INPUT_NOT_ALLOWED_FOR_CANDIDATE_CONTRACT'),
    true
  );

  const blockedByUnknownCareerMonth =
    pcv2026FixedSupportContract.validatePcv2026FixedSupportOfficialContract({ careerMonth: 37 });

  assert.equal(blockedByUnknownCareerMonth.status, 'BLOCKED_OR_UNKNOWN');
  assert.equal(blockedByUnknownCareerMonth.candidateAmount, null);
  assert.equal(
    blockedByUnknownCareerMonth.blockingReasons.includes('CAREER_MONTH_REQUIRED_1_TO_36'),
    true
  );
}

console.log('PASS partner-fixed-support-contract-test');
