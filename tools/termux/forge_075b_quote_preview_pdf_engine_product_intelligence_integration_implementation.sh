#!/usr/bin/env bash
set -euo pipefail

PHASE="075B_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_IMPLEMENTATION"
DECISION="PASS_075B_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_IMPLEMENTATION"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"
NEXT="075C_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_QA_LOCK"
MODE="local/static/read-only implementation"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF execution; no invented product/premium/coverage/projection/quote truth"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/075b-quote-preview-pdf-engine-product-intelligence-integration-implementation-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_075b_quote_preview_pdf_engine_product_intelligence_integration_implementation.sh"

ADAPTER_PATH="platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js"
TEST_PATH="tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js"
ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_IMPLEMENTATION_075B.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_IMPLEMENTATION_075B.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_IMPLEMENTATION_CERTIFICATE_075B.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-implementation-audit-075b.json"

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
fail(){ printf "${RED}HOLD:${RESET} %s\n" "$1"; echo "DECISION=HOLD_${PHASE}" | tee -a "$REPORT"; echo "Reporte: $REPORT" | tee -a "$REPORT"; exit 1; }
run(){ echo; echo "========== RUN =========="; printf '%q ' "$@"; echo; "$@"; }

mkdir -p "$(dirname "$REPORT")"
touch "$REPORT"
exec > >(tee -a "$REPORT") 2>&1

stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=$MODE"
echo "BOUNDARY=$BOUNDARY"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE=Article 0; 075A scoped; 075B implementation local/static/read-only only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

if ! git log --oneline -30 | grep -Eq "075A|scope quote preview pdf engine product intelligence integration|QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_SCOPE"; then
  if [ -f "docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-scope-audit-075a.json" ]; then
    pass "075A audit fallback confirmed"
  else
    fail "075A commit/audit not found"
  fi
else
  pass "075A commit confirmed"
fi

stage "STAGE 2 REQUIRED FILE CHECK"
REQUIRED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-scope-audit-075a.json"
  "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js"
  "tests/quote-preview-product-intelligence-binding-adapter-074b-test.js"
  "platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js"
)

for f in "${REQUIRED_FILES[@]}"; do
  [ -f "$f" ] || fail "Missing required file: $f"
  pass "$f"
done

if [ ! -f "product-intelligence/evidence/forge-quote-pdf-preview-engine.js" ]; then
  warn "Existing PDF preview engine reference file not found; 075B will still reference it as candidate only."
else
  pass "existing PDF preview engine reference confirmed"
fi

stage "STAGE 3 BACKUP"
mkdir -p "$BACKUP_DIR"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md"
[ -f "$ADAPTER_PATH" ] && cp "$ADAPTER_PATH" "$BACKUP_DIR/$(basename "$ADAPTER_PATH").bak" || true
[ -f "$TEST_PATH" ] && cp "$TEST_PATH" "$BACKUP_DIR/$(basename "$TEST_PATH").bak" || true

cat > "$BACKUP_DIR/rollback-075b.sh" <<ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
cp "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
cp "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
cp "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
rm -f "$ADAPTER_PATH"
rm -f "$TEST_PATH"
rm -f "$ARCH_DOC"
rm -f "$EVIDENCE_DOC"
rm -f "$CERT_DOC"
rm -f "$AUDIT_JSON"
rm -f "$SCRIPT_IN_REPO"
echo "rollback 075B complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-075b.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-075b.sh"

stage "STAGE 4 IMPLEMENT ADAPTER"
mkdir -p "$(dirname "$ADAPTER_PATH")"

cat > "$ADAPTER_PATH" <<'NODE'
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
NODE

pass "$ADAPTER_PATH implemented"

stage "STAGE 5 IMPLEMENT TEST"
mkdir -p "$(dirname "$TEST_PATH")"

cat > "$TEST_PATH" <<'NODE'
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
NODE

pass "$TEST_PATH implemented"

stage "STAGE 6 RUN IMPLEMENTATION CHECKS"
run node --check "$ADAPTER_PATH"
run node --check "$TEST_PATH"
run node "$TEST_PATH"

stage "STAGE 7 WRITE DOCS / EVIDENCE"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Product Intelligence Integration Implementation 075B

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

075B implements the local/static/read-only integration adapter scoped in 075A.

The adapter integrates the Quote Preview PDF Engine with the Quote Preview Product Intelligence Binding layer by reference only.

It does not read PDFs, execute parsers, execute calculators, call Banxico, generate quotes, call providers, write data, or create product, premium, coverage, projection, policy, or quote truth.

## Implemented Files

- \`$ADAPTER_PATH\`
- \`$TEST_PATH\`

## Adapter Contract

- \`ADAPTER_ID\`: \`forge.quote_preview.pdf_engine_product_intelligence.integration.adapter.v1\`
- \`SCHEMA_VERSION\`: \`forge.quote_preview.pdf_engine_product_intelligence.integration.v1\`
- \`domainId\`: \`quote_preview_pdf_engine_product_intelligence_integration\`
- \`mode\`: \`read_only\`
- \`routeClass\`: \`preview_safe\`

## Integration Behavior

The adapter:

- requires source document/evidence references before integration;
- calls the 074B binding adapter only as a local/static reference binder;
- keeps Product Intelligence upstream;
- keeps Quote Preview PDF Engine downstream;
- creates a reference extraction plan only;
- blocks PDF read, parser execution, calculator execution, Banxico call, provider call, backend connection, quote write, and real engine execution.

## Safe Errors

- \`QUOTE_PREVIEW_PDF_PRODUCT_INTELLIGENCE_NOT_INTEGRATED\`
- \`QUOTE_PREVIEW_PDF_PRODUCT_FAMILY_NOT_MAPPED\`
- \`QUOTE_PREVIEW_PDF_BINDING_REQUIRED\`
- \`QUOTE_PREVIEW_PDF_SOURCE_EVIDENCE_REQUIRED\`
- \`QUOTE_PREVIEW_PDF_FRESHNESS_REQUIRED\`
- \`QUOTE_PREVIEW_PDF_ENGINE_NOT_MAPPED\`

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview PDF Engine Product Intelligence Integration Implementation 075B

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

075B implemented a local/static/read-only integration adapter between Quote Preview PDF Engine and Product Intelligence binding.

The adapter creates only a reference integration plan. It does not execute PDF reading, OCR, parser engines, calculator engines, Banxico, projection, provider, backend, CRM, policy, quote, pipeline, task, calendar, or message effects.

## Test Evidence

The focused test verifies:

- GMM integrates through Product Intelligence binding.
- Imagina Ser integrates but remains a proven case, not universal architecture.
- Quote Preview PDF Engine remains consumer/reference only.
- Missing product family returns safe integration error.
- Missing source evidence returns safe evidence error.
- Integration shape validates.
- All safety flags are false.
- Blocked effects include PDF read, parser execution, calculator execution, Banxico call, and real engine execution.

## Commands

- \`node --check $ADAPTER_PATH\`
- \`node --check $TEST_PATH\`
- \`node $TEST_PATH\`
- \`python3 -m json.tool $AUDIT_JSON\`
- marker scan
- \`git diff --check\`
- scoped safety scan
- \`git diff --cached --check\`

## Final

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$CERT_DOC" <<EOF
# Forge Quote Preview PDF Engine Product Intelligence Integration Implementation Certificate 075B

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

075B certifies that Forge now has a local/static/read-only Quote Preview PDF Engine Product Intelligence Integration adapter.

Certified behavior:

- integrates Quote Preview PDF Engine with Product Intelligence binding by reference;
- preserves Product Intelligence as upstream semantic authority;
- keeps Quote Preview PDF Engine as downstream consumer/reference only;
- keeps Imagina Ser as a proven case, not universal architecture;
- blocks PDF read, parser execution, calculator execution, Banxico call, provider call, backend connection, quote write, and real engine execution;
- creates no product, premium, coverage, projection, policy, or quote truth.

## No-Effect Boundary

This certificate authorizes no runtime execution and no real effects.

## Final Token

$DECISION
EOF

cat > "$AUDIT_JSON" <<EOF
{
  "phase": "$PHASE",
  "status": "PASS",
  "decision": "$DECISION",
  "lockedDecision": "$LOCKED_DECISION",
  "base": {
    "phase": "075A_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_SCOPE",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_SCOPED"
  },
  "next": "$NEXT",
  "implementation": {
    "adapterPath": "$ADAPTER_PATH",
    "testPath": "$TEST_PATH",
    "adapterId": "forge.quote_preview.pdf_engine_product_intelligence.integration.adapter.v1",
    "schemaVersion": "forge.quote_preview.pdf_engine_product_intelligence.integration.v1",
    "domainId": "quote_preview_pdf_engine_product_intelligence_integration",
    "mode": "read_only",
    "routeClass": "preview_safe",
    "adapterType": "local_static_read_only_reference_integration",
    "quotePreviewPdfEngineRef": "product-intelligence/evidence/forge-quote-pdf-preview-engine.js",
    "bindingAdapterRef": "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js",
    "productIntelligenceAdapterRef": "platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js",
    "pdfRead": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "providerCall": false,
    "backendConnection": false,
    "realEngineExecution": false,
    "quoteWrite": false,
    "inventedTruth": false
  },
  "validatedBehavior": {
    "gmmIntegratesThroughBinding": true,
    "imaginaSerIntegratesButIsNotUniversalArchitecture": true,
    "quotePreviewPdfEngineConsumerReferenceOnly": true,
    "missingFamilySafeError": true,
    "missingEvidenceSafeError": true,
    "integrationShapeValidates": true,
    "allSafetyFlagsFalse": true
  },
  "safeErrors": [
    "QUOTE_PREVIEW_PDF_PRODUCT_INTELLIGENCE_NOT_INTEGRATED",
    "QUOTE_PREVIEW_PDF_PRODUCT_FAMILY_NOT_MAPPED",
    "QUOTE_PREVIEW_PDF_BINDING_REQUIRED",
    "QUOTE_PREVIEW_PDF_SOURCE_EVIDENCE_REQUIRED",
    "QUOTE_PREVIEW_PDF_FRESHNESS_REQUIRED",
    "QUOTE_PREVIEW_PDF_ENGINE_NOT_MAPPED"
  ],
  "safetyFlags": {
    "crmWrite": false,
    "pipelineWrite": false,
    "policyWrite": false,
    "quoteWrite": false,
    "taskCreate": false,
    "calendarCreate": false,
    "messageSend": false,
    "authReal": false,
    "providerRuntime": false,
    "secretAccess": false,
    "browserPersistence": false,
    "realEngineExecution": false,
    "realEffectsAllowed": false,
    "realEffectsEnabled": false,
    "backendConnection": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "pdfRead": false
  },
  "blockedEffects": [
    "pdf_read",
    "pdf_ocr",
    "parser_execute",
    "calculator_execute",
    "banxico_call",
    "projection_execute",
    "premium_calculate_real",
    "coverage_truth_claim",
    "quote_create",
    "quote_update",
    "quote_send",
    "quote_pdf_generate",
    "proposal_generate",
    "provider_call",
    "policy_write",
    "crm_write",
    "pipeline_write",
    "task_create",
    "calendar_create",
    "message_send",
    "auth_runtime",
    "secret_access",
    "browser_persistence",
    "backend_connection",
    "real_engine_execution"
  ],
  "validations": {
    "nodeCheckAdapter": "PASS",
    "nodeCheckTest": "PASS",
    "nodeTest": "PASS",
    "jsonTool": "PASS",
    "markerScan": "PASS",
    "gitDiffCheck": "PASS",
    "scopedSafetyScan": "PASS",
    "stagedDiffCheck": "PASS"
  }
}
EOF

pass "docs/evidence written"

stage "STAGE 8 UPDATE BUILD TREE / ROADMAP"

TREE_BLOCK=$(cat <<EOF

<!-- FORGE:$PHASE:START -->
## 075B Quote Preview PDF Engine Product Intelligence Integration Implementation

075B implements the local/static/read-only integration adapter between Quote Preview PDF Engine and Product Intelligence binding.

Locked decision:
\`$LOCKED_DECISION\`

Implemented surfaces:

- \`$ADAPTER_PATH\`
- \`$TEST_PATH\`

The adapter:

- integrates Quote Preview PDF Engine with Product Intelligence binding by reference;
- keeps Product Intelligence as upstream semantic authority;
- keeps Quote Preview PDF Engine as downstream consumer/reference only;
- creates only a reference extraction plan;
- validates GMM and Imagina Ser integration paths;
- keeps Imagina Ser as a proven case, not universal architecture;
- blocks PDF read, parser execution, calculator execution, Banxico call, provider call, backend connection, quote write, and real engine execution;
- preserves all safety flags as false.

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
<!-- FORGE:$PHASE:END -->
EOF
)

python3 - <<PY
from pathlib import Path

phase = "$PHASE"
block = """$TREE_BLOCK"""

files = [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]

for path in files:
    text = path.read_text()
    marker = f"<!-- FORGE:{phase}:START -->"
    if marker not in text:
        if not text.endswith("\n"):
            text += "\n"
        text += block + "\n"
        path.write_text(text)
PY

pass "build tree / roadmap updated"

stage "STAGE 9 SAVE SCRIPT IN REPO"
mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"
pass "$SCRIPT_IN_REPO"

stage "STAGE 10 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER_PATH"
run node --check "$TEST_PATH"
run node "$TEST_PATH"
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|QUOTE_PREVIEW_PDF_PRODUCT_INTELLIGENCE_NOT_INTEGRATED|QUOTE_PREVIEW_PDF_SOURCE_EVIDENCE_REQUIRED" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" "$ADAPTER_PATH" "$TEST_PATH"

run git diff --check

stage "STAGE 11 SAFETY SCAN"
SCOPED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ARCH_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$AUDIT_JSON"
  "$ADAPTER_PATH"
  "$TEST_PATH"
)

if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true' "${SCOPED_FILES[@]}"; then
  fail "safety scan found prohibited runtime/browser/network marker"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|parserExecution|calculatorExecution|banxicoCall|pdfRead)"?\s*[:=]\s*true\b' "${SCOPED_FILES[@]}"; then
  fail "real-effect flag true found"
fi

if rg -n "require\\(['\"]fs['\"]\\)|readFileSync\\(|pdftotext|Bmx-Token|https\\.request|https\\.get|http\\.request|http\\.get|child_process|execSync\\(" "$ADAPTER_PATH"; then
  fail "adapter contains execution/PDF/network marker"
fi

pass "safety scan clean"

stage "STAGE 12 OPTIONAL SCREENSHOT EVIDENCE"
warn "not applicable: 075B has no UI mutation"

stage "STAGE 13 STAGE AUTHORIZED FILES"
AUTHORIZED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ARCH_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$AUDIT_JSON"
  "$ADAPTER_PATH"
  "$TEST_PATH"
  "$SCRIPT_IN_REPO"
)

git add "${AUTHORIZED_FILES[@]}"

run git diff --cached --name-only
run git diff --cached --check

EXPECTED="$(mktemp)"
ACTUAL="$(mktemp)"
printf "%s\n" "${AUTHORIZED_FILES[@]}" | sort > "$EXPECTED"
git diff --cached --name-only | sort > "$ACTUAL"

if ! diff -u "$EXPECTED" "$ACTUAL"; then
  fail "staged files differ from authorized boundary"
fi

pass "only authorized files staged"

stage "STAGE 14 COMMIT PUSH"
run git commit -m "feat: implement quote preview pdf product intelligence integration"
run git push origin HEAD:main

stage "STAGE 15 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_075B_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_IMPLEMENTATION_COMMIT_PUSH_COMPLETE
DECISION=$DECISION
LOCKED_DECISION=$LOCKED_DECISION
NEXT=$NEXT
BACKUP=$BACKUP_DIR
REPORT=$REPORT
EOF
)

echo
echo "$SUMMARY"

if command -v termux-clipboard-set >/dev/null 2>&1; then
  printf "%s\n" "$SUMMARY" | termux-clipboard-set
  pass "final summary copied to clipboard"
else
  warn "termux-clipboard-set not available; summary not copied"
fi

echo "Reporte: $REPORT"
