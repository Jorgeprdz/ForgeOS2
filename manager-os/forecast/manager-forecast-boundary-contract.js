const MANAGER_FORECAST_BOUNDARY_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MANAGER_FORECAST_BOUNDARY_DECISIONS = Object.freeze({
  USE_AS_FORECAST_CONTEXT: "USE_AS_FORECAST_CONTEXT",
  COLLECT_FORECAST_EVIDENCE: "COLLECT_FORECAST_EVIDENCE",
  COLLECT_SOURCE_OWNER: "COLLECT_SOURCE_OWNER",
  REFRESH_FORECAST_CONTEXT: "REFRESH_FORECAST_CONTEXT",
  REQUIRE_HUMAN_REVIEW: "REQUIRE_HUMAN_REVIEW",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE",
  NOT_MODELED_FOR_USE: "NOT_MODELED_FOR_USE"
});

const ALLOWED_FORECAST_USES = Object.freeze([
  "MANAGER_REVIEW",
  "FORECAST_CONTEXT",
  "COACHING_CONTEXT",
  "DASHBOARD_CONTEXT",
  "CONVERSATION_CONTEXT",
  "TEAM_PATTERN_CONTEXT",
  "SCENARIO_PLANNING_CONTEXT"
]);

const FORBIDDEN_FORECAST_USES = Object.freeze([
  "HUMAN_RANKING",
  "PERFORMANCE_LEADERBOARD",
  "PROMOTION_DECISION",
  "PUNISHMENT",
  "TERMINATION",
  "COMPENSATION",
  "PAYOUT",
  "REVENUE_TRUTH",
  "ADVISOR_LIFECYCLE_TRUTH",
  "AUTOMATIC_DECISION",
  "PRECONTRACT_TRUTH",
  "HIRING_TRUTH",
  "DATABASE_WRITE",
  "FILESYSTEM_WRITE",
  "CACHE_WRITE",
  "MIGRATION_WRITE",
  "SCHEMA_WRITE"
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
  return [...new Set(values.filter(present))];
}

function normalizeText(value) {
  return present(value) ? String(value).trim().toUpperCase() : null;
}

function clone(value) {
  if (!present(value)) return value;
  return JSON.parse(JSON.stringify(value));
}

function collectFromValue(value, field) {
  if (!present(value)) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => collectFromValue(entry, field));
  if (!isObject(value)) return [];
  return [
    ...asArray(value[field]),
    ...Object.values(value).flatMap((entry) => collectFromValue(entry, field))
  ];
}

function collectEvidenceRefs({ sourceEvidence = {}, values = [] } = {}) {
  return unique([
    ...asArray(sourceEvidence.evidenceRefs),
    ...asArray(sourceEvidence.evidenceRef),
    ...values.flatMap((value) => collectFromValue(value, "evidenceRefs")),
    ...values.flatMap((value) => collectFromValue(value, "evidenceRef"))
  ]);
}

function collectSourceEvidenceIds({ sourceEvidence = {}, values = [] } = {}) {
  return unique([
    ...asArray(sourceEvidence.sourceEvidenceIds),
    ...asArray(sourceEvidence.sourceEvidenceId),
    ...values.flatMap((value) => collectFromValue(value, "sourceEvidenceIds")),
    ...values.flatMap((value) => collectFromValue(value, "sourceEvidenceId"))
  ]);
}

function collectSourceOwners({ sourceEvidence = {}, values = [] } = {}) {
  return unique([
    ...asArray(sourceEvidence.sourceOwners),
    ...asArray(sourceEvidence.sourceOwner),
    ...values.flatMap((value) => collectFromValue(value, "sourceOwners")),
    ...values.flatMap((value) => collectFromValue(value, "sourceOwner"))
  ]);
}

function resolveFreshness({ freshness = null, sourceEvidence = {}, values = [] } = {}) {
  const candidates = unique([
    freshness,
    sourceEvidence.freshness,
    sourceEvidence.freshnessStatus,
    sourceEvidence.generatedAt,
    sourceEvidence.capturedAt,
    sourceEvidence.updatedAt,
    ...values.flatMap((value) => collectFromValue(value, "freshness")),
    ...values.flatMap((value) => collectFromValue(value, "freshnessStatus")),
    ...values.flatMap((value) => collectFromValue(value, "generatedAt")),
    ...values.flatMap((value) => collectFromValue(value, "capturedAt")),
    ...values.flatMap((value) => collectFromValue(value, "updatedAt"))
  ]);
  const explicitFreshness = freshness || sourceEvidence.freshness;
  const status = normalizeText(isObject(explicitFreshness) ? explicitFreshness.status : explicitFreshness || sourceEvidence.freshnessStatus);
  const stale =
    status === "STALE" ||
    status === "EXPIRED" ||
    sourceEvidence.isFresh === false ||
    values.some((value) => isObject(value) && (value.stale === true || normalizeText(value.periodStatus) === "STALE"));

  return {
    value: explicitFreshness || sourceEvidence.freshnessStatus || candidates[0] || null,
    available: candidates.length > 0,
    stale
  };
}

function resolveUse(requestedUse) {
  const normalized = normalizeText(requestedUse);
  if (!normalized) return { allowedUses: ["FORECAST_CONTEXT"], blockedUses: [], unknownUses: [] };
  if (FORBIDDEN_FORECAST_USES.includes(normalized)) return { allowedUses: [], blockedUses: [normalized], unknownUses: [] };
  if (ALLOWED_FORECAST_USES.includes(normalized)) return { allowedUses: [normalized], blockedUses: [], unknownUses: [] };
  return { allowedUses: [], blockedUses: [normalized], unknownUses: [normalized] };
}

function truthAndWriteFlags() {
  return {
    automaticDecisionAllowed: false,
    createsHumanRankingTruth: false,
    createsPerformanceLeaderboardTruth: false,
    createsPromotionDecisionTruth: false,
    createsPunishmentTruth: false,
    createsTerminationTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsRevenueTruth: false,
    createsCompensationTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false,
    createsPrecontractTruth: false,
    createsHiringTruth: false,
    createsDatabaseWrite: false,
    createsFilesystemWrite: false,
    createsCacheWrite: false,
    createsMigrationWrite: false,
    createsSchemaWrite: false
  };
}

function detectRollups(value) {
  if (!isObject(value)) return [];
  return asArray(value.rollups || value.historicalRollups || value.periodRollups);
}

function periodIdOf(value, fallback) {
  if (!present(value)) return fallback;
  if (typeof value === "string") return value;
  return value.periodId || value.id || (value.period && (value.period.periodId || value.period.id)) || fallback;
}

function detectMissingHistoricalPeriods(values) {
  return unique(values.flatMap((value, index) => {
    if (!present(value)) return [`period_${index}_missing`];
    if (Array.isArray(value)) return detectMissingHistoricalPeriods(value);
    if (!isObject(value)) return [];
    const status = normalizeText(value.periodStatus || value.status);
    if (status === "MISSING" || status === "UNKNOWN") return [periodIdOf(value, `period_${index}_missing`)];
    return [
      ...asArray(value.missingPeriods),
      ...asArray(value.unknownSignals).filter((signal) => String(signal).includes("period"))
    ];
  }));
}

function detectBlockedPeriods(values) {
  return unique(values.flatMap((value, index) => {
    if (!present(value)) return [];
    if (Array.isArray(value)) return detectBlockedPeriods(value);
    if (!isObject(value)) return [];
    const status = normalizeText(value.periodStatus || value.forecastStatus || value.boundaryStatus || value.storageStatus || value.rollupStatus);
    return [
      ...(status === "BLOCKED" ? [periodIdOf(value, `period_${index}_blocked`)] : []),
      ...asArray(value.blockedPeriods)
    ];
  }));
}

function detectStalePeriods(values) {
  return unique(values.flatMap((value, index) => {
    if (!present(value)) return [];
    if (Array.isArray(value)) return detectStalePeriods(value);
    if (!isObject(value)) return [];
    const status = normalizeText(value.periodStatus || value.freshnessStatus);
    return [
      ...(value.stale === true || status === "STALE" ? [periodIdOf(value, `period_${index}_stale`)] : []),
      ...asArray(value.stalePeriods),
      ...asArray(value.staleSignals).filter((signal) => String(signal).includes("period"))
    ];
  }));
}

function collectDefaultZeroRisks(values) {
  return unique(values.flatMap((value) => [
    ...asArray(value && value.defaultZeroRisks),
    ...collectFromValue(value, "defaultZeroRisks").flatMap(asArray),
    ...detectExplicitZeroValues(value)
  ]));
}

function detectExplicitZeroValues(value, path = "forecast") {
  if (value === 0) return [`${path}_explicit_zero_requires_evidence_review`];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => detectExplicitZeroValues(entry, `${path}_${index}`));
  }
  if (!isObject(value)) return [];
  return Object.entries(value).flatMap(([key, entry]) => detectExplicitZeroValues(entry, `${path}_${key}`));
}

function resolveDecision({ blockedUses, missingEvidence, staleSignals, unknownSignals }) {
  if (blockedUses.length > 0) return MANAGER_FORECAST_BOUNDARY_DECISIONS.BLOCK_FORBIDDEN_USE;
  if (missingEvidence.includes("forecast_source_owner_missing")) return MANAGER_FORECAST_BOUNDARY_DECISIONS.COLLECT_SOURCE_OWNER;
  if (staleSignals.length > 0) return MANAGER_FORECAST_BOUNDARY_DECISIONS.REFRESH_FORECAST_CONTEXT;
  if (missingEvidence.length > 0) return MANAGER_FORECAST_BOUNDARY_DECISIONS.COLLECT_FORECAST_EVIDENCE;
  if (unknownSignals.length > 0) return MANAGER_FORECAST_BOUNDARY_DECISIONS.REQUIRE_HUMAN_REVIEW;
  return MANAGER_FORECAST_BOUNDARY_DECISIONS.USE_AS_FORECAST_CONTEXT;
}

function resolveStatus({ blockedUses, unknownUses, missingForecastInputs, missingHistoricalPeriods, missingRollups, blockedPeriods, directEvidenceRefs, directSourceEvidenceIds, directSourceOwners, directFreshness, staleSignals, defaultZeroRisks, assumptions, confidenceLimitations }) {
  if (blockedUses.length > 0) return unknownUses.length > 0 ? MANAGER_FORECAST_BOUNDARY_STATUSES.NOT_MODELED : MANAGER_FORECAST_BOUNDARY_STATUSES.BLOCKED;
  if (blockedPeriods.length > 0) return MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_HUMAN_REVIEW;
  if (missingForecastInputs.length > 0 || missingHistoricalPeriods.length > 0 || missingRollups.length > 0) return MANAGER_FORECAST_BOUNDARY_STATUSES.UNKNOWN;
  if (directEvidenceRefs.length === 0 && directSourceEvidenceIds.length === 0) return MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_EVIDENCE;
  if (directSourceOwners.length === 0) return MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_SOURCE_OWNER;
  if (!directFreshness.available || directFreshness.stale || staleSignals.length > 0) return MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_FRESHNESS;
  if (defaultZeroRisks.length > 0 || assumptions.length === 0 || confidenceLimitations.length === 0) return MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_HUMAN_REVIEW;
  return MANAGER_FORECAST_BOUNDARY_STATUSES.READY_FOR_MANAGER_REVIEW;
}

function buildManagerForecastBoundary({
  forecastContext = null,
  historicalContext = null,
  storageBoundaryContext = null,
  queryPlanContext = null,
  sourceEvidence = {},
  freshness = null,
  requestedUse = null,
  periodRange = null,
  assumptions = [],
  confidenceLimitations = [],
  generatedAt = null
} = {}) {
  const safeForecastContext = clone(forecastContext);
  const safeHistoricalContext = clone(historicalContext);
  const safeStorageBoundaryContext = clone(storageBoundaryContext);
  const safeQueryPlanContext = clone(queryPlanContext);
  const values = [safeForecastContext, safeHistoricalContext, safeStorageBoundaryContext, safeQueryPlanContext].filter(present);
  const storageRollups = detectRollups(safeStorageBoundaryContext);
  const evidenceRefs = collectEvidenceRefs({ sourceEvidence, values });
  const sourceEvidenceIds = collectSourceEvidenceIds({ sourceEvidence, values });
  const sourceOwners = collectSourceOwners({ sourceEvidence, values });
  const directEvidenceRefs = collectEvidenceRefs({ sourceEvidence, values: [] });
  const directSourceEvidenceIds = collectSourceEvidenceIds({ sourceEvidence, values: [] });
  const directSourceOwners = collectSourceOwners({ sourceEvidence, values: [] });
  const freshnessContext = resolveFreshness({ freshness, sourceEvidence, values });
  const directFreshness = resolveFreshness({ freshness, sourceEvidence, values: [] });
  const use = resolveUse(requestedUse);
  const missingForecastInputs = [];
  const missingHistoricalPeriods = detectMissingHistoricalPeriods([safeHistoricalContext]);
  const missingRollups = [];
  const blockedPeriods = detectBlockedPeriods(values);
  const stalePeriods = detectStalePeriods(values);
  const unknownSignals = [];
  const missingEvidence = [];
  const staleSignals = [];
  const defaultZeroRisks = collectDefaultZeroRisks(values);
  const localAssumptions = unique([
    ...asArray(assumptions),
    ...asArray(safeForecastContext && safeForecastContext.assumptions)
  ]);
  const localLimitations = unique([
    ...asArray(confidenceLimitations),
    ...asArray(safeForecastContext && safeForecastContext.confidenceLimitations)
  ]);
  const warnings = [];

  if (!present(safeForecastContext)) {
    missingForecastInputs.push("forecast_context_missing");
    unknownSignals.push("forecast_context_missing");
    warnings.push("Missing forecast context is UNKNOWN, not zero.");
  }
  if (!present(safeHistoricalContext) || missingHistoricalPeriods.length > 0) {
    unknownSignals.push("historical_period_context_missing");
    warnings.push("Missing historical periods are UNKNOWN, not zero.");
  }
  if (present(safeStorageBoundaryContext) && storageRollups.length === 0) {
    missingRollups.push("historical_rollups_missing");
    unknownSignals.push("historical_rollups_missing");
    warnings.push("Missing rollups are UNKNOWN, not poor performance.");
  }
  if (blockedPeriods.length > 0) warnings.push("Blocked periods require review and do not collapse to zero.");
  if (directEvidenceRefs.length === 0 && directSourceEvidenceIds.length === 0) {
    missingEvidence.push("forecast_evidence_missing");
    localLimitations.push("missing_forecast_evidence");
  }
  if (directSourceOwners.length === 0) {
    missingEvidence.push("forecast_source_owner_missing");
    localLimitations.push("missing_forecast_source_owner");
  }
  if (!directFreshness.available) {
    staleSignals.push("forecast_freshness_missing");
    localLimitations.push("missing_forecast_freshness");
  }
  if (directFreshness.stale || freshnessContext.stale || stalePeriods.length > 0) {
    staleSignals.push("forecast_freshness_stale");
    localLimitations.push("stale_forecast_freshness");
    warnings.push("Stale forecast freshness or periods require review.");
  }
  if (localAssumptions.length === 0) {
    missingEvidence.push("forecast_assumptions_required");
    warnings.push("Forecast scenarios require explicit assumptions.");
  }
  if (localLimitations.length === 0) {
    missingEvidence.push("forecast_confidence_limitations_required");
    warnings.push("Forecast scenarios require confidence limitations.");
  }
  defaultZeroRisks.forEach((risk) => {
    localLimitations.push(risk);
    warnings.push(`${risk}: explicit zero forecast value is context only when evidence/source/freshness exists.`);
  });
  use.blockedUses.forEach((blockedUse) => warnings.push(`${blockedUse} use is blocked for Manager OS Forecast Intelligence.`));

  const forecastBoundaryStatus = resolveStatus({
    blockedUses: use.blockedUses,
    unknownUses: use.unknownUses,
    missingForecastInputs,
    missingHistoricalPeriods,
    missingRollups,
    blockedPeriods,
    directEvidenceRefs,
    directSourceEvidenceIds,
    directSourceOwners,
    directFreshness,
    staleSignals,
    defaultZeroRisks,
    assumptions: localAssumptions,
    confidenceLimitations: localLimitations
  });
  const forecastBoundaryDecision = resolveDecision({
    blockedUses: use.blockedUses,
    missingEvidence,
    staleSignals,
    unknownSignals
  });
  const managerReviewRequired = forecastBoundaryStatus !== MANAGER_FORECAST_BOUNDARY_STATUSES.READY_FOR_MANAGER_REVIEW;
  const humanReviewRequired = managerReviewRequired;

  return {
    forecastBoundaryStatus,
    forecastBoundaryDecision,
    requestedUse: requestedUse || null,
    allowedUses: unique(use.allowedUses),
    blockedUses: unique(use.blockedUses),
    periodRange: clone(periodRange || (safeHistoricalContext && safeHistoricalContext.periodRange) || (safeQueryPlanContext && safeQueryPlanContext.queryPlan && safeQueryPlanContext.queryPlan.filters && safeQueryPlanContext.queryPlan.filters.periodRange) || null),
    generatedAt: generatedAt || sourceEvidence.generatedAt || sourceEvidence.capturedAt || null,
    missingForecastInputs: unique(missingForecastInputs),
    missingHistoricalPeriods: unique(missingHistoricalPeriods),
    missingRollups: unique(missingRollups),
    blockedPeriods: unique(blockedPeriods),
    stalePeriods: unique(stalePeriods),
    unknownSignals: unique([
      ...unknownSignals,
      ...values.flatMap((value) => asArray(value && value.unknownSignals))
    ]),
    missingEvidence: unique(missingEvidence),
    staleSignals: unique([
      ...staleSignals,
      ...values.flatMap((value) => asArray(value && value.staleSignals))
    ]),
    defaultZeroRisks: unique(defaultZeroRisks),
    evidenceRefs,
    sourceEvidenceIds,
    sourceOwners,
    freshness: freshnessContext.value,
    assumptions: localAssumptions,
    confidenceLimitations: unique(localLimitations),
    warnings: unique([
      ...warnings,
      "Forecast is scenario context only and does not create revenue, compensation, payout, lifecycle, ranking, promotion, punishment, termination, precontract, hiring, write or automatic decision truth."
    ]),
    managerReviewRequired,
    humanReviewRequired,
    ...truthAndWriteFlags()
  };
}

module.exports = {
  buildManagerForecastBoundary,
  MANAGER_FORECAST_BOUNDARY_STATUSES,
  MANAGER_FORECAST_BOUNDARY_DECISIONS,
  ALLOWED_FORECAST_USES,
  FORBIDDEN_FORECAST_USES
};
