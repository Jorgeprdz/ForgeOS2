import { EVIDENCE_PROCESSING_STATUSES } from './evidence-processing-status.js';

export const EVIDENCE_VISIBILITY_SCOPES = Object.freeze({
  ADVISOR_PRIVATE: 'advisor_private',
  ADVISOR_AND_AUTHORIZED_OPERATORS: 'advisor_and_authorized_operators',
  MANAGER_IF_SCOPE_ALLOWS: 'manager_if_scope_allows',
  ORGANIZATION_REVIEW: 'organization_review',
});

export const FORBIDDEN_INBOX_TRUTH_FIELDS = Object.freeze([
  'commissionAmount',
  'paidConfirmed',
  'generatedRevenue',
  'policyTruth',
  'payoutTruth',
]);

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function validateEvidenceInboxItem(item = {}) {
  const forbiddenFields = FORBIDDEN_INBOX_TRUTH_FIELDS.filter((fieldName) => hasOwn(item, fieldName));

  return {
    valid: forbiddenFields.length === 0,
    errors: forbiddenFields.map((fieldName) => `forbidden_truth_field:${fieldName}`),
    forbiddenFields,
  };
}

export function createEvidenceInboxItem({
  id = crypto.randomUUID(),
  source,
  ownerAdvisorId = source?.ownerAdvisorId ?? null,
  organizationId = source?.organizationId ?? null,
  visibilityScope = EVIDENCE_VISIBILITY_SCOPES.ADVISOR_PRIVATE,
  status = EVIDENCE_PROCESSING_STATUSES.RECEIVED,
  documentTypeCandidate = 'unknown',
  createdAt = new Date().toISOString(),
  updatedAt = createdAt,
  blockedReason = null,
  warnings = [],
  metadata = {},
  ...rest
} = {}) {
  const item = {
    id,
    source,
    ownerAdvisorId,
    organizationId,
    visibilityScope,
    status,
    documentTypeCandidate,
    createdAt,
    updatedAt,
    blockedReason,
    warnings,
    metadata,
    createsTruth: false,
    ...rest,
  };

  const validation = validateEvidenceInboxItem(item);

  if (!validation.valid) {
    return {
      error: true,
      errors: validation.errors,
      forbiddenFields: validation.forbiddenFields,
    };
  }

  return item;
}

export function evidenceInboxItemCreatesTruth() {
  return false;
}
