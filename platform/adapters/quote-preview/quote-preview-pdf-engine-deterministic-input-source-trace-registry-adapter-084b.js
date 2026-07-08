'use strict';

const readiness = require('./quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js');
const expectedTrace = require('./quote-preview-pdf-engine-expected-value-source-trace-registry-adapter-082b.js');
const parserOwnership = require('./quote-preview-pdf-engine-parser-ownership-registry-adapter-083b.js');

const ADAPTER_ID = 'forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.v1';
const DOMAIN_ID = 'quote_preview_pdf_engine_deterministic_input_source_trace';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const SOURCE_TRACE_STATUSES = Object.freeze({
  NOT_BOUND: 'not_bound',
  BOUND_DECLARED_ONLY: 'bound_declared_only',
  REJECTED: 'rejected',
});

const VERIFICATION_STATUSES = Object.freeze({
  NOT_VERIFIED: 'not_verified',
  VERIFIED_BY_SOURCE: 'verified_by_source',
  REJECTED: 'rejected',
});

const INPUT_KINDS = Object.freeze({
  BANXICO_OR_CACHE_RATE_INPUT: 'banxico_or_cache_rate_input',
  PROJECTION_ASSUMPTION_INPUT: 'projection_assumption_input',
  SCENARIO_HORIZON_INPUT: 'scenario_horizon_input',
  EXISTING_CALCULATOR_FORMULA_REFERENCE: 'existing_calculator_formula_reference',
});

const SAFE_ERROR_CODES = Object.freeze({
  INPUT_TRACE_NOT_MAPPED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_TRACE_NOT_MAPPED',
  SOURCE_TRACE_NOT_BOUND: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_SOURCE_TRACE_NOT_BOUND',
  INPUT_NOT_VERIFIED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_NOT_VERIFIED',
  EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_EXECUTION_NOT_AUTHORIZED',
  INVENTED_CURRENT_UDI_BLOCKED: 'QUOTE_PREVIEW_INVENTED_CURRENT_UDI_BLOCKED',
  INVENTED_UDI_GROWTH_BLOCKED: 'QUOTE_PREVIEW_INVENTED_UDI_GROWTH_BLOCKED',
  INVENTED_PROJECTION_HORIZON_BLOCKED: 'QUOTE_PREVIEW_INVENTED_PROJECTION_HORIZON_BLOCKED',
  INVENTED_PROJECTION_FORMULA_BLOCKED: 'QUOTE_PREVIEW_INVENTED_PROJECTION_FORMULA_BLOCKED',
  CALCULATOR_EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_CALCULATOR_EXECUTION_NOT_AUTHORIZED',
  BANXICO_CALL_NOT_AUTHORIZED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_BANXICO_CALL_NOT_AUTHORIZED',
  DUPLICATE_CALCULATOR_CREATION_BLOCKED: 'QUOTE_PREVIEW_DUPLICATE_CALCULATOR_CREATION_BLOCKED',
});

const DEFAULT_SAFETY_FLAGS = Object.freeze({
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
  backendConnection: false,
  pdfRead: false,
  ocrExecution: false,
  parserExecution: false,
  calculatorExecution: false,
  banxicoCall: false,
  testExecution: false,
});

const REQUIRED_INPUT_TRACE_FIELDS = Object.freeze([
  'input_trace_id',
  'input_key',
  'input_kind',
  'product_family',
  'source_candidate_refs',
  'required_source_trace',
  'source_trace_status',
  'verification_status',
  'execution_allowed',
  'blocked_misuse',
  'safe_errors',
  'safety_flags',
]);

function freezeInputTrace(trace) {
  return Object.freeze({
    ...trace,
    source_candidate_refs: Object.freeze([...(trace.source_candidate_refs || [])]),
    blocked_misuse: Object.freeze([...(trace.blocked_misuse || [])]),
    safe_errors: Object.freeze([...(trace.safe_errors || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(trace.safety_flags || {}) }),
  });
}

function makeInputTrace({
  inputTraceId,
  inputKey,
  inputKind,
  productFamily,
  sourceCandidateRefs,
  requiredSourceTrace,
  blockedMisuse,
  safeErrors,
}) {
  return freezeInputTrace({
    input_trace_id: inputTraceId,
    input_key: inputKey,
    input_kind: inputKind,
    product_family: productFamily,
    source_candidate_refs: sourceCandidateRefs,
    required_source_trace: requiredSourceTrace,
    source_trace_status: SOURCE_TRACE_STATUSES.NOT_BOUND,
    verification_status: VERIFICATION_STATUSES.NOT_VERIFIED,
    execution_allowed: false,
    blocked_misuse: blockedMisuse,
    safe_errors: [
      SAFE_ERROR_CODES.SOURCE_TRACE_NOT_BOUND,
      SAFE_ERROR_CODES.INPUT_NOT_VERIFIED,
      SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED,
      ...safeErrors,
    ],
  });
}

const DETERMINISTIC_INPUT_SOURCE_TRACES = Object.freeze([
  makeInputTrace({
    inputTraceId: 'input_current_udi_value_source_trace',
    inputKey: 'current_udi_value',
    inputKind: INPUT_KINDS.BANXICO_OR_CACHE_RATE_INPUT,
    productFamily: 'retirement',
    sourceCandidateRefs: ['shared-banxico-rate-engine.js', 'shared-banxico-edge-provider.js', 'exchange-rate-cache-engine.js'],
    requiredSourceTrace: 'existing_rate_cache_or_provider_metadata_gate_before_runtime',
    blockedMisuse: ['invented_current_udi', 'banxico_call_disguised_as_trace', 'provider_runtime_before_gate'],
    safeErrors: [SAFE_ERROR_CODES.INVENTED_CURRENT_UDI_BLOCKED, SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED],
  }),
  makeInputTrace({
    inputTraceId: 'input_udi_growth_assumption_source_trace',
    inputKey: 'udi_growth_assumption',
    inputKind: INPUT_KINDS.PROJECTION_ASSUMPTION_INPUT,
    productFamily: 'retirement',
    sourceCandidateRefs: ['retirement-future-udi-projection-engine.js'],
    requiredSourceTrace: 'existing_repo_engine_or_config_declared_assumption_before_calculation',
    blockedMisuse: ['invented_udi_growth', 'calculator_execution_disguised_as_trace'],
    safeErrors: [SAFE_ERROR_CODES.INVENTED_UDI_GROWTH_BLOCKED, SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED],
  }),
  makeInputTrace({
    inputTraceId: 'input_projection_horizon_source_trace',
    inputKey: 'projection_horizon',
    inputKind: INPUT_KINDS.SCENARIO_HORIZON_INPUT,
    productFamily: 'retirement',
    sourceCandidateRefs: ['tests/real-retirement-mxn-scenario-test.js', 'retirement-future-udi-projection-smoke-test.js'],
    requiredSourceTrace: 'scenario_fixture_or_pdf_derived_horizon_before_projection',
    blockedMisuse: ['invented_projection_horizon', 'projection_truth_without_source_trace'],
    safeErrors: [SAFE_ERROR_CODES.INVENTED_PROJECTION_HORIZON_BLOCKED],
  }),
  makeInputTrace({
    inputTraceId: 'input_projection_formula_source_trace',
    inputKey: 'projection_formula',
    inputKind: INPUT_KINDS.EXISTING_CALCULATOR_FORMULA_REFERENCE,
    productFamily: 'retirement',
    sourceCandidateRefs: ['retirement-future-udi-projection-engine.js', 'imagina-ser-future-mxn-bridge.js'],
    requiredSourceTrace: 'existing_engine_formula_reference_only_no_duplicate_calculator',
    blockedMisuse: ['invented_projection_formula', 'duplicate_calculator_creation', 'calculator_execution_disguised_as_trace'],
    safeErrors: [
      SAFE_ERROR_CODES.INVENTED_PROJECTION_FORMULA_BLOCKED,
      SAFE_ERROR_CODES.DUPLICATE_CALCULATOR_CREATION_BLOCKED,
      SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED,
    ],
  }),
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSourceRefs() {
  const readinessCatalog = readiness.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog();
  const expectedTraceCatalog = expectedTrace.getQuotePreviewPdfEngineExpectedValueSourceTraceRegistryCatalog();
  const parserOwnershipCatalog = parserOwnership.getQuotePreviewPdfEngineParserOwnershipRegistryCatalog();

  return {
    readiness: {
      adapter_id: readinessCatalog.adapter_id,
      schemaVersion: readinessCatalog.schemaVersion,
      overall_readiness: readinessCatalog.overall_readiness,
    },
    expected_trace: {
      adapter_id: expectedTraceCatalog.adapter_id,
      schemaVersion: expectedTraceCatalog.schemaVersion,
      overall_trace_status: expectedTraceCatalog.overall_trace_status,
    },
    parser_ownership: {
      adapter_id: parserOwnershipCatalog.adapter_id,
      schemaVersion: parserOwnershipCatalog.schemaVersion,
      overall_ownership_status: parserOwnershipCatalog.overall_ownership_status,
    },
  };
}

function getQuotePreviewPdfEngineDeterministicInputSourceTraceRegistryCatalog() {
  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    registry_type: 'local_static_read_only_deterministic_input_source_trace_registry',
    overall_input_trace_status: 'not_bound_not_verified_not_ready',
    deterministic_calculation_allowed_in_registry: false,
    execution_allowed_in_registry: false,
    pdf_read_allowed_in_registry: false,
    ocr_execution_allowed_in_registry: false,
    parser_execution_allowed_in_registry: false,
    calculator_execution_allowed_in_registry: false,
    banxico_call_allowed_in_registry: false,
    provider_call_allowed_in_registry: false,
    test_execution_allowed_in_registry: false,
    backend_connection_allowed_in_registry: false,
    quote_write_allowed_in_registry: false,
    product_intelligence_upstream: true,
    quote_preview_downstream: true,
    required_input_trace_fields: [...REQUIRED_INPUT_TRACE_FIELDS],
    safe_errors: Object.values(SAFE_ERROR_CODES),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    source_refs: getSourceRefs(),
    input_traces: clone(DETERMINISTIC_INPUT_SOURCE_TRACES),
  };
}

function buildDeterministicInputSourceTraceSafeError(inputTraceId, code = SAFE_ERROR_CODES.INPUT_TRACE_NOT_MAPPED) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    input_trace_id: inputTraceId || null,
    input_key: null,
    input_kind: null,
    product_family: null,
    source_candidate_refs: [],
    required_source_trace: null,
    source_trace_status: SOURCE_TRACE_STATUSES.NOT_BOUND,
    verification_status: VERIFICATION_STATUSES.NOT_VERIFIED,
    execution_allowed: false,
    blocked_misuse: ['unmapped_deterministic_input_execution', 'invented_input_value', 'calculation_before_source_trace'],
    safe_errors: [code, SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED, SAFE_ERROR_CODES.INPUT_NOT_VERIFIED],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: 'Deterministic input source trace is not mapped. Verification and calculation are blocked.',
    },
  };
}

function getDeterministicInputSourceTraceById(inputTraceId) {
  const match = DETERMINISTIC_INPUT_SOURCE_TRACES.find((trace) => trace.input_trace_id === inputTraceId);
  return match ? clone(match) : buildDeterministicInputSourceTraceSafeError(inputTraceId);
}

function getDeterministicInputSourceTraceByInputKey(inputKey) {
  const match = DETERMINISTIC_INPUT_SOURCE_TRACES.find((trace) => trace.input_key === inputKey);
  return match ? clone(match) : buildDeterministicInputSourceTraceSafeError(inputKey);
}

function getDeterministicInputSourceTracesByProductFamily(productFamily) {
  return clone(DETERMINISTIC_INPUT_SOURCE_TRACES.filter((trace) => trace.product_family === productFamily));
}

function getUnboundDeterministicInputSourceTraces() {
  return clone(DETERMINISTIC_INPUT_SOURCE_TRACES.filter((trace) => trace.source_trace_status === SOURCE_TRACE_STATUSES.NOT_BOUND));
}

function getNotVerifiedDeterministicInputSourceTraces() {
  return clone(DETERMINISTIC_INPUT_SOURCE_TRACES.filter((trace) => trace.verification_status === VERIFICATION_STATUSES.NOT_VERIFIED));
}

function validateDeterministicInputSourceTraceShape(trace) {
  const errors = [];

  if (!trace || typeof trace !== 'object') {
    return { ok: false, valid: false, errors: ['deterministic_input_trace_object_required'] };
  }

  for (const field of REQUIRED_INPUT_TRACE_FIELDS) {
    if (!(field in trace)) errors.push(`missing_${field}`);
  }

  if (trace.execution_allowed !== false) errors.push('execution_allowed_must_be_false');
  if (trace.source_trace_status !== SOURCE_TRACE_STATUSES.NOT_BOUND) errors.push('source_trace_status_must_remain_not_bound');
  if (trace.verification_status !== VERIFICATION_STATUSES.NOT_VERIFIED) errors.push('verification_status_must_remain_not_verified');

  for (const [key, value] of Object.entries(trace.safety_flags || {})) {
    if (value !== false) errors.push(`safety_flag_not_false_${key}`);
  }

  return {
    ok: errors.length === 0,
    valid: errors.length === 0,
    errors,
  };
}

function validateDeterministicInputSourceTraceRegistryCatalog(catalog) {
  const errors = [];

  if (!catalog || typeof catalog !== 'object') {
    return { ok: false, valid: false, errors: ['catalog_object_required'] };
  }

  if (catalog.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (catalog.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (catalog.mode !== MODE) errors.push('invalid_mode');
  if (catalog.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');
  if (catalog.overall_input_trace_status !== 'not_bound_not_verified_not_ready') errors.push('overall_input_trace_status_must_remain_not_ready');

  for (const flagName of [
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
    if (catalog[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  for (const [key, value] of Object.entries(catalog.safety_flags || {})) {
    if (value !== false) errors.push(`catalog_safety_flag_not_false_${key}`);
  }

  const traces = Array.isArray(catalog.input_traces) ? catalog.input_traces : [];
  if (traces.length !== 4) errors.push('four_deterministic_input_traces_required');

  for (const trace of traces) {
    const result = validateDeterministicInputSourceTraceShape(trace);
    if (!result.ok) errors.push(...result.errors.map((error) => `${trace.input_trace_id || 'unknown'}:${error}`));
  }

  return {
    ok: errors.length === 0,
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  ADAPTER_ID,
  SCHEMA_VERSION,
  DOMAIN_ID,
  MODE,
  ROUTE_CLASS,
  SOURCE_TRACE_STATUSES,
  VERIFICATION_STATUSES,
  INPUT_KINDS,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_INPUT_TRACE_FIELDS,
  DETERMINISTIC_INPUT_SOURCE_TRACES,
  getQuotePreviewPdfEngineDeterministicInputSourceTraceRegistryCatalog,
  getDeterministicInputSourceTraceById,
  getDeterministicInputSourceTraceByInputKey,
  getDeterministicInputSourceTracesByProductFamily,
  getUnboundDeterministicInputSourceTraces,
  getNotVerifiedDeterministicInputSourceTraces,
  buildDeterministicInputSourceTraceSafeError,
  validateDeterministicInputSourceTraceShape,
  validateDeterministicInputSourceTraceRegistryCatalog,
};
