const PRECONTRACT_GATE_STATUSES = Object.freeze({
  READY_FOR_REVIEW_PACKET: "READY_FOR_REVIEW_PACKET",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const PRECONTRACT_GATE_DECISIONS = Object.freeze({
  BUILD_REVIEW_PACKET: "BUILD_REVIEW_PACKET",
  COLLECT_EVIDENCE: "COLLECT_EVIDENCE",
  MANAGER_REVIEW: "MANAGER_REVIEW",
  RDA_ATTRIBUTION_REVIEW: "RDA_ATTRIBUTION_REVIEW",
  BLOCK_DOWNSTREAM_TRANSITION: "BLOCK_DOWNSTREAM_TRANSITION"
});

const FORBIDDEN_TRANSITIONS = new Set([
  "PRECONTRACT",
  "PRECONTRACT_CYCLE",
  "ADVISOR_LIFECYCLE",
  "ADVISOR",
  "ACTIVATION",
  "CONNECTION",
  "REVENUE",
  "COMPENSATION",
  "PAYOUT",
  "PAYMENT"
]);

const BLOCKING_PIPELINE_STATUSES = new Set(["BLOCKED", "UNKNOWN", "NOT_MODELED"]);
const BLOCKING_INTERVIEW_STATUSES = new Set(["BLOCKED", "UNKNOWN", "NOT_MODELED"]);
const REVIEW_CYCLE_STATUSES = new Set(["CLOSED", "KEY_EXPIRED", "UNKNOWN", "AT_RISK"]);
const RDA_REVIEW_STATUSES = new Set(["PENDING", "UNKNOWN", "BLOCKED"]);

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

function pushIfMissing(target, value) {
  if (present(value)) target.push(value);
}

function collectEvidence({
  recruitmentPipeline = {},
  candidateAssessment = {},
  provenance = {},
  interviewFlow = {},
  interviewEvidence = null,
  precontractCycle = null,
  precontractActivityEvidence = null,
  candidate = {},
  application = {},
  recruit = {}
} = {}) {
  const assessmentProvenance = candidateAssessment.provenance || {};
  const evidenceRefs = [];
  const sourceEvidenceIds = [];
  const upstreamEvidenceRefs = [];

  [
    recruitmentPipeline.evidenceRefs,
    assessmentProvenance.evidenceRefs,
    provenance.evidenceRefs,
    interviewFlow.evidenceRefs
  ].forEach((refs) => {
    asArray(refs).forEach((ref) => {
      evidenceRefs.push(ref);
      upstreamEvidenceRefs.push(ref);
    });
  });

  [
    recruitmentPipeline.sourceEvidenceIds,
    assessmentProvenance.sourceEvidenceIds,
    provenance.sourceEvidenceIds,
    interviewFlow.sourceEvidenceIds
  ].forEach((refs) => {
    asArray(refs).forEach((ref) => sourceEvidenceIds.push(ref));
  });

  asArray(interviewEvidence).forEach((item) => {
    if (item && item.interviewEvidenceId) {
      evidenceRefs.push(item.interviewEvidenceId);
      upstreamEvidenceRefs.push(item.interviewEvidenceId);
    }
  });

  if (precontractActivityEvidence && precontractActivityEvidence.activityEvidenceId) {
    evidenceRefs.push(precontractActivityEvidence.activityEvidenceId);
    upstreamEvidenceRefs.push(precontractActivityEvidence.activityEvidenceId);
  }
  if (precontractCycle && precontractCycle.cycleId) {
    evidenceRefs.push(precontractCycle.cycleId);
    upstreamEvidenceRefs.push(precontractCycle.cycleId);
  }

  pushIfMissing(evidenceRefs, candidate.candidateId);
  pushIfMissing(evidenceRefs, application.applicationId);
  pushIfMissing(evidenceRefs, recruit.recruitIdentityId);

  return {
    evidenceRefs: unique(evidenceRefs),
    sourceEvidenceIds: unique(sourceEvidenceIds),
    upstreamEvidenceRefs: unique(upstreamEvidenceRefs)
  };
}

function collectWarningsAndLimitations({ recruitmentPipeline = {}, candidateAssessment = {}, provenance = {}, interviewFlow = {} } = {}) {
  const assessmentProvenance = candidateAssessment.provenance || {};
  return {
    warnings: unique([
      ...asArray(recruitmentPipeline.warnings),
      ...asArray(assessmentProvenance.warnings),
      ...asArray(provenance.warnings),
      ...asArray(interviewFlow.warnings)
    ]),
    confidenceLimitations: unique([
      ...asArray(recruitmentPipeline.confidenceLimitations),
      ...asArray(assessmentProvenance.confidenceLimitations),
      ...asArray(provenance.confidenceLimitations),
      ...asArray(interviewFlow.confidenceLimitations)
    ])
  };
}

function boundaryFlags() {
  return {
    automaticDecisionAllowed: false,
    createsPrecontractTruth: false,
    createsPrecontractCycle: false,
    createsPrecontractActivity: false,
    createsAdvisorLifecycleTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false
  };
}

function resolveGateStatus({
  blocked,
  notModeled,
  unknown,
  missingEvidence,
  packetReady,
  humanReviewRequired
}) {
  if (blocked) return PRECONTRACT_GATE_STATUSES.BLOCKED;
  if (notModeled) return PRECONTRACT_GATE_STATUSES.NOT_MODELED;
  if (unknown) return PRECONTRACT_GATE_STATUSES.UNKNOWN;
  if (missingEvidence.length > 0) return PRECONTRACT_GATE_STATUSES.NEEDS_EVIDENCE;
  if (packetReady) return PRECONTRACT_GATE_STATUSES.READY_FOR_REVIEW_PACKET;
  if (humanReviewRequired) return PRECONTRACT_GATE_STATUSES.NEEDS_HUMAN_REVIEW;
  return PRECONTRACT_GATE_STATUSES.NEEDS_HUMAN_REVIEW;
}

function evaluateRecruitmentToPrecontractGate({
  recruitmentPipeline = {},
  candidateAssessment = {},
  provenance = {},
  interviewFlow = {},
  interviewEvidence = null,
  candidate = {},
  application = {},
  recruit = {},
  precontractCycle = null,
  precontractActivityEvidence = null,
  managerReview = {},
  rdaAttribution = null,
  requestedTransition = null
} = {}) {
  const warningsAndLimitations = collectWarningsAndLimitations({
    recruitmentPipeline,
    candidateAssessment,
    provenance,
    interviewFlow
  });
  const warnings = [...warningsAndLimitations.warnings];
  const confidenceLimitations = [...warningsAndLimitations.confidenceLimitations];
  const evidence = collectEvidence({
    recruitmentPipeline,
    candidateAssessment,
    provenance,
    interviewFlow,
    interviewEvidence,
    precontractCycle,
    precontractActivityEvidence,
    candidate,
    application,
    recruit
  });

  const requested = normalizeText(requestedTransition);
  const allowedTransitions = [];
  const blockedTransitions = [];
  const missingEvidence = [];
  const missingPrerequisites = [];

  const candidateId = candidate.candidateId || recruitmentPipeline.candidateId || null;
  const applicationId = application.applicationId || recruitmentPipeline.applicationId || null;
  const recruitIdentityId = recruit.recruitIdentityId || recruitmentPipeline.recruitIdentityId || null;

  if (!present(candidateId)) missingEvidence.push("candidate_identity_required");
  if (!present(applicationId)) missingEvidence.push("application_identity_required");
  if (!present(recruitIdentityId) && present(candidateId)) {
    warnings.push("Recruit identity is missing; candidate identity is used for review context only.");
  }
  if (evidence.upstreamEvidenceRefs.length === 0) {
    missingEvidence.push("upstream_evidence_required");
  }

  if (requested && FORBIDDEN_TRANSITIONS.has(requested)) {
    blockedTransitions.push(requested);
    warnings.push(`${requested} transition is forbidden from Recruitment-to-Precontract Gate.`);
  }

  const pipelineStatus = normalizeText(recruitmentPipeline.pipelineStatus);
  const interviewStatus = normalizeText(interviewFlow.stageStatus);
  const cycleStatus = normalizeText(precontractCycle && precontractCycle.cycleStatus);
  const recommendation = normalizeText(candidateAssessment.recommendation);
  const rdaStatus = normalizeText(rdaAttribution && rdaAttribution.status);

  if (recruitmentPipeline.readyForPrecontractReview !== true) {
    missingPrerequisites.push("recruitment_pipeline_ready_for_precontract_review_required");
  }
  if (recruitmentPipeline.createsPrecontractTruth !== false && recruitmentPipeline.readyForPrecontractReview === true) {
    missingPrerequisites.push("pipeline_precontract_truth_boundary_required");
  }
  if (BLOCKING_PIPELINE_STATUSES.has(pipelineStatus)) {
    blockedTransitions.push("PRECONTRACT_REVIEW_PACKET");
    warnings.push(`Recruitment pipeline status ${pipelineStatus} blocks precontract review packet.`);
  }
  if (BLOCKING_INTERVIEW_STATUSES.has(interviewStatus)) {
    blockedTransitions.push("PRECONTRACT_REVIEW_PACKET");
    warnings.push(`Interview flow status ${interviewStatus} blocks precontract review packet.`);
  }

  if (recommendation === "REJECT") {
    blockedTransitions.push("PRECONTRACT_REVIEW_PACKET");
    warnings.push("Reject recommendation is decision support only and is not automatic rejection.");
  }
  if (recommendation === "WATCH" || recommendation === "COACH") {
    warnings.push(`${recommendation} recommendation requires manager review before precontract review packet use.`);
  }

  if (!rdaAttribution) {
    missingPrerequisites.push("rda_manager_attribution_review_required");
    warnings.push("RDA/manager attribution is pending and is not truth.");
  } else if (RDA_REVIEW_STATUSES.has(rdaStatus)) {
    missingPrerequisites.push("rda_manager_attribution_review_required");
    warnings.push(`RDA/manager attribution status ${rdaStatus} requires human review and is not truth.`);
  }

  if (managerReview && managerReview.override === true) {
    warnings.push("Manager override is review context only and does not create precontract truth.");
  }

  if (cycleStatus) {
    warnings.push("Precontract cycle input is reference evidence only and does not create or update a cycle.");
    if (REVIEW_CYCLE_STATUSES.has(cycleStatus)) {
      warnings.push(`Precontract cycle status ${cycleStatus} requires human review.`);
    }
  }

  if (precontractActivityEvidence && precontractActivityEvidence.activityEvidenceId) {
    warnings.push("Precontract activity evidence is preserved as evidence only and does not create activity truth.");
  }

  const pipelineBlocked = BLOCKING_PIPELINE_STATUSES.has(pipelineStatus);
  const interviewBlocked = BLOCKING_INTERVIEW_STATUSES.has(interviewStatus);
  const transitionBlocked = blockedTransitions.length > 0;
  const rejected = recommendation === "REJECT";

  const packetReady =
    recruitmentPipeline.readyForPrecontractReview === true &&
    recruitmentPipeline.createsPrecontractTruth === false &&
    !pipelineBlocked &&
    !interviewBlocked &&
    !transitionBlocked &&
    !rejected &&
    missingEvidence.length === 0;

  if (packetReady) {
    allowedTransitions.push("PRECONTRACT_REVIEW_PACKET");
  }

  const managerReviewRequired =
    managerReview.reviewRequired === true ||
    managerReview.override === true ||
    recommendation === "WATCH" ||
    recommendation === "COACH" ||
    recommendation === "REJECT" ||
    recruitmentPipeline.humanReviewRequired === true ||
    interviewFlow.humanReviewRequired === true ||
    missingEvidence.length > 0 ||
    missingPrerequisites.length > 0 ||
    transitionBlocked ||
    (cycleStatus && REVIEW_CYCLE_STATUSES.has(cycleStatus));

  const rdaAttributionRequired = !rdaAttribution || RDA_REVIEW_STATUSES.has(rdaStatus);
  const advisorLifecycleReviewRequired = packetReady || transitionBlocked || requested === "ADVISOR_LIFECYCLE" || requested === "ADVISOR";
  const humanReviewRequired = managerReviewRequired || rdaAttributionRequired || advisorLifecycleReviewRequired;

  const blocked = pipelineBlocked || interviewBlocked || transitionBlocked || rejected;
  const notModeled = pipelineStatus === "NOT_MODELED" || interviewStatus === "NOT_MODELED";
  const unknown = pipelineStatus === "UNKNOWN" || interviewStatus === "UNKNOWN";

  const gateStatus = resolveGateStatus({
    blocked,
    notModeled,
    unknown,
    missingEvidence,
    packetReady,
    humanReviewRequired
  });

  const nextRecommendedAction = packetReady
    ? PRECONTRACT_GATE_DECISIONS.BUILD_REVIEW_PACKET
    : missingEvidence.length > 0
      ? PRECONTRACT_GATE_DECISIONS.COLLECT_EVIDENCE
      : rdaAttributionRequired
        ? PRECONTRACT_GATE_DECISIONS.RDA_ATTRIBUTION_REVIEW
        : PRECONTRACT_GATE_DECISIONS.MANAGER_REVIEW;

  return {
    gateStatus,
    readyForPrecontractReview: recruitmentPipeline.readyForPrecontractReview === true,
    precontractReviewPacketReady: packetReady,
    nextRecommendedAction,
    allowedTransitions: unique(allowedTransitions),
    blockedTransitions: unique(blockedTransitions),
    missingEvidence: unique([
      ...missingEvidence,
      ...asArray(recruitmentPipeline.missingEvidence),
      ...asArray(interviewFlow.missingEvidence)
    ]),
    missingPrerequisites: unique(missingPrerequisites),
    evidenceRefs: evidence.evidenceRefs,
    sourceEvidenceIds: evidence.sourceEvidenceIds,
    confidenceLimitations: unique(confidenceLimitations),
    warnings: unique(warnings),
    humanReviewRequired,
    managerReviewRequired,
    rdaAttributionRequired,
    advisorLifecycleReviewRequired,
    ...boundaryFlags()
  };
}

module.exports = {
  PRECONTRACT_GATE_DECISIONS,
  PRECONTRACT_GATE_STATUSES,
  evaluateRecruitmentToPrecontractGate
};
