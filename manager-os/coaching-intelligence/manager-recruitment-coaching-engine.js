"use strict";

const {
  buildManagerCoachingBoundary
} = require("./manager-coaching-boundary-contract");

const MANAGER_RECRUITMENT_COACHING_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN"
});

const MANAGER_RECRUITMENT_COACHING_DECISIONS = Object.freeze({
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

function buildManagerRecruitmentCoachingContext(input = {}) {
  const safeInput = clone(input) || {};
  const metrics = safeInput.recruitmentMetricsContext || {};
  const dashboard = safeInput.recruitmentDashboardContext || {};
  const forecast = safeInput.recruitmentForecastContext || {};
  const historical = safeInput.recruitmentHistoricalContext || {};

  const boundary = buildManagerCoachingBoundary({
    requestedUse: safeInput.requestedUse || "COACHING_CONTEXT",
    sourceEvidence: safeInput.sourceEvidence,
    periodRange: safeInput.periodRange,
    coachingContext: { coachingFamily: "RECRUITMENT_COACHING_CONTEXT" },
    dashboardContext: dashboard,
    metricsContext: metrics,
    forecastContext: forecast,
    historicalContext: historical,
    storageContext: safeInput.historicalStorageBoundaryContext,
    queryPlanContext: safeInput.historicalQueryPlanContext
  });

  const topics = {
    candidateFollowUpConversationTopic: topic(
      "CANDIDATE_FOLLOW_UP_CONVERSATION",
      "candidate follow-up conversation context",
      metrics.candidatePipelineContext || dashboard.candidatePipelineContext || forecast.pipelineForecastContext
    ),
    interviewNoShowReviewTopic: topic(
      "INTERVIEW_NO_SHOW_REVIEW",
      "interview no-show review context",
      metrics.interviewNoShowContext || historical.interviewNoShowTrendContext || dashboard.interviewCompletionContext
    ),
    precontractReadinessConversationTopic: topic(
      "PRECONTRACT_READINESS_CONVERSATION",
      "precontract readiness conversation context",
      metrics.precontractReadinessContext || dashboard.precontractReadinessReviewContext || forecast.precontractReadinessForecastContext,
      ["Conversation context only; not precontract truth."]
    ),
    stalledCandidateReviewTopic: topic(
      "STALLED_CANDIDATE_REVIEW",
      "stalled candidate review context",
      metrics.stalledCandidateContext || historical.stalledCandidateTrendContext || forecast.stalledCandidateForecastContext
    ),
    withdrawnBlockedReentryConversationTopic: topic(
      "WITHDRAWN_BLOCKED_REENTRY_CONVERSATION",
      "withdrawn blocked reentry conversation context",
      metrics.withdrawnBlockedReentryContext || historical.exceptionTrendContext || forecast.reactivationReentryForecastContext,
      ["Blocked/reentry context is not punishment or hiring truth."]
    ),
    referralAskCoachingTopic: topic(
      "REFERRAL_ASK_COACHING",
      "referral ask coaching context",
      metrics.referralAskContext || dashboard.referralAskContext || forecast.referralAskForecastContext
    ),
    recruitmentPipelineNextConversationAreas: topic(
      "RECRUITMENT_PIPELINE_NEXT_CONVERSATION_AREAS",
      "recruitment pipeline next conversation areas",
      metrics.funnelContext || dashboard.recruitmentFunnelContext || forecast.conversionForecastContext,
      ["Next conversation area is not automatic hiring decision."]
    )
  };

  const blocked = boundary.blockedUses.length > 0;
  const needsReview = boundary.humanReviewRequired;

  return {
    recruitmentCoachingStatus: blocked
      ? MANAGER_RECRUITMENT_COACHING_STATUSES.BLOCKED
      : needsReview
        ? MANAGER_RECRUITMENT_COACHING_STATUSES.NEEDS_HUMAN_REVIEW
        : MANAGER_RECRUITMENT_COACHING_STATUSES.READY_FOR_MANAGER_REVIEW,
    recruitmentCoachingDecision: blocked
      ? MANAGER_RECRUITMENT_COACHING_DECISIONS.BLOCK_FORBIDDEN_USE
      : needsReview
        ? MANAGER_RECRUITMENT_COACHING_DECISIONS.REQUIRE_REVIEW
        : MANAGER_RECRUITMENT_COACHING_DECISIONS.PRESENT_CONVERSATION_CONTEXT,
    contextOnly: true,
    topics,
    boundary,
    warnings: uniq([...boundary.warnings, "Recruitment coaching is conversation context only."]),
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
  buildManagerRecruitmentCoachingContext,
  MANAGER_RECRUITMENT_COACHING_STATUSES,
  MANAGER_RECRUITMENT_COACHING_DECISIONS
};
