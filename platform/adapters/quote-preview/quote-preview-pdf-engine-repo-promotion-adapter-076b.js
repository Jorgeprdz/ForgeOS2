'use strict';

const ADAPTER_ID = 'forge.quote_preview.pdf_engine.repo_promotion.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.pdf_engine.repo_promotion.v1';
const DOMAIN_ID = 'quote_preview_pdf_engine_repo_promotion';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const PRODUCT_INTELLIGENCE_READ_MODEL_ADAPTER_REF =
  'platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js';

const QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_ADAPTER_REF =
  'platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js';

const QUOTE_PREVIEW_PDF_PRODUCT_INTELLIGENCE_INTEGRATION_ADAPTER_REF =
  'platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js';

const QUOTE_PREVIEW_PDF_ENGINE_REF =
  'product-intelligence/evidence/forge-quote-pdf-preview-engine.js';

const SAFE_ERROR_CODES = Object.freeze({
  PROMOTION_NOT_SCOPED: 'QUOTE_PREVIEW_PDF_ENGINE_PROMOTION_NOT_SCOPED',
  PRODUCT_INTELLIGENCE_BINDING_REQUIRED: 'QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_BINDING_REQUIRED',
  PRODUCT_FAMILY_NOT_MAPPED: 'QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_FAMILY_NOT_MAPPED',
  PARSER_NOT_MAPPED: 'QUOTE_PREVIEW_PDF_ENGINE_PARSER_NOT_MAPPED',
  CALCULATOR_NOT_MAPPED: 'QUOTE_PREVIEW_PDF_ENGINE_CALCULATOR_NOT_MAPPED',
  SOURCE_EVIDENCE_REQUIRED: 'QUOTE_PREVIEW_PDF_ENGINE_SOURCE_EVIDENCE_REQUIRED',
  FRESHNESS_REQUIRED: 'QUOTE_PREVIEW_PDF_ENGINE_FRESHNESS_REQUIRED',
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
  parserExecution: false,
  calculatorExecution: false,
  banxicoCall: false,
});

const REQUIRED_PROMOTION_FIELDS = Object.freeze([
  'quote_preview_pdf_promotion_id',
  'quote_preview_pdf_request_id',
  'product_intelligence_binding_ref',
  'product_intelligence_ref',
  'product_family',
  'source_document_ref',
  'source_evidence_refs',
  'parser_ref',
  'calculator_refs',
  'quote_preview_pdf_engine_ref',
  'evidence_requirements',
  'freshness_requirements',
  'preview_constraints',
  'blocked_effects',
  'safety_flags',
  'safe_error',
]);

const BLOCKED_EFFECTS = Object.freeze([
  'pdf_read',
  'parser_execution',
  'calculator_execution',
  'banxico_call',
  'provider_call',
  'quote_generation',
  'quote_write',
  'quote_send',
  'crm_write',
  'policy_write',
  'pipeline_write',
  'task_create',
  'calendar_create',
  'message_send',
  'backend_connection',
  'real_engine_execution',
  'invented_product_truth',
  'invented_premium_truth',
  'invented_coverage_truth',
  'invented_projection_truth',
  'invented_quote_truth',
]);

const PRODUCT_FAMILY_REFERENCE_MAP = Object.freeze({
  GMM: Object.freeze({
    product_intelligence_ref: 'product_intelligence:gmm',
    parser_ref: 'product-intelligence/evidence/gmm-quote-parser.js',
    calculator_refs: Object.freeze([
      'product-intelligence/coverage/gmm-out-of-pocket-engine.js',
      'gmm-quote-summary-engine.js',
    ]),
    product_notes: Object.freeze(['medical_expense_preview', 'coverage_semantics_reference']),
    universal_architecture: false,
  }),
  'Vida Mujer': Object.freeze({
    product_intelligence_ref: 'product_intelligence:vida_mujer',
    parser_ref: null,
    calculator_refs: Object.freeze([
      'product-intelligence/knowledge/vida-mujer-survival-schedule-engine.js',
      'product-intelligence/knowledge/ave/shared-ave-growth-engine.js',
    ]),
    product_notes: Object.freeze(['life_product_reference', 'requires_source_evidence']),
    universal_architecture: false,
  }),
  AVE: Object.freeze({
    product_intelligence_ref: 'product_intelligence:ave',
    parser_ref: null,
    calculator_refs: Object.freeze([
      'product-intelligence/knowledge/ave/shared-ave-growth-engine.js',
      'product-intelligence/knowledge/ave/shared-ave-portfolio-engine.js',
    ]),
    product_notes: Object.freeze(['ave_reference', 'requires_source_evidence']),
    universal_architecture: false,
  }),
  'Imagina Ser': Object.freeze({
    product_intelligence_ref: 'product_intelligence:imagina_ser',
    parser_ref: 'product-intelligence/evidence/solucionline-retirement-parser.js',
    calculator_refs: Object.freeze([
      'retirement-future-udi-projection-engine.js',
      'imagina-ser-future-mxn-bridge.js',
    ]),
    product_notes: Object.freeze([
      'proven_case',
      'not_universal_architecture',
      'retirement_projection_reference_only',
    ]),
    universal_architecture: false,
  }),
  ORVI: Object.freeze({
    product_intelligence_ref: 'product_intelligence:orvi',
    parser_ref: null,
    calculator_refs: Object.freeze([
      'orvi-decision-engine.js',
      'orvi-mxn-conversion-engine.js',
    ]),
    product_notes: Object.freeze(['candidate_product_specific_reference', 'requires_source_evidence']),
    universal_architecture: false,
  }),
  SeguBeca: Object.freeze({
    product_intelligence_ref: 'product_intelligence:segubeca',
    parser_ref: null,
    calculator_refs: Object.freeze([
      'segu-beca-client-presentation-engine.js',
      'segu-beca-education-comparison-engine.js',
    ]),
    product_notes: Object.freeze(['education_product_reference', 'requires_source_evidence']),
    universal_architecture: false,
  }),
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeProductFamily(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';

  const compact = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const aliases = new Map([
    ['gmm', 'GMM'],
    ['gastos medicos mayores', 'GMM'],
    ['gastos médicos mayores', 'GMM'],
    ['vida mujer', 'Vida Mujer'],
    ['ave', 'AVE'],
    ['imagina ser', 'Imagina Ser'],
    ['imaginaser', 'Imagina Ser'],
    ['orvi', 'ORVI'],
    ['orvi 99', 'ORVI'],
    ['segubeca', 'SeguBeca'],
    ['segu beca', 'SeguBeca'],
    ['segu-beca', 'SeguBeca'],
  ]);

  return aliases.get(compact) || String(value || '').trim();
}

function makeDeterministicId(parts) {
  const clean = parts
    .filter(Boolean)
    .map((part) => String(part).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''))
    .filter(Boolean)
    .join('_');

  return `quote_preview_pdf_engine_promotion_${clean || 'not_modeled'}_076b`;
}

function getQuotePreviewPdfEnginePromotionManifest() {
  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    adapter_type: 'local_static_read_only_reference_promotion_adapter',
    product_intelligence_read_model_adapter_ref: PRODUCT_INTELLIGENCE_READ_MODEL_ADAPTER_REF,
    quote_preview_product_intelligence_binding_adapter_ref: QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_ADAPTER_REF,
    quote_preview_pdf_product_intelligence_integration_adapter_ref:
      QUOTE_PREVIEW_PDF_PRODUCT_INTELLIGENCE_INTEGRATION_ADAPTER_REF,
    quote_preview_pdf_engine_ref: QUOTE_PREVIEW_PDF_ENGINE_REF,
    product_families: Object.keys(PRODUCT_FAMILY_REFERENCE_MAP),
    safe_errors: Object.values(SAFE_ERROR_CODES),
    required_promotion_fields: [...REQUIRED_PROMOTION_FIELDS],
    blocked_effects: [...BLOCKED_EFFECTS],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    promotion_constraints: {
      product_intelligence_binding_required: true,
      product_intelligence_upstream_semantic_authority: true,
      quote_preview_pdf_engine_downstream_consumer_reference_only: true,
      local_static_read_only: true,
      reference_only: true,
      executes_pdf_read: false,
      executes_parser: false,
      executes_calculator: false,
      calls_banxico: false,
      calls_provider: false,
      writes_quote: false,
      creates_quote_truth: false,
    },
  };
}

function buildQuotePreviewPdfEnginePromotionError(request = {}, code = SAFE_ERROR_CODES.PROMOTION_NOT_SCOPED) {
  const productFamily = normalizeProductFamily(
    request.product_family_hint ||
    request.productFamilyHint ||
    request.product_family ||
    request.productFamily
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    quote_preview_pdf_promotion_id: makeDeterministicId([
      request.quote_preview_pdf_request_id || request.quotePreviewPdfRequestId || 'missing',
      productFamily || 'not_mapped',
      'error',
    ]),
    quote_preview_pdf_request_id:
      request.quote_preview_pdf_request_id ||
      request.quotePreviewPdfRequestId ||
      request.quote_preview_request_id ||
      request.quotePreviewRequestId ||
      null,
    product_intelligence_binding_ref: QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_ADAPTER_REF,
    product_intelligence_ref: null,
    product_family: productFamily || null,
    source_document_ref: request.source_document_ref || request.sourceDocumentRef || null,
    source_evidence_refs: request.source_evidence_refs || request.sourceEvidenceRefs || [],
    parser_ref: null,
    calculator_refs: [],
    quote_preview_pdf_engine_ref: QUOTE_PREVIEW_PDF_ENGINE_REF,
    evidence_requirements: {
      source_document_ref_required: true,
      source_evidence_refs_required: true,
      parser_evidence_required: true,
    },
    freshness_requirements: {
      freshness_metadata_required: true,
      status: 'required_before_execution',
    },
    preview_constraints: {
      product_intelligence_binding_required: true,
      reference_only: true,
      no_pdf_read: true,
      no_parser_execution: true,
      no_calculator_execution: true,
      no_banxico_call: true,
      no_quote_truth: true,
    },
    blocked_effects: [...BLOCKED_EFFECTS],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: 'Quote Preview PDF Engine promotion is not available without Product Intelligence-bound references.',
    },
    audit_event: {
      event_type: 'quote_preview_pdf_engine_repo_promotion_safe_error',
      adapter_id: ADAPTER_ID,
      source_phase: '076B',
    },
  };
}

function prepareQuotePreviewPdfEnginePromotionScope(request = {}) {
  const productFamily = normalizeProductFamily(
    request.product_family_hint ||
    request.productFamilyHint ||
    request.product_family ||
    request.productFamily
  );

  if (!productFamily) {
    return buildQuotePreviewPdfEnginePromotionError(
      request,
      SAFE_ERROR_CODES.PRODUCT_INTELLIGENCE_BINDING_REQUIRED
    );
  }

  const familyRef = PRODUCT_FAMILY_REFERENCE_MAP[productFamily];

  if (!familyRef) {
    return buildQuotePreviewPdfEnginePromotionError(
      request,
      SAFE_ERROR_CODES.PRODUCT_FAMILY_NOT_MAPPED
    );
  }

  const sourceEvidenceRefs = request.source_evidence_refs || request.sourceEvidenceRefs || [];

  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'ok',
    quote_preview_pdf_promotion_id: makeDeterministicId([
      request.quote_preview_pdf_request_id || request.quotePreviewPdfRequestId || request.quote_preview_request_id || request.quotePreviewRequestId || 'request',
      productFamily,
    ]),
    quote_preview_pdf_request_id:
      request.quote_preview_pdf_request_id ||
      request.quotePreviewPdfRequestId ||
      request.quote_preview_request_id ||
      request.quotePreviewRequestId ||
      null,
    product_intelligence_binding_ref: {
      binding_adapter_ref: QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_ADAPTER_REF,
      integration_adapter_ref: QUOTE_PREVIEW_PDF_PRODUCT_INTELLIGENCE_INTEGRATION_ADAPTER_REF,
      required: true,
    },
    product_intelligence_ref: familyRef.product_intelligence_ref,
    product_family: productFamily,
    source_document_ref: request.source_document_ref || request.sourceDocumentRef || null,
    source_evidence_refs: Array.isArray(sourceEvidenceRefs) ? [...sourceEvidenceRefs] : [sourceEvidenceRefs],
    parser_ref: familyRef.parser_ref,
    calculator_refs: [...familyRef.calculator_refs],
    quote_preview_pdf_engine_ref: QUOTE_PREVIEW_PDF_ENGINE_REF,
    evidence_requirements: {
      source_document_ref_required: true,
      source_evidence_refs_required: true,
      parser_evidence_required: true,
      evidence_ids_present: Array.isArray(sourceEvidenceRefs) && sourceEvidenceRefs.length > 0,
    },
    freshness_requirements: {
      freshness_metadata_required: true,
      status: 'required_before_execution',
      preview_static_allowed: true,
    },
    preview_constraints: {
      product_intelligence_binding_required: true,
      product_intelligence_upstream_semantic_authority: true,
      quote_preview_pdf_engine_downstream_consumer_reference_only: true,
      product_notes: [...familyRef.product_notes],
      universal_architecture: familyRef.universal_architecture,
      reference_only: true,
      no_pdf_read: true,
      no_parser_execution: true,
      no_calculator_execution: true,
      no_banxico_call: true,
      no_provider_call: true,
      no_quote_write: true,
      no_quote_truth: true,
    },
    blocked_effects: [...BLOCKED_EFFECTS],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: null,
    audit_event: {
      event_type: 'quote_preview_pdf_engine_repo_promotion_prepared',
      adapter_id: ADAPTER_ID,
      source_phase: '076B',
    },
  };
}

function validateQuotePreviewPdfEnginePromotionShape(promotion) {
  const errors = [];

  if (!promotion || typeof promotion !== 'object') {
    return { ok: false, valid: false, errors: ['promotion_object_required'] };
  }

  for (const field of REQUIRED_PROMOTION_FIELDS) {
    if (!(field in promotion)) {
      errors.push(`missing_${field}`);
    }
  }

  if (promotion.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (promotion.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (promotion.mode !== MODE) errors.push('invalid_mode');
  if (promotion.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');

  for (const [key, value] of Object.entries(promotion.safety_flags || {})) {
    if (value !== false) errors.push(`safety_flag_not_false_${key}`);
  }

  const serialized = JSON.stringify(promotion);
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
    if (serialized.includes(fragment)) errors.push(`forbidden_true_fragment_${fragment}`);
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
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_PROMOTION_FIELDS,
  BLOCKED_EFFECTS,
  PRODUCT_FAMILY_REFERENCE_MAP,
  PRODUCT_INTELLIGENCE_READ_MODEL_ADAPTER_REF,
  QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_ADAPTER_REF,
  QUOTE_PREVIEW_PDF_PRODUCT_INTELLIGENCE_INTEGRATION_ADAPTER_REF,
  QUOTE_PREVIEW_PDF_ENGINE_REF,
  getQuotePreviewPdfEnginePromotionManifest,
  prepareQuotePreviewPdfEnginePromotionScope,
  buildQuotePreviewPdfEnginePromotionError,
  validateQuotePreviewPdfEnginePromotionShape,
};
