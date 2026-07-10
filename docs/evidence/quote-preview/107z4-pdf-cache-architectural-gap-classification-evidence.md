# 107Z4 — Architectural gap classification evidence

Status: **PASS**

## Prior evidence summary

```json
{
  "107Z2_STATUS": "HOLD",
  "107Z3_STATUS": "HOLD",
  "CANONICAL_PDF_ENGINE_PATH": "product-intelligence/evidence/forge-quote-pdf-preview-engine.js",
  "CANONICAL_CACHE_PATH": "",
  "CANONICAL_CACHE_WRITER_FUNCTION": [],
  "CANONICAL_CACHE_READER_FUNCTION": [],
  "CANONICAL_EXISTING_BRIDGE_PATH": "",
  "MISSING_CANONICAL_PDF_CACHE": true,
  "NO_EXISTING_CANONICAL_PDF_CACHE_IMPLEMENTATION_PROVEN": false,
  "VALID_RUNTIME_CANDIDATE_COUNT": 4,
  "WRITER_CANDIDATE_COUNT": 1,
  "READER_CANDIDATE_COUNT": 2,
  "BRIDGE_CANDIDATE_COUNT": 0
}
```

## Classification scoring

```json
{
  "ENGINE_RUNTIME_SCORE": 94,
  "ENGINE_GOVERNANCE_SCORE": 0,
  "ADAPTER_GOVERNANCE_SCORE": 26
}
```

## File inspections

### `product-intelligence/evidence/forge-quote-pdf-preview-engine.js`

- SHA-256: `d164ce99e24adde28cad3c5e558617eecaa97645f69c888d0ff3ee217e318014`
- Signal counts: `{"runtime_execution": 0, "return_output": 46, "persistence": 0, "readback": 2, "events": 0, "governance": 0, "downstream_reference_only": 0, "forbidden_growth": 0}`

#### runtime_execution

- None.

#### return_output

- L4: `if (value == null) return null;`
- L5: `return String(value).replace(/\s+/g, ' ').replace(/^[\s:.-]+|[\s:.-]+$/g, '').trim() || null;`
- L9: `return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();`
- L13: `if (value == null) return null;`
- L15: `if (!match) return null;`
- L17: `return Number.isFinite(number) ? number : null;`
- L22: `return number == null ? null : String(number);`
- L26: `return Array.from(String(value || '').matchAll(/[0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?/g))`
- L33: `if (!match) return null;`
- L35: `return Number.isFinite(years) && years > 0 && years <= 120 ? years : null;`
- L39: `return value == null || !Number.isFinite(value) ? null : Math.round(value * 100) / 100;`
- L48: `if (lifeScore > gmmScore) return 'life';`
- L49: `if (gmmScore > lifeScore) return 'gmm';`
- L50: `if (lifeScore > 0) return 'life';`
- L51: `if (gmmScore > 0) return 'gmm';`
- L52: `return 'unknown';`
- L56: `if (!/Solucionline|Escenarios Econ[oó]micos|IMAGINA SER/i.test(text)) return null;`
- L106: `return {`
- L147: `function buildCalculation(result, options = {}) {`
- L150: `const policyYears = yearsFrom(result.policyTerm);`
- L151: `const paymentYears = yearsFrom(result.paymentTerm) || policyYears;`
- L152: `const premiumUdi = numberFrom(result.totalAnnualPremium || result.premium);`
- L153: `const sumInsuredUdi = numberFrom(result.sumInsured);`
- L154: `const savingsGoalUdi = numberFrom(result.retirementScenarioBase && result.retirementScenarioBase.singlePaymentUdi);`
- L165: `if (!scenario) return null;`
- L166: `return {`
- L174: `return {`
- L199: `base: scenarioMxn(result.retirementScenarioBase, false),`
- L200: `favorable: scenarioMxn(result.retirementScenarioFavorable, false),`
- L201: `unfavorable: scenarioMxn(result.retirementScenarioUnfavorable, false)`
- L204: `base: scenarioMxn(result.retirementScenarioBase, true),`
- L205: `favorable: scenarioMxn(result.retirementScenarioFavorable, true),`
- L206: `unfavorable: scenarioMxn(result.retirementScenarioUnfavorable, true)`
- L216: `const result = {`
- L220: `result.extractedFieldCount = Object.values(result).filter((value) => value != null && value !== '' && (!Array.isArray(value) || value.length)).length;`
- L221: `result.calculation = buildCalculation(result, input);`
- L222: `return {`
- L224: `sourceModule: 'forge-quote-pdf-preview-engine.js',`
- L230: `result`
- L235: `const result = summary.result || {};`
- L236: `const calculation = result.calculation || {};`
- L237: `return {`
- L240: `['Producto', result.product || '', 'UDI usada', calculation.udiMxn || ''],`
- L241: `['Plan', result.plan || '', 'Crecimiento UDI', calculation.udiGrowthRate || ''],`
- L242: `['Prospecto', result.prospect || '', 'UDI proyectada', calculation.projectedUdiMxnAtPolicyTerm || ''],`
- L246: `DatosPDF: Object.entries(result).filter(([key]) => key !== 'calculation').map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : value]),`

#### persistence

- None.

#### readback

- L61: `const findLine = (pattern) => lines.find((line) => pattern.test(line)) || '';`
- L77: `const scenarioLine = lines.find((line) => /^\d+\s+\d+\s+[0-9,]+\s+[0-9,]+\s+[0-9,]+\s+[0-9,]+\s+[0-9,]+\s+[0-9,]+$/.test(line)) || '';`

#### events

- None.

#### governance

- None.

#### downstream_reference_only

- None.

#### forbidden_growth

- None.

### `platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js`

- SHA-256: `10e23cda8585af3a6650f220c724a5c8ea9b9dc04e0ecebd5941e3391fed971d`
- Signal counts: `{"runtime_execution": 1, "return_output": 40, "persistence": 0, "readback": 1, "events": 0, "governance": 1, "downstream_reference_only": 0, "forbidden_growth": 0}`

#### runtime_execution

- L102: `return JSON.parse(JSON.stringify(value));`

#### return_output

- L3: `const bindingAdapter = require('./quote-preview-product-intelligence-binding-adapter-074b.js');`
- L11: `const QUOTE_PREVIEW_PDF_ENGINE_REF = 'product-intelligence/evidence/forge-quote-pdf-preview-engine.js';`
- L12: `const BINDING_ADAPTER_REF = 'platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js';`
- L102: `return JSON.parse(JSON.stringify(value));`
- L106: `return String(value || '').trim();`
- L110: `return normalizeText(value)`
- L121: `return object[name];`
- L124: `return undefined;`
- L127: `function validationOk(result) {`
- L128: `if (result === true) return true;`
- L129: `if (result && result.ok === true) return true;`
- L130: `if (result && result.valid === true) return true;`
- L131: `if (result && result.isValid === true) return true;`
- L132: `return false;`
- L137: `if (Array.isArray(refs)) return refs.filter(Boolean).map(String);`
- L138: `if (refs) return [String(refs)];`
- L139: `return [];`
- L144: `return {`
- L154: `return {`
- L166: `if (!binding) return null;`
- L168: `if (!candidate) return null;`
- L169: `if (typeof candidate === 'string') return candidate;`
- L170: `return candidate.code || candidate.errorCode || candidate.safe_error_code || null;`
- L174: `return {`
- L208: `message: message || 'Quote Preview PDF Engine is not integrated with Product Intelligence for this request.'`
- L220: `return Boolean(sourceDocumentRef) || normalizeSourceEvidenceRefs(request).length > 0;`
- L225: `if (Array.isArray(refs)) return refs.filter(Boolean).map(String);`
- L226: `if (refs) return [String(refs)];`
- L227: `return [];`
- L234: `return buildQuotePreviewPdfIntegrationError(`
- L237: `'Source document or evidence references are required before PDF preview integration.'`
- L242: `return buildQuotePreviewPdfIntegrationError(`
- L245: `'Quote Preview Product Intelligence binding adapter is required.'`
- L263: `return buildQuotePreviewPdfIntegrationError(`
- L275: `return buildQuotePreviewPdfIntegrationError(`
- L278: `'Quote Preview Product Intelligence binding shape did not validate.'`
- L285: `return buildQuotePreviewPdfIntegrationError(`
- L295: `return {`
- L332: `note: '075B only creates a reference integration plan. Future phases must explicitly authorize any preview parsing.'`
- L351: `return {`

#### persistence

- None.

#### readback

- L13: `const PRODUCT_INTELLIGENCE_ADAPTER_REF = 'platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js';`

#### events

- None.

#### governance

- L332: `note: '075B only creates a reference integration plan. Future phases must explicitly authorize any preview parsing.'`

#### downstream_reference_only

- None.

#### forbidden_growth

- None.

### `platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js`

- SHA-256: `f72934ffbd187425a8de51753ae8c1cad980eeb1c67e5cdd23cabce99c33b2b5`
- Signal counts: `{"runtime_execution": 1, "return_output": 15, "persistence": 0, "readback": 2, "events": 0, "governance": 10, "downstream_reference_only": 0, "forbidden_growth": 0}`

#### runtime_execution

- L164: `return JSON.parse(JSON.stringify(value));`

#### return_output

- L13: `'platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js';`
- L16: `'platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js';`
- L19: `'product-intelligence/evidence/forge-quote-pdf-preview-engine.js';`
- L164: `return JSON.parse(JSON.stringify(value));`
- L169: `if (!raw) return '';`
- L193: `return aliases.get(compact) || String(value || '').trim();`
- L203: `return 'quote_preview_pdf_engine_promotion_${clean || 'not_modeled'}_076b';`
- L207: `return {`
- L249: `return {`
- L296: `message: 'Quote Preview PDF Engine promotion is not available without Product Intelligence-bound references.',`
- L315: `return buildQuotePreviewPdfEnginePromotionError(`
- L324: `return buildQuotePreviewPdfEnginePromotionError(`
- L332: `return {`
- L401: `return { ok: false, valid: false, errors: ['promotion_object_required'] };`
- L435: `return {`

#### persistence

- None.

#### readback

- L10: `'platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js';`
- L193: `return aliases.get(compact) || String(value || '').trim();`

#### events

- None.

#### governance

- L296: `message: 'Quote Preview PDF Engine promotion is not available without Product Intelligence-bound references.',`
- L397: `function validateQuotePreviewPdfEnginePromotionShape(promotion) {`
- L400: `if (!promotion || typeof promotion !== 'object') {`
- L405: `if (!(field in promotion)) {`
- L410: `if (promotion.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');`
- L411: `if (promotion.domainId !== DOMAIN_ID) errors.push('invalid_domainId');`
- L412: `if (promotion.mode !== MODE) errors.push('invalid_mode');`
- L413: `if (promotion.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');`
- L415: `for (const [key, value] of Object.entries(promotion.safety_flags || {})) {`
- L419: `const serialized = JSON.stringify(promotion);`

#### downstream_reference_only

- None.

#### forbidden_growth

- None.

### `platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js`

- SHA-256: `efd73bd8d6fc056b34048da0cd6586b0215a27012edf731e9981bd2b182768ce`
- Signal counts: `{"runtime_execution": 8, "return_output": 34, "persistence": 4, "readback": 6, "events": 0, "governance": 12, "downstream_reference_only": 0, "forbidden_growth": 1}`

#### runtime_execution

- L64: `function clone(value) { return JSON.parse(JSON.stringify(value)); }`
- L81: `file_path: 'policy-operations/evidence/policy-ocr-engine.js',`
- L87: `allowed_role: 'candidate canonical local PDF/OCR text extraction source; must not own parsing, calculation, or quote truth',`
- L89: `test_refs: ['tests/real-pdf-ocr-test.js', 'tests/real-gmm-quote-test.js', 'tests/gmm-out-of-pocket-test.js'],`
- L305: `file_path: 'tests/real-pdf-ocr-test.js',`
- L311: `allowed_role: 'candidate canonical real PDF/OCR evidence test',`
- L314: `engine_refs: ['policy-operations/evidence/policy-ocr-engine.js'],`
- L330: `engine_refs: ['policy-operations/evidence/policy-ocr-engine.js', 'product-intelligence/evidence/gmm-quote-parser.js'],`

#### return_output

- L64: `function clone(value) { return JSON.parse(JSON.stringify(value)); }`
- L67: `return Object.freeze({`
- L97: `file_path: 'product-intelligence/evidence/forge-quote-pdf-preview-engine.js',`
- L103: `allowed_role: 'candidate preview/orchestrator only; must delegate parser and calculator ownership',`
- L105: `test_refs: ['tests/product-intelligence/forge-quote-pdf-preview-engine-test.js'],`
- L119: `allowed_role: 'candidate canonical Solucionline parser; boundary must be reconciled against preview engine parsing',`
- L122: `engine_refs: ['product-intelligence/evidence/forge-quote-pdf-preview-engine.js'],`
- L215: `allowed_role: 'direct Banxico provider candidate; not authorized for preview runtime execution without later gate',`
- L231: `allowed_role: 'edge Banxico provider candidate; not authorized for preview runtime execution without later gate',`
- L257: `file_path: 'platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js',`
- L263: `allowed_role: 'current Quote Preview to Product Intelligence binding',`
- L265: `test_refs: ['tests/quote-preview-product-intelligence-binding-adapter-074b-test.js'],`
- L273: `file_path: 'platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js',`
- L279: `allowed_role: 'current reference integration between PDF preview and Product Intelligence',`
- L281: `test_refs: ['tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js'],`
- L282: `engine_refs: ['platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js'],`
- L289: `file_path: 'platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js',`
- L297: `test_refs: ['tests/quote-preview-pdf-engine-repo-promotion-adapter-076b-test.js'],`
- L298: `engine_refs: ['platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js', 'platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js', 'platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js', 'product-intelligence/evidence/forge-quote-pdf-preview-engine.js'],`
- L337: `file_path: 'tests/product-intelligence/forge-quote-pdf-preview-engine-test.js',`
- L343: `allowed_role: 'candidate canonical preview fixture test, not real extraction proof',`
- L346: `engine_refs: ['product-intelligence/evidence/forge-quote-pdf-preview-engine.js'],`
- L354: `return {`
- L376: `return match ? clone(match) : buildExistingSurfaceCanonicalMappingSafeError(surfaceId);`
- L381: `return clone(ALL_SURFACES.filter((surface) =>`
- L387: `return clone(ALL_SURFACES.filter((surface) => surface.canonical_status === CANONICAL_STATUSES.DECISION_REQUIRED));`
- L391: `return clone(ALL_SURFACES.filter((surface) => surface.blocked_growth.length > 0));`
- L395: `return {`
- L425: `if (!surface || typeof surface !== 'object') return { ok: false, valid: false, errors: ['surface_object_required'] };`
- L434: `return { ok: errors.length === 0, valid: errors.length === 0, errors };`
- L439: `if (!catalog || typeof catalog !== 'object') return { ok: false, valid: false, errors: ['catalog_object_required'] };`
- L448: `const result = validateExistingSurfaceCanonicalMappingShape(surface);`
- L449: `if (!result.ok) errors.push(...result.errors.map((error) => '${surface.surface_id || 'unknown'}:${error}'));`
- L451: `return { ok: errors.length === 0, valid: errors.length === 0, errors };`

#### persistence

- L193: `file_path: 'exchange-rate-cache-engine.js',`
- L199: `allowed_role: 'candidate current-rate cache over Banxico providers',`
- L218: `engine_refs: ['exchange-rate-cache-engine.js'],`
- L234: `engine_refs: ['exchange-rate-cache-engine.js'],`

#### readback

- L151: `allowed_role: 'candidate GMM summary/read-model source; should consume parser outputs, not own parsing',`
- L241: `file_path: 'platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js',`
- L249: `test_refs: ['tests/product-intelligence/product-intelligence-read-model-adapter-073d-test.js'],`
- L266: `engine_refs: ['platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js'],`
- L298: `engine_refs: ['platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js', 'platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js', 'platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js', 'product-intelligence/evidence/forge-quote-pdf-preview-engine.js'],`
- L375: `const match = ALL_SURFACES.find((surface) => surface.surface_id === surfaceId);`

#### events

- None.

#### governance

- L87: `allowed_role: 'candidate canonical local PDF/OCR text extraction source; must not own parsing, calculation, or quote truth',`
- L119: `allowed_role: 'candidate canonical Solucionline parser; boundary must be reconciled against preview engine parsing',`
- L135: `allowed_role: 'candidate canonical GMM quote parser',`
- L167: `allowed_role: 'candidate canonical future UDI projection calculator',`
- L247: `allowed_role: 'current upstream semantic authority until ontology promotion',`
- L279: `allowed_role: 'current reference integration between PDF preview and Product Intelligence',`
- L289: `file_path: 'platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js',`
- L295: `allowed_role: 'repo promotion guardrail only; must not become extractor/parser/calculator',`
- L297: `test_refs: ['tests/quote-preview-pdf-engine-repo-promotion-adapter-076b-test.js'],`
- L311: `allowed_role: 'candidate canonical real PDF/OCR evidence test',`
- L327: `allowed_role: 'candidate canonical GMM quote evidence test',`
- L343: `allowed_role: 'candidate canonical preview fixture test, not real extraction proof',`

#### downstream_reference_only

- None.

#### forbidden_growth

- L295: `allowed_role: 'repo promotion guardrail only; must not become extractor/parser/calculator',`

## Final classification

```json
{
  "ARCHITECTURAL_GAP_CLASS": "EXISTING_GENERIC_RUNTIME_CONTRACT_NOT_YET_PROVEN",
  "CONFIDENCE": "MEDIUM_HIGH",
  "RATIONALE": [
    "107Z3 found runtime-like writer, reader, bridge or state candidates but no complete canonical contract."
  ],
  "NEXT_GATE": "107Z5_TARGETED_GENERIC_RUNTIME_CANDIDATE_OWNERSHIP_AND_CALL_GRAPH_INSPECTION"
}
```

## Authorization

```json
{
  "IMPLEMENTATION_AUTHORIZED": false,
  "CACHE_CREATION_AUTHORIZED": false,
  "BRIDGE_CREATION_AUTHORIZED": false,
  "ADR_REQUIRED_BEFORE_NEW_INFRASTRUCTURE": false,
  "UI_INTEGRATION_AUTHORIZED": false
}
```
