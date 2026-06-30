const {
  buildManagerForecastBoundary
} = require("./manager-forecast-boundary-contract");

const MANAGER_RECRUITMENT_FORECAST_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MANAGER_RECRUITMENT_FORECAST_DECISIONS = Object.freeze({
  BUILD_RECRUITMENT_FORECAST_CONTEXT: "BUILD_RECRUITMENT_FORECAST_CONTEXT",
  USE_PROTECTED_RECRUITMENT_HISTORY: "USE_PROTECTED_RECRUITMENT_HISTORY",
  REQUIRE_HUMAN_REVIEW: "REQUIRE_HUMAN_REVIEW",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE"
});

function present(value) { return value !== undefined && value !== null && value !== ""; }
function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function asArray(value) { if (!present(value)) return []; return Array.isArray(value) ? value.filter(present) : [value].filter(present); }
function unique(values) { return [...new Set(values.filter(present))]; }
function clone(value) { if (!present(value)) return value; return JSON.parse(JSON.stringify(value)); }
function valueAtPath(object, path) { return path.split(".").reduce((current, key) => (current && current[key] !== undefined ? current[key] : null), object); }
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
    createsSchemaWrite: false,
    createsAutomaticApprovalTruth: false,
    createsAutomaticRejectionTruth: false
  };
}
function metricPayload(entry) { return entry && (entry.recruitmentMetrics || entry.metrics || entry); }
function extractTrendValue(context, path) {
  const value = valueAtPath(context, path);
  if (typeof value === "number") return value;
  const points = valueAtPath(context, `${path}.points`);
  if (Array.isArray(points)) {
    const known = points.filter((point) => typeof point.value === "number");
    return known.length > 0 ? known[known.length - 1].value : null;
  }
  return null;
}
function latestMetric(series, path) {
  const known = asArray(series)
    .map((entry) => valueAtPath(metricPayload(entry), path))
    .filter((value) => typeof value === "number");
  return known.length > 0 ? known[known.length - 1] : null;
}
function scenarioValue(base, multiplier) {
  if (typeof base !== "number") return "UNKNOWN";
  return Math.max(0, Math.round(base * multiplier * 100) / 100);
}
function buildScenario({ scenarioName, multiplier, projectedContext, assumptions, confidenceLimitations, warnings, evidenceRefs, sourceEvidenceIds, sourceOwners, freshness }) {
  return {
    scenarioName,
    scenarioStatus: "SCENARIO_CONTEXT",
    contextOnly: true,
    assumptions: unique(assumptions),
    confidenceLimitations: unique(confidenceLimitations),
    warnings: unique(warnings),
    evidenceRefs: unique(evidenceRefs),
    sourceEvidenceIds: unique(sourceEvidenceIds),
    sourceOwners: unique(sourceOwners),
    freshness,
    projectedContext: clone(projectedContext),
    scenarioMultiplier: multiplier,
    ...truthAndWriteFlags()
  };
}
function resolveStatus(boundary) {
  const map = {
    READY_FOR_MANAGER_REVIEW: MANAGER_RECRUITMENT_FORECAST_STATUSES.READY_FOR_MANAGER_REVIEW,
    NEEDS_EVIDENCE: MANAGER_RECRUITMENT_FORECAST_STATUSES.NEEDS_EVIDENCE,
    NEEDS_SOURCE_OWNER: MANAGER_RECRUITMENT_FORECAST_STATUSES.NEEDS_SOURCE_OWNER,
    NEEDS_FRESHNESS: MANAGER_RECRUITMENT_FORECAST_STATUSES.NEEDS_FRESHNESS,
    NEEDS_HUMAN_REVIEW: MANAGER_RECRUITMENT_FORECAST_STATUSES.NEEDS_HUMAN_REVIEW,
    BLOCKED: MANAGER_RECRUITMENT_FORECAST_STATUSES.BLOCKED,
    NOT_MODELED: MANAGER_RECRUITMENT_FORECAST_STATUSES.NOT_MODELED,
    UNKNOWN: MANAGER_RECRUITMENT_FORECAST_STATUSES.UNKNOWN
  };
  return map[boundary.forecastBoundaryStatus] || MANAGER_RECRUITMENT_FORECAST_STATUSES.UNKNOWN;
}

function calculateManagerRecruitmentForecast({
  recruitmentMetricsContext = null,
  recruitmentHistoricalContext = null,
  historicalStorageBoundaryContext = null,
  historicalRollupContext = null,
  historicalQueryPlanContext = null,
  sourceEvidence = {},
  requestedUse = null,
  periodRange = null,
  generatedAt = null,
  assumptions = [],
  confidenceLimitations = []
} = {}) {
  const metrics = clone(recruitmentMetricsContext);
  const historical = clone(recruitmentHistoricalContext);
  const series = asArray(metrics && metrics.recruitmentMetricsSeries);
  const latest = isObject(metrics && metrics.recruitmentMetrics) ? metrics.recruitmentMetrics : metricPayload(series[series.length - 1] || {});
  const historicalAnalytics = historical && (historical.recruitmentHistoricalAnalytics || historical);
  const baseContext = {
    candidatePipelineForecastContext: latestMetric(series, "totalCandidateSnapshots") || latest.totalCandidateSnapshots || extractTrendValue(historicalAnalytics, "candidateCohortContext.totalCandidateSnapshots"),
    interviewCompletionForecastContext: latestMetric(series, "initialInterviewsCompleted") || latest.initialInterviewsCompleted || extractTrendValue(historicalAnalytics, "interviewCompletionTrendContext.initial"),
    precontractReadinessForecastContext: latestMetric(series, "readyForPrecontractReviewCount") || latest.readyForPrecontractReviewCount || extractTrendValue(historicalAnalytics, "readyForPrecontractReviewTrend"),
    recruitmentVelocityForecastContext: valueAtPath(latest, "pipelineVelocityContext.eventCount") || extractTrendValue(historicalAnalytics, "pipelineVelocityContext"),
    candidateCohortForecastContext: latest.totalCandidateSnapshots || extractTrendValue(historicalAnalytics, "candidateCohortContext.totalCandidateSnapshots"),
    conversionForecastContext: valueAtPath(latest, "stageConversionRates.contactToInitialInterview.value") || extractTrendValue(historicalAnalytics, "conversionRateTrendContext.contactToInitialInterview"),
    reactivationReentryForecastContext: (latest.reactivatedCandidates || 0) + (latest.reentryReviewCandidates || 0),
    referenceOnly: true,
    createsTruth: false
  };
  const localAssumptions = unique([
    ...asArray(assumptions),
    ...asArray(metrics && metrics.assumptions),
    ...asArray(historical && historical.assumptions),
    "Recruitment forecast projects protected recruitment metrics and historical context only."
  ]);
  const localLimitations = unique([
    ...asArray(confidenceLimitations),
    ...asArray(metrics && metrics.confidenceLimitations),
    ...asArray(historical && historical.confidenceLimitations),
    "Forecast is scenario context, not hiring or precontract truth."
  ]);
  const boundary = buildManagerForecastBoundary({
    forecastContext: { recruitmentForecastContext: baseContext, assumptions: localAssumptions, confidenceLimitations: localLimitations },
    historicalContext: historical,
    storageBoundaryContext: historicalStorageBoundaryContext,
    queryPlanContext: historicalQueryPlanContext,
    sourceEvidence,
    requestedUse,
    periodRange,
    assumptions: localAssumptions,
    confidenceLimitations: localLimitations,
    generatedAt
  });
  const evidenceRefs = unique([...asArray(boundary.evidenceRefs), ...asArray(metrics && metrics.evidenceRefs), ...asArray(historical && historical.evidenceRefs), ...asArray(historicalRollupContext && historicalRollupContext.evidenceRefs)]);
  const sourceEvidenceIds = unique([...asArray(boundary.sourceEvidenceIds), ...asArray(metrics && metrics.sourceEvidenceIds), ...asArray(historical && historical.sourceEvidenceIds), ...asArray(historicalRollupContext && historicalRollupContext.sourceEvidenceIds)]);
  const sourceOwners = unique([...asArray(boundary.sourceOwners), ...asArray(metrics && metrics.sourceOwners), ...asArray(historical && historical.sourceOwners), ...asArray(historicalRollupContext && historicalRollupContext.sourceOwners)]);
  const warnings = unique([
    ...asArray(boundary.warnings),
    "Recruitment forecast decline is not punishment truth.",
    "Recruitment forecast improvement is not promotion truth.",
    "Ready-for-precontract forecast is not precontract truth.",
    "Candidate forecast is not hiring truth.",
    "Reactivation and reentry forecast is not automatic approval truth."
  ]);
  const scenarios = {
    conservativeScenario: buildScenario({ scenarioName: "CONSERVATIVE", multiplier: 0.8, projectedContext: Object.fromEntries(Object.entries(baseContext).map(([key, value]) => [key, typeof value === "number" ? scenarioValue(value, 0.8) : value])), assumptions: localAssumptions, confidenceLimitations: localLimitations, warnings, evidenceRefs, sourceEvidenceIds, sourceOwners, freshness: boundary.freshness }),
    baselineScenario: buildScenario({ scenarioName: "BASELINE", multiplier: 1, projectedContext: baseContext, assumptions: localAssumptions, confidenceLimitations: localLimitations, warnings, evidenceRefs, sourceEvidenceIds, sourceOwners, freshness: boundary.freshness }),
    stretchScenario: buildScenario({ scenarioName: "STRETCH", multiplier: 1.2, projectedContext: Object.fromEntries(Object.entries(baseContext).map(([key, value]) => [key, typeof value === "number" ? scenarioValue(value, 1.2) : value])), assumptions: localAssumptions, confidenceLimitations: localLimitations, warnings, evidenceRefs, sourceEvidenceIds, sourceOwners, freshness: boundary.freshness })
  };

  return {
    forecastStatus: resolveStatus(boundary),
    forecastDecision: boundary.forecastBoundaryDecision,
    periodRange: clone(periodRange || boundary.periodRange),
    generatedAt: generatedAt || boundary.generatedAt || null,
    recruitmentForecastContext: { ...scenarios, referenceOnly: true, createsTruth: false },
    boundaryContext: clone(boundary),
    missingEvidence: unique([...asArray(boundary.missingEvidence), ...asArray(metrics && metrics.missingEvidence), ...asArray(historical && historical.missingEvidence)]),
    unknownSignals: unique([...asArray(boundary.unknownSignals), ...asArray(metrics && metrics.unknownSignals), ...asArray(historical && historical.unknownSignals)]),
    staleSignals: unique([...asArray(boundary.staleSignals), ...asArray(metrics && metrics.staleSignals), ...asArray(historical && historical.staleSignals)]),
    defaultZeroRisks: unique([...asArray(boundary.defaultZeroRisks), ...asArray(metrics && metrics.defaultZeroRisks), ...asArray(historical && historical.defaultZeroRisks)]),
    evidenceRefs,
    sourceEvidenceIds,
    sourceOwners,
    freshness: boundary.freshness || (metrics && metrics.freshness) || (historical && historical.freshness) || null,
    assumptions: localAssumptions,
    confidenceLimitations: unique([...localLimitations, ...asArray(boundary.confidenceLimitations)]),
    warnings,
    managerReviewRequired: boundary.managerReviewRequired === true,
    humanReviewRequired: boundary.humanReviewRequired === true,
    allowedUses: unique(boundary.allowedUses),
    blockedUses: unique(boundary.blockedUses),
    ...truthAndWriteFlags()
  };
}

module.exports = {
  calculateManagerRecruitmentForecast,
  MANAGER_RECRUITMENT_FORECAST_STATUSES,
  MANAGER_RECRUITMENT_FORECAST_DECISIONS
};
