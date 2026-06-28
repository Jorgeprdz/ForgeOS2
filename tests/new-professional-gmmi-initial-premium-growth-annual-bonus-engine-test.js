import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  loadNewProfessional2026RulePack,
} from '../compensation/new-professional/new-professional-rule-pack-loader.js';

import {
  GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS,
  calculateGmmiInitialPremiumGrowthRate,
  calculateNewProfessionalGmmiInitialPremiumGrowthAnnualBonusCandidate,
  resolveGmmiInitialPremiumGrowthAnnualTier,
} from '../compensation/new-professional/new-professional-gmmi-initial-premium-growth-annual-bonus-engine.js';

const { rulePack } = loadNewProfessional2026RulePack();
const concept = rulePack.concepts['gmmi-initial-premium-growth-annual-bonus'];

function baseFacts(overrides = {}) {
  return {
    contestYear: 2026,
    currentContestYearEligibleGmmiInitialNetPremium: 1150000,
    previousContestYearEligibleGmmiInitialNetPremium: 1000000,
    annualGmmiInitialPremiumMonthlyBonusBase: 100000,
    sourceEvidence: 'commission_statement_required',
    ...overrides,
  };
}

function calculate(overrides = {}) {
  return calculateNewProfessionalGmmiInitialPremiumGrowthAnnualBonusCandidate({
    rulePack,
    advisorFacts: baseFacts(overrides),
  });
}

function testCalculatesGrowthTiers() {
  const tier15 = calculate();
  const tier20 = calculate({ currentContestYearEligibleGmmiInitialNetPremium: 1200000 });
  const tier30 = calculate({ currentContestYearEligibleGmmiInitialNetPremium: 1300000 });

  assert.equal(tier15.status, GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(tier15.calculation.candidateRate, 0.1);
  assert.equal(tier20.calculation.candidateRate, 0.2);
  assert.equal(tier30.calculation.candidateRate, 0.3);

  console.log('PASS calculates 15%, 20%, and 30% growth tiers');
}

function testGrowthBelow15ReturnsIneligible() {
  const result = calculate({ currentContestYearEligibleGmmiInitialNetPremium: 1149900 });

  assert.equal(
    result.status,
    GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS
      .INELIGIBLE_GMMI_INITIAL_PREMIUM_GROWTH_GOAL_NOT_MET,
  );
  assert.equal(result.reason, 'growth_goal_not_met');
  assert.equal(result.candidateAmount, null);

  console.log('PASS growth 14.99% returns ineligible');
}

function testExactThresholdsQualify() {
  assert.equal(calculate({ currentContestYearEligibleGmmiInitialNetPremium: 1150000 }).calculation.candidateRate, 0.1);
  assert.equal(calculate({ currentContestYearEligibleGmmiInitialNetPremium: 1200000 }).calculation.candidateRate, 0.2);
  assert.equal(calculate({ currentContestYearEligibleGmmiInitialNetPremium: 1300000 }).calculation.candidateRate, 0.3);

  console.log('PASS exact 15%, 20%, and 30% thresholds qualify');
}

function testIntermediateAndAboveThirtyTierSelection() {
  const between = calculate({ currentContestYearEligibleGmmiInitialNetPremium: 1250000 });
  const above = calculate({ currentContestYearEligibleGmmiInitialNetPremium: 1450000 });

  assert.equal(between.calculation.candidateRate, 0.2);
  assert.equal(between.calculation.selectedTier, 2);
  assert.equal(above.calculation.candidateRate, 0.3);
  assert.equal(above.calculation.selectedTier, 3);

  console.log('PASS growth between 20%-30% selects 20% tier and above 30% selects 30% tier');
}

function testCalculatesBaseTimesRateAndPayableEqualsCandidate() {
  const result = calculate({
    currentContestYearEligibleGmmiInitialNetPremium: 1300000,
    annualGmmiInitialPremiumMonthlyBonusBase: 200000,
  });

  assert.equal(result.calculation.calculatedGmmiInitialPremiumGrowthAnnualBonusCandidate, 60000);
  assert.equal(result.calculation.payableCandidate, 60000);
  assert.equal(result.candidateAmount, 60000);

  console.log('PASS calculates annual base * bonusRate and payable equals calculated candidate');
}

function testMissingInputsBlock() {
  const missingCurrent = calculate({ currentContestYearEligibleGmmiInitialNetPremium: null });
  const missingPrevious = calculate({ previousContestYearEligibleGmmiInitialNetPremium: null });
  const missingBase = calculate({ annualGmmiInitialPremiumMonthlyBonusBase: null });

  assert.equal(missingCurrent.status, GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(missingCurrent.reason, 'current_contest_year_eligible_gmmi_initial_net_premium_missing');
  assert.equal(missingPrevious.status, GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(missingPrevious.reason, 'previous_contest_year_eligible_gmmi_initial_net_premium_missing');
  assert.equal(missingBase.status, GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(missingBase.reason, 'annual_gmmi_initial_premium_monthly_bonus_base_missing');

  console.log('PASS missing current, previous, and annual base inputs block');
}

function testPreviousYearPremiumMustBeGreaterThanZero() {
  const zero = calculate({ previousContestYearEligibleGmmiInitialNetPremium: 0 });
  const negative = calculate({ previousContestYearEligibleGmmiInitialNetPremium: -1 });

  assert.equal(zero.status, GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(zero.reason, 'previous_contest_year_premium_must_be_greater_than_zero');
  assert.equal(negative.status, GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(negative.reason, 'previous_contest_year_premium_must_be_greater_than_zero');

  console.log('PASS previousContestYearEligibleGmmiInitialNetPremium <= 0 blocks');
}

function testSourceEvidenceBlocksWhenMissingOrInvalid() {
  const missing = calculate({ sourceEvidence: null });
  const invalid = calculate({ sourceEvidence: 'spreadsheet_projection' });

  assert.equal(missing.status, GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(missing.reason, 'source_evidence_missing');
  assert.equal(invalid.status, GMMI_INITIAL_PREMIUM_GROWTH_ANNUAL_BONUS_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(invalid.reason, 'source_evidence_invalid');

  console.log('PASS missing or invalid sourceEvidence blocks');
}

function testPayoutTruthAlwaysFalse() {
  const results = [
    calculate(),
    calculate({ currentContestYearEligibleGmmiInitialNetPremium: 1149900 }),
    calculate({ sourceEvidence: null }),
  ];

  for (const result of results) {
    assert.equal(result.payoutTruth, false);
    assert.equal(result.payoutTruthRule, 'commission_statement_required');
    assert.deepEqual(result.evidenceRequirements, ['commission_statement_required']);
    assert.equal(result.explainability.payoutTruth, false);
  }

  console.log('PASS payoutTruth always false');
}

function testHelpersResolveGrowthAndTiers() {
  const growthRate = calculateGmmiInitialPremiumGrowthRate({
    currentContestYearEligibleGmmiInitialNetPremium: 1250000,
    previousContestYearEligibleGmmiInitialNetPremium: 1000000,
  });
  const tier = resolveGmmiInitialPremiumGrowthAnnualTier({ concept, growthRate });

  assert.equal(growthRate, 0.25);
  assert.equal(tier.tier, 2);
  assert.equal(tier.bonusRate, 0.2);

  console.log('PASS helper functions calculate growth rate and resolve tier');
}

function testEngineDoesNotImportOtherCompensationDomains() {
  const source = readFileSync(
    'compensation/new-professional/new-professional-gmmi-initial-premium-growth-annual-bonus-engine.js',
    'utf8',
  );

  assert.equal(source.includes('partner-manager'), false);
  assert.equal(source.includes('advisor-development'), false);

  console.log('PASS engine does not import Partner or Advisor Development');
}

function testEngineDoesNotImplementOtherGmmiConcepts() {
  const source = readFileSync(
    'compensation/new-professional/new-professional-gmmi-initial-premium-growth-annual-bonus-engine.js',
    'utf8',
  );

  assert.equal(source.includes('quarterlyBonusTable'), false);
  assert.equal(source.includes('renewal-premium'), false);
  assert.equal(source.includes('loss-ratio'), false);
  assert.equal(source.includes('siniestralidad'), false);

  console.log('PASS engine does not implement quarterly GMMI initial, renewal, or siniestralidad');
}

function testPackageJsonIsNotChanged() {
  const packageJson = readFileSync('package.json', 'utf8');

  assert.equal(packageJson.includes('new-professional-gmmi-initial-premium-growth-annual-bonus-engine'), false);

  console.log('PASS package.json is not changed');
}

testCalculatesGrowthTiers();
testGrowthBelow15ReturnsIneligible();
testExactThresholdsQualify();
testIntermediateAndAboveThirtyTierSelection();
testCalculatesBaseTimesRateAndPayableEqualsCandidate();
testMissingInputsBlock();
testPreviousYearPremiumMustBeGreaterThanZero();
testSourceEvidenceBlocksWhenMissingOrInvalid();
testPayoutTruthAlwaysFalse();
testHelpersResolveGrowthAndTiers();
testEngineDoesNotImportOtherCompensationDomains();
testEngineDoesNotImplementOtherGmmiConcepts();
testPackageJsonIsNotChanged();

console.log('PASS new-professional-gmmi-initial-premium-growth-annual-bonus-engine-test');
