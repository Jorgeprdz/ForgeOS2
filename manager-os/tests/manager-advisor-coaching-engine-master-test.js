"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  buildManagerAdvisorCoachingContext
} = require("../coaching-intelligence/manager-advisor-coaching-engine");

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
    "createsAdvisorLifecycleTruth",
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

console.log("\nFORGE MANAGER ADVISOR COACHING ENGINE MASTER TEST v1.0\n");

test("Follow-up consistency coaching is conversation context only", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: { followupContext: { followups: 5 } },
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert.strictEqual(result.topics.followUpConsistencyConversationTopic.contextOnly, true);
});

test("Prospecting referral coaching is context only", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: { prospectingReferralContext: { referrals: 2 } },
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert.strictEqual(result.topics.prospectingReferralConversationTopic.contextOnly, true);
});

test("Appointment rhythm coaching is context only", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: { appointmentContext: { appointments: 3 } },
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert.strictEqual(result.topics.appointmentRhythmReviewTopic.contextOnly, true);
});

test("Pipeline review is context only", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: { pipelineContext: { pipeline: 9 } },
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert.strictEqual(result.topics.pipelineReviewTopic.contextOnly, true);
});

test("Production coaching does not create revenue truth", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: { productionContext: { production: 100 } },
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert.strictEqual(result.topics.productionCoachingTopic.coachingRecommendationCreatesRevenueTruth, false);
  assert.strictEqual(result.createsRevenueTruth, false);
});

test("Qualification coaching does not create promotion or lifecycle truth", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: { qualificationContext: { qualification: "context" } },
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert.strictEqual(result.topics.qualificationCoachingTopic.coachingRecommendationCreatesPromotionTruth, false);
  assert.strictEqual(result.topics.qualificationCoachingTopic.coachingRecommendationCreatesLifecycleTruth, false);
  assert.strictEqual(result.createsAdvisorLifecycleTruth, false);
});

test("Support coaching need does not create punishment truth", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: { supportCoachingContext: { needsSupport: true } },
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert.strictEqual(result.topics.supportCoachingNeedTopic.coachingRecommendationCreatesPunishmentTruth, false);
});

test("Activity gap does not create termination truth", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: { activityContext: { gap: true } },
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert.strictEqual(result.topics.activityGapConversationTopic.coachingRecommendationCreatesTerminationTruth, false);
  assert.strictEqual(result.createsTerminationTruth, false);
});

test("Missing activity does not become zero activity", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: {},
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert.strictEqual(result.topics.activityGapConversationTopic.topicStatus, "UNKNOWN");
});

test("Stale evidence propagates", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: { evidenceRefs: ["E1"], sourceEvidenceIds: ["S1"], sourceOwners: ["MANAGER_OS"], freshness: { status: "STALE" } },
    advisorMetricsContext: {},
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assert(result.boundary.staleSignals.includes("STALE_FRESHNESS"));
});

test("Forbidden uses are blocked", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: {},
    advisorDashboardContext: {},
    advisorForecastContext: {},
    requestedUse: "PUNISHMENT"
  });
  assert.strictEqual(result.advisorCoachingDecision, "BLOCK_FORBIDDEN_USE");
});

test("Allowed uses are allowed", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: {},
    advisorDashboardContext: {},
    advisorForecastContext: {},
    requestedUse: "COACHING_CONTEXT"
  });
  assert(result.boundary.allowedUses.includes("COACHING_CONTEXT"));
});

test("Inputs are not mutated", () => {
  const input = { sourceEvidence: evidence, advisorMetricsContext: {}, advisorDashboardContext: {}, advisorForecastContext: {} };
  const before = JSON.stringify(input);
  buildManagerAdvisorCoachingContext(input);
  assert.strictEqual(JSON.stringify(input), before);
});

test("No direct Advisor OS import", () => {
  const source = fs.readFileSync(path.join(__dirname, "../coaching-intelligence/manager-advisor-coaching-engine.js"), "utf8");
  assert(!/require\(["'][^"']*advisor-os/i.test(source));
});

test("No legacy Manager OS coaching/dashboard/momentum/report import", () => {
  const source = fs.readFileSync(path.join(__dirname, "../coaching-intelligence/manager-advisor-coaching-engine.js"), "utf8");
  assert(!/require\(["'][^"']*manager-os\/(coaching|dashboard|momentum|report)/i.test(source));
});

test("All truth write and automated message flags remain false", () => {
  const result = buildManagerAdvisorCoachingContext({
    sourceEvidence: evidence,
    advisorMetricsContext: {},
    advisorDashboardContext: {},
    advisorForecastContext: {}
  });
  assertFalseFlags(result);
});

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${total - fail}`);
console.log(`Fail: ${fail}`);
if (fail > 0) process.exit(1);
