/*
|--------------------------------------------------------------------------
| MODULE: quote-to-policy-comparison-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Compara una cotizacion GMM contra una caratula emitida.
|
|--------------------------------------------------------------------------
*/

function normalizeValue(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePlan(value = '') {
  return normalizeValue(value)
    .replace(/^alfa medical\s+/, '')
    .trim();
}

function normalizeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : null;
}

function firstInsured(policySummary = {}) {
  return Array.isArray(policySummary.insureds)
    ? policySummary.insureds[0] || {}
    : {};
}

function levenshtein(left = '', right = '') {
  const a = normalizeValue(left);
  const b = normalizeValue(right);

  if (!a || !b) {
    return Math.max(a.length, b.length);
  }

  const matrix = Array.from({ length: b.length + 1 }, (_, index) => [index]);

  for (let index = 0; index <= a.length; index += 1) {
    matrix[0][index] = index;
  }

  for (let row = 1; row <= b.length; row += 1) {
    for (let column = 1; column <= a.length; column += 1) {
      if (b.charAt(row - 1) === a.charAt(column - 1)) {
        matrix[row][column] = matrix[row - 1][column - 1];
      } else {
        matrix[row][column] = Math.min(
          matrix[row - 1][column - 1] + 1,
          matrix[row][column - 1] + 1,
          matrix[row - 1][column] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function compareIdentity(quoteSummary = {}, policySummary = {}) {
  const quoteName = quoteSummary.prospect;
  const policyName = firstInsured(policySummary).name;

  if (!quoteName || !policyName) {
    return 'UNKNOWN';
  }

  const normalizedQuote = normalizeValue(quoteName);
  const normalizedPolicy = normalizeValue(policyName);

  if (normalizedQuote === normalizedPolicy) {
    return 'SAME_INSURED';
  }

  const distance = levenshtein(normalizedQuote, normalizedPolicy);
  const longest = Math.max(normalizedQuote.length, normalizedPolicy.length);
  const similarity = longest > 0 ? 1 - (distance / longest) : 0;

  if (similarity >= 0.82) {
    return 'POSSIBLE_MATCH';
  }

  return 'DIFFERENT_INSURED';
}

function valuesMatch(field, quoteValue, policyValue) {
  if (quoteValue === null || quoteValue === undefined) {
    return false;
  }

  if (policyValue === null || policyValue === undefined) {
    return false;
  }

  if (field === 'plan') {
    return normalizePlan(quoteValue) === normalizePlan(policyValue);
  }

  if (
    field === 'product'
    || field === 'territoriality'
    || field === 'tabulator'
    || field === 'paymentMode'
    || field === 'zone'
  ) {
    return normalizeValue(quoteValue) === normalizeValue(policyValue);
  }

  return quoteValue === policyValue;
}

function compareField({ field, label, quoteValue, policyValue }) {
  if (valuesMatch(field, quoteValue, policyValue)) {
    return {
      type: 'same',
      value: {
        field,
        label,
        value: policyValue
      }
    };
  }

  if (
    quoteValue !== null
    && quoteValue !== undefined
    && policyValue !== null
    && policyValue !== undefined
  ) {
    return {
      type: 'changed',
      value: {
        field,
        label,
        quoteValue,
        policyValue
      }
    };
  }

  return null;
}

function activeOptionalCoverages(policySummary = {}) {
  return (policySummary.optionalCoverages || [])
    .filter((coverage) => coverage.status === 'ACTIVE' || coverage.status === 'SELECTED');
}

function buildContractualFacts(policySummary = {}) {
  const insured = firstInsured(policySummary);

  return [
    { field: 'policyNumber', value: policySummary.policyNumber },
    { field: 'policyPeriod', value: policySummary.policyPeriod },
    { field: 'insured', value: insured.name },
    { field: 'territoriality', value: policySummary.territoriality },
    { field: 'deductible', value: policySummary.deductible },
    { field: 'coinsurance', value: policySummary.coinsurance },
    { field: 'coinsuranceCap', value: policySummary.coinsuranceCap },
    { field: 'activeOptionalCoverages', value: activeOptionalCoverages(policySummary) }
  ].filter((fact) => fact.value !== null && fact.value !== undefined);
}

function buildExpectationGaps({
  identityMatch,
  changed = [],
  quoteSummary = {},
  policySummary = {}
}) {
  const gaps = [];

  if (identityMatch === 'DIFFERENT_INSURED') {
    gaps.push({
      field: 'insured',
      severity: 'HIGH',
      message: 'The quote and policy appear to belong to different people.'
    });
  }

  const deductibleChange = changed.find((item) => item.field === 'deductible');

  if (
    deductibleChange
    && normalizeNumber(deductibleChange.policyValue) > normalizeNumber(deductibleChange.quoteValue)
  ) {
    gaps.push({
      field: 'deductible',
      severity: 'HIGH',
      message: 'The issued policy has a higher deductible than the quote.'
    });
  }

  const sumInsuredChange = changed.find((item) => item.field === 'sumInsured');

  if (
    sumInsuredChange
    && normalizeNumber(sumInsuredChange.policyValue) < normalizeNumber(sumInsuredChange.quoteValue)
  ) {
    gaps.push({
      field: 'sumInsured',
      severity: 'MEDIUM',
      message: 'The issued policy shows a lower sum insured than the quote.'
    });
  }

  const quoteOptionalNames =
    (quoteSummary.optionalCoverages || []).map((coverage) =>
      normalizeValue(coverage.name)
    );

  const policyOptionalNames =
    activeOptionalCoverages(policySummary).map((coverage) =>
      normalizeValue(`${coverage.code || ''} ${coverage.name || ''}`)
    );

  const missingOptionals =
    quoteOptionalNames.filter((name) =>
      !policyOptionalNames.some((policyName) =>
        policyName.includes(name)
        || (
          name.includes('eliminacion de deducible por accidente')
          && policyName.includes('eliminacion de deducible por accidente')
        )
      )
    );

  if (missingOptionals.length > 0) {
    gaps.push({
      field: 'optionalCoverages',
      severity: 'HIGH',
      message: 'An optional benefit shown in the quote is not clearly active in the issued policy.'
    });
  }

  return gaps;
}

function buildAdvisorAlerts({ identityMatch, changed = [], expectationGaps = [] }) {
  const alerts = [];

  if (identityMatch === 'DIFFERENT_INSURED') {
    alerts.push({
      priority: 'High',
      message: 'Quote and policy appear to belong to different insureds. Confirm the documents before presenting differences.'
    });
  }

  if (changed.some((item) => item.field === 'deductible')) {
    alerts.push({
      priority: 'High',
      message: 'Client should review the deductible difference between quote and issued policy.'
    });
  }

  if (changed.some((item) => item.field === 'territoriality')) {
    alerts.push({
      priority: 'High',
      message: 'Client should review territoriality because it changed after the quote.'
    });
  }

  if (changed.some((item) => item.field === 'coinsuranceCap')) {
    alerts.push({
      priority: 'Medium',
      message: 'Coinsurance cap changed. Explain the issued policy value.'
    });
  }

  if (expectationGaps.some((gap) => gap.field === 'optionalCoverages')) {
    alerts.push({
      priority: 'Medium',
      message: 'Optional coverage expectations should be confirmed against the issued policy.'
    });
  }

  return alerts;
}

function buildClientExplanation({ changed = [], identityMatch }) {
  const explanation = [
    'The quote helped illustrate a possible scenario.',
    'The issued policy is the document that shows what was actually issued.'
  ];

  if (identityMatch === 'DIFFERENT_INSURED') {
    explanation.push(
      'These two documents appear to refer to different people, so they should not be treated as one continuous case without confirmation.'
    );
  }

  if (changed.length > 0) {
    explanation.push(
      'Some values changed between the quote and the policy, so the advisor should walk through those differences before the client relies on the quote.'
    );
  }

  return explanation;
}

function comparisonConfidence({ identityMatch, quoteSummary, policySummary }) {
  if (!quoteSummary || !policySummary) {
    return 'LOW';
  }

  if (identityMatch === 'UNKNOWN') {
    return 'LOW';
  }

  if (identityMatch === 'DIFFERENT_INSURED') {
    return 'HIGH';
  }

  return 'MEDIUM';
}

export function compareQuoteToPolicy({ quoteSummary = {}, policySummary = {} } = {}) {
  const identityMatch = compareIdentity(quoteSummary, policySummary);

  const comparisons = [
    {
      field: 'product',
      label: 'Product',
      quoteValue: quoteSummary.product,
      policyValue: policySummary.product
    },
    {
      field: 'plan',
      label: 'Plan',
      quoteValue: quoteSummary.plan,
      policyValue: policySummary.plan
    },
    {
      field: 'territoriality',
      label: 'Territoriality',
      quoteValue: quoteSummary.territoriality,
      policyValue: policySummary.territoriality
    },
    {
      field: 'coinsurance',
      label: 'Coinsurance percent',
      quoteValue: quoteSummary.coinsurance,
      policyValue: policySummary.coinsurance
    },
    {
      field: 'tabulator',
      label: 'Tabulator',
      quoteValue: quoteSummary.tabulator,
      policyValue: policySummary.tabulator
    },
    {
      field: 'deductible',
      label: 'Deductible',
      quoteValue: quoteSummary.deductible,
      policyValue: policySummary.deductible
    },
    {
      field: 'sumInsured',
      label: 'Sum insured',
      quoteValue: quoteSummary.sumInsured,
      policyValue: policySummary.sumInsured
    },
    {
      field: 'coinsuranceCap',
      label: 'Coinsurance cap',
      quoteValue: quoteSummary.coinsuranceCap,
      policyValue: policySummary.coinsuranceCap
    },
    {
      field: 'zone',
      label: 'Zone',
      quoteValue: quoteSummary.zone,
      policyValue: policySummary.zone
    },
    {
      field: 'paymentMode',
      label: 'Payment mode',
      quoteValue: quoteSummary.paymentMode,
      policyValue: policySummary.paymentMode
    },
    {
      field: 'premium',
      label: 'Premium',
      quoteValue: quoteSummary.premium,
      policyValue: policySummary.totalPremium
    }
  ];

  const stayedSame = [];
  const changed = [];

  comparisons
    .map(compareField)
    .filter(Boolean)
    .forEach((comparison) => {
      if (comparison.type === 'same') {
        stayedSame.push(comparison.value);
      }

      if (comparison.type === 'changed') {
        changed.push(comparison.value);
      }
    });

  const contractualFacts = buildContractualFacts(policySummary);
  const expectationGaps =
    buildExpectationGaps({
      identityMatch,
      changed,
      quoteSummary,
      policySummary
    });

  const advisorAlerts =
    buildAdvisorAlerts({
      identityMatch,
      changed,
      expectationGaps
    });

  return {
    identityMatch,
    confidence: comparisonConfidence({ identityMatch, quoteSummary, policySummary }),
    warnings: [
      'Comparison only. This does not determine coverage or claim eligibility.',
      'Issued policy facts override quote assumptions.'
    ],
    stayedSame,
    changed,
    contractualFacts,
    expectationGaps,
    advisorAlerts,
    clientExplanation: buildClientExplanation({ changed, identityMatch })
  };
}

export default compareQuoteToPolicy;
