import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  calculateAdvisorDevelopmentMonthlyIncomeCandidate,
  resolveAdvisorDevelopmentCareerMonth,
} from '../compensation/advisor-development/advisor-development-monthly-income-candidate-orchestrator.js';

const rulePack = JSON.parse(readFileSync(new URL('../compensation/advisor-development/rule-data/smnyl-advisor-development-2026.rule-pack.json', import.meta.url), 'utf8'));

assert.equal(resolveAdvisorDevelopmentCareerMonth('2026-01-31', '2026-01-01'), 1);
assert.equal(resolveAdvisorDevelopmentCareerMonth('2026-01-10', '2026-12-31'), 12);

{
  const missingRulePack = calculateAdvisorDevelopmentMonthlyIncomeCandidate({
    evaluationMonth: '2026-12-31',
  });

  assert.equal(missingRulePack.status, 'not_modeled');
  assert.equal(missingRulePack.payoutTruth, false);
}

{
  const missingEvaluationMonth = calculateAdvisorDevelopmentMonthlyIncomeCandidate({
    rulePack,
  });

  assert.equal(missingEvaluationMonth.status, 'blocked');
  assert.equal(missingEvaluationMonth.payoutTruth, false);
}

const result = calculateAdvisorDevelopmentMonthlyIncomeCandidate({
  rulePack,
  evaluationMonth: '2026-12-31',

  advisor: {
    advisorId: 'AD-SELF-001',
    contestDate: '2026-01-10',
    monthlyFacts: {
      '2026-12': {
        accumulatedInitialCommission: 70000,
        accumulatedPolicies: 18,
        accumulatedLifePolicies: 6,
        priorPaidTrainingAllowanceInSemester: 0,
      },
    },
  },

  connectionEvents: [
    {
      connectedAdvisor: {
        advisorId: 'AD-CONNECTED-DEC',
        contestDate: '2026-12-03',
      },
      advisorMonth: 1,
      onboardingEvidence: true,
      validPolicyCount: 0,
    },
  ],

  developmentEvents: [
    {
      developedAdvisor: {
        advisorId: 'AD-DEVELOPED-JAN',
        contestDate: '2026-01-10',
      },
      advisorMonth: 12,
      validPolicyCount: 4,
      developerShare: 0.5,
      accumulatedInitialPolicies: 48,
      trainingAllowanceMonth12Won: true,
      monthlyPaidPoliciesMonths1To12: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    },
  ],
});

console.log('SCENARIO_STATUS', result.status);
console.log('SCENARIO_TOTAL', result.totalCandidateAmount);
console.log('SCENARIO_TA', JSON.stringify({
  status: result.concepts.trainingAllowance.status,
  amount: result.concepts.trainingAllowance.candidateAmount,
  blockedReasons: result.concepts.trainingAllowance.blockedReasons,
  missingInputs: result.concepts.trainingAllowance.missingInputs,
  metadata: result.concepts.trainingAllowance.metadata,
}));
console.log('SCENARIO_CONNECTION', JSON.stringify({
  status: result.concepts.connection.status,
  amount: result.concepts.connection.candidateAmount,
  blockedReasons: result.concepts.connection.blockedReasons,
  missingInputs: result.concepts.connection.missingInputs,
  metadata: result.concepts.connection.metadata,
}));
console.log('SCENARIO_DEVELOPMENT', JSON.stringify({
  status: result.concepts.development.status,
  amount: result.concepts.development.candidateAmount,
  blockedReasons: result.concepts.development.blockedReasons,
  missingInputs: result.concepts.development.missingInputs,
  metadata: result.concepts.development.metadata,
}));

assert.equal(result.conceptKey, 'advisor-development-monthly-income-candidate');
assert.equal(result.status, 'calculated_candidate');
assert.equal(result.payoutTruth, false);
assert.equal(result.metadata.payoutTruth, false);

assert.equal(result.metadata.trainingAllowanceEngineAvailable, true);
assert.equal(result.metadata.connectionBonusEngineAvailable, true);
assert.equal(result.metadata.developmentBonusEngineAvailable, true);

assert.ok(result.concepts.trainingAllowance.candidateAmount > 0);
assert.equal(result.concepts.connection.candidateAmount, 7500);
assert.equal(result.concepts.development.candidateAmount, 32500);

assert.equal(
  result.totalCandidateAmount,
  result.concepts.trainingAllowance.candidateAmount
    + result.concepts.connection.candidateAmount
    + result.concepts.development.candidateAmount
);

assert.ok(result.totalCandidateAmount > 40000);

assert.equal(result.concepts.connection.payoutTruth, false);
assert.equal(result.concepts.development.payoutTruth, false);
assert.equal(result.concepts.trainingAllowance.payoutTruth, false);

console.log('PASS advisor-development-monthly-income-candidate-scenario-test');
