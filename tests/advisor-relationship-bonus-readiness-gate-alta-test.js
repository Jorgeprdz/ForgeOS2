import assert from 'node:assert/strict';

import {
  ATTRIBUTION_EVIDENCE_STATUS,
  evaluateConnectionAttribution,
} from '../compensation/advisor-development/advisor-relationship-attribution-evaluator.js';

import {
  RELATIONSHIP_BONUS_READINESS_STATUS,
  evaluateConnectionBonusReadiness,
} from '../compensation/advisor-development/advisor-relationship-bonus-readiness-gate.js';

function createRulePack() {
  return {
    concepts: {
      'connection-bonus': {
        calculationStatus: 'blocked_until_relationship_attribution_evidence',
        payoutTruth: false,
      },
    },
  };
}

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

function assertNoGateBonusTypeLeak(result) {
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'bonusType'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.readiness, 'bonusType'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.readiness, 'policyCountRequired'), false);
}

function testAltaMonthOneReadyWithoutPolicies() {
  const result = evaluateConnectionBonusReadiness({
    rulePack: createRulePack(),
    relationshipAttributionResult: createConfirmedConnectionAttribution(),
    advisorFacts: {
      advisorMonth: 1,
    },
  });

  assert.equal(result.status, RELATIONSHIP_BONUS_READINESS_STATUS.READY_FOR_CANDIDATE_CALCULATION);
  assert.equal(result.reason, null);
  assert.equal(result.payoutTruth, false);
  assert.equal(result.readiness.relationshipConfirmed, true);
  assert.equal(result.readiness.validPolicyCountAvailable, false);
  assert.equal(result.readiness.validPolicyCount, null);
  assert.equal(result.readiness.readyForCandidateCalculation, true);
  assertNoGateBonusTypeLeak(result);

  console.log('PASS alta month 1 ready without policies');
}

function testAltaMonthOneReadyWithZeroPolicies() {
  const result = evaluateConnectionBonusReadiness({
    rulePack: createRulePack(),
    relationshipAttributionResult: createConfirmedConnectionAttribution(),
    countingAndWeightingResult: createCountingResult(0),
    advisorFacts: {
      advisorMonth: 1,
    },
  });

  assert.equal(result.status, RELATIONSHIP_BONUS_READINESS_STATUS.READY_FOR_CANDIDATE_CALCULATION);
  assert.equal(result.reason, null);
  assert.equal(result.payoutTruth, false);
  assert.equal(result.readiness.validPolicyCountAvailable, false);
  assert.equal(result.readiness.validPolicyCount, null);
  assertNoGateBonusTypeLeak(result);

  console.log('PASS alta month 1 ready with zero policies');
}

function testAltaMissingAttributionStillBlocked() {
  const result = evaluateConnectionBonusReadiness({
    rulePack: createRulePack(),
    advisorFacts: {
      advisorMonth: 1,
    },
  });

  assert.equal(result.status, RELATIONSHIP_BONUS_READINESS_STATUS.BLOCKED);
  assert.equal(result.reason, 'blocked_by_missing_connection_attribution_evidence');
  assert.equal(result.payoutTruth, false);
  assertNoGateBonusTypeLeak(result);

  console.log('PASS alta missing attribution still blocked');
}

function testMonthTwoStillRequiresPolicyCount() {
  const result = evaluateConnectionBonusReadiness({
    rulePack: createRulePack(),
    relationshipAttributionResult: createConfirmedConnectionAttribution(),
    advisorFacts: {
      advisorMonth: 2,
    },
  });

  assert.equal(result.status, RELATIONSHIP_BONUS_READINESS_STATUS.BLOCKED);
  assert.equal(result.reason, 'blocked_by_missing_policy_count_result');
  assert.equal(result.payoutTruth, false);
  assertNoGateBonusTypeLeak(result);

  console.log('PASS month 2 still requires policy count');
}

function testLegacyNoAdvisorFactsStillRequiresPolicyCount() {
  const result = evaluateConnectionBonusReadiness({
    rulePack: createRulePack(),
    relationshipAttributionResult: createConfirmedConnectionAttribution(),
  });

  assert.equal(result.status, RELATIONSHIP_BONUS_READINESS_STATUS.BLOCKED);
  assert.equal(result.reason, 'blocked_by_missing_policy_count_result');
  assert.equal(result.payoutTruth, false);
  assertNoGateBonusTypeLeak(result);

  console.log('PASS legacy no advisorFacts still requires policy count');
}

function testMonthFourReturnsNotModeled() {
  const result = evaluateConnectionBonusReadiness({
    rulePack: createRulePack(),
    relationshipAttributionResult: createConfirmedConnectionAttribution(),
    countingAndWeightingResult: createCountingResult(4),
    advisorFacts: {
      advisorMonth: 4,
    },
  });

  assert.equal(result.status, RELATIONSHIP_BONUS_READINESS_STATUS.NOT_MODELED);
  assert.equal(result.reason, 'advisor_month_not_modeled_for_connection_bonus');
  assert.equal(result.payoutTruth, false);
  assertNoGateBonusTypeLeak(result);

  console.log('PASS month 4 returns not modeled');
}

function testInvalidAdvisorMonthReturnsUnknown() {
  const result = evaluateConnectionBonusReadiness({
    rulePack: createRulePack(),
    relationshipAttributionResult: createConfirmedConnectionAttribution(),
    advisorFacts: {
      advisorMonth: '1',
    },
  });

  assert.equal(result.status, RELATIONSHIP_BONUS_READINESS_STATUS.UNKNOWN);
  assert.equal(result.reason, 'invalid_advisorMonth');
  assert.equal(result.payoutTruth, false);
  assertNoGateBonusTypeLeak(result);

  console.log('PASS invalid advisorMonth returns unknown');
}

testAltaMonthOneReadyWithoutPolicies();
testAltaMonthOneReadyWithZeroPolicies();
testAltaMissingAttributionStillBlocked();
testMonthTwoStillRequiresPolicyCount();
testLegacyNoAdvisorFactsStillRequiresPolicyCount();
testMonthFourReturnsNotModeled();
testInvalidAdvisorMonthReturnsUnknown();

console.log('PASS advisor-relationship-bonus-readiness-gate-alta-test');
