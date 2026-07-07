'use strict';

const SCHEMA_VERSION = 'forge.backend.read_model.v1';
const SAFE_ERROR_CODE = 'POLICY_READ_MODEL_NOT_MODELED';

const safetyFlags = Object.freeze({
  crmWrite: false,
  pipelineWrite: false,
  policyWrite: false,
  quoteWrite: false,
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

const blockedEffects = Object.freeze([
  'policy_create',
  'policy_update',
  'policy_delete',
  'policy_cancel',
  'policy_renew',
  'premium_real_claim',
  'coverage_truth_without_evidence',
  'provider_call',
  'crm_write',
  'pipeline_write',
  'quote_write',
  'task_create',
  'calendar_create',
  'message_send',
  'auth_real',
  'secret_access',
  'browser_persistence',
  'real_engine_execution'
]);

const policyFixtures = Object.freeze([
  Object.freeze({
    policy_id: 'policy_preview_lariza_gmm',
    client_ref: { entity_type: 'client', entity_id: 'client_preview_lariza' },
    display_name: 'Lariza GMM policy preview',
    policy_type: 'gmm',
    carrier_ref: { source: 'preview_static', display_name: 'carrier pending evidence' },
    policy_status: 'modeled_preview',
    coverage_summary: 'Coverage summary pending canonical evidence',
    effective_date: null,
    expiration_date: null,
    renewal_state: 'unknown_source_pending_mapping',
    premium_preview: { amount: null, currency: null, status: 'not_modeled' },
    payment_state: 'unknown_source_pending_mapping',
    document_refs: ['policy_evidence_preview_lariza_gmm'],
    opportunity_refs: ['opp_preview_lariza_review'],
    quote_refs: [],
    advisor_notes_refs: [],
    risk_flags: ['missing_effective_dates', 'premium_not_modeled'],
    next_action: { type: 'review_policy_evidence', label: 'Review policy evidence before treating as fact' },
    source_evidence_ids: ['policy_evidence_preview_lariza_gmm'],
    freshness_metadata: { status: 'preview_static', checked_at: null },
    audit_event: 'read_model_used',
    blocked_effects: blockedEffects,
    safety_flags: safetyFlags
  }),
  Object.freeze({
    policy_id: 'policy_preview_octavio_life',
    client_ref: { entity_type: 'client', entity_id: 'client_preview_octavio' },
    display_name: 'Octavio life policy preview',
    policy_type: 'life',
    carrier_ref: { source: 'preview_static', display_name: 'carrier pending evidence' },
    policy_status: 'modeled_preview',
    coverage_summary: 'Policy detail pending source ownership',
    effective_date: null,
    expiration_date: null,
    renewal_state: 'unknown_source_pending_mapping',
    premium_preview: { amount: null, currency: null, status: 'not_modeled' },
    payment_state: 'unknown_source_pending_mapping',
    document_refs: ['policy_evidence_preview_octavio_life'],
    opportunity_refs: ['opp_preview_octavio_open'],
    quote_refs: [],
    advisor_notes_refs: [],
    risk_flags: ['source_ownership_pending'],
    next_action: { type: 'confirm_policy_source', label: 'Confirm canonical policy source before use' },
    source_evidence_ids: ['policy_evidence_preview_octavio_life'],
    freshness_metadata: { status: 'preview_static', checked_at: null },
    audit_event: 'read_model_used',
    blocked_effects: blockedEffects,
    safety_flags: safetyFlags
  })
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getPolicyReadModelManifest() {
  return {
    adapterId: 'forge.policy.read_model.adapter.v1',
    adapterType: 'local_static_fixture',
    adapterMode: 'read_only',
    routeClass: 'read_only',
    domainId: 'policy',
    schemaVersion: SCHEMA_VERSION,
    freshness: { status: 'preview_static' },
    canonicalPolicyTruthClaimed: false,
    safeErrorCode: SAFE_ERROR_CODE,
    safetyFlags: clone(safetyFlags),
    blockedEffects: clone(blockedEffects)
  };
}

function buildEnvelope({ records, emptyState = null, error = null }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: 'policy',
    routeClass: 'read_only',
    readModel: {
      status: error ? 'error' : emptyState ? 'empty' : 'ok',
      records,
      emptyState,
      error
    },
    audit: {
      event: 'read_model_used',
      source: 'forge.policy.read_model.adapter.v1'
    },
    freshness: { status: 'preview_static' },
    blockedEffects: clone(blockedEffects),
    safetyFlags: clone(safetyFlags),
    canonicalPolicyTruthClaimed: false
  };
}

function listPolicies() {
  return buildEnvelope({ records: clone(policyFixtures) });
}

function getPolicyDetail(policyId) {
  if (!policyId || typeof policyId !== 'string') {
    return buildEnvelope({
      records: [],
      error: { code: SAFE_ERROR_CODE, message: 'Policy id is required for preview read model detail.' }
    });
  }

  const found = policyFixtures.find((policy) => policy.policy_id === policyId);
  if (!found) {
    return buildEnvelope({
      records: [],
      emptyState: { reason: 'filter_no_match', policy_id: policyId },
      error: { code: SAFE_ERROR_CODE, message: 'Policy is not modeled in local static preview.' }
    });
  }

  return buildEnvelope({ records: [clone(found)] });
}

module.exports = {
  SAFE_ERROR_CODE,
  getPolicyReadModelManifest,
  listPolicies,
  getPolicyDetail
};
