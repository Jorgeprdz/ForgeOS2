'use strict';

const assert = require('assert');
const {
  summarizeForgeQuotePdfText,
  buildForgeQuoteExcelTables
} = require('../../product-intelligence/evidence/forge-quote-pdf-preview-engine.js');

const sampleText = `
Asesor profesional de seguros: ANA KAREN GARZA LOPERENA
Asegurado: Lariza Saenz
Fecha de nacimiento: 29/12/2002 Edad: 23
Género: Femenino Fumador: No
Opción de liquidación: Pago único Moneda: UDI
IMAGINA SER 65 PAGOS 42 años 75,000 2,943.00
LIMITADOS 15
BAM UI 1 REN Amparado 0.00
AV UI 1 REN Amparado 0.00
BIT 65 15 años Amparado 46.22
BMA 65 42 años 75,000 214.20
BAIT 65 42 años 75,000 233.10
Prima Total Anual 3,437
Prima básica 286 859 1,718 3,437
Prima planeada 0 0 0 0
Prima total 286 859 1,718 3,437
42 65 89,982 378 139,268 585 63,003 265
interés utilizada en este estudio es de 3.95 %.
Este estudio se realizó con Solucionline versión 2.18.5.0 el día 07/07/2026.
Ingreso Mensual con periodo de garantía de 10 años
`;

const summary = summarizeForgeQuotePdfText({
  text: sampleText,
  udiMxn: 8.808839,
  udiSource: 'test',
  udiDate: '2026-07-07',
  udiGrowthRate: 0.045,
  udiGrowthSource: 'repo_udi_growth_rule',
  udiGrowthEvidence: 'test:1:0.045'
});

assert.strictEqual(summary.status, 'PASS');
assert.strictEqual(summary.result.detectedQuoteDomain, 'life');
assert.strictEqual(summary.result.product, 'IMAGINA SER');
assert.strictEqual(summary.result.plan, 'IMAGINA SER 65 PAGOS LIMITADOS 15');
assert.strictEqual(summary.result.prospect, 'Lariza Saenz');
assert.strictEqual(summary.result.gender, 'Femenino');
assert.strictEqual(summary.result.smoker, 'No');
assert.strictEqual(summary.result.sumInsured, '75000');
assert.strictEqual(summary.result.totalAnnualPremium, '3437');
assert.strictEqual(summary.result.policyTerm, '42 años');
assert.strictEqual(summary.result.paymentTerm, '15 años');
assert.strictEqual(summary.result.retirementInterestRate, '3.95%');
assert.strictEqual(summary.result.retirementScenarioBase.singlePaymentUdi, 89982);
assert.strictEqual(summary.result.retirementScenarioFavorable.singlePaymentUdi, 139268);
assert.strictEqual(summary.result.retirementScenarioUnfavorable.monthlyIncomeUdi, 265);
assert.strictEqual(summary.result.calculation.projectedUdiMxnAtPolicyTerm, 55.95);
assert.strictEqual(summary.result.calculation.annualPremiumMxnToday, 30275.98);
assert.strictEqual(summary.result.calculation.sumInsuredMxnToday, 660662.93);
assert.strictEqual(summary.result.calculation.savingsGoalMxnProjectedAtPolicyTerm, 5034525.13);

const tables = buildForgeQuoteExcelTables(summary);
assert.ok(Array.isArray(tables.Resumen));
assert.ok(Array.isArray(tables.DatosPDF));
assert.ok(Array.isArray(tables.CalculoUDI));

const noEvidenceSummary = summarizeForgeQuotePdfText({
  text: sampleText,
  udiMxn: 8.808839
});
assert.strictEqual(noEvidenceSummary.result.calculation.projectedUdiMxnAtPolicyTerm, null);
assert.ok(noEvidenceSummary.result.calculation.warnings.some((warning) => warning.includes('growth rule evidence')));

console.log('PASS forge quote pdf preview engine test');
