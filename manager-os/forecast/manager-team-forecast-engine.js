const {
  buildManagerForecastBoundary
} = require("./manager-forecast-boundary-contract");

const MANAGER_TEAM_FORECAST_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MANAGER_TEAM_FORECAST_DECISIONS = Object.freeze({
  BUILD_TEAM_FORECAST_CONTEXT: "BUILD_TEAM_FORECAST_CONTEXT",
  USE_PROTECTED_TEAM_HISTORY: "USE_PROTECTED_TEAM_HISTORY",
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
  return MANAGER_TEAM_FORECAST_STATUSES[boundary.forecastBoundaryStatus] || MANAGER_TEAM_FORECAST_STATUSES.UNKNOWN;
}
function latestValue(series, path) {
  const known = asArray(series).map((entry) => valueAtPath(entry, path)).filter((value) => typeof value === "number");
  return known.length > 0 ? known[known.length - 1] : null;
}
function firstKnown(...values) {
  const known = values.find((value) => typeof value === "number" || present(value));
  return known === null || known === undefined ? "UNKNOWN" : known;
}

function calculateManagerTeamForecast({
  teamMetricsContext = null,
  teamHistoricalContext = null,
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
  const teamMetrics = clone(teamMetricsContext);
  const teamHistorical = clone(teamHistoricalContext);
  const series = asArray(teamMetrics && teamMetrics.teamMetricsSeries);
  const latest = isObject(teamMetrics) ? teamMetrics : {};
  const hasTeamMetrics = present(teamMetrics);
  const baseContext = {
    teamPatternForecastContext: firstKnown(latestValue(series, "teamPatternContext.count"), valueAtPath(latest, "teamPatternContext.count"), valueAtPath(teamHistorical, "teamPatternContext.advisorCount.points.0.value")),
    teamCapacityContext: firstKnown(latestValue(series, "teamCapacityContext.count"), valueAtPath(latest, "teamCapacityContext.count"), valueAtPath(latest, "advisorSnapshotCountContext.value")),
    teamPipelineContext: firstKnown(latestValue(series, "pipelineContext.count"), valueAtPath(latest, "pipelineContext.count")),
    teamActivityTrendContext: firstKnown(latestValue(series, "activitySignalCount"), valueAtPath(latest, "activitySignalCount")),
    teamEvidenceQualityContext: hasTeamMetrics ? firstKnown(asArray(latest.missingEvidence).length + asArray(latest.staleSignals).length + asArray(latest.defaultZeroRisks).length, valueAtPath(latest, "defaultZeroRiskCount")) : "UNKNOWN",
    referenceOnly: true,
    createsTruth: false
  };
  const localAssumptions = unique([
    ...asArray(assumptions),
    ...asArray(teamMetrics && teamMetrics.assumptions),
    ...asArray(teamHistorical && teamHistorical.assumptions),
    "Team forecast projects protected team metrics and historical pattern context only."
  ]);
  const localLimitations = unique([
    ...asArray(confidenceLimitations),
    ...asArray(teamMetrics && teamMetrics.confidenceLimitations),
    ...asArray(teamHistorical && teamHistorical.confidenceLimitations),
    "Team forecast is not ranking, leaderboard, promotion, punishment, termination or HR truth."
  ]);
  const boundary = buildManagerForecastBoundary({
    forecastContext: { teamForecastContext: baseContext, assumptions: localAssumptions, confidenceLimitations: localLimitations },
    historicalContext: teamHistorical,
    storageBoundaryContext: historicalStorageBoundaryContext,
    queryPlanContext: historicalQueryPlanContext,
    sourceEvidence,
    requestedUse,
    periodRange,
    assumptions: localAssumptions,
    confidenceLimitations: localLimitations,
    generatedAt
  });
  const evidenceRefs = unique([...asArray(boundary.evidenceRefs), ...asArray(teamMetrics && teamMetrics.evidenceRefs), ...asArray(teamHistorical && teamHistorical.evidenceRefs), ...asArray(historicalRollupContext && historicalRollupContext.evidenceRefs)]);
  const sourceEvidenceIds = unique([...asArray(boundary.sourceEvidenceIds), ...asArray(teamMetrics && teamMetrics.sourceEvidenceIds), ...asArray(teamHistorical && teamHistorical.sourceEvidenceIds), ...asArray(historicalRollupContext && historicalRollupContext.sourceEvidenceIds)]);
  const sourceOwners = unique([...asArray(boundary.sourceOwners), ...asArray(teamMetrics && teamMetrics.sourceOwners), ...asArray(teamHistorical && teamHistorical.sourceOwners), ...asArray(historicalRollupContext && historicalRollupContext.sourceOwners)]);
  const warnings = unique([
    ...asArray(boundary.warnings),
    "Team forecast does not create ranking truth.",
    "Team forecast does not create performance leaderboard truth.",
    "Team capacity forecast is not HR truth.",
    "Team forecast decline is not punishment or termination truth.",
    "Team forecast improvement is not promotion truth.",
    "Missing team context is UNKNOWN, not zero."
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
    teamForecastContext: { ...scenarios, referenceOnly: true, createsTruth: false },
    boundaryContext: clone(boundary),
    missingEvidence: unique([...asArray(boundary.missingEvidence), ...asArray(teamMetrics && teamMetrics.missingEvidence), ...asArray(teamHistorical && teamHistorical.missingEvidence)]),
    unknownSignals: unique([...asArray(boundary.unknownSignals), ...asArray(teamMetrics && teamMetrics.unknownSignals), ...asArray(teamHistorical && teamHistorical.unknownSignals)]),
    staleSignals: unique([...asArray(boundary.staleSignals), ...asArray(teamMetrics && teamMetrics.staleSignals), ...asArray(teamHistorical && teamHistorical.staleSignals)]),
    defaultZeroRisks: unique([...asArray(boundary.defaultZeroRisks), ...asArray(teamMetrics && teamMetrics.defaultZeroRisks), ...asArray(teamHistorical && teamHistorical.defaultZeroRisks)]),
    evidenceRefs,
    sourceEvidenceIds,
    sourceOwners,
    freshness: boundary.freshness || (teamMetrics && teamMetrics.freshness) || (teamHistorical && teamHistorical.freshness) || null,
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
  calculateManagerTeamForecast,
  MANAGER_TEAM_FORECAST_STATUSES,
  MANAGER_TEAM_FORECAST_DECISIONS
};
