/*
|--------------------------------------------------------------------------
| MODULE: document-classification-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Clasifica documentos GMM desde texto extraido por PDF/OCR.
|
|--------------------------------------------------------------------------
*/

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreDocument(text, rules = []) {
  const matchedRules =
    rules.filter((rule) => text.includes(rule.term));

  return {
    score: matchedRules.reduce((total, rule) => total + rule.weight, 0),
    reasons: matchedRules.map((rule) => rule.reason)
  };
}

function confidenceFromScore(score) {
  if (score >= 6) {
    return 'HIGH';
  }

  if (score >= 4) {
    return 'MEDIUM';
  }

  if (score >= 2) {
    return 'LOW';
  }

  return 'UNKNOWN';
}

const DOCUMENT_RULES = {
  GMM_QUOTE: [
    { term: 'cotizacion', weight: 1, reason: 'Contains quote language.' },
    { term: 'cotizador web', weight: 2, reason: 'Contains Cotizador Web marker.' },
    { term: 'cotizadorweb', weight: 2, reason: 'Contains CotizadorWeb marker.' },
    { term: 'fecha en que se elaboro la cotizacion', weight: 2, reason: 'Contains quote creation date marker.' },
    { term: 'estas a punto de proteger mejor', weight: 2, reason: 'Contains quote sales heading.' },
    { term: 'plan cotizado', weight: 1, reason: 'Contains quoted plan marker.' },
    { term: 'prima anual', weight: 1, reason: 'Contains annual premium marker.' }
  ],

  GMM_POLICY_CARATULA: [
    { term: 'caratula de poliza', weight: 3, reason: 'Contains policy caratula marker.' },
    { term: 'numero de poliza', weight: 2, reason: 'Contains policy number marker.' },
    { term: 'periodo del seguro', weight: 2, reason: 'Contains insurance period marker.' },
    { term: 'contratante', weight: 1, reason: 'Contains contractor marker.' },
    { term: 'asegurado', weight: 1, reason: 'Contains insured marker.' },
    { term: 'condiciones generales', weight: 1, reason: 'References general conditions.' },
    { term: 'no es valido como recibo', weight: 2, reason: 'Contains non-receipt policy warning.' }
  ],

  GMM_CONDITIONS: [
    { term: 'condiciones generales', weight: 2, reason: 'Contains general conditions marker.' },
    { term: 'objeto del seguro', weight: 2, reason: 'Contains insurance object section.' },
    { term: 'exclusiones', weight: 2, reason: 'Contains exclusions section.' },
    { term: 'gastos medicos amparados', weight: 2, reason: 'Contains covered medical expenses section.' }
  ],

  GMM_ENDORSEMENT: [
    { term: 'endoso', weight: 3, reason: 'Contains endorsement marker.' },
    { term: 'clausula adicional', weight: 2, reason: 'Contains additional clause marker.' },
    { term: 'condiciones particulares', weight: 2, reason: 'Contains particular conditions marker.' }
  ]
};

export function classifyInsuranceDocument({ text = '' } = {}) {
  const normalizedText = normalizeText(text);
  const warnings = [];

  if (!normalizedText) {
    return {
      documentType: 'UNKNOWN',
      confidence: 'UNKNOWN',
      reasons: [],
      warnings: ['No text was provided for classification.']
    };
  }

  const candidates =
    Object.entries(DOCUMENT_RULES)
      .map(([documentType, rules]) => ({
        documentType,
        ...scoreDocument(normalizedText, rules)
      }))
      .sort((left, right) => right.score - left.score);

  const best = candidates[0];
  const runnerUp = candidates[1];

  if (!best || best.score < 2) {
    return {
      documentType: 'UNKNOWN',
      confidence: 'UNKNOWN',
      reasons: [],
      warnings: ['Insufficient evidence to classify document.']
    };
  }

  if (runnerUp && runnerUp.score > 0 && best.score - runnerUp.score <= 1) {
    warnings.push(
      `Document has mixed evidence: ${best.documentType} and ${runnerUp.documentType}.`
    );
  }

  return {
    documentType: best.documentType,
    confidence: confidenceFromScore(best.score),
    reasons: best.reasons,
    warnings
  };
}

export default classifyInsuranceDocument;
