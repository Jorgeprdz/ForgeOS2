/*
|--------------------------------------------------------------------------
| MODULE: gmm-policy-caratula-summary-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Resume una caratula de poliza GMM emitida.
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

  if (normalized.includes('hombre') || normalized.includes('masculino')) {
    return 'male';
  }

  if (normalized.includes('mujer') || normalized.includes('femenino')) {
    return 'female';
  }

  return null;
}

function extractInsureds(text) {
  const clean = normalizeSpaces(text);
  const row =
    clean.match(/([A-ZÁÉÍÓÚÑ\s]+?)\s+(TITULAR|CONYUGE|HIJO|HIJA)\s+(HOMBRE|MUJER|MASCULINO|FEMENINO)\s+(\d{1,3})\s+([0-9-]{10})\s+([0-9-]{10})\s+([0-9-]{10})/i);

  if (!row) {
    return [];
  }

  return [
    {
      name: row[1].trim().replace(/^Asegurado\s+/i, '').trim(),
      relationship: row[2].toUpperCase(),
      gender: parseGender(row[3]),
      age: Number(row[4]),
      birthDate: row[5],
      startDate: row[6],
      seniorityDate: row[7]
    }
  ];
}

function extractCoinsuranceCap(text) {
  const clean = normalizeSpaces(text);
  const match =
    clean.match(/Coaseguro\/tope\s+\d+%\s*\/\s*\$?([\d,]+(?:\.\d+)?)/i);

  return match ? parseMoney(match[1]) : null;
}

function extractBasicCoverages(text) {
  const clean = normalizeSpaces(text);
  const coverages = [];

  if (/AMBULANCIA\s+CUBIERTO/i.test(clean)) {
    coverages.push({ name: 'Ambulancia', status: 'ACTIVE' });
  }

  if (/COBERTURA VIH\s+NO CUBIERTO/i.test(clean)) {
    coverages.push({ name: 'Cobertura VIH', status: 'NOT_ACTIVE' });
  }

  if (/PROTECCI[OÓ]N PATRIMONIAL\s+NO CUBIERTO/i.test(clean)) {
    coverages.push({ name: 'Proteccion Patrimonial', status: 'NOT_ACTIVE' });
  }

  return coverages;
}

function extractOptionalCoverages(text) {
  const clean = normalizeSpaces(text);
  const coverages = [];

  if (/\bCEDA\b/i.test(clean)) {
    coverages.push({
      code: 'CEDA',
      name: 'Cobertura de Eliminacion de Deducible por Accidente',
      status: 'ACTIVE',
      sumInsured: findMoneyAfter('CEDA', clean)
    });
  }

  return coverages;
}

export function summarizeGmmPolicyCaratula({ text = '' } = {}) {
  const clean = normalizeSpaces(text);
  const normalized = normalizeText(text);

  const plan =
    matchText(clean, /Plan\s+(ALFA MEDICAL\s+[A-ZÁÉÍÓÚÑ]+)/i)
    ?? matchText(clean, /ALFA MEDICAL\s+(PRACTICO|INTEGRO|PLENO)/i);

  return {
    product: normalized.includes('alfa medical') ? 'Alfa Medical' : null,
    plan,
    policyNumber:
      matchText(clean, /N[UÚ]MERO DE P[OÓ]LIZA\s*([A-Z0-9()]+)/i)
      ?? matchText(clean, /POLIZA\s+([A-Z0-9()]+)/i),
    contractor: matchText(clean, /Contratante\s+([A-ZÁÉÍÓÚÑ\s]+?)\s+Territorialidad/i),
    insureds: extractInsureds(clean),
    policyPeriod: {
      starts: matchText(clean, /inicia\s*([0-9-]{10})/i),
      ends: matchText(clean, /termina\s*([0-9-]{10})/i)
    },
    territoriality: matchText(clean, /Territorialidad\s+([A-ZÁÉÍÓÚÑ]+)/i),
    zone: matchText(clean, /Zona\s+([A-ZÁÉÍÓÚÑ0-9\s]+?)\s+(?:Periodo|Plan|ALFA)/i),
    sumInsured: findMoneyAfter('Suma asegurada', clean),
    deductible: findMoneyAfter('Deducible', clean),
    deductibleScheme: matchText(clean, /Esquema deducible\s+([A-ZÁÉÍÓÚÑ]+)/i),
    coinsurance: Number(matchText(clean, /Coaseguro\/tope\s+(\d+)%/i)),
    coinsuranceCap: extractCoinsuranceCap(clean),
    coinsuranceScheme: matchText(clean, /Esquema coaseguro\s+([A-ZÁÉÍÓÚÑ]+)/i),
    tabulator: matchText(clean, /Tabulador\s+([A-ZÁÉÍÓÚÑ0-9]+)/i),
    basicCoverages: extractBasicCoverages(clean),
    optionalCoverages: extractOptionalCoverages(clean),
    paymentMode: matchText(clean, /Forma de pago\s+([A-ZÁÉÍÓÚÑ]+)/i),
    totalPremium: findMoneyAfter('Total', clean),
    warnings: [
      'Policy caratula summarizes issued policy facts only and does not determine claim coverage.'
    ]
  };
}

export default summarizeGmmPolicyCaratula;
