import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  loadNewProfessional2026RulePack,
} from '../compensation/new-professional/new-professional-rule-pack-loader.js';

import {
  LIFE_INITIAL_BONUS_STATUS,
  calculateNewProfessionalLifeInitialBonusCandidate,
} from '../compensation/new-professional/new-professional-life-initial-bonus-engine.js';

import {
  LIFE_RENEWAL_BONUS_STATUS,
  calculateNewProfessionalLifeRenewalBonusCandidate,
} from '../compensation/new-professional/new-professional-life-renewal-bonus-engine.js';

import {
  LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS,
  calculateNewProfessionalLifeBonusTotalCandidate,
  extractLifeInitialGrossCandidate,
  extractLifeRenewalGrossCandidate,
  resolveLifeInitialGroupOutputsForRenewal,
} from '../compensation/new-professional/new-professional-life-bonus-total-orchestrator.js';

const { rulePack } = loadNewProfessional2026RulePack();

function baseFacts(overrides = {}) {
  return {
    semesterNumber: 1,
    semesterMonth: 1,
    advisorContestMonth: 10,
    firstSemesterInNewProfessionalBook: true,
    paymentMode: 'semester_settlement',
    accumulatedTargetPremium: 455000,
    accumulatedPaidInitialPremium: 100000,
    monthlyInitialLifePoliciesPaid: 1,
    accumulatedInitialLifePoliciesPaid: 3,
    annualInitialLifePoliciesPaid: null,
    limra: 95.5,
    previousSemesterGroup: null,
    accumulatedPaidRenewalPremium: 100000,
    igc: 95.75,
    priorPaidBonusesInSemester: 10000,
    ...overrides,
  };
}

function calculate(overrides = {}) {
  return calculateNewProfessionalLifeBonusTotalCandidate({
    rulePack,
    advisorFacts: baseFacts(overrides),
  });
}

function testCombinesInitialGrossAndRenewalGrossMinusPriorPaidOnce() {
  const result = calculate();

  assert.equal(result.status, LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.calculation.grossLifeInitialCandidate, 45000);
  assert.equal(result.calculation.grossLifeRenewalCandidate, 16000);
  assert.equal(result.calculation.grossLifeBonusCandidate, 61000);
  assert.equal(result.calculation.priorPaidBonusesInSemester, 10000);
  assert.equal(result.calculation.payableCandidate, 51000);
  assert.equal(result.candidateAmount, 51000);

  console.log('PASS combines initial gross + renewal gross - prior paid once');
}

function testDoesNotDoubleSubtractPriorPaidBonusesInSemester() {
  const result = calculate();

  assert.equal(result.childResults.lifeInitial.calculation.priorPaidBonusesInSemester, 0);
  assert.equal(result.childResults.lifeRenewal.calculation.priorPaidBonusesInSemester, 0);
  assert.equal(result.childResults.lifeInitial.calculation.payableCandidate, 45000);
  assert.equal(result.childResults.lifeRenewal.calculation.payableCandidate, 16000);
  assert.equal(result.explainability.priorPaidSubtractedOnce, true);
  assert.equal(result.calculation.payableCandidate, 51000);

  console.log('PASS does not double subtract priorPaidBonusesInSemester');
}

function testMonthlyAdvancePassesEffectiveGroupIntoLifeRenewal() {
  const result = calculate({
    paymentMode: 'monthly_advance',
    firstSemesterInNewProfessionalBook: false,
    previousSemesterGroup: 13,
    priorPaidBonusesInSemester: 0,
  });

  assert.equal(result.status, LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.childResults.lifeInitial.calculation.currentGroup, 1);
  assert.equal(result.childResults.lifeInitial.calculation.effectiveGroup, 13);
  assert.equal(result.childResults.lifeRenewal.calculation.group, 13);
  assert.equal(result.childResults.lifeRenewal.calculation.candidateRate, 0.04);
  assert.equal(result.calculation.grossLifeRenewalCandidate, 4000);

  console.log('PASS monthly_advance passes effective group from Life Initial into Life Renewal');
}

function testSemesterSettlementPassesCurrentGroupIntoLifeRenewal() {
  const result = calculate({
    paymentMode: 'semester_settlement',
    previousSemesterGroup: 13,
    priorPaidBonusesInSemester: 0,
  });

  assert.equal(result.status, LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.CALCULATED_CANDIDATE);
  assert.equal(result.childResults.lifeInitial.calculation.currentGroup, 1);
  assert.equal(result.childResults.lifeRenewal.calculation.group, 1);
  assert.equal(result.childResults.lifeRenewal.explainability.groupSource, 'lifeInitialCurrentGroup');

  console.log('PASS semester_settlement passes current group from Life Initial into Life Renewal');
}

function testInitialIneligibleMeansLifeInitialRequired() {
  const result = calculate({
    accumulatedTargetPremium: 49000,
  });

  assert.equal(
    result.status,
    LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.INELIGIBLE_LIFE_INITIAL_BONUS_REQUIRED,
  );
  assert.equal(result.candidateAmount, null);
  assert.equal(result.childResults.lifeRenewal, null);

  console.log('PASS initial ineligible returns ineligible_life_initial_bonus_required');
}

function testRenewalIgcBelow91KeepsInitialCandidateAndZeroRenewalComponent() {
  const result = calculate({
    igc: 90.99,
  });

  assert.equal(
    result.status,
    LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.CALCULATED_CANDIDATE_WITH_RENEWAL_INELIGIBLE,
  );
  assert.equal(result.childResults.lifeRenewal.status, LIFE_RENEWAL_BONUS_STATUS.INELIGIBLE_IGC_GOAL_NOT_MET);
  assert.equal(result.calculation.grossLifeInitialCandidate, 45000);
  assert.equal(result.calculation.grossLifeRenewalCandidate, 0);
  assert.equal(result.calculation.grossLifeBonusCandidate, 45000);
  assert.equal(result.calculation.payableCandidate, 35000);
  assert.equal(result.explainability.renewalComponentIncluded, false);

  console.log('PASS renewal IGC below 91 returns calculated_candidate_with_renewal_ineligible');
}

function testMissingRenewalPremiumBlocksAndDoesNotAssumeZero() {
  const result = calculate({
    accumulatedPaidRenewalPremium: null,
  });

  assert.equal(result.status, LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(result.candidateAmount, null);
  assert(result.missingInputs.includes('accumulatedPaidRenewalPremium'));

  console.log('PASS missing renewal premium blocks and does not assume zero');
}

function testMissingIgcBlocksAndDoesNotAssumeZero() {
  const result = calculate({
    igc: null,
  });

  assert.equal(result.status, LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(result.candidateAmount, null);
  assert(result.missingInputs.includes('igc'));

  console.log('PASS missing IGC blocks and does not assume zero');
}

function testMissingPriorPaidBlocks() {
  const result = calculate({
    priorPaidBonusesInSemester: null,
  });

  assert.equal(result.status, LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(result.candidateAmount, null);
  assert(result.missingInputs.includes('priorPaidBonusesInSemester'));

  console.log('PASS missing priorPaidBonusesInSemester blocks');
}

function testMissingInitialFactsBlock() {
  const result = calculate({
    limra: null,
  });

  assert.equal(result.status, LIFE_BONUS_TOTAL_ORCHESTRATOR_STATUS.BLOCKED_MISSING_INPUT);
  assert.equal(result.candidateAmount, null);
  assert(result.missingInputs.includes('limra'));

  console.log('PASS missing initial facts block');
}

function testPayoutTruthAlwaysFalse() {
  const results = [
    calculate(),
    calculate({ accumulatedTargetPremium: 49000 }),
    calculate({ igc: 90.99 }),
    calculate({ priorPaidBonusesInSemester: null }),
  ];

  for (const result of results) {
    assert.equal(result.payoutTruth, false);
    assert.equal(result.payoutTruthRule, 'commission_statement_required');
    assert.deepEqual(result.evidenceRequirements, ['commission_statement_required']);
  }

  console.log('PASS payoutTruth is always false');
}

function testDoesNotImportPartnerOrAdvisorDevelopment() {
  const source = readFileSync(
    'compensation/new-professional/new-professional-life-bonus-total-orchestrator.js',
    'utf8',
  );

  assert.equal(source.includes('partner-manager'), false);
  assert.equal(source.includes('advisor-development'), false);

  console.log('PASS orchestrator does not import Partner or Advisor Development');
}

function testDoesNotCreatePaymentExecutionPath() {
  const source = readFileSync(
    'compensation/new-professional/new-professional-life-bonus-total-orchestrator.js',
    'utf8',
  );

  assert.equal(source.includes('executePayment'), false);
  assert.equal(source.includes('paymentExecution'), false);
  assert.equal(source.includes('payoutTruth: true'), false);

  console.log('PASS orchestrator does not create payment execution path');
}

function testDoesNotEditPackageJson() {
  const packageJson = readFileSync('package.json', 'utf8');

  assert.equal(packageJson.includes('new-professional-life-bonus-total-orchestrator'), false);

  console.log('PASS package.json is not changed for this orchestrator');
}

function testDoesNotChangeExistingInitialOrRenewalEngineBehavior() {
  const initial = calculateNewProfessionalLifeInitialBonusCandidate({
    rulePack,
    advisorFacts: {
      ...baseFacts(),
      priorPaidBonusesInSemester: 10000,
    },
  });
  const renewal = calculateNewProfessionalLifeRenewalBonusCandidate({
    rulePack,
    advisorFacts: {
      semesterNumber: 1,
      semesterMonth: 1,
      paymentMode: 'semester_settlement',
      lifeInitialBonusCalculated: true,
      lifeInitialCurrentGroup: 1,
      lifeInitialEffectiveAdvanceGroup: null,
      accumulatedPaidRenewalPremium: 100000,
      igc: 95.75,
      priorPaidBonusesInSemester: 10000,
    },
  });

  assert.equal(initial.status, LIFE_INITIAL_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(initial.calculation.calculatedInitialBonusCandidate, 45000);
  assert.equal(initial.calculation.payableCandidate, 35000);
  assert.equal(renewal.status, LIFE_RENEWAL_BONUS_STATUS.CALCULATED_CANDIDATE);
  assert.equal(renewal.calculation.calculatedRenewalBonusCandidate, 16000);
  assert.equal(renewal.calculation.payableCandidate, 6000);

  console.log('PASS existing life-initial and life-renewal engine behavior remains unchanged');
}

function testExtractionHelpers() {
  const result = calculate();
  const groupOutputs = resolveLifeInitialGroupOutputsForRenewal(
    result.childResults.lifeInitial,
    'semester_settlement',
  );

  assert.equal(extractLifeInitialGrossCandidate(result.childResults.lifeInitial), 45000);
  assert.equal(extractLifeRenewalGrossCandidate(result.childResults.lifeRenewal), 16000);
  assert.equal(groupOutputs.lifeInitialCurrentGroup, 1);
  assert.equal(groupOutputs.lifeInitialEffectiveAdvanceGroup, 1);

  console.log('PASS extraction helpers expose child gross candidates and groups');
}

testCombinesInitialGrossAndRenewalGrossMinusPriorPaidOnce();
testDoesNotDoubleSubtractPriorPaidBonusesInSemester();
testMonthlyAdvancePassesEffectiveGroupIntoLifeRenewal();
testSemesterSettlementPassesCurrentGroupIntoLifeRenewal();
testInitialIneligibleMeansLifeInitialRequired();
testRenewalIgcBelow91KeepsInitialCandidateAndZeroRenewalComponent();
testMissingRenewalPremiumBlocksAndDoesNotAssumeZero();
testMissingIgcBlocksAndDoesNotAssumeZero();
testMissingPriorPaidBlocks();
testMissingInitialFactsBlock();
testPayoutTruthAlwaysFalse();
testDoesNotImportPartnerOrAdvisorDevelopment();
testDoesNotCreatePaymentExecutionPath();
testDoesNotEditPackageJson();
testDoesNotChangeExistingInitialOrRenewalEngineBehavior();
testExtractionHelpers();
