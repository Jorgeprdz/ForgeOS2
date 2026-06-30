"use strict";

const assert = require("assert");
const {
  buildManagerRecruitmentCoachingContext
} = require("../coaching-intelligence/manager-recruitment-coaching-engine");

let total = 0;
let fail = 0;

function test(name, fn) {
  total += 1;
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    fail += 1;
    console.error(`FAIL ${name}`);
    console.error(error.stack || error.message);
  }
}

function assertFalseFlags(result) {
  [
    "automaticDecisionAllowed",
    "createsPunishmentTruth",
    "createsPromotionDecisionTruth",
    "createsTerminationTruth",
    "createsDisciplinaryActionTruth",
    "createsHrDecisionTruth",
    "createsPrecontractTruth",
    "createsHiringTruth",
    "createsRevenueTruth",
    "createsCompensationTruth",
    "createsPayoutTruth",
    "createsDatabaseWrite",
    "createsFilesystemWrite",
    "createsCacheWrite",
    "createsMigrationWrite",
    "createsSchemaWrite",
    "createsUiRendering",
    "createsAutomatedManagerMessage",
    "createsAutomatedAdvisorMessage"
  ].forEach((flag) => assert.strictEqual(result[flag], false, `${flag} must be false`));
}

const evidence = {
  evidenceRefs: ["E1"],
  sourceEvidenceIds: ["S1"],
  sourceOwners: ["MANAGER_OS"],
  freshness: { status: "FRESH" }
};

console.log("\nFORGE MANAGER RECRUITMENT COACHING ENGINE MASTER TEST v1.0\n");

test("Builds candidate follow-up conversation context only", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: { candidatePipelineContext: { candidates: 4 } },
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {}
  });
  assert.strictEqual(result.topics.candidateFollowUpConversationTopic.contextOnly, true);
});

test("Interview no-show review context is not punishment truth", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: { interviewNoShowContext: { noShows: 1 } },
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {}
  });
  assert.strictEqual(result.topics.interviewNoShowReviewTopic.coachingRecommendationCreatesPunishmentTruth, false);
});

test("Precontract readiness conversation does not create precontract truth", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: { precontractReadinessContext: { readyForReview: 1 } },
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {}
  });
  assert.strictEqual(result.topics.precontractReadinessConversationTopic.coachingRecommendationCreatesPrecontractTruth, false);
  assert.strictEqual(result.createsPrecontractTruth, false);
});

test("Stalled candidate review is conversation context only", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: { stalledCandidateContext: { stalled: 2 } },
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {}
  });
  assert.strictEqual(result.topics.stalledCandidateReviewTopic.contextOnly, true);
});

test("Withdrawn blocked reentry context does not create punishment or hiring truth", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: { withdrawnBlockedReentryContext: { reentry: 1 } },
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {}
  });
  assert.strictEqual(result.topics.withdrawnBlockedReentryConversationTopic.coachingRecommendationCreatesPunishmentTruth, false);
  assert.strictEqual(result.createsHiringTruth, false);
});

test("Referral ask coaching is context only", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: { referralAskContext: { asks: 3 } },
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {}
  });
  assert.strictEqual(result.topics.referralAskCoachingTopic.contextOnly, true);
});

test("Pipeline next conversation areas are not automatic hiring decisions", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: { funnelContext: { names: 10 } },
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {}
  });
  assert.strictEqual(result.topics.recruitmentPipelineNextConversationAreas.automaticDecisionAllowed, false);
});

test("Missing historical context does not become zero", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: {},
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {}
  });
  assert.strictEqual(result.topics.interviewNoShowReviewTopic.topicStatus, "UNKNOWN");
});

test("Missing rollups propagate review context", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: {},
    recruitmentDashboardContext: { missingRollups: ["2026-06"] },
    recruitmentForecastContext: {}
  });
  assert(result.boundary.missingRollups.includes("2026-06"));
});

test("Forbidden uses are blocked", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: {},
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {},
    requestedUse: "HIRING_TRUTH"
  });
  assert.strictEqual(result.recruitmentCoachingDecision, "BLOCK_FORBIDDEN_USE");
});

test("Allowed uses are allowed", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: {},
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {},
    requestedUse: "COACHING_CONTEXT"
  });
  assert(result.boundary.allowedUses.includes("COACHING_CONTEXT"));
});

test("Inputs are not mutated", () => {
  const input = { sourceEvidence: evidence, recruitmentMetricsContext: {}, recruitmentDashboardContext: {}, recruitmentForecastContext: {} };
  const before = JSON.stringify(input);
  buildManagerRecruitmentCoachingContext(input);
  assert.strictEqual(JSON.stringify(input), before);
});

test("All truth write and automated message flags remain false", () => {
  const result = buildManagerRecruitmentCoachingContext({
    sourceEvidence: evidence,
    recruitmentMetricsContext: {},
    recruitmentDashboardContext: {},
    recruitmentForecastContext: {}
  });
  assertFalseFlags(result);
});

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${total - fail}`);
console.log(`Fail: ${fail}`);
if (fail > 0) process.exit(1);
