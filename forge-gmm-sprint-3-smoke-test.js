import { summarizeGmmQuote } from './gmm-quote-summary-engine.js';
import { summarizeGmmPolicyCaratula } from './gmm-policy-caratula-summary-engine.js';
import { compareQuoteToPolicy } from './quote-to-policy-comparison-engine.js';
import { buildGmmAdvisorReview } from './gmm-advisor-review-engine.js';

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

test('Advisor review generated', () => {
  assert(Boolean(advisorReview), 'Advisor review missing.');
});

test('Case snapshot generated', () => {
  assert(Boolean(advisorReview.caseSnapshot), 'Case snapshot missing.');
  assert(advisorReview.caseSnapshot.identityMatch === 'DIFFERENT_INSURED', 'Identity snapshot mismatch.');
  assert(advisorReview.caseSnapshot.status === 'REVIEW REQUIRED', 'Review status mismatch.');
});

test('Advisor alerts generated', () => {
  assert(advisorReview.advisorAlerts.length > 0, 'Advisor alerts missing.');
});

test('At least one HIGH alert exists', () => {
  assert(
    advisorReview.advisorAlerts.some((alert) => alert.priority === 'HIGH'),
    'HIGH alert missing.'
  );
});

test('Expectation gap generated', () => {
  assert(advisorReview.expectationGaps.length > 0, 'Expectation gaps missing.');
});

test('Discussion topics generated', () => {
  assert(advisorReview.discussionTopics.length > 0, 'Discussion topics missing.');
});

test('Follow-up questions generated', () => {
  assert(advisorReview.followUpQuestions.length > 0, 'Follow-up questions missing.');
});

test('Advisor summary generated', () => {
  assert(
    typeof advisorReview.advisorSummary === 'string'
    && advisorReview.advisorSummary.length > 40,
    'Advisor summary missing.'
  );
});

test('No coverage decisions generated', () => {
  assert(!Object.hasOwn(advisorReview, 'covered'), 'Advisor review must not include covered.');
  assert(!Object.hasOwn(advisorReview, 'coverageDecision'), 'Advisor review must not include coverageDecision.');
  assert(!Object.hasOwn(advisorReview, 'claimDecision'), 'Advisor review must not include claimDecision.');
  assert(!Object.hasOwn(advisorReview, 'claimEligibility'), 'Advisor review must not include claimEligibility.');
});

console.log('\nFORGE GMM SPRINT 3 SMOKE TEST v0.1\n');

for (const result of results) {
  if (result.status === 'PASS') {
    console.log(`PASS ${result.name}`);
  } else {
    console.log(`FAIL ${result.name}`);
    console.log(`   ${result.error}`);
  }
}

console.log('\nAdvisor Review:');
console.log(JSON.stringify(advisorReview, null, 2));

const failed = results.filter((result) => result.status === 'FAIL');

console.log('\nSummary:');
console.log(`Total: ${results.length}`);
console.log(`Pass: ${results.length - failed.length}`);
console.log(`Fail: ${failed.length}`);

if (failed.length > 0) {
  process.exit(1);
}
