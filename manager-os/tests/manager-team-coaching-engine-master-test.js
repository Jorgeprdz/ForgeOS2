"use strict";

const assert = require("assert");
const {
  buildManagerTeamCoachingContext
} = require("../coaching-intelligence/manager-team-coaching-engine");

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
    "createsHumanRankingTruth",
    "createsPerformanceLeaderboardTruth",
    "createsPromotionDecisionTruth",
    "createsPunishmentTruth",
    "createsTerminationTruth",
    "createsDisciplinaryActionTruth",
    "createsHrDecisionTruth",
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

console.log("\nFORGE MANAGER TEAM COACHING ENGINE MASTER TEST v1.0\n");

test("Team pattern coaching is context only", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: { teamPatternContext: { pattern: "context" } },
    teamDashboardContext: {},
    teamForecastContext: {}
  });
  assert.strictEqual(result.topics.teamPatternConversationTopic.contextOnly, true);
});

test("Team capacity support is context only and not HR truth", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: { teamCapacityContext: { capacity: "context" } },
    teamDashboardContext: {},
    teamForecastContext: {}
  });
  assert.strictEqual(result.topics.teamCapacitySupportTopic.contextOnly, true);
  assert.strictEqual(result.createsHrDecisionTruth, false);
});

test("Team activity rhythm coaching is context only", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: { teamActivityContext: { rhythm: "context" } },
    teamDashboardContext: {},
    teamForecastContext: {}
  });
  assert.strictEqual(result.topics.teamActivityRhythmTopic.contextOnly, true);
});

test("Team forecast review is not promotion punishment or termination truth", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: {},
    teamDashboardContext: {},
    teamForecastContext: { baselineScenario: { projectedContext: { activity: 5 } } }
  });
  assert.strictEqual(result.topics.teamForecastReviewTopic.coachingRecommendationCreatesPromotionTruth, false);
  assert.strictEqual(result.topics.teamForecastReviewTopic.coachingRecommendationCreatesPunishmentTruth, false);
  assert.strictEqual(result.topics.teamForecastReviewTopic.coachingRecommendationCreatesTerminationTruth, false);
});

test("Team evidence quality coaching is context only", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: { evidenceQualityContext: { quality: "review" } },
    teamDashboardContext: {},
    teamForecastContext: {}
  });
  assert.strictEqual(result.topics.teamEvidenceQualityTopic.contextOnly, true);
});

test("Team coaching does not create ranking or leaderboard truth", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: { teamPatternContext: { pattern: "context" } },
    teamDashboardContext: {},
    teamForecastContext: {}
  });
  assert.strictEqual(result.createsHumanRankingTruth, false);
  assert.strictEqual(result.createsPerformanceLeaderboardTruth, false);
});

test("Missing team context is UNKNOWN, not zero", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: {},
    teamDashboardContext: {},
    teamForecastContext: {}
  });
  assert.strictEqual(result.topics.teamActivityRhythmTopic.topicStatus, "UNKNOWN");
});

test("Stale evidence propagates", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: { evidenceRefs: ["E1"], sourceEvidenceIds: ["S1"], sourceOwners: ["MANAGER_OS"], freshness: { status: "STALE" } },
    teamMetricsContext: {},
    teamDashboardContext: {},
    teamForecastContext: {}
  });
  assert(result.boundary.staleSignals.includes("STALE_FRESHNESS"));
});

test("Forbidden uses are blocked", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: {},
    teamDashboardContext: {},
    teamForecastContext: {},
    requestedUse: "PERFORMANCE_LEADERBOARD"
  });
  assert.strictEqual(result.teamCoachingDecision, "BLOCK_FORBIDDEN_USE");
});

test("Allowed uses are allowed", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: {},
    teamDashboardContext: {},
    teamForecastContext: {},
    requestedUse: "COACHING_CONTEXT"
  });
  assert(result.boundary.allowedUses.includes("COACHING_CONTEXT"));
});

test("Inputs are not mutated", () => {
  const input = { sourceEvidence: evidence, teamMetricsContext: {}, teamDashboardContext: {}, teamForecastContext: {} };
  const before = JSON.stringify(input);
  buildManagerTeamCoachingContext(input);
  assert.strictEqual(JSON.stringify(input), before);
});

test("All truth write and automated message flags remain false", () => {
  const result = buildManagerTeamCoachingContext({
    sourceEvidence: evidence,
    teamMetricsContext: {},
    teamDashboardContext: {},
    teamForecastContext: {}
  });
  assertFalseFlags(result);
});

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${total - fail}`);
console.log(`Fail: ${fail}`);
if (fail > 0) process.exit(1);
