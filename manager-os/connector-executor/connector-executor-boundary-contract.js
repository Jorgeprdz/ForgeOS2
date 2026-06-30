/**
 * Connector Executor Boundary Contract
 *
 * Connector execution handoff is not connector executor execution.
 * This pure boundary validates executor command readiness and prepares an executor command candidate.
 * It never invokes executors, never invokes connectors, never calls external APIs, never dispatches,
 * never sends, never exposes credential material, never creates tasks/calendar, and never creates truth.
 */

const CONNECTOR_EXECUTOR_STATUSES = Object.freeze({
  READY_FOR_EXECUTOR_REVIEW: 'READY_FOR_EXECUTOR_REVIEW',
  APPROVED_FOR_EXECUTOR_COMMAND_PREPARATION: 'APPROVED_FOR_EXECUTOR_COMMAND_PREPARATION',
  APPROVED_FOR_EXECUTOR_DRY_RUN_ONLY: 'APPROVED_FOR_EXECUTOR_DRY_RUN_ONLY',
  NEEDS_CONNECTOR_EXECUTION_GATE: 'NEEDS_CONNECTOR_EXECUTION_GATE',
  NEEDS_CONNECTOR_INVOCATION_CANDIDATE: 'NEEDS_CONNECTOR_INVOCATION_CANDIDATE',
  NEEDS_EXECUTOR_CONFIRMATION: 'NEEDS_EXECUTOR_CONFIRMATION',
  NEEDS_CONNECTOR_EXECUTOR: 'NEEDS_CONNECTOR_EXECUTOR',
  NEEDS_EXECUTOR_CAPABILITY: 'NEEDS_EXECUTOR_CAPABILITY',
  NEEDS_EXECUTOR_POLICY: 'NEEDS_EXECUTOR_POLICY',
  NEEDS_IDEMPOTENCY_KEY: 'NEEDS_IDEMPOTENCY_KEY',
  NEEDS_AUDIT_TRAIL: 'NEEDS_AUDIT_TRAIL',
  NEEDS_CREDENTIAL_REVIEW: 'NEEDS_CREDENTIAL_REVIEW',
  NEEDS_RATE_LIMIT_REVIEW: 'NEEDS_RATE_LIMIT_REVIEW',
  NEEDS_RETRY_POLICY: 'NEEDS_RETRY_POLICY',
  UNSUPPORTED_CONNECTOR_EXECUTOR: 'UNSUPPORTED_CONNECTOR_EXECUTOR',
  UNSUPPORTED_CONNECTOR: 'UNSUPPORTED_CONNECTOR',
  UNSUPPORTED_PROVIDER: 'UNSUPPORTED_PROVIDER',
  UNSUPPORTED_CHANNEL: 'UNSUPPORTED_CHANNEL',
  EXPIRED_EXECUTOR_WINDOW: 'EXPIRED_EXECUTOR_WINDOW',
  BLOCKED: 'BLOCKED',
  UNKNOWN: 'UNKNOWN',
  NOT_MODELED: 'NOT_MODELED',
});

const CONNECTOR_EXECUTOR_DECISIONS = Object.freeze({
  REQUEST_EXECUTOR_REVIEW: 'REQUEST_EXECUTOR_REVIEW',
  APPROVE_EXECUTOR_COMMAND_PREPARATION: 'APPROVE_EXECUTOR_COMMAND_PREPARATION',
  APPROVE_EXECUTOR_DRY_RUN_ONLY: 'APPROVE_EXECUTOR_DRY_RUN_ONLY',
  BLOCK_EXECUTOR: 'BLOCK_EXECUTOR',
  NEEDS_MORE_CONTEXT: 'NEEDS_MORE_CONTEXT',
  EXPIRED: 'EXPIRED',
  NOT_MODELED: 'NOT_MODELED',
});

const CONNECTOR_EXECUTOR_ALLOWED_USES = Object.freeze([
  'EXECUTOR_REVIEW',
  'EXECUTOR_COMMAND_PREP',
  'EXECUTOR_DRY_RUN_PREP',
  'WHATSAPP_EXECUTOR_REVIEW',
  'SMS_EXECUTOR_REVIEW',
  'EMAIL_EXECUTOR_REVIEW',
]);

const CONNECTOR_EXECUTOR_FORBIDDEN_USES = Object.freeze([
  'AUTOMATIC_SEND',
  'SILENT_SEND',
  'AI_SELF_SEND',
  'EXTERNAL_API_CALL',
  'CONNECTOR_INVOCATION',
  'CONNECTOR_EXECUTION',
  'EXECUTOR_INVOCATION',
  'PROVIDER_DISPATCH',
  'SEND_MESSAGE',
  'EXECUTOR_WITHOUT_EXECUTION_GATE',
  'EXECUTOR_WITHOUT_HUMAN_CONFIRMATION',
  'EXECUTOR_WITHOUT_IDEMPOTENCY',
  'EXECUTOR_WITHOUT_AUDIT',
  'EXECUTOR_WITHOUT_CREDENTIAL_REVIEW',
  'CREDENTIAL_MATERIAL_EXPOSURE',
  'WHATSAPP_API_SEND',
  'SMS_API_SEND',
  'EMAIL_API_SEND',
  'SCHEDULED_SEND',
  'QUEUE_EXECUTION',
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
const SUPPORTED_CONNECTORS = Object.freeze(['MOCK_CONNECTOR', 'WHATSAPP_BUSINESS_CONNECTOR', 'TWILIO_CONNECTOR', 'SENDGRID_CONNECTOR', 'SMTP_CONNECTOR']);
const SUPPORTED_EXECUTORS = Object.freeze(['MOCK_EXECUTOR', 'WHATSAPP_BUSINESS_EXECUTOR', 'TWILIO_EXECUTOR', 'SENDGRID_EXECUTOR', 'SMTP_EXECUTOR']);

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

function hasExecutionGate(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  return snapshot.approvedForConnectorExecutionHandoff === true;
}

function hasFinalExecutorConfirmation(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  const confirmed = snapshot.confirmed === true || snapshot.finalExecutorConfirmed === true;
  const actor = snapshot.confirmedBy || snapshot.senderId || snapshot.reviewerId;
  const at = snapshot.confirmedAt || snapshot.timestamp;
  return Boolean(confirmed && actor && at);
}

function hasExecutorCapability(snapshot, executorName, connectorName, providerName, channel) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.available === false || snapshot.supported === false) return false;

  const executors = asArray(snapshot.supportedExecutors || snapshot.executors).map(normalizeString).filter(Boolean);
  const connectors = asArray(snapshot.supportedConnectors || snapshot.connectors).map(normalizeString).filter(Boolean);
  const providers = asArray(snapshot.supportedProviders || snapshot.providers).map(normalizeString).filter(Boolean);
  const channels = asArray(snapshot.supportedChannels || snapshot.channels).map(normalizeString).filter(Boolean);

  const executorOk = executors.length === 0 || executors.includes(executorName);
  const connectorOk = connectors.length === 0 || connectors.includes(connectorName);
  const providerOk = providers.length === 0 || providers.includes(providerName);
  const channelOk = channels.length === 0 || channels.includes(channel);

  return executorOk && connectorOk && providerOk && channelOk;
}

function hasExecutorPolicy(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.reviewed !== true && snapshot.policyReviewed !== true) return false;
  if (snapshot.allowed === false) return false;
  if (snapshot.externalApiCallAllowed === true) return false;
  if (snapshot.executorInvocationAllowed === true) return false;
  if (snapshot.connectorInvocationAllowed === true) return false;
  if (snapshot.providerDispatchAllowed === true) return false;
  return true;
}

function hasCredentialReview(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.reviewed !== true && snapshot.credentialReviewPassed !== true) return false;
  if (snapshot.credentialsAvailable === false) return false;
  if (snapshot.accessApproved === false) return false;
  if (snapshot.credentialMaterialExposed === true) return false;
  return true;
}

function hasRateLimitReview(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.reviewed !== true && snapshot.rateLimitReviewed !== true) return false;
  if (snapshot.allowed === false) return false;
  return true;
}

function hasRetryPolicy(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.reviewed !== true && snapshot.retryPolicyReviewed !== true) return false;
  if (snapshot.allowed === false) return false;
  return true;
}

function hasAuditTrail(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.auditTrailId || snapshot.auditId) return true;
  return asArray(snapshot.entries || snapshot.events).length > 0;
}

function baseOutput(input, evidenceBundle) {
  return {
    connectorExecutorBoundaryStatus: CONNECTOR_EXECUTOR_STATUSES.UNKNOWN,
    decision: CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT,

    connectorExecutorRequestId: input.connectorExecutorRequestId || null,
    connectorExecutionGateRequestId: input.connectorExecutionGateRequestId || input.connectorExecutionGateSnapshot?.connectorExecutionGateRequestId || null,
    providerConnectorRequestId: input.providerConnectorRequestId || input.connectorExecutionGateSnapshot?.providerConnectorRequestId || null,
    providerRuntimeRequestId: input.providerRuntimeRequestId || input.connectorExecutionGateSnapshot?.providerRuntimeRequestId || null,
    sendRequestId: input.sendRequestId || input.connectorExecutionGateSnapshot?.sendRequestId || null,
    deliveryRequestId: input.deliveryRequestId || input.connectorExecutionGateSnapshot?.deliveryRequestId || null,
    approvalRequestId: input.approvalRequestId || input.connectorExecutionGateSnapshot?.approvalRequestId || null,
    advisorId: input.advisorId || null,
    managerId: input.managerId || null,
    senderId: input.senderId || input.connectorExecutionGateSnapshot?.senderId || null,
    senderRole: input.senderRole || input.connectorExecutionGateSnapshot?.senderRole || null,
    personId: input.personId || null,
    personType: input.personType || null,

    providerName: input.providerName || input.connectorExecutionGateSnapshot?.providerName || null,
    providerConnectorName: input.providerConnectorName || input.connectorExecutionGateSnapshot?.providerConnectorName || null,
    connectorExecutorName: input.connectorExecutorName || input.connectorExecutionGateSnapshot?.connectorExecutorName || null,
    connectorExecutorMode: input.connectorExecutorMode || null,
    channel: input.channel || input.connectorExecutionGateSnapshot?.channel || null,
    idempotencyKey: input.idempotencyKey || input.connectorExecutionGateSnapshot?.idempotencyKey || null,
    dryRun: input.dryRun === true,

    executorCommandCandidate: null,
    connectorInvocationCandidate: input.connectorInvocationCandidate || input.connectorExecutionGateSnapshot?.connectorInvocationCandidate || null,

    approvedForExecutorCommandPreparation: false,
    approvedForExecutorInvocation: false,
    executorInvocationAllowed: false,
    connectorInvocationAllowed: false,
    externalApiCallAllowed: false,
    providerDispatchAllowed: false,
    sendsMessage: false,
    credentialMaterialExposed: false,
    retryAllowed: false,
    queueExecutionAllowed: false,
    scheduledExecutionAllowed: false,
    webhookSideEffectAllowed: false,
    automaticSendAllowed: false,
    silentSendAllowed: false,
    humanSendConfirmationRequired: true,
    connectorExecutionGateRequired: true,
    connectorExecutorAuditRequired: true,
    dispatchExecutorRequired: true,
    externalDispatchBoundaryRequired: true,

    blockedUses: [],
    allowedUses: [],
    missingSignals: [],
    unknownSignals: [],
    warnings: unique([...(asArray(input.warnings)), ...(asArray(input.connectorExecutionGateSnapshot?.warnings))]),
    limitations: unique([...(asArray(input.limitations)), ...(asArray(input.connectorExecutionGateSnapshot?.limitations))]),

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
  output.connectorExecutorBoundaryStatus = status;
  output.decision = decision;
  if (signal) output.missingSignals = unique([...output.missingSignals, signal]);
  if (blockedUse) output.blockedUses = unique([...output.blockedUses, blockedUse]);
  return output;
}

function buildConnectorExecutorBoundary(input = {}) {
  const original = clone(input) || {};
  const evidenceBundle = collectEvidence(original.sourceEvidence);
  const output = baseOutput(original, evidenceBundle);

  const requestedUse = normalizeUse(original.requestedUse);
  if (requestedUse && CONNECTOR_EXECUTOR_FORBIDDEN_USES.includes(requestedUse)) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.BLOCKED, CONNECTOR_EXECUTOR_DECISIONS.BLOCK_EXECUTOR, null, requestedUse);
  }

  if (requestedUse && !CONNECTOR_EXECUTOR_ALLOWED_USES.includes(requestedUse)) {
    output.blockedUses = unique([requestedUse]);
    output.connectorExecutorBoundaryStatus = CONNECTOR_EXECUTOR_STATUSES.NOT_MODELED;
    output.decision = CONNECTOR_EXECUTOR_DECISIONS.NOT_MODELED;
    return output;
  }

  if (requestedUse) output.allowedUses = unique([requestedUse]);

  const gate = original.connectorExecutionGateSnapshot;
  if (!hasExecutionGate(gate)) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_CONNECTOR_EXECUTION_GATE, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'connectorExecutionGateSnapshot');
  }

  const invocationCandidate = original.connectorInvocationCandidate || gate.connectorInvocationCandidate;
  if (!invocationCandidate || typeof invocationCandidate !== 'object') {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_CONNECTOR_INVOCATION_CANDIDATE, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'connectorInvocationCandidate');
  }

  if (!hasFinalExecutorConfirmation(original.finalExecutorConfirmation)) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_EXECUTOR_CONFIRMATION, CONNECTOR_EXECUTOR_DECISIONS.REQUEST_EXECUTOR_REVIEW, 'finalExecutorConfirmation');
  }

  const executorName = normalizeString(original.connectorExecutorName || gate.connectorExecutorName);
  if (!executorName) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_CONNECTOR_EXECUTOR, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'connectorExecutorName');
  }

  if (!SUPPORTED_EXECUTORS.includes(executorName)) {
    output.connectorExecutorName = executorName;
    output.connectorExecutorBoundaryStatus = CONNECTOR_EXECUTOR_STATUSES.UNSUPPORTED_CONNECTOR_EXECUTOR;
    output.decision = CONNECTOR_EXECUTOR_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_CONNECTOR_EXECUTOR']);
    return output;
  }

  const connectorName = normalizeString(original.providerConnectorName || gate.providerConnectorName || invocationCandidate.connectorName);
  if (connectorName && !SUPPORTED_CONNECTORS.includes(connectorName)) {
    output.providerConnectorName = connectorName;
    output.connectorExecutorBoundaryStatus = CONNECTOR_EXECUTOR_STATUSES.UNSUPPORTED_CONNECTOR;
    output.decision = CONNECTOR_EXECUTOR_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_CONNECTOR']);
    return output;
  }

  const providerName = normalizeString(original.providerName || gate.providerName || invocationCandidate.providerName);
  if (providerName && !SUPPORTED_PROVIDERS.includes(providerName)) {
    output.providerName = providerName;
    output.connectorExecutorBoundaryStatus = CONNECTOR_EXECUTOR_STATUSES.UNSUPPORTED_PROVIDER;
    output.decision = CONNECTOR_EXECUTOR_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_PROVIDER']);
    return output;
  }

  const channel = normalizeString(original.channel || gate.channel || invocationCandidate.channel);
  if (channel && !SUPPORTED_CHANNELS.includes(channel)) {
    output.channel = channel;
    output.connectorExecutorBoundaryStatus = CONNECTOR_EXECUTOR_STATUSES.UNSUPPORTED_CHANNEL;
    output.decision = CONNECTOR_EXECUTOR_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_CHANNEL']);
    return output;
  }

  const idempotencyKey = original.idempotencyKey || gate.idempotencyKey || invocationCandidate.idempotencyKey;
  if (!idempotencyKey) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_IDEMPOTENCY_KEY, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'idempotencyKey');
  }

  if (!hasAuditTrail(original.auditTrail)) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_AUDIT_TRAIL, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'auditTrail');
  }

  if (!hasExecutorCapability(original.executorCapabilitySnapshot, executorName, connectorName, providerName, channel)) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_EXECUTOR_CAPABILITY, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'executorCapabilitySnapshot');
  }

  if (!hasExecutorPolicy(original.executorPolicySnapshot)) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_EXECUTOR_POLICY, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'executorPolicySnapshot');
  }

  if (!hasCredentialReview(original.credentialReviewSnapshot)) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_CREDENTIAL_REVIEW, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'credentialReviewSnapshot');
  }

  if (!hasRateLimitReview(original.rateLimitSnapshot)) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_RATE_LIMIT_REVIEW, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'rateLimitSnapshot');
  }

  if (original.retryRequested === true && !hasRetryPolicy(original.retryPolicySnapshot)) {
    return markBlocked(output, CONNECTOR_EXECUTOR_STATUSES.NEEDS_RETRY_POLICY, CONNECTOR_EXECUTOR_DECISIONS.NEEDS_MORE_CONTEXT, 'retryPolicySnapshot');
  }

  if (isExpired(original.expiresAt || original.executorWindowExpiresAt || gate.expiresAt, original.now)) {
    output.connectorExecutorBoundaryStatus = CONNECTOR_EXECUTOR_STATUSES.EXPIRED_EXECUTOR_WINDOW;
    output.decision = CONNECTOR_EXECUTOR_DECISIONS.EXPIRED;
    output.blockedUses = unique([...output.blockedUses, 'EXPIRED_EXECUTOR_WINDOW']);
    return output;
  }

  output.providerName = providerName || null;
  output.providerConnectorName = connectorName || null;
  output.connectorExecutorName = executorName;
  output.connectorExecutorMode = original.connectorExecutorMode || 'EXECUTOR_COMMAND_PREP_ONLY';
  output.channel = channel || null;
  output.idempotencyKey = idempotencyKey;
  output.connectorInvocationCandidate = invocationCandidate;
  output.executorCommandCandidate = {
    executorName,
    connectorName: connectorName || null,
    providerName: providerName || null,
    channel: channel || null,
    idempotencyKey,
    dryRun: original.dryRun === true,
    connectorInvocationCandidate: invocationCandidate,
    executorInvocationAllowed: false,
    connectorInvocationAllowed: false,
    externalApiCallAllowed: false,
    providerDispatchAllowed: false,
  };

  output.approvedForExecutorCommandPreparation = true;
  output.approvedForExecutorInvocation = false;
  output.executorInvocationAllowed = false;
  output.connectorInvocationAllowed = false;
  output.externalApiCallAllowed = false;
  output.providerDispatchAllowed = false;
  output.sendsMessage = false;
  output.credentialMaterialExposed = false;

  output.connectorExecutorBoundaryStatus = original.dryRun === true
    ? CONNECTOR_EXECUTOR_STATUSES.APPROVED_FOR_EXECUTOR_DRY_RUN_ONLY
    : CONNECTOR_EXECUTOR_STATUSES.APPROVED_FOR_EXECUTOR_COMMAND_PREPARATION;
  output.decision = original.dryRun === true
    ? CONNECTOR_EXECUTOR_DECISIONS.APPROVE_EXECUTOR_DRY_RUN_ONLY
    : CONNECTOR_EXECUTOR_DECISIONS.APPROVE_EXECUTOR_COMMAND_PREPARATION;

  return output;
}

module.exports = {
  buildConnectorExecutorBoundary,
  CONNECTOR_EXECUTOR_STATUSES,
  CONNECTOR_EXECUTOR_DECISIONS,
  CONNECTOR_EXECUTOR_ALLOWED_USES,
  CONNECTOR_EXECUTOR_FORBIDDEN_USES,
};
