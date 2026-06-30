const {
  buildManagerForecastBoundary
} = require("./manager-forecast-boundary-contract");
const {
  calculateManagerRecruitmentForecast
} = require("./manager-recruitment-forecast-engine");
const {
  calculateManagerAdvisorForecast
} = require("./manager-advisor-forecast-engine");
const {
  calculateManagerTeamForecast
} = require("./manager-team-forecast-engine");

const MANAGER_FORECAST_INTELLIGENCE_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MANAGER_FORECAST_INTELLIGENCE_DECISIONS = Object.freeze({
  BUILD_MANAGER_FORECAST_INTELLIGENCE: "BUILD_MANAGER_FORECAST_INTELLIGENCE",
  USE_RECRUITMENT_FORECAST_CONTEXT: "USE_RECRUITMENT_FORECAST_CONTEXT",
  USE_ADVISOR_FORECAST_CONTEXT: "USE_ADVISOR_FORECAST_CONTEXT",
  USE_TEAM_FORECAST_CONTEXT: "USE_TEAM_FORECAST_CONTEXT",
  USE_FORECAST_BOUNDARY_CONTEXT: "USE_FORECAST_BOUNDARY_CONTEXT",
  REQUIRE_HUMAN_REVIEW: "REQUIRE_HUMAN_REVIEW",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE"
});

function present(value) { return value !== undefined && value !== null && value !== ""; }
function asArray(value) { if (!present(value)) return []; return Array.isArray(value) ? value.filter(present) : [value].filter(present); }
function unique(values) { return [...new Set(values.filter(present))]; }
function clone(value) { if (!present(value)) return value; return JSON.parse(JSON.stringify(value)); }
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
function resolveStatus(boundary, recruitment, advisor, team) {
  const statuses = [boundary.forecastBoundaryStatus, recruitment.forecastStatus, advisor.forecastStatus, team.forecastStatus];
  if (statuses.includes("BLOCKED")) return MANAGER_FORECAST_INTELLIGENCE_STATUSES.BLOCKED;
  if (statuses.includes("NOT_MODELED")) return MANAGER_FORECAST_INTELLIGENCE_STATUSES.NOT_MODELED;
  if (statuses.includes("UNKNOWN")) return MANAGER_FORECAST_INTELLIGENCE_STATUSES.UNKNOWN;
  if (statuses.includes("NEEDS_EVIDENCE")) return MANAGER_FORECAST_INTELLIGENCE_STATUSES.NEEDS_EVIDENCE;
  if (statuses.includes("NEEDS_SOURCE_OWNER")) return MANAGER_FORECAST_INTELLIGENCE_STATUSES.NEEDS_SOURCE_OWNER;
  if (statuses.includes("NEEDS_FRESHNESS")) return MANAGER_FORECAST_INTELLIGENCE_STATUSES.NEEDS_FRESHNESS;
  if (statuses.includes("NEEDS_HUMAN_REVIEW") || recruitment.managerReviewRequired || advisor.managerReviewRequired || team.managerReviewRequired) return MANAGER_FORECAST_INTELLIGENCE_STATUSES.NEEDS_HUMAN_REVIEW;
  return MANAGER_FORECAST_INTELLIGENCE_STATUSES.READY_FOR_MANAGER_REVIEW;
}

function buildManagerForecastIntelligence({
  managerMetricsContext = null,
  recruitmentMetricsContext = null,
  advisorMetricsContext = null,
  historicalAnalyticsContext = null,
  historicalStorageBoundaryContext = null,
  historicalRollupContext = null,
  historicalQueryPlanContext = null,
  recruitmentHistoricalContext = null,
  advisorHistoricalContext = null,
  teamHistoricalContext = null,
  sourceEvidence = {},
  requestedUse = null,
  periodRange = null,
  generatedAt = null,
  assumptions = [],
  confidenceLimitations = []
} = {}) {
  const managerMetrics = clone(managerMetricsContext);
  const historicalAnalytics = clone(historicalAnalyticsContext);
  const recruitment = calculateManagerRecruitmentForecast({
    recruitmentMetricsContext: recruitmentMetricsContext || (managerMetrics && { recruitmentMetrics: managerMetrics.recruitmentMetrics, evidenceRefs: managerMetrics.evidenceRefs, sourceEvidenceIds: managerMetrics.sourceEvidenceIds, sourceOwners: managerMetrics.sourceOwners, freshness: managerMetrics.freshness }),
    recruitmentHistoricalContext: recruitmentHistoricalContext || (historicalAnalytics && { recruitmentHistoricalAnalytics: historicalAnalytics.recruitmentHistoricalAnalytics, evidenceRefs: historicalAnalytics.evidenceRefs, sourceEvidenceIds: historicalAnalytics.sourceEvidenceIds, sourceOwners: historicalAnalytics.sourceOwners, freshness: historicalAnalytics.freshness }),
    historicalStorageBoundaryContext,
    historicalRollupContext,
    historicalQueryPlanContext,
    sourceEvidence,
    requestedUse,
    periodRange,
    generatedAt,
    assumptions,
    confidenceLimitations
  });
  const advisor = calculateManagerAdvisorForecast({
    advisorMetricsContext: advisorMetricsContext || (managerMetrics && { advisorMetrics: managerMetrics.advisorMetrics, evidenceRefs: managerMetrics.evidenceRefs, sourceEvidenceIds: managerMetrics.sourceEvidenceIds, sourceOwners: managerMetrics.sourceOwners, freshness: managerMetrics.freshness }),
    advisorHistoricalContext: advisorHistoricalContext || (historicalAnalytics && { advisorHistoricalAnalytics: historicalAnalytics.advisorHistoricalAnalytics, evidenceRefs: historicalAnalytics.evidenceRefs, sourceEvidenceIds: historicalAnalytics.sourceEvidenceIds, sourceOwners: historicalAnalytics.sourceOwners, freshness: historicalAnalytics.freshness }),
    historicalStorageBoundaryContext,
    historicalRollupContext,
    historicalQueryPlanContext,
    sourceEvidence,
    requestedUse,
    periodRange,
    generatedAt,
    assumptions,
    confidenceLimitations
  });
  const team = calculateManagerTeamForecast({
    teamMetricsContext: managerMetrics && managerMetrics.teamMetricsContext ? managerMetrics.teamMetricsContext : null,
    teamHistoricalContext: teamHistoricalContext || (historicalAnalytics && historicalAnalytics.teamHistoricalContext),
    historicalStorageBoundaryContext,
    historicalRollupContext,
    historicalQueryPlanContext,
    sourceEvidence,
    requestedUse,
    periodRange,
    generatedAt,
    assumptions,
    confidenceLimitations
  });
  const boundary = buildManagerForecastBoundary({
    forecastContext: {
      recruitmentForecastContext: recruitment.recruitmentForecastContext,
      advisorForecastContext: advisor.advisorForecastContext,
      teamForecastContext: team.teamForecastContext,
      assumptions: unique([...asArray(assumptions), ...asArray(recruitment.assumptions), ...asArray(advisor.assumptions), ...asArray(team.assumptions)]),
      confidenceLimitations: unique([...asArray(confidenceLimitations), ...asArray(recruitment.confidenceLimitations), ...asArray(advisor.confidenceLimitations), ...asArray(team.confidenceLimitations)])
    },
    historicalContext: historicalAnalytics,
    storageBoundaryContext: historicalStorageBoundaryContext,
    queryPlanContext: historicalQueryPlanContext,
    sourceEvidence,
    requestedUse,
    periodRange,
    assumptions: unique([...asArray(assumptions), ...asArray(recruitment.assumptions), ...asArray(advisor.assumptions), ...asArray(team.assumptions)]),
    confidenceLimitations: unique([...asArray(confidenceLimitations), ...asArray(recruitment.confidenceLimitations), ...asArray(advisor.confidenceLimitations), ...asArray(team.confidenceLimitations)]),
    generatedAt
  });
  const forecastStatus = resolveStatus(boundary, recruitment, advisor, team);
  const managerReviewRequired = boundary.managerReviewRequired || recruitment.managerReviewRequired || advisor.managerReviewRequired || team.managerReviewRequired;
  const humanReviewRequired = boundary.humanReviewRequired || recruitment.humanReviewRequired || advisor.humanReviewRequired || team.humanReviewRequired;

  return {
    forecastStatus,
    forecastDecision: boundary.forecastBoundaryDecision,
    periodRange: clone(periodRange || boundary.periodRange),
    generatedAt: generatedAt || boundary.generatedAt || null,
    recruitmentForecastContext: clone(recruitment.recruitmentForecastContext),
    advisorForecastContext: clone(advisor.advisorForecastContext),
    teamForecastContext: clone(team.teamForecastContext),
    boundaryContext: clone(boundary),
    missingEvidence: unique([...asArray(boundary.missingEvidence), ...asArray(recruitment.missingEvidence), ...asArray(advisor.missingEvidence), ...asArray(team.missingEvidence)]),
    unknownSignals: unique([...asArray(boundary.unknownSignals), ...asArray(recruitment.unknownSignals), ...asArray(advisor.unknownSignals), ...asArray(team.unknownSignals)]),
    staleSignals: unique([...asArray(boundary.staleSignals), ...asArray(recruitment.staleSignals), ...asArray(advisor.staleSignals), ...asArray(team.staleSignals)]),
    defaultZeroRisks: unique([...asArray(boundary.defaultZeroRisks), ...asArray(recruitment.defaultZeroRisks), ...asArray(advisor.defaultZeroRisks), ...asArray(team.defaultZeroRisks)]),
    evidenceRefs: unique([...asArray(boundary.evidenceRefs), ...asArray(recruitment.evidenceRefs), ...asArray(advisor.evidenceRefs), ...asArray(team.evidenceRefs)]),
    sourceEvidenceIds: unique([...asArray(boundary.sourceEvidenceIds), ...asArray(recruitment.sourceEvidenceIds), ...asArray(advisor.sourceEvidenceIds), ...asArray(team.sourceEvidenceIds)]),
    sourceOwners: unique([...asArray(boundary.sourceOwners), ...asArray(recruitment.sourceOwners), ...asArray(advisor.sourceOwners), ...asArray(team.sourceOwners)]),
    freshness: boundary.freshness || recruitment.freshness || advisor.freshness || team.freshness || null,
    assumptions: unique([...asArray(assumptions), ...asArray(boundary.assumptions), ...asArray(recruitment.assumptions), ...asArray(advisor.assumptions), ...asArray(team.assumptions)]),
    confidenceLimitations: unique([...asArray(confidenceLimitations), ...asArray(boundary.confidenceLimitations), ...asArray(recruitment.confidenceLimitations), ...asArray(advisor.confidenceLimitations), ...asArray(team.confidenceLimitations)]),
    warnings: unique([
      ...asArray(boundary.warnings),
      ...asArray(recruitment.warnings),
      ...asArray(advisor.warnings),
      ...asArray(team.warnings),
      "Manager Forecast Intelligence consumes protected metrics, historical analytics, storage boundary, rollup and query-plan context only."
    ]),
    managerReviewRequired,
    humanReviewRequired,
    allowedUses: unique([...asArray(boundary.allowedUses), ...asArray(recruitment.allowedUses), ...asArray(advisor.allowedUses), ...asArray(team.allowedUses)]),
    blockedUses: unique([...asArray(boundary.blockedUses), ...asArray(recruitment.blockedUses), ...asArray(advisor.blockedUses), ...asArray(team.blockedUses)]),
    ...truthAndWriteFlags()
  };
}

module.exports = {
  buildManagerForecastIntelligence,
  MANAGER_FORECAST_INTELLIGENCE_STATUSES,
  MANAGER_FORECAST_INTELLIGENCE_DECISIONS
};
