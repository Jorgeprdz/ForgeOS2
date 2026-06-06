/*
|--------------------------------------------------------------------------
| MODULE: gmm-quote-summary-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Resume una cotizacion GMM para uso del asesor.
|
|--------------------------------------------------------------------------
*/

function normalizeSpaces(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value = '') {
  return normalizeSpaces(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseMoney(value = '') {
  const parsed =
    Number(
      String(value)
        .replace(/\$/g, '')
        .replace(/,/g, '')
        .replace(/pesos/gi, '')
        .trim()
    );

  return Number.isFinite(parsed) ? parsed : null;
}

function matchText(text, regex) {
  const match = normalizeSpaces(text).match(regex);
  return match ? match[1].trim() : null;
}

function findMoneyAfter(label, text) {
  const clean = normalizeSpaces(text);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedLabel}[^$\\d]*(?:\\$)?([\\d,]+(?:\\.\\d+)?)`, 'i');
  const match = clean.match(regex);

  return match ? parseMoney(match[1]) : null;
}

function parseGender(value = '') {
  const normalized = normalizeText(value);

  if (normalized.includes('femenino') || normalized.includes('mujer')) {
    return 'female';
  }

  if (normalized.includes('masculino') || normalized.includes('hombre')) {
    return 'male';
  }

  return null;
}

function extractProspect(text) {
  const clean = normalizeSpaces(text);
  const row =
    clean.match(/Titular:\s*([A-Za-zÁÉÍÓÚÑáéíóúñ\s]+?)\s+(Femenino|Masculino|Hombre|Mujer)\s+(\d{1,3})\b/i);

  if (!row) {
    return {
      prospect: matchText(clean, /Titular:\s*([A-Za-zÁÉÍÓÚÑáéíóúñ\s]+?)(?:\s{2,}|$)/i),
      gender: null,
      age: null
    };
  }

  return {
    prospect: row[1].trim(),
    gender: parseGender(row[2]),
    age: Number(row[3])
  };
}

function extractOptionalCoverages(text) {
  const clean = normalizeSpaces(text);
  const optionalCoverages = [];

  if (/Eliminaci[oó]n de Deducible por Accidente/i.test(clean)) {
    const coverageMatch =
      clean.match(/Eliminaci[oó]n de Deducible por Accidente\s+Suma Asegurada\s+\$?([\d,]+(?:\.\d+)?)\s+Pesos\s+Prima\s+\$?([\d,]+(?:\.\d+)?)/i);

    optionalCoverages.push({
      name: 'Eliminacion de Deducible por Accidente',
      status: 'SELECTED',
      sumInsured: coverageMatch ? parseMoney(coverageMatch[1]) : null,
      premium: coverageMatch ? parseMoney(coverageMatch[2]) : null
    });
  }

  return optionalCoverages;
}

export function summarizeGmmQuote({ text = '' } = {}) {
  const clean = normalizeSpaces(text);
  const normalized = normalizeText(text);
  const prospectData = extractProspect(clean);

  const product =
    normalized.includes('alfa medical')
      ? 'Alfa Medical'
      : null;

  const plan =
    matchText(clean, /Plan:\s*([A-ZÁÉÍÓÚÑ0-9\s]+?)\s+Zona:/i)
    ?? matchText(clean, /plan:\s*([A-ZÁÉÍÓÚÑ0-9\s]+?)\s+Zona:/i);

  return {
    product,
    plan,
    prospect: prospectData.prospect,
    age: prospectData.age,
    gender: prospectData.gender,
    territoriality: matchText(clean, /Territorialidad:\s*([A-Za-zÁÉÍÓÚÑ]+)/i),
    zone: matchText(clean, /Zona:\s*([A-Za-zÁÉÍÓÚÑ0-9\s]+?)\s+Deducible:/i),
    sumInsured: findMoneyAfter('Suma Asegurada:', clean),
    deductible: findMoneyAfter('Deducible:', clean),
    coinsurance: Number(matchText(clean, /Coaseguro:\s*(\d+)%/i)),
    coinsuranceCap: findMoneyAfter('limite de', clean) ?? findMoneyAfter('límite de', clean),
    tabulator: matchText(clean, /Tabulador:\s*([A-ZÁÉÍÓÚÑ0-9]+)/i),
    currency: matchText(clean, /Moneda:\s*([A-Za-zÁÉÍÓÚÑ]+)/i),
    paymentMode: matchText(clean, /Forma de Pago:\s*([A-Za-zÁÉÍÓÚÑ]+)/i),
    premium: findMoneyAfter('PRIMA ANUAL', clean),
    optionalCoverages: extractOptionalCoverages(clean),
    advisor: matchText(clean, /Asesor:\s*([A-ZÁÉÍÓÚÑ\s]+?)\s+Fecha inicio/i),
    quoteDate: matchText(clean, /Fecha en que se elabor[oó] la cotizaci[oó]n:\s*([^A]+?)\s+Asesor:/i),
    startDate: matchText(clean, /Fecha inicio vigencia:\s*([0-9/]+)/i),
    salesSummary: product && plan
      ? `${product} ${plan} quote for ${prospectData.prospect || 'prospect'}.`
      : 'GMM quote summary.',
    decisionQuestions: [
      'Does this plan level fit the prospect medical access expectation?',
      'Is the deductible comfortable if a medical event occurs?',
      'Is the annual premium sustainable for the prospect?',
      'Should the selected accident deductible elimination remain included?'
    ],
    warnings: [
      'Quote is illustrative and must not be treated as issued policy.'
    ]
  };
}

export default summarizeGmmQuote;
