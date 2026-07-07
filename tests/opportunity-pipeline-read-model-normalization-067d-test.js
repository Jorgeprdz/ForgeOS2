"use strict";

const assert = require("assert");
const {
  NORMALIZER_ID,
  SAFE_ERROR_CODE,
  getNormalizerManifest,
  normalizeRelationshipOpportunitySignals,
  getPreviewRelationshipOpportunitySignalsFixture
} = require("../platform/adapters/opportunity-pipeline/opportunity-pipeline-read-model-normalizer-067d");

const safetyKeys = [
  "crmWrite",
  "pipelineWrite",
  "taskCreate",
  "calendarCreate",
  "messageSend",
  "authReal",
  "providerRuntime",
  "secretAccess",
  "browserPersistence",
  "realEngineExecution",
  "realEffectsAllowed",
  "realEffectsEnabled",
  "backendConnection"
];

function assertSafetyFalse(container) {
  safetyKeys.forEach((key) => {
    assert.strictEqual(container[key], false, `${key} must be false`);
  });
}

const manifest = getNormalizerManifest();
assert.strictEqual(manifest.normalizerId, NORMALIZER_ID);
assert.strictEqual(manifest.normalizerType, "local_static_candidate_normalizer");
assert.strictEqual(manifest.normalizerMode, "read_only");
assert.strictEqual(manifest.routeClass, "read_only");
assert.strictEqual(manifest.domainId, "opportunity_pipeline");
assert.strictEqual(manifest.schemaVersion, "forge.backend.read_model.v1");
assert.strictEqual(manifest.freshness.status, "preview_static");
assert.strictEqual(manifest.canonicalTruthClaimed, false);
assert.strictEqual(manifest.temporaryShimPreserved, true);
assert.strictEqual(manifest.safeErrorCode, SAFE_ERROR_CODE);
assertSafetyFalse(manifest.safety);

const fixture = getPreviewRelationshipOpportunitySignalsFixture();
assert.ok(Array.isArray(fixture));
assert.ok(fixture.length >= 2);

const normalized = normalizeRelationshipOpportunitySignals({ signals: fixture });
assert.strictEqual(normalized.schemaVersion, "forge.backend.read_model.v1");
assert.strictEqual(normalized.domainId, "opportunity_pipeline");
assert.strictEqual(normalized.normalizerId, NORMALIZER_ID);
assert.strictEqual(normalized.canonicalTruthClaimed, false);
assert.strictEqual(normalized.temporaryShimPreserved, true);
assert.strictEqual(normalized.relationshipSignalsCreateRealOpportunities, false);
assert.strictEqual(normalized.freshness.status, "preview_static");
assert.strictEqual(normalized.auditEvent.eventType, "normalization_candidate_prepared");
assertSafetyFalse(normalized.safety);
assert.strictEqual(normalized.candidates.length, fixture.length);

const lariza = normalized.candidates.find((candidate) => candidate.client_ref.entity_id === "client_preview_lariza");
assert.ok(lariza);
assert.ok(lariza.opportunity_id.startsWith("candidate_preview_"));
assert.strictEqual(lariza.client_ref.entity_id, "client_preview_lariza");
assert.strictEqual(lariza.priority, "high");
assert.strictEqual(lariza.next_action, "review_pending_quote_context");
assert.ok(lariza.risk_flags.includes("followup_cooling"));
assert.ok(Array.isArray(lariza.source_evidence_ids));
assert.ok(lariza.source_evidence_ids.length > 0);
assert.ok(lariza.freshness_metadata);
assert.strictEqual(lariza.safety_flags.realEffectsAllowed, false);
assert.strictEqual(lariza.canonicalTruthClaimed, false);
assert.strictEqual(lariza.candidateOnly, true);

normalized.candidates.forEach((candidate) => {
  assert.ok(candidate.source_evidence_ids.length > 0);
  assert.ok(candidate.freshness_metadata);
  assertSafetyFalse(candidate.safety_flags);
});

const empty = normalizeRelationshipOpportunitySignals();
assert.strictEqual(empty.candidates.length, 0);
assert.strictEqual(empty.emptyState.reason, "not_modeled");
assert.strictEqual(empty.errors[0].code, SAFE_ERROR_CODE);
assertSafetyFalse(empty.safety);

const bad = normalizeRelationshipOpportunitySignals({ signals: [{ signal_id: "bad_signal" }] });
assert.strictEqual(bad.candidates.length, 0);
assert.strictEqual(bad.emptyState.reason, "not_modeled");
assert.strictEqual(bad.errors[0].code, SAFE_ERROR_CODE);
assertSafetyFalse(bad.safety);

console.log("PASS opportunity pipeline read model normalization 067D");
