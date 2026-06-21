export const EVIDENCE_SOURCE_TYPES = Object.freeze({
  UPLOAD: 'upload',
  EMAIL_BODY: 'email_body',
  EMAIL_ATTACHMENT: 'email_attachment',
  EMAIL_FORWARD: 'email_forward',
  EMAIL_INTEGRATION: 'email_integration',
  MANUAL_CAPTURE: 'manual_capture',
  INTEGRATION_IMPORT: 'integration_import',
  DOCUMENT_SCAN: 'document_scan',
  INBOX_FORWARD: 'inbox_forward',
  UNKNOWN: 'unknown',
});

export const EVIDENCE_SOURCE_STATUSES = Object.freeze({
  RECEIVED: 'received',
  NEEDS_REVIEW: 'needs_review',
  BLOCKED: 'blocked',
  ARCHIVED: 'archived',
});

function isBlank(value) {
  return value === null || value === undefined || value === '';
}

function isValidDateValue(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function validateEvidenceSource(source = {}, { requireOwnerAdvisor = true } = {}) {
  const errors = [];

  if (isBlank(source.sourceType)) {
    errors.push('missing_source_type');
  }

  if (!Object.values(EVIDENCE_SOURCE_TYPES).includes(source.sourceType)) {
    errors.push('unsupported_source_type');
  }

  if (requireOwnerAdvisor && isBlank(source.ownerAdvisorId)) {
    errors.push('missing_owner_advisor_id');
  }

  if (isBlank(source.receivedAt) || !isValidDateValue(source.receivedAt)) {
    errors.push('invalid_received_at');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createEvidenceSource({
  sourceType,
  receivedAt = new Date().toISOString(),
  receivedBy = null,
  ownerAdvisorId = null,
  organizationId = null,
  originalFilename = null,
  mimeType = null,
  externalReference = null,
  metadata = {},
  sourceStatus = EVIDENCE_SOURCE_STATUSES.RECEIVED,
} = {}, options = {}) {
  const source = {
    sourceType,
    receivedAt,
    receivedBy,
    ownerAdvisorId,
    organizationId,
    originalFilename,
    mimeType,
    externalReference,
    metadata,
    sourceStatus,
    createsTruth: false,
  };

  const validation = validateEvidenceSource(source, options);

  if (!validation.valid) {
    return {
      error: true,
      errors: validation.errors,
      source,
    };
  }

  return source;
}

export function evidenceSourceCreatesTruth() {
  return false;
}

export function isEmailEvidenceSource(source = {}) {
  return [
    EVIDENCE_SOURCE_TYPES.EMAIL_BODY,
    EVIDENCE_SOURCE_TYPES.EMAIL_ATTACHMENT,
    EVIDENCE_SOURCE_TYPES.EMAIL_FORWARD,
    EVIDENCE_SOURCE_TYPES.EMAIL_INTEGRATION,
  ].includes(source.sourceType);
}
