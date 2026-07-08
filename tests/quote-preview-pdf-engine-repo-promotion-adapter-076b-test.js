'use strict';

const assert = require('node:assert/strict');

const adapter = require('../platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.pdf_engine.repo_promotion.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.pdf_engine.repo_promotion.v1');

assert.equal(typeof adapter.getQuotePreviewPdfEnginePromotionManifest, 'function');
assert.equal(typeof adapter.prepareQuotePreviewPdfEnginePromotionScope, 'function');
assert.equal(typeof adapter.buildQuotePreviewPdfEnginePromotionError, 'function');
assert.equal(typeof adapter.validateQuotePreviewPdfEnginePromotionShape, 'function');

const manifest = adapter.getQuotePreviewPdfEnginePromotionManifest();

assert.equal(manifest.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(manifest.domainId, 'quote_preview_pdf_engine_repo_promotion');
assert.equal(manifest.mode, 'read_only');
assert.equal(manifest.routeClass, 'preview_safe');
assert.equal(manifest.promotion_constraints.product_intelligence_binding_required, true);
assert.equal(manifest.promotion_constraints.product_intelligence_upstream_semantic_authority, true);
assert.equal(manifest.promotion_constraints.quote_preview_pdf_engine_downstream_consumer_reference_only, true);
assert.equal(manifest.promotion_constraints.executes_pdf_read, false);
assert.equal(manifest.promotion_constraints.executes_parser, false);
assert.equal(manifest.promotion_constraints.executes_calculator, false);
assert.equal(manifest.promotion_constraints.calls_banxico, false);
assert.equal(manifest.promotion_constraints.writes_quote, false);
assert.equal(manifest.promotion_constraints.creates_quote_truth, false);

const gmm = adapter.prepareQuotePreviewPdfEnginePromotionScope({
  quote_preview_pdf_request_id: 'qa_076b_gmm',
  product_family_hint: 'GMM',
  source_document_ref: 'static_reference_only_no_pdf_read',
  source_evidence_refs: ['qa_076b_gmm_evidence'],
});

assert.equal(gmm.readModelStatus, 'ok');
assert.equal(gmm.product_family, 'GMM');
assert.equal(gmm.product_intelligence_ref, 'product_intelligence:gmm');
assert.equal(gmm.product_intelligence_binding_ref.required, true);
assert.equal(gmm.preview_constraints.product_intelligence_binding_required, true);
assert.equal(gmm.preview_constraints.reference_only, true);
assert.equal(gmm.preview_constraints.no_pdf_read, true);
assert.equal(gmm.preview_constraints.no_parser_execution, true);
assert.equal(gmm.preview_constraints.no_calculator_execution, true);
assert.equal(gmm.preview_constraints.no_banxico_call, true);
assert.equal(gmm.preview_constraints.no_quote_truth, true);
assert.equal(gmm.safe_error, null);
assert.equal(adapter.validateQuotePreviewPdfEnginePromotionShape(gmm).ok, true);

const imagina = adapter.prepareQuotePreviewPdfEnginePromotionScope({
  quote_preview_pdf_request_id: 'qa_076b_imagina',
  product_family_hint: 'Imagina Ser',
  source_document_ref: 'static_reference_only_no_pdf_read',
  source_evidence_refs: ['qa_076b_imagina_evidence'],
});

assert.equal(imagina.readModelStatus, 'ok');
assert.equal(imagina.product_family, 'Imagina Ser');
assert.equal(imagina.product_intelligence_ref, 'product_intelligence:imagina_ser');
assert.equal(imagina.preview_constraints.universal_architecture, false);
assert(imagina.preview_constraints.product_notes.includes('not_universal_architecture'));
assert.equal(adapter.validateQuotePreviewPdfEnginePromotionShape(imagina).ok, true);

const missing = adapter.prepareQuotePreviewPdfEnginePromotionScope({
  quote_preview_pdf_request_id: 'qa_076b_missing',
  product_family_hint: 'UNKNOWN_FAMILY',
  source_document_ref: 'static_reference_only_no_pdf_read',
  source_evidence_refs: [],
});

assert.equal(missing.readModelStatus, 'error');
assert.equal(missing.safe_error.code, adapter.SAFE_ERROR_CODES.PRODUCT_FAMILY_NOT_MAPPED);
assert.equal(adapter.validateQuotePreviewPdfEnginePromotionShape(missing).ok, true);

for (const family of ['GMM', 'Vida Mujer', 'AVE', 'Imagina Ser', 'ORVI', 'SeguBeca']) {
  const output = adapter.prepareQuotePreviewPdfEnginePromotionScope({
    quote_preview_pdf_request_id: `qa_076b_${family}`,
    product_family_hint: family,
    source_document_ref: 'static_reference_only_no_pdf_read',
    source_evidence_refs: [`qa_076b_${family}_evidence`],
  });
  assert.equal(output.readModelStatus, 'ok', `${family} should be mapped`);
  assert.equal(adapter.validateQuotePreviewPdfEnginePromotionShape(output).ok, true);
}

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

const combined = JSON.stringify({ manifest, gmm, imagina, missing, flags: adapter.DEFAULT_SAFETY_FLAGS });
const forbiddenFragments = [
  '"pdfRead":' + 'true',
  '"parserExecution":' + 'true',
  '"calculatorExecution":' + 'true',
  '"banxicoCall":' + 'true',
  '"realEngineExecution":' + 'true',
  '"providerRuntime":' + 'true',
  '"quoteWrite":' + 'true',
  '"backendConnection":' + 'true',
];

for (const fragment of forbiddenFragments) {
  assert(!combined.includes(fragment), `forbidden true flag found: ${fragment}`);
}

assert(combined.includes('quote-preview-product-intelligence-binding-adapter-074b.js'));
assert(combined.includes('quote-preview-pdf-product-intelligence-integration-adapter-075b.js'));
assert(combined.includes('product-intelligence-read-model-adapter-073d.js'));
assert(combined.includes('forge-quote-pdf-preview-engine.js'));

console.log('PASS quote preview pdf engine repo promotion adapter 076B');
