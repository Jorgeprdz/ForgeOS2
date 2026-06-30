/**
 * UI Rendering Boundary Contract
 *
 * UI rendering candidate is not user interface execution.
 * Forge Alive view is not dashboard truth.
 * Pure boundary: prepares read-only render model candidates only.
 * Never renders UI, never creates dashboards/routes/components, never persists, never creates truth, never executes actions.
 */

const UI_RENDERING_STATUSES = Object.freeze({
  READY_FOR_UI_RENDERING_REVIEW: 'READY_FOR_UI_RENDERING_REVIEW',
  APPROVED_FOR_READ_ONLY_RENDER_MODEL_CANDIDATE: 'APPROVED_FOR_READ_ONLY_RENDER_MODEL_CANDIDATE',
  NEEDS_CANONICAL_TRUTH_REGISTRY: 'NEEDS_CANONICAL_TRUTH_REGISTRY',
  NEEDS_CANONICAL_TRUTH_ENTRY_CANDIDATE: 'NEEDS_CANONICAL_TRUTH_ENTRY_CANDIDATE',
  NEEDS_UI_PRESENTATION_MODEL: 'NEEDS_UI_PRESENTATION_MODEL',
  NEEDS_DISPLAY_POLICY: 'NEEDS_DISPLAY_POLICY',
  NEEDS_SAFETY_POLICY: 'NEEDS_SAFETY_POLICY',
  NEEDS_PRIVACY_POLICY: 'NEEDS_PRIVACY_POLICY',
  NEEDS_INTERACTION_POLICY: 'NEEDS_INTERACTION_POLICY',
  NEEDS_VIEWER_ROLE: 'NEEDS_VIEWER_ROLE',
  NEEDS_SOURCE_EVIDENCE: 'NEEDS_SOURCE_EVIDENCE',
  NEEDS_SOURCE_OWNER: 'NEEDS_SOURCE_OWNER',
  NEEDS_SOURCE_FRESHNESS: 'NEEDS_SOURCE_FRESHNESS',
  STALE_SOURCE_FRESHNESS: 'STALE_SOURCE_FRESHNESS',
  NEEDS_IDEMPOTENCY_KEY: 'NEEDS_IDEMPOTENCY_KEY',
  NEEDS_AUDIT_TRAIL: 'NEEDS_AUDIT_TRAIL',
  UNSUPPORTED_VIEWER_ROLE: 'UNSUPPORTED_VIEWER_ROLE',
  UNSUPPORTED_CARD_TYPE: 'UNSUPPORTED_CARD_TYPE',
  EXPIRED_UI_RENDERING_WINDOW: 'EXPIRED_UI_RENDERING_WINDOW',
  BLOCKED: 'BLOCKED',
  UNKNOWN: 'UNKNOWN',
  NOT_MODELED: 'NOT_MODELED',
});

const UI_RENDERING_DECISIONS = Object.freeze({
  REQUEST_UI_RENDERING_REVIEW: 'REQUEST_UI_RENDERING_REVIEW',
  APPROVE_READ_ONLY_RENDER_MODEL_CANDIDATE: 'APPROVE_READ_ONLY_RENDER_MODEL_CANDIDATE',
  BLOCK_UI_RENDERING: 'BLOCK_UI_RENDERING',
  NEEDS_MORE_CONTEXT: 'NEEDS_MORE_CONTEXT',
  EXPIRED: 'EXPIRED',
  NOT_MODELED: 'NOT_MODELED',
});

const UI_RENDERING_ALLOWED_USES = Object.freeze([
  'UI_RENDERING_REVIEW',
  'READ_ONLY_RENDER_MODEL_PREP',
  'FORGE_ALIVE_CARD_PREP',
  'ADVISOR_STATUS_CARD_PREP',
  'MANAGER_REVIEW_CARD_PREP',
  'WARNING_LIMITATION_DISPLAY_PREP',
  'SOURCE_TRACE_DISPLAY_PREP',
]);

const UI_RENDERING_FORBIDDEN_USES = Object.freeze([
  'UI_RENDERING',
  'DASHBOARD_CREATION',
  'ROUTE_CREATION',
  'COMPONENT_EXECUTION',
  'INTERACTIVE_ACTION',
  'PERSISTENCE_WRITE',
  'CANONICAL_TRUTH_WRITE',
  'BUSINESS_TRUTH_CREATION',
  'METRIC_TRUTH_CREATION',
  'ECONOMIC_TRUTH_CREATION',
  'DELIVERY_TRUTH_CREATION',
  'MESSAGE_TRUTH_CREATION',
  'COMPENSATION_TRUTH',
  'PAYOUT_TRUTH',
  'REVENUE_TRUTH',
  'HUMAN_RANKING',
  'HR_DECISION',
  'PROMOTION_DECISION',
  'TERMINATION',
  'ADVISOR_LIFECYCLE_TRUTH',
  'PERSONALITY_TRUTH',
  'TASK_CREATION',
  'CALENDAR_CREATION',
  'CRM_MUTATION',
  'PROVIDER_API_CALL',
  'EXTERNAL_API_CALL',
  'SEND_MESSAGE',
  'ACTION_EXECUTION',
  'MANIPULATION',
  'SURVEILLANCE',
]);

const SUPPORTED_VIEWER_ROLES = Object.freeze(['ADVISOR', 'MANAGER', 'PARTNER', 'DIRECTOR']);
const SUPPORTED_CARD_TYPES = Object.freeze([
  'FORGE_ALIVE_CARD',
  'ADVISOR_STATUS_CARD',
  'MANAGER_REVIEW_CARD',
  'WARNING_LIMITATION_CARD',
  'SOURCE_TRACE_CARD',
  'NEXT_REVIEW_ACTION_CARD',
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

function hasExplicitValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
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

function hasCanonicalTruthRegistrySnapshot(snapshot) {
  return Boolean(snapshot && typeof snapshot === 'object' && snapshot.eligibleForCanonicalTruthEntryPreparation === true);
}

function hasPolicy(snapshot, forbiddenTrueFlags) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.reviewed !== true && snapshot.policyReviewed !== true) return false;
  if (snapshot.allowed === false) return false;
  return !forbiddenTrueFlags.some((flag) => snapshot[flag] === true);
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
    uiRenderingBoundaryStatus: UI_RENDERING_STATUSES.UNKNOWN,
    decision: UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT,

    uiRenderingRequestId: input.uiRenderingRequestId || null,
    canonicalTruthRegistryRequestId: input.canonicalTruthRegistryRequestId || input.canonicalTruthRegistrySnapshot?.canonicalTruthRegistryRequestId || null,
    truthPromotionRequestId: input.truthPromotionRequestId || input.canonicalTruthRegistrySnapshot?.truthPromotionRequestId || null,
    auditPersistenceRequestId: input.auditPersistenceRequestId || input.canonicalTruthRegistrySnapshot?.auditPersistenceRequestId || null,
    uiReadModelRequestId: input.uiReadModelRequestId || input.canonicalTruthRegistrySnapshot?.uiReadModelRequestId || null,
    advisorId: input.advisorId || null,
    managerId: input.managerId || null,
    personId: input.personId || null,
    personType: input.personType || null,
    viewerId: input.viewerId || null,
    viewerRole: input.viewerRole || null,

    forgeAliveRenderModelCandidate: null,
    readOnlyActionCardCandidate: null,
    visibleStatus: hasExplicitValue(input.visibleStatus) ? input.visibleStatus : null,
    visibleSeverity: input.visibleSeverity || null,
    visibleReasonWhy: input.visibleReasonWhy || null,
    visibleNextReviewAction: input.visibleNextReviewAction || null,
    visibleWarnings: unique([...(asArray(input.visibleWarnings)), ...(asArray(input.warnings)), ...(asArray(input.canonicalTruthRegistrySnapshot?.warnings))]),
    visibleLimitations: unique([...(asArray(input.visibleLimitations)), ...(asArray(input.limitations)), ...(asArray(input.canonicalTruthRegistrySnapshot?.limitations))]),

    eligibleForReadOnlyRenderModel: false,
    approvedForUiRendering: false,
    rendersUi: false,
    createsDashboard: false,
    createsRoute: false,
    executesComponent: false,
    componentExecutionAllowed: false,
    interactiveActionAllowed: false,
    persistsUiState: false,
    writesCanonicalTruth: false,
    createsBusinessTruth: false,
    createsMetricTruth: false,
    createsEconomicTruth: false,
    createsDeliveryTruth: false,
    createsMessageTruth: false,
    createsCompensationTruth: false,
    createsPayoutTruth: false,
    createsRevenueTruth: false,
    createsRankingTruth: false,
    createsPunishmentTruth: false,
    createsHrTruth: false,
    createsPromotionTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsPersonalityTruth: false,
    createsTask: false,
    createsCalendarEvent: false,
    mutatesCrm: false,
    providerApiCallAllowed: false,
    externalApiCallAllowed: false,
    executesAction: false,
    sendsMessage: false,
    metricEconomicTruthRemainsSeparate: true,

    blockedUses: [],
    allowedUses: [],
    missingSignals: [],
    unknownSignals: [],
    warnings: unique([...(asArray(input.warnings)), ...(asArray(input.canonicalTruthRegistrySnapshot?.warnings))]),
    limitations: unique([...(asArray(input.limitations)), ...(asArray(input.canonicalTruthRegistrySnapshot?.limitations))]),

    evidenceRefs: evidenceBundle.evidenceRefs,
    sourceEvidenceIds: evidenceBundle.sourceEvidenceIds,
    sourceOwners: evidenceBundle.sourceOwners,
  };
}

function markBlocked(output, status, decision, signal, blockedUse) {
  output.uiRenderingBoundaryStatus = status;
  output.decision = decision;
  if (signal) output.missingSignals = unique([...output.missingSignals, signal]);
  if (blockedUse) output.blockedUses = unique([...output.blockedUses, blockedUse]);
  return output;
}

function buildUiRenderingBoundary(input = {}) {
  const original = clone(input) || {};
  const evidenceBundle = collectEvidence(original.sourceEvidence);
  const output = baseOutput(original, evidenceBundle);

  const requestedUse = normalizeUse(original.requestedUse);
  if (requestedUse && UI_RENDERING_FORBIDDEN_USES.includes(requestedUse)) {
    return markBlocked(output, UI_RENDERING_STATUSES.BLOCKED, UI_RENDERING_DECISIONS.BLOCK_UI_RENDERING, null, requestedUse);
  }

  if (requestedUse && !UI_RENDERING_ALLOWED_USES.includes(requestedUse)) {
    output.blockedUses = unique([requestedUse]);
    output.uiRenderingBoundaryStatus = UI_RENDERING_STATUSES.NOT_MODELED;
    output.decision = UI_RENDERING_DECISIONS.NOT_MODELED;
    return output;
  }

  if (requestedUse) output.allowedUses = unique([requestedUse]);

  const registrySnapshot = original.canonicalTruthRegistrySnapshot;
  if (!hasCanonicalTruthRegistrySnapshot(registrySnapshot)) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_CANONICAL_TRUTH_REGISTRY, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'canonicalTruthRegistrySnapshot');
  }

  const canonicalTruthEntryCandidate = original.canonicalTruthEntryCandidate || registrySnapshot.canonicalTruthEntryCandidate;
  if (!canonicalTruthEntryCandidate || typeof canonicalTruthEntryCandidate !== 'object') {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_CANONICAL_TRUTH_ENTRY_CANDIDATE, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'canonicalTruthEntryCandidate');
  }

  const uiPresentationModelCandidate = original.uiPresentationModelCandidate || registrySnapshot.uiPresentationModelCandidate;
  if (!uiPresentationModelCandidate || typeof uiPresentationModelCandidate !== 'object') {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_UI_PRESENTATION_MODEL, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'uiPresentationModelCandidate');
  }

  if (!hasPolicy(original.displayPolicySnapshot, ['approvedForUiRendering', 'rendersUi', 'createsDashboard', 'createsRoute'])) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_DISPLAY_POLICY, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'displayPolicySnapshot');
  }

  if (!hasPolicy(original.safetyPolicySnapshot, ['interactiveActionAllowed', 'executesAction', 'sendsMessage', 'manipulationAllowed'])) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_SAFETY_POLICY, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'safetyPolicySnapshot');
  }

  if (!hasPolicy(original.privacyPolicySnapshot, ['surveillanceAllowed', 'exposesRestrictedData', 'personalityTruthAllowed'])) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_PRIVACY_POLICY, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'privacyPolicySnapshot');
  }

  if (!hasPolicy(original.interactionPolicySnapshot, ['interactiveActionAllowed', 'componentExecutionAllowed', 'routeCreationAllowed', 'crmMutationAllowed'])) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_INTERACTION_POLICY, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'interactionPolicySnapshot');
  }

  const viewerRole = normalizeString(original.viewerRole);
  if (!viewerRole) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_VIEWER_ROLE, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'viewerRole');
  }

  if (!SUPPORTED_VIEWER_ROLES.includes(viewerRole)) {
    output.viewerRole = viewerRole;
    output.uiRenderingBoundaryStatus = UI_RENDERING_STATUSES.UNSUPPORTED_VIEWER_ROLE;
    output.decision = UI_RENDERING_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_VIEWER_ROLE']);
    return output;
  }

  if (asArray(original.sourceEvidence).length === 0) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_SOURCE_EVIDENCE, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceEvidence');
  }

  if (evidenceBundle.sourceOwners.length === 0) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_SOURCE_OWNER, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceOwner');
  }

  if (isStale(original.sourceFreshness)) {
    return markBlocked(output, UI_RENDERING_STATUSES.STALE_SOURCE_FRESHNESS, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceFreshness');
  }

  if (!hasFreshness(original.sourceFreshness)) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_SOURCE_FRESHNESS, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceFreshness');
  }

  const idempotencyKey = original.idempotencyKey || canonicalTruthEntryCandidate.idempotencyKey;
  if (!idempotencyKey) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_IDEMPOTENCY_KEY, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'idempotencyKey');
  }

  if (!hasAuditTrail(original.auditTrail)) {
    return markBlocked(output, UI_RENDERING_STATUSES.NEEDS_AUDIT_TRAIL, UI_RENDERING_DECISIONS.NEEDS_MORE_CONTEXT, 'auditTrail');
  }

  const cardType = normalizeString(original.cardType || original.forgeAliveCardCandidate?.cardType || 'FORGE_ALIVE_CARD');
  if (!SUPPORTED_CARD_TYPES.includes(cardType)) {
    output.uiRenderingBoundaryStatus = UI_RENDERING_STATUSES.UNSUPPORTED_CARD_TYPE;
    output.decision = UI_RENDERING_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_CARD_TYPE']);
    return output;
  }

  if (isExpired(original.expiresAt || original.uiRenderingWindowExpiresAt, original.now)) {
    output.uiRenderingBoundaryStatus = UI_RENDERING_STATUSES.EXPIRED_UI_RENDERING_WINDOW;
    output.decision = UI_RENDERING_DECISIONS.EXPIRED;
    output.blockedUses = unique([...output.blockedUses, 'EXPIRED_UI_RENDERING_WINDOW']);
    return output;
  }

  const immutableSourceTrace = original.immutableSourceTrace || canonicalTruthEntryCandidate.immutableSourceTrace || {
    evidenceRefs: evidenceBundle.evidenceRefs,
    sourceEvidenceIds: evidenceBundle.sourceEvidenceIds,
    sourceOwners: evidenceBundle.sourceOwners,
    sourceFreshness: clone(original.sourceFreshness),
    auditTrail: clone(original.auditTrail),
  };

  output.viewerRole = viewerRole;
  output.visibleStatus = hasExplicitValue(original.visibleStatus) ? original.visibleStatus : canonicalTruthEntryCandidate.candidateFactValue || null;
  output.visibleSeverity = original.visibleSeverity || 'INFO';
  output.visibleReasonWhy = original.visibleReasonWhy || 'Forge can show this as read-only review context.';
  output.visibleNextReviewAction = original.visibleNextReviewAction || 'Review evidence and limitations before taking action.';

  output.forgeAliveRenderModelCandidate = {
    cardType,
    readOnly: true,
    viewerRole,
    visibleStatus: output.visibleStatus,
    visibleSeverity: output.visibleSeverity,
    visibleReasonWhy: output.visibleReasonWhy,
    visibleNextReviewAction: output.visibleNextReviewAction,
    visibleWarnings: output.visibleWarnings,
    visibleLimitations: output.visibleLimitations,
    canonicalTruthEntryCandidate,
    uiPresentationModelCandidate,
    immutableSourceTrace,
    sourceEvidenceIds: evidenceBundle.sourceEvidenceIds,
    sourceOwners: evidenceBundle.sourceOwners,
    approvedForUiRendering: false,
    rendersUi: false,
    createsDashboard: false,
    createsRoute: false,
    executesComponent: false,
    interactiveActionAllowed: false,
    persistsUiState: false,
    writesCanonicalTruth: false,
    createsBusinessTruth: false,
    createsMetricTruth: false,
    createsEconomicTruth: false,
    executesAction: false,
    sendsMessage: false,
  };

  output.readOnlyActionCardCandidate = {
    cardType: 'NEXT_REVIEW_ACTION_CARD',
    readOnly: true,
    label: output.visibleNextReviewAction,
    interactiveActionAllowed: false,
    executesAction: false,
    sendsMessage: false,
    createsTask: false,
    createsCalendarEvent: false,
    mutatesCrm: false,
  };

  output.eligibleForReadOnlyRenderModel = true;
  output.approvedForUiRendering = false;
  output.rendersUi = false;
  output.createsDashboard = false;
  output.createsRoute = false;
  output.executesComponent = false;
  output.componentExecutionAllowed = false;
  output.interactiveActionAllowed = false;
  output.persistsUiState = false;
  output.writesCanonicalTruth = false;
  output.createsBusinessTruth = false;
  output.createsMetricTruth = false;
  output.createsEconomicTruth = false;
  output.createsDeliveryTruth = false;
  output.createsMessageTruth = false;
  output.createsCompensationTruth = false;
  output.createsPayoutTruth = false;
  output.createsRevenueTruth = false;
  output.createsRankingTruth = false;
  output.createsPunishmentTruth = false;
  output.createsHrTruth = false;
  output.createsPromotionTruth = false;
  output.createsAdvisorLifecycleTruth = false;
  output.createsPersonalityTruth = false;
  output.createsTask = false;
  output.createsCalendarEvent = false;
  output.mutatesCrm = false;
  output.providerApiCallAllowed = false;
  output.externalApiCallAllowed = false;
  output.executesAction = false;
  output.sendsMessage = false;
  output.metricEconomicTruthRemainsSeparate = true;

  output.uiRenderingBoundaryStatus = UI_RENDERING_STATUSES.APPROVED_FOR_READ_ONLY_RENDER_MODEL_CANDIDATE;
  output.decision = UI_RENDERING_DECISIONS.APPROVE_READ_ONLY_RENDER_MODEL_CANDIDATE;

  return output;
}

module.exports = {
  buildUiRenderingBoundary,
  UI_RENDERING_STATUSES,
  UI_RENDERING_DECISIONS,
  UI_RENDERING_ALLOWED_USES,
  UI_RENDERING_FORBIDDEN_USES,
};
