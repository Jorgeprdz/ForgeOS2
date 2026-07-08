'use strict';

const bindingAdapter = require('./quote-preview-product-intelligence-binding-adapter-074b.js');

const ADAPTER_ID = 'forge.quote_preview.pdf_engine_product_intelligence.integration.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.pdf_engine_product_intelligence.integration.v1';
const DOMAIN_ID = 'quote_preview_pdf_engine_product_intelligence_integration';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const QUOTE_PREVIEW_PDF_ENGINE_REF = 'product-intelligence/evidence/forge-quote-pdf-preview-engine.js';
const BINDING_ADAPTER_REF = 'platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js';
const PRODUCT_INTELLIGENCE_ADAPTER_REF = 'platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js';

const SAFE_ERROR_CODES = Object.freeze({
  NOT_INTEGRATED: 'QUOTE_PREVIEW_PDF_PRODUCT_INTELLIGENCE_NOT_INTEGRATED',
  PRODUCT_FAMILY_NOT_MAPPED: 'QUOTE_PREVIEW_PDF_PRODUCT_FAMILY_NOT_MAPPED',
  BINDING_REQUIRED: 'QUOTE_PREVIEW_PDF_BINDING_REQUIRED',
  SOURCE_EVIDENCE_REQUIRED: 'QUOTE_PREVIEW_PDF_SOURCE_EVIDENCE_REQUIRED',
  FRESHNESS_REQUIRED: 'QUOTE_PREVIEW_PDF_FRESHNESS_REQUIRED',
  PDF_ENGINE_NOT_MAPPED: 'QUOTE_PREVIEW_PDF_ENGINE_NOT_MAPPED'
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
  parserExecution: false,
  calculatorExecution: false,
  banxicoCall: false,
  pdfRead: false
});

const BLOCKED_EFFECTS = Object.freeze([
  'pdf_read',
  'pdf_ocr',
  'parser_execute',
  'calculator_execute',
  'banxico_call',
  'projection_execute',
  'premium_calculate_real',
  'coverage_truth_claim',
  'quote_create',
  'quote_update',
  'quote_send',
  'quote_pdf_generate',
  'proposal_generate',
  'provider_call',
  'policy_write',
  'crm_write',
  'pipeline_write',
  'task_create',
  'calendar_create',
  'message_send',
  'auth_runtime',
  'secret_access',
  'browser_persistence',
  'backend_connection',
  'real_engine_execution'
]);

const REQUIRED_INTEGRATION_FIELDS = Object.freeze([
  'schemaVersion',
  'domainId',
  'mode',
  'routeClass',
  'quote_preview_pdf_integration_id',
  'quote_preview_request_id',
  'quote_preview_pdf_engine_ref',
  'quote_preview_pdf_engine_role',
  'quote_preview_binding_ref',
  'product_intelligence_ref',
  'product_family',
  'parser_ref',
  'calculator_refs',
  'coverage_semantics_ref',
  'premium_semantics_ref',
  'currency_semantics_ref',
  'projection_semantics_ref',
  'evidence_requirements',
  'freshness_requirements',
  'extraction_plan',
  'blocked_effects',
  'safety_flags',
  'safe_error',
  'audit_event'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return String(value || '').trim();
}

function slug(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'unknown';
}

function getField(object, names) {
  for (const name of names) {
    if (object && Object.prototype.hasOwnProperty.call(object, name) && object[name] != null) {
      return object[name];
    }
  }
  return undefined;
}

function validationOk(result) {
  if (result === true) return true;
  if (result && result.ok === true) return true;
  if (result && result.valid === true) return true;
  if (result && result.isValid === true) return true;
  return false;
}

function normalizeSourceEvidenceRefs(request) {
  const refs = getField(request, ['source_evidence_refs', 'source_evidence_ids', 'sourceEvidenceRefs', 'sourceEvidenceIds']);
  if (Array.isArray(refs)) return refs.filter(Boolean).map(String);
  if (refs) return [String(refs)];
  return [];
}

function buildEvidenceRequirements(request) {
  const sourceDocumentRef = getField(request, ['source_document_ref', 'sourceDocumentRef', 'pdf_ref', 'pdfRef']);
  return {
    source_document_ref: sourceDocumentRef || null,
    source_evidence_refs: normalizeSourceEvidenceRefs(request),
    requires_source_document_ref: true,
    requires_source_evidence_refs: true,
    note: 'PDF source and evidence refs are required before any future parser/PDF execution.'
  };
}

function buildFreshnessRequirements() {
  return {
    freshness_required: true,
    freshness_status: 'preview_static_pending_source_refresh',
    accepted_freshness_sources: [
      'source_document_metadata',
      'product_intelligence_freshness_metadata',
      'binding_freshness_requirements'
    ]
  };
}

function extractBindingSafeError(binding) {
  if (!binding) return null;
  const candidate = getField(binding, ['safe_error', 'safeError', 'error']);
  if (!candidate) return null;
  if (typeof candidate === 'string') return candidate;
  return candidate.code || candidate.errorCode || candidate.safe_error_code || null;
}

function buildQuotePreviewPdfIntegrationError(code, request = {}, message = '') {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    quote_preview_pdf_integration_id: `quote_preview_pdf_pi_integration_error_${slug(code)}_${slug(getField(request, ['quote_preview_request_id', 'quotePreviewRequestId', 'request_id']) || 'missing_request')}`,
    quote_preview_request_id: getField(request, ['quote_preview_request_id', 'quotePreviewRequestId', 'request_id']) || null,
    quote_preview_pdf_engine_ref: QUOTE_PREVIEW_PDF_ENGINE_REF,
    quote_preview_pdf_engine_role: 'consumer_reference_only',
    quote_preview_binding_ref: BINDING_ADAPTER_REF,
    product_intelligence_ref: null,
    product_family: getField(request, ['product_family_hint', 'productFamilyHint', 'product_family', 'productFamily']) || null,
    parser_ref: null,
    calculator_refs: [],
    coverage_semantics_ref: null,
    premium_semantics_ref: null,
    currency_semantics_ref: null,
    projection_semantics_ref: null,
    evidence_requirements: buildEvidenceRequirements(request),
    freshness_requirements: buildFreshnessRequirements(),
    extraction_plan: {
      plan_status: 'blocked',
      reason: code,
      pdf_read_allowed: false,
      parser_execution_allowed: false,
      calculator_execution_allowed: false,
      banxico_call_allowed: false,
      real_engine_execution_allowed: false
    },
    blocked_effects: clone(BLOCKED_EFFECTS),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: message || 'Quote Preview PDF Engine is not integrated with Product Intelligence for this request.'
    },
    audit_event: {
      event_type: 'quote_preview_pdf_product_intelligence_integration_error',
      adapter_id: ADAPTER_ID,
      source_phase: '075B_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_IMPLEMENTATION'
    }
  };
}

function hasSourceEvidence(request) {
  const sourceDocumentRef = getField(request, ['source_document_ref', 'sourceDocumentRef', 'pdf_ref', 'pdfRef']);
  return Boolean(sourceDocumentRef) || normalizeSourceEvidenceRefs(request).length > 0;
}

function getCalculatorRefs(binding) {
  const refs = getField(binding, ['calculator_refs', 'calculatorRefs']);
  if (Array.isArray(refs)) return refs.filter(Boolean).map(String);
  if (refs) return [String(refs)];
  return [];
}

function integrateQuotePreviewPdfEngineWithProductIntelligence(request = {}) {
  const quotePreviewRequestId = getField(request, ['quote_preview_request_id', 'quotePreviewRequestId', 'request_id']) || `quote_preview_request_${slug(getField(request, ['product_family_hint', 'productFamilyHint']) || 'unknown')}`;

  if (!hasSourceEvidence(request)) {
    return buildQuotePreviewPdfIntegrationError(
      SAFE_ERROR_CODES.SOURCE_EVIDENCE_REQUIRED,
      { ...request, quote_preview_request_id: quotePreviewRequestId },
      'Source document or evidence references are required before PDF preview integration.'
    );
  }

  if (!bindingAdapter || typeof bindingAdapter.bindQuotePreviewToProductIntelligence !== 'function') {
    return buildQuotePreviewPdfIntegrationError(
      SAFE_ERROR_CODES.BINDING_REQUIRED,
      { ...request, quote_preview_request_id: quotePreviewRequestId },
      'Quote Preview Product Intelligence binding adapter is required.'
    );
  }

  const bindingRequest = {
    quote_preview_request_id: quotePreviewRequestId,
    product_family_hint: getField(request, ['product_family_hint', 'productFamilyHint', 'product_family', 'productFamily']),
    product_ref_hint: getField(request, ['product_ref_hint', 'productRefHint', 'product_ref', 'productRef']),
    carrier_ref_hint: getField(request, ['carrier_ref_hint', 'carrierRefHint', 'carrier_ref', 'carrierRef']),
    source_document_ref: getField(request, ['source_document_ref', 'sourceDocumentRef', 'pdf_ref', 'pdfRef']),
    source_evidence_refs: normalizeSourceEvidenceRefs(request),
    requested_preview_mode: getField(request, ['requested_preview_mode', 'requestedPreviewMode']) || 'pdf_preview_reference_only'
  };

  const binding = bindingAdapter.bindQuotePreviewToProductIntelligence(bindingRequest);
  const bindingError = extractBindingSafeError(binding);

  if (bindingError) {
    return buildQuotePreviewPdfIntegrationError(
      bindingError === 'QUOTE_PREVIEW_PRODUCT_FAMILY_NOT_MAPPED'
        ? SAFE_ERROR_CODES.PRODUCT_FAMILY_NOT_MAPPED
        : SAFE_ERROR_CODES.NOT_INTEGRATED,
      bindingRequest,
      `Binding adapter returned safe error: ${bindingError}.`
    );
  }

  if (typeof bindingAdapter.validateQuotePreviewBindingShape === 'function') {
    const validation = bindingAdapter.validateQuotePreviewBindingShape(binding);
    if (!validationOk(validation)) {
      return buildQuotePreviewPdfIntegrationError(
        SAFE_ERROR_CODES.BINDING_REQUIRED,
        bindingRequest,
        'Quote Preview Product Intelligence binding shape did not validate.'
      );
    }
  }

  const productFamily = getField(binding, ['product_family', 'productFamily']);
  if (!productFamily) {
    return buildQuotePreviewPdfIntegrationError(
      SAFE_ERROR_CODES.PRODUCT_FAMILY_NOT_MAPPED,
      bindingRequest,
      'Product family was not mapped by binding adapter.'
    );
  }

  const parserRef = getField(binding, ['parser_ref', 'parserRef']);
  const calculatorRefs = getCalculatorRefs(binding);

  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'ok',
    quote_preview_pdf_integration_id: `quote_preview_pdf_pi_integration_${slug(productFamily)}_${slug(quotePreviewRequestId)}`,
    quote_preview_request_id: quotePreviewRequestId,
    quote_preview_pdf_engine_ref: QUOTE_PREVIEW_PDF_ENGINE_REF,
    quote_preview_pdf_engine_role: 'consumer_reference_only',
    quote_preview_binding_ref: BINDING_ADAPTER_REF,
    quote_preview_binding_id: getField(binding, ['quote_preview_binding_id', 'quotePreviewBindingId']) || null,
    product_intelligence_ref: getField(binding, ['product_intelligence_ref', 'productIntelligenceRef']) || PRODUCT_INTELLIGENCE_ADAPTER_REF,
    product_family: productFamily,
    product_role: String(productFamily).toLowerCase() === 'imagina ser'
      ? 'proven_case_not_universal_architecture'
      : 'product_family_reference',
    parser_ref: parserRef || null,
    calculator_refs: calculatorRefs,
    coverage_semantics_ref: getField(binding, ['coverage_semantics_ref', 'coverageSemanticsRef']) || null,
    premium_semantics_ref: getField(binding, ['premium_semantics_ref', 'premiumSemanticsRef']) || null,
    currency_semantics_ref: getField(binding, ['currency_semantics_ref', 'currencySemanticsRef']) || null,
    projection_semantics_ref: getField(binding, ['projection_semantics_ref', 'projectionSemanticsRef']) || null,
    evidence_requirements: buildEvidenceRequirements(bindingRequest),
    freshness_requirements: getField(binding, ['freshness_requirements', 'freshnessRequirements']) || buildFreshnessRequirements(),
    extraction_plan: {
      plan_status: 'reference_plan_only',
      pdf_engine_ref: QUOTE_PREVIEW_PDF_ENGINE_REF,
      parser_ref: parserRef || null,
      calculator_refs: calculatorRefs,
      product_intelligence_first: true,
      pdf_read_allowed: false,
      parser_execution_allowed: false,
      calculator_execution_allowed: false,
      banxico_call_allowed: false,
      provider_call_allowed: false,
      real_engine_execution_allowed: false,
      note: '075B only creates a reference integration plan. Future phases must explicitly authorize any preview parsing.'
    },
    blocked_effects: clone(BLOCKED_EFFECTS),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: null,
    audit_event: {
      event_type: 'quote_preview_pdf_product_intelligence_integration_used',
      adapter_id: ADAPTER_ID,
      source_phase: '075B_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_IMPLEMENTATION'
    }
  };
}

function validateQuotePreviewPdfProductIntelligenceIntegrationShape(integration) {
  const missing = REQUIRED_INTEGRATION_FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(integration || {}, field));
  const flagFailures = Object.entries((integration && integration.safety_flags) || {})
    .filter(([, value]) => value !== false)
    .map(([key]) => key);

  return {
    ok: missing.length === 0 && flagFailures.length === 0,
    missing,
    flagFailures
  };
}

module.exports = {
  ADAPTER_ID,
  SCHEMA_VERSION,
  DOMAIN_ID,
  MODE,
  ROUTE_CLASS,
  QUOTE_PREVIEW_PDF_ENGINE_REF,
  BINDING_ADAPTER_REF,
  PRODUCT_INTELLIGENCE_ADAPTER_REF,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  BLOCKED_EFFECTS,
  REQUIRED_INTEGRATION_FIELDS,
  integrateQuotePreviewPdfEngineWithProductIntelligence,
  buildQuotePreviewPdfIntegrationError,
  validateQuotePreviewPdfProductIntelligenceIntegrationShape
};
