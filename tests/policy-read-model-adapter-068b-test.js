'use strict';

const assert = require('assert');
const {
  SAFE_ERROR_CODE,
  getPolicyReadModelManifest,
  listPolicies,
  getPolicyDetail
} = require('../platform/adapters/policy-read-model/policy-read-model-adapter-068b');

function assertAllSafetyFlagsFalse(flags) {
  for (const [key, value] of Object.entries(flags)) {
    assert.strictEqual(value, false, `${key} must be false`);
  }
}

const manifest = getPolicyReadModelManifest();
assert.strictEqual(manifest.adapterId, 'forge.policy.read_model.adapter.v1');
assert.strictEqual(manifest.adapterType, 'local_static_fixture');
assert.strictEqual(manifest.adapterMode, 'read_only');
assert.strictEqual(manifest.routeClass, 'read_only');
assert.strictEqual(manifest.domainId, 'policy');
assert.strictEqual(manifest.schemaVersion, 'forge.backend.read_model.v1');
assert.strictEqual(manifest.freshness.status, 'preview_static');
assert.strictEqual(manifest.canonicalPolicyTruthClaimed, false);
assert.strictEqual(manifest.safeErrorCode, SAFE_ERROR_CODE);
assertAllSafetyFlagsFalse(manifest.safetyFlags);

const list = listPolicies();
assert.strictEqual(list.schemaVersion, 'forge.backend.read_model.v1');
assert.strictEqual(list.readModel.status, 'ok');
assert.strictEqual(list.readModel.records.length, 2);
assert.strictEqual(list.audit.event, 'read_model_used');
assert.strictEqual(list.freshness.status, 'preview_static');
assert.strictEqual(list.canonicalPolicyTruthClaimed, false);
assertAllSafetyFlagsFalse(list.safetyFlags);

for (const policy of list.readModel.records) {
  assert.ok(policy.policy_id);
  assert.ok(policy.client_ref.entity_id);
  assert.ok(policy.source_evidence_ids.length > 0);
  assert.ok(policy.freshness_metadata.status);
  assert.strictEqual(policy.audit_event, 'read_model_used');
  assertAllSafetyFlagsFalse(policy.safety_flags);
  assert.ok(policy.blocked_effects.includes('policy_update'));
  assert.notStrictEqual(policy.premium_preview.status, 'real_fact');
}

const lariza = getPolicyDetail('policy_preview_lariza_gmm');
assert.strictEqual(lariza.readModel.records[0].client_ref.entity_id, 'client_preview_lariza');
assert.strictEqual(lariza.readModel.records[0].policy_type, 'gmm');

const missing = getPolicyDetail('policy_missing');
assert.strictEqual(missing.readModel.status, 'error');
assert.strictEqual(missing.readModel.emptyState.reason, 'filter_no_match');
assert.strictEqual(missing.readModel.error.code, 'POLICY_READ_MODEL_NOT_MODELED');

const invalid = getPolicyDetail();
assert.strictEqual(invalid.readModel.error.code, 'POLICY_READ_MODEL_NOT_MODELED');

console.log('PASS policy read model adapter 068B');
