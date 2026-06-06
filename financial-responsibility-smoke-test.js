import { calculateFinancialResponsibility } from './financial-responsibility-engine.js';

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const estimate =
  calculateFinancialResponsibility({
    deductible: 40000,
    coinsurance: 10,
    cap: 85000,
    hospitalBill: 1000000
  });

test('Deductible amount calculated', () => {
  assert(estimate.deductibleAmount === 40000, 'Deductible mismatch.');
});

test('Coinsurance amount calculated without cap', () => {
  assert(estimate.coinsuranceAmount === 85000, 'Coinsurance cap mismatch.');
});

test('Cap applied', () => {
  assert(estimate.capApplied === true, 'Cap should apply.');
});

test('Client pays calculated', () => {
  assert(estimate.clientPays === 125000, 'Client pays mismatch.');
});

test('Insurer pays calculated', () => {
  assert(estimate.insurerPays === 875000, 'Insurer pays mismatch.');
});

test('No claim decision generated', () => {
  assert(!Object.hasOwn(estimate, 'claimDecision'), 'Must not include claimDecision.');
  assert(!Object.hasOwn(estimate, 'covered'), 'Must not include covered.');
});

console.log('\nFORGE GMM FINANCIAL RESPONSIBILITY SMOKE TEST v0.1\n');

for (const result of results) {
  console.log(`${result.status} ${result.name}`);
  if (result.error) {
    console.log(`   ${result.error}`);
  }
}

console.log('\nFinancial Responsibility:');
console.log(JSON.stringify(estimate, null, 2));

const failed = results.filter((result) => result.status === 'FAIL');
console.log('\nSummary:');
console.log(`Total: ${results.length}`);
console.log(`Pass: ${results.length - failed.length}`);
console.log(`Fail: ${failed.length}`);

if (failed.length > 0) {
  process.exit(1);
}
