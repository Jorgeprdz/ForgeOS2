import assert from 'node:assert/strict';

import {
  EVIDENCE_CANDIDATE_TYPES,
  EVIDENCE_EXTRACTION_SOURCES,
  canRouteCandidateDirectlyToRevenue,
  createEvidenceExtractionCandidate,
  extractionCandidateCreatesTruth,
  resolveBonusProductionPointPeriod,
  requiresConfirmationPath,
} from '../policy-operations/evidence-inbox/evidence-extraction-candidate.js';

const candidate = createEvidenceExtractionCandidate({
  candidateId: 'candidate-1',
  inboxItemId: 'inbox-1',
  candidateType: EVIDENCE_CANDIDATE_TYPES.PAYMENT,
  extractedFields: { paymentAmount: { value: 1000, confidence: 0.91 } },
  confidence: 0.91,
  extractionSource: EVIDENCE_EXTRACTION_SOURCES.OCR,
  warnings: ['ocr_parser_output_is_not_truth'],
});

assert.equal(candidate.createsTruth, false);
assert.equal(extractionCandidateCreatesTruth(), false);
assert.equal(candidate.canRouteDirectlyToRevenue, false);
assert.equal(canRouteCandidateDirectlyToRevenue(), false);
assert.equal(requiresConfirmationPath(candidate), true);

const issueOnlyBonusProduction = createEvidenceExtractionCandidate({
  candidateId: 'candidate-bonus-issue-only',
  inboxItemId: 'inbox-bonus-1',
  candidateType: EVIDENCE_CANDIDATE_TYPES.BONUS_PRODUCTION_BASIS,
  extractedFields: {
    issueDate: '2026-04-12',
  },
  extractionSource: EVIDENCE_EXTRACTION_SOURCES.PARSER,
});

const issueOnlyPeriod = resolveBonusProductionPointPeriod(issueOnlyBonusProduction);

assert.equal(issueOnlyPeriod.allowed, false);
assert.equal(issueOnlyPeriod.reason, 'missing_paid_applied_date');
assert.equal(issueOnlyPeriod.pointPeriod, null);
assert.equal(issueOnlyPeriod.issueDateDeterminesPointMonth, false);

const paidAppliedBonusProduction = createEvidenceExtractionCandidate({
  candidateId: 'candidate-bonus-paid',
  inboxItemId: 'inbox-bonus-2',
  candidateType: EVIDENCE_CANDIDATE_TYPES.BONUS_PRODUCTION_BASIS,
  extractedFields: {
    issueDate: '2026-04-12',
    paidAppliedDate: '2026-05-03',
  },
  extractionSource: EVIDENCE_EXTRACTION_SOURCES.PARSER,
});

const paidAppliedPeriod = resolveBonusProductionPointPeriod(paidAppliedBonusProduction);

assert.equal(paidAppliedPeriod.allowed, true);
assert.equal(paidAppliedPeriod.pointPeriod, '2026-05');
assert.equal(paidAppliedPeriod.issueDateDeterminesPointMonth, false);

console.log('PASS evidence-extraction-candidate-test');
