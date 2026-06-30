/**
 * UI / Read Model Boundary Contract
 *
 * UI read model candidate is not UI rendering truth.
 * Pure boundary: prepares a read-only presentation model candidate.
 * Never renders UI, never persists, never creates truth, and never executes actions.
 */

const UI_READ_MODEL_STATUSES = Object.freeze({
  READY_FOR_UI_READ_MODEL_REVIEW: 'READY_FOR_UI_READ_MODEL_REVIEW',
  APPROVED_FOR_READ_ONLY_PRESENTATION_MODEL: 'APPROVED_FOR_READ_ONLY_PRESENTATION_MODEL',
  NEEDS_PROVIDER_WEBHOOK: 'NEEDS_PROVIDER_WEBHOOK',
  NEEDS_PROVIDER_EVENT_READ_MODEL: 'NEEDS_PROVIDER_EVENT_READ_MODEL',
  NEEDS_DISPLAY_POLICY: 'NEEDS_DISPLAY_POLICY',
  NEEDS_READ_MODEL_POLICY: 'NEEDS_READ_MODEL_POLICY',
  NEEDS_VISIBILITY_POLICY: 'NEEDS_VISIBILITY_POLICY',
  NEEDS_SOURCE_EVIDENCE: 'NEEDS_SOURCE_EVIDENCE',
  NEEDS_SOURCE_OWNER: 'NEEDS_SOURCE_OWNER',
  NEEDS_SOURCE_FRESHNESS: 'NEEDS_SOURCE_FRESHNESS',
  STALE_SOURCE_FRESHNESS: 'STALE_SOURCE_FRESHNESS',
  NEEDS_AUDIT_TRAIL: 'NEEDS_AUDIT_TRAIL',
  UNSUPPORTED_VIEWER_ROLE: 'UNSUPPORTED_VIEWER_ROLE',
  UNSUPPORTED_STATUS: 'UNSUPPORTED_STATUS',
  EXPIRED_READ_MODEL_WINDOW: 'EXPIRED_READ_MODEL_WINDOW',
  BLOCKED: 'BLOCKED',
  UNKNOWN: 'UNKNOWN',
  NOT_MODELED: 'NOT_MODELED',
});

const UI_READ_MODEL_DECISIONS = Object.freeze({
  REQUEST_UI_READ_MODEL_REVIEW: 'REQUEST_UI_READ_MODEL_REVIEW',
  APPROVE_READ_ONLY_PRESENTATION_MODEL: 'APPROVE_READ_ONLY_PRESENTATION_MODEL',
  BLOCK_UI_READ_MODEL: 'BLOCK_UI_READ_MODEL',
  NEEDS_MORE_CONTEXT: 'NEEDS_MORE_CONTEXT',
  EXPIRED: 'EXPIRED',
  NOT_MODELED: 'NOT_MODELED',
});

const UI_READ_MODEL_ALLOWED_USES = Object.freeze([
  'UI_READ_MODEL_REVIEW',
  'READ_ONLY_PRESENTATION_MODEL_PREP',
  'ADVISOR_ACTION_CARD_PREP',
  'MANAGER_REVIEW_CARD_PREP',
  'DELIVERY_STATUS_DISPLAY_PREP',
  'WARNING_DISPLAY_PREP',
]);

const UI_READ_MODEL_FORBIDDEN_USES = Object.freeze([
  'UI_RENDERING',
  'DASHBOARD_CREATION',
  'CRM_MUTATION',
  'PERSISTENCE_WRITE',
  'DELIVERY_TRUTH_CREATION',
  'MESSAGE_TRUTH_CREATION',
  'AUTOMATIC_FOLLOW_UP',
  'AUTOMATIC_RETRY',
  'AUTOMATIC_SEND',
  'SEND_MESSAGE',
  'PROVIDER_API_CALL',
  'EXTERNAL_API_CALL',
  'WEBHOOK_SIDE_EFFECT',
  'TASK_CREATION',
  'CALENDAR_CREATION',
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

const SUPPORTED_VIEWER_ROLES = Object.freeze(['ADVISOR', 'MANAGER', 'PARTNER', 'DIRECTOR']);
const SUPPORTED_STATUSES = Object.freeze([
  'ACCEPTED_STATUS',
  'SENT_STATUS',
  'DELIVERED_STATUS',
  'FAILED_STATUS',
  'BOUNCE_STATUS',
  'READ_STATUS',
  'DELIVERY_STATUS',
  'WARNING_STATUS',
]);

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

function hasProviderWebhookSnapshot(snapshot) {
  return Boolean(snapshot && typeof snapshot === 'object' && snapshot.approvedForWebhookIntakeReview === true);
}

function hasDisplayPolicy(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.reviewed !== true && snapshot.policyReviewed !== true) return false;
  if (snapshot.allowed === false) return false;
  if (snapshot.rendersUi === true) return false;
  if (snapshot.dashboardCreationAllowed === true) return false;
  return true;
}

function hasReadModelPolicy(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.reviewed !== true && snapshot.policyReviewed !== true) return false;
  if (snapshot.allowed === false) return false;
  if (snapshot.persistsReadModel === true) return false;
  if (snapshot.persistenceWriteAllowed === true) return false;
  if (snapshot.createsDeliveryTruth === true) return false;
  if (snapshot.createsMessageTruth === true) return false;
  return true;
}

function hasVisibilityPolicy(snapshot, roleViewing) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.reviewed !== true && snapshot.policyReviewed !== true) return false;
  if (snapshot.allowed === false) return false;
  const roles = asArray(snapshot.allowedRoles || snapshot.viewerRoles).map(normalizeString).filter(Boolean);
  return roles.length === 0 || roles.includes(roleViewing);
}

function hasFreshness(sourceFreshness) {
  if (!sourceFreshness || typeof sourceFreshness !== 'object') return false;
  if (sourceFreshness.stale === true) return false;
  if (sourceFreshness.fresh === false) return false;
  if (sourceFreshness.status && normalizeString(sourceFreshness.status) !== 'FRESH') return false;
  return sourceFreshness.fresh === true || normalizeString(sourceFreshness.status) === 'FRESH' || Boolean(sourceFreshness.asOf);
}

function isStale(sourceFreshness) {
  if (!sourceFreshness || typeof sourceFreshness !== 'object') return false;
  return sourceFreshness.stale === true || sourceFreshness.fresh === false || normalizeString(sourceFreshness.status) === 'STALE';
}

function hasAuditTrail(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.auditTrailId || snapshot.auditId) return true;
  return asArray(snapshot.entries || snapshot.events).length > 0;
}

function baseOutput(input, evidenceBundle) {
  return {
    uiReadModelStatus: UI_READ_MODEL_STATUSES.UNKNOWN,
    decision: UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT,

    uiReadModelRequestId: input.uiReadModelRequestId || null,
    providerWebhookBoundaryRequestId: input.providerWebhookBoundaryRequestId || input.providerWebhookSnapshot?.providerWebhookBoundaryRequestId || null,
    externalDispatchRequestId: input.externalDispatchRequestId || input.providerWebhookSnapshot?.externalDispatchRequestId || null,
    sendRequestId: input.sendRequestId || input.providerWebhookSnapshot?.sendRequestId || null,
    advisorId: input.advisorId || null,
    managerId: input.managerId || null,
    personId: input.personId || null,
    personType: input.personType || null,
    roleViewing: input.roleViewing || null,

    uiPresentationModelCandidate: null,
    visibleStatusLabel: input.statusLabel || input.providerWebhookSnapshot?.providerEventType || null,
    visibleSeverity: input.statusSeverity || null,
    visibleNextAction: input.recommendedVisibleAction || null,
    visibleReasonWhy: input.reasonWhySummary || null,
    visibleWarnings: unique([...(asArray(input.warnings)), ...(asArray(input.providerWebhookSnapshot?.warnings))]),
    visibleLimitations: unique([...(asArray(input.limitations)), ...(asArray(input.providerWebhookSnapshot?.limitations))]),

    evidenceRefs: evidenceBundle.evidenceRefs,
    sourceEvidenceIds: evidenceBundle.sourceEvidenceIds,
    sourceOwners: evidenceBundle.sourceOwners,

    approvedForReadOnlyPresentationModel: false,
    approvedForUiRendering: false,
    rendersUi: false,
    persistsReadModel: false,
    createsDeliveryTruth: false,
    createsMessageTruth: false,
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
    executesAction: false,
    sendsMessage: false,
    providerApiCallAllowed: false,
    externalApiCallAllowed: false,
    crmMutationAllowed: false,
    automaticFollowUpAllowed: false,
    automaticRetryAllowed: false,

    blockedUses: [],
    allowedUses: [],
    missingSignals: [],
    unknownSignals: [],
    warnings: unique([...(asArray(input.warnings)), ...(asArray(input.providerWebhookSnapshot?.warnings))]),
    limitations: unique([...(asArray(input.limitations)), ...(asArray(input.providerWebhookSnapshot?.limitations))]),
  };
}

function markBlocked(output, status, decision, signal, blockedUse) {
  output.uiReadModelStatus = status;
  output.decision = decision;
  if (signal) output.missingSignals = unique([...output.missingSignals, signal]);
  if (blockedUse) output.blockedUses = unique([...output.blockedUses, blockedUse]);
  return output;
}

function buildUiReadModelBoundary(input = {}) {
  const original = clone(input) || {};
  const evidenceBundle = collectEvidence(original.sourceEvidence);
  const output = baseOutput(original, evidenceBundle);

  const requestedUse = normalizeUse(original.requestedUse);
  if (requestedUse && UI_READ_MODEL_FORBIDDEN_USES.includes(requestedUse)) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.BLOCKED, UI_READ_MODEL_DECISIONS.BLOCK_UI_READ_MODEL, null, requestedUse);
  }

  if (requestedUse && !UI_READ_MODEL_ALLOWED_USES.includes(requestedUse)) {
    output.blockedUses = unique([requestedUse]);
    output.uiReadModelStatus = UI_READ_MODEL_STATUSES.NOT_MODELED;
    output.decision = UI_READ_MODEL_DECISIONS.NOT_MODELED;
    return output;
  }

  if (requestedUse) output.allowedUses = unique([requestedUse]);

  const providerWebhookSnapshot = original.providerWebhookSnapshot;
  if (!hasProviderWebhookSnapshot(providerWebhookSnapshot)) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.NEEDS_PROVIDER_WEBHOOK, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'providerWebhookSnapshot');
  }

  const readModelCandidate = original.providerEventReadModelCandidate || providerWebhookSnapshot.providerEventReadModelCandidate;
  if (!readModelCandidate || typeof readModelCandidate !== 'object') {
    return markBlocked(output, UI_READ_MODEL_STATUSES.NEEDS_PROVIDER_EVENT_READ_MODEL, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'providerEventReadModelCandidate');
  }

  if (!hasDisplayPolicy(original.displayPolicySnapshot)) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.NEEDS_DISPLAY_POLICY, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'displayPolicySnapshot');
  }

  if (!hasReadModelPolicy(original.readModelPolicySnapshot)) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.NEEDS_READ_MODEL_POLICY, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'readModelPolicySnapshot');
  }

  const roleViewing = normalizeString(original.roleViewing);
  if (roleViewing && !SUPPORTED_VIEWER_ROLES.includes(roleViewing)) {
    output.roleViewing = roleViewing;
    output.uiReadModelStatus = UI_READ_MODEL_STATUSES.UNSUPPORTED_VIEWER_ROLE;
    output.decision = UI_READ_MODEL_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_VIEWER_ROLE']);
    return output;
  }

  if (!hasVisibilityPolicy(original.visibilityPolicySnapshot, roleViewing)) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.NEEDS_VISIBILITY_POLICY, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'visibilityPolicySnapshot');
  }

  if (asArray(original.sourceEvidence).length === 0) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.NEEDS_SOURCE_EVIDENCE, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceEvidence');
  }

  if (evidenceBundle.sourceOwners.length === 0) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.NEEDS_SOURCE_OWNER, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceOwner');
  }

  if (isStale(original.sourceFreshness)) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.STALE_SOURCE_FRESHNESS, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceFreshness');
  }

  if (!hasFreshness(original.sourceFreshness)) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.NEEDS_SOURCE_FRESHNESS, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceFreshness');
  }

  if (!hasAuditTrail(original.auditTrail)) {
    return markBlocked(output, UI_READ_MODEL_STATUSES.NEEDS_AUDIT_TRAIL, UI_READ_MODEL_DECISIONS.NEEDS_MORE_CONTEXT, 'auditTrail');
  }

  const visibleStatusLabel = normalizeString(original.statusLabel || readModelCandidate.providerEventType || providerWebhookSnapshot.providerEventType);
  if (visibleStatusLabel && !SUPPORTED_STATUSES.includes(visibleStatusLabel)) {
    output.visibleStatusLabel = visibleStatusLabel;
    output.uiReadModelStatus = UI_READ_MODEL_STATUSES.UNSUPPORTED_STATUS;
    output.decision = UI_READ_MODEL_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_STATUS']);
    return output;
  }

  if (isExpired(original.expiresAt || original.readModelWindowExpiresAt, original.now)) {
    output.uiReadModelStatus = UI_READ_MODEL_STATUSES.EXPIRED_READ_MODEL_WINDOW;
    output.decision = UI_READ_MODEL_DECISIONS.EXPIRED;
    output.blockedUses = unique([...output.blockedUses, 'EXPIRED_READ_MODEL_WINDOW']);
    return output;
  }

  output.roleViewing = roleViewing || null;
  output.visibleStatusLabel = visibleStatusLabel || null;
  output.visibleSeverity = original.statusSeverity || 'INFO';
  output.visibleNextAction = original.recommendedVisibleAction || null;
  output.visibleReasonWhy = original.reasonWhySummary || null;

  output.uiPresentationModelCandidate = {
    roleViewing: roleViewing || null,
    personId: original.personId || null,
    personType: original.personType || null,
    visibleStatusLabel: output.visibleStatusLabel,
    visibleSeverity: output.visibleSeverity,
    visibleNextAction: output.visibleNextAction,
    visibleReasonWhy: output.visibleReasonWhy,
    visibleWarnings: output.visibleWarnings,
    visibleLimitations: output.visibleLimitations,
    evidenceRefs: output.evidenceRefs,
    sourceEvidenceIds: output.sourceEvidenceIds,
    sourceOwners: output.sourceOwners,
    providerEventReadModelCandidate: readModelCandidate,
    approvedForUiRendering: false,
    rendersUi: false,
    persistsReadModel: false,
    createsDeliveryTruth: false,
    createsMessageTruth: false,
    executesAction: false,
  };

  output.approvedForReadOnlyPresentationModel = true;
  output.approvedForUiRendering = false;
  output.rendersUi = false;
  output.persistsReadModel = false;
  output.createsDeliveryTruth = false;
  output.createsMessageTruth = false;
  output.executesAction = false;
  output.sendsMessage = false;
  output.providerApiCallAllowed = false;
  output.externalApiCallAllowed = false;
  output.crmMutationAllowed = false;
  output.automaticFollowUpAllowed = false;
  output.automaticRetryAllowed = false;

  output.uiReadModelStatus = UI_READ_MODEL_STATUSES.APPROVED_FOR_READ_ONLY_PRESENTATION_MODEL;
  output.decision = UI_READ_MODEL_DECISIONS.APPROVE_READ_ONLY_PRESENTATION_MODEL;

  return output;
}

module.exports = {
  buildUiReadModelBoundary,
  UI_READ_MODEL_STATUSES,
  UI_READ_MODEL_DECISIONS,
  UI_READ_MODEL_ALLOWED_USES,
  UI_READ_MODEL_FORBIDDEN_USES,
};
