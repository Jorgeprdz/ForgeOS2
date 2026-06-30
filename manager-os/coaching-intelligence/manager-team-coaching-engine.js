"use strict";

const {
  buildManagerCoachingBoundary
} = require("./manager-coaching-boundary-contract");

const MANAGER_TEAM_COACHING_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN"
});

const MANAGER_TEAM_COACHING_DECISIONS = Object.freeze({
  PRESENT_CONVERSATION_CONTEXT: "PRESENT_CONVERSATION_CONTEXT",
  REQUIRE_REVIEW: "REQUIRE_REVIEW",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE"
});

const FALSE_FLAGS = Object.freeze({
  automaticDecisionAllowed: false,
  createsHumanRankingTruth: false,
  createsPerformanceLeaderboardTruth: false,
  createsPromotionDecisionTruth: false,
  createsPunishmentTruth: false,
  createsTerminationTruth: false,
  createsDisciplinaryActionTruth: false,
  createsHrDecisionTruth: false,
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
  createsUiRendering: false,
  createsAutomatedManagerMessage: false,
  createsAutomatedAdvisorMessage: false
});

function clone(value) {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}

function arrayOf(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function uniq(values) {
  return [...new Set(arrayOf(values).filter(Boolean))];
}

function topic(topicKey, title, context, warnings = []) {
  return {
    topicKey,
    title,
    contextOnly: true,
    topicStatus: context === undefined || context === null ? "UNKNOWN" : "READY_FOR_MANAGER_REVIEW",
    conversationContext: context === undefined ? null : context,
    suggestedConversationTopics: context === undefined || context === null ? [] : [`Review ${title}`],
    warnings: uniq(warnings),
    coachingPromptCreatesAutomaticDecision: false,
    coachingRecommendationCreatesPunishmentTruth: false,
    coachingRecommendationCreatesPromotionTruth: false,
    coachingRecommendationCreatesTerminationTruth: false,
    coachingRecommendationCreatesRevenueTruth: false,
    coachingRecommendationCreatesPrecontractTruth: false,
    coachingRecommendationCreatesHiringTruth: false,
    coachingRecommendationCreatesLifecycleTruth: false,
    createsAutomatedManagerMessage: false,
    createsAutomatedAdvisorMessage: false,
    automaticDecisionAllowed: false
  };
}

function buildManagerTeamCoachingContext(input = {}) {
  const safeInput = clone(input) || {};
  const metrics = safeInput.teamMetricsContext || {};
  const dashboard = safeInput.teamDashboardContext || {};
  const forecast = safeInput.teamForecastContext || {};
  const historical = safeInput.teamHistoricalContext || {};

  const boundary = buildManagerCoachingBoundary({
    requestedUse: safeInput.requestedUse || "COACHING_CONTEXT",
    sourceEvidence: safeInput.sourceEvidence,
    periodRange: safeInput.periodRange,
    coachingContext: { coachingFamily: "TEAM_COACHING_CONTEXT" },
    dashboardContext: dashboard,
    metricsContext: metrics,
    forecastContext: forecast,
    historicalContext: historical,
    storageContext: safeInput.historicalStorageBoundaryContext,
    queryPlanContext: safeInput.historicalQueryPlanContext
  });

  const topics = {
    teamPatternConversationTopic: topic(
      "TEAM_PATTERN_CONVERSATION",
      "team pattern conversation context",
      metrics.teamPatternContext || dashboard.teamPatternContext || forecast.teamPatternForecastContext,
      ["Team pattern context is not ranking truth."]
    ),
    teamCapacitySupportTopic: topic(
      "TEAM_CAPACITY_SUPPORT",
      "team capacity support context",
      metrics.teamCapacityContext || dashboard.teamCapacityContext || forecast.teamCapacityForecastContext,
      ["Team capacity support is not HR truth."]
    ),
    teamActivityRhythmTopic: topic(
      "TEAM_ACTIVITY_RHYTHM",
      "team activity rhythm context",
      metrics.teamActivityContext || historical.teamActivityTrendContext || forecast.teamActivityForecastContext
    ),
    teamForecastReviewTopic: topic(
      "TEAM_FORECAST_REVIEW",
      "team forecast review context",
      forecast.teamForecastContext || dashboard.teamForecastContext || forecast.baselineScenario,
      ["Team forecast review is not promotion, punishment or termination truth."]
    ),
    teamEvidenceQualityTopic: topic(
      "TEAM_EVIDENCE_QUALITY",
      "team evidence quality context",
      metrics.evidenceQualityContext || dashboard.evidenceQualityContext || historical.evidenceQualityContext
    )
  };

  const blocked = boundary.blockedUses.length > 0;
  const needsReview = boundary.humanReviewRequired;

  return {
    teamCoachingStatus: blocked
      ? MANAGER_TEAM_COACHING_STATUSES.BLOCKED
      : needsReview
        ? MANAGER_TEAM_COACHING_STATUSES.NEEDS_HUMAN_REVIEW
        : MANAGER_TEAM_COACHING_STATUSES.READY_FOR_MANAGER_REVIEW,
    teamCoachingDecision: blocked
      ? MANAGER_TEAM_COACHING_DECISIONS.BLOCK_FORBIDDEN_USE
      : needsReview
        ? MANAGER_TEAM_COACHING_DECISIONS.REQUIRE_REVIEW
        : MANAGER_TEAM_COACHING_DECISIONS.PRESENT_CONVERSATION_CONTEXT,
    contextOnly: true,
    topics,
    boundary,
    warnings: uniq([...boundary.warnings, "Team coaching is conversation context only."]),
    assumptions: boundary.assumptions,
    confidenceLimitations: boundary.confidenceLimitations,
    evidenceRefs: boundary.evidenceRefs,
    sourceEvidenceIds: boundary.sourceEvidenceIds,
    sourceOwners: boundary.sourceOwners,
    freshness: boundary.freshness,
    ...FALSE_FLAGS
  };
}

module.exports = {
  buildManagerTeamCoachingContext,
  MANAGER_TEAM_COACHING_STATUSES,
  MANAGER_TEAM_COACHING_DECISIONS
};
