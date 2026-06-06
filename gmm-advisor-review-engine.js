/*
|--------------------------------------------------------------------------
| MODULE: gmm-advisor-review-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Convierte hechos de cotizacion, caratula y comparacion en briefing de asesor.
|
|--------------------------------------------------------------------------
*/

function firstInsured(policySummary = {}) {
  return Array.isArray(policySummary.insureds)
    ? policySummary.insureds[0] || {}
    : {};
}

function normalizePriority(value = '') {
  const normalized = String(value).toUpperCase();

  if (normalized === 'HIGH') {
    return 'HIGH';
  }

  if (normalized === 'MEDIUM') {
    return 'MEDIUM';
  }

  return 'LOW';
}

function formatProductPlan(quoteSummary = {}, policySummary = {}) {
  const product = policySummary.product || quoteSummary.product || 'Unknown product';
  const plan = policySummary.plan || quoteSummary.plan || 'Unknown plan';

  return `${product} ${String(plan).replace(/^Alfa Medical\s+/i, '')}`.trim();
}

function buildStatus(identityMatch) {
  if (identityMatch === 'SAME_INSURED') {
    return 'READY FOR ADVISOR REVIEW';
  }

  if (identityMatch === 'POSSIBLE_MATCH') {
    return 'CONFIRM IDENTITY';
  }

  return 'REVIEW REQUIRED';
}

function buildCaseSnapshot({ quoteSummary = {}, policySummary = {}, comparisonSummary = {} }) {
  const insured = firstInsured(policySummary);

  return {
    product: formatProductPlan(quoteSummary, policySummary),
    prospect: quoteSummary.prospect || null,
    issuedPolicy: insured.name || null,
    policyNumber: policySummary.policyNumber || null,
    identityMatch: comparisonSummary.identityMatch || 'UNKNOWN',
    status: buildStatus(comparisonSummary.identityMatch)
  };
}

function advisorAlert(priority, message, source = 'advisor-review') {
  return {
    priority,
    message,
    source
  };
}

function buildAdvisorAlerts(comparisonSummary = {}) {
  const alerts =
    (comparisonSummary.advisorAlerts || []).map((alert) =>
      advisorAlert(
        normalizePriority(alert.priority),
        alert.message,
        'quote-policy-comparison'
      )
    );

  if (
    comparisonSummary.identityMatch === 'DIFFERENT_INSURED'
    && !alerts.some((alert) => alert.message.includes('different insureds'))
  ) {
    alerts.unshift(
      advisorAlert(
        'HIGH',
        'Quote and policy belong to different insureds.',
        'advisor-review'
      )
    );
  }

  return alerts.sort((left, right) => {
    const priorityScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return priorityScore[right.priority] - priorityScore[left.priority];
  });
}

function buildClientRisks({ quoteSummary = {}, policySummary = {}, comparisonSummary = {} }) {
  const risks = [
    'Client may believe the quote equals the policy.',
    'Client may assume illustrated values are the same as issued values.'
  ];

  if ((quoteSummary.optionalCoverages || []).length > 0 || (policySummary.optionalCoverages || []).length > 0) {
    risks.push(
      'Client may assume every optional benefit discussed is active exactly as expected.'
    );
  }

  if (comparisonSummary.changed?.some((item) => item.field === 'deductible')) {
    risks.push(
      'Client may not realize the amount they must absorb first changed between documents.'
    );
  }

  if (comparisonSummary.changed?.some((item) => item.field === 'territoriality')) {
    risks.push(
      'Client may misunderstand where the issued policy is intended to operate.'
    );
  }

  return risks;
}

function plainGapMessage(gap = {}) {
  if (gap.field === 'insured') {
    return 'The quote and policy appear to refer to different people.';
  }

  if (gap.field === 'deductible') {
    return 'The policy shows a higher deductible than the quote.';
  }

  if (gap.field === 'sumInsured') {
    return 'The policy shows a lower sum insured than the quote.';
  }

  if (gap.field === 'optionalCoverages') {
    return 'An optional benefit discussed in the quote is not clearly reflected as active in the policy.';
  }

  return gap.message || 'A client expectation may differ from the issued policy.';
}

function buildExpectationGaps(comparisonSummary = {}) {
  return (comparisonSummary.expectationGaps || []).map((gap) => ({
    severity: normalizePriority(gap.severity),
    field: gap.field,
    message: plainGapMessage(gap)
  }));
}

function buildDiscussionTopics({ quoteSummary = {}, policySummary = {}, comparisonSummary = {} }) {
  const topics = [
    'Quote vs issued policy differences',
    'What the client should rely on in the issued policy',
    'Financial participation: deductible, coinsurance and cap',
    'Active optional coverages'
  ];

  if (comparisonSummary.changed?.some((item) => item.field === 'zone')) {
    topics.push('Hospital zone expectations');
  }

  if (policySummary.territoriality || quoteSummary.territoriality) {
    topics.push('Territoriality expectations');
  }

  if ((policySummary.optionalCoverages || []).some((coverage) => coverage.code === 'CEDA')) {
    topics.push('CEDA expectation and client understanding');
  }

  return [...new Set(topics)];
}

function buildFollowUpQuestions({ comparisonSummary = {}, policySummary = {} }) {
  const questions = [
    'Did you expect the issued policy to match the quote exactly?',
    'Are you comfortable with the deductible shown in the policy?',
    'Do you understand which optional coverages are active?'
  ];

  if (comparisonSummary.identityMatch === 'DIFFERENT_INSURED') {
    questions.unshift(
      'Are these documents intended to be reviewed together, or do they belong to different cases?'
    );
  }

  if ((policySummary.optionalCoverages || []).some((coverage) => coverage.code === 'CEDA')) {
    questions.push(
      'Do you understand what CEDA is intended to represent in the issued policy?'
    );
  }

  questions.push(
    'Were you expecting any additional protection, such as patrimonial or international protection, to appear here?'
  );

  return questions;
}

function buildAdvisorSummary({ caseSnapshot, advisorAlerts = [], expectationGaps = [] }) {
  const highAlerts =
    advisorAlerts.filter((alert) => alert.priority === 'HIGH');

  const sentences = [
    `This case is marked ${caseSnapshot.status}.`,
    `The quote prospect is ${caseSnapshot.prospect || 'unknown'}, while the issued policy shows ${caseSnapshot.issuedPolicy || 'unknown'}.`
  ];

  if (caseSnapshot.identityMatch === 'DIFFERENT_INSURED') {
    sentences.push(
      'Before presenting differences to the client, confirm whether both documents belong to the same conversation.'
    );
  }

  if (expectationGaps.length > 0) {
    sentences.push(
      'There are expectation gaps the advisor should address before the client relies on the quote.'
    );
  }

  if (highAlerts.length > 0) {
    sentences.push(
      `The highest-priority alert is: ${highAlerts[0].message}`
    );
  }

  sentences.push(
    'Focus the conversation on what changed, what is now shown in the issued policy, and what the client believed they were getting.'
  );

  sentences.push(
    'This briefing is preparation for a client conversation, not a coverage or claim decision.'
  );

  return sentences.join(' ');
}

export function buildGmmAdvisorReview({
  quoteSummary = {},
  policySummary = {},
  comparisonSummary = {}
} = {}) {
  const caseSnapshot =
    buildCaseSnapshot({
      quoteSummary,
      policySummary,
      comparisonSummary
    });

  const advisorAlerts = buildAdvisorAlerts(comparisonSummary);
  const expectationGaps = buildExpectationGaps(comparisonSummary);

  return {
    caseSnapshot,
    advisorAlerts,
    clientRisks:
      buildClientRisks({
        quoteSummary,
        policySummary,
        comparisonSummary
      }),
    expectationGaps,
    discussionTopics:
      buildDiscussionTopics({
        quoteSummary,
        policySummary,
        comparisonSummary
      }),
    followUpQuestions:
      buildFollowUpQuestions({
        comparisonSummary,
        policySummary
      }),
    advisorSummary:
      buildAdvisorSummary({
        caseSnapshot,
        advisorAlerts,
        expectationGaps
      })
  };
}

export default buildGmmAdvisorReview;
