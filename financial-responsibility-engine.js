/*
|--------------------------------------------------------------------------
| MODULE: financial-responsibility-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Calcula participacion financiera estimada sin decidir cobertura.
|
|--------------------------------------------------------------------------
*/

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

export function calculateFinancialResponsibility({
  deductible = 0,
  coinsurance = 0,
  cap = 0,
  hospitalBill = 0
} = {}) {
  const bill = Math.max(toNumber(hospitalBill), 0);
  const deductibleValue = Math.max(toNumber(deductible), 0);
  const coinsurancePercent = Math.max(toNumber(coinsurance), 0);
  const capValue = Math.max(toNumber(cap), 0);

  const deductibleAmount = Math.min(deductibleValue, bill);
  const amountAfterDeductible = Math.max(bill - deductibleAmount, 0);
  const rawCoinsuranceAmount =
    amountAfterDeductible * (coinsurancePercent / 100);

  const coinsuranceAmount =
    capValue > 0
      ? Math.min(rawCoinsuranceAmount, capValue)
      : rawCoinsuranceAmount;

  const clientPays = deductibleAmount + coinsuranceAmount;
  const insurerPays = Math.max(bill - clientPays, 0);

  return {
    deductibleAmount,
    coinsuranceAmount,
    capApplied: capValue > 0 && rawCoinsuranceAmount > capValue,
    clientPays,
    insurerPays
  };
}

export default calculateFinancialResponsibility;
