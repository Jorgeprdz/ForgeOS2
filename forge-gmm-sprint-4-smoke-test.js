import { summarizeGmmQuote } from './gmm-quote-summary-engine.js';
import { summarizeGmmPolicyCaratula } from './gmm-policy-caratula-summary-engine.js';
import { compareQuoteToPolicy } from './quote-to-policy-comparison-engine.js';
import { buildGmmAdvisorReview } from './gmm-advisor-review-engine.js';
import { buildGmmClientReview } from './gmm-client-review-engine.js';

const LARIZA_QUOTE_TEXT = `
Estas a punto de proteger mejor tu salud.
CotizadorWeb Version 2.18.5.0
Fecha en que se elaboro la cotizacion: 05 de junio de 2026
Asesor: ANA KAREN GARZA LOPERENA
Fecha inicio vigencia: 05/06/2026
Acabas de cotizar un plan:
Alfa Medical
Plan: INTEGRO Zona: Norte Deducible: $25,000 Pesos
Coaseguro: 10% con limite de $97,000.00 Pesos
Suma Asegurada: $170,000,000 Pesos
Territorialidad: Nacional
Tabulador: GAMMA
Moneda: Pesos
Titular: Lariza Saenz Femenino 23 Riesgo Normal Esquema deducible Unico: $25,000.00 Esquema coaseguro Unico Prima $38,276.41
Eliminacion de Deducible por Accidente Suma Asegurada $25,000 Pesos Prima $975.55
Forma de Pago: ANUAL
Derecho de Poliza $1,600.00 IVA $6,536.31 PRIMA ANUAL $47,388.27
Esta cotizacion es ilustrativa y no forma parte del contrato de seguro.
`;

const FRANCO_CARATULA_TEXT = `
ALFA MEDICAL CARATULA DE POLIZA DE GASTOS MEDICOS MAYORES INDIVIDUAL O FAMILIAR
POLIZA GM0000737905(N)
NUMERO DE POLIZA GM0000737905(N)
Contratante SANDRA PATRICIA NERI ESCUTIA Territorialidad NACIONAL Zona CDMX 1
Periodo del seguro inicia 30-01-2026 termina 30-01-2027
Asegurado
FRANCO VILLANUEVA NAJERA TITULAR HOMBRE 0 05-12-2025 30-01-2026 30-01-2026
Plan ALFA MEDICAL INTEGRO
Suma asegurada $160,000,000
Deducible $40,000
Coaseguro/tope 10% / $85,000
Tabulador Gamma
Esquema deducible UNICO
Esquema coaseguro UNICO
AMBULANCIA CUBIERTO
COBERTURA VIH NO CUBIERTO
PROTECCION PATRIMONIAL NO CUBIERTO
CEDA $40,000 Prima $1,540.72 COBERTURA DE ELIMINACION DE DEDUCIBLE POR ACCIDENTE
Forma de pago MENSUAL
Total $25,921.82
Condiciones Generales aplicables. No es valido como recibo.
`;

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({
      name,
      status: 'FAIL',
      error: error.message
    });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const quoteSummary =
  summarizeGmmQuote({ text: LARIZA_QUOTE_TEXT });

const policySummary =
  summarizeGmmPolicyCaratula({ text: FRANCO_CARATULA_TEXT });

const comparisonSummary =
  compareQuoteToPolicy({
    quoteSummary,
    policySummary
  });

const advisorReview =
  buildGmmAdvisorReview({
    quoteSummary,
    policySummary,
    comparisonSummary
  });

const clientReview =
  buildGmmClientReview({
    quoteSummary,
    policySummary,
    comparisonSummary,
    advisorReview
  });

test('Client review generated', () => {
  assert(Boolean(clientReview), 'Client review missing.');
});

test('Client snapshot generated', () => {
  assert(Boolean(clientReview.clientSnapshot), 'Client snapshot missing.');
  assert(clientReview.clientSnapshot.product === 'Alfa Medical', 'Client product mismatch.');
});

test('WhatYouBought generated', () => {
  assert(clientReview.whatYouBought.length > 0, 'WhatYouBought missing.');
});

test('WhatChanged generated', () => {
  assert(clientReview.whatChanged.length > 0, 'WhatChanged missing.');
});

test('ImportantThingsToKnow generated', () => {
  assert(clientReview.importantThingsToKnow.length > 0, 'ImportantThingsToKnow missing.');
});

test('QuestionsToDiscuss generated', () => {
  assert(clientReview.questionsToDiscuss.length > 0, 'QuestionsToDiscuss missing.');
});

test('ClientSummary generated', () => {
  assert(
    typeof clientReview.clientSummary === 'string'
    && clientReview.clientSummary.length > 40,
    'ClientSummary missing.'
  );
});

test('No coverage decisions generated', () => {
  assert(!Object.hasOwn(clientReview, 'covered'), 'Client review must not include covered.');
  assert(!Object.hasOwn(clientReview, 'coverageDecision'), 'Client review must not include coverageDecision.');
  assert(!Object.hasOwn(clientReview, 'coverageEligibility'), 'Client review must not include coverageEligibility.');
});

test('No claim decisions generated', () => {
  assert(!Object.hasOwn(clientReview, 'claimDecision'), 'Client review must not include claimDecision.');
  assert(!Object.hasOwn(clientReview, 'claimEligibility'), 'Client review must not include claimEligibility.');
});

console.log('\nFORGE GMM SPRINT 4 SMOKE TEST v0.1\n');

for (const result of results) {
  if (result.status === 'PASS') {
    console.log(`PASS ${result.name}`);
  } else {
    console.log(`FAIL ${result.name}`);
    console.log(`   ${result.error}`);
  }
}

console.log('\nClient Review:');
console.log(JSON.stringify(clientReview, null, 2));

const failed = results.filter((result) => result.status === 'FAIL');

console.log('\nSummary:');
console.log(`Total: ${results.length}`);
console.log(`Pass: ${results.length - failed.length}`);
console.log(`Fail: ${failed.length}`);

if (failed.length > 0) {
  process.exit(1);
}
