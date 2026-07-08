'use strict';

const assert = require('node:assert/strict');

const adapter = require('../platform/adapters/quote-preview/quote-preview-pdf-engine-deterministic-input-source-trace-registry-adapter-084b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.v1');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

const catalog = adapter.getQuotePreviewPdfEngineDeterministicInputSourceTraceRegistryCatalog();

assert.equal(catalog.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(catalog.domainId, 'quote_preview_pdf_engine_deterministic_input_source_trace');
assert.equal(catalog.registry_type, 'local_static_read_only_deterministic_input_source_trace_registry');
assert.equal(catalog.overall_input_trace_status, 'not_bound_not_verified_not_ready');
assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert.equal(catalog.input_traces.length, 4);
assert.equal(adapter.validateDeterministicInputSourceTraceRegistryCatalog(catalog).ok, true);

for (const flag of [
  'deterministic_calculation_allowed_in_registry',
  'execution_allowed_in_registry',
  'pdf_read_allowed_in_registry',
  'ocr_execution_allowed_in_registry',
  'parser_execution_allowed_in_registry',
  'calculator_execution_allowed_in_registry',
  'banxico_call_allowed_in_registry',
  'provider_call_allowed_in_registry',
  'test_execution_allowed_in_registry',
  'backend_connection_allowed_in_registry',
  'quote_write_allowed_in_registry',
]) {
  assert.equal(catalog[flag], false, `${flag} must be false`);
}

for (const trace of catalog.input_traces) {
  for (const field of adapter.REQUIRED_INPUT_TRACE_FIELDS) {
    assert(field in trace, `${trace.input_trace_id} missing ${field}`);
  }
  assert.equal(trace.source_trace_status, adapter.SOURCE_TRACE_STATUSES.NOT_BOUND);
  assert.equal(trace.verification_status, adapter.VERIFICATION_STATUSES.NOT_VERIFIED);
  assert.equal(trace.execution_allowed, false);
  assert(trace.safe_errors.includes(adapter.SAFE_ERROR_CODES.SOURCE_TRACE_NOT_BOUND));
  assert(trace.safe_errors.includes(adapter.SAFE_ERROR_CODES.INPUT_NOT_VERIFIED));
  assert(trace.safe_errors.includes(adapter.SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED));
  assert.equal(adapter.validateDeterministicInputSourceTraceShape(trace).ok, true);
}

const currentUdi = adapter.getDeterministicInputSourceTraceByInputKey('current_udi_value');
assert.equal(currentUdi.input_kind, adapter.INPUT_KINDS.BANXICO_OR_CACHE_RATE_INPUT);
assert(currentUdi.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_CURRENT_UDI_BLOCKED));
assert(currentUdi.safe_errors.includes(adapter.SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED));

const growth = adapter.getDeterministicInputSourceTraceByInputKey('udi_growth_assumption');
assert.equal(growth.input_kind, adapter.INPUT_KINDS.PROJECTION_ASSUMPTION_INPUT);
assert(growth.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_UDI_GROWTH_BLOCKED));
assert(growth.safe_errors.includes(adapter.SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED));

const horizon = adapter.getDeterministicInputSourceTraceByInputKey('projection_horizon');
assert.equal(horizon.input_kind, adapter.INPUT_KINDS.SCENARIO_HORIZON_INPUT);
assert(horizon.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_PROJECTION_HORIZON_BLOCKED));

const formula = adapter.getDeterministicInputSourceTraceByInputKey('projection_formula');
assert.equal(formula.input_kind, adapter.INPUT_KINDS.EXISTING_CALCULATOR_FORMULA_REFERENCE);
assert(formula.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_PROJECTION_FORMULA_BLOCKED));
assert(formula.safe_errors.includes(adapter.SAFE_ERROR_CODES.DUPLICATE_CALCULATOR_CREATION_BLOCKED));

assert.equal(adapter.getDeterministicInputSourceTracesByProductFamily('retirement').length, 4);
assert.equal(adapter.getUnboundDeterministicInputSourceTraces().length, 4);
assert.equal(adapter.getNotVerifiedDeterministicInputSourceTraces().length, 4);

const missing = adapter.getDeterministicInputSourceTraceById('missing_input_trace');
assert.equal(missing.readModelStatus, 'error');
assert.equal(missing.execution_allowed, false);
assert.equal(missing.source_trace_status, adapter.SOURCE_TRACE_STATUSES.NOT_BOUND);
assert.equal(missing.verification_status, adapter.VERIFICATION_STATUSES.NOT_VERIFIED);
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.INPUT_TRACE_NOT_MAPPED));
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED));
assert.equal(adapter.validateDeterministicInputSourceTraceShape(missing).ok, true);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const trace of catalog.input_traces) {
  for (const [key, value] of Object.entries(trace.safety_flags || {})) {
    assert.equal(value, false, `${trace.input_trace_id}.${key} must be false`);
  }
}

const combined = JSON.stringify({
  catalog,
  missing,
  flags: adapter.DEFAULT_SAFETY_FLAGS,
  safeErrors: adapter.SAFE_ERROR_CODES,
});

for (const fragment of [
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
]) {
  assert(!combined.includes(fragment), `forbidden true flag found: ${fragment}`);
}

console.log('PASS quote preview pdf engine deterministic input source trace registry adapter 084B');
