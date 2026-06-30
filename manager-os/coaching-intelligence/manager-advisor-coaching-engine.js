"use strict";

const {
  buildManagerCoachingBoundary
} = require("./manager-coaching-boundary-contract");

const MANAGER_ADVISOR_COACHING_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN"
});

const MANAGER_ADVISOR_COACHING_DECISIONS = Object.freeze({
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

function buildManagerAdvisorCoachingContext(input = {}) {
  const safeInput = clone(input) || {};
  const metrics = safeInput.advisorMetricsContext || {};
  const dashboard = safeInput.advisorDashboardContext || {};
  const forecast = safeInput.advisorForecastContext || {};
  const historical = safeInput.advisorHistoricalContext || {};

  const boundary = buildManagerCoachingBoundary({
    requestedUse: safeInput.requestedUse || "COACHING_CONTEXT",
    sourceEvidence: safeInput.sourceEvidence,
    periodRange: safeInput.periodRange,
    coachingContext: { coachingFamily: "ADVISOR_COACHING_CONTEXT" },
    dashboardContext: dashboard,
    metricsContext: metrics,
    forecastContext: forecast,
    historicalContext: historical,
    storageContext: safeInput.historicalStorageBoundaryContext,
    queryPlanContext: safeInput.historicalQueryPlanContext
  });

  const topics = {
    followUpConsistencyConversationTopic: topic(
      "FOLLOW_UP_CONSISTENCY_CONVERSATION",
      "follow-up consistency conversation context",
      metrics.followupContext || metrics.followupProspectingReferralContext || dashboard.followupProspectingReferralContext || forecast.followupForecastContext
    ),
    prospectingReferralConversationTopic: topic(
      "PROSPECTING_REFERRAL_CONVERSATION",
      "prospecting/referral conversation context",
      metrics.prospectingReferralContext || dashboard.followupProspectingReferralContext || forecast.prospectingReferralForecastContext
    ),
    appointmentRhythmReviewTopic: topic(
      "APPOINTMENT_RHYTHM_REVIEW",
      "appointment rhythm review context",
      metrics.appointmentContext || dashboard.appointmentContext || forecast.appointmentForecastContext
    ),
    pipelineReviewTopic: topic(
      "PIPELINE_REVIEW",
      "pipeline review context",
      metrics.pipelineContext || dashboard.pipelineContext || forecast.pipelineForecastContext
    ),
    productionCoachingTopic: topic(
      "PRODUCTION_COACHING",
      "production coaching context",
      metrics.productionContext || dashboard.productionContext || forecast.productionForecastContext,
      ["Production coaching is not revenue truth."]
    ),
    qualificationCoachingTopic: topic(
      "QUALIFICATION_COACHING",
      "qualification coaching context",
      metrics.qualificationContext || dashboard.qualificationContext || forecast.qualificationForecastContext,
      ["Qualification coaching is not promotion or lifecycle truth."]
    ),
    supportCoachingNeedTopic: topic(
      "SUPPORT_COACHING_NEED",
      "support/coaching need context",
      metrics.supportCoachingContext || dashboard.supportCoachingContext || forecast.supportCoachingForecastContext,
      ["Support/coaching need is not punishment truth."]
    ),
    activityGapConversationTopic: topic(
      "ACTIVITY_GAP_CONVERSATION",
      "activity gap conversation context",
      metrics.activityContext || historical.activityTrendContext || forecast.activityForecastContext,
      ["Activity gap context is not termination truth."]
    )
  };

  const blocked = boundary.blockedUses.length > 0;
  const needsReview = boundary.humanReviewRequired;

  return {
    advisorCoachingStatus: blocked
      ? MANAGER_ADVISOR_COACHING_STATUSES.BLOCKED
      : needsReview
        ? MANAGER_ADVISOR_COACHING_STATUSES.NEEDS_HUMAN_REVIEW
        : MANAGER_ADVISOR_COACHING_STATUSES.READY_FOR_MANAGER_REVIEW,
    advisorCoachingDecision: blocked
      ? MANAGER_ADVISOR_COACHING_DECISIONS.BLOCK_FORBIDDEN_USE
      : needsReview
        ? MANAGER_ADVISOR_COACHING_DECISIONS.REQUIRE_REVIEW
        : MANAGER_ADVISOR_COACHING_DECISIONS.PRESENT_CONVERSATION_CONTEXT,
    contextOnly: true,
    topics,
    boundary,
    warnings: uniq([...boundary.warnings, "Advisor coaching is conversation context only."]),
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
  buildManagerAdvisorCoachingContext,
  MANAGER_ADVISOR_COACHING_STATUSES,
  MANAGER_ADVISOR_COACHING_DECISIONS
};
