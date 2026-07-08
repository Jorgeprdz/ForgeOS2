'use strict';

const assert = require('node:assert/strict');

const adapter = require('../platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.v1');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

assert.equal(typeof adapter.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog, 'function');
assert.equal(typeof adapter.getReadinessGateById, 'function');
assert.equal(typeof adapter.getReadinessGatesByStatus, 'function');
assert.equal(typeof adapter.getNotReadyExecutionGates, 'function');
assert.equal(typeof adapter.getSatisfiedExecutionReadinessGates, 'function');
assert.equal(typeof adapter.getBlockingExecutionReadinessGates, 'function');
assert.equal(typeof adapter.validateReadinessGateShape, 'function');
assert.equal(typeof adapter.validateReadinessReviewMatrixCatalog, 'function');

const catalog = adapter.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog();

assert.equal(catalog.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(catalog.domainId, 'quote_preview_pdf_engine_canonical_execution_readiness_review');
assert.equal(catalog.mode, 'read_only');
assert.equal(catalog.routeClass, 'preview_safe');
assert.equal(catalog.matrix_type, 'local_static_read_only_execution_readiness_review_matrix');
assert.equal(catalog.overall_readiness, adapter.READINESS_DECISIONS.NOT_READY_FOR_EXECUTION);

for (const flag of [
  'execution_allowed_in_matrix',
  'pdf_read_allowed_in_matrix',
  'ocr_execution_allowed_in_matrix',
  'parser_execution_allowed_in_matrix',
  'calculator_execution_allowed_in_matrix',
  'banxico_call_allowed_in_matrix',
  'provider_call_allowed_in_matrix',
  'test_execution_allowed_in_matrix',
  'backend_connection_allowed_in_matrix',
  'quote_write_allowed_in_matrix',
]) {
  assert.equal(catalog[flag], false, `${flag} must be false`);
}

assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert(Array.isArray(catalog.gates));
assert(catalog.gates.length >= 10);
assert.equal(adapter.validateReadinessReviewMatrixCatalog(catalog).ok, true);

for (const gate of catalog.gates) {
  for (const field of adapter.REQUIRED_GATE_FIELDS) {
    assert(field in gate, `${gate.gate_id} missing ${field}`);
  }
  assert.equal(adapter.validateReadinessGateShape(gate).ok, true);
}

const surfaceGate = adapter.getReadinessGateById('canonical_surface_mapping_locked');
assert.equal(surfaceGate.gate_status, adapter.GATE_STATUSES.SATISFIED);
assert.equal(surfaceGate.readiness_decision, adapter.READINESS_DECISIONS.READY);

const evidenceGate = adapter.getReadinessGateById('canonical_test_evidence_locked');
assert.equal(evidenceGate.gate_status, adapter.GATE_STATUSES.SATISFIED);

const provenanceGate = adapter.getReadinessGateById('canonical_provenance_locked');
assert.equal(provenanceGate.gate_status, adapter.GATE_STATUSES.SATISFIED);

const pdfGate = adapter.getReadinessGateById('real_pdf_file_or_hash_ready');
assert.equal(pdfGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert.equal(pdfGate.readiness_decision, adapter.READINESS_DECISIONS.NOT_READY_FOR_EXECUTION);
assert(pdfGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.PDF_FILE_OR_HASH_REQUIRED));

const expectedGate = adapter.getReadinessGateById('expected_value_source_trace_ready');
assert.equal(expectedGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert(expectedGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.EXPECTED_VALUE_SOURCE_TRACE_REQUIRED));

const deterministicGate = adapter.getReadinessGateById('deterministic_input_source_trace_ready');
assert.equal(deterministicGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert(deterministicGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.DETERMINISTIC_INPUT_SOURCE_TRACE_REQUIRED));

const parserGate = adapter.getReadinessGateById('parser_ownership_resolved');
assert.equal(parserGate.gate_status, adapter.GATE_STATUSES.DECISION_REQUIRED);
assert.equal(parserGate.readiness_decision, adapter.READINESS_DECISIONS.REVIEW_REQUIRED);
assert(parserGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.PARSER_OWNERSHIP_DECISION_REQUIRED));

const banxicoGate = adapter.getReadinessGateById('banxico_provider_runtime_gate_ready');
assert.equal(banxicoGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert.equal(banxicoGate.execution_policy, adapter.EXECUTION_POLICIES.BLOCK_RUNTIME_PROVIDER_UNTIL_GATE);
assert(banxicoGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.BANXICO_RUNTIME_GATE_REQUIRED));

const fixtureGuard = adapter.getReadinessGateById('fixture_not_real_pdf_guard_ready');
assert.equal(fixtureGuard.gate_status, adapter.GATE_STATUSES.SATISFIED);
assert(fixtureGuard.safe_errors.includes(adapter.SAFE_ERROR_CODES.FIXTURE_AS_REAL_PDF_BLOCKED));

const governanceGuard = adapter.getReadinessGateById('governance_not_extraction_proof_guard_ready');
assert.equal(governanceGuard.gate_status, adapter.GATE_STATUSES.SATISFIED);
assert(governanceGuard.safe_errors.includes(adapter.SAFE_ERROR_CODES.GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED));

const duplicateGuard = adapter.getReadinessGateById('duplicate_engine_creation_guard_ready');
assert.equal(duplicateGuard.gate_status, adapter.GATE_STATUSES.SATISFIED);
assert(duplicateGuard.safe_errors.includes(adapter.SAFE_ERROR_CODES.DUPLICATE_ENGINE_CREATION_BLOCKED));

const quoteTruthGate = adapter.getReadinessGateById('quote_truth_boundary_ready');
assert.equal(quoteTruthGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert.equal(quoteTruthGate.execution_policy, adapter.EXECUTION_POLICIES.BLOCK_QUOTE_TRUTH_UNTIL_BOUNDARY);
assert(quoteTruthGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.QUOTE_TRUTH_BOUNDARY_REQUIRED));

const notReady = adapter.getNotReadyExecutionGates();
assert(notReady.some((gate) => gate.gate_id === 'real_pdf_file_or_hash_ready'));
assert(notReady.some((gate) => gate.gate_id === 'expected_value_source_trace_ready'));
assert(notReady.some((gate) => gate.gate_id === 'parser_ownership_resolved'));
assert(notReady.some((gate) => gate.gate_id === 'quote_truth_boundary_ready'));

const satisfied = adapter.getSatisfiedExecutionReadinessGates();
assert(satisfied.some((gate) => gate.gate_id === 'canonical_surface_mapping_locked'));
assert(satisfied.some((gate) => gate.gate_id === 'fixture_not_real_pdf_guard_ready'));

const blocking = adapter.getBlockingExecutionReadinessGates();
assert(blocking.length >= notReady.length);
assert(blocking.some((gate) => gate.gate_id === 'banxico_provider_runtime_gate_ready'));

const missing = adapter.getReadinessGateById('missing_gate');
assert.equal(missing.readModelStatus, 'error');
assert.equal(missing.readiness_decision, adapter.READINESS_DECISIONS.NOT_READY_FOR_EXECUTION);
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.READINESS_GATE_NOT_MAPPED));
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.EXECUTION_NOT_READY));
assert.equal(adapter.validateReadinessGateShape(missing).ok, true);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const gate of catalog.gates) {
  for (const [key, value] of Object.entries(gate.safety_flags || {})) {
    assert.equal(value, false, `${gate.gate_id}.${key} must be false`);
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

console.log('PASS quote preview pdf engine canonical execution readiness review matrix adapter 080B');
