const SIGNAL_GROUPS = Object.freeze({
  hardFactors: ["age", "householdContext", "yearsLivingInTown", "career", "employmentStatus"],
  vitalFactors: ["mentalAgility", "drive", "energy", "moneyMotivation", "character", "integrity", "successHistory", "retentionPotential"],
  coachability: ["observedCoachabilitySignals"],
  marketQuality: ["project200Size", "advisorReferralsCount", "prospectCount", "networkStrength", "appointmentPotential"]
});

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(hasValue) : [value].filter(hasValue);
}

function readGroup(input, groupName) {
  if (groupName === "coachability") {
    return input.coachabilitySignals || input.coachability || input;
  }
  if (groupName === "marketQuality") {
    return input.marketQuality || input.marketSignals || input;
  }
  return input[groupName] || input;
}

function collectSignals(input = {}) {
  const scoredSignals = [];
  const missingSignals = [];

  Object.entries(SIGNAL_GROUPS).forEach(([groupName, keys]) => {
    const group = readGroup(input, groupName);
    keys.forEach(key => {
      const signalKey = `${groupName}.${key}`;

      if (groupName === "hardFactors" && key === "householdContext") {
        if (hasValue(group.marriage) || hasValue(group.maritalStatus)) {
          scoredSignals.push(signalKey);
        } else {
          missingSignals.push(signalKey);
        }
        return;
      }

      if (groupName === "coachability" && key === "observedCoachabilitySignals") {
        const coachabilityKeys = [
          "completesAssignments",
          "followsProcess",
          "attendsInterviews",
          "memorizesScripts",
          "acceptsFeedback",
          "missesInterviews",
          "ignoresInstructions",
          "wantsOwnSystem",
          "incompleteTasks"
        ];

        if (coachabilityKeys.some(coachabilityKey => hasValue(group[coachabilityKey]))) {
          scoredSignals.push(signalKey);
        } else {
          missingSignals.push(signalKey);
        }
        return;
      }

      if (hasValue(group[key])) {
        scoredSignals.push(signalKey);
      } else {
        missingSignals.push(signalKey);
      }
    });
  });

  return { scoredSignals, missingSignals };
}

function collectEvidence(input = {}) {
  const evidence = input.evidence || input.provenanceEvidence || input;
  return {
    evidenceRefs: asArray(evidence.evidenceRefs),
    sourceEvidenceIds: asArray(evidence.sourceEvidenceIds),
    signalEvidenceMap: evidence.signalEvidenceMap && typeof evidence.signalEvidenceMap === "object"
      ? evidence.signalEvidenceMap
      : {}
  };
}

function collectEvidenceBackedSignals(signalEvidenceMap = {}) {
  return Object.keys(signalEvidenceMap)
    .filter(key => asArray(signalEvidenceMap[key]).length > 0)
    .sort();
}

function hasContradictorySignals(assessment = {}) {
  return (assessment.risks || []).some(risk => {
    const text = String(risk).toLowerCase();
    return text.includes("contradict") ||
      text.includes("mixed") ||
      text.includes("offset") ||
      text.includes("requires manager review") ||
      text.includes("high energy with weak character");
  });
}

function buildConfidenceLimitations({ confidence, missingSignals, hasEvidence, hasContradiction }) {
  const limitations = ["confidence_is_not_evidence_provenance"];

  if (!hasEvidence) {
    limitations.push("score_not_tied_to_source_evidence_refs");
  }
  if (missingSignals.length > 0) {
    limitations.push("candidate_inputs_missing");
  }
  if (typeof confidence === "number" && confidence < 55) {
    limitations.push("low_candidate_assessment_confidence");
  }
  if (hasContradiction) {
    limitations.push("contradictory_candidate_signals_require_review");
  }

  return limitations;
}

function buildWarnings({ hasEvidence, missingSignals, unsupportedSignals, recommendation, hasContradiction, inputBackedSignals }) {
  const warnings = [];

  if (!hasEvidence) {
    warnings.push("Missing evidence provenance: candidate score remains input-backed decision support only.");
  }
  if (missingSignals.length > 0) {
    warnings.push("Missing candidate signals are not zero and require review before relying on the score.");
  }
  if (unsupportedSignals.length > 0) {
    warnings.push("Unsupported candidate signal evidence keys were provided and were not scored.");
  }
  if (hasContradiction) {
    warnings.push("Contradictory candidate signals require human review.");
  }
  if (recommendation === "REJECT" || recommendation === "WATCH") {
    warnings.push("Recommendation is not an automatic decision.");
  }
  if (inputBackedSignals.length > 0) {
    warnings.push("Some scored signals are input-backed only and lack explicit evidence references.");
  }

  return warnings;
}

function evaluateCandidateEvidenceProvenance({ input = {}, assessment = {} } = {}) {
  const { scoredSignals, missingSignals } = collectSignals(input);
  const { evidenceRefs, sourceEvidenceIds, signalEvidenceMap } = collectEvidence(input);
  const evidenceBackedSignals = collectEvidenceBackedSignals(signalEvidenceMap);
  const knownGroups = Object.keys(SIGNAL_GROUPS);
  const unsupportedSignals = evidenceBackedSignals.filter(signal => !knownGroups.includes(signal));
  const supportedEvidenceBackedSignals = evidenceBackedSignals.filter(signal => knownGroups.includes(signal));
  const inputBackedSignals = knownGroups.filter(groupName =>
    scoredSignals.some(signal => signal.startsWith(`${groupName}.`)) &&
    !supportedEvidenceBackedSignals.includes(groupName)
  );
  const hasEvidence = evidenceRefs.length > 0 || sourceEvidenceIds.length > 0;
  const hasContradiction = hasContradictorySignals(assessment);
  const humanReviewRequired =
    !hasEvidence ||
    missingSignals.length > 0 ||
    unsupportedSignals.length > 0 ||
    hasContradiction ||
    assessment.recommendation === "REJECT" ||
    assessment.recommendation === "WATCH" ||
    (typeof assessment.confidence === "number" && assessment.confidence < 55) ||
    inputBackedSignals.length > 0;

  return {
    provenanceAvailable: hasEvidence,
    evidenceRefs,
    sourceEvidenceIds,
    scoredSignals,
    missingSignals,
    unsupportedSignals,
    evidenceBackedSignals: supportedEvidenceBackedSignals,
    inputBackedSignals,
    confidenceLimitations: buildConfidenceLimitations({
      confidence: assessment.confidence,
      missingSignals,
      hasEvidence,
      hasContradiction
    }),
    warnings: buildWarnings({
      hasEvidence,
      missingSignals,
      unsupportedSignals,
      recommendation: assessment.recommendation,
      hasContradiction,
      inputBackedSignals
    }),
    automaticDecisionAllowed: false,
    humanReviewRequired,
    confidenceIsNotEvidenceProvenance: true,
    createsRecruitmentTruth: false,
    createsPrecontractTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false
  };
}

module.exports = {
  SIGNAL_GROUPS,
  evaluateCandidateEvidenceProvenance
};
