import { buildProposalFamily } from './proposal-family-engine.js';

const baseQuote = {
  product: 'Alfa Medical',
  prospect: 'Lariza Saenz',
  age: 23,
  gender: 'female',
  territoriality: 'Nacional',
  coinsurance: 10,
  tabulator: 'GAMMA'
};

const quotes = [
  {
    ...baseQuote,
    scenarioName: 'Economic',
    plan: 'INTEGRO',
    premium: 38000,
    deductible: 50000,
    coinsuranceCap: 97000,
    sumInsured: 120000000,
    optionalCoverages: []
  },
  {
    ...baseQuote,
    scenarioName: 'Balanced',
    plan: 'INTEGRO',
    premium: 47388.27,
    deductible: 25000,
    coinsuranceCap: 97000,
    sumInsured: 170000000,
    optionalCoverages: [{ name: 'Eliminacion de Deducible por Accidente' }]
  },
  {
    ...baseQuote,
    scenarioName: 'Premium',
    plan: 'PLENO',
    premium: 72000,
    deductible: 15000,
    coinsuranceCap: 65000,
    sumInsured: 200000000,
    optionalCoverages: [
      { name: 'Eliminacion de Deducible por Accidente' },
      { name: 'Proteccion Patrimonial' }
    ]
  }
];

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

const family = buildProposalFamily({ quoteSummaries: quotes });

test('Proposal family generated', () => {
  assert(family.proposalFamily.scenarioCount === 3, 'Scenario count mismatch.');
});

test('Quotes belong to same prospect', () => {
  assert(family.proposalFamily.sameProspect === true, 'Same prospect not detected.');
});

test('Economic option is lowest premium', () => {
  assert(family.economicOption.scenarioName === 'Economic', 'Economic option mismatch.');
});

test('Balanced option is middle premium scenario', () => {
  assert(family.balancedOption.scenarioName === 'Balanced', 'Balanced option mismatch.');
});

test('Premium option is highest protection', () => {
  assert(family.premiumOption.scenarioName === 'Premium', 'Premium option mismatch.');
});

test('Comparison table generated', () => {
  assert(family.comparisonTable.length === 3, 'Comparison table missing.');
});

test('No recommendation generated', () => {
  assert(!Object.hasOwn(family, 'recommendation'), 'Proposal family must not recommend.');
});

console.log('\nFORGE GMM PROPOSAL FAMILY SMOKE TEST v0.1\n');

for (const result of results) {
  console.log(`${result.status} ${result.name}`);
  if (result.error) {
    console.log(`   ${result.error}`);
  }
}

console.log('\nProposal Family:');
console.log(JSON.stringify(family, null, 2));

const failed = results.filter((result) => result.status === 'FAIL');
console.log('\nSummary:');
console.log(`Total: ${results.length}`);
console.log(`Pass: ${results.length - failed.length}`);
console.log(`Fail: ${failed.length}`);

if (failed.length > 0) {
  process.exit(1);
}
