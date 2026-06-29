const MANAGER_RDA_ATTRIBUTION_STATUSES = Object.freeze({
  MISSING: "MISSING",
  PROPOSED: "PROPOSED",
  PROVIDED: "PROVIDED",
  PENDING_REVIEW: "PENDING_REVIEW",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MANAGER_RDA_ATTRIBUTION_DECISIONS = Object.freeze({
  COLLECT_RDA_ATTRIBUTION_EVIDENCE: "COLLECT_RDA_ATTRIBUTION_EVIDENCE",
  REVIEW_RDA_ATTRIBUTION: "REVIEW_RDA_ATTRIBUTION",
  CONFIRM_MANAGER_OS_RDA_ATTRIBUTION_TRUTH: "CONFIRM_MANAGER_OS_RDA_ATTRIBUTION_TRUTH",
  REJECT_RDA_ATTRIBUTION_WITH_REVIEW: "REJECT_RDA_ATTRIBUTION_WITH_REVIEW",
  BLOCK_DOWNSTREAM_TRUTH: "BLOCK_DOWNSTREAM_TRUTH"
});

const FORBIDDEN_TRANSITIONS = new Set([
  "COMPENSATION_OWNERSHIP_TRUTH",
  "PRECONTRACT",
  "ADVISOR_LIFECYCLE",
  "REVENUE",
  "COMPENSATION",
  "PAYOUT",
  "PAYMENT",
  "AUTOMATIC_APPROVAL",
  "AUTOMATIC_REJECTION"
]);

const MANAGER_TRUTH_TRANSITIONS = new Set([
  "MANAGER_OWNERSHIP_TRUTH",
  "RDA_ATTRIBUTION_TRUTH"
]);

const STATUS_ALIASES = Object.freeze({
  MISSING: MANAGER_RDA_ATTRIBUTION_STATUSES.MISSING,
  PROPOSED: MANAGER_RDA_ATTRIBUTION_STATUSES.PROPOSED,
  PROVIDED: MANAGER_RDA_ATTRIBUTION_STATUSES.PROVIDED,
  PENDING: MANAGER_RDA_ATTRIBUTION_STATUSES.PENDING_REVIEW,
  PENDING_REVIEW: MANAGER_RDA_ATTRIBUTION_STATUSES.PENDING_REVIEW,
  REVIEW_REQUIRED: MANAGER_RDA_ATTRIBUTION_STATUSES.PENDING_REVIEW,
  CONFIRMED: MANAGER_RDA_ATTRIBUTION_STATUSES.CONFIRMED,
  APPROVED: MANAGER_RDA_ATTRIBUTION_STATUSES.CONFIRMED,
  REJECTED: MANAGER_RDA_ATTRIBUTION_STATUSES.REJECTED,
  BLOCKED: MANAGER_RDA_ATTRIBUTION_STATUSES.BLOCKED,
  UNKNOWN: MANAGER_RDA_ATTRIBUTION_STATUSES.UNKNOWN,
  NOT_MODELED: MANAGER_RDA_ATTRIBUTION_STATUSES.NOT_MODELED
});

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
  return present(value) ? String(value).trim().toUpperCase() : null;
}

function normalizeStatus(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return STATUS_ALIASES[normalized] || MANAGER_RDA_ATTRIBUTION_STATUSES.NOT_MODELED;
}

function boundaryFlags({ createsTruth = false } = {}) {
  return {
    automaticDecisionAllowed: false,
    createsManagerOwnershipTruth: createsTruth,
    createsRdaAttributionTruth: createsTruth,
    createsCompensationOwnershipTruth: false,
    createsPrecontractTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false
  };
}

function firstPresent(...values) {
  return values.find(present) || null;
}

function resolveOwner(attribution = {}, evidence = {}, managerReview = {}) {
  return firstPresent(
    attribution.rdaOwnerId,
    attribution.ownerId,
    attribution.managerId,
    attribution.advisorId,
    attribution.sourceAdvisor,
    evidence.rdaOwnerId,
    evidence.ownerId,
    evidence.managerId,
    evidence.sourceAdvisor,
    managerReview.rdaOwnerId,
    managerReview.ownerId,
    managerReview.managerId
  );
}

function hasEvidenceRefs(input) {
  return collectEvidenceRefs(input).length > 0 || collectSourceEvidenceIds(input).length > 0;
}

function hasExplicitEvidenceConfirmation({ rdaAttribution = {}, rdaEvidence = {}, managerReview = {} } = {}) {
  const attribution = rdaAttribution || {};
  const evidence = rdaEvidence || {};
  const review = managerReview || {};

  return attribution.evidenceConfirmed === true ||
    attribution.managerOsEvidenceConfirmed === true ||
    evidence.evidenceConfirmed === true ||
    evidence.managerOsEvidenceConfirmed === true ||
    review.evidenceConfirmed === true;
}

function hasIndependentManagerReview(managerReview = {}) {
  return managerReview.reviewed === true &&
    managerReview.selfConfirmed !== true &&
    managerReview.override !== true;
}

function resolveAttributionStatus({ rdaAttribution = null, rdaEvidence = null } = {}) {
  const attributionStatus = normalizeStatus(rdaAttribution && rdaAttribution.status);
  if (attributionStatus) return attributionStatus;

  const evidenceStatus = normalizeStatus(rdaEvidence && rdaEvidence.status);
  if (evidenceStatus) return evidenceStatus;

  if (!rdaAttribution && !rdaEvidence) return MANAGER_RDA_ATTRIBUTION_STATUSES.MISSING;
  if (rdaAttribution || rdaEvidence) return MANAGER_RDA_ATTRIBUTION_STATUSES.PROVIDED;
  return MANAGER_RDA_ATTRIBUTION_STATUSES.UNKNOWN;
}

function collectEvidenceRefs({
  rdaAttribution = null,
  rdaEvidence = null,
  managerReview = {},
  recruitmentRdaPrerequisite = {},
  precontractGate = {},
  candidate = {},
  application = {},
  recruit = {},
  advisorCandidate = {}
} = {}) {
  return unique([
    ...asArray(rdaAttribution && rdaAttribution.evidenceRefs),
    ...asArray(rdaEvidence && rdaEvidence.evidenceRefs),
    ...(rdaEvidence && rdaEvidence.rdaId ? [rdaEvidence.rdaId] : []),
    ...asArray(managerReview.evidenceRefs),
    ...asArray(recruitmentRdaPrerequisite.evidenceRefs),
    ...asArray(precontractGate.evidenceRefs),
    candidate.candidateId,
    application.applicationId,
    recruit.recruitIdentityId,
    advisorCandidate.advisorCandidateId,
    advisorCandidate.advisorId
  ]);
}

function collectSourceEvidenceIds({
  rdaAttribution = null,
  rdaEvidence = null,
  managerReview = {},
  recruitmentRdaPrerequisite = {},
  precontractGate = {}
} = {}) {
  return unique([
    ...asArray(rdaAttribution && rdaAttribution.sourceEvidenceIds),
    ...asArray(rdaEvidence && rdaEvidence.sourceEvidenceIds),
    ...asArray(managerReview.sourceEvidenceIds),
    ...asArray(recruitmentRdaPrerequisite.sourceEvidenceIds),
    ...asArray(precontractGate.sourceEvidenceIds)
  ]);
}

function collectWarnings({
  rdaAttribution = null,
  rdaEvidence = null,
  managerReview = {},
  recruitmentRdaPrerequisite = {},
  precontractGate = {}
} = {}) {
  return unique([
    ...asArray(rdaAttribution && rdaAttribution.warnings),
    ...asArray(rdaEvidence && rdaEvidence.warnings),
    ...asArray(managerReview.warnings),
    ...asArray(recruitmentRdaPrerequisite.warnings),
    ...asArray(precontractGate.warnings)
  ]);
}

function collectConfidenceLimitations({
  rdaAttribution = null,
  rdaEvidence = null,
  managerReview = {},
  recruitmentRdaPrerequisite = {},
  precontractGate = {}
} = {}) {
  return unique([
    ...asArray(rdaAttribution && rdaAttribution.confidenceLimitations),
    ...asArray(rdaEvidence && rdaEvidence.confidenceLimitations),
    ...asArray(managerReview.confidenceLimitations),
    ...asArray(recruitmentRdaPrerequisite.confidenceLimitations),
    ...asArray(precontractGate.confidenceLimitations)
  ]);
}

function evaluateManagerRdaAttributionTruth({
  rdaAttribution = null,
  rdaEvidence = null,
  managerReview = {},
  recruitmentRdaPrerequisite = {},
  precontractGate = {},
  candidate = {},
  application = {},
  recruit = {},
  advisorCandidate = {},
  requestedTransition = null
} = {}) {
  const input = {
    rdaAttribution,
    rdaEvidence,
    managerReview,
    recruitmentRdaPrerequisite,
    precontractGate,
    candidate,
    application,
    recruit,
    advisorCandidate
  };

  const requested = normalizeText(requestedTransition);
  const proposedRdaOwner = resolveOwner(rdaAttribution || {}, rdaEvidence || {}, managerReview || {});
  const missingEvidence = [];
  const missingPrerequisites = [];
  const allowedTransitions = [];
  const blockedTransitions = [];
  const warnings = collectWarnings(input);
  const confidenceLimitations = collectConfidenceLimitations(input);
  let attributionStatus = resolveAttributionStatus({ rdaAttribution, rdaEvidence });

  if (!proposedRdaOwner) missingEvidence.push("rda_owner_identity_required");
  if (!rdaAttribution && !rdaEvidence) missingEvidence.push("rda_attribution_or_evidence_required");
  if (!hasEvidenceRefs(input)) missingEvidence.push("manager_os_rda_evidence_refs_required");
  if (!hasExplicitEvidenceConfirmation({ rdaAttribution, rdaEvidence, managerReview })) {
    missingEvidence.push("explicit_evidence_confirmed_attribution_required");
  }
  if (!hasIndependentManagerReview(managerReview)) {
    missingPrerequisites.push("independent_manager_review_required");
  }

  if (managerReview.selfConfirmed === true) {
    warnings.push("Manager self-confirmation alone is not ownership truth.");
  }
  if (managerReview.override === true) {
    warnings.push("Manager override is not ownership truth.");
  }
  if (recruitmentRdaPrerequisite.rdaPrerequisiteStatus === "PROVIDED" ||
    recruitmentRdaPrerequisite.rdaPrerequisiteSatisfied === true) {
    warnings.push("Recruitment prerequisite PROVIDED is not RDA attribution truth.");
  }
  if (rdaAttribution && rdaAttribution.source === "compensation_intake") {
    warnings.push("Compensation intake is not Manager OS RDA attribution truth.");
  }
  if (rdaEvidence && !rdaAttribution) {
    warnings.push("RDA evidence is not RDA attribution truth without Manager OS confirmation.");
  }

  if (requested && FORBIDDEN_TRANSITIONS.has(requested)) {
    blockedTransitions.push(requested);
    warnings.push(`${requested} transition is forbidden from Manager OS RDA attribution truth.`);
  }

  const structurallyBlocked = new Set([
    MANAGER_RDA_ATTRIBUTION_STATUSES.REJECTED,
    MANAGER_RDA_ATTRIBUTION_STATUSES.BLOCKED,
    MANAGER_RDA_ATTRIBUTION_STATUSES.NOT_MODELED
  ]).has(attributionStatus);

  if (structurallyBlocked) {
    blockedTransitions.push("MANAGER_OWNERSHIP_TRUTH", "RDA_ATTRIBUTION_TRUTH");
  }

  const explicitConfirmedStatus = attributionStatus === MANAGER_RDA_ATTRIBUTION_STATUSES.CONFIRMED;
  const truthReady = explicitConfirmedStatus &&
    !structurallyBlocked &&
    proposedRdaOwner !== null &&
    hasEvidenceRefs(input) &&
    hasExplicitEvidenceConfirmation({ rdaAttribution, rdaEvidence, managerReview }) &&
    hasIndependentManagerReview(managerReview);

  if (truthReady) {
    allowedTransitions.push("MANAGER_OWNERSHIP_TRUTH", "RDA_ATTRIBUTION_TRUTH");
  } else if (explicitConfirmedStatus) {
    attributionStatus = MANAGER_RDA_ATTRIBUTION_STATUSES.PENDING_REVIEW;
    warnings.push("CONFIRMED status lacks required Manager OS evidence gate for attribution truth.");
  }

  if (requested && MANAGER_TRUTH_TRANSITIONS.has(requested) && !truthReady) {
    blockedTransitions.push(requested);
    warnings.push(`${requested} requires explicit Manager OS evidence-confirmed attribution.`);
  }

  const managerReviewRequired = !truthReady ||
    managerReview.selfConfirmed === true ||
    managerReview.override === true ||
    attributionStatus === MANAGER_RDA_ATTRIBUTION_STATUSES.PENDING_REVIEW ||
    attributionStatus === MANAGER_RDA_ATTRIBUTION_STATUSES.UNKNOWN;

  const humanReviewRequired = managerReviewRequired || blockedTransitions.length > 0;
  const attributionTruthReady = truthReady;
  const confirmedRdaOwner = truthReady ? proposedRdaOwner : null;

  let nextRecommendedAction = MANAGER_RDA_ATTRIBUTION_DECISIONS.REVIEW_RDA_ATTRIBUTION;
  if (attributionStatus === MANAGER_RDA_ATTRIBUTION_STATUSES.MISSING) {
    nextRecommendedAction = MANAGER_RDA_ATTRIBUTION_DECISIONS.COLLECT_RDA_ATTRIBUTION_EVIDENCE;
  } else if (truthReady) {
    nextRecommendedAction = MANAGER_RDA_ATTRIBUTION_DECISIONS.CONFIRM_MANAGER_OS_RDA_ATTRIBUTION_TRUTH;
  } else if (attributionStatus === MANAGER_RDA_ATTRIBUTION_STATUSES.REJECTED) {
    nextRecommendedAction = MANAGER_RDA_ATTRIBUTION_DECISIONS.REJECT_RDA_ATTRIBUTION_WITH_REVIEW;
  } else if (blockedTransitions.length > 0 || attributionStatus === MANAGER_RDA_ATTRIBUTION_STATUSES.BLOCKED) {
    nextRecommendedAction = MANAGER_RDA_ATTRIBUTION_DECISIONS.BLOCK_DOWNSTREAM_TRUTH;
  }

  return {
    attributionStatus,
    attributionTruthReady,
    proposedRdaOwner,
    confirmedRdaOwner,
    managerReviewRequired,
    humanReviewRequired,
    missingEvidence: unique(missingEvidence),
    missingPrerequisites: unique(missingPrerequisites),
    evidenceRefs: collectEvidenceRefs(input),
    sourceEvidenceIds: collectSourceEvidenceIds(input),
    confidenceLimitations,
    warnings: unique(warnings),
    allowedTransitions: unique(allowedTransitions),
    blockedTransitions: unique(blockedTransitions),
    nextRecommendedAction,
    ...boundaryFlags({ createsTruth: truthReady })
  };
}

module.exports = {
  MANAGER_RDA_ATTRIBUTION_DECISIONS,
  MANAGER_RDA_ATTRIBUTION_STATUSES,
  evaluateManagerRdaAttributionTruth
};
