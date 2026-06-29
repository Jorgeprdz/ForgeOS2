const CAREER_CHAIN_CONTRACT_STATUSES = Object.freeze({
  NOT_EVALUATED: "NOT_EVALUATED",
  READY_FOR_REFERENCE: "READY_FOR_REFERENCE",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  BLOCKED: "BLOCKED",
  NOT_MODELED: "NOT_MODELED"
});

const CANONICAL_CAREER_STAGES = Object.freeze({
  CANDIDATE: "CANDIDATE",
  PRECONTRACT: "PRECONTRACT",
  ADVISOR: "ADVISOR",
  MANAGER_PARTNER: "MANAGER_PARTNER",
  DIRECTOR: "DIRECTOR"
});

const CANONICAL_ROUTE = Object.freeze([
  {
    status: "CANDIDATE",
    stage: CANONICAL_CAREER_STAGES.CANDIDATE,
    routePosition: 1,
    routeLabel: "Candidate"
  },
  {
    status: "PRECONTRACT",
    stage: CANONICAL_CAREER_STAGES.PRECONTRACT,
    routePosition: 2,
    routeLabel: "Precontract"
  },
  {
    status: "ACTIVE",
    stage: CANONICAL_CAREER_STAGES.ADVISOR,
    routePosition: 3,
    routeLabel: "Advisor"
  },
  {
    status: "MANAGER",
    stage: CANONICAL_CAREER_STAGES.MANAGER_PARTNER,
    routePosition: 4,
    routeLabel: "Manager / Partner"
  },
  {
    status: "DIRECTOR",
    stage: CANONICAL_CAREER_STAGES.DIRECTOR,
    routePosition: 5,
    routeLabel: "Director"
  }
]);

const STATUS_ALIASES = Object.freeze({
  CANDIDATE: "CANDIDATE",
  candidate: "CANDIDATE",
  PRECONTRACT: "PRECONTRACT",
  precontract: "PRECONTRACT",
  precontract_signed: "PRECONTRACT",
  pending_activation: "PRECONTRACT",
  ACTIVE: "ACTIVE",
  active: "ACTIVE",
  connected_active: "ACTIVE",
  advisor_development: "ACTIVE",
  new_professional: "ACTIVE",
  professional: "ACTIVE",
  MANAGER: "MANAGER",
  manager: "MANAGER",
  PARTNER: "MANAGER",
  partner: "MANAGER",
  DIRECTOR: "DIRECTOR",
  director: "DIRECTOR",
  INACTIVE: "INACTIVE",
  inactive: "INACTIVE",
  TERMINATED: "INACTIVE",
  terminated: "INACTIVE",
  BLOCKED: "BLOCKED",
  blocked: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  unknown: "UNKNOWN"
});

const FORBIDDEN_TRANSITIONS = new Set([
  "ADVISOR_LIFECYCLE_TRUTH",
  "PRECONTRACT_TRUTH",
  "COMPENSATION_OWNERSHIP_TRUTH",
  "REVENUE",
  "COMPENSATION",
  "PAYOUT",
  "PAYMENT",
  "AUTOMATIC_APPROVAL",
  "AUTOMATIC_REJECTION"
]);

function present(value) {
  return value !== undefined && value !== null && value !== "";
}

function asArray(value) {
  if (!present(value)) return [];
  return Array.isArray(value) ? value.filter(present) : [value].filter(present);
}

function unique(values) {
  return [...new Set(values.filter(present))];
}

function normalizeText(value) {
  return present(value) ? String(value).trim() : null;
}

function normalizeStatus(value) {
  const text = normalizeText(value);
  if (!text) return null;
  return STATUS_ALIASES[text] || STATUS_ALIASES[text.toUpperCase()] || null;
}

function boundaryFlags() {
  return {
    automaticDecisionAllowed: false,
    createsAdvisorLifecycleTruth: false,
    createsCompensationOwnershipTruth: false,
    createsPrecontractTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false
  };
}

function resolveSourceAdvisorStatus(input = {}) {
  return input.advisorStatus ||
    input.lifecycleStatus ||
    input.status ||
    (input.advisor && input.advisor.status) ||
    null;
}

function routeForStatus(status) {
  return CANONICAL_ROUTE.find((route) => route.status === status) || null;
}

function evaluateAdvisorLifecycleCareerChainContract(input = {}) {
  const sourceAdvisorStatus = resolveSourceAdvisorStatus(input);
  const normalizedStatus = normalizeStatus(sourceAdvisorStatus);
  const requestedTransition = normalizeText(input.requestedTransition);
  const warnings = unique([
    ...asArray(input.warnings),
    ...asArray(input.advisor && input.advisor.warnings)
  ]);
  const missingEvidence = unique([
    ...asArray(input.missingEvidence),
    ...asArray(input.advisor && input.advisor.missingEvidence)
  ]);
  const missingPrerequisites = unique([
    ...asArray(input.missingPrerequisites),
    ...asArray(input.advisor && input.advisor.missingPrerequisites)
  ]);
  const blockedTransitions = [];
  const allowedTransitions = [];

  if (requestedTransition && FORBIDDEN_TRANSITIONS.has(requestedTransition.toUpperCase())) {
    blockedTransitions.push(requestedTransition.toUpperCase());
    warnings.push(`${requestedTransition.toUpperCase()} transition is forbidden from career chain reference contract.`);
  }

  if (!present(sourceAdvisorStatus)) {
    missingEvidence.push("advisor_lifecycle_status_required");
    missingPrerequisites.push("career_chain_status_review_required");
    warnings.push("Missing advisor status remains unevaluated and requires review.");
    return {
      careerChainStatus: CAREER_CHAIN_CONTRACT_STATUSES.NOT_EVALUATED,
      canonicalCareerStage: null,
      sourceAdvisorStatus: null,
      routePosition: null,
      routeLabel: null,
      advisorLifecycleReviewRequired: true,
      humanReviewRequired: true,
      missingEvidence: unique(missingEvidence),
      missingPrerequisites: unique(missingPrerequisites),
      evidenceRefs: unique([
        ...asArray(input.evidenceRefs),
        ...asArray(input.advisor && input.advisor.evidenceRefs),
        input.advisorId,
        input.advisor && input.advisor.advisorId
      ]),
      sourceEvidenceIds: unique([
        ...asArray(input.sourceEvidenceIds),
        ...asArray(input.advisor && input.advisor.sourceEvidenceIds)
      ]),
      warnings: unique(warnings),
      allowedTransitions: [],
      blockedTransitions: unique(blockedTransitions),
      ...boundaryFlags()
    };
  }

  if (normalizedStatus === "BLOCKED") {
    missingPrerequisites.push("blocked_career_chain_status_requires_review");
    warnings.push("Blocked status remains blocked and is not zero.");
    return {
      careerChainStatus: CAREER_CHAIN_CONTRACT_STATUSES.BLOCKED,
      canonicalCareerStage: null,
      sourceAdvisorStatus,
      routePosition: null,
      routeLabel: null,
      advisorLifecycleReviewRequired: true,
      humanReviewRequired: true,
      missingEvidence: unique(missingEvidence),
      missingPrerequisites: unique(missingPrerequisites),
      evidenceRefs: unique([
        ...asArray(input.evidenceRefs),
        ...asArray(input.advisor && input.advisor.evidenceRefs),
        input.advisorId,
        input.advisor && input.advisor.advisorId
      ]),
      sourceEvidenceIds: unique([
        ...asArray(input.sourceEvidenceIds),
        ...asArray(input.advisor && input.advisor.sourceEvidenceIds)
      ]),
      warnings: unique(warnings),
      allowedTransitions: [],
      blockedTransitions: unique(blockedTransitions),
      ...boundaryFlags()
    };
  }

  if (normalizedStatus === "INACTIVE") {
    missingPrerequisites.push("inactive_status_requires_lifecycle_review");
    warnings.push("Inactive status is a non-active reference state and is not zero.");
    return {
      careerChainStatus: CAREER_CHAIN_CONTRACT_STATUSES.NEEDS_REVIEW,
      canonicalCareerStage: null,
      sourceAdvisorStatus,
      routePosition: null,
      routeLabel: "Inactive reference - review required",
      advisorLifecycleReviewRequired: true,
      humanReviewRequired: true,
      missingEvidence: unique(missingEvidence),
      missingPrerequisites: unique(missingPrerequisites),
      evidenceRefs: unique([
        ...asArray(input.evidenceRefs),
        ...asArray(input.advisor && input.advisor.evidenceRefs),
        input.advisorId,
        input.advisor && input.advisor.advisorId
      ]),
      sourceEvidenceIds: unique([
        ...asArray(input.sourceEvidenceIds),
        ...asArray(input.advisor && input.advisor.sourceEvidenceIds)
      ]),
      warnings: unique(warnings),
      allowedTransitions: [],
      blockedTransitions: unique(blockedTransitions),
      ...boundaryFlags()
    };
  }

  const route = routeForStatus(normalizedStatus);
  if (!route) {
    missingPrerequisites.push("modeled_career_chain_status_required");
    warnings.push("Unrecognized advisor status is not modeled and requires review.");
    return {
      careerChainStatus: CAREER_CHAIN_CONTRACT_STATUSES.NOT_MODELED,
      canonicalCareerStage: null,
      sourceAdvisorStatus,
      routePosition: null,
      routeLabel: null,
      advisorLifecycleReviewRequired: true,
      humanReviewRequired: true,
      missingEvidence: unique(missingEvidence),
      missingPrerequisites: unique(missingPrerequisites),
      evidenceRefs: unique([
        ...asArray(input.evidenceRefs),
        ...asArray(input.advisor && input.advisor.evidenceRefs),
        input.advisorId,
        input.advisor && input.advisor.advisorId
      ]),
      sourceEvidenceIds: unique([
        ...asArray(input.sourceEvidenceIds),
        ...asArray(input.advisor && input.advisor.sourceEvidenceIds)
      ]),
      warnings: unique(warnings),
      allowedTransitions: [],
      blockedTransitions: unique(blockedTransitions),
      ...boundaryFlags()
    };
  }

  allowedTransitions.push("USE_CAREER_CHAIN_REFERENCE_FOR_REVIEW");
  warnings.push("Career chain contract is read-only and does not create Advisor Lifecycle truth.");

  return {
    careerChainStatus: CAREER_CHAIN_CONTRACT_STATUSES.READY_FOR_REFERENCE,
    canonicalCareerStage: route.stage,
    sourceAdvisorStatus,
    routePosition: route.routePosition,
    routeLabel: route.routeLabel,
    advisorLifecycleReviewRequired: true,
    humanReviewRequired: true,
    missingEvidence: unique(missingEvidence),
    missingPrerequisites: unique(missingPrerequisites),
    evidenceRefs: unique([
      ...asArray(input.evidenceRefs),
      ...asArray(input.advisor && input.advisor.evidenceRefs),
      input.advisorId,
      input.advisor && input.advisor.advisorId
    ]),
    sourceEvidenceIds: unique([
      ...asArray(input.sourceEvidenceIds),
      ...asArray(input.advisor && input.advisor.sourceEvidenceIds)
    ]),
    warnings: unique(warnings),
    allowedTransitions: unique(allowedTransitions),
    blockedTransitions: unique(blockedTransitions),
    ...boundaryFlags()
  };
}

module.exports = {
  CANONICAL_CAREER_STAGES,
  CAREER_CHAIN_CONTRACT_STATUSES,
  evaluateAdvisorLifecycleCareerChainContract
};
