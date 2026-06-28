import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  loadNewProfessional2026RulePack,
} from '../compensation/new-professional/new-professional-rule-pack-loader.js';

import {
  DEVELOPMENT_BONUS_STATUS,
  calculateNewProfessionalDevelopmentBonusCandidate,
  getDevelopmentBonusAmount,
  resolveDeveloperShare,
} from '../compensation/new-professional/new-professional-development-bonus-engine.js';

const { rulePack } = loadNewProfessional2026RulePack();

function baseFacts(overrides = {}) {
  return {
    advisorMonth: 7,
    monthlyPolicies: 4,
    paidAppliedPolicyEvidence: true,
    developerEligibilityEvidence: true,
    developmentAttributionConfirmed: true,
    developerShare: 1,
    sourceEvidence: 'commission_statement_required',
    ...overrides,
  };
}

function calculate(overrides = {}) {
  return calculateNewProfessionalDevelopmentBonusCandidate({
    rulePack,
    advisorFacts: baseFacts(overrides),
  });
}

function testMirrorsPartnerHappyPath() {
  const result = calculate();

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.candidateAmount, 15000);
  assert.equal(result.calculation.baseAmount, 15000);
  assert.equal(result.calculation.shareFactor, 1);

  console.log('PASS mirrors Partner development bonus happy path behavior');
}

function testCalculatesDevelopmentBonusPolicyScale() {
  const count2 = calculate({ monthlyPolicies: 2 });
  const count3 = calculate({ monthlyPolicies: 3 });
  const count4 = calculate({ monthlyPolicies: 4 });
  const count5 = calculate({ monthlyPolicies: 5 });

  assert.equal(count2.candidateAmount, 5000);
  assert.equal(count3.candidateAmount, 9000);
  assert.equal(count4.candidateAmount, 15000);
  assert.equal(count5.candidateAmount, 15000);

  console.log('PASS calculates development bonus according to Partner policy scale');
}

function testAppliesDeveloperShare() {
  const full = calculate({ developerShare: 1 });
  const shared = calculate({ developerShare: 0.5 });
  const sharedByDeveloperCount = calculate({ developerShare: null, developerCount: 2 });

  assert.equal(full.candidateAmount, 15000);
  assert.equal(shared.candidateAmount, 7500);
  assert.equal(shared.calculation.developerShare, 0.5);
  assert.equal(shared.metadata.additionalMonth12BonusStatus, 'not_applicable');
  assert.equal(sharedByDeveloperCount.candidateAmount, 7500);

  console.log('PASS applies developerShare / shared developerShare according to Partner behavior');
}

function testAppliesAttributionReadiness() {
  const result = calculate({
    developmentAttributionConfirmed: false,
  });

  assert.equal(result.status, DEVELOPMENT_BONUS_STATUS.BLOCKED_BY_MISSING_EVIDENCE);
  assert.equal(result.candidateAmount, null);
  assert(result.blockedReasons.includes('missing_development_attribution_evidence'));

  console.log('PASS applies ownership/attribution readiness as New Professional input facts');
}

function testBlocksMissingRequiredInputs() {
  const missingPolicies = calculate({ monthlyPolicies: null });
  const quarterOnly = calculate({ monthlyPolicies: null, quarterPolicyTotal: 4 });
  const missingMonth = calculate({ advisorMonth: null });
  const missingPaidApplied = calculate({ paidAppliedPolicyEvidence: false });
  const missingEligibility = calculate({ developerEligibilityEvidence: false });

  assert.equal(missingPolicies.status, DEVELOPMENT_BONUS_STATUS.BLOCKED_BY_MISSING_EVIDENCE);
  assert(missingPolicies.blockedReasons.includes('missing_policy_scale_match'));
  assert(quarterOnly.blockedReasons.includes('blocked_by_missing_monthly_policy_breakdown'));
  assert(missingMonth.blockedReasons.includes('missing_advisorMonth'));
  assert(missingPaidApplied.blockedReasons.includes('missing_paid_applied_policy_evidence'));
  assert(missingEligibility.blockedReasons.includes('missing_developer_eligibility_evidence'));

  console.log('PASS blocks missing required inputs');
}

function testBlocksInvalidSourceEvidence() {
  const missing = calculate({ sourceEvidence: null });
  const invalid = calculate({ sourceEvidence: 'spreadsheet_projection' });

  assert.equal(missing.status, DEVELOPMENT_BONUS_STATUS.BLOCKED_BY_MISSING_EVIDENCE);
  assert(missing.blockedReasons.includes('source_evidence_missing'));
  assert.equal(invalid.status, DEVELOPMENT_BONUS_STATUS.BLOCKED_BY_MISSING_EVIDENCE);
  assert(invalid.blockedReasons.includes('source_evidence_invalid'));

  console.log('PASS blocks missing or invalid source evidence');
}

function testUnsupportedOrInvalidDeveloperShare() {
  const invalid = calculate({ developerShare: '0.5' });
  const unsupported = calculate({ developerShare: 0.25 });

  assert.equal(invalid.status, DEVELOPMENT_BONUS_STATUS.UNKNOWN);
  assert.equal(invalid.reason, 'invalid_developer_share');
  assert.equal(unsupported.status, DEVELOPMENT_BONUS_STATUS.NOT_MODELED);
  assert.equal(unsupported.reason, 'unsupported_developer_share');

  console.log('PASS invalid and unsupported developerShare follow Partner ownership truth behavior');
}

function testAdvisorMonthAndMonth12Semantics() {
  const beforeRange = calculate({ advisorMonth: 3 });
  const afterRange = calculate({ advisorMonth: 16 });
  const month12 = calculate({ advisorMonth: 12 });

  assert.equal(beforeRange.status, DEVELOPMENT_BONUS_STATUS.BLOCKED_BY_MISSING_EVIDENCE);
  assert(beforeRange.blockedReasons.includes('advisor_month_4_to_15_required'));
  assert.equal(afterRange.status, DEVELOPMENT_BONUS_STATUS.BLOCKED_BY_MISSING_EVIDENCE);
  assert(afterRange.blockedReasons.includes('advisor_month_4_to_15_required'));
  assert.equal(month12.status, DEVELOPMENT_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(month12.metadata.additionalMonth12BonusStatus, 'blocked_without_month_12_evidence');

  console.log('PASS advisor month range and month 12 additional status mirror Partner behavior');
}

function testPayoutTruthAlwaysFalse() {
  const results = [
    calculate(),
    calculate({ developerShare: 0.5 }),
    calculate({ monthlyPolicies: null }),
  ];

  for (const result of results) {
    assert.equal(result.payoutTruth, false);
    assert.equal(result.payoutTruthRule, 'commission_statement_required');
    assert.deepEqual(result.evidenceRequirements, ['commission_statement_required']);
  }

  console.log('PASS payoutTruth always false');
}

function testHelpers() {
  const amount = getDevelopmentBonusAmount(rulePack, {
    advisorMonth: 7,
    validPolicyCount: 4,
  });
  const share = resolveDeveloperShare({ developerShare: 0.5 });

  assert.equal(amount.amount, 15000);
  assert.equal(amount.matched.appliesToCountAndAbove, true);
  assert.equal(share.shareFactor, 0.5);

  console.log('PASS helper exports resolve amount and developer share');
}

function testNoForbiddenImportsOrConcepts() {
  const source = readFileSync(
    'compensation/new-professional/new-professional-development-bonus-engine.js',
    'utf8',
  );

  assert.equal(source.includes('partner-manager'), false);
  assert.equal(source.includes('advisor-development'), false);
  assert.equal(source.includes('loss-ratio'), false);
  assert.equal(source.includes('siniestralidad'), false);
  assert.equal(source.includes('temporary-total-disability'), false);
  assert.equal(source.includes('death-benefit'), false);

  console.log('PASS engine does not import other domains or implement out-of-scope concepts');
}

function testPackageJsonIsNotChanged() {
  const packageJson = readFileSync('package.json', 'utf8');

  assert.equal(packageJson.includes('new-professional-development-bonus-engine'), false);

  console.log('PASS package.json is not changed');
}

testMirrorsPartnerHappyPath();
testCalculatesDevelopmentBonusPolicyScale();
testAppliesDeveloperShare();
testAppliesAttributionReadiness();
testBlocksMissingRequiredInputs();
testBlocksInvalidSourceEvidence();
testUnsupportedOrInvalidDeveloperShare();
testAdvisorMonthAndMonth12Semantics();
testPayoutTruthAlwaysFalse();
testHelpers();
testNoForbiddenImportsOrConcepts();
testPackageJsonIsNotChanged();

console.log('PASS new-professional-development-bonus-engine-test');
