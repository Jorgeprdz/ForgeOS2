/*
|--------------------------------------------------------------------------
| MODULE: gmm-client-review-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Convierte el review del asesor en explicacion clara para cliente.
|
|--------------------------------------------------------------------------
*/

function firstInsured(policySummary = {}) {
  return Array.isArray(policySummary.insureds)
    ? policySummary.insureds[0] || {}
    : {};
}

function formatPlan(value = '') {
  return String(value)
    .replace(/^Alfa Medical\s+/i, '')
    .trim();
}

function money(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return `$${value.toLocaleString('en-US')}`;
}

function activeOptionalCoverages(policySummary = {}) {
  return (policySummary.optionalCoverages || [])
    .filter((coverage) => coverage.status === 'ACTIVE' || coverage.status === 'SELECTED');
}

function changeSentence(change = {}) {
  if (change.field === 'deductible') {
    return `The deductible changed from ${money(change.quoteValue)} in the quote to ${money(change.policyValue)} in the issued policy.`;
  }

  if (change.field === 'sumInsured') {
    return `The maximum insured amount shown changed from ${money(change.quoteValue)} to ${money(change.policyValue)}.`;
  }

  if (change.field === 'coinsuranceCap') {
    return `The coinsurance cap changed from ${money(change.quoteValue)} to ${money(change.policyValue)}.`;
  }

  if (change.field === 'zone') {
    return `The hospital zone changed from ${change.quoteValue} to ${change.policyValue}.`;
  }

  if (change.field === 'paymentMode') {
    return `The payment mode changed from ${change.quoteValue} to ${change.policyValue}.`;
  }

  if (change.field === 'premium') {
    return `The quoted premium and issued premium are different: ${money(change.quoteValue)} vs ${money(change.policyValue)}.`;
  }

  return `${change.label || change.field} changed from ${change.quoteValue} to ${change.policyValue}.`;
}

function buildClientSnapshot({ quoteSummary = {}, policySummary = {}, comparisonSummary = {} }) {
  const insured = firstInsured(policySummary);
  const plan = policySummary.plan || quoteSummary.plan || null;

  return {
    product: policySummary.product || quoteSummary.product || null,
    plan: plan ? formatPlan(plan) : null,
    insured: insured.name || quoteSummary.prospect || null,
    proposedFor: quoteSummary.prospect || null,
    status: comparisonSummary.identityMatch === 'SAME_INSURED'
      ? 'Ready to review together'
      : 'Needs review before relying on both documents'
  };
}

function buildWhatYouBought(policySummary = {}) {
  const optionals = activeOptionalCoverages(policySummary);

  const output = [
    `The issued policy shows ${policySummary.product || 'the medical plan'} ${formatPlan(policySummary.plan || '')}.`.trim(),
    `It shows a deductible of ${money(policySummary.deductible)} and coinsurance of ${policySummary.coinsurance}%.`,
    `It shows a coinsurance cap of ${money(policySummary.coinsuranceCap)}.`,
    `It shows territoriality as ${policySummary.territoriality || 'not specified in the summary'}.`
  ];

  if (optionals.length > 0) {
    output.push(
      `The active optional coverage shown is: ${optionals.map((coverage) => coverage.code || coverage.name).join(', ')}.`
    );
  } else {
    output.push('No active optional coverage was clearly identified in this summary.');
  }

  return output;
}

function buildWhatChanged(comparisonSummary = {}) {
  const changes = comparisonSummary.changed || [];

  if (changes.length === 0) {
    return ['No quote-to-policy changes were detected in the compared fields.'];
  }

  return changes.map(changeSentence);
}

function buildImportantThingsToKnow({ quoteSummary = {}, policySummary = {}, comparisonSummary = {} }) {
  const items = [
    'A quote helps show a possible scenario; the issued policy shows what was actually issued.',
    'The deductible is the amount the client should be prepared to absorb first in a medical event.',
    'Optional benefits should be confirmed in the issued policy, not only in the quote.'
  ];

  if (policySummary.territoriality) {
    items.push(`The issued policy shows territoriality as ${policySummary.territoriality}.`);
  }

  if (comparisonSummary.identityMatch === 'DIFFERENT_INSURED') {
    items.unshift(
      'These documents appear to refer to different people, so they should be reviewed carefully before comparing them.'
    );
  }

  if ((quoteSummary.optionalCoverages || []).length > 0) {
    items.push(
      'The quote mentioned an optional accident deductible benefit; confirm how it appears in the issued policy.'
    );
  }

  return items;
}

function buildQuestionsToDiscuss({ advisorReview = {}, comparisonSummary = {} }) {
  const advisorQuestions = advisorReview.followUpQuestions || [];
  const clientQuestions = advisorQuestions.map((question) =>
    question
      .replace('Are these documents intended to be reviewed together, or do they belong to different cases?', 'Do these two documents belong to the same case?')
      .replace('Did you expect the issued policy to match the quote exactly?', 'Did you expect the policy to match the quote exactly?')
      .replace('Do you understand what CEDA is intended to represent in the issued policy?', 'Do you want to review what CEDA means in this policy?')
  );

  const hasDeductibleQuestion =
    clientQuestions.some((question) =>
      question.toLowerCase().includes('deductible')
    );

  if (
    comparisonSummary.changed?.some((item) => item.field === 'deductible')
    && !hasDeductibleQuestion
  ) {
    clientQuestions.push('Are you comfortable with the deductible shown in the issued policy?');
  }

  return [...new Set(clientQuestions)];
}

function buildClientSummary({
  clientSnapshot,
  comparisonSummary = {},
  whatChanged = []
}) {
  const sentences = [
    `This review is about helping you understand the difference between what was quoted and what was issued.`,
    `The policy shown is for ${clientSnapshot.insured || 'the insured person'} and the plan is ${clientSnapshot.product || 'the product'} ${clientSnapshot.plan || ''}.`.trim(),
    'The quote is useful for comparison, but the issued policy is the document to review for the final details.'
  ];

  if (comparisonSummary.identityMatch === 'DIFFERENT_INSURED') {
    sentences.push(
      'The first thing to clarify is that the quote and policy appear to refer to different people.'
    );
  }

  if (whatChanged.length > 0) {
    sentences.push(
      'Some values changed, including items that affect what the client should expect financially.'
    );
  }

  sentences.push(
    'The best next step is to review the changed items together and confirm whether the issued policy matches what you expected.'
  );

  sentences.push(
    'This is an explanation review only, not a claim or coverage decision.'
  );

  return sentences.join(' ');
}

export function buildGmmClientReview({
  quoteSummary = {},
  policySummary = {},
  comparisonSummary = {},
  advisorReview = {}
} = {}) {
  const clientSnapshot =
    buildClientSnapshot({
      quoteSummary,
      policySummary,
      comparisonSummary
    });

  const whatChanged = buildWhatChanged(comparisonSummary);

  return {
    clientSnapshot,
    whatYouBought: buildWhatYouBought(policySummary),
    whatChanged,
    importantThingsToKnow:
      buildImportantThingsToKnow({
        quoteSummary,
        policySummary,
        comparisonSummary
      }),
    questionsToDiscuss:
      buildQuestionsToDiscuss({
        advisorReview,
        comparisonSummary
      }),
    clientSummary:
      buildClientSummary({
        clientSnapshot,
        comparisonSummary,
        whatChanged
      })
  };
}

export default buildGmmClientReview;
