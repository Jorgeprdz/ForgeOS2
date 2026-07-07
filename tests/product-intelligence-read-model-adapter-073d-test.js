import assert from 'node:assert/strict';
import {
  ADAPTER_ID,
  DEFAULT_SAFETY_FLAGS,
  PRODUCT_FAMILIES,
  REQUIRED_FIELDS,
  SAFE_ERROR_CODES,
  SCHEMA_VERSION,
  buildProductIntelligenceNotModeledError,
  getProductIntelligenceReadModelByFamily,
  getProductIntelligenceReadModelCatalog,
  validateProductIntelligenceReadModelShape
} from '../platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js';

const safetyKeys = Object.keys(DEFAULT_SAFETY_FLAGS);

function assertSafetyFlagsFalse(flags, label) {
  safetyKeys.forEach((key) => {
    assert.equal(flags[key], false, `${label}.${key} must be false`);
  });
}

function assertRequiredFields(record) {
  REQUIRED_FIELDS.forEach((field) => {
    assert.ok(field in record, `${record.product_family} missing ${field}`);
  });
}

function flattenRefs(refs) {
  return refs.map((entry) => entry.ref);
}

const catalog = getProductIntelligenceReadModelCatalog();
assert.equal(catalog.adapterId, ADAPTER_ID);
assert.equal(catalog.schemaVersion, SCHEMA_VERSION);
assert.equal(catalog.domainId, 'product_intelligence');
assert.equal(catalog.mode, 'read_only');
assert.equal(catalog.routeClass, 'preview_safe');
assert.equal(catalog.readModel.status, 'ok');
assertSafetyFlagsFalse(catalog.safetyFlags, 'catalog.safetyFlags');

const records = catalog.readModel.records;
assert.equal(records.length, PRODUCT_FAMILIES.length);
assert.deepEqual(
  records.map((record) => record.product_family).sort(),
  [...PRODUCT_FAMILIES].sort()
);

records.forEach((record) => {
  assert.equal(record.schemaVersion, SCHEMA_VERSION);
  assert.equal(record.domainId, 'product_intelligence');
  assert.equal(record.mode, 'read_only');
  assert.equal(record.routeClass, 'preview_safe');
  assertRequiredFields(record);
  assertSafetyFlagsFalse(record.safety_flags, `${record.product_family}.safety_flags`);
  assert.equal(record.product_ref.canonical_truth_claimed, false);
  assert.equal(record.source_ownership.owner_required_before_truth, true);
  assert.equal(record.freshness_metadata.status, 'preview_static');
  assert.equal(record.audit_event, 'read_model_used');
  assert.ok(record.blocked_effects.includes('real_engine_execution'));
  assert.ok(record.blocked_effects.includes('provider_call'));
  assert.ok(record.blocked_effects.includes('quote_send'));
  assert.ok(record.blocked_effects.includes('pdf_read'));
});

const shapeValidation = validateProductIntelligenceReadModelShape(catalog);
assert.equal(shapeValidation.valid, true);
assert.deepEqual(shapeValidation.errors, []);

const imagina = getProductIntelligenceReadModelByFamily('Imagina Ser').readModel.records[0];
assert.equal(imagina.product_identity.proven_case_only, true);
assert.equal(imagina.product_identity.universal_architecture, false);
assert.ok(flattenRefs(imagina.calculator_refs).includes('retirement-future-udi-projection-engine.js'));
assert.ok(flattenRefs(imagina.currency_semantics.mapped_refs).includes('shared-banxico-rate-engine.js'));
assertSafetyFlagsFalse(imagina.safety_flags, 'imagina.safety_flags');

records.forEach((record) => {
  assert.equal(record.quote_semantics.quote_pdf_preview_role, 'consumer_reference_only');
  assert.equal(record.quote_semantics.truth_claimed, false);
  assert.ok(
    flattenRefs(record.quote_semantics.mapped_refs).includes('product-intelligence/evidence/forge-quote-pdf-preview-engine.js'),
    `${record.product_family} quote PDF preview must be consumer/reference only`
  );
});

const gmm = getProductIntelligenceReadModelByFamily('GMM').readModel.records[0];
assert.ok(flattenRefs(gmm.parser_refs).includes('product-intelligence/evidence/gmm-quote-parser.js'));
assert.ok(flattenRefs(gmm.source_module_refs).includes('gmm-quote-summary-engine.js'));

const missing = getProductIntelligenceReadModelByFamily('Missing Family');
assert.equal(missing.readModel.status, 'error');
assert.equal(missing.errors[0].code, SAFE_ERROR_CODES.notModeled);
assertSafetyFlagsFalse(missing.safetyFlags, 'missing.safetyFlags');

const invalid = buildProductIntelligenceNotModeledError();
assert.equal(invalid.errors[0].code, 'PRODUCT_INTELLIGENCE_READ_MODEL_NOT_MODELED');
assertSafetyFlagsFalse(invalid.safetyFlags, 'invalid.safetyFlags');

console.log('PASS product intelligence read model adapter 073D');
