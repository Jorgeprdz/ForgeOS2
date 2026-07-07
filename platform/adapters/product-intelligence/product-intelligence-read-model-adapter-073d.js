export const ADAPTER_ID = 'forge.product_intelligence.read_model.adapter.v1';
export const SCHEMA_VERSION = 'forge.product_intelligence.read_model.v1';

export const SAFE_ERROR_CODES = Object.freeze({
  notModeled: 'PRODUCT_INTELLIGENCE_READ_MODEL_NOT_MODELED',
  sourceEvidenceRequired: 'PRODUCT_INTELLIGENCE_SOURCE_EVIDENCE_REQUIRED',
  freshnessRequired: 'PRODUCT_INTELLIGENCE_FRESHNESS_REQUIRED',
  productFamilyNotMapped: 'PRODUCT_INTELLIGENCE_PRODUCT_FAMILY_NOT_MAPPED',
  calculatorNotMapped: 'PRODUCT_INTELLIGENCE_CALCULATOR_NOT_MAPPED'
});

export const DEFAULT_SAFETY_FLAGS = Object.freeze({
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
  backendConnection: false
});

export const PRODUCT_FAMILIES = Object.freeze([
  'GMM',
  'Vida Mujer',
  'AVE',
  'Imagina Ser',
  'ORVI',
  'SeguBeca'
]);

export const REQUIRED_FIELDS = Object.freeze([
  'product_intelligence_id',
  'product_ref',
  'product_identity',
  'product_family',
  'carrier_ref',
  'market_ref',
  'source_module_refs',
  'parser_refs',
  'calculator_refs',
  'coverage_semantics',
  'premium_semantics',
  'currency_semantics',
  'projection_semantics',
  'quote_semantics',
  'policy_semantics',
  'evidence_refs',
  'freshness_metadata',
  'source_ownership',
  'confidence_state',
  'unknown_state',
  'blocked_state',
  'not_modeled_state',
  'adapter_refs',
  'audit_event',
  'blocked_effects',
  'safety_flags'
]);

const BLOCKED_EFFECTS = Object.freeze([
  'product_truth_create',
  'premium_calculate_real',
  'coverage_truth_claim',
  'projection_execute_real',
  'quote_create',
  'quote_update',
  'quote_send',
  'policy_write',
  'crm_write',
  'pipeline_write',
  'task_create',
  'calendar_create',
  'message_send',
  'provider_call',
  'banxico_call',
  'pdf_read',
  'secret_access',
  'browser_persistence',
  'backend_connection',
  'real_engine_execution'
]);

const DEFAULT_FRESHNESS = Object.freeze({
  status: 'preview_static',
  source: '073D local static reference catalog',
  checked_at: null
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeRefs(paths) {
  return paths.map((path) => ({
    ref: path,
    ref_type: 'string_path_only',
    imported: false,
    executed: false
  }));
}

function makeSemantics(summary, mapped = []) {
  return {
    status: mapped.length ? 'mapped_by_reference' : 'not_modeled',
    summary,
    mapped_refs: clone(mapped),
    truth_claimed: false,
    evidence_required: true
  };
}

function makeProductRecord(config) {
  const familyKey = config.family.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const sourceModuleRefs = makeRefs(config.sourceModules);
  const parserRefs = makeRefs(config.parsers);
  const calculatorRefs = makeRefs(config.calculators);
  const adapterRefs = makeRefs(config.adapters);
  const evidenceRefs = config.evidence.map((ref) => ({
    evidence_id: ref,
    mode: 'preview_static_reference',
    source_ownership_required: true
  }));

  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    domainId: 'product_intelligence',
    mode: 'read_only',
    routeClass: 'preview_safe',
    product_intelligence_id: `product_intelligence_preview_${familyKey}_073d`,
    product_ref: {
      family: config.family,
      product_names: clone(config.productNames),
      canonical_truth_claimed: false
    },
    product_identity: {
      label: config.label,
      universal_architecture: false,
      proven_case_only: config.family === 'Imagina Ser',
      source_ownership_required: true
    },
    product_family: config.family,
    carrier_ref: {
      status: 'source_owner_pending',
      display_name: config.carrier,
      truth_claimed: false
    },
    market_ref: {
      country: 'MX',
      currency_context: config.currencyContext,
      truth_claimed: false
    },
    source_module_refs: sourceModuleRefs,
    parser_refs: parserRefs,
    calculator_refs: calculatorRefs,
    coverage_semantics: makeSemantics(config.coverageSummary, config.coverageRefs),
    premium_semantics: makeSemantics(config.premiumSummary, config.premiumRefs),
    currency_semantics: makeSemantics(config.currencySummary, config.currencyRefs),
    projection_semantics: makeSemantics(config.projectionSummary, config.projectionRefs),
    quote_semantics: {
      status: 'consumer_reference_only',
      summary: 'Quote PDF preview may consume Product Intelligence; it is not authority.',
      quote_pdf_preview_role: 'consumer_reference_only',
      mapped_refs: makeRefs(['product-intelligence/evidence/forge-quote-pdf-preview-engine.js']),
      truth_claimed: false,
      evidence_required: true
    },
    policy_semantics: makeSemantics(config.policySummary, config.policyRefs),
    evidence_refs: evidenceRefs,
    freshness_metadata: clone(DEFAULT_FRESHNESS),
    source_ownership: {
      status: 'pending_canonical_source_mapping',
      owner_required_before_truth: true,
      product_schema_or_ontology_first: true
    },
    confidence_state: {
      status: 'candidate_reference',
      confidence: 'not_scored',
      reason: '073D references known modules without executing them.'
    },
    unknown_state: {
      status: 'preserve_unknowns',
      unknowns: clone(config.unknowns)
    },
    blocked_state: {
      status: 'blocked_effects_declared',
      blocked_effects: clone(BLOCKED_EFFECTS)
    },
    not_modeled_state: {
      status: 'safe_not_modeled',
      error_code: SAFE_ERROR_CODES.notModeled
    },
    adapter_refs: adapterRefs,
    audit_event: 'read_model_used',
    blocked_effects: clone(BLOCKED_EFFECTS),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS)
  });
}

const PRODUCT_RECORDS = Object.freeze([
  makeProductRecord({
    family: 'GMM',
    label: 'Gastos Medicos Mayores product intelligence',
    productNames: ['Alfa Medical', 'Alfa Medical Flex', 'Alfa Medical Internacional'],
    carrier: 'carrier pending evidence',
    currencyContext: 'MXN preview context',
    sourceModules: [
      'product-intelligence/coverage/coverage-intelligence-orchestrator.js',
      'product-intelligence/coverage/gmm-out-of-pocket-engine.js',
      'gmm-quote-summary-engine.js'
    ],
    parsers: ['product-intelligence/evidence/gmm-quote-parser.js'],
    calculators: ['product-intelligence/coverage/gmm-out-of-pocket-engine.js'],
    adapters: ['platform/adapters/quote-read-model/quote-read-model-adapter-069c.js'],
    evidence: ['product_intelligence_evidence_gmm_073d'],
    coverageSummary: 'GMM coverage semantics are referenced from coverage intelligence modules.',
    premiumSummary: 'Premium semantics are preview-only and must stay evidence-backed.',
    currencySummary: 'MXN context only; no Banxico call.',
    projectionSummary: 'No GMM projection truth modeled in 073D.',
    policySummary: 'Policy semantics consumed from Policy Read Model, not owned here.',
    coverageRefs: makeRefs(['product-intelligence/coverage/coverage-intelligence-orchestrator.js']),
    premiumRefs: makeRefs(['gmm-quote-summary-engine.js']),
    currencyRefs: [],
    projectionRefs: [],
    policyRefs: makeRefs(['platform/adapters/policy-read-model/policy-read-model-adapter-068b.js']),
    unknowns: ['canonical carrier source', 'contractual coverage truth', 'binding premium']
  }),
  makeProductRecord({
    family: 'Vida Mujer',
    label: 'Vida Mujer product intelligence',
    productNames: ['Vida Mujer'],
    carrier: 'carrier pending evidence',
    currencyContext: 'MXN preview context',
    sourceModules: [
      'vida-mujer-knowledge-extractor.js',
      'vida-mujer-client-presentation-engine.js',
      'product-intelligence/coverage/vida-mujer-coverage-status-engine.js'
    ],
    parsers: ['vida-mujer-knowledge-extractor.js'],
    calculators: ['product-intelligence/knowledge/vida-mujer-survival-schedule-engine.js'],
    adapters: [],
    evidence: ['product_intelligence_evidence_vida_mujer_073d'],
    coverageSummary: 'Vida Mujer coverage semantics are referenced from coverage/status knowledge surfaces.',
    premiumSummary: 'Premium semantics are not treated as source truth in 073D.',
    currencySummary: 'MXN context only; no rate execution.',
    projectionSummary: 'Survival schedule is referenced only by path.',
    policySummary: 'Policy linkage remains read-only and source-evidence dependent.',
    coverageRefs: makeRefs(['product-intelligence/coverage/vida-mujer-coverage-status-engine.js']),
    premiumRefs: [],
    currencyRefs: [],
    projectionRefs: makeRefs(['product-intelligence/knowledge/vida-mujer-survival-schedule-engine.js']),
    policyRefs: [],
    unknowns: ['premium source owner', 'coverage contractual truth', 'policy evidence link']
  }),
  makeProductRecord({
    family: 'AVE',
    label: 'AVE product intelligence',
    productNames: ['AVE'],
    carrier: 'carrier pending evidence',
    currencyContext: 'MXN/portfolio context pending source ownership',
    sourceModules: [
      'product-intelligence/knowledge/ave/shared-ave-eligibility-engine.js',
      'product-intelligence/knowledge/ave/shared-ave-growth-engine.js',
      'product-intelligence/knowledge/ave/shared-ave-portfolio-engine.js'
    ],
    parsers: [],
    calculators: [
      'product-intelligence/knowledge/ave/shared-ave-growth-engine.js',
      'product-intelligence/knowledge/ave/shared-ave-portfolio-engine.js'
    ],
    adapters: [],
    evidence: ['product_intelligence_evidence_ave_073d'],
    coverageSummary: 'AVE benefit semantics are referenced from AVE knowledge engines.',
    premiumSummary: 'Premium semantics remain not modeled.',
    currencySummary: 'Currency/portfolio semantics pending evidence.',
    projectionSummary: 'Growth semantics referenced only; no projection execution.',
    policySummary: 'Policy semantics not modeled in 073D.',
    coverageRefs: makeRefs(['product-intelligence/knowledge/ave/shared-ave-death-benefit-engine.js']),
    premiumRefs: [],
    currencyRefs: [],
    projectionRefs: makeRefs(['product-intelligence/knowledge/ave/shared-ave-growth-engine.js']),
    policyRefs: [],
    unknowns: ['canonical product schema', 'portfolio source ownership', 'projection evidence']
  }),
  makeProductRecord({
    family: 'Imagina Ser',
    label: 'Imagina Ser product intelligence proven case',
    productNames: ['Imagina Ser'],
    carrier: 'carrier pending evidence',
    currencyContext: 'UDI/MXN preview context',
    sourceModules: [
      'imagina-ser-retirement-fund-engine.js',
      'imagina-ser-future-mxn-bridge.js',
      'product-intelligence/evidence/solucionline-retirement-parser.js'
    ],
    parsers: ['product-intelligence/evidence/solucionline-retirement-parser.js'],
    calculators: [
      'retirement-future-udi-projection-engine.js',
      'future-currency-value-engine.js',
      'shared-currency-projection-engine.js'
    ],
    adapters: [],
    evidence: ['product_intelligence_evidence_imagina_ser_073d'],
    coverageSummary: 'Retirement/education semantics are product-specific, not universal architecture.',
    premiumSummary: 'Contribution/premium semantics remain evidence-backed references only.',
    currencySummary: 'UDI/MXN semantics reference shared currency engines without execution.',
    projectionSummary: 'Future-value calculators are referenced only by path.',
    policySummary: 'Policy semantics remain outside Product Intelligence truth.',
    coverageRefs: [],
    premiumRefs: makeRefs(['imagina-ser-contribution-engine.js']),
    currencyRefs: makeRefs(['future-currency-value-engine.js', 'shared-banxico-rate-engine.js']),
    projectionRefs: makeRefs(['retirement-future-udi-projection-engine.js']),
    policyRefs: [],
    unknowns: ['current UDI truth', 'future rate assumptions', 'binding projection status']
  }),
  makeProductRecord({
    family: 'ORVI',
    label: 'ORVI product intelligence',
    productNames: ['ORVI'],
    carrier: 'carrier pending evidence',
    currencyContext: 'MXN/value timeline preview context',
    sourceModules: [
      'orvi-decision-engine.js',
      'orvi-guaranteed-value-timeline-engine.js',
      'orvi-mxn-conversion-engine.js'
    ],
    parsers: ['orvi-ocr-extractor.js'],
    calculators: ['orvi-guaranteed-value-timeline-engine.js', 'orvi-mxn-conversion-engine.js'],
    adapters: [],
    evidence: ['product_intelligence_evidence_orvi_073d'],
    coverageSummary: 'ORVI value/timeline semantics are candidate references.',
    premiumSummary: 'Premium semantics are not modeled as truth.',
    currencySummary: 'MXN conversion is referenced only.',
    projectionSummary: 'Guaranteed-value timeline is referenced only.',
    policySummary: 'Policy truth remains external.',
    coverageRefs: [],
    premiumRefs: [],
    currencyRefs: makeRefs(['orvi-mxn-conversion-engine.js']),
    projectionRefs: makeRefs(['orvi-guaranteed-value-timeline-engine.js']),
    policyRefs: [],
    unknowns: ['source owner', 'contractual guarantee truth', 'current policy linkage']
  }),
  makeProductRecord({
    family: 'SeguBeca',
    label: 'SeguBeca product intelligence',
    productNames: ['SeguBeca'],
    carrier: 'carrier pending evidence',
    currencyContext: 'education cost preview context',
    sourceModules: ['product-intelligence/knowledge/shared-education-cost-engine.js'],
    parsers: [],
    calculators: ['product-intelligence/knowledge/shared-education-cost-engine.js'],
    adapters: [],
    evidence: ['product_intelligence_evidence_segubeca_073d'],
    coverageSummary: 'Education product semantics require future product-specific mapping.',
    premiumSummary: 'Premium semantics are not modeled.',
    currencySummary: 'Education cost context is referenced only.',
    projectionSummary: 'Education cost calculator is referenced only.',
    policySummary: 'Policy truth remains external.',
    coverageRefs: [],
    premiumRefs: [],
    currencyRefs: [],
    projectionRefs: makeRefs(['product-intelligence/knowledge/shared-education-cost-engine.js']),
    policyRefs: [],
    unknowns: ['product-specific parser', 'carrier source owner', 'projection assumptions']
  })
]);

export function getProductIntelligenceReadModelCatalog() {
  return {
    adapterId: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: 'product_intelligence',
    mode: 'read_only',
    routeClass: 'preview_safe',
    readModel: {
      status: 'ok',
      records: clone(PRODUCT_RECORDS)
    },
    audit: {
      event: 'read_model_used',
      adapterId: ADAPTER_ID
    },
    freshness: clone(DEFAULT_FRESHNESS),
    blockedEffects: clone(BLOCKED_EFFECTS),
    safetyFlags: clone(DEFAULT_SAFETY_FLAGS)
  };
}

export function getProductIntelligenceReadModelByFamily(productFamily) {
  if (!productFamily || typeof productFamily !== 'string') {
    return buildProductIntelligenceNotModeledError(productFamily);
  }

  const normalized = productFamily.trim().toLowerCase();
  const record = PRODUCT_RECORDS.find((entry) => entry.product_family.toLowerCase() === normalized);

  if (!record) {
    return buildProductIntelligenceNotModeledError(productFamily);
  }

  return {
    adapterId: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: 'product_intelligence',
    mode: 'read_only',
    routeClass: 'preview_safe',
    readModel: {
      status: 'ok',
      records: [clone(record)]
    },
    errors: [],
    audit: {
      event: 'read_model_used',
      adapterId: ADAPTER_ID
    },
    freshness: clone(DEFAULT_FRESHNESS),
    blockedEffects: clone(BLOCKED_EFFECTS),
    safetyFlags: clone(DEFAULT_SAFETY_FLAGS)
  };
}

export function buildProductIntelligenceNotModeledError(productFamily) {
  return {
    adapterId: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: 'product_intelligence',
    mode: 'read_only',
    routeClass: 'preview_safe',
    readModel: {
      status: 'error',
      records: []
    },
    errors: [{
      code: SAFE_ERROR_CODES.notModeled,
      safeMessage: 'Product Intelligence read model is not modeled for the requested family.',
      productFamily: productFamily || null,
      recoverable: true
    }],
    audit: {
      event: 'read_model_used',
      adapterId: ADAPTER_ID
    },
    freshness: clone(DEFAULT_FRESHNESS),
    blockedEffects: clone(BLOCKED_EFFECTS),
    safetyFlags: clone(DEFAULT_SAFETY_FLAGS)
  };
}

export function validateProductIntelligenceReadModelShape(readModel) {
  const errors = [];
  const records = Array.isArray(readModel?.readModel?.records)
    ? readModel.readModel.records
    : Array.isArray(readModel)
      ? readModel
      : [];

  if (!records.length) {
    errors.push('records_required');
  }

  records.forEach((record) => {
    if (record.schemaVersion !== SCHEMA_VERSION) errors.push(`${record.product_family || 'unknown'}:schemaVersion`);
    if (record.domainId !== 'product_intelligence') errors.push(`${record.product_family || 'unknown'}:domainId`);
    if (record.mode !== 'read_only') errors.push(`${record.product_family || 'unknown'}:mode`);
    if (record.routeClass !== 'preview_safe') errors.push(`${record.product_family || 'unknown'}:routeClass`);

    REQUIRED_FIELDS.forEach((field) => {
      if (!(field in record)) {
        errors.push(`${record.product_family || 'unknown'}:${field}`);
      }
    });

    Object.entries(record.safety_flags || {}).forEach(([key, value]) => {
      if (value !== false) {
        errors.push(`${record.product_family || 'unknown'}:safety_flags.${key}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
