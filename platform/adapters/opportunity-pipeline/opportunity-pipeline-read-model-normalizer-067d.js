"use strict";

const NORMALIZER_ID = "forge.opportunity_pipeline.read_model.normalizer.v1";
const SCHEMA_VERSION = "forge.backend.read_model.v1";
const DOMAIN_ID = "opportunity_pipeline";
const SAFE_ERROR_CODE = "OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED";

const SAFETY_FLAGS = Object.freeze({
  crmWrite: false,
  pipelineWrite: false,
  taskCreate: false,
  calendarCreate: false,
  messageSend: false,
  authReal: false,
  providerRuntime: false,
  secretAccess: false,
  browserPersistence: false,
  realEngineExecution: false,
  realEffectsAllowed: false,
  realEffectsEnabled: false,
  backendConnection: false
});

const BLOCKED_EFFECTS = Object.freeze([
  "canonical_opportunity_creation",
  "opportunity_create",
  "opportunity_update",
  "opportunity_delete",
  "opportunity_merge",
  "opportunity_stage_mutation",
  "crm_write",
  "pipeline_write",
  "task_create",
  "calendar_create",
  "message_send",
  "quote_create",
  "policy_update",
  "provider_call",
  "auth_runtime",
  "secret_access",
  "browser_persistence",
  "real_engine_execution"
]);

const PREVIEW_SIGNALS = Object.freeze([
  Object.freeze({
    signal_id: "rel_signal_lariza_gmm_review_067d",
    source_module: "relationship-opportunity-engine.js",
    source_signal_type: "REVIEW_OPPORTUNITY",
    client_ref: Object.freeze({ entity_type: "client", entity_id: "client_preview_lariza", display_name: "Lariza" }),
    opportunity_candidate_ref: Object.freeze({ candidate_id: "opp_candidate_preview_lariza_gmm_review" }),
    confidence_preview: "medium",
    priority_hint: "high",
    next_action_hint: "review_pending_quote_context",
    risk_flags: Object.freeze(["followup_cooling", "quote_context_needed"]),
    source_evidence_ids: Object.freeze(["relationship_opportunity_signal_preview_lariza_067d"]),
    freshness_metadata: Object.freeze({ status: "preview_static", source_label: "067D local static signal fixture" }),
    audit_event: "normalization_candidate_prepared",
    blocked_effects: Object.freeze(BLOCKED_EFFECTS),
    safety_flags: Object.freeze(SAFETY_FLAGS)
  }),
  Object.freeze({
    signal_id: "rel_signal_juan_follow_067d",
    source_module: "relationship-opportunity-engine.js",
    source_signal_type: "FOLLOW_UP_OPPORTUNITY",
    client_ref: Object.freeze({ entity_type: "client", entity_id: "client_preview_juan", display_name: "Juan" }),
    opportunity_candidate_ref: Object.freeze({ candidate_id: "opp_candidate_preview_juan_follow" }),
    confidence_preview: "low",
    priority_hint: "normal",
    next_action_hint: "follow_up_preview",
    risk_flags: Object.freeze(["stale_followup"]),
    source_evidence_ids: Object.freeze(["relationship_opportunity_signal_preview_juan_067d"]),
    freshness_metadata: Object.freeze({ status: "preview_static", source_label: "067D local static signal fixture" }),
    audit_event: "normalization_candidate_prepared",
    blocked_effects: Object.freeze(BLOCKED_EFFECTS),
    safety_flags: Object.freeze(SAFETY_FLAGS)
  })
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso(context) {
  return context && context.generatedAt ? context.generatedAt : "2026-07-07T00:00:00-06:00";
}

function toSignals(input) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.signals)) return input.signals;
  if (input && input.signal_id) return [input];
  return [];
}

function sanitizeId(value) {
  return String(value || "unmodeled")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "unmodeled";
}

function allSafetyFlagsFalse(flags = {}) {
  return Object.keys(SAFETY_FLAGS).every((key) => flags[key] === false || flags[key] === undefined);
}

function hasEvidenceAndFreshness(signal) {
  return Array.isArray(signal.source_evidence_ids) &&
    signal.source_evidence_ids.length > 0 &&
    signal.freshness_metadata &&
    typeof signal.freshness_metadata === "object";
}

function hasRequiredSignalShape(signal) {
  return Boolean(
    signal &&
    signal.signal_id &&
    signal.source_module &&
    signal.source_signal_type &&
    signal.client_ref &&
    signal.opportunity_candidate_ref
  );
}

function makeAuditEvent(generatedAt, candidateCount) {
  return {
    auditEventId: "audit_067d_opportunity_pipeline_read_model_normalization",
    eventType: "normalization_candidate_prepared",
    domainId: DOMAIN_ID,
    normalizerId: NORMALIZER_ID,
    candidateCount,
    canonicalTruthClaimed: false,
    realEffectsAllowed: false,
    providerRuntime: false,
    createdAt: generatedAt
  };
}

function makeEmptyEnvelope({ generatedAt, errors = [] }) {
  const auditEvent = makeAuditEvent(generatedAt, 0);
  return {
    readModelId: "forge.opportunity_pipeline.read_model.normalized_candidates.067d",
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    normalizerId: NORMALIZER_ID,
    normalizerMode: "read_only",
    routeClass: "read_only",
    sourceOfTruth: "candidate_only_local_static_normalization",
    canonicalTruthClaimed: false,
    temporaryShimPreserved: true,
    generatedAt,
    freshness: { status: "preview_static" },
    candidates: [],
    entities: [],
    metrics: { candidatesReturned: 0 },
    emptyState: {
      reason: "not_modeled",
      message: "Opportunity Pipeline normalization is not modeled for the provided preview signal input."
    },
    errors: errors.length ? errors : [{
      code: SAFE_ERROR_CODE,
      safeMessage: "Opportunity Pipeline normalization is candidate-only and not modeled for this input.",
      recoverable: true
    }],
    blockedEffects: clone(BLOCKED_EFFECTS),
    safety: clone(SAFETY_FLAGS),
    audit: { auditEventId: auditEvent.auditEventId, eventType: auditEvent.eventType },
    auditEvent
  };
}

function normalizePriority(value) {
  const normalized = String(value || "").toLowerCase();
  if (["critical", "high", "normal", "medium", "low"].includes(normalized)) return normalized;
  return "normal";
}

function normalizeAuditEvent(value) {
  return value === "read_model_used" || value === "normalization_candidate_prepared"
    ? value
    : "normalization_candidate_prepared";
}

function mapSignalToCandidate(signal) {
  const candidateId = signal.opportunity_candidate_ref.candidate_id ||
    signal.opportunity_candidate_ref.entity_id ||
    `opp_candidate_preview_${sanitizeId(signal.signal_id)}`;
  const clientName = signal.client_ref.display_name || signal.client_ref.displayName || "Cliente";
  const sourceEvidenceIds = clone(signal.source_evidence_ids);
  const freshnessMetadata = clone(signal.freshness_metadata);

  return {
    opportunity_id: `candidate_preview_${sanitizeId(candidateId)}`,
    client_ref: clone(signal.client_ref),
    display_name: `${clientName} - candidate opportunity preview`,
    stage: "candidate_review",
    status: "candidate_preview",
    priority: normalizePriority(signal.priority_hint),
    probability: { mode: "preview_hint", value: signal.confidence_preview || "unknown" },
    expected_value_preview: { mode: "not_modeled", amount: null, currency: null },
    next_action: signal.next_action_hint || "review_candidate_context",
    followup_due_state: "preview_only",
    risk_flags: clone(signal.risk_flags || []),
    policy_summary_refs: [],
    quote_summary_refs: [],
    source_evidence_ids: sourceEvidenceIds,
    freshness_metadata: freshnessMetadata,
    audit_event: normalizeAuditEvent(signal.audit_event),
    blocked_effects: Array.from(new Set([...(signal.blocked_effects || []), ...BLOCKED_EFFECTS])),
    safety_flags: clone(SAFETY_FLAGS),
    canonicalTruthClaimed: false,
    candidateOnly: true,
    relationshipSignalsCreateRealOpportunities: false
  };
}

function normalizeRelationshipOpportunitySignals(input, options = {}) {
  const generatedAt = nowIso(options);
  const signals = toSignals(input);
  if (!signals.length) return makeEmptyEnvelope({ generatedAt });

  const errors = [];
  const candidates = [];

  signals.forEach((signal, index) => {
    if (!hasRequiredSignalShape(signal)) {
      errors.push({
        code: SAFE_ERROR_CODE,
        safeMessage: `Signal at index ${index} is missing required candidate-only normalization fields.`,
        recoverable: true
      });
      return;
    }

    if (!hasEvidenceAndFreshness(signal)) {
      errors.push({
        code: SAFE_ERROR_CODE,
        safeMessage: `Signal ${signal.signal_id} lacks source evidence or freshness metadata.`,
        recoverable: true
      });
      return;
    }

    if (!allSafetyFlagsFalse(signal.safety_flags || {})) {
      errors.push({
        code: SAFE_ERROR_CODE,
        safeMessage: `Signal ${signal.signal_id} has unsafe real-effect flags.`,
        recoverable: true
      });
      return;
    }

    candidates.push(mapSignalToCandidate(signal));
  });

  if (!candidates.length) return makeEmptyEnvelope({ generatedAt, errors });

  const auditEvent = makeAuditEvent(generatedAt, candidates.length);
  return {
    readModelId: "forge.opportunity_pipeline.read_model.normalized_candidates.067d",
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    normalizerId: NORMALIZER_ID,
    normalizerMode: "read_only",
    routeClass: "read_only",
    sourceOfTruth: "candidate_only_local_static_normalization",
    canonicalTruthClaimed: false,
    temporaryShimPreserved: true,
    relationshipSignalsCreateRealOpportunities: false,
    generatedAt,
    freshness: { status: "preview_static" },
    candidates,
    entities: candidates,
    metrics: { candidatesReturned: candidates.length },
    emptyState: null,
    errors,
    blockedEffects: clone(BLOCKED_EFFECTS),
    safety: clone(SAFETY_FLAGS),
    audit: { auditEventId: auditEvent.auditEventId, eventType: auditEvent.eventType },
    auditEvent
  };
}

function getPreviewRelationshipOpportunitySignalsFixture() {
  return clone(PREVIEW_SIGNALS);
}

function getNormalizerManifest() {
  return {
    normalizerId: NORMALIZER_ID,
    normalizerType: "local_static_candidate_normalizer",
    normalizerMode: "read_only",
    routeClass: "read_only",
    domainId: DOMAIN_ID,
    schemaVersion: SCHEMA_VERSION,
    freshness: { status: "preview_static" },
    canonicalTruthClaimed: false,
    temporaryShimPreserved: true,
    safeErrorCode: SAFE_ERROR_CODE,
    blockedEffects: clone(BLOCKED_EFFECTS),
    safety: clone(SAFETY_FLAGS)
  };
}

module.exports = {
  NORMALIZER_ID,
  SAFE_ERROR_CODE,
  getNormalizerManifest,
  normalizeRelationshipOpportunitySignals,
  getPreviewRelationshipOpportunitySignalsFixture
};
