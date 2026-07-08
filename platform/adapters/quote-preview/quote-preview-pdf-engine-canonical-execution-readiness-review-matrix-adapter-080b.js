'use strict';

const surfaces = require('./quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js');
const evidence = require('./quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js');
const provenance = require('./quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js');

const ADAPTER_ID = 'forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.v1';
const DOMAIN_ID = 'quote_preview_pdf_engine_canonical_execution_readiness_review';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const GATE_STATUSES = Object.freeze({
  SATISFIED: 'satisfied',
  NOT_READY: 'not_ready',
  DECISION_REQUIRED: 'decision_required',
});

const READINESS_DECISIONS = Object.freeze({
  READY: 'ready',
  NOT_READY_FOR_EXECUTION: 'not_ready_for_execution',
  REVIEW_REQUIRED: 'review_required',
});

const EXECUTION_POLICIES = Object.freeze({
  NO_EXECUTION_IN_MATRIX: 'no_execution_in_matrix',
  BLOCK_EXECUTION_UNTIL_GATE_SATISFIED: 'block_execution_until_gate_satisfied',
  BLOCK_RUNTIME_PROVIDER_UNTIL_GATE: 'block_runtime_provider_until_gate',
  BLOCK_QUOTE_TRUTH_UNTIL_BOUNDARY: 'block_quote_truth_until_boundary',
});

const SAFE_ERROR_CODES = Object.freeze({
  READINESS_GATE_NOT_MAPPED: 'QUOTE_PREVIEW_PDF_EXECUTION_READINESS_GATE_NOT_MAPPED',
  EXECUTION_NOT_READY: 'QUOTE_PREVIEW_PDF_EXECUTION_NOT_READY',
  PDF_FILE_OR_HASH_REQUIRED: 'QUOTE_PREVIEW_PDF_REAL_FILE_OR_HASH_REQUIRED',
  EXPECTED_VALUE_SOURCE_TRACE_REQUIRED: 'QUOTE_PREVIEW_PDF_EXPECTED_VALUE_SOURCE_TRACE_REQUIRED',
  DETERMINISTIC_INPUT_SOURCE_TRACE_REQUIRED: 'QUOTE_PREVIEW_PDF_DETERMINISTIC_INPUT_SOURCE_TRACE_REQUIRED',
  PARSER_OWNERSHIP_DECISION_REQUIRED: 'QUOTE_PREVIEW_PDF_PARSER_OWNERSHIP_DECISION_REQUIRED',
  BANXICO_RUNTIME_GATE_REQUIRED: 'QUOTE_PREVIEW_PDF_BANXICO_RUNTIME_GATE_REQUIRED',
  QUOTE_TRUTH_BOUNDARY_REQUIRED: 'QUOTE_PREVIEW_PDF_QUOTE_TRUTH_BOUNDARY_REQUIRED',
  FIXTURE_AS_REAL_PDF_BLOCKED: 'QUOTE_PREVIEW_PDF_FIXTURE_AS_REAL_PDF_BLOCKED',
  GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED: 'QUOTE_PREVIEW_PDF_GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED',
  DUPLICATE_ENGINE_CREATION_BLOCKED: 'QUOTE_PREVIEW_PDF_DUPLICATE_ENGINE_CREATION_BLOCKED',
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

const REQUIRED_GATE_FIELDS = Object.freeze([
  'gate_id',
  'gate_status',
  'source_phase',
  'source_registry_refs',
  'blocking_reason',
  'readiness_decision',
  'required_next_action',
  'execution_policy',
  'safe_errors',
  'safety_flags',
]);

function freezeGate(gate) {
  return Object.freeze({
    ...gate,
    source_registry_refs: Object.freeze([...(gate.source_registry_refs || [])]),
    blocking_reason: Object.freeze([...(gate.blocking_reason || [])]),
    required_next_action: Object.freeze([...(gate.required_next_action || [])]),
    safe_errors: Object.freeze([...(gate.safe_errors || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(gate.safety_flags || {}) }),
  });
}

const READINESS_MATRIX = Object.freeze([
  freezeGate({
    gate_id: 'canonical_surface_mapping_locked',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '077D',
    source_registry_refs: ['quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [],
  }),
  freezeGate({
    gate_id: 'canonical_test_evidence_locked',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '078D',
    source_registry_refs: ['quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [],
  }),
  freezeGate({
    gate_id: 'canonical_provenance_locked',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '079D',
    source_registry_refs: ['quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [],
  }),
  freezeGate({
    gate_id: 'real_pdf_file_or_hash_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '079B/079D',
    source_registry_refs: ['prov_real_pdf_ocr_solucionline_file', 'prov_real_gmm_quote_pdf_file', 'prov_real_retirement_parser_pdf_file'],
    blocking_reason: ['real PDF provenance requires file path or source hash before execution'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['bind real PDF fixtures to explicit file paths or hashes before any PDF/OCR execution gate'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.PDF_FILE_OR_HASH_REQUIRED],
  }),
  freezeGate({
    gate_id: 'expected_value_source_trace_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '079B/079D',
    source_registry_refs: ['prov_gmm_out_of_pocket_expected_values', 'prov_real_retirement_mxn_expected_values'],
    blocking_reason: ['expected financial values require source trace before becoming execution assertions'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['bind expected values to PDF-derived fields, fixture sources, or existing deterministic engines'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.EXPECTED_VALUE_SOURCE_TRACE_REQUIRED],
  }),
  freezeGate({
    gate_id: 'deterministic_input_source_trace_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '079B/079D',
    source_registry_refs: ['prov_retirement_future_udi_deterministic_inputs'],
    blocking_reason: ['UDI/current value/growth inputs require traceable repo/config source before calculator execution'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['bind UDI/current/growth inputs to existing repo engine/config and documented provenance'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.DETERMINISTIC_INPUT_SOURCE_TRACE_REQUIRED],
  }),
  freezeGate({
    gate_id: 'parser_ownership_resolved',
    gate_status: GATE_STATUSES.DECISION_REQUIRED,
    source_phase: '077D/078D/079D',
    source_registry_refs: ['parser_solucionline_retirement', 'real_retirement_scenario_candidate'],
    blocking_reason: ['Solucionline parser ownership remains decision-required before execution promotion'],
    readiness_decision: READINESS_DECISIONS.REVIEW_REQUIRED,
    required_next_action: ['resolve parser ownership and preview/orchestrator boundary before parser execution gate'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.PARSER_OWNERSHIP_DECISION_REQUIRED],
  }),
  freezeGate({
    gate_id: 'banxico_provider_runtime_gate_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '079B/079D',
    source_registry_refs: ['prov_imagina_ser_master_rate_cache_boundary', 'prov_imagina_ser_banxico_provider_metadata'],
    blocking_reason: ['Banxico/provider metadata requires a separate future runtime gate'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['define provider/cache runtime gate separately before any Banxico/provider call'],
    execution_policy: EXECUTION_POLICIES.BLOCK_RUNTIME_PROVIDER_UNTIL_GATE,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.BANXICO_RUNTIME_GATE_REQUIRED],
  }),
  freezeGate({
    gate_id: 'fixture_not_real_pdf_guard_ready',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '079D',
    source_registry_refs: ['prov_quote_pdf_preview_fixture_text'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [SAFE_ERROR_CODES.FIXTURE_AS_REAL_PDF_BLOCKED],
  }),
  freezeGate({
    gate_id: 'governance_not_extraction_proof_guard_ready',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '079D',
    source_registry_refs: ['prov_repo_promotion_governance_assertion', 'prov_existing_surfaces_mapping_governance_assertion'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [SAFE_ERROR_CODES.GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED],
  }),
  freezeGate({
    gate_id: 'duplicate_engine_creation_guard_ready',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '079D',
    source_registry_refs: ['prov_engine_refs_existing_catalog_requirement'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [SAFE_ERROR_CODES.DUPLICATE_ENGINE_CREATION_BLOCKED],
  }),
  freezeGate({
    gate_id: 'quote_truth_boundary_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '073D-079D',
    source_registry_refs: ['quote_preview_downstream', 'product_intelligence_upstream'],
    blocking_reason: ['preview-vs-quote-truth boundary must be decided before any quote execution or write'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['define controlled preview execution vs quote truth boundary and forbid writes until separately authorized'],
    execution_policy: EXECUTION_POLICIES.BLOCK_QUOTE_TRUTH_UNTIL_BOUNDARY,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.QUOTE_TRUTH_BOUNDARY_REQUIRED],
  }),
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSourceRefs() {
  const surfaceCatalog = surfaces.getQuotePreviewPdfExistingSurfacesCanonicalMappingCatalog();
  const evidenceCatalog = evidence.getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog();
  const provenanceCatalog = provenance.getQuotePreviewPdfCanonicalTestEvidenceProvenanceRegistryCatalog();

  return {
    surfaces: {
      adapter_id: surfaceCatalog.adapter_id,
      schemaVersion: surfaceCatalog.schemaVersion,
      surface_count: Array.isArray(surfaceCatalog.surfaces) ? surfaceCatalog.surfaces.length : 0,
    },
    evidence: {
      adapter_id: evidenceCatalog.adapter_id,
      schemaVersion: evidenceCatalog.schemaVersion,
      evidence_count: Array.isArray(evidenceCatalog.evidence) ? evidenceCatalog.evidence.length : 0,
    },
    provenance: {
      adapter_id: provenanceCatalog.adapter_id,
      schemaVersion: provenanceCatalog.schemaVersion,
      provenance_count: Array.isArray(provenanceCatalog.provenance) ? provenanceCatalog.provenance.length : 0,
    },
  };
}

function getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog() {
  const gates = clone(READINESS_MATRIX);
  const notReady = gates.filter((gate) => gate.readiness_decision !== READINESS_DECISIONS.READY);

  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    matrix_type: 'local_static_read_only_execution_readiness_review_matrix',
    overall_readiness: notReady.length ? READINESS_DECISIONS.NOT_READY_FOR_EXECUTION : READINESS_DECISIONS.READY,
    execution_allowed_in_matrix: false,
    pdf_read_allowed_in_matrix: false,
    ocr_execution_allowed_in_matrix: false,
    parser_execution_allowed_in_matrix: false,
    calculator_execution_allowed_in_matrix: false,
    banxico_call_allowed_in_matrix: false,
    provider_call_allowed_in_matrix: false,
    test_execution_allowed_in_matrix: false,
    backend_connection_allowed_in_matrix: false,
    quote_write_allowed_in_matrix: false,
    product_intelligence_upstream: true,
    quote_preview_downstream: true,
    required_gate_fields: [...REQUIRED_GATE_FIELDS],
    safe_errors: Object.values(SAFE_ERROR_CODES),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    source_refs: getSourceRefs(),
    gates,
  };
}

function getReadinessGateById(gateId) {
  const match = READINESS_MATRIX.find((gate) => gate.gate_id === gateId);
  return match ? clone(match) : buildReadinessGateSafeError(gateId);
}

function getReadinessGatesByStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return clone(READINESS_MATRIX.filter((gate) => gate.gate_status.toLowerCase() === normalized));
}

function getNotReadyExecutionGates() {
  return clone(READINESS_MATRIX.filter((gate) => gate.readiness_decision !== READINESS_DECISIONS.READY));
}

function getSatisfiedExecutionReadinessGates() {
  return clone(READINESS_MATRIX.filter((gate) => gate.readiness_decision === READINESS_DECISIONS.READY));
}

function getBlockingExecutionReadinessGates() {
  return clone(
    READINESS_MATRIX.filter((gate) =>
      gate.gate_status !== GATE_STATUSES.SATISFIED ||
      gate.readiness_decision !== READINESS_DECISIONS.READY
    )
  );
}

function buildReadinessGateSafeError(gateId, code = SAFE_ERROR_CODES.READINESS_GATE_NOT_MAPPED) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    gate_id: gateId || null,
    gate_status: GATE_STATUSES.DECISION_REQUIRED,
    source_phase: null,
    source_registry_refs: [],
    blocking_reason: ['readiness gate is not mapped'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['map readiness gate before any execution decision'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [code, SAFE_ERROR_CODES.EXECUTION_NOT_READY],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: 'Execution readiness gate is not mapped. Execution is blocked.',
    },
  };
}

function validateReadinessGateShape(gate) {
  const errors = [];

  if (!gate || typeof gate !== 'object') {
    return { ok: false, valid: false, errors: ['readiness_gate_object_required'] };
  }

  for (const field of REQUIRED_GATE_FIELDS) {
    if (!(field in gate)) errors.push(`missing_${field}`);
  }

  if (gate.safety_flags) {
    for (const [key, value] of Object.entries(gate.safety_flags)) {
      if (value !== false) errors.push(`safety_flag_not_false_${key}`);
    }
  }

  const serialized = JSON.stringify(gate);
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
    if (serialized.includes(fragment)) errors.push(`forbidden_true_fragment_${fragment}`);
  }

  return {
    ok: errors.length === 0,
    valid: errors.length === 0,
    errors,
  };
}

function validateReadinessReviewMatrixCatalog(catalog) {
  const errors = [];

  if (!catalog || typeof catalog !== 'object') {
    return { ok: false, valid: false, errors: ['catalog_object_required'] };
  }

  if (catalog.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (catalog.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (catalog.mode !== MODE) errors.push('invalid_mode');
  if (catalog.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');
  if (catalog.overall_readiness !== READINESS_DECISIONS.NOT_READY_FOR_EXECUTION) {
    errors.push('overall_readiness_must_remain_not_ready_for_execution');
  }

  for (const flagName of [
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
    if (catalog[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  for (const [key, value] of Object.entries(catalog.safety_flags || {})) {
    if (value !== false) errors.push(`catalog_safety_flag_not_false_${key}`);
  }

  const gates = Array.isArray(catalog.gates) ? catalog.gates : [];
  if (!gates.length) errors.push('gates_required');

  for (const gate of gates) {
    const result = validateReadinessGateShape(gate);
    if (!result.ok) errors.push(...result.errors.map((error) => `${gate.gate_id || 'unknown'}:${error}`));
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
  GATE_STATUSES,
  READINESS_DECISIONS,
  EXECUTION_POLICIES,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_GATE_FIELDS,
  READINESS_MATRIX,
  getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog,
  getReadinessGateById,
  getReadinessGatesByStatus,
  getNotReadyExecutionGates,
  getSatisfiedExecutionReadinessGates,
  getBlockingExecutionReadinessGates,
  buildReadinessGateSafeError,
  validateReadinessGateShape,
  validateReadinessReviewMatrixCatalog,
};
