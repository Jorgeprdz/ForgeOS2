import assert from 'node:assert/strict';

import {
  EVIDENCE_PROCESSING_STATUSES,
  canCreateOperationalTruth,
  describeEvidenceProcessingStatus,
  requiresHumanConfirmation,
} from '../policy-operations/evidence-inbox/evidence-processing-status.js';

assert.equal(requiresHumanConfirmation(EVIDENCE_PROCESSING_STATUSES.CONFIRMATION_REQUIRED), true);

assert.equal(canCreateOperationalTruth(EVIDENCE_PROCESSING_STATUSES.RECEIVED), false);
assert.equal(canCreateOperationalTruth(EVIDENCE_PROCESSING_STATUSES.EXTRACTION_CANDIDATE_CREATED), false);
assert.equal(canCreateOperationalTruth(EVIDENCE_PROCESSING_STATUSES.PACKET_CREATED), false);
assert.equal(canCreateOperationalTruth(EVIDENCE_PROCESSING_STATUSES.CONFIRMED), true);

const confirmed = describeEvidenceProcessingStatus(EVIDENCE_PROCESSING_STATUSES.CONFIRMED);
assert.equal(confirmed.inboxConfirmedIsPayoutTruth, false);

console.log('PASS evidence-processing-status-test');
