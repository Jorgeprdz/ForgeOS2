import assert from 'node:assert/strict';

import {
  FIXED_SUPPORT_AMOUNTS_BY_SEMESTER,
} from '../compensation/partner-manager/partner-fixed-support-contract.js';

import {
  calculatePartnerFixedSupportCandidate,
} from '../compensation/partner-manager/partner-fixed-support-calculator.js';

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
  const result = calculatePartnerFixedSupportCandidate({
    semesterIndex: Number(semester),
    accumulatedCommissions: 100000,
    accumulatedCommissionGoal: 90000,
    accumulatedCommissionGoalsEvidence: true,
    taCountingPrecontractCount: 1,
    taCountingEventEvidence: true,
    supportTableEvidence: true,
    partnerLifecycleStatus: 'active',
  });
  assert.equal(result.candidateAmount, amount);
  assert.equal(result.payoutTruth, false);
  assert.equal(result.metadata.taCountingPrecontractCountsForSupportOnly, true);
}

const missingGoals = calculatePartnerFixedSupportCandidate({
  semesterIndex: 1,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoal: 90000,
  taCountingPrecontractCount: 1,
  taCountingEventEvidence: true,
  supportTableEvidence: true,
  partnerLifecycleStatus: 'partner_active',
});
assert.equal(missingGoals.blockedReasons.includes('blocked_by_missing_accumulated_commission_evidence'), false);
assert.equal(missingGoals.candidateAmount, 65000);

const officialJsonMonth25 = calculatePartnerFixedSupportCandidate({
  rulePack,
  partnerCareerMonth: 25,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoal: 90000,
  accumulatedCommissionGoalsEvidence: true,
  taCountingPrecontractCount: 3,
  supportTableEvidence: true,
  partnerLifecycleStatus: 'partner_active',
});
assert.equal(officialJsonMonth25.candidateAmount, 21500);
assert.equal(officialJsonMonth25.metadata.assessment.metadata.semesterIndex, 5);

const officialV1WithoutSupportTableEvidence = calculatePartnerFixedSupportCandidate({
  rulePack,
  partnerCareerMonth: 25,
  accumulatedCommissionActualLifeIndividualAndGmmi: 65025,
  accumulatedCommissionGoalsEvidence: true,
  trainingWinnerActualCountLastSixMonths: 3,
  supportTableEvidence: false,
  partnerLifecycleStatus: 'partner_active',
});
assert.equal(officialV1WithoutSupportTableEvidence.candidateAmount, 18275);
assert.equal(officialV1WithoutSupportTableEvidence.blockedReasons.includes('blocked_by_missing_table'), false);
assert.equal(officialV1WithoutSupportTableEvidence.evidenceRequirement.includes('support_table_evidence'), false);

const officialV1MissingActualCommissions = calculatePartnerFixedSupportCandidate({
  rulePack,
  partnerCareerMonth: 25,
  accumulatedCommissionGoalsEvidence: true,
  trainingWinnerActualCountLastSixMonths: 3,
  supportTableEvidence: false,
  partnerLifecycleStatus: 'partner_active',
});
assert.equal(officialV1MissingActualCommissions.blockedReasons.includes('blocked_by_missing_accumulated_commission_actual'), true);
assert.equal(officialV1MissingActualCommissions.blockedReasons.includes('blocked_by_missing_table'), false);
assert.equal(officialV1MissingActualCommissions.evidenceRequirement.includes('support_table_evidence'), false);

const missingTa = calculatePartnerFixedSupportCandidate({
  semesterIndex: 1,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoal: 90000,
  accumulatedCommissionGoalsEvidence: true,
  supportTableEvidence: true,
});
assert.ok(missingTa.blockedReasons.includes('blocked_by_missing_training_winner_count'));

const missingTable = calculatePartnerFixedSupportCandidate({
  semesterIndex: 1,
  accumulatedCommissions: 100000,
  accumulatedCommissionGoal: 90000,
  accumulatedCommissionGoalsEvidence: true,
  taCountingPrecontractCount: 0,
  supportTableEvidence: false,
  partnerLifecycleStatus: 'partner_active',
});
assert.equal(missingTable.blockedReasons.includes('blocked_by_missing_table'), false);
assert.equal(missingTable.candidateAmount, 65000);

const monthGateBlocked = calculatePartnerFixedSupportCandidate({
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
assert.equal(monthGateBlocked.candidateAmount, null);
assert.ok(monthGateBlocked.blockedReasons.includes('blocked_by_insufficient_qualified_advisors_for_partner_month'));

console.log('PASS partner-fixed-support-calculator-test');
