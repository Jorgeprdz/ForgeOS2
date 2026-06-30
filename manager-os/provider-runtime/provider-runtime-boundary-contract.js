/**
 * Provider Runtime Boundary Contract
 *
 * Provider handoff is not provider runtime execution.
 * This pure boundary validates provider runtime readiness and prepares a payload candidate.
 * It never calls providers, never dispatches, never sends, never creates tasks/calendar, and never creates truth.
 */

const PROVIDER_RUNTIME_STATUSES = Object.freeze({
  READY_FOR_PROVIDER_RUNTIME_REVIEW: 'READY_FOR_PROVIDER_RUNTIME_REVIEW',
  APPROVED_FOR_PROVIDER_RUNTIME_PREPARATION: 'APPROVED_FOR_PROVIDER_RUNTIME_PREPARATION',
  APPROVED_FOR_DRY_RUN_ONLY: 'APPROVED_FOR_DRY_RUN_ONLY',
  NEEDS_SEND_EXECUTION_GATE: 'NEEDS_SEND_EXECUTION_GATE',
  NEEDS_PROVIDER_HANDOFF: 'NEEDS_PROVIDER_HANDOFF',
  NEEDS_FINAL_HUMAN_CONFIRMATION: 'NEEDS_FINAL_HUMAN_CONFIRMATION',
  NEEDS_PROVIDER_NAME: 'NEEDS_PROVIDER_NAME',
  NEEDS_CHANNEL: 'NEEDS_CHANNEL',
  NEEDS_RECIPIENT_DESTINATION: 'NEEDS_RECIPIENT_DESTINATION',
  NEEDS_ARTIFACT_HASH: 'NEEDS_ARTIFACT_HASH',
  ARTIFACT_CHANGED_REAPPROVAL_REQUIRED: 'ARTIFACT_CHANGED_REAPPROVAL_REQUIRED',
  NEEDS_IDEMPOTENCY_KEY: 'NEEDS_IDEMPOTENCY_KEY',
  NEEDS_PROVIDER_CAPABILITY: 'NEEDS_PROVIDER_CAPABILITY',
  NEEDS_CREDENTIAL_REVIEW: 'NEEDS_CREDENTIAL_REVIEW',
  UNSAFE_MESSAGE_BLOCKED: 'UNSAFE_MESSAGE_BLOCKED',
  UNSUPPORTED_PROVIDER: 'UNSUPPORTED_PROVIDER',
  UNSUPPORTED_CHANNEL: 'UNSUPPORTED_CHANNEL',
  EXPIRED_RUNTIME_WINDOW: 'EXPIRED_RUNTIME_WINDOW',
  BLOCKED: 'BLOCKED',
  UNKNOWN: 'UNKNOWN',
  NOT_MODELED: 'NOT_MODELED',
});

const PROVIDER_RUNTIME_DECISIONS = Object.freeze({
  REQUEST_PROVIDER_RUNTIME_REVIEW: 'REQUEST_PROVIDER_RUNTIME_REVIEW',
  APPROVE_PROVIDER_RUNTIME_PREPARATION: 'APPROVE_PROVIDER_RUNTIME_PREPARATION',
  APPROVE_DRY_RUN_ONLY: 'APPROVE_DRY_RUN_ONLY',
  BLOCK_PROVIDER_RUNTIME: 'BLOCK_PROVIDER_RUNTIME',
  NEEDS_MORE_CONTEXT: 'NEEDS_MORE_CONTEXT',
  EXPIRED: 'EXPIRED',
  NOT_MODELED: 'NOT_MODELED',
});

const PROVIDER_RUNTIME_ALLOWED_USES = Object.freeze([
  'PROVIDER_RUNTIME_REVIEW',
  'PROVIDER_HANDOFF_VALIDATION',
  'PROVIDER_PAYLOAD_PREP',
  'PROVIDER_DRY_RUN_PREP',
  'WHATSAPP_PROVIDER_REVIEW',
  'SMS_PROVIDER_REVIEW',
  'EMAIL_PROVIDER_REVIEW',
]);

const PROVIDER_RUNTIME_FORBIDDEN_USES = Object.freeze([
  'AUTOMATIC_SEND',
  'SILENT_SEND',
  'AI_SELF_SEND',
  'PROVIDER_RUNTIME_CALL_WITHOUT_SEND_GATE',
  'PROVIDER_RUNTIME_CALL_WITHOUT_HUMAN_CONFIRMATION',
  'PROVIDER_RUNTIME_CALL_WITHOUT_IDEMPOTENCY',
  'PROVIDER_RUNTIME_CALL_WITHOUT_AUDIT',
  'PROVIDER_RUNTIME_CALL_WITHOUT_CREDENTIAL_REVIEW',
  'WHATSAPP_API_SEND',
  'SMS_API_SEND',
  'EMAIL_API_SEND',
  'SCHEDULED_SEND',
  'RETRY_WITHOUT_POLICY',
  'WEBHOOK_SIDE_EFFECT',
  'AUTOMATIC_TASK_CREATION',
  'AUTOMATIC_CALENDAR_CREATION',
  'COMPENSATION_TRUTH',
  'PAYOUT_TRUTH',
  'REVENUE_TRUTH',
  'HUMAN_RANKING',
  'HR_DECISION',
  'PROMOTION_DECISION',
  'TERMINATION',
  'MANIPULATION',
  'SURVEILLANCE',
  'PERSONALITY_TRUTH',
]);

const SUPPORTED_CHANNELS = Object.freeze(['WHATSAPP', 'SMS', 'EMAIL']);
const SUPPORTED_PROVIDERS = Object.freeze(['MOCK_PROVIDER', 'WHATSAPP_BUSINESS', 'TWILIO', 'SENDGRID', 'SMTP']);

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(values) {
  return [...new Set(asArray(values).filter((value) => value !== undefined && value !== null && value !== ''))];
}

function normalizeUse(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : undefined;
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : undefined;
}

function collectEvidence(sourceEvidence) {
  const evidence = asArray(sourceEvidence);
  const evidenceRefs = [];
  const sourceEvidenceIds = [];
  const sourceOwners = [];

  for (const item of evidence) {
    if (!item || typeof item !== 'object') continue;
    evidenceRefs.push(item.evidenceRef, item.ref, item.id, item.sourceEvidenceId, item.evidenceId);
    sourceEvidenceIds.push(item.sourceEvidenceId, item.evidenceId, item.id);
    sourceOwners.push(item.sourceOwner, item.owner);
  }

  return {
    evidenceRefs: unique(evidenceRefs),
    sourceEvidenceIds: unique(sourceEvidenceIds),
    sourceOwners: unique(sourceOwners),
  };
}

function isExpired(expiresAt, nowValue) {
  if (!expiresAt) return false;
  const now = nowValue ? new Date(nowValue) : new Date();
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() <= now.getTime();
}

function isSafetyUnsafe(snapshot) {
  if (!snapshot) return false;
  if (snapshot.safe === false || snapshot.isSafe === false || snapshot.approved === false) return true;

  const status = String(snapshot.status || snapshot.safetyStatus || snapshot.validationStatus || '').toUpperCase();
  const decision = String(snapshot.decision || snapshot.safetyDecision || '').toUpperCase();

  return (
    status.includes('UNSAFE') ||
    status.includes('BLOCK') ||
    status.includes('REJECT') ||
    decision.includes('BLOCK') ||
    decision.includes('REJECT')
  );
}

function hasFinalHumanConfirmation(input) {
  const confirmation = input.finalHumanConfirmationSnapshot || input.finalSendConfirmationSnapshot || input.sendExecutionGateSnapshot?.sendConfirmation;
  if (!confirmation || typeof confirmation !== 'object') return false;
  const confirmed = confirmation.confirmed === true || confirmation.finalSendConfirmed === true;
  const actor = confirmation.confirmedBy || confirmation.senderId || confirmation.reviewerId;
  const at = confirmation.confirmedAt || confirmation.timestamp;
  return Boolean(confirmed && actor && at);
}

function hasProviderCapability(snapshot, providerName, channel) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.available === false || snapshot.supported === false) return false;

  const providers = asArray(snapshot.supportedProviders || snapshot.providers).map(normalizeString).filter(Boolean);
  const channels = asArray(snapshot.supportedChannels || snapshot.channels).map(normalizeString).filter(Boolean);

  const providerOk = providers.length === 0 || providers.includes(providerName);
  const channelOk = channels.length === 0 || channels.includes(channel);

  return providerOk && channelOk;
}

function hasCredentialReview(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.reviewed !== true && snapshot.credentialReviewPassed !== true) return false;
  if (snapshot.credentialsAvailable === false) return false;
  if (snapshot.accessApproved === false) return false;
  return true;
}

function baseOutput(input, evidenceBundle) {
  return {
    providerRuntimeBoundaryStatus: PROVIDER_RUNTIME_STATUSES.UNKNOWN,
    decision: PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT,

    providerRuntimeRequestId: input.providerRuntimeRequestId || null,
    sendRequestId: input.sendRequestId || input.sendExecutionGateSnapshot?.sendRequestId || null,
    deliveryRequestId: input.deliveryRequestId || input.sendExecutionGateSnapshot?.deliveryRequestId || null,
    approvalRequestId: input.approvalRequestId || input.sendExecutionGateSnapshot?.approvalRequestId || null,
    advisorId: input.advisorId || null,
    managerId: input.managerId || null,
    senderId: input.senderId || input.sendExecutionGateSnapshot?.senderId || null,
    senderRole: input.senderRole || input.sendExecutionGateSnapshot?.senderRole || null,
    personId: input.personId || null,
    personType: input.personType || null,

    channel: input.channel || input.sendExecutionGateSnapshot?.channel || null,
    providerName: input.providerName || null,
    providerMode: input.providerMode || null,
    idempotencyKey: input.idempotencyKey || null,
    dryRun: input.dryRun === true,
    finalSendText: input.finalSendText || input.sendExecutionGateSnapshot?.finalSendText || null,
    recipientDestination: input.recipientDestination || input.sendExecutionGateSnapshot?.recipientDestination || null,
    providerPayloadCandidate: null,

    approvedArtifactHash: input.approvedArtifactHash || input.sendExecutionGateSnapshot?.approvedArtifactHash || null,
    currentArtifactHash: input.currentArtifactHash || input.sendExecutionGateSnapshot?.currentArtifactHash || null,

    approvedForProviderRuntimePreparation: false,
    approvedForProviderRuntimeExecution: false,
    providerRuntimeCallAllowed: false,
    providerDispatchAllowed: false,
    sendsMessage: false,
    providerCredentialAccessAllowed: false,
    retryAllowed: false,
    scheduledExecutionAllowed: false,
    automaticSendAllowed: false,
    silentSendAllowed: false,
    humanSendConfirmationRequired: true,
    sendExecutionGateRequired: true,
    providerAuditRequired: true,
    providerConnectorBoundaryRequired: true,

    blockedUses: [],
    allowedUses: [],
    missingSignals: [],
    unknownSignals: [],
    warnings: unique([...(asArray(input.warnings)), ...(asArray(input.sendExecutionGateSnapshot?.warnings))]),
    limitations: unique([...(asArray(input.limitations)), ...(asArray(input.sendExecutionGateSnapshot?.limitations))]),

    createsTask: false,
    createsCalendarEvent: false,
    createsCompensationTruth: false,
    createsPayoutTruth: false,
    createsRevenueTruth: false,
    createsRankingTruth: false,
    createsPunishmentTruth: false,
    createsHrTruth: false,
    createsPromotionTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsPersonalityTruth: false,

    evidenceRefs: evidenceBundle.evidenceRefs,
    sourceEvidenceIds: evidenceBundle.sourceEvidenceIds,
    sourceOwners: evidenceBundle.sourceOwners,
  };
}

function markBlocked(output, status, decision, signal, blockedUse) {
  output.providerRuntimeBoundaryStatus = status;
  output.decision = decision;
  if (signal) output.missingSignals = unique([...output.missingSignals, signal]);
  if (blockedUse) output.blockedUses = unique([...output.blockedUses, blockedUse]);
  return output;
}

function buildProviderRuntimeBoundary(input = {}) {
  const original = clone(input) || {};
  const evidenceBundle = collectEvidence(original.sourceEvidence);
  const output = baseOutput(original, evidenceBundle);

  const requestedUse = normalizeUse(original.requestedUse);
  if (requestedUse && PROVIDER_RUNTIME_FORBIDDEN_USES.includes(requestedUse)) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.BLOCKED, PROVIDER_RUNTIME_DECISIONS.BLOCK_PROVIDER_RUNTIME, null, requestedUse);
  }

  if (requestedUse && !PROVIDER_RUNTIME_ALLOWED_USES.includes(requestedUse)) {
    output.blockedUses = unique([requestedUse]);
    output.providerRuntimeBoundaryStatus = PROVIDER_RUNTIME_STATUSES.NOT_MODELED;
    output.decision = PROVIDER_RUNTIME_DECISIONS.NOT_MODELED;
    return output;
  }

  if (requestedUse) output.allowedUses = unique([requestedUse]);

  const sendGate = original.sendExecutionGateSnapshot;
  if (!sendGate || typeof sendGate !== 'object') {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_SEND_EXECUTION_GATE, PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT, 'sendExecutionGateSnapshot');
  }

  if (sendGate.approvedForProviderHandoff !== true) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_PROVIDER_HANDOFF, PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT, 'approvedForProviderHandoff');
  }

  if (!hasFinalHumanConfirmation(original)) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_FINAL_HUMAN_CONFIRMATION, PROVIDER_RUNTIME_DECISIONS.REQUEST_PROVIDER_RUNTIME_REVIEW, 'finalHumanConfirmationSnapshot');
  }

  const providerName = normalizeString(original.providerName);
  if (!providerName) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_PROVIDER_NAME, PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT, 'providerName');
  }

  if (!SUPPORTED_PROVIDERS.includes(providerName)) {
    output.providerName = providerName;
    output.providerRuntimeBoundaryStatus = PROVIDER_RUNTIME_STATUSES.UNSUPPORTED_PROVIDER;
    output.decision = PROVIDER_RUNTIME_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_PROVIDER']);
    return output;
  }

  const channel = normalizeString(original.channel || sendGate.channel);
  if (!channel) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_CHANNEL, PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT, 'channel');
  }

  if (!SUPPORTED_CHANNELS.includes(channel)) {
    output.channel = channel;
    output.providerRuntimeBoundaryStatus = PROVIDER_RUNTIME_STATUSES.UNSUPPORTED_CHANNEL;
    output.decision = PROVIDER_RUNTIME_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_CHANNEL']);
    return output;
  }

  if (!original.recipientDestination && !sendGate.recipientDestination) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_RECIPIENT_DESTINATION, PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT, 'recipientDestination');
  }

  const approvedArtifactHash = original.approvedArtifactHash || sendGate.approvedArtifactHash;
  if (!approvedArtifactHash) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_ARTIFACT_HASH, PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT, 'approvedArtifactHash');
  }

  output.approvedArtifactHash = approvedArtifactHash;

  const currentArtifactHash = original.currentArtifactHash || sendGate.currentArtifactHash || approvedArtifactHash;
  output.currentArtifactHash = currentArtifactHash;

  if (currentArtifactHash !== approvedArtifactHash) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.ARTIFACT_CHANGED_REAPPROVAL_REQUIRED, PROVIDER_RUNTIME_DECISIONS.BLOCK_PROVIDER_RUNTIME, 'artifactHashMismatch', 'SEND_CHANGED_ARTIFACT_WITHOUT_REAPPROVAL');
  }

  const safety = original.safetyValidationSnapshot || sendGate.safetyValidationSnapshot;
  if (isSafetyUnsafe(safety)) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.UNSAFE_MESSAGE_BLOCKED, PROVIDER_RUNTIME_DECISIONS.BLOCK_PROVIDER_RUNTIME, 'unsafeSafetyValidation', 'SEND_UNSAFE_MESSAGE');
  }

  if (!original.idempotencyKey) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_IDEMPOTENCY_KEY, PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT, 'idempotencyKey');
  }

  if (!hasProviderCapability(original.providerCapabilitySnapshot, providerName, channel)) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_PROVIDER_CAPABILITY, PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT, 'providerCapabilitySnapshot');
  }

  if (!hasCredentialReview(original.credentialReviewSnapshot)) {
    return markBlocked(output, PROVIDER_RUNTIME_STATUSES.NEEDS_CREDENTIAL_REVIEW, PROVIDER_RUNTIME_DECISIONS.NEEDS_MORE_CONTEXT, 'credentialReviewSnapshot');
  }

  if (isExpired(original.expiresAt || original.runtimeWindowExpiresAt || sendGate.expiresAt, original.now)) {
    output.providerRuntimeBoundaryStatus = PROVIDER_RUNTIME_STATUSES.EXPIRED_RUNTIME_WINDOW;
    output.decision = PROVIDER_RUNTIME_DECISIONS.EXPIRED;
    output.blockedUses = unique([...output.blockedUses, 'EXPIRED_RUNTIME_WINDOW']);
    return output;
  }

  const finalSendText = original.finalSendText || sendGate.finalSendText;
  const recipientDestination = original.recipientDestination || sendGate.recipientDestination;

  output.channel = channel;
  output.providerName = providerName;
  output.providerMode = original.providerMode || 'PAYLOAD_PREP_ONLY';
  output.idempotencyKey = original.idempotencyKey;
  output.finalSendText = finalSendText || null;
  output.recipientDestination = recipientDestination;
  output.providerPayloadCandidate = {
    providerName,
    channel,
    recipientDestination,
    finalSendText,
    idempotencyKey: original.idempotencyKey,
    dryRun: original.dryRun === true,
    dispatchAllowed: false,
  };

  output.approvedForProviderRuntimePreparation = true;
  output.approvedForProviderRuntimeExecution = false;
  output.providerRuntimeCallAllowed = false;
  output.providerDispatchAllowed = false;
  output.sendsMessage = false;
  output.providerCredentialAccessAllowed = false;
  output.providerRuntimeBoundaryStatus = original.dryRun === true
    ? PROVIDER_RUNTIME_STATUSES.APPROVED_FOR_DRY_RUN_ONLY
    : PROVIDER_RUNTIME_STATUSES.APPROVED_FOR_PROVIDER_RUNTIME_PREPARATION;
  output.decision = original.dryRun === true
    ? PROVIDER_RUNTIME_DECISIONS.APPROVE_DRY_RUN_ONLY
    : PROVIDER_RUNTIME_DECISIONS.APPROVE_PROVIDER_RUNTIME_PREPARATION;

  return output;
}

module.exports = {
  buildProviderRuntimeBoundary,
  PROVIDER_RUNTIME_STATUSES,
  PROVIDER_RUNTIME_DECISIONS,
  PROVIDER_RUNTIME_ALLOWED_USES,
  PROVIDER_RUNTIME_FORBIDDEN_USES,
};
