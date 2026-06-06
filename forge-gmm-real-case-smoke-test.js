import { classifyInsuranceDocument } from './document-classification-engine.js';
import { summarizeGmmQuote } from './gmm-quote-summary-engine.js';
import { summarizeGmmPolicyCaratula } from './gmm-policy-caratula-summary-engine.js';

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

const larizaClassification =
  classifyInsuranceDocument({ text: LARIZA_QUOTE_TEXT });

const francoClassification =
  classifyInsuranceDocument({ text: FRANCO_CARATULA_TEXT });

const larizaQuote =
  summarizeGmmQuote({ text: LARIZA_QUOTE_TEXT });

const francoCaratula =
  summarizeGmmPolicyCaratula({ text: FRANCO_CARATULA_TEXT });

test('Lariza quote classifies as GMM_QUOTE', () => {
  assert(
    larizaClassification.documentType === 'GMM_QUOTE',
    `Expected GMM_QUOTE, received ${larizaClassification.documentType}`
  );
});

test('Franco caratula classifies as GMM_POLICY_CARATULA', () => {
  assert(
    francoClassification.documentType === 'GMM_POLICY_CARATULA',
    `Expected GMM_POLICY_CARATULA, received ${francoClassification.documentType}`
  );
});

test('Lariza quote summary extracts core facts', () => {
  assert(larizaQuote.product === 'Alfa Medical', 'Product mismatch.');
  assert(larizaQuote.plan === 'INTEGRO', 'Plan mismatch.');
  assert(larizaQuote.prospect === 'Lariza Saenz', 'Prospect mismatch.');
  assert(larizaQuote.age === 23, 'Age mismatch.');
  assert(larizaQuote.gender === 'female', 'Gender mismatch.');
  assert(larizaQuote.deductible === 25000, 'Deductible mismatch.');
  assert(larizaQuote.coinsurance === 10, 'Coinsurance mismatch.');
  assert(larizaQuote.coinsuranceCap === 97000, 'Coinsurance cap mismatch.');
  assert(larizaQuote.sumInsured === 170000000, 'Sum insured mismatch.');
  assert(larizaQuote.premium === 47388.27, 'Annual premium mismatch.');
  assert(
    larizaQuote.optionalCoverages.some((coverage) =>
      coverage.name.includes('Eliminacion de Deducible por Accidente')
    ),
    'Optional accident deductible elimination not detected.'
  );
});

test('Franco caratula summary extracts issued policy facts', () => {
  assert(francoCaratula.product === 'Alfa Medical', 'Product mismatch.');
  assert(francoCaratula.plan === 'ALFA MEDICAL INTEGRO', 'Plan mismatch.');
  assert(francoCaratula.policyNumber === 'GM0000737905(N)', 'Policy number mismatch.');
  assert(francoCaratula.insureds[0].name === 'FRANCO VILLANUEVA NAJERA', 'Insured mismatch.');
  assert(francoCaratula.insureds[0].age === 0, 'Insured age mismatch.');
  assert(francoCaratula.territoriality === 'NACIONAL', 'Territoriality mismatch.');
  assert(francoCaratula.deductible === 40000, 'Deductible mismatch.');
  assert(francoCaratula.coinsurance === 10, 'Coinsurance mismatch.');
  assert(francoCaratula.coinsuranceCap === 85000, 'Coinsurance cap mismatch.');
  assert(francoCaratula.sumInsured === 160000000, 'Sum insured mismatch.');
  assert(
    francoCaratula.optionalCoverages.some((coverage) =>
      coverage.code === 'CEDA' && coverage.status === 'ACTIVE'
    ),
    'CEDA active coverage not detected.'
  );
});

test('Quote summary includes illustrative warning', () => {
  assert(
    larizaQuote.warnings.includes('Quote is illustrative and must not be treated as issued policy.'),
    'Illustrative quote warning missing.'
  );
});

test('Caratula summary does not produce claim coverage conclusions', () => {
  assert(!Object.hasOwn(francoCaratula, 'covered'), 'Caratula must not include covered.');
  assert(!Object.hasOwn(francoCaratula, 'coverageDecision'), 'Caratula must not include coverageDecision.');
  assert(!Object.hasOwn(francoCaratula, 'claimCoverageConclusion'), 'Caratula must not include claimCoverageConclusion.');
});

console.log('\nFORGE GMM REAL CASE SMOKE TEST v0.1\n');

for (const result of results) {
  if (result.status === 'PASS') {
    console.log(`PASS ${result.name}`);
  } else {
    console.log(`FAIL ${result.name}`);
    console.log(`   ${result.error}`);
  }
}

console.log('\nLariza quote summary:');
console.log(JSON.stringify(larizaQuote, null, 2));

console.log('\nFranco caratula summary:');
console.log(JSON.stringify(francoCaratula, null, 2));

const failed = results.filter((result) => result.status === 'FAIL');

console.log('\nSummary:');
console.log(`Total: ${results.length}`);
console.log(`Pass: ${results.length - failed.length}`);
console.log(`Fail: ${failed.length}`);

if (failed.length > 0) {
  process.exit(1);
}
