const RECRUITMENT_RDA_PREREQUISITE_STATUSES = Object.freeze({
  MISSING: "MISSING",
  PENDING: "PENDING",
  UNKNOWN: "UNKNOWN",
  BLOCKED: "BLOCKED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  PROVIDED: "PROVIDED",
  NOT_MODELED: "NOT_MODELED"
});

const RECRUITMENT_RDA_PREREQUISITE_DECISIONS = Object.freeze({
  COLLECT_RDA_EVIDENCE: "COLLECT_RDA_EVIDENCE",
  REVIEW_RDA_PREREQUISITE: "REVIEW_RDA_PREREQUISITE",
  ACCEPT_PREREQUISITE_EVIDENCE_ONLY: "ACCEPT_PREREQUISITE_EVIDENCE_ONLY",
  BLOCK_DOWNSTREAM_TRUTH: "BLOCK_DOWNSTREAM_TRUTH"
});

const FORBIDDEN_TRANSITIONS = new Set([
  "MANAGER_OWNERSHIP_TRUTH",
  "RDA_ATTRIBUTION_TRUTH",
  "COMPENSATION_OWNERSHIP_TRUTH",
  "PRECONTRACT",
  "ADVISOR_LIFECYCLE",
  "REVENUE",
  "COMPENSATION",
  "PAYOUT",
  "PAYMENT"
]);

const STATUS_ALIASES = Object.freeze({
  CONFIRMED: RECRUITMENT_RDA_PREREQUISITE_STATUSES.PROVIDED,
  PROVIDED: RECRUITMENT_RDA_PREREQUISITE_STATUSES.PROVIDED,
  PENDING: RECRUITMENT_RDA_PREREQUISITE_STATUSES.PENDING,
  UNKNOWN: RECRUITMENT_RDA_PREREQUISITE_STATUSES.UNKNOWN,
  BLOCKED: RECRUITMENT_RDA_PREREQUISITE_STATUSES.BLOCKED,
  REVIEW_REQUIRED: RECRUITMENT_RDA_PREREQUISITE_STATUSES.REVIEW_REQUIRED,
  NOT_MODELED: RECRUITMENT_RDA_PREREQUISITE_STATUSES.NOT_MODELED
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

function boundaryFlags() {
  return {
    automaticDecisionAllowed: false,
    createsManagerOwnershipTruth: false,
    createsRdaAttributionTruth: false,
    createsCompensationOwnershipTruth: false,
    createsPrecontractTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false
  };
}

function hasCompleteRdaEvidence(rdaEvidence = {}) {
  return present(rdaEvidence.rdaId) &&
    present(rdaEvidence.candidateId) &&
    present(rdaEvidence.sourceAdvisor);
}

function resolveRdaPrerequisiteStatus({ rdaAttribution = null, rdaEvidence = null } = {}) {
  const attributionStatus = normalizeText(rdaAttribution && rdaAttribution.status);
  if (attributionStatus) {
    return STATUS_ALIASES[attributionStatus] || RECRUITMENT_RDA_PREREQUISITE_STATUSES.NOT_MODELED;
  }

  if (!rdaAttribution && !rdaEvidence) return RECRUITMENT_RDA_PREREQUISITE_STATUSES.MISSING;
  if (rdaEvidence && hasCompleteRdaEvidence(rdaEvidence)) {
    return RECRUITMENT_RDA_PREREQUISITE_STATUSES.PROVIDED;
  }
  if (rdaEvidence) return RECRUITMENT_RDA_PREREQUISITE_STATUSES.REVIEW_REQUIRED;
  return RECRUITMENT_RDA_PREREQUISITE_STATUSES.MISSING;
}

function collectEvidenceRefs({
  rdaAttribution = null,
  rdaEvidence = null,
  recruitmentPipeline = {},
  precontractGate = {},
  provenance = {},
  managerReview = {},
  candidate = {},
  application = {},
  recruit = {}
} = {}) {
  return unique([
    ...asArray(rdaAttribution && rdaAttribution.evidenceRefs),
    ...(rdaEvidence && rdaEvidence.rdaId ? [rdaEvidence.rdaId] : []),
    ...asArray(rdaEvidence && rdaEvidence.evidenceRefs),
    ...asArray(recruitmentPipeline.evidenceRefs),
    ...asArray(precontractGate.evidenceRefs),
    ...asArray(provenance.evidenceRefs),
    ...asArray(managerReview.evidenceRefs),
    candidate.candidateId,
    application.applicationId,
    recruit.recruitIdentityId
  ]);
}

function collectSourceEvidenceIds({
  rdaAttribution = null,
  rdaEvidence = null,
  recruitmentPipeline = {},
  precontractGate = {},
  provenance = {},
  managerReview = {}
} = {}) {
  return unique([
    ...asArray(rdaAttribution && rdaAttribution.sourceEvidenceIds),
    ...asArray(rdaEvidence && rdaEvidence.sourceEvidenceIds),
    ...asArray(recruitmentPipeline.sourceEvidenceIds),
    ...asArray(precontractGate.sourceEvidenceIds),
    ...asArray(provenance.sourceEvidenceIds),
    ...asArray(managerReview.sourceEvidenceIds)
  ]);
}

function evaluateRecruitmentRdaPrerequisiteBoundary({
  rdaAttribution = null,
  rdaEvidence = null,
  recruitmentPipeline = {},
  precontractGate = {},
  candidate = {},
  application = {},
  recruit = {},
  managerReview = {},
  provenance = {},
  requestedTransition = null
} = {}) {
  const rdaPrerequisiteStatus = resolveRdaPrerequisiteStatus({ rdaAttribution, rdaEvidence });
  const requested = normalizeText(requestedTransition);
  const allowedTransitions = [];
  const blockedTransitions = [];
  const missingEvidence = [];
  const missingPrerequisites = [];
  const warnings = unique([
    ...asArray(rdaAttribution && rdaAttribution.warnings),
    ...asArray(rdaEvidence && rdaEvidence.warnings),
    ...asArray(recruitmentPipeline.warnings),
    ...asArray(precontractGate.warnings),
    ...asArray(provenance.warnings),
    ...asArray(managerReview.warnings)
  ]);
  const confidenceLimitations = unique([
    ...asArray(rdaAttribution && rdaAttribution.confidenceLimitations),
    ...asArray(rdaEvidence && rdaEvidence.confidenceLimitations),
    ...asArray(recruitmentPipeline.confidenceLimitations),
    ...asArray(precontractGate.confidenceLimitations),
    ...asArray(provenance.confidenceLimitations),
    ...asArray(managerReview.confidenceLimitations)
  ]);

  if (requested && FORBIDDEN_TRANSITIONS.has(requested)) {
    blockedTransitions.push(requested);
    warnings.push(`${requested} transition is forbidden from Recruitment RDA prerequisite boundary.`);
  }

  if (!present(candidate.candidateId)) missingEvidence.push("candidate_identity_required");
  if (!rdaAttribution && !rdaEvidence) missingEvidence.push("rda_evidence_or_attribution_context_required");

  if (
    rdaPrerequisiteStatus === RECRUITMENT_RDA_PREREQUISITE_STATUSES.MISSING ||
    precontractGate.rdaAttributionRequired === true
  ) {
    missingPrerequisites.push("rda_manager_attribution_review_required");
  }

  if (rdaPrerequisiteStatus === RECRUITMENT_RDA_PREREQUISITE_STATUSES.BLOCKED) {
    blockedTransitions.push("RDA_ATTRIBUTION_TRUTH");
  }

  if (managerReview.selfConfirmed === true) {
    warnings.push("Manager self-confirmation is not ownership truth.");
  }
  if (managerReview.override === true) {
    warnings.push("Manager override is not ownership truth.");
  }
  if (rdaPrerequisiteStatus === RECRUITMENT_RDA_PREREQUISITE_STATUSES.PROVIDED) {
    warnings.push("RDA PROVIDED/CONFIRMED is prerequisite evidence only, not ownership truth or compensation truth.");
  }
  if (rdaEvidence && !rdaAttribution) {
    warnings.push("RDA evidence is not RDA attribution truth.");
  }

  const reviewStatuses = new Set([
    RECRUITMENT_RDA_PREREQUISITE_STATUSES.MISSING,
    RECRUITMENT_RDA_PREREQUISITE_STATUSES.PENDING,
    RECRUITMENT_RDA_PREREQUISITE_STATUSES.UNKNOWN,
    RECRUITMENT_RDA_PREREQUISITE_STATUSES.BLOCKED,
    RECRUITMENT_RDA_PREREQUISITE_STATUSES.REVIEW_REQUIRED,
    RECRUITMENT_RDA_PREREQUISITE_STATUSES.NOT_MODELED
  ]);

  const managerReviewRequired =
    reviewStatuses.has(rdaPrerequisiteStatus) ||
    managerReview.selfConfirmed === true ||
    managerReview.override === true ||
    precontractGate.rdaAttributionRequired === true ||
    managerReview.reviewed !== true;

  const humanReviewRequired = managerReviewRequired || blockedTransitions.length > 0;
  const rdaAttributionRequired =
    rdaPrerequisiteStatus !== RECRUITMENT_RDA_PREREQUISITE_STATUSES.PROVIDED ||
    precontractGate.rdaAttributionRequired === true;

  const rdaPrerequisiteSatisfied =
    rdaPrerequisiteStatus === RECRUITMENT_RDA_PREREQUISITE_STATUSES.PROVIDED;

  if (rdaPrerequisiteSatisfied) allowedTransitions.push("RDA_PREREQUISITE_EVIDENCE_ACCEPTED_FOR_REVIEW");

  const nextRecommendedAction = rdaPrerequisiteStatus === RECRUITMENT_RDA_PREREQUISITE_STATUSES.MISSING
    ? RECRUITMENT_RDA_PREREQUISITE_DECISIONS.COLLECT_RDA_EVIDENCE
    : rdaPrerequisiteSatisfied
      ? RECRUITMENT_RDA_PREREQUISITE_DECISIONS.ACCEPT_PREREQUISITE_EVIDENCE_ONLY
      : blockedTransitions.length > 0
        ? RECRUITMENT_RDA_PREREQUISITE_DECISIONS.BLOCK_DOWNSTREAM_TRUTH
        : RECRUITMENT_RDA_PREREQUISITE_DECISIONS.REVIEW_RDA_PREREQUISITE;

  return {
    rdaPrerequisiteStatus,
    rdaPrerequisiteSatisfied,
    rdaAttributionRequired,
    managerReviewRequired,
    humanReviewRequired,
    nextRecommendedAction,
    allowedTransitions: unique(allowedTransitions),
    blockedTransitions: unique(blockedTransitions),
    missingEvidence: unique(missingEvidence),
    missingPrerequisites: unique(missingPrerequisites),
    evidenceRefs: collectEvidenceRefs({
      rdaAttribution,
      rdaEvidence,
      recruitmentPipeline,
      precontractGate,
      provenance,
      managerReview,
      candidate,
      application,
      recruit
    }),
    sourceEvidenceIds: collectSourceEvidenceIds({
      rdaAttribution,
      rdaEvidence,
      recruitmentPipeline,
      precontractGate,
      provenance,
      managerReview
    }),
    confidenceLimitations,
    warnings: unique(warnings),
    ...boundaryFlags()
  };
}

module.exports = {
  RECRUITMENT_RDA_PREREQUISITE_DECISIONS,
  RECRUITMENT_RDA_PREREQUISITE_STATUSES,
  evaluateRecruitmentRdaPrerequisiteBoundary
};
