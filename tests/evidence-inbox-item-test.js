import assert from 'node:assert/strict';

import {
  EVIDENCE_VISIBILITY_SCOPES,
  createEvidenceInboxItem,
  evidenceInboxItemCreatesTruth,
} from '../policy-operations/evidence-inbox/evidence-inbox-item.js';

const forbidden = createEvidenceInboxItem({
  source: { ownerAdvisorId: 'advisor-1', organizationId: 'org-1' },
  commissionAmount: 1000,
  paidConfirmed: true,
  generatedRevenue: 1000,
  payoutTruth: true,
});

assert.equal(forbidden.error, true);
assert.ok(forbidden.forbiddenFields.includes('commissionAmount'));
assert.ok(forbidden.forbiddenFields.includes('paidConfirmed'));
assert.ok(forbidden.forbiddenFields.includes('generatedRevenue'));
assert.ok(forbidden.forbiddenFields.includes('payoutTruth'));

const item = createEvidenceInboxItem({
  id: 'inbox-1',
  source: { ownerAdvisorId: 'advisor-1', organizationId: 'org-1' },
  visibilityScope: EVIDENCE_VISIBILITY_SCOPES.ADVISOR_PRIVATE,
  blockedReason: 'blocked_by_missing_classification',
  warnings: ['ocr_is_not_truth'],
  metadata: {
    extractedCommissionAmountCandidate: 1000,
    noTruthCreated: true,
  },
});

assert.equal(item.error, undefined);
assert.equal(item.blockedReason, 'blocked_by_missing_classification');
assert.deepEqual(item.warnings, ['ocr_is_not_truth']);
assert.equal(item.metadata.extractedCommissionAmountCandidate, 1000);
assert.equal(evidenceInboxItemCreatesTruth(), false);

console.log('PASS evidence-inbox-item-test');
