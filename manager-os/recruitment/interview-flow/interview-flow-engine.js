const INTERVIEW_STAGES = Object.freeze({
  INITIAL_INTERVIEW: "INITIAL_INTERVIEW",
  SELECTION_INTERVIEW: "SELECTION_INTERVIEW",
  CAREER_INTERVIEW: "CAREER_INTERVIEW",
  ADDITIONAL_INTERVIEW: "ADDITIONAL_INTERVIEW"
});

const INTERVIEW_STAGE_STATUS = Object.freeze({
  READY: "READY",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED",
  COMPLETED: "COMPLETED"
});

const INTERVIEW_DECISIONS = Object.freeze({
  ADVANCE: "ADVANCE",
  WATCH: "WATCH",
  COACH: "COACH",
  REJECT: "REJECT"
});

const STAGE_ALIASES = Object.freeze({
  SCREENING: INTERVIEW_STAGES.INITIAL_INTERVIEW,
  FIRST_INTERVIEW: INTERVIEW_STAGES.INITIAL_INTERVIEW,
  SECOND_INTERVIEW: INTERVIEW_STAGES.SELECTION_INTERVIEW,
  MANAGER_REVIEW: INTERVIEW_STAGES.CAREER_INTERVIEW,
  FINAL_REVIEW: INTERVIEW_STAGES.ADDITIONAL_INTERVIEW,
  REENTRY_REVIEW: INTERVIEW_STAGES.ADDITIONAL_INTERVIEW
});

const STAGE_SEQUENCE = Object.freeze([
  INTERVIEW_STAGES.INITIAL_INTERVIEW,
  INTERVIEW_STAGES.SELECTION_INTERVIEW,
  INTERVIEW_STAGES.CAREER_INTERVIEW,
  INTERVIEW_STAGES.ADDITIONAL_INTERVIEW
]);

const FORBIDDEN_TRANSITIONS = new Set([
  "PRECONTRACT",
  "ADVISOR_LIFECYCLE",
  "REVENUE",
  "COMPENSATION"
]);

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(hasValue) : [value].filter(hasValue);
}

function unique(values) {
  return [...new Set(values.filter(hasValue))];
}

function normalizeInterviewStage(stage) {
  if (!hasValue(stage)) return null;
  const normalized = String(stage).trim().toUpperCase();
  return INTERVIEW_STAGES[normalized] || STAGE_ALIASES[normalized] || null;
}

function nextSequentialStage(stage) {
  const index = STAGE_SEQUENCE.indexOf(stage);
  if (index < 0 || index === STAGE_SEQUENCE.length - 1) return null;
  return STAGE_SEQUENCE[index + 1];
}

function isSkippedTransition(currentStage, requestedStage) {
  const currentIndex = STAGE_SEQUENCE.indexOf(currentStage);
  const requestedIndex = STAGE_SEQUENCE.indexOf(requestedStage);
  return currentIndex >= 0 && requestedIndex > currentIndex + 1;
}

function collectInterviewEvidence(interviewEvidence) {
  const evidenceItems = asArray(interviewEvidence);
  const evidenceRefs = [];
  const missingEvidence = [];

  if (evidenceItems.length === 0) {
    missingEvidence.push("interview_evidence_required");
  }

  evidenceItems.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      missingEvidence.push(`interview_evidence[${index}]_object_required`);
      return;
    }

    if (item.interviewEvidenceId) evidenceRefs.push(item.interviewEvidenceId);
    if (!item.interviewEvidenceId && !item.interviewId) {
      missingEvidence.push(`interview_evidence[${index}]_id_required`);
    }
    if (!item.phase) missingEvidence.push(`interview_evidence[${index}]_phase_required`);
    if (!item.recommendation) missingEvidence.push(`interview_evidence[${index}]_recommendation_required`);
    if (!Array.isArray(item.questionEvidence) || item.questionEvidence.length === 0) {
      missingEvidence.push(`interview_evidence[${index}]_question_evidence_required`);
    }
  });

  return {
    evidenceRefs,
    missingEvidence
  };
}

function mergeProvenance(candidateAssessment = {}, provenance = {}) {
  const assessmentProvenance = candidateAssessment && candidateAssessment.provenance
    ? candidateAssessment.provenance
    : {};

  return {
    evidenceRefs: unique([
      ...asArray(assessmentProvenance.evidenceRefs),
      ...asArray(provenance.evidenceRefs)
    ]),
    sourceEvidenceIds: unique([
      ...asArray(assessmentProvenance.sourceEvidenceIds),
      ...asArray(provenance.sourceEvidenceIds)
    ]),
    missingSignals: unique([
      ...asArray(assessmentProvenance.missingSignals),
      ...asArray(provenance.missingSignals)
    ]),
    confidenceLimitations: unique([
      ...asArray(assessmentProvenance.confidenceLimitations),
      ...asArray(provenance.confidenceLimitations)
    ]),
    warnings: unique([
      ...asArray(assessmentProvenance.warnings),
      ...asArray(provenance.warnings)
    ]),
    humanReviewRequired: assessmentProvenance.humanReviewRequired === true || provenance.humanReviewRequired === true
  };
}

function hasContradictorySignals(candidateAssessment = {}, provenance = {}) {
  const warningsAndRisks = []
    .concat(asArray(candidateAssessment.risks))
    .concat(asArray(provenance.warnings))
    .concat(asArray(provenance.confidenceLimitations));

  return warningsAndRisks.some(value => {
    const text = String(value).toLowerCase();
    return text.includes("contradict") ||
      text.includes("mixed") ||
      text.includes("requires manager review");
  });
}

function recommendationNextStage({ normalizedCurrentStage, candidateAssessment = {}, provenance = {} }) {
  const recommendation = candidateAssessment.recommendation;

  if (recommendation === INTERVIEW_DECISIONS.WATCH || hasContradictorySignals(candidateAssessment, provenance)) {
    return INTERVIEW_STAGES.ADDITIONAL_INTERVIEW;
  }

  if (recommendation === INTERVIEW_DECISIONS.COACH || recommendation === INTERVIEW_DECISIONS.REJECT) {
    return null;
  }

  return nextSequentialStage(normalizedCurrentStage);
}

function boundaryFlags() {
  return {
    automaticDecisionAllowed: false,
    createsRecruitmentTruth: false,
    createsPrecontractTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false
  };
}

function evaluateInterviewFlow({
  currentStage,
  candidateAssessment = {},
  provenance = {},
  interviewEvidence = null,
  completedStages = [],
  managerReview = {},
  requestedTransition = null
} = {}) {
  const normalizedCurrentStage = normalizeInterviewStage(currentStage);
  const normalizedRequestedTransition = normalizeInterviewStage(requestedTransition);
  const rawRequestedTransition = hasValue(requestedTransition)
    ? String(requestedTransition).trim().toUpperCase()
    : null;
  const normalizedCompletedStages = asArray(completedStages)
    .map(normalizeInterviewStage)
    .filter(Boolean);
  const mergedProvenance = mergeProvenance(candidateAssessment, provenance);
  const evidence = collectInterviewEvidence(interviewEvidence);

  const evidenceRefs = unique([
    ...mergedProvenance.evidenceRefs,
    ...evidence.evidenceRefs
  ]);
  const sourceEvidenceIds = mergedProvenance.sourceEvidenceIds;
  const missingEvidence = [...evidence.missingEvidence];
  const confidenceLimitations = [...mergedProvenance.confidenceLimitations];
  const warnings = [...mergedProvenance.warnings];
  const allowedTransitions = [];
  const blockedTransitions = [];

  if (!normalizedCurrentStage) {
    if (rawRequestedTransition) blockedTransitions.push(rawRequestedTransition);
    warnings.push("Unknown interview stage blocks transition and requires human review.");
    return {
      currentStage,
      normalizedCurrentStage,
      requestedTransition,
      normalizedRequestedTransition,
      nextRecommendedStage: null,
      allowedTransitions,
      blockedTransitions: unique(blockedTransitions),
      stageStatus: INTERVIEW_STAGE_STATUS.UNKNOWN,
      missingEvidence,
      evidenceRefs,
      sourceEvidenceIds,
      confidenceLimitations,
      warnings: unique(warnings),
      humanReviewRequired: true,
      ...boundaryFlags()
    };
  }

  const sequentialNext = nextSequentialStage(normalizedCurrentStage);
  const nextRecommendedStage = recommendationNextStage({
    normalizedCurrentStage,
    candidateAssessment,
    provenance: mergedProvenance
  });
  const evidenceMissing = missingEvidence.length > 0;
  const managerOverride = managerReview && managerReview.override === true;

  if (sequentialNext && !evidenceMissing) {
    allowedTransitions.push(sequentialNext);
  }

  if (nextRecommendedStage &&
    nextRecommendedStage !== sequentialNext &&
    !allowedTransitions.includes(nextRecommendedStage) &&
    !evidenceMissing) {
    allowedTransitions.push(nextRecommendedStage);
  }

  if (rawRequestedTransition && FORBIDDEN_TRANSITIONS.has(rawRequestedTransition)) {
    blockedTransitions.push(rawRequestedTransition);
    warnings.push(`${rawRequestedTransition} transition is forbidden from Interview Flow.`);
  } else if (requestedTransition && !normalizedRequestedTransition) {
    blockedTransitions.push(rawRequestedTransition);
    warnings.push("Unsupported requested transition blocks movement.");
  } else if (normalizedRequestedTransition) {
    if (isSkippedTransition(normalizedCurrentStage, normalizedRequestedTransition) && !managerOverride) {
      blockedTransitions.push(normalizedRequestedTransition);
      warnings.push("Skipped interview stage transition requires manager override and human review.");
    } else if (isSkippedTransition(normalizedCurrentStage, normalizedRequestedTransition) && managerOverride) {
      allowedTransitions.push(normalizedRequestedTransition);
      warnings.push("Manager override allowed skipped interview transition; human review remains required.");
    } else if (!allowedTransitions.includes(normalizedRequestedTransition) && normalizedRequestedTransition !== normalizedCurrentStage) {
      blockedTransitions.push(normalizedRequestedTransition);
      warnings.push("Requested transition is not currently allowed by interview flow evidence.");
    }
  }

  if (candidateAssessment.recommendation === INTERVIEW_DECISIONS.REJECT) {
    warnings.push("Reject recommendation is decision support only and is not automatic rejection.");
  }
  if (candidateAssessment.recommendation === INTERVIEW_DECISIONS.COACH) {
    warnings.push("Coaching recommendation requires manager review before further transition.");
  }
  if (candidateAssessment.recommendation === INTERVIEW_DECISIONS.WATCH) {
    warnings.push("Watch recommendation routes to additional interview/human review.");
  }

  const hasHumanReviewTriggers =
    evidenceMissing ||
    mergedProvenance.humanReviewRequired ||
    candidateAssessment.recommendation === INTERVIEW_DECISIONS.WATCH ||
    candidateAssessment.recommendation === INTERVIEW_DECISIONS.COACH ||
    candidateAssessment.recommendation === INTERVIEW_DECISIONS.REJECT ||
    hasContradictorySignals(candidateAssessment, mergedProvenance) ||
    managerOverride ||
    blockedTransitions.length > 0;

  let stageStatus = INTERVIEW_STAGE_STATUS.READY;
  if (evidenceMissing) {
    stageStatus = INTERVIEW_STAGE_STATUS.NEEDS_EVIDENCE;
  } else if (hasHumanReviewTriggers) {
    stageStatus = INTERVIEW_STAGE_STATUS.NEEDS_HUMAN_REVIEW;
  } else if (!sequentialNext && normalizedCompletedStages.includes(normalizedCurrentStage)) {
    stageStatus = INTERVIEW_STAGE_STATUS.COMPLETED;
  }

  return {
    currentStage,
    normalizedCurrentStage,
    requestedTransition,
    normalizedRequestedTransition,
    nextRecommendedStage,
    allowedTransitions: unique(allowedTransitions),
    blockedTransitions: unique(blockedTransitions),
    stageStatus,
    missingEvidence: unique(missingEvidence),
    evidenceRefs,
    sourceEvidenceIds,
    confidenceLimitations: unique(confidenceLimitations),
    warnings: unique(warnings),
    humanReviewRequired: hasHumanReviewTriggers,
    ...boundaryFlags()
  };
}

module.exports = {
  INTERVIEW_DECISIONS,
  INTERVIEW_STAGES,
  INTERVIEW_STAGE_STATUS,
  evaluateInterviewFlow,
  normalizeInterviewStage
};
