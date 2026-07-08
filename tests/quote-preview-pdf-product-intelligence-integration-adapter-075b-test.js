'use strict';

const assert = require('node:assert/strict');
const adapter = require('../platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js');

function shapeOk(value) {
  const result = adapter.validateQuotePreviewPdfProductIntelligenceIntegrationShape(value);
  return result === true || result.ok === true || result.valid === true || result.isValid === true;
}

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.pdf_engine_product_intelligence.integration.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.pdf_engine_product_intelligence.integration.v1');
assert.equal(adapter.DOMAIN_ID, 'quote_preview_pdf_engine_product_intelligence_integration');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

assert.equal(typeof adapter.integrateQuotePreviewPdfEngineWithProductIntelligence, 'function');
assert.equal(typeof adapter.buildQuotePreviewPdfIntegrationError, 'function');
assert.equal(typeof adapter.validateQuotePreviewPdfProductIntelligenceIntegrationShape, 'function');

const gmm = adapter.integrateQuotePreviewPdfEngineWithProductIntelligence({
  quote_preview_request_id: '075b_test_gmm',
  product_family_hint: 'GMM',
  product_ref_hint: 'gmm_alfa_medical',
  carrier_ref_hint: 'SMNYL',
  source_document_ref: 'document_ref_pdf_fixture_gmm',
  source_evidence_refs: ['evidence_gmm_075b']
});

assert.equal(gmm.readModelStatus, 'ok');
assert.equal(gmm.product_family, 'GMM');
assert.equal(gmm.quote_preview_pdf_engine_role, 'consumer_reference_only');
assert.equal(gmm.extraction_plan.product_intelligence_first, true);
assert.equal(gmm.extraction_plan.pdf_read_allowed, false);
assert.equal(gmm.extraction_plan.parser_execution_allowed, false);
assert.equal(gmm.extraction_plan.calculator_execution_allowed, false);
assert.equal(gmm.extraction_plan.banxico_call_allowed, false);
assert.equal(gmm.extraction_plan.real_engine_execution_allowed, false);
assert.equal(shapeOk(gmm), true);

const imagina = adapter.integrateQuotePreviewPdfEngineWithProductIntelligence({
  quote_preview_request_id: '075b_test_imagina',
  product_family_hint: 'Imagina Ser',
  product_ref_hint: 'imagina_ser',
  carrier_ref_hint: 'SMNYL',
  source_document_ref: 'document_ref_pdf_fixture_imagina_ser',
  source_evidence_refs: ['evidence_imagina_075b']
});

assert.equal(imagina.readModelStatus, 'ok');
assert.equal(imagina.product_family, 'Imagina Ser');
assert.equal(imagina.product_role, 'proven_case_not_universal_architecture');
assert.equal(imagina.quote_preview_pdf_engine_role, 'consumer_reference_only');
assert.equal(shapeOk(imagina), true);

const missingFamily = adapter.integrateQuotePreviewPdfEngineWithProductIntelligence({
  quote_preview_request_id: '075b_test_missing_family',
  product_family_hint: 'UNKNOWN_FAMILY',
  source_document_ref: 'document_ref_pdf_fixture_unknown',
  source_evidence_refs: ['evidence_unknown_075b']
});

assert.equal(missingFamily.readModelStatus, 'error');
assert(
  [
    adapter.SAFE_ERROR_CODES.NOT_INTEGRATED,
    adapter.SAFE_ERROR_CODES.PRODUCT_FAMILY_NOT_MAPPED
  ].includes(missingFamily.safe_error.code)
);

const missingEvidence = adapter.integrateQuotePreviewPdfEngineWithProductIntelligence({
  quote_preview_request_id: '075b_test_missing_evidence',
  product_family_hint: 'GMM'
});

assert.equal(missingEvidence.readModelStatus, 'error');
assert.equal(missingEvidence.safe_error.code, adapter.SAFE_ERROR_CODES.SOURCE_EVIDENCE_REQUIRED);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
  assert.equal(value, false, `default safety flag ${key} must be false`);
}

for (const payload of [gmm, imagina, missingFamily, missingEvidence]) {
  for (const [key, value] of Object.entries(payload.safety_flags)) {
    assert.equal(value, false, `payload safety flag ${key} must be false`);
  }
  assert.equal(payload.blocked_effects.includes('pdf_read'), true);
  assert.equal(payload.blocked_effects.includes('parser_execute'), true);
  assert.equal(payload.blocked_effects.includes('calculator_execute'), true);
  assert.equal(payload.blocked_effects.includes('banxico_call'), true);
  assert.equal(payload.blocked_effects.includes('real_engine_execution'), true);
}

const combined = JSON.stringify({ gmm, imagina, missingFamily, missingEvidence, flags: adapter.DEFAULT_SAFETY_FLAGS });
assert(!combined.includes('"pdfRead":' + 'true'));
assert(!combined.includes('"parserExecution":' + 'true'));
assert(!combined.includes('"calculatorExecution":' + 'true'));
assert(!combined.includes('"banxicoCall":' + 'true'));
assert(!combined.includes('"realEngineExecution":' + 'true'));
assert(!combined.includes('"providerRuntime":' + 'true'));
assert(!combined.includes('"quoteWrite":' + 'true'));
assert(!combined.includes('"backendConnection":' + 'true'));

console.log('PASS quote preview pdf product intelligence integration adapter 075B');
