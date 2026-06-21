export const EVIDENCE_CANDIDATE_TYPES = Object.freeze({
  POLICY: 'policy',
  PAYMENT: 'payment',
  COMMISSION_STATEMENT: 'commission_statement',
  BONUS_RULE: 'bonus_rule',
  BONUS_PRODUCTION_BASIS: 'bonus_production_basis',
  BONUS_CARRIER_CALCULATED: 'bonus_carrier_calculated',
  BONUS_PAYMENT_EVIDENCE: 'bonus_payment_evidence',
  UNKNOWN: 'unknown',
});

export const EVIDENCE_EXTRACTION_SOURCES = Object.freeze({
  OCR: 'ocr',
  PARSER: 'parser',
  MANUAL_PREFILL: 'manual_prefill',
  INTEGRATION: 'integration',
  AI_ASSIST: 'ai_assist',
});

export function createEvidenceExtractionCandidate({
  candidateId = crypto.randomUUID(),
  inboxItemId,
  candidateType = EVIDENCE_CANDIDATE_TYPES.UNKNOWN,
  extractedFields = {},
  confidence = null,
  extractionSource = EVIDENCE_EXTRACTION_SOURCES.PARSER,
  warnings = [],
  missingFields = [],
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    candidateId,
    inboxItemId,
    candidateType,
    extractedFields,
    confidence,
    extractionSource,
    warnings,
    missingFields,
    createdAt,
    createsTruth: false,
    canRouteDirectlyToRevenue: false,
    requiresConfirmationPath: true,
  };
}

export function extractionCandidateCreatesTruth() {
  return false;
}

export function canRouteCandidateDirectlyToRevenue() {
  return false;
}

export function requiresConfirmationPath(candidate = {}) {
  return candidate.requiresConfirmationPath !== false;
}

export function hasPaidAppliedPointPeriod(candidate = {}) {
  return Boolean(candidate.extractedFields?.paidAppliedDate);
}

export function resolveBonusProductionPointPeriod(candidate = {}) {
  if (candidate.candidateType !== EVIDENCE_CANDIDATE_TYPES.BONUS_PRODUCTION_BASIS) {
    return {
      allowed: false,
      reason: 'not_bonus_production_basis',
      pointPeriod: null,
      issueDateDeterminesPointMonth: false,
    };
  }

  const paidAppliedDate = candidate.extractedFields?.paidAppliedDate;

  if (!paidAppliedDate) {
    return {
      allowed: false,
      reason: 'missing_paid_applied_date',
      pointPeriod: null,
      issueDateDeterminesPointMonth: false,
    };
  }

  return {
    allowed: true,
    reason: 'paid_applied_date_sets_point_period',
    pointPeriod: String(paidAppliedDate).slice(0, 7),
    issueDateDeterminesPointMonth: false,
  };
}
