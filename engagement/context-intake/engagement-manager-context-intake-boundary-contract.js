"use strict";

const ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS = Object.freeze({
  ALLOW: "ALLOW",
  REVIEW: "REVIEW",
  BLOCK: "BLOCK"
});

const ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES = Object.freeze({
  READY: "READY",
  UNKNOWN: "UNKNOWN",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED"
});

const ALLOWED_ENGAGEMENT_MANAGER_CONTEXT_INTAKE_USES = Object.freeze([
  "ENGAGEMENT_SUPPORT_CONTEXT_INTAKE",
  "MANAGER_CONTEXT_INTAKE",
  "PRIVATE_MOTIVATION_REVIEW_CONTEXT",
  "DIGNITY_REVIEW_CONTEXT",
  "SUPPORT_CONTEXT",
  "COACHING_CONTEXT",
  "EVIDENCE_REVIEW_CONTEXT",
  "HUMAN_REVIEW_CONTEXT"
]);

const FORBIDDEN_ENGAGEMENT_MANAGER_CONTEXT_INTAKE_USES = Object.freeze([
  "ENGAGEMENT_RUNTIME_EXECUTION",
  "PRIVATE_INTENT_TRUTH",
  "MOTIVATION_TRUTH_CREATION",
  "EMOTIONAL_DIAGNOSIS",
  "BURNOUT_DIAGNOSIS",
  "PSYCHOLOGICAL_PROFILE_TRUTH",
  "PURPOSE_TRUTH_CREATION",
  "PURPOSE_VAULT_READ",
  "PURPOSE_VAULT_WRITE",
  "HIDDEN_PERSONALIZATION",
  "MANIPULATION",
  "SHAME_MECHANICS",
  "SCARCITY_PRESSURE",
  "MANAGER_LEVERAGE",
  "CLIENT_MANIPULATION",
  "NASH_LANGUAGE_GENERATION",
  "MICK_BEHAVIOR_SCORING",
  "PRODUCTIVITY_SCORING",
  "HR_DECISION",
  "DISCIPLINARY_ACTION",
  "HUMAN_RANKING",
  "PERFORMANCE_LEADERBOARD",
  "PROMOTION_DECISION",
  "PUNISHMENT",
  "TERMINATION",
  "MESSAGE_SEND",
  "EMAIL_SEND",
  "DRAFT_CREATE",
  "TASK_CREATE",
  "CALENDAR_WRITE",
  "AUTOMATIC_DECISION",
  "COMPENSATION",
  "PAYOUT",
  "REVENUE_TRUTH",
  "ADVISOR_LIFECYCLE_TRUTH",
  "PRECONTRACT_TRUTH",
  "HIRING_TRUTH",
  "DATABASE_WRITE",
  "FILESYSTEM_WRITE",
  "CACHE_WRITE",
  "MIGRATION_WRITE",
  "SCHEMA_WRITE",
  "UI_RENDERING"
]);

function clonePlain(value) {
  if (value === null || value === undefined) return {};
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeStrings(value) {
  return asArray(value).map(normalizeString).filter(Boolean);
}

function dedupeStrings(values) {
  const seen = new Set();
  const result = [];

  for (const value of values || []) {
    const normalized = normalizeString(value);
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function mergeUnique(...groups) {
  return dedupeStrings(groups.flatMap((group) => normalizeStrings(group)));
}

function createFalseTruthFlags() {
  return {
    automaticDecisionAllowed: false,
    createsEngagementRuntimeTruth: false,
    createsPrivateIntentTruth: false,
    createsMotivationTruth: false,
    createsEmotionalDiagnosis: false,
    createsBurnoutDiagnosis: false,
    createsPsychologicalProfileTruth: false,
    createsPurposeTruth: false,
    readsPurposeVault: false,
    writesPurposeVault: false,
    createsHRTruth: false,
    createsDisciplinaryTruth: false,
    createsRankingTruth: false,
    createsPromotionTruth: false,
    createsPunishmentTruth: false,
    createsTerminationTruth: false,
    createsRevenueTruth: false,
    createsCompensationTruth: false,
    createsPayoutTruth: false,
    createsLifecycleTruth: false,
    createsPrecontractTruth: false,
    createsHiringTruth: false,
    createsDownstreamTruth: false
  };
}

function createFalseActionFlags() {
  return {
    executesEngagementRuntime: false,
    sendsMessage: false,
    sendsEmail: false,
    createsDraft: false,
    createsTask: false,
    writesCalendar: false,
    writesDatabase: false,
    writesFilesystem: false,
    writesCache: false,
    writesMigration: false,
    writesSchema: false,
    rendersUI: false,
    executesAdapter: false
  };
}

function evaluateEngagementManagerContextIntakeUse(requestedUses) {
  const normalizedUses = normalizeStrings(requestedUses).map((use) => use.toUpperCase());

  if (normalizedUses.length === 0) {
    return {
      decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW,
      allowedUses: [],
      blockedUses: [],
      reviewUses: ["MISSING_REQUESTED_USE"]
    };
  }

  const allowed = new Set(ALLOWED_ENGAGEMENT_MANAGER_CONTEXT_INTAKE_USES);
  const forbidden = new Set(FORBIDDEN_ENGAGEMENT_MANAGER_CONTEXT_INTAKE_USES);

  const blockedUses = [];
  const reviewUses = [];
  const allowedUses = [];

  for (const use of normalizedUses) {
    if (forbidden.has(use)) {
      blockedUses.push(use);
    } else if (allowed.has(use)) {
      allowedUses.push(use);
    } else {
      reviewUses.push(use);
    }
  }

  if (blockedUses.length > 0) {
    return {
      decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK,
      allowedUses,
      blockedUses,
      reviewUses
    };
  }

  if (reviewUses.length > 0) {
    return {
      decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW,
      allowedUses,
      blockedUses,
      reviewUses
    };
  }

  return {
    decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.ALLOW,
    allowedUses,
    blockedUses,
    reviewUses
  };
}

function collectZeroPaths(value, prefix = "", depth = 0) {
  if (depth > 5) return [];

  if (typeof value === "number" && value === 0) {
    return [prefix || "value"];
  }

  if (!value || typeof value !== "object") return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectZeroPaths(item, `${prefix}[${index}]`, depth + 1));
  }

  return Object.keys(value).flatMap((key) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return collectZeroPaths(value[key], nextPrefix, depth + 1);
  });
}

function normalizeFreshness(input) {
  const freshness = input.freshness || input.freshnessContext || {};
  const hasFreshness =
    Boolean(input.freshness) ||
    Boolean(input.freshnessContext) ||
    Boolean(input.freshnessStatus) ||
    Boolean(input.asOf);

  if (!hasFreshness) {
    return {
      status: "UNKNOWN",
      requiresReview: true,
      warnings: ["Missing freshness context."]
    };
  }

  const status = normalizeString(freshness.status || input.freshnessStatus || "FRESH").toUpperCase();
  const stale =
    freshness.stale === true ||
    input.stale === true ||
    status === "STALE" ||
    status === "EXPIRED";

  if (stale) {
    return {
      status: "STALE",
      requiresReview: true,
      warnings: ["Stale engagement context requires human review."]
    };
  }

  return {
    status: status || "FRESH",
    requiresReview: false,
    warnings: []
  };
}

function collectEvidenceSources(input) {
  return mergeUnique(
    input.evidenceSources,
    input.evidenceSource,
    input.evidence && input.evidence.sources,
    input.evidence && input.evidence.source,
    input.sourceContext && input.sourceContext.evidenceSources
  );
}

function collectSourceOwners(input) {
  return mergeUnique(
    input.sourceOwners,
    input.sourceOwner,
    input.evidence && input.evidence.sourceOwners,
    input.evidence && input.evidence.sourceOwner,
    input.sourceContext && input.sourceContext.sourceOwners
  );
}

function buildEngagementManagerContextIntakeBoundary(packet, options = {}) {
  const input = clonePlain(packet);
  const isMissingPacket = !packet || typeof packet !== "object" || Object.keys(input).length === 0;

  const warnings = [];
  const missing = [];
  const limitations = [];
  const evidenceSources = collectEvidenceSources(input);
  const sourceOwners = collectSourceOwners(input);
  const freshness = normalizeFreshness(input);
  const blockedPeriods = normalizeStrings(input.blockedPeriods || input.blockedPeriodContext);
  const defaultZeroRisks = collectZeroPaths(input).filter((path) => !path.toLowerCase().includes("version"));

  if (isMissingPacket) {
    missing.push("engagementManagerContextPacket");
    warnings.push("Missing Engagement manager context packet remains UNKNOWN and review-required.");
  }

  if (evidenceSources.length === 0) {
    missing.push("evidenceSources");
    warnings.push("Missing evidence source requires human review.");
  }

  if (sourceOwners.length === 0) {
    missing.push("sourceOwners");
    warnings.push("Missing source owner requires human review.");
  }

  if (freshness.requiresReview) {
    warnings.push(...freshness.warnings);
  }

  if (blockedPeriods.length > 0) {
    warnings.push("Blocked periods remain review-required and do not collapse to zero.");
    limitations.push("blocked_period_context_present");
  }

  if (defaultZeroRisks.length > 0) {
    warnings.push("Explicit zero values are context warnings only, not motivation truth.");
    limitations.push("explicit_zero_values_are_not_truth");
  }

  const requestedUses =
    options.requestedUses ||
    input.requestedUses ||
    input.uses ||
    input.useCases ||
    input.useCase ||
    [];

  const useEvaluation = evaluateEngagementManagerContextIntakeUse(requestedUses);

  let decision = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.ALLOW;
  let status = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.READY;

  if (useEvaluation.decision === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK) {
    decision = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK;
    status = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.BLOCKED;
  } else if (
    isMissingPacket ||
    missing.length > 0 ||
    warnings.length > 0 ||
    useEvaluation.decision === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW
  ) {
    decision = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW;
    status = isMissingPacket
      ? ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.UNKNOWN
      : ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.REVIEW_REQUIRED;
  }

  return {
    kind: "ENGAGEMENT_MANAGER_CONTEXT_INTAKE_BOUNDARY",
    status,
    decision,
    isContextOnly: true,
    isReviewContextOnly: true,
    protectedContextType: "PRIVATE_MOTIVATION_REVIEW_CONTEXT",
    evidenceSources,
    sourceOwners,
    freshness,
    blockedPeriods,
    missing: dedupeStrings(missing),
    warnings: dedupeStrings(warnings),
    limitations: dedupeStrings(limitations),
    defaultZeroRisks: dedupeStrings(defaultZeroRisks),
    allowedUses: useEvaluation.allowedUses,
    blockedUses: useEvaluation.blockedUses,
    reviewUses: useEvaluation.reviewUses,
    truthFlags: createFalseTruthFlags(),
    actionFlags: createFalseActionFlags()
  };
}

module.exports = {
  ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS,
  ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES,
  ALLOWED_ENGAGEMENT_MANAGER_CONTEXT_INTAKE_USES,
  FORBIDDEN_ENGAGEMENT_MANAGER_CONTEXT_INTAKE_USES,
  buildEngagementManagerContextIntakeBoundary,
  evaluateEngagementManagerContextIntakeUse,
  clonePlain,
  normalizeStrings,
  dedupeStrings,
  mergeUnique,
  createFalseTruthFlags,
  createFalseActionFlags
};
