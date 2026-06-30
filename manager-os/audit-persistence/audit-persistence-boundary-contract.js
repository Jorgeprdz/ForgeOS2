/**
 * Audit / Persistence Boundary Contract
 *
 * Audit event candidate is not persistence.
 * Audit persistence candidate is not business truth.
 * Pure boundary: prepares audit persistence candidates only.
 * Never writes files/databases, never mutates CRM, never creates truth, never executes actions.
 */

const AUDIT_PERSISTENCE_STATUSES = Object.freeze({
  READY_FOR_AUDIT_PERSISTENCE_REVIEW: 'READY_FOR_AUDIT_PERSISTENCE_REVIEW',
  APPROVED_FOR_PERSISTENCE_CANDIDATE_PREPARATION: 'APPROVED_FOR_PERSISTENCE_CANDIDATE_PREPARATION',
  NEEDS_UI_READ_MODEL: 'NEEDS_UI_READ_MODEL',
  NEEDS_PRESENTATION_MODEL_CANDIDATE: 'NEEDS_PRESENTATION_MODEL_CANDIDATE',
  NEEDS_AUDIT_EVENT_CANDIDATE: 'NEEDS_AUDIT_EVENT_CANDIDATE',
  NEEDS_PERSISTENCE_RECORD_CANDIDATE: 'NEEDS_PERSISTENCE_RECORD_CANDIDATE',
  NEEDS_RETENTION_POLICY: 'NEEDS_RETENTION_POLICY',
  NEEDS_PERSISTENCE_POLICY: 'NEEDS_PERSISTENCE_POLICY',
  NEEDS_IMMUTABILITY_POLICY: 'NEEDS_IMMUTABILITY_POLICY',
  NEEDS_PRIVACY_POLICY: 'NEEDS_PRIVACY_POLICY',
  NEEDS_IDEMPOTENCY_KEY: 'NEEDS_IDEMPOTENCY_KEY',
  NEEDS_SOURCE_EVIDENCE: 'NEEDS_SOURCE_EVIDENCE',
  NEEDS_SOURCE_OWNER: 'NEEDS_SOURCE_OWNER',
  NEEDS_SOURCE_FRESHNESS: 'NEEDS_SOURCE_FRESHNESS',
  STALE_SOURCE_FRESHNESS: 'STALE_SOURCE_FRESHNESS',
  NEEDS_AUDIT_TRAIL: 'NEEDS_AUDIT_TRAIL',
  UNSUPPORTED_ACTOR_ROLE: 'UNSUPPORTED_ACTOR_ROLE',
  UNSUPPORTED_RECORD_TYPE: 'UNSUPPORTED_RECORD_TYPE',
  EXPIRED_PERSISTENCE_WINDOW: 'EXPIRED_PERSISTENCE_WINDOW',
  BLOCKED: 'BLOCKED',
  UNKNOWN: 'UNKNOWN',
  NOT_MODELED: 'NOT_MODELED',
});

const AUDIT_PERSISTENCE_DECISIONS = Object.freeze({
  REQUEST_AUDIT_PERSISTENCE_REVIEW: 'REQUEST_AUDIT_PERSISTENCE_REVIEW',
  APPROVE_PERSISTENCE_CANDIDATE_PREPARATION: 'APPROVE_PERSISTENCE_CANDIDATE_PREPARATION',
  BLOCK_AUDIT_PERSISTENCE: 'BLOCK_AUDIT_PERSISTENCE',
  NEEDS_MORE_CONTEXT: 'NEEDS_MORE_CONTEXT',
  EXPIRED: 'EXPIRED',
  NOT_MODELED: 'NOT_MODELED',
});

const AUDIT_PERSISTENCE_ALLOWED_USES = Object.freeze([
  'AUDIT_PERSISTENCE_REVIEW',
  'PERSISTENCE_CANDIDATE_PREP',
  'AUDIT_RECORD_PREP',
  'READ_MODEL_AUDIT_PREP',
  'COMPLIANCE_REVIEW_PREP',
  'EVIDENCE_CHAIN_PREP',
]);

const AUDIT_PERSISTENCE_FORBIDDEN_USES = Object.freeze([
  'PERSISTENCE_WRITE',
  'FILE_WRITE',
  'DATABASE_WRITE',
  'CRM_MUTATION',
  'BUSINESS_TRUTH_CREATION',
  'DELIVERY_TRUTH_CREATION',
  'MESSAGE_TRUTH_CREATION',
  'TASK_CREATION',
  'CALENDAR_CREATION',
  'UI_RENDERING',
  'DASHBOARD_CREATION',
  'SEND_MESSAGE',
  'ACTION_EXECUTION',
  'PROVIDER_API_CALL',
  'EXTERNAL_API_CALL',
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

const SUPPORTED_ACTOR_ROLES = Object.freeze(['ADVISOR', 'MANAGER', 'PARTNER', 'DIRECTOR', 'SYSTEM_REVIEW']);
const SUPPORTED_RECORD_TYPES = Object.freeze([
  'UI_READ_MODEL_AUDIT',
  'PROVIDER_EVENT_AUDIT',
  'EXTERNAL_DISPATCH_AUDIT',
  'BOUNDARY_REVIEW_AUDIT',
  'EVIDENCE_CHAIN_AUDIT',
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

function hasUiReadModelSnapshot(snapshot) {
  return Boolean(snapshot && typeof snapshot === 'object' && snapshot.approvedForReadOnlyPresentationModel === true);
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
    auditPersistenceStatus: AUDIT_PERSISTENCE_STATUSES.UNKNOWN,
    decision: AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT,

    auditPersistenceRequestId: input.auditPersistenceRequestId || null,
    uiReadModelRequestId: input.uiReadModelRequestId || input.uiReadModelSnapshot?.uiReadModelRequestId || null,
    providerWebhookBoundaryRequestId: input.providerWebhookBoundaryRequestId || input.uiReadModelSnapshot?.providerWebhookBoundaryRequestId || null,
    externalDispatchRequestId: input.externalDispatchRequestId || input.uiReadModelSnapshot?.externalDispatchRequestId || null,
    advisorId: input.advisorId || null,
    managerId: input.managerId || null,
    personId: input.personId || null,
    personType: input.personType || null,
    actorId: input.actorId || null,
    actorRole: input.actorRole || null,

    auditPersistenceRecordCandidate: null,
    persistenceWriteCandidate: null,
    approvedForPersistenceCandidatePreparation: false,
    approvedForPersistenceWrite: false,
    persistsRecord: false,
    writesFile: false,
    writesDatabase: false,
    mutatesCrm: false,
    createsBusinessTruth: false,
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
    rendersUi: false,
    executesAction: false,
    sendsMessage: false,
    providerApiCallAllowed: false,
    externalApiCallAllowed: false,

    blockedUses: [],
    allowedUses: [],
    missingSignals: [],
    unknownSignals: [],
    warnings: unique([...(asArray(input.warnings)), ...(asArray(input.uiReadModelSnapshot?.warnings))]),
    limitations: unique([...(asArray(input.limitations)), ...(asArray(input.uiReadModelSnapshot?.limitations))]),

    evidenceRefs: evidenceBundle.evidenceRefs,
    sourceEvidenceIds: evidenceBundle.sourceEvidenceIds,
    sourceOwners: evidenceBundle.sourceOwners,
  };
}

function markBlocked(output, status, decision, signal, blockedUse) {
  output.auditPersistenceStatus = status;
  output.decision = decision;
  if (signal) output.missingSignals = unique([...output.missingSignals, signal]);
  if (blockedUse) output.blockedUses = unique([...output.blockedUses, blockedUse]);
  return output;
}

function buildAuditPersistenceBoundary(input = {}) {
  const original = clone(input) || {};
  const evidenceBundle = collectEvidence(original.sourceEvidence);
  const output = baseOutput(original, evidenceBundle);

  const requestedUse = normalizeUse(original.requestedUse);
  if (requestedUse && AUDIT_PERSISTENCE_FORBIDDEN_USES.includes(requestedUse)) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.BLOCKED, AUDIT_PERSISTENCE_DECISIONS.BLOCK_AUDIT_PERSISTENCE, null, requestedUse);
  }

  if (requestedUse && !AUDIT_PERSISTENCE_ALLOWED_USES.includes(requestedUse)) {
    output.blockedUses = unique([requestedUse]);
    output.auditPersistenceStatus = AUDIT_PERSISTENCE_STATUSES.NOT_MODELED;
    output.decision = AUDIT_PERSISTENCE_DECISIONS.NOT_MODELED;
    return output;
  }

  if (requestedUse) output.allowedUses = unique([requestedUse]);

  const uiSnapshot = original.uiReadModelSnapshot;
  if (!hasUiReadModelSnapshot(uiSnapshot)) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_UI_READ_MODEL, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'uiReadModelSnapshot');
  }

  const presentationModel = original.uiPresentationModelCandidate || uiSnapshot.uiPresentationModelCandidate;
  if (!presentationModel || typeof presentationModel !== 'object') {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_PRESENTATION_MODEL_CANDIDATE, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'uiPresentationModelCandidate');
  }

  if (!original.auditEventCandidate || typeof original.auditEventCandidate !== 'object') {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_AUDIT_EVENT_CANDIDATE, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'auditEventCandidate');
  }

  const recordCandidate = original.persistenceRecordCandidate;
  if (!recordCandidate || typeof recordCandidate !== 'object') {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_PERSISTENCE_RECORD_CANDIDATE, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'persistenceRecordCandidate');
  }

  if (!hasPolicy(original.retentionPolicySnapshot, ['persistsRecord', 'writesFile', 'writesDatabase'])) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_RETENTION_POLICY, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'retentionPolicySnapshot');
  }

  if (!hasPolicy(original.persistencePolicySnapshot, ['approvedForPersistenceWrite', 'persistsRecord', 'writesFile', 'writesDatabase', 'createsBusinessTruth'])) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_PERSISTENCE_POLICY, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'persistencePolicySnapshot');
  }

  if (!hasPolicy(original.immutabilityPolicySnapshot, ['mutableRecordAllowed', 'crmMutationAllowed'])) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_IMMUTABILITY_POLICY, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'immutabilityPolicySnapshot');
  }

  if (!hasPolicy(original.privacyPolicySnapshot, ['exposesRestrictedData', 'surveillanceAllowed'])) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_PRIVACY_POLICY, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'privacyPolicySnapshot');
  }

  const actorRole = normalizeString(original.actorRole);
  if (actorRole && !SUPPORTED_ACTOR_ROLES.includes(actorRole)) {
    output.actorRole = actorRole;
    output.auditPersistenceStatus = AUDIT_PERSISTENCE_STATUSES.UNSUPPORTED_ACTOR_ROLE;
    output.decision = AUDIT_PERSISTENCE_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_ACTOR_ROLE']);
    return output;
  }

  const recordType = normalizeString(original.recordType || recordCandidate.recordType);
  if (recordType && !SUPPORTED_RECORD_TYPES.includes(recordType)) {
    output.auditPersistenceStatus = AUDIT_PERSISTENCE_STATUSES.UNSUPPORTED_RECORD_TYPE;
    output.decision = AUDIT_PERSISTENCE_DECISIONS.NOT_MODELED;
    output.blockedUses = unique([...output.blockedUses, 'UNSUPPORTED_RECORD_TYPE']);
    return output;
  }

  const idempotencyKey = original.idempotencyKey || recordCandidate.idempotencyKey;
  if (!idempotencyKey) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_IDEMPOTENCY_KEY, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'idempotencyKey');
  }

  if (asArray(original.sourceEvidence).length === 0) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_SOURCE_EVIDENCE, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceEvidence');
  }

  if (evidenceBundle.sourceOwners.length === 0) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_SOURCE_OWNER, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceOwner');
  }

  if (isStale(original.sourceFreshness)) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.STALE_SOURCE_FRESHNESS, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceFreshness');
  }

  if (!hasFreshness(original.sourceFreshness)) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_SOURCE_FRESHNESS, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceFreshness');
  }

  if (!hasAuditTrail(original.auditTrail)) {
    return markBlocked(output, AUDIT_PERSISTENCE_STATUSES.NEEDS_AUDIT_TRAIL, AUDIT_PERSISTENCE_DECISIONS.NEEDS_MORE_CONTEXT, 'auditTrail');
  }

  if (isExpired(original.expiresAt || original.persistenceWindowExpiresAt, original.now)) {
    output.auditPersistenceStatus = AUDIT_PERSISTENCE_STATUSES.EXPIRED_PERSISTENCE_WINDOW;
    output.decision = AUDIT_PERSISTENCE_DECISIONS.EXPIRED;
    output.blockedUses = unique([...output.blockedUses, 'EXPIRED_PERSISTENCE_WINDOW']);
    return output;
  }

  output.actorRole = actorRole || null;
  output.auditPersistenceRecordCandidate = {
    recordType: recordType || null,
    idempotencyKey,
    actorId: original.actorId || null,
    actorRole: actorRole || null,
    uiPresentationModelCandidate: presentationModel,
    auditEventCandidate: original.auditEventCandidate,
    persistenceRecordCandidate: recordCandidate,
    evidenceRefs: output.evidenceRefs,
    sourceEvidenceIds: output.sourceEvidenceIds,
    sourceOwners: output.sourceOwners,
    warnings: output.warnings,
    limitations: output.limitations,
    retentionPolicySnapshotOnly: true,
    immutabilityPolicySnapshotOnly: true,
    privacyPolicySnapshotOnly: true,
    approvedForPersistenceWrite: false,
    persistsRecord: false,
    writesFile: false,
    writesDatabase: false,
    createsBusinessTruth: false,
  };

  output.persistenceWriteCandidate = null;
  output.approvedForPersistenceCandidatePreparation = true;
  output.approvedForPersistenceWrite = false;
  output.persistsRecord = false;
  output.writesFile = false;
  output.writesDatabase = false;
  output.mutatesCrm = false;
  output.createsBusinessTruth = false;
  output.createsDeliveryTruth = false;
  output.createsMessageTruth = false;
  output.rendersUi = false;
  output.executesAction = false;
  output.sendsMessage = false;
  output.providerApiCallAllowed = false;
  output.externalApiCallAllowed = false;

  output.auditPersistenceStatus = AUDIT_PERSISTENCE_STATUSES.APPROVED_FOR_PERSISTENCE_CANDIDATE_PREPARATION;
  output.decision = AUDIT_PERSISTENCE_DECISIONS.APPROVE_PERSISTENCE_CANDIDATE_PREPARATION;

  return output;
}

module.exports = {
  buildAuditPersistenceBoundary,
  AUDIT_PERSISTENCE_STATUSES,
  AUDIT_PERSISTENCE_DECISIONS,
  AUDIT_PERSISTENCE_ALLOWED_USES,
  AUDIT_PERSISTENCE_FORBIDDEN_USES,
};
