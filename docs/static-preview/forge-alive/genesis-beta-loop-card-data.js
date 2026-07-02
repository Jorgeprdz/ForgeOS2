export const genesisBetaLoopCards = [
  {
    cardId: "genesis-beta-loop-card-JORGE_MARIA_FOLLOWUP_15_DAYS_001",
    scenarioId: "JORGE_MARIA_FOLLOWUP_15_DAYS_001",
    title: "Jorge / Maria follow-up review",
    subtitle: "relationship follow-up context, not send approval",
    statusLabel: "READY_FOR_HUMAN_REVIEW_PACKET",
    decisionLabel: "PRESENT_TO_HUMAN_FOR_REVIEW_ONLY",
    safetyBadge: "READY_FOR_HUMAN_REVIEW",
    draftQualityBadge: "DRAFT_READY_FOR_HUMAN_REVIEW",
    approvalBadge: "NOT_APPROVED",
    boundaryBadge: "REVIEW_ONLY_NOT_SENDABLE",
    evidenceRefs: [
      "relationship previous conversation",
      "15-day follow-up",
      "Nash light message",
      "Mick pending follow-up"
    ],
    sourceOwners: ["manager-provided-context", "fixture-source"],
    freshness: "FRESH",
    reasoningSummary: "Jorge has a pending relationship follow-up context. The card helps the human review whether a light, respectful reconnection is appropriate.",
    uncertaintySummary: "Delivery remains locked because a real human reviewer and explicit approval are still required.",
    missingContext: ["reviewer_required"],
    candidateDraftPreview: "Hola Maria, espero que estes muy bien. Queria retomar nuestra conversacion con calma y saber si te gustaria que lo revisemos juntos esta semana.",
    humanReviewQuestions: [
      "What evidence supports this follow-up?",
      "What context is missing?",
      "Could this message create pressure or dependency?"
    ],
    approvalPrerequisites: [
      "real_human_reviewer_required",
      "exact_artifact_review_required",
      "explicit_human_approval_gate_required",
      "delivery_preparation_remains_locked_until_approval"
    ],
    blockedReason: ["APPROVED_FOR_DELIVERY_PREPARATION_REQUIRED", "reviewer_required"]
  },
  {
    cardId: "genesis-beta-loop-card-ANDRES_JUAN_BONUS_PROXIMITY_001",
    scenarioId: "ANDRES_JUAN_BONUS_PROXIMITY_001",
    title: "Andres / Juan bonus proximity review",
    subtitle: "motivational context / candidate estimate, not payout truth",
    statusLabel: "READY_FOR_HUMAN_REVIEW_PACKET",
    decisionLabel: "PRESENT_TO_HUMAN_FOR_REVIEW_ONLY",
    safetyBadge: "READY_FOR_HUMAN_REVIEW",
    draftQualityBadge: "DRAFT_READY_FOR_HUMAN_REVIEW",
    approvalBadge: "NOT_APPROVED",
    boundaryBadge: "REVIEW_ONLY_NOT_SENDABLE",
    evidenceRefs: [
      "bonus proximity",
      "Juan relative signal",
      "consultative message"
    ],
    sourceOwners: ["advisor-provided-context", "fixture-source"],
    freshness: "FRESH",
    reasoningSummary: "Bonus proximity is shown only as motivational context for human review, not as payout truth or compensation certainty.",
    uncertaintySummary: "Delivery remains locked because a real human reviewer and explicit approval are still required.",
    missingContext: ["reviewer_required"],
    candidateDraftPreview: "Juan, vi que hay una oportunidad que podria valer la pena revisar con calma. Si te hace sentido, podemos ver juntos que falta y decidir el siguiente paso.",
    humanReviewQuestions: [
      "Is bonus proximity being used only as context?",
      "Could this sound like payout certainty?",
      "What must the human verify before approving?"
    ],
    approvalPrerequisites: [
      "real_human_reviewer_required",
      "exact_artifact_review_required",
      "explicit_human_approval_gate_required",
      "delivery_preparation_remains_locked_until_approval"
    ],
    blockedReason: ["APPROVED_FOR_DELIVERY_PREPARATION_REQUIRED", "reviewer_required"]
  },
  {
    cardId: "genesis-beta-loop-card-LUPITA_MARIA_CAR_GOAL_001",
    scenarioId: "LUPITA_MARIA_CAR_GOAL_001",
    title: "Lupita / Maria car goal review",
    subtitle: "motivation context, not compensation truth",
    statusLabel: "READY_FOR_HUMAN_REVIEW_PACKET",
    decisionLabel: "PRESENT_TO_HUMAN_FOR_REVIEW_ONLY",
    safetyBadge: "READY_FOR_HUMAN_REVIEW",
    draftQualityBadge: "DRAFT_READY_FOR_HUMAN_REVIEW",
    approvalBadge: "NOT_APPROVED",
    boundaryBadge: "REVIEW_ONLY_NOT_SENDABLE",
    evidenceRefs: [
      "car goal",
      "Maria relative advancement",
      "Mick consistency signal"
    ],
    sourceOwners: ["advisor-provided-context", "fixture-source"],
    freshness: "FRESH",
    reasoningSummary: "The car goal is treated as motivation context for review, not as compensation truth or guaranteed outcome.",
    uncertaintySummary: "Delivery remains locked because a real human reviewer and explicit approval are still required.",
    missingContext: ["reviewer_required"],
    candidateDraftPreview: "Maria, me acorde de la meta del coche y pense que puede servir como referencia para ordenar el siguiente paso. Si quieres, lo revisamos con calma.",
    humanReviewQuestions: [
      "Does this respect Maria's agency?",
      "Is the goal used as motivation, not pressure?",
      "What should the advisor learn from this case?"
    ],
    approvalPrerequisites: [
      "real_human_reviewer_required",
      "exact_artifact_review_required",
      "explicit_human_approval_gate_required",
      "delivery_preparation_remains_locked_until_approval"
    ],
    blockedReason: ["APPROVED_FOR_DELIVERY_PREPARATION_REQUIRED", "reviewer_required"]
  }
];
