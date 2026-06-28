import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  loadNewProfessional2026RulePack,
} from '../compensation/new-professional/new-professional-rule-pack-loader.js';

import {
  CONNECTION_BONUS_READINESS_STATUS,
  CONNECTION_BONUS_STATUS,
  CONNECTION_BONUS_TYPE,
  calculateNewProfessionalConnectionBonusCandidate,
} from '../compensation/new-professional/new-professional-connection-bonus-engine.js';

const { rulePack } = loadNewProfessional2026RulePack();

function createReadyReadiness(validPolicyCount = 3) {
  return {
    status: CONNECTION_BONUS_READINESS_STATUS.READY_FOR_CANDIDATE_CALCULATION,
    reason: null,
    readiness: {
      relationshipConfirmed: true,
      validPolicyCountAvailable: true,
      validPolicyCount,
      readyForCandidateCalculation: true,
    },
    payoutTruth: false,
    warnings: [
      {
        code: 'test_readiness_warning',
      },
    ],
  };
}

function createReadinessStatus(status) {
  return {
    status,
    reason: `${status}_reason`,
    readiness: {
      relationshipConfirmed: false,
      validPolicyCountAvailable: false,
      validPolicyCount: null,
      readyForCandidateCalculation: false,
    },
    payoutTruth: false,
    warnings: [],
  };
}

function calculate(overrides = {}) {
  return calculateNewProfessionalConnectionBonusCandidate({
    rulePack,
    connectionBonusReadinessResult: createReadyReadiness(3),
    advisorFacts: {
      advisorMonth: 1,
    },
    ...overrides,
  });
}

function testMirrorsHappyPathBehavior() {
  const alta = calculate({ advisorFacts: { advisorMonth: 1 } });
  const monthly = calculate({
    connectionBonusReadinessResult: createReadyReadiness(5),
    advisorFacts: { advisorMonth: 2 },
  });

  assert.equal(alta.status, CONNECTION_BONUS_STATUS.ELIGIBLE);
  assert.equal(alta.bonusType, CONNECTION_BONUS_TYPE.ALTA);
  assert.equal(alta.calculation.payableCandidate, 7500);
  assert.equal(monthly.status, CONNECTION_BONUS_STATUS.ELIGIBLE);
  assert.equal(monthly.bonusType, CONNECTION_BONUS_TYPE.MONTHLY);
  assert.equal(monthly.calculation.payableCandidate, 15000);

  console.log('PASS mirrors Advisor Development / Partner connection bonus happy path behavior');
}

function testCalculatesAltaBonus() {
  const result = calculate({ advisorFacts: { advisorMonth: 1 } });

  assert.equal(result.status, CONNECTION_BONUS_STATUS.ELIGIBLE);
  assert.equal(result.reason, null);
  assert.equal(result.bonusType, CONNECTION_BONUS_TYPE.ALTA);
  assert.equal(result.advisorMonth, 1);
  assert.equal(result.calculation.validPolicyCount, null);
  assert.equal(result.calculation.tierMatched, null);
  assert.equal(result.calculation.payableCandidate, 7500);

  console.log('PASS calculates Bono por Alta according to existing behavior');
}

function testCalculatesMonthlyBonusTiers() {
  const count3 = calculate({
    connectionBonusReadinessResult: createReadyReadiness(3),
    advisorFacts: { advisorMonth: 2 },
  });
  const count4 = calculate({
    connectionBonusReadinessResult: createReadyReadiness(4),
    advisorFacts: { advisorMonth: 2 },
  });
  const count5 = calculate({
    connectionBonusReadinessResult: createReadyReadiness(5),
    advisorFacts: { advisorMonth: 2 },
  });
  const count6 = calculate({
    connectionBonusReadinessResult: createReadyReadiness(6),
    advisorFacts: { advisorMonth: 2 },
  });
  const count7 = calculate({
    connectionBonusReadinessResult: createReadyReadiness(7),
    advisorFacts: { advisorMonth: 2 },
  });

  assert.equal(count3.calculation.payableCandidate, 5000);
  assert.equal(count4.calculation.payableCandidate, 9000);
  assert.equal(count5.calculation.payableCandidate, 15000);
  assert.equal(count6.calculation.payableCandidate, 20000);
  assert.equal(count7.calculation.payableCandidate, 20000);
  assert.equal(count7.calculation.tierMatched.appliesToCountAndAbove, true);

  console.log('PASS calculates Bono Mensual according to existing behavior');
}

function testConnectedAdvisorMonthEvaluationTiming() {
  const month3 = calculate({
    connectionBonusReadinessResult: createReadyReadiness(3),
    advisorFacts: { advisorMonth: 3 },
  });
  const month4 = calculate({
    connectionBonusReadinessResult: createReadyReadiness(3),
    advisorFacts: { advisorMonth: 4 },
  });

  assert.equal(month3.status, CONNECTION_BONUS_STATUS.ELIGIBLE);
  assert.equal(month3.bonusType, CONNECTION_BONUS_TYPE.MONTHLY);
  assert.equal(month3.calculation.payableCandidate, 5000);
  assert.equal(month4.status, CONNECTION_BONUS_STATUS.NOT_MODELED);
  assert.equal(month4.reason, 'advisor_month_not_modeled_for_connection_bonus');

  console.log('PASS applies connected advisor month/evaluation timing according to existing behavior');
}

function testBlocksMissingRequiredInputs() {
  const missingReadiness = calculateNewProfessionalConnectionBonusCandidate({
    rulePack,
    advisorFacts: { advisorMonth: 1 },
  });
  const missingAdvisorMonth = calculate({ advisorFacts: {} });

  assert.equal(missingReadiness.status, CONNECTION_BONUS_STATUS.BLOCKED);
  assert.equal(missingReadiness.reason, 'blocked_by_missing_connection_bonus_readiness');
  assert.equal(missingAdvisorMonth.status, CONNECTION_BONUS_STATUS.BLOCKED);
  assert.equal(missingAdvisorMonth.reason, 'missing_advisorMonth');

  console.log('PASS blocks missing required inputs');
}

function testReadinessStatusesAndInvalidInputs() {
  const pending = calculate({
    connectionBonusReadinessResult: createReadinessStatus(CONNECTION_BONUS_READINESS_STATUS.PENDING),
  });
  const blocked = calculate({
    connectionBonusReadinessResult: createReadinessStatus(CONNECTION_BONUS_READINESS_STATUS.BLOCKED),
  });
  const unknown = calculate({
    connectionBonusReadinessResult: createReadinessStatus(CONNECTION_BONUS_READINESS_STATUS.UNKNOWN),
  });
  const notModeled = calculate({
    connectionBonusReadinessResult: createReadinessStatus(CONNECTION_BONUS_READINESS_STATUS.NOT_MODELED),
  });
  const invalidAdvisorMonth = calculate({ advisorFacts: { advisorMonth: '1' } });
  const invalidPolicyCount = calculate({
    connectionBonusReadinessResult: createReadyReadiness('3'),
    advisorFacts: { advisorMonth: 2 },
  });

  assert.equal(pending.status, CONNECTION_BONUS_STATUS.PENDING);
  assert.equal(blocked.status, CONNECTION_BONUS_STATUS.BLOCKED);
  assert.equal(unknown.status, CONNECTION_BONUS_STATUS.UNKNOWN);
  assert.equal(notModeled.status, CONNECTION_BONUS_STATUS.NOT_MODELED);
  assert.equal(invalidAdvisorMonth.status, CONNECTION_BONUS_STATUS.UNKNOWN);
  assert.equal(invalidAdvisorMonth.reason, 'invalid_advisorMonth');
  assert.equal(invalidPolicyCount.status, CONNECTION_BONUS_STATUS.UNKNOWN);
  assert.equal(invalidPolicyCount.reason, 'invalid_validPolicyCount');

  console.log('PASS readiness statuses and invalid inputs mirror existing behavior');
}

function testBelowThresholdIsIneligibleNullCandidate() {
  const result = calculate({
    connectionBonusReadinessResult: createReadyReadiness(2),
    advisorFacts: { advisorMonth: 2 },
  });

  assert.equal(result.status, CONNECTION_BONUS_STATUS.INELIGIBLE);
  assert.equal(result.reason, 'connection_bonus_policy_threshold_not_met');
  assert.equal(result.calculation.validPolicyCount, 2);
  assert.equal(result.calculation.tierMatched, null);
  assert.equal(result.calculation.payableCandidate, null);

  console.log('PASS payableCandidate semantics match existing behavior below threshold');
}

function testPayoutTruthAlwaysFalse() {
  const results = [
    calculate({ advisorFacts: { advisorMonth: 1 } }),
    calculate({
      connectionBonusReadinessResult: createReadyReadiness(2),
      advisorFacts: { advisorMonth: 2 },
    }),
    calculate({
      connectionBonusReadinessResult: createReadinessStatus(CONNECTION_BONUS_READINESS_STATUS.PENDING),
    }),
  ];

  for (const result of results) {
    assert.equal(result.payoutTruth, false);
    assert.equal(result.payoutTruthRule, 'commission_statement_required');
    assert.deepEqual(result.evidenceRequirements, ['commission_statement_required']);
  }

  console.log('PASS payoutTruth always false');
}

function testNoCrossDomainImportsOrForbiddenConcepts() {
  const source = readFileSync(
    'compensation/new-professional/new-professional-connection-bonus-engine.js',
    'utf8',
  );

  assert.equal(source.includes('partner-manager'), false);
  assert.equal(source.includes('advisor-development'), false);
  assert.equal(source.includes('loss-ratio'), false);
  assert.equal(source.includes('siniestralidad'), false);

  console.log('PASS engine does not import Partner/Advisor Development or implement GMMI loss ratio');
}

function testPackageJsonIsNotChanged() {
  const packageJson = readFileSync('package.json', 'utf8');

  assert.equal(packageJson.includes('new-professional-connection-bonus-engine'), false);

  console.log('PASS package.json is not changed');
}

testMirrorsHappyPathBehavior();
testCalculatesAltaBonus();
testCalculatesMonthlyBonusTiers();
testConnectedAdvisorMonthEvaluationTiming();
testBlocksMissingRequiredInputs();
testReadinessStatusesAndInvalidInputs();
testBelowThresholdIsIneligibleNullCandidate();
testPayoutTruthAlwaysFalse();
testNoCrossDomainImportsOrForbiddenConcepts();
testPackageJsonIsNotChanged();

console.log('PASS new-professional-connection-bonus-engine-test');
