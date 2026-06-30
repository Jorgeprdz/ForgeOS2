const {
  buildManagerForecastBoundary
} = require("./manager-forecast-boundary-contract");

const MANAGER_ADVISOR_FORECAST_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MANAGER_ADVISOR_FORECAST_DECISIONS = Object.freeze({
  BUILD_ADVISOR_FORECAST_CONTEXT: "BUILD_ADVISOR_FORECAST_CONTEXT",
  USE_PROTECTED_ADVISOR_HISTORY: "USE_PROTECTED_ADVISOR_HISTORY",
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
    createsSchemaWrite: false
  };
}
function metricPayload(entry) { return entry && (entry.advisorMetrics || entry.metrics || entry); }
function latestMetric(series, path) {
  const known = asArray(series).map((entry) => valueAtPath(metricPayload(entry), path)).filter((value) => typeof value === "number");
  return known.length > 0 ? known[known.length - 1] : null;
}
function firstKnown(...values) {
  const known = values.find((value) => typeof value === "number" || present(value));
  return known === null || known === undefined ? "UNKNOWN" : known;
}
function sumKnown(...values) {
  const numeric = values.filter((value) => typeof value === "number");
  return numeric.length > 0 ? numeric.reduce((sum, value) => sum + value, 0) : "UNKNOWN";
}
function trendValue(context, path) {
  const points = valueAtPath(context, `${path}.points`);
  if (Array.isArray(points)) {
    const known = points.filter((point) => typeof point.value === "number");
    return known.length > 0 ? known[known.length - 1].value : null;
  }
  const value = valueAtPath(context, path);
  return typeof value === "number" ? value : null;
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
  return MANAGER_ADVISOR_FORECAST_STATUSES[boundary.forecastBoundaryStatus] || MANAGER_ADVISOR_FORECAST_STATUSES.UNKNOWN;
}

function calculateManagerAdvisorForecast({
  advisorMetricsContext = null,
  advisorHistoricalContext = null,
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
  const metrics = clone(advisorMetricsContext);
  const historical = clone(advisorHistoricalContext);
  const series = asArray(metrics && metrics.advisorMetricsSeries);
  const latest = isObject(metrics && metrics.advisorMetrics) ? metrics.advisorMetrics : metricPayload(series[series.length - 1] || {});
  const historicalAnalytics = historical && (historical.advisorHistoricalAnalytics || historical);
  const baseContext = {
    advisorActivityForecastContext: firstKnown(latestMetric(series, "activitySignalCount"), latest.activitySignalCount, trendValue(historicalAnalytics, "activityTrendContext")),
    followupForecastContext: firstKnown(latestMetric(series, "followupSignalCount"), latest.followupSignalCount, trendValue(historicalAnalytics, "followupTrendContext")),
    prospectingForecastContext: firstKnown(latestMetric(series, "prospectingSignalCount"), latest.prospectingSignalCount, trendValue(historicalAnalytics, "prospectingTrendContext")),
    referralForecastContext: firstKnown(latestMetric(series, "referralSignalCount"), latest.referralSignalCount, trendValue(historicalAnalytics, "referralTrendContext")),
    appointmentForecastContext: firstKnown(valueAtPath(latest, "appointmentContext.count"), trendValue(historicalAnalytics, "appointmentTrendContext")),
    pipelineForecastContext: firstKnown(valueAtPath(latest, "pipelineContext.count"), trendValue(historicalAnalytics, "pipelineTrendContext")),
    productionContextForecast: firstKnown(valueAtPath(latest, "productionContext.count"), trendValue(historicalAnalytics, "productionContextTrend")),
    qualificationContextForecast: firstKnown(valueAtPath(latest, "qualificationContext.count"), trendValue(historicalAnalytics, "qualificationContextTrend")),
    supportCoachingNeedForecastContext: sumKnown(valueAtPath(latest, "supportNeedsContext.count"), valueAtPath(latest, "coachingNeedsContext.count")),
    referenceOnly: true,
    createsTruth: false
  };
  const localAssumptions = unique([
    ...asArray(assumptions),
    ...asArray(metrics && metrics.assumptions),
    ...asArray(historical && historical.assumptions),
    "Advisor forecast projects protected advisor metrics and historical context only."
  ]);
  const localLimitations = unique([
    ...asArray(confidenceLimitations),
    ...asArray(metrics && metrics.confidenceLimitations),
    ...asArray(historical && historical.confidenceLimitations),
    "Forecast is scenario context, not revenue, promotion, lifecycle or punishment truth."
  ]);
  const boundary = buildManagerForecastBoundary({
    forecastContext: { advisorForecastContext: baseContext, assumptions: localAssumptions, confidenceLimitations: localLimitations },
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
    "Missing activity does not become zero activity.",
    "Missing pipeline does not become low pipeline.",
    "Production forecast does not create revenue truth.",
    "Qualification forecast does not create promotion or Advisor Lifecycle truth.",
    "Support and coaching forecast does not create punishment truth.",
    "Forecast risk does not create termination truth."
  ]);
  const project = (multiplier) => Object.fromEntries(Object.entries(baseContext).map(([key, value]) => [key, typeof value === "number" ? scenarioValue(value, multiplier) : value]));
  const scenarios = {
    conservativeScenario: buildScenario({ scenarioName: "CONSERVATIVE", multiplier: 0.8, projectedContext: project(0.8), assumptions: localAssumptions, confidenceLimitations: localLimitations, warnings, evidenceRefs, sourceEvidenceIds, sourceOwners, freshness: boundary.freshness }),
    baselineScenario: buildScenario({ scenarioName: "BASELINE", multiplier: 1, projectedContext: baseContext, assumptions: localAssumptions, confidenceLimitations: localLimitations, warnings, evidenceRefs, sourceEvidenceIds, sourceOwners, freshness: boundary.freshness }),
    stretchScenario: buildScenario({ scenarioName: "STRETCH", multiplier: 1.2, projectedContext: project(1.2), assumptions: localAssumptions, confidenceLimitations: localLimitations, warnings, evidenceRefs, sourceEvidenceIds, sourceOwners, freshness: boundary.freshness })
  };

  return {
    forecastStatus: resolveStatus(boundary),
    forecastDecision: boundary.forecastBoundaryDecision,
    periodRange: clone(periodRange || boundary.periodRange),
    generatedAt: generatedAt || boundary.generatedAt || null,
    advisorForecastContext: { ...scenarios, referenceOnly: true, createsTruth: false },
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
  calculateManagerAdvisorForecast,
  MANAGER_ADVISOR_FORECAST_STATUSES,
  MANAGER_ADVISOR_FORECAST_DECISIONS
};
