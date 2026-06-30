"use strict";

const {
  buildManagerCoachingBoundary
} = require("./manager-coaching-boundary-contract");

const {
  buildManagerRecruitmentCoachingContext
} = require("./manager-recruitment-coaching-engine");

const {
  buildManagerAdvisorCoachingContext
} = require("./manager-advisor-coaching-engine");

const {
  buildManagerTeamCoachingContext
} = require("./manager-team-coaching-engine");

const MANAGER_COACHING_INTELLIGENCE_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN"
});

const MANAGER_COACHING_INTELLIGENCE_DECISIONS = Object.freeze({
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

function buildManagerCoachingIntelligence(input = {}) {
  const safeInput = clone(input) || {};

  const boundary = buildManagerCoachingBoundary({
    requestedUse: safeInput.requestedUse || "COACHING_CONTEXT",
    sourceEvidence: safeInput.sourceEvidence,
    periodRange: safeInput.periodRange,
    coachingContext: { coachingFamily: "MANAGER_COACHING_INTELLIGENCE" },
    dashboardContext: safeInput.dashboardIntelligenceContext,
    metricsContext: safeInput.managerMetricsContext,
    historicalContext: safeInput.historicalAnalyticsContext,
    forecastContext: safeInput.forecastIntelligenceContext,
    storageContext: safeInput.historicalStorageBoundaryContext || safeInput.historicalRollupContext,
    queryPlanContext: safeInput.historicalQueryPlanContext
  });

  const recruitmentCoaching = buildManagerRecruitmentCoachingContext({
    requestedUse: safeInput.requestedUse || "COACHING_CONTEXT",
    sourceEvidence: safeInput.sourceEvidence,
    periodRange: safeInput.periodRange,
    recruitmentMetricsContext: safeInput.recruitmentMetricsContext,
    recruitmentHistoricalContext: safeInput.recruitmentHistoricalContext,
    recruitmentForecastContext: safeInput.recruitmentForecastContext,
    recruitmentDashboardContext: safeInput.recruitmentDashboardContext || (safeInput.dashboardIntelligenceContext && safeInput.dashboardIntelligenceContext.recruitmentDashboard),
    historicalStorageBoundaryContext: safeInput.historicalStorageBoundaryContext,
    historicalQueryPlanContext: safeInput.historicalQueryPlanContext
  });

  const advisorCoaching = buildManagerAdvisorCoachingContext({
    requestedUse: safeInput.requestedUse || "COACHING_CONTEXT",
    sourceEvidence: safeInput.sourceEvidence,
    periodRange: safeInput.periodRange,
    advisorMetricsContext: safeInput.advisorMetricsContext,
    advisorHistoricalContext: safeInput.advisorHistoricalContext,
    advisorForecastContext: safeInput.advisorForecastContext,
    advisorDashboardContext: safeInput.advisorDashboardContext || (safeInput.dashboardIntelligenceContext && safeInput.dashboardIntelligenceContext.advisorDashboard),
    historicalStorageBoundaryContext: safeInput.historicalStorageBoundaryContext,
    historicalQueryPlanContext: safeInput.historicalQueryPlanContext
  });

  const teamCoaching = buildManagerTeamCoachingContext({
    requestedUse: safeInput.requestedUse || "COACHING_CONTEXT",
    sourceEvidence: safeInput.sourceEvidence,
    periodRange: safeInput.periodRange,
    teamMetricsContext: safeInput.teamMetricsContext,
    teamHistoricalContext: safeInput.teamHistoricalContext,
    teamForecastContext: safeInput.teamForecastContext,
    teamDashboardContext: safeInput.teamDashboardContext || (safeInput.dashboardIntelligenceContext && safeInput.dashboardIntelligenceContext.teamDashboard),
    historicalStorageBoundaryContext: safeInput.historicalStorageBoundaryContext,
    historicalQueryPlanContext: safeInput.historicalQueryPlanContext
  });

  const warnings = uniq([
    ...boundary.warnings,
    ...recruitmentCoaching.warnings,
    ...advisorCoaching.warnings,
    ...teamCoaching.warnings
  ]);

  const assumptions = uniq([
    ...boundary.assumptions,
    ...recruitmentCoaching.assumptions,
    ...advisorCoaching.assumptions,
    ...teamCoaching.assumptions
  ]);

  const confidenceLimitations = uniq([
    ...boundary.confidenceLimitations,
    ...recruitmentCoaching.confidenceLimitations,
    ...advisorCoaching.confidenceLimitations,
    ...teamCoaching.confidenceLimitations
  ]);

  const blocked = boundary.blockedUses.length > 0;
  const needsReview =
    boundary.humanReviewRequired ||
    recruitmentCoaching.recruitmentCoachingStatus === "NEEDS_HUMAN_REVIEW" ||
    advisorCoaching.advisorCoachingStatus === "NEEDS_HUMAN_REVIEW" ||
    teamCoaching.teamCoachingStatus === "NEEDS_HUMAN_REVIEW";

  const coachingIntelligenceStatus = blocked
    ? MANAGER_COACHING_INTELLIGENCE_STATUSES.BLOCKED
    : needsReview
      ? MANAGER_COACHING_INTELLIGENCE_STATUSES.NEEDS_HUMAN_REVIEW
      : MANAGER_COACHING_INTELLIGENCE_STATUSES.READY_FOR_MANAGER_REVIEW;

  return {
    coachingIntelligenceStatus,
    coachingIntelligenceDecision: blocked
      ? MANAGER_COACHING_INTELLIGENCE_DECISIONS.BLOCK_FORBIDDEN_USE
      : needsReview
        ? MANAGER_COACHING_INTELLIGENCE_DECISIONS.REQUIRE_REVIEW
        : MANAGER_COACHING_INTELLIGENCE_DECISIONS.PRESENT_CONVERSATION_CONTEXT,
    contextOnly: true,
    boundary,
    recruitmentCoaching,
    advisorCoaching,
    teamCoaching,
    executiveCoachingSummary: {
      contextOnly: true,
      summaryType: "MANAGER_COACHING_REVIEW_SUMMARY",
      reviewAreas: [
        "Recruitment conversation review",
        "Advisor conversation review",
        "Team coaching rhythm review",
        "Forecast and dashboard context review",
        "Evidence quality review"
      ],
      suggestedConversationTopics: [
        "What evidence needs manager review?",
        "What conversation would improve execution clarity?",
        "What support is needed without creating punishment truth?"
      ],
      recommendationsAreAutomaticDecisions: false,
      sendsAutomatedMessages: false,
      automaticDecisionAllowed: false,
      ...FALSE_FLAGS
    },
    warnings,
    assumptions,
    confidenceLimitations,
    evidenceRefs: uniq([
      ...boundary.evidenceRefs,
      ...recruitmentCoaching.evidenceRefs,
      ...advisorCoaching.evidenceRefs,
      ...teamCoaching.evidenceRefs
    ]),
    sourceEvidenceIds: uniq([
      ...boundary.sourceEvidenceIds,
      ...recruitmentCoaching.sourceEvidenceIds,
      ...advisorCoaching.sourceEvidenceIds,
      ...teamCoaching.sourceEvidenceIds
    ]),
    sourceOwners: uniq([
      ...boundary.sourceOwners,
      ...recruitmentCoaching.sourceOwners,
      ...advisorCoaching.sourceOwners,
      ...teamCoaching.sourceOwners
    ]),
    freshness: boundary.freshness,
    ...FALSE_FLAGS
  };
}

module.exports = {
  buildManagerCoachingIntelligence,
  MANAGER_COACHING_INTELLIGENCE_STATUSES,
  MANAGER_COACHING_INTELLIGENCE_DECISIONS
};
