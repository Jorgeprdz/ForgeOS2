import assert from 'node:assert/strict';

import {
  EVIDENCE_SOURCE_TYPES,
  createEvidenceSource,
  evidenceSourceCreatesTruth,
  isEmailEvidenceSource,
} from '../policy-operations/evidence-inbox/evidence-source.js';

const missingType = createEvidenceSource({
  ownerAdvisorId: 'advisor-1',
  receivedAt: '2026-06-21T10:00:00.000Z',
});

assert.equal(missingType.error, true);
assert.ok(missingType.errors.includes('missing_source_type'));

const source = createEvidenceSource({
  sourceType: EVIDENCE_SOURCE_TYPES.UPLOAD,
  receivedAt: '2026-06-21T10:00:00.000Z',
  receivedBy: 'advisor-1',
  ownerAdvisorId: 'advisor-1',
  organizationId: 'org-1',
  originalFilename: 'policy.pdf',
  mimeType: 'application/pdf',
  externalReference: 'upload-1',
});

assert.equal(source.ownerAdvisorId, 'advisor-1');
assert.equal(source.organizationId, 'org-1');
assert.equal(source.originalFilename, 'policy.pdf');
assert.equal(evidenceSourceCreatesTruth(), false);

const emailSource = createEvidenceSource({
  sourceType: EVIDENCE_SOURCE_TYPES.EMAIL_BODY,
  receivedAt: '2026-06-21T10:00:00.000Z',
  receivedBy: 'advisor-1',
  ownerAdvisorId: 'advisor-1',
  organizationId: 'org-1',
  mimeType: 'message/rfc822',
  metadata: {
    provider: 'future_email_provider',
    messageId: 'message-1',
    threadId: 'thread-1',
    from: 'carrier@example.com',
    to: ['advisor@example.com'],
    subject: 'Payment confirmation',
    receivedAt: '2026-06-21T10:00:00.000Z',
    attachmentNames: ['receipt.pdf'],
    mimeType: 'message/rfc822',
  },
});

assert.equal(emailSource.createsTruth, false);
assert.equal(isEmailEvidenceSource(emailSource), true);
assert.equal(emailSource.metadata.messageId, 'message-1');
assert.deepEqual(emailSource.metadata.attachmentNames, ['receipt.pdf']);

console.log('PASS evidence-source-test');
