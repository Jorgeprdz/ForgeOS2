'use strict';

const assert = require('node:assert/strict');

const adapter = require('../platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.pdf_engine.canonical_test_evidence.registry.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.pdf_engine.canonical_test_evidence.registry.v1');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

assert.equal(typeof adapter.getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog, 'function');
assert.equal(typeof adapter.getCanonicalTestEvidenceById, 'function');
assert.equal(typeof adapter.getCanonicalTestEvidenceByPath, 'function');
assert.equal(typeof adapter.getCanonicalTestEvidenceByProductFamily, 'function');
assert.equal(typeof adapter.getCanonicalTestEvidenceByEvidenceType, 'function');
assert.equal(typeof adapter.getCanonicalDecisionRequiredTestEvidence, 'function');
assert.equal(typeof adapter.getFixtureOnlyTestEvidence, 'function');
assert.equal(typeof adapter.getGovernanceOnlyTestEvidence, 'function');
assert.equal(typeof adapter.validateCanonicalTestEvidenceShape, 'function');
assert.equal(typeof adapter.validateCanonicalTestEvidenceRegistryCatalog, 'function');

const catalog = adapter.getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog();

assert.equal(catalog.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(catalog.domainId, 'quote_preview_pdf_engine_canonical_test_evidence');
assert.equal(catalog.mode, 'read_only');
assert.equal(catalog.routeClass, 'preview_safe');
assert.equal(catalog.registry_type, 'local_static_read_only_canonical_test_evidence_registry');
assert.equal(catalog.execution_allowed_in_registry, false);
assert.equal(catalog.real_pdf_tests_executed_in_registry, false);
assert.equal(catalog.parser_tests_executed_in_registry, false);
assert.equal(catalog.calculator_tests_executed_in_registry, false);
assert.equal(catalog.banxico_tests_executed_in_registry, false);
assert.equal(catalog.provider_tests_executed_in_registry, false);
assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert.equal(adapter.validateCanonicalTestEvidenceRegistryCatalog(catalog).ok, true);

assert(Array.isArray(catalog.evidence));
assert(catalog.evidence.length >= 10);

for (const entry of catalog.evidence) {
  for (const field of adapter.REQUIRED_TEST_EVIDENCE_FIELDS) {
    assert(field in entry, `${entry.test_id} missing ${field}`);
  }
  assert.equal(adapter.validateCanonicalTestEvidenceShape(entry).ok, true);
}

const byId = (testId) => adapter.getCanonicalTestEvidenceById(testId);

const realPdf = byId('real_pdf_ocr_solucionline_candidate');
assert.equal(realPdf.file_path, 'tests/real-pdf-ocr-test.js');
assert.equal(realPdf.evidence_type, adapter.EVIDENCE_TYPES.REAL_PDF_OCR);
assert.equal(realPdf.execution_policy, adapter.EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY);
assert(realPdf.safe_errors.includes(adapter.SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED));
assert(realPdf.safe_errors.includes(adapter.SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED));

const gmm = byId('real_gmm_quote_candidate');
assert.equal(gmm.file_path, 'tests/real-gmm-quote-test.js');
assert.equal(gmm.evidence_type, adapter.EVIDENCE_TYPES.REAL_PDF_GMM_PARSER);
assert(gmm.engine_refs.includes('product-intelligence/evidence/gmm-quote-parser.js'));

const gmmOutOfPocket = byId('gmm_out_of_pocket_candidate');
assert.equal(gmmOutOfPocket.canonical_status, adapter.CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED);
assert(gmmOutOfPocket.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED));

const retirementParser = byId('real_retirement_scenario_candidate');
assert.equal(retirementParser.file_path, 'tests/real-retirement-scenario-test.js');
assert.equal(retirementParser.evidence_type, adapter.EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PARSER);
assert(retirementParser.engine_refs.includes('product-intelligence/evidence/solucionline-retirement-parser.js'));

const retirementMxn = byId('real_retirement_mxn_scenario_candidate');
assert.equal(retirementMxn.evidence_type, adapter.EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PROJECTION);
assert(retirementMxn.engine_refs.includes('retirement-future-udi-projection-engine.js'));
assert(retirementMxn.engine_refs.includes('imagina-ser-future-mxn-bridge.js'));

const banxico = byId('imagina_ser_banxico_integration_candidate');
assert.equal(banxico.execution_policy, adapter.EXECUTION_POLICIES.REQUIRES_FUTURE_RUNTIME_GATE);
assert(banxico.safe_errors.includes(adapter.SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED));

const fixture = byId('quote_pdf_preview_fixture_candidate');
assert.equal(fixture.evidence_type, adapter.EVIDENCE_TYPES.PREVIEW_FIXTURE);
assert.equal(fixture.canonical_status, adapter.CANONICAL_STATUSES.FIXTURE_EVIDENCE_ONLY);
assert(fixture.safe_errors.includes(adapter.SAFE_ERROR_CODES.FIXTURE_NOT_REAL_PDF_EVIDENCE));

const governance = byId('repo_promotion_guardrail_candidate');
assert.equal(governance.evidence_type, adapter.EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL);
assert.equal(governance.canonical_status, adapter.CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY);
assert(governance.safe_errors.includes(adapter.SAFE_ERROR_CODES.GOVERNANCE_NOT_EXTRACTION_PROOF));

const mappingGovernance = byId('existing_surfaces_mapping_guardrail_candidate');
assert.equal(mappingGovernance.file_path, 'tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js');
assert.equal(mappingGovernance.canonical_status, adapter.CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY);

const byPath = adapter.getCanonicalTestEvidenceByPath('tests/real-gmm-quote-test.js');
assert.equal(byPath.test_id, 'real_gmm_quote_candidate');

const gmmEntries = adapter.getCanonicalTestEvidenceByProductFamily('GMM');
assert(gmmEntries.some((entry) => entry.test_id === 'real_gmm_quote_candidate'));
assert(gmmEntries.some((entry) => entry.test_id === 'gmm_out_of_pocket_candidate'));

const previewEntries = adapter.getCanonicalTestEvidenceByEvidenceType(adapter.EVIDENCE_TYPES.PREVIEW_FIXTURE);
assert(previewEntries.some((entry) => entry.test_id === 'quote_pdf_preview_fixture_candidate'));

const decisionRequired = adapter.getCanonicalDecisionRequiredTestEvidence();
assert(decisionRequired.some((entry) => entry.test_id === 'real_retirement_scenario_candidate'));
assert(decisionRequired.some((entry) => entry.test_id === 'real_retirement_mxn_scenario_candidate'));

const fixtures = adapter.getFixtureOnlyTestEvidence();
assert.equal(fixtures.length, 1);
assert.equal(fixtures[0].test_id, 'quote_pdf_preview_fixture_candidate');

const governanceOnly = adapter.getGovernanceOnlyTestEvidence();
assert(governanceOnly.length >= 2);
assert(governanceOnly.some((entry) => entry.test_id === 'repo_promotion_guardrail_candidate'));

const missing = adapter.getCanonicalTestEvidenceById('missing_test');
assert.equal(missing.readModelStatus, 'error');
assert.equal(missing.canonical_candidate, false);
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.TEST_EVIDENCE_NOT_MAPPED));
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED));
assert.equal(adapter.validateCanonicalTestEvidenceShape(missing).ok, true);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const entry of catalog.evidence) {
  for (const [key, value] of Object.entries(entry.safety_flags || {})) {
    assert.equal(value, false, `${entry.test_id}.${key} must be false`);
  }
}

const combined = JSON.stringify({
  catalog,
  missing,
  flags: adapter.DEFAULT_SAFETY_FLAGS,
  safeErrors: adapter.SAFE_ERROR_CODES,
});

const forbiddenFragments = [
  '"pdfRead":' + 'true',
  '"ocrExecution":' + 'true',
  '"parserExecution":' + 'true',
  '"calculatorExecution":' + 'true',
  '"banxicoCall":' + 'true',
  '"realEngineExecution":' + 'true',
  '"providerRuntime":' + 'true',
  '"quoteWrite":' + 'true',
  '"backendConnection":' + 'true',
  '"testExecution":' + 'true',
];

for (const fragment of forbiddenFragments) {
  assert(!combined.includes(fragment), `forbidden true flag found: ${fragment}`);
}

console.log('PASS quote preview pdf engine canonical test evidence registry adapter 078B');
