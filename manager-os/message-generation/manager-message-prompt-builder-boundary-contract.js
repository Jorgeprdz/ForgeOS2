"use strict";

const MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES = Object.freeze({
  READY_FOR_PROMPT_REVIEW: "READY_FOR_PROMPT_REVIEW",
  NEEDS_CONTEXT: "NEEDS_CONTEXT",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS = Object.freeze({
  BUILD_PROMPT_INSTRUCTIONS_ONLY: "BUILD_PROMPT_INSTRUCTIONS_ONLY",
  COLLECT_CONTEXT: "COLLECT_CONTEXT",
  COLLECT_EVIDENCE: "COLLECT_EVIDENCE",
  COLLECT_SOURCE_OWNER: "COLLECT_SOURCE_OWNER",
  REFRESH_CONTEXT: "REFRESH_CONTEXT",
  REQUIRE_HUMAN_REVIEW: "REQUIRE_HUMAN_REVIEW",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE",
  NOT_MODELED_FOR_USE: "NOT_MODELED_FOR_USE"
});

const ALLOWED_MANAGER_MESSAGE_PROMPT_USES = Object.freeze([
  "MANAGER_MESSAGE_PROMPT_PREP",
  "RECRUITMENT_OUTREACH_PROMPT_PREP",
  "ADVISOR_SUPPORT_PROMPT_PREP",
  "ONE_ON_ONE_PREP_PROMPT",
  "FOLLOW_UP_PROMPT_PREP",
  "CONTEXTUAL_CHECK_IN_PROMPT_PREP"
]);

const FORBIDDEN_MANAGER_MESSAGE_PROMPT_USES = Object.freeze([
  "GENERATE_FINAL_DRAFT",
  "SEND_MESSAGE",
  "WHATSAPP_SEND",
  "SMS_SEND",
  "LLM_RUNTIME_EXECUTION",
  "NASH_RUNTIME_EXECUTION",
  "LEGACY_NASH_MESSAGE_EXECUTION",
  "NEXT_BEST_ACTION_EXECUTION",
  "CREATE_TASK",
  "CREATE_CALENDAR_EVENT",
  "HUMAN_RANKING",
  "PROMOTION_DECISION",
  "PUNISHMENT",
  "TERMINATION",
  "COMPENSATION",
  "PAYOUT",
  "REVENUE_TRUTH",
  "ADVISOR_LIFECYCLE_TRUTH",
  "HR_DECISION",
  "HIRING_DECISION"
]);

function present(value) {
  return value !== undefined && value !== null && value !== "";
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  if (!present(value)) return [];
  return Array.isArray(value) ? value.filter(present) : [value].filter(present);
}

function unique(values) {
  return [...new Set(asArray(values).flat().filter(present))];
}

function normalizeText(value) {
  return present(value) ? String(value).trim().toUpperCase() : null;
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function collectNested(value, field) {
  if (!present(value)) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => collectNested(entry, field));
  if (!isObject(value)) return [];
  return [
    ...asArray(value[field]),
    ...Object.values(value).flatMap((entry) => collectNested(entry, field))
  ];
}

function collectEvidenceRefs(values, direct = {}) {
  return unique([
    ...asArray(direct.evidenceRefs),
    ...asArray(direct.evidenceRef),
    ...values.flatMap((value) => collectNested(value, "evidenceRefs")),
    ...values.flatMap((value) => collectNested(value, "evidenceRef")),
    ...values.flatMap((value) => collectNested(value, "evidenceSources"))
  ]);
}

function collectSourceEvidenceIds(values, direct = {}) {
  return unique([
    ...asArray(direct.sourceEvidenceIds),
    ...asArray(direct.sourceEvidenceId),
    ...values.flatMap((value) => collectNested(value, "sourceEvidenceIds")),
    ...values.flatMap((value) => collectNested(value, "sourceEvidenceId"))
  ]);
}

function collectSourceOwners(values, direct = {}) {
  return unique([
    ...asArray(direct.sourceOwners),
    ...asArray(direct.sourceOwner),
    ...values.flatMap((value) => collectNested(value, "sourceOwners")),
    ...values.flatMap((value) => collectNested(value, "sourceOwner"))
  ]);
}

function resolveFreshness(values, freshness) {
  const candidates = unique([
    freshness,
    ...values.flatMap((value) => collectNested(value, "freshness")),
    ...values.flatMap((value) => collectNested(value, "freshnessStatus")),
    ...values.flatMap((value) => collectNested(value, "generatedAt")),
    ...values.flatMap((value) => collectNested(value, "capturedAt")),
    ...values.flatMap((value) => collectNested(value, "updatedAt"))
  ]);
  const first = freshness || candidates[0] || null;
  const status = normalizeText(isObject(first) ? first.status : first);
  const stale =
    status === "STALE" ||
    status === "EXPIRED" ||
    values.some((value) => isObject(value) && (value.stale === true || normalizeText(value.status) === "STALE"));

  return {
    value: first,
    available: candidates.length > 0,
    stale
  };
}

function detectZeroContext(value, path = "context") {
  if (value === 0) return [`${path}_explicit_zero_context_requires_review`];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => detectZeroContext(entry, `${path}_${index}`));
  }
  if (!isObject(value)) return [];
  return Object.entries(value).flatMap(([key, entry]) => detectZeroContext(entry, `${path}_${key}`));
}

function collectUnknown(value, label) {
  if (!present(value)) return [`${label}_missing`];
  if (!isObject(value)) return [];
  return unique([
    ...asArray(value.unknown),
    ...asArray(value.unknownContext),
    ...asArray(value.unknownSignals),
    ...asArray(value.missing),
    ...asArray(value.missingContext)
  ]);
}

function resolveUse(requestedUse) {
  const normalized = normalizeText(requestedUse);
  if (!normalized) return { allowedUses: ["MANAGER_MESSAGE_PROMPT_PREP"], blockedUses: [], unknownUses: [] };
  if (FORBIDDEN_MANAGER_MESSAGE_PROMPT_USES.includes(normalized)) return { allowedUses: [], blockedUses: [normalized], unknownUses: [] };
  if (ALLOWED_MANAGER_MESSAGE_PROMPT_USES.includes(normalized)) return { allowedUses: [normalized], blockedUses: [], unknownUses: [] };
  return { allowedUses: [], blockedUses: [normalized], unknownUses: [normalized] };
}

function falseFlags() {
  return {
    humanApprovalRequired: true,
    automaticDecisionAllowed: false,
    createsDraft: false,
    sendsMessage: false,
    createsTask: false,
    createsCalendarEvent: false,
    executesNashRuntime: false,
    executesLlmRuntime: false,
    executesLegacyNashMessageEngine: false,
    executesNextBestAction: false,
    createsDownstreamTruth: false,
    createsManagerJudgmentTruth: false,
    createsHumanRankingTruth: false,
    createsPromotionDecisionTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false,
    createsHRTruth: false,
    createsHiringTruth: false,
    createsMessageSendTruth: false,
    createsTaskTruth: false,
    createsCalendarTruth: false
  };
}

function resolveStatus({ blockedUses, unknownUses, missingContext, unknownContext, evidenceRefs, sourceEvidenceIds, sourceOwners, freshnessContext, staleContext, defaultZeroWarnings }) {
  if (blockedUses.length > 0) {
    return unknownUses.length > 0
      ? MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NOT_MODELED
      : MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.BLOCKED;
  }
  if (missingContext.length > 0) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_CONTEXT;
  if (unknownContext.length > 0) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.UNKNOWN;
  if (evidenceRefs.length === 0 && sourceEvidenceIds.length === 0) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_EVIDENCE;
  if (sourceOwners.length === 0) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_SOURCE_OWNER;
  if (!freshnessContext.available || freshnessContext.stale || staleContext.length > 0) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_FRESHNESS;
  if (defaultZeroWarnings.length > 0) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_HUMAN_REVIEW;
  return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.READY_FOR_PROMPT_REVIEW;
}

function resolveDecision(status) {
  if (status === MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.BLOCKED) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS.BLOCK_FORBIDDEN_USE;
  if (status === MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NOT_MODELED) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS.NOT_MODELED_FOR_USE;
  if (status === MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_CONTEXT) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS.COLLECT_CONTEXT;
  if (status === MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_EVIDENCE) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS.COLLECT_EVIDENCE;
  if (status === MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_SOURCE_OWNER) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS.COLLECT_SOURCE_OWNER;
  if (status === MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_FRESHNESS) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS.REFRESH_CONTEXT;
  if (status === MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.UNKNOWN || status === MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_HUMAN_REVIEW) return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS.REQUIRE_HUMAN_REVIEW;
  return MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS.BUILD_PROMPT_INSTRUCTIONS_ONLY;
}

function evaluateManagerMessagePromptBuilderBoundary({
  managerContext = null,
  nashConversationContext = null,
  messagePurpose = null,
  audienceType = null,
  requestedUse = null,
  evidenceRefs = [],
  sourceEvidenceIds = [],
  sourceOwners = [],
  freshness = null,
  period = null
} = {}) {
  const safeManagerContext = clone(managerContext);
  const safeNashContext = clone(nashConversationContext);
  const contextValues = [safeManagerContext, safeNashContext].filter(present);
  const use = resolveUse(requestedUse);
  const mergedEvidenceRefs = collectEvidenceRefs(contextValues, { evidenceRefs });
  const mergedSourceEvidenceIds = collectSourceEvidenceIds(contextValues, { sourceEvidenceIds });
  const mergedSourceOwners = collectSourceOwners(contextValues, { sourceOwners });
  const freshnessContext = resolveFreshness(contextValues, freshness);
  const missingContext = unique([
    ...(!present(safeManagerContext) ? ["managerContext_missing"] : []),
    ...(!present(safeNashContext) ? ["nashConversationContext_missing"] : []),
    ...(!present(messagePurpose) ? ["messagePurpose_missing"] : []),
    ...(!present(audienceType) ? ["audienceType_missing"] : [])
  ]);
  const unknownContext = unique([
    ...collectUnknown(safeManagerContext, "managerContext"),
    ...collectUnknown(safeNashContext, "nashConversationContext")
  ].filter((item) => !missingContext.includes(item)));
  const staleContext = unique([
    ...asArray(safeManagerContext && safeManagerContext.stale),
    ...asArray(safeManagerContext && safeManagerContext.staleContext),
    ...asArray(safeManagerContext && safeManagerContext.stalePeriods),
    ...asArray(safeNashContext && safeNashContext.stale),
    ...asArray(safeNashContext && safeNashContext.staleContext),
    ...asArray(safeNashContext && safeNashContext.stalePeriods),
    ...(freshnessContext.stale ? ["freshness_stale"] : [])
  ]);
  const warnings = [];
  const confidenceLimitations = [];
  const defaultZeroWarnings = unique([
    ...detectZeroContext(safeManagerContext, "managerContext"),
    ...detectZeroContext(safeNashContext, "nashConversationContext")
  ]);

  if (missingContext.length > 0) warnings.push("Missing manager or Nash context requires review; missing context is not zero.");
  if (unknownContext.length > 0) warnings.push("Unknown context remains unknown and review-required.");
  if (mergedEvidenceRefs.length === 0 && mergedSourceEvidenceIds.length === 0) {
    warnings.push("Missing evidence requires review.");
    confidenceLimitations.push("missing_evidence");
  }
  if (mergedSourceOwners.length === 0) {
    warnings.push("Missing source owner requires review.");
    confidenceLimitations.push("missing_source_owner");
  }
  if (!freshnessContext.available) {
    warnings.push("Missing freshness requires review.");
    confidenceLimitations.push("missing_freshness");
  }
  if (freshnessContext.stale || staleContext.length > 0) {
    warnings.push("Stale freshness requires review.");
    confidenceLimitations.push("stale_freshness");
  }
  defaultZeroWarnings.forEach((warning) => {
    warnings.push(`${warning}: explicit zero is preserved as context only and is not judgment.`);
    confidenceLimitations.push(warning);
  });
  use.blockedUses.forEach((blockedUse) => warnings.push(`${blockedUse} is blocked for prompt preparation.`));

  const promptStatus = resolveStatus({
    blockedUses: use.blockedUses,
    unknownUses: use.unknownUses,
    missingContext,
    unknownContext,
    evidenceRefs: mergedEvidenceRefs,
    sourceEvidenceIds: mergedSourceEvidenceIds,
    sourceOwners: mergedSourceOwners,
    freshnessContext,
    staleContext,
    defaultZeroWarnings
  });
  const promptDecision = resolveDecision(promptStatus);
  const managerReviewRequired = promptStatus !== MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.READY_FOR_PROMPT_REVIEW;
  const humanReviewRequired = true;

  return {
    promptStatus,
    promptDecision,
    promptPurpose: messagePurpose || null,
    audienceType: audienceType || null,
    evidenceRefs: mergedEvidenceRefs,
    sourceEvidenceIds: mergedSourceEvidenceIds,
    sourceOwners: mergedSourceOwners,
    freshness: freshnessContext.value,
    period: clone(period),
    missingContext,
    unknownContext,
    staleContext,
    warnings: unique([
      ...warnings,
      "Prompt is not draft.",
      "Draft is not approved communication.",
      "Nash support is not Nash runtime execution.",
      "Message recommendation is not message send.",
      "Next-best-action is not execution.",
      "Human approval is mandatory before action."
    ]),
    confidenceLimitations: unique(confidenceLimitations),
    allowedUses: unique(use.allowedUses),
    blockedUses: unique(use.blockedUses),
    managerReviewRequired,
    humanReviewRequired,
    ...falseFlags()
  };
}

module.exports = {
  evaluateManagerMessagePromptBuilderBoundary,
  MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES,
  MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_DECISIONS,
  ALLOWED_MANAGER_MESSAGE_PROMPT_USES,
  FORBIDDEN_MANAGER_MESSAGE_PROMPT_USES
};
