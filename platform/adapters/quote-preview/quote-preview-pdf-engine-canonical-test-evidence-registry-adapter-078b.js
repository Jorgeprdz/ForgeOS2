'use strict';

const surfaceMapping = require('./quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js');

const ADAPTER_ID = 'forge.quote_preview.pdf_engine.canonical_test_evidence.registry.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.pdf_engine.canonical_test_evidence.registry.v1';
const DOMAIN_ID = 'quote_preview_pdf_engine_canonical_test_evidence';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const EVIDENCE_TYPES = Object.freeze({
  REAL_PDF_OCR: 'real_pdf_ocr',
  REAL_PDF_GMM_PARSER: 'real_pdf_gmm_parser',
  REAL_OR_FIXTURE_GMM_COST_SUMMARY: 'real_or_fixture_gmm_cost_summary',
  REAL_PDF_RETIREMENT_PARSER: 'real_pdf_retirement_parser',
  REAL_PDF_RETIREMENT_PROJECTION: 'real_pdf_retirement_projection',
  IMAGINA_SER_FLOW: 'imagina_ser_flow',
  RATE_CACHE_METADATA: 'rate_cache_metadata',
  DETERMINISTIC_PROJECTION_SMOKE: 'deterministic_projection_smoke',
  PREVIEW_FIXTURE: 'preview_fixture',
  GOVERNANCE_GUARDRAIL: 'governance_guardrail',
});

const CANONICAL_STATUSES = Object.freeze({
  CANONICAL_CANDIDATE: 'canonical_candidate',
  CANONICAL_CANDIDATE_IF_PRESENT: 'canonical_candidate_if_present',
  SUPPORTING_CANDIDATE: 'supporting_candidate',
  FIXTURE_EVIDENCE_ONLY: 'fixture_evidence_only',
  GOVERNANCE_EVIDENCE_ONLY: 'governance_evidence_only',
  SECONDARY_OR_DECISION_REQUIRED: 'secondary_or_decision_required',
  CANONICAL_DECISION_REQUIRED: 'canonical_decision_required',
});

const EXECUTION_POLICIES = Object.freeze({
  NOT_EXECUTED_IN_REGISTRY: 'not_executed_in_registry',
  SAFE_GUARDRAIL_TEST_ONLY: 'safe_guardrail_test_only',
  REQUIRES_FUTURE_RUNTIME_GATE: 'requires_future_runtime_gate',
  REQUIRES_FIXTURE_PROVENANCE_REVIEW: 'requires_fixture_provenance_review',
  REQUIRES_EXPECTED_VALUE_PROVENANCE_REVIEW: 'requires_expected_value_provenance_review',
});

const SAFE_ERROR_CODES = Object.freeze({
  TEST_EVIDENCE_NOT_MAPPED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_NOT_MAPPED',
  TEST_EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_EXECUTION_NOT_AUTHORIZED',
  PDF_READ_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_PDF_READ_NOT_AUTHORIZED',
  PARSER_EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_PARSER_EXECUTION_NOT_AUTHORIZED',
  CALCULATOR_EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_CALCULATOR_EXECUTION_NOT_AUTHORIZED',
  BANXICO_CALL_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_BANXICO_CALL_NOT_AUTHORIZED',
  FIXTURE_NOT_REAL_PDF_EVIDENCE: 'QUOTE_PREVIEW_PDF_FIXTURE_NOT_REAL_PDF_EVIDENCE',
  GOVERNANCE_NOT_EXTRACTION_PROOF: 'QUOTE_PREVIEW_PDF_GOVERNANCE_NOT_EXTRACTION_PROOF',
  INVENTED_EXPECTED_VALUES_BLOCKED: 'QUOTE_PREVIEW_PDF_INVENTED_EXPECTED_VALUES_BLOCKED',
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

const REQUIRED_TEST_EVIDENCE_FIELDS = Object.freeze([
  'test_id',
  'file_path',
  'evidence_type',
  'product_family',
  'source_surface_refs',
  'engine_refs',
  'fixture_refs',
  'canonical_candidate',
  'canonical_status',
  'evidence_role',
  'execution_policy',
  'blocked_growth',
  'safe_errors',
  'safety_flags',
]);

function freezeEvidence(evidence) {
  return Object.freeze({
    ...evidence,
    product_family: Object.freeze([...(evidence.product_family || [])]),
    source_surface_refs: Object.freeze([...(evidence.source_surface_refs || [])]),
    engine_refs: Object.freeze([...(evidence.engine_refs || [])]),
    fixture_refs: Object.freeze([...(evidence.fixture_refs || [])]),
    blocked_growth: Object.freeze([...(evidence.blocked_growth || [])]),
    safe_errors: Object.freeze([...(evidence.safe_errors || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(evidence.safety_flags || {}) }),
  });
}

const CANONICAL_TEST_EVIDENCE_REGISTRY = Object.freeze([
  freezeEvidence({
    test_id: 'real_pdf_ocr_solucionline_candidate',
    file_path: 'tests/real-pdf-ocr-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_PDF_OCR,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['pdf_extraction_policy_ocr_engine'],
    engine_refs: ['policy-operations/evidence/policy-ocr-engine.js'],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_CANDIDATE_IF_PRESENT,
    evidence_role: 'candidate canonical real PDF/OCR evidence for local extraction',
    execution_policy: EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY,
    blocked_growth: ['invented_expected_values', 'parser_ownership', 'calculator_ownership', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'real_gmm_quote_candidate',
    file_path: 'tests/real-gmm-quote-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_PDF_GMM_PARSER,
    product_family: ['GMM'],
    source_surface_refs: ['pdf_extraction_policy_ocr_engine', 'parser_gmm_quote'],
    engine_refs: [
      'policy-operations/evidence/policy-ocr-engine.js',
      'product-intelligence/evidence/gmm-quote-parser.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_CANDIDATE_IF_PRESENT,
    evidence_role: 'candidate canonical GMM real quote parser evidence',
    execution_policy: EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY,
    blocked_growth: ['summary_ownership', 'invented_expected_values', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'gmm_out_of_pocket_candidate',
    file_path: 'tests/gmm-out-of-pocket-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_OR_FIXTURE_GMM_COST_SUMMARY,
    product_family: ['GMM'],
    source_surface_refs: ['parser_gmm_quote', 'summary_gmm_quote'],
    engine_refs: [
      'product-intelligence/evidence/gmm-quote-parser.js',
      'gmm-quote-summary-engine.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: 'candidate GMM out-of-pocket evidence after expected-value provenance review',
    execution_policy: EXECUTION_POLICIES.REQUIRES_EXPECTED_VALUE_PROVENANCE_REVIEW,
    blocked_growth: ['invented_expected_values', 'quote_truth_creation', 'summary_parser_boundary_drift'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'real_retirement_scenario_candidate',
    file_path: 'tests/real-retirement-scenario-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PARSER,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['parser_solucionline_retirement', 'pdf_preview_forge_quote_pdf_preview_engine'],
    engine_refs: [
      'product-intelligence/evidence/solucionline-retirement-parser.js',
      'product-intelligence/evidence/forge-quote-pdf-preview-engine.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: 'candidate retirement/Solucionline parser evidence after parser ownership decision',
    execution_policy: EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY,
    blocked_growth: ['parallel_parser_growth_before_decision', 'invented_expected_values', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'real_retirement_mxn_scenario_candidate',
    file_path: 'tests/real-retirement-mxn-scenario-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PROJECTION,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['parser_solucionline_retirement', 'calculator_retirement_future_udi_projection', 'bridge_imagina_ser_future_mxn'],
    engine_refs: [
      'product-intelligence/evidence/solucionline-retirement-parser.js',
      'retirement-future-udi-projection-engine.js',
      'imagina-ser-future-mxn-bridge.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: 'candidate retirement MXN projection evidence after UDI/MXN provenance review',
    execution_policy: EXECUTION_POLICIES.REQUIRES_EXPECTED_VALUE_PROVENANCE_REVIEW,
    blocked_growth: ['invented_projection_values', 'calculator_duplication', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'imagina_ser_master_candidate',
    file_path: 'imagina-ser-master-test.js',
    evidence_type: EVIDENCE_TYPES.IMAGINA_SER_FLOW,
    product_family: ['Imagina Ser'],
    source_surface_refs: ['bridge_imagina_ser_future_mxn', 'rates_exchange_rate_cache'],
    engine_refs: [
      'imagina-ser-future-mxn-bridge.js',
      'retirement-future-udi-projection-engine.js',
      'exchange-rate-cache-engine.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: 'candidate Imagina Ser flow evidence after provider/cache boundary review',
    execution_policy: EXECUTION_POLICIES.REQUIRES_FUTURE_RUNTIME_GATE,
    blocked_growth: ['provider_runtime_without_gate', 'invented_expected_values', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'imagina_ser_banxico_integration_candidate',
    file_path: 'imagina-ser-banxico-integration-test.js',
    evidence_type: EVIDENCE_TYPES.RATE_CACHE_METADATA,
    product_family: ['Imagina Ser'],
    source_surface_refs: ['rates_exchange_rate_cache', 'rates_shared_banxico_direct', 'rates_shared_banxico_edge_provider'],
    engine_refs: [
      'exchange-rate-cache-engine.js',
      'shared-banxico-rate-engine.js',
      'shared-banxico-edge-provider.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.SECONDARY_OR_DECISION_REQUIRED,
    evidence_role: 'rate/cache evidence candidate; runtime/provider execution requires later gate',
    execution_policy: EXECUTION_POLICIES.REQUIRES_FUTURE_RUNTIME_GATE,
    blocked_growth: ['provider_runtime_without_gate', 'secret_access', 'network_call_without_gate'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED,
    ],
  }),
  freezeEvidence({
    test_id: 'retirement_future_udi_projection_smoke_candidate',
    file_path: 'retirement-future-udi-projection-smoke-test.js',
    evidence_type: EVIDENCE_TYPES.DETERMINISTIC_PROJECTION_SMOKE,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['calculator_retirement_future_udi_projection'],
    engine_refs: ['retirement-future-udi-projection-engine.js'],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.SUPPORTING_CANDIDATE,
    evidence_role: 'supporting deterministic UDI projection evidence after input provenance review',
    execution_policy: EXECUTION_POLICIES.REQUIRES_EXPECTED_VALUE_PROVENANCE_REVIEW,
    blocked_growth: ['invented_projection_values', 'calculator_duplication'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'quote_pdf_preview_fixture_candidate',
    file_path: 'tests/product-intelligence/forge-quote-pdf-preview-engine-test.js',
    evidence_type: EVIDENCE_TYPES.PREVIEW_FIXTURE,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['pdf_preview_forge_quote_pdf_preview_engine'],
    engine_refs: ['product-intelligence/evidence/forge-quote-pdf-preview-engine.js'],
    fixture_refs: ['text_fixture'],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.FIXTURE_EVIDENCE_ONLY,
    evidence_role: 'preview fixture evidence only; not proof of real PDF/OCR extraction',
    execution_policy: EXECUTION_POLICIES.REQUIRES_FIXTURE_PROVENANCE_REVIEW,
    blocked_growth: ['misclassified_as_real_pdf_evidence', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.FIXTURE_NOT_REAL_PDF_EVIDENCE,
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
    ],
  }),
  freezeEvidence({
    test_id: 'repo_promotion_guardrail_candidate',
    file_path: 'tests/quote-preview-pdf-engine-repo-promotion-adapter-076b-test.js',
    evidence_type: EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL,
    product_family: ['GMM', 'Vida Mujer', 'AVE', 'Imagina Ser', 'ORVI', 'SeguBeca'],
    source_surface_refs: ['quote_preview_pdf_engine_repo_promotion_adapter_076b'],
    engine_refs: ['platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js'],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY,
    evidence_role: 'governance evidence only; validates no-effect promotion guardrail, not extraction',
    execution_policy: EXECUTION_POLICIES.SAFE_GUARDRAIL_TEST_ONLY,
    blocked_growth: ['misclassified_as_extraction_proof', 'parser_execution', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.GOVERNANCE_NOT_EXTRACTION_PROOF,
    ],
  }),
  freezeEvidence({
    test_id: 'existing_surfaces_mapping_guardrail_candidate',
    file_path: 'tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js',
    evidence_type: EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL,
    product_family: ['GMM', 'Vida Mujer', 'AVE', 'Imagina Ser', 'ORVI', 'SeguBeca'],
    source_surface_refs: ['quote_preview_pdf_engine_existing_surfaces_canonical_mapping'],
    engine_refs: ['platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js'],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY,
    evidence_role: 'governance evidence only; validates reference catalog shape, not extraction',
    execution_policy: EXECUTION_POLICIES.SAFE_GUARDRAIL_TEST_ONLY,
    blocked_growth: ['misclassified_as_extraction_proof', 'misclassified_as_parser_proof', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.GOVERNANCE_NOT_EXTRACTION_PROOF,
    ],
  }),
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSurfaceCatalog() {
  return surfaceMapping.getQuotePreviewPdfExistingSurfacesCanonicalMappingCatalog();
}

function getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog() {
  const surfacesCatalog = getSurfaceCatalog();

  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    registry_type: 'local_static_read_only_canonical_test_evidence_registry',
    execution_allowed_in_registry: false,
    real_pdf_tests_executed_in_registry: false,
    parser_tests_executed_in_registry: false,
    calculator_tests_executed_in_registry: false,
    banxico_tests_executed_in_registry: false,
    provider_tests_executed_in_registry: false,
    product_intelligence_upstream: true,
    quote_preview_downstream: true,
    required_test_evidence_fields: [...REQUIRED_TEST_EVIDENCE_FIELDS],
    safe_errors: Object.values(SAFE_ERROR_CODES),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    surface_catalog_ref: {
      adapter_id: surfacesCatalog.adapter_id,
      schemaVersion: surfacesCatalog.schemaVersion,
      surface_count: Array.isArray(surfacesCatalog.surfaces) ? surfacesCatalog.surfaces.length : 0,
    },
    evidence: clone(CANONICAL_TEST_EVIDENCE_REGISTRY),
  };
}

function getCanonicalTestEvidenceById(testId) {
  const match = CANONICAL_TEST_EVIDENCE_REGISTRY.find((entry) => entry.test_id === testId);
  return match ? clone(match) : buildCanonicalTestEvidenceSafeError(testId);
}

function getCanonicalTestEvidenceByPath(filePath) {
  const match = CANONICAL_TEST_EVIDENCE_REGISTRY.find((entry) => entry.file_path === filePath);
  return match ? clone(match) : buildCanonicalTestEvidenceSafeError(filePath);
}

function getCanonicalTestEvidenceByProductFamily(productFamily) {
  const normalized = String(productFamily || '').trim().toLowerCase();
  return clone(
    CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) =>
      entry.product_family.some((family) => String(family).trim().toLowerCase() === normalized)
    )
  );
}

function getCanonicalTestEvidenceByEvidenceType(evidenceType) {
  const normalized = String(evidenceType || '').trim().toLowerCase();
  return clone(CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) => entry.evidence_type.toLowerCase() === normalized));
}

function getCanonicalDecisionRequiredTestEvidence() {
  return clone(
    CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) =>
      [
        CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
        CANONICAL_STATUSES.SECONDARY_OR_DECISION_REQUIRED,
      ].includes(entry.canonical_status)
    )
  );
}

function getFixtureOnlyTestEvidence() {
  return clone(CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) => entry.evidence_type === EVIDENCE_TYPES.PREVIEW_FIXTURE));
}

function getGovernanceOnlyTestEvidence() {
  return clone(CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) => entry.evidence_type === EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL));
}

function buildCanonicalTestEvidenceSafeError(testId, code = SAFE_ERROR_CODES.TEST_EVIDENCE_NOT_MAPPED) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    test_id: testId || null,
    file_path: null,
    evidence_type: null,
    product_family: [],
    source_surface_refs: [],
    engine_refs: [],
    fixture_refs: [],
    canonical_candidate: false,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: null,
    execution_policy: EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY,
    blocked_growth: ['new_test_creation_before_catalog_decision'],
    safe_errors: [code, SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: 'Canonical test evidence is not mapped. New test/evidence creation is blocked before catalog decision.',
    },
  };
}

function validateCanonicalTestEvidenceShape(entry) {
  const errors = [];

  if (!entry || typeof entry !== 'object') {
    return { ok: false, valid: false, errors: ['test_evidence_object_required'] };
  }

  for (const field of REQUIRED_TEST_EVIDENCE_FIELDS) {
    if (!(field in entry)) errors.push(`missing_${field}`);
  }

  if (entry.safety_flags) {
    for (const [key, value] of Object.entries(entry.safety_flags)) {
      if (value !== false) errors.push(`safety_flag_not_false_${key}`);
    }
  }

  const serialized = JSON.stringify(entry);
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

function validateCanonicalTestEvidenceRegistryCatalog(catalog) {
  const errors = [];

  if (!catalog || typeof catalog !== 'object') {
    return { ok: false, valid: false, errors: ['catalog_object_required'] };
  }

  if (catalog.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (catalog.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (catalog.mode !== MODE) errors.push('invalid_mode');
  if (catalog.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');

  for (const flagName of [
    'execution_allowed_in_registry',
    'real_pdf_tests_executed_in_registry',
    'parser_tests_executed_in_registry',
    'calculator_tests_executed_in_registry',
    'banxico_tests_executed_in_registry',
    'provider_tests_executed_in_registry',
  ]) {
    if (catalog[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  for (const [key, value] of Object.entries(catalog.safety_flags || {})) {
    if (value !== false) errors.push(`catalog_safety_flag_not_false_${key}`);
  }

  const evidence = Array.isArray(catalog.evidence) ? catalog.evidence : [];
  if (!evidence.length) errors.push('evidence_required');

  for (const entry of evidence) {
    const result = validateCanonicalTestEvidenceShape(entry);
    if (!result.ok) errors.push(...result.errors.map((error) => `${entry.test_id || 'unknown'}:${error}`));
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
  EVIDENCE_TYPES,
  CANONICAL_STATUSES,
  EXECUTION_POLICIES,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_TEST_EVIDENCE_FIELDS,
  CANONICAL_TEST_EVIDENCE_REGISTRY,
  getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog,
  getCanonicalTestEvidenceById,
  getCanonicalTestEvidenceByPath,
  getCanonicalTestEvidenceByProductFamily,
  getCanonicalTestEvidenceByEvidenceType,
  getCanonicalDecisionRequiredTestEvidence,
  getFixtureOnlyTestEvidence,
  getGovernanceOnlyTestEvidence,
  buildCanonicalTestEvidenceSafeError,
  validateCanonicalTestEvidenceShape,
  validateCanonicalTestEvidenceRegistryCatalog,
};
