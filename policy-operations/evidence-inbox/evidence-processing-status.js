export const EVIDENCE_PROCESSING_STATUSES = Object.freeze({
  RECEIVED: 'received',
  CLASSIFIED: 'classified',
  EXTRACTION_CANDIDATE_CREATED: 'extraction_candidate_created',
  PACKET_CREATED: 'packet_created',
  CONFIRMATION_REQUIRED: 'confirmation_required',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
  HIDDEN_BY_SCOPE: 'hidden_by_scope',
  ARCHIVED: 'archived',
});

const TERMINAL_STATUSES = new Set([
  EVIDENCE_PROCESSING_STATUSES.CONFIRMED,
  EVIDENCE_PROCESSING_STATUSES.REJECTED,
  EVIDENCE_PROCESSING_STATUSES.BLOCKED,
  EVIDENCE_PROCESSING_STATUSES.HIDDEN_BY_SCOPE,
  EVIDENCE_PROCESSING_STATUSES.ARCHIVED,
]);

export function isTerminalEvidenceProcessingStatus(status) {
  return TERMINAL_STATUSES.has(status);
}

export function requiresHumanConfirmation(status) {
  return status === EVIDENCE_PROCESSING_STATUSES.CONFIRMATION_REQUIRED;
}

export function canCreateOperationalTruth(status) {
  return status === EVIDENCE_PROCESSING_STATUSES.CONFIRMED;
}

export function describeEvidenceProcessingStatus(status) {
  return {
    status,
    isTerminal: isTerminalEvidenceProcessingStatus(status),
    requiresHumanConfirmation: requiresHumanConfirmation(status),
    canCreateOperationalTruth: canCreateOperationalTruth(status),
    inboxConfirmedIsPayoutTruth: false,
  };
}
