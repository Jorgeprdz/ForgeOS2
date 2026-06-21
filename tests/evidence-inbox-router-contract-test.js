import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  EVIDENCE_CANDIDATE_TYPES,
  createEvidenceExtractionCandidate,
} from '../policy-operations/evidence-inbox/evidence-extraction-candidate.js';
import {
  EVIDENCE_INBOX_ROUTE_TYPES,
  canRouteToRevenueSnapshot,
  isBonusEvidenceCandidate,
  resolveEvidenceInboxRoute,
} from '../policy-operations/evidence-inbox/evidence-inbox-router-contract.js';

const policyRoute = resolveEvidenceInboxRoute(createEvidenceExtractionCandidate({
  candidateType: EVIDENCE_CANDIDATE_TYPES.POLICY,
}));
assert.equal(policyRoute.packetRoute, EVIDENCE_INBOX_ROUTE_TYPES.POLICY_EVIDENCE_PACKET);

const paymentRoute = resolveEvidenceInboxRoute(createEvidenceExtractionCandidate({
  candidateType: EVIDENCE_CANDIDATE_TYPES.PAYMENT,
  extractionSource: 'parser',
  extractedFields: {
    sourceKind: 'email_payment_confirmation',
  },
}));
assert.equal(paymentRoute.packetRoute, EVIDENCE_INBOX_ROUTE_TYPES.PAYMENT_EVIDENCE_PACKET);
assert.equal(paymentRoute.createsPaidConfirmed, false);
assert.equal(paymentRoute.requiresHumanConfirmationBeforePaymentEvent, true);

const statementRoute = resolveEvidenceInboxRoute(createEvidenceExtractionCandidate({
  candidateType: EVIDENCE_CANDIDATE_TYPES.COMMISSION_STATEMENT,
}));
assert.equal(statementRoute.packetRoute, EVIDENCE_INBOX_ROUTE_TYPES.COMMISSION_STATEMENT_EVIDENCE_PACKET);

const unknownRoute = resolveEvidenceInboxRoute(createEvidenceExtractionCandidate({
  candidateType: EVIDENCE_CANDIDATE_TYPES.UNKNOWN,
}));
assert.equal(unknownRoute.allowed, false);
assert.equal(unknownRoute.packetRoute, null);
assert.notEqual(unknownRoute.packetRoute, EVIDENCE_INBOX_ROUTE_TYPES.POLICY_EVIDENCE_PACKET);

assert.equal(policyRoute.routesToRevenueSnapshot, false);
assert.equal(paymentRoute.routesToRevenueSnapshot, false);
assert.equal(statementRoute.routesToRevenueSnapshot, false);
assert.equal(canRouteToRevenueSnapshot(), false);

const bonusRuleCandidate = createEvidenceExtractionCandidate({
  candidateType: EVIDENCE_CANDIDATE_TYPES.BONUS_RULE,
});
const bonusRuleRoute = resolveEvidenceInboxRoute(bonusRuleCandidate);
assert.equal(bonusRuleRoute.packetRoute, EVIDENCE_INBOX_ROUTE_TYPES.BONUS_RULE_EVIDENCE_PACKET);
assert.equal(bonusRuleRoute.createsPayoutTruth, false);
assert.equal(bonusRuleRoute.bonusRuleAuthorizesImplementation, false);
assert.equal(isBonusEvidenceCandidate(bonusRuleCandidate), true);

const bonusProductionRoute = resolveEvidenceInboxRoute(createEvidenceExtractionCandidate({
  candidateType: EVIDENCE_CANDIDATE_TYPES.BONUS_PRODUCTION_BASIS,
}));
assert.equal(bonusProductionRoute.packetRoute, EVIDENCE_INBOX_ROUTE_TYPES.BONUS_PRODUCTION_EVIDENCE_PACKET);
assert.equal(bonusProductionRoute.routesToRevenueSnapshot, false);
assert.equal(bonusProductionRoute.routesToCommissionStatementEvidencePacket, false);

const bonusCarrierCalculatedRoute = resolveEvidenceInboxRoute(createEvidenceExtractionCandidate({
  candidateType: EVIDENCE_CANDIDATE_TYPES.BONUS_CARRIER_CALCULATED,
}));
assert.equal(
  bonusCarrierCalculatedRoute.packetRoute,
  EVIDENCE_INBOX_ROUTE_TYPES.BONUS_CARRIER_CALCULATED_EVIDENCE_PACKET
);
assert.equal(bonusCarrierCalculatedRoute.createsPaidConfirmed, false);
assert.equal(bonusCarrierCalculatedRoute.bonusCarrierCalculatedIsPaidConfirmed, false);

const bonusPaymentRoute = resolveEvidenceInboxRoute(createEvidenceExtractionCandidate({
  candidateType: EVIDENCE_CANDIDATE_TYPES.BONUS_PAYMENT_EVIDENCE,
}));
assert.equal(bonusPaymentRoute.packetRoute, EVIDENCE_INBOX_ROUTE_TYPES.BONUS_PAYMENT_EVIDENCE_PACKET);
assert.notEqual(bonusPaymentRoute.packetRoute, bonusCarrierCalculatedRoute.packetRoute);
assert.equal(bonusPaymentRoute.createsPaidConfirmed, false);
assert.equal(bonusPaymentRoute.routesToRevenueSnapshot, false);

[
  bonusRuleRoute,
  bonusProductionRoute,
  bonusCarrierCalculatedRoute,
  bonusPaymentRoute,
].forEach((route) => {
  assert.equal(route.routesToRevenueSnapshot, false);
  assert.equal(route.routesToCommissionStatementEvidencePacket, false);
});

const unknownBonusSubtypeRoute = resolveEvidenceInboxRoute(createEvidenceExtractionCandidate({
  candidateType: 'bonus_projection_guess',
}));
assert.equal(unknownBonusSubtypeRoute.allowed, false);
assert.equal(unknownBonusSubtypeRoute.packetRoute, null);
assert.equal(unknownBonusSubtypeRoute.routesToRevenueSnapshot, false);

const contractFiles = [
  'policy-operations/evidence-inbox/evidence-source.js',
  'policy-operations/evidence-inbox/evidence-processing-status.js',
  'policy-operations/evidence-inbox/evidence-inbox-item.js',
  'policy-operations/evidence-inbox/evidence-extraction-candidate.js',
  'policy-operations/evidence-inbox/evidence-confirmation-task.js',
  'policy-operations/evidence-inbox/evidence-inbox-scope-gate.js',
  'policy-operations/evidence-inbox/evidence-inbox-router-contract.js',
];

const forbiddenImportPattern = /from ['"].*(ui|dashboard|revenue|comisiones|db|database|storage|migration|migrations).*['"]/i;

contractFiles.forEach((file) => {
  const contents = readFileSync(file, 'utf8');
  assert.equal(forbiddenImportPattern.test(contents), false, `${file} imports a forbidden surface`);
});

console.log('PASS evidence-inbox-router-contract-test');
