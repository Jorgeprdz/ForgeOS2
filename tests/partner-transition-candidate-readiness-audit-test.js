const fs = require('fs');
const path = require('path');

const docPath = path.join(
  process.cwd(),
  'docs/02-build-tree/PARTNER_COMP_TRANSITION_CANDIDATE_READINESS_002.md'
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const text = fs.readFileSync(docPath, 'utf8');

const requiredSnippets = [
  'Partner Compensation overall remains **PARTIAL / ACTIVE WORKSTREAM**',
  'Full candidate completeness is **NOT CLOSED**',
  'Bono de Transicion remains **PARTIAL**',
  'advisor -> promoted/new partner',
  'formerAdvisorCompensationKey',
  'partnerContractDate',
  'transitionWindowMonth',
  'eligible initial commissions',
  'eligible renewal commissions',
  'commissionType=initial',
  'commissionType=renewal',
  'Productividad, Produccion, or Actividad logic',
  'transition window months 1-6',
  'nonAdministrationEvidence',
  'nonClientInterventionEvidence',
  'paidPremiumEvidence',
  'paidAppliedCommissionEvidence',
  'transitionBonusCandidate = eligibleInitialCommissions + eligibleRenewalCommissions',
  '`candidateAmount` is not `payoutTruth`',
  '`payoutTruth=true` remains `BLOCKED_BY_OFFICIAL_EVIDENCE`',
  '`payoutTruth=false`',
  'Unknown is not zero',
  'READINESS_LOCKED'
];

for (const snippet of requiredSnippets) {
  assert(
    text.includes(snippet),
    `Missing required transition readiness snippet: ${snippet}`
  );
}

assert(
  !/Bono de Transicion remains \*\*IMPLEMENTED/i.test(text),
  'Transition must not be marked implemented.'
);

assert(
  !/Transition.*payoutTruth=true/i.test(text),
  'Transition readiness must not imply payoutTruth=true.'
);

assert(
  !/official statement adapter is introduced/i.test(text) ||
    text.includes('No official statement adapter is introduced in this phase.'),
  'Official statement adapter must remain deferred.'
);

console.log('PASS partner-transition-candidate-readiness-audit-test');
