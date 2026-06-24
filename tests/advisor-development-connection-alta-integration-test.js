import assert from 'node:assert/strict';

import {
  loadAdvisorDevelopmentRulePack,
} from '../compensation/advisor-development/advisor-development-rule-pack-loader.js';

import {
  ATTRIBUTION_EVIDENCE_STATUS,
  evaluateConnectionAttribution,
} from '../compensation/advisor-development/advisor-relationship-attribution-evaluator.js';

import {
  RELATIONSHIP_BONUS_READINESS_STATUS,
  evaluateConnectionBonusReadiness,
} from '../compensation/advisor-development/advisor-relationship-bonus-readiness-gate.js';

import {
  CONNECTION_BONUS_STATUS,
  CONNECTION_BONUS_TYPE,
  calculateConnectionBonusCandidate,
} from '../compensation/advisor-development/advisor-development-connection-bonus-engine.js';

function createConfirmedConnectionAttribution() {
  return evaluateConnectionAttribution({
    connectorId: 'maria',
    connectedAdvisorId: 'rda-001',
    connectionDate: '2026-01-01',
    connectorActiveAtMonthClose: true,
    connectedAdvisorActiveAtMonthClose: true,
    onboardingEvidence: true,
    attributionEvidenceStatus: ATTRIBUTION_EVIDENCE_STATUS.CONFIRMED_BY_OFFICIAL_RECORD,
  });
}

function createCountingResult(includedCount) {
  return {
    summary: {
      includedCount,
      excludedCount: 0,
      blockedCount: 0,
      unknownCount: 0,
      notModeledCount: 0,
    },
  };
}

function testPhysicalRulePackConnectionAltaFlowsThroughGateAndEngine() {
  const loaded = loadAdvisorDevelopmentRulePack();

  const readiness = evaluateConnectionBonusReadiness({
    rulePack: loaded.rulePack,
    relationshipAttributionResult: createConfirmedConnectionAttribution(),
    advisorFacts: {
      advisorMonth: 1,
    },
  });

  assert.equal(readiness.status, RELATIONSHIP_BONUS_READINESS_STATUS.READY_FOR_CANDIDATE_CALCULATION);
  assert.equal(readiness.reason, null);
  assert.equal(readiness.payoutTruth, false);

  const candidate = calculateConnectionBonusCandidate({
    rulePack: loaded.rulePack,
    connectionBonusReadinessResult: readiness,
    advisorFacts: {
      advisorMonth: 1,
    },
  });

  assert.equal(candidate.status, CONNECTION_BONUS_STATUS.ELIGIBLE);
  assert.equal(candidate.reason, null);
  assert.equal(candidate.bonusType, CONNECTION_BONUS_TYPE.ALTA);
  assert.equal(candidate.calculation.validPolicyCount, null);
  assert.equal(candidate.calculation.payableCandidate, 7500);
  assert.equal(candidate.payoutTruth, false);

  console.log('PASS physical rule pack connection alta flows through gate and engine');
}

function testPhysicalRulePackConnectionMonthlyStillRequiresPolicyCount() {
  const loaded = loadAdvisorDevelopmentRulePack();

  const monthTwoBlocked = evaluateConnectionBonusReadiness({
    rulePack: loaded.rulePack,
    relationshipAttributionResult: createConfirmedConnectionAttribution(),
    advisorFacts: {
      advisorMonth: 2,
    },
  });

  assert.equal(monthTwoBlocked.status, RELATIONSHIP_BONUS_READINESS_STATUS.BLOCKED);
  assert.equal(monthTwoBlocked.reason, 'blocked_by_missing_policy_count_result');
  assert.equal(monthTwoBlocked.payoutTruth, false);

  const monthTwoReady = evaluateConnectionBonusReadiness({
    rulePack: loaded.rulePack,
    relationshipAttributionResult: createConfirmedConnectionAttribution(),
    countingAndWeightingResult: createCountingResult(3),
    advisorFacts: {
      advisorMonth: 2,
    },
  });

  assert.equal(monthTwoReady.status, RELATIONSHIP_BONUS_READINESS_STATUS.READY_FOR_CANDIDATE_CALCULATION);
  assert.equal(monthTwoReady.payoutTruth, false);

  const candidate = calculateConnectionBonusCandidate({
    rulePack: loaded.rulePack,
    connectionBonusReadinessResult: monthTwoReady,
    advisorFacts: {
      advisorMonth: 2,
    },
  });

  assert.equal(candidate.status, CONNECTION_BONUS_STATUS.ELIGIBLE);
  assert.equal(candidate.bonusType, CONNECTION_BONUS_TYPE.MONTHLY);
  assert.equal(candidate.calculation.payableCandidate, 5000);
  assert.equal(candidate.payoutTruth, false);

  console.log('PASS physical rule pack connection monthly still requires policy count');
}

testPhysicalRulePackConnectionAltaFlowsThroughGateAndEngine();
testPhysicalRulePackConnectionMonthlyStillRequiresPolicyCount();

console.log('PASS advisor-development-connection-alta-integration-test');
