import { summarizeGmmQuote } from './gmm-quote-summary-engine.js';
import { summarizeGmmPolicyCaratula } from './gmm-policy-caratula-summary-engine.js';
import { compareQuoteToPolicy } from './quote-to-policy-comparison-engine.js';

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

const comparison =
  compareQuoteToPolicy({
    quoteSummary,
    policySummary
  });

test('Lariza quote and Franco policy return DIFFERENT_INSURED', () => {
  assert(
    comparison.identityMatch === 'DIFFERENT_INSURED',
    `Expected DIFFERENT_INSURED, received ${comparison.identityMatch}`
  );
});

test('Product remains Alfa Medical', () => {
  assert(
    comparison.stayedSame.some((item) =>
      item.field === 'product' && item.value === 'Alfa Medical'
    ),
    'Product did not remain the same.'
  );
});

test('Plan remains Integro', () => {
  assert(
    comparison.stayedSame.some((item) =>
      item.field === 'plan'
    ),
    'Plan did not remain the same.'
  );
});

test('Deductible change detected', () => {
  assert(
    comparison.changed.some((item) =>
      item.field === 'deductible'
      && item.quoteValue === 25000
      && item.policyValue === 40000
    ),
    'Deductible change missing.'
  );
});

test('Sum insured change detected', () => {
  assert(
    comparison.changed.some((item) =>
      item.field === 'sumInsured'
      && item.quoteValue === 170000000
      && item.policyValue === 160000000
    ),
    'Sum insured change missing.'
  );
});

test('Coinsurance cap change detected', () => {
  assert(
    comparison.changed.some((item) =>
      item.field === 'coinsuranceCap'
      && item.quoteValue === 97000
      && item.policyValue === 85000
    ),
    'Coinsurance cap change missing.'
  );
});

test('Advisor alert generated', () => {
  assert(
    comparison.advisorAlerts.length > 0,
    'Advisor alert missing.'
  );
});

test('Client explanation generated', () => {
  assert(
    comparison.clientExplanation.length > 0,
    'Client explanation missing.'
  );
});

test('Expectation gap generated', () => {
  assert(
    comparison.expectationGaps.length > 0,
    'Expectation gap missing.'
  );
});

console.log('\nFORGE GMM SPRINT 2 SMOKE TEST v0.1\n');

for (const result of results) {
  if (result.status === 'PASS') {
    console.log(`PASS ${result.name}`);
  } else {
    console.log(`FAIL ${result.name}`);
    console.log(`   ${result.error}`);
  }
}

console.log('\nComparison:');
console.log(JSON.stringify(comparison, null, 2));

const failed = results.filter((result) => result.status === 'FAIL');

console.log('\nSummary:');
console.log(`Total: ${results.length}`);
console.log(`Pass: ${results.length - failed.length}`);
console.log(`Fail: ${failed.length}`);

if (failed.length > 0) {
  process.exit(1);
}
