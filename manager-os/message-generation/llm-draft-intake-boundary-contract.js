"use strict";

const LLM_DRAFT_INTAKE_STATUSES = Object.freeze({
  READY_FOR_SAFETY_REVIEW: "READY_FOR_SAFETY_REVIEW",
  NEEDS_DRAFT: "NEEDS_DRAFT",
  NEEDS_PROMPT_CONTEXT: "NEEDS_PROMPT_CONTEXT",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const LLM_DRAFT_INTAKE_DECISIONS = Object.freeze({
  INTAKE_FOR_SAFETY_REVIEW_ONLY: "INTAKE_FOR_SAFETY_REVIEW_ONLY",
  COLLECT_DRAFT: "COLLECT_DRAFT",
  COLLECT_PROMPT_CONTEXT: "COLLECT_PROMPT_CONTEXT",
  COLLECT_EVIDENCE: "COLLECT_EVIDENCE",
  COLLECT_SOURCE_OWNER: "COLLECT_SOURCE_OWNER",
  REFRESH_CONTEXT: "REFRESH_CONTEXT",
  REQUIRE_HUMAN_REVIEW: "REQUIRE_HUMAN_REVIEW",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE",
  NOT_MODELED_FOR_USE: "NOT_MODELED_FOR_USE"
});

const ALLOWED_LLM_DRAFT_INTAKE_USES = Object.freeze([
  "LLM_DRAFT_INTAKE",
  "SAFETY_REVIEW_PREP",
  "HUMAN_REVIEW_PREP",
  "MESSAGE_REVISION_REVIEW"
]);

const FORBIDDEN_LLM_DRAFT_INTAKE_USES = Object.freeze([
  "LLM_RUNTIME_EXECUTION",
  "GENERATE_DRAFT",
  "AUTO_APPROVE_DRAFT",
  "SEND_MESSAGE",
  "WHATSAPP_SEND",
  "SMS_SEND",
  "CREATE_TASK",
  "CREATE_CALENDAR_EVENT",
  "NASH_RUNTIME_EXECUTION",
  "NEXT_BEST_ACTION_EXECUTION",
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
    ...values.flatMap((value) => collectNested(value, "evidenceRef"))
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
  if (!normalized) return { allowedUses: ["LLM_DRAFT_INTAKE"], blockedUses: [], unknownUses: [] };
  if (FORBIDDEN_LLM_DRAFT_INTAKE_USES.includes(normalized)) return { allowedUses: [], blockedUses: [normalized], unknownUses: [] };
  if (ALLOWED_LLM_DRAFT_INTAKE_USES.includes(normalized)) return { allowedUses: [normalized], blockedUses: [], unknownUses: [] };
  return { allowedUses: [], blockedUses: [normalized], unknownUses: [normalized] };
}

function falseFlags() {
  return {
    humanApprovalRequired: true,
    humanReviewRequired: true,
    automaticDecisionAllowed: false,
    draftIsApprovedCommunication: false,
    safetyValidationIsHumanApproval: false,
    createsDraft: false,
    sendsMessage: false,
    createsTask: false,
    createsCalendarEvent: false,
    executesLlmRuntime: false,
    executesNashRuntime: false,
    executesDeliveryAdapter: false,
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

function resolveStatus({
  blockedUses,
  unknownUses,
  draftText,
  missingContext,
  unknownContext,
  evidenceRefs,
  sourceEvidenceIds,
  sourceOwners,
  freshnessContext,
  staleContext,
  defaultZeroWarnings
}) {
  if (blockedUses.length > 0) {
    return unknownUses.length > 0
      ? LLM_DRAFT_INTAKE_STATUSES.NOT_MODELED
      : LLM_DRAFT_INTAKE_STATUSES.BLOCKED;
  }
  if (!present(draftText)) return LLM_DRAFT_INTAKE_STATUSES.NEEDS_DRAFT;
  if (missingContext.length > 0) return LLM_DRAFT_INTAKE_STATUSES.NEEDS_PROMPT_CONTEXT;
  if (unknownContext.length > 0) return LLM_DRAFT_INTAKE_STATUSES.UNKNOWN;
  if (evidenceRefs.length === 0 && sourceEvidenceIds.length === 0) return LLM_DRAFT_INTAKE_STATUSES.NEEDS_EVIDENCE;
  if (sourceOwners.length === 0) return LLM_DRAFT_INTAKE_STATUSES.NEEDS_SOURCE_OWNER;
  if (!freshnessContext.available || freshnessContext.stale || staleContext.length > 0) return LLM_DRAFT_INTAKE_STATUSES.NEEDS_FRESHNESS;
  if (defaultZeroWarnings.length > 0) return LLM_DRAFT_INTAKE_STATUSES.NEEDS_HUMAN_REVIEW;
  return LLM_DRAFT_INTAKE_STATUSES.READY_FOR_SAFETY_REVIEW;
}

function resolveDecision(status) {
  if (status === LLM_DRAFT_INTAKE_STATUSES.BLOCKED) return LLM_DRAFT_INTAKE_DECISIONS.BLOCK_FORBIDDEN_USE;
  if (status === LLM_DRAFT_INTAKE_STATUSES.NOT_MODELED) return LLM_DRAFT_INTAKE_DECISIONS.NOT_MODELED_FOR_USE;
  if (status === LLM_DRAFT_INTAKE_STATUSES.NEEDS_DRAFT) return LLM_DRAFT_INTAKE_DECISIONS.COLLECT_DRAFT;
  if (status === LLM_DRAFT_INTAKE_STATUSES.NEEDS_PROMPT_CONTEXT) return LLM_DRAFT_INTAKE_DECISIONS.COLLECT_PROMPT_CONTEXT;
  if (status === LLM_DRAFT_INTAKE_STATUSES.NEEDS_EVIDENCE) return LLM_DRAFT_INTAKE_DECISIONS.COLLECT_EVIDENCE;
  if (status === LLM_DRAFT_INTAKE_STATUSES.NEEDS_SOURCE_OWNER) return LLM_DRAFT_INTAKE_DECISIONS.COLLECT_SOURCE_OWNER;
  if (status === LLM_DRAFT_INTAKE_STATUSES.NEEDS_FRESHNESS) return LLM_DRAFT_INTAKE_DECISIONS.REFRESH_CONTEXT;
  if (status !== LLM_DRAFT_INTAKE_STATUSES.READY_FOR_SAFETY_REVIEW) return LLM_DRAFT_INTAKE_DECISIONS.REQUIRE_HUMAN_REVIEW;
  return LLM_DRAFT_INTAKE_DECISIONS.INTAKE_FOR_SAFETY_REVIEW_ONLY;
}

function intakeLlmDraftForSafetyReview({
  draftText = null,
  draftPurpose = null,
  audienceType = null,
  promptContext = null,
  evidenceRefs = [],
  sourceEvidenceIds = [],
  sourceOwners = [],
  freshness = null,
  period = null,
  requestedUse = null
} = {}) {
  const safePromptContext = clone(promptContext);
  const values = [safePromptContext, period];
  const collectedEvidenceRefs = collectEvidenceRefs(values, { evidenceRefs });
  const collectedSourceEvidenceIds = collectSourceEvidenceIds(values, { sourceEvidenceIds });
  const collectedSourceOwners = collectSourceOwners(values, { sourceOwners });
  const freshnessContext = resolveFreshness(values, freshness);
  const { allowedUses, blockedUses, unknownUses } = resolveUse(requestedUse);
  const missingContext = present(safePromptContext) ? [] : ["prompt_context_missing"];
  const unknownContext = collectUnknown(safePromptContext, "prompt_context").filter((item) => item !== "prompt_context_missing");
  const staleContext = freshnessContext.stale ? ["freshness_stale"] : [];
  const defaultZeroWarnings = detectZeroContext(safePromptContext, "prompt_context");
  const warnings = unique([
    "draft_is_not_approved_communication",
    "draft_intake_is_not_llm_runtime_execution",
    "human_approval_required_before_action",
    ...defaultZeroWarnings
  ]);
  const confidenceLimitations = unique([
    "llm_output_is_draft_language_only",
    "safety_validation_is_not_human_approval",
    collectedEvidenceRefs.length === 0 && collectedSourceEvidenceIds.length === 0 ? "missing_evidence_requires_review" : null,
    collectedSourceOwners.length === 0 ? "missing_source_owner_requires_review" : null,
    !freshnessContext.available ? "missing_freshness_requires_review" : null,
    freshnessContext.stale ? "stale_freshness_requires_review" : null
  ]);
  const intakeStatus = resolveStatus({
    blockedUses,
    unknownUses,
    draftText,
    missingContext,
    unknownContext,
    evidenceRefs: collectedEvidenceRefs,
    sourceEvidenceIds: collectedSourceEvidenceIds,
    sourceOwners: collectedSourceOwners,
    freshnessContext,
    staleContext,
    defaultZeroWarnings
  });

  return {
    intakeStatus,
    intakeDecision: resolveDecision(intakeStatus),
    draftText: draftText || null,
    draftPurpose: draftPurpose || null,
    audienceType: audienceType || null,
    promptContext: safePromptContext || null,
    evidenceRefs: collectedEvidenceRefs,
    sourceEvidenceIds: collectedSourceEvidenceIds,
    sourceOwners: collectedSourceOwners,
    freshness: freshnessContext.value,
    period: clone(period),
    missingContext,
    unknownContext,
    staleContext,
    warnings,
    confidenceLimitations,
    allowedUses,
    blockedUses,
    ...falseFlags()
  };
}

module.exports = {
  intakeLlmDraftForSafetyReview,
  LLM_DRAFT_INTAKE_STATUSES,
  LLM_DRAFT_INTAKE_DECISIONS,
  ALLOWED_LLM_DRAFT_INTAKE_USES,
  FORBIDDEN_LLM_DRAFT_INTAKE_USES
};
