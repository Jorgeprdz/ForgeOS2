/*
|--------------------------------------------------------------------------
| MODULE: proposal-family-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Agrupa multiples escenarios de cotizacion para el mismo prospecto.
|
|--------------------------------------------------------------------------
*/

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function protectionScore(quote = {}) {
  const sumInsured = Number(quote.sumInsured || 0);
  const deductible = Number(quote.deductible || 0);
  const cap = Number(quote.coinsuranceCap || 0);
  const optionals = Array.isArray(quote.optionalCoverages)
    ? quote.optionalCoverages.length
    : 0;

  return (sumInsured / 1000000) - (deductible / 10000) - (cap / 100000) + optionals;
}

function byPremium(left, right) {
  return Number(left.premium || 0) - Number(right.premium || 0);
}

function uniqueByReference(quotes = []) {
  return [...new Set(quotes)];
}

function sameProspect(quotes = []) {
  const names =
    quotes.map((quote) => normalize(quote.prospect))
      .filter(Boolean);

  return new Set(names).size <= 1;
}

function scenarioLabel(index) {
  return `Scenario ${index + 1}`;
}

export function buildProposalFamily({ quoteSummaries = [] } = {}) {
  const validQuotes =
    quoteSummaries.filter((quote) => quote && typeof quote === 'object');

  const warnings = [];

  if (validQuotes.length === 0) {
    return {
      proposalFamily: {
        prospect: null,
        product: null,
        scenarioCount: 0,
        sameProspect: false,
        warnings: ['No quote summaries provided.']
      },
      economicOption: null,
      balancedOption: null,
      premiumOption: null,
      comparisonTable: [],
      recommendationFactors: []
    };
  }

  if (!sameProspect(validQuotes)) {
    warnings.push('Quotes do not all appear to belong to the same prospect.');
  }

  const sortedByPremium = [...validQuotes].sort(byPremium);
  const sortedByProtection =
    [...validQuotes].sort((left, right) => protectionScore(right) - protectionScore(left));

  const economicOption = sortedByPremium[0] || null;
  const premiumOption = sortedByProtection[0] || null;
  const middleIndex = Math.floor(sortedByPremium.length / 2);
  const balancedOption =
    sortedByPremium.length >= 3
      ? sortedByPremium[middleIndex]
      : uniqueByReference([economicOption, premiumOption])[0] || null;

  return {
    proposalFamily: {
      prospect: validQuotes[0].prospect || null,
      product: validQuotes[0].product || null,
      scenarioCount: validQuotes.length,
      sameProspect: sameProspect(validQuotes),
      warnings
    },
    economicOption,
    balancedOption,
    premiumOption,
    comparisonTable:
      validQuotes.map((quote, index) => ({
        scenario: quote.scenarioName || scenarioLabel(index),
        plan: quote.plan,
        premium: quote.premium,
        deductible: quote.deductible,
        coinsurance: quote.coinsurance,
        coinsuranceCap: quote.coinsuranceCap,
        sumInsured: quote.sumInsured,
        optionalCoverages: quote.optionalCoverages || []
      })),
    recommendationFactors: [
      'Lowest premium is the economic option.',
      'Highest protection uses sum insured, deductible, cap and optional coverages.',
      'Balanced option is the middle premium scenario when three or more scenarios exist.',
      'This engine categorizes scenarios only and does not recommend a product.'
    ]
  };
}

export default buildProposalFamily;
