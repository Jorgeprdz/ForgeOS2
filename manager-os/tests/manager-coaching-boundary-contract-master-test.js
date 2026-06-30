"use strict";

const assert = require("assert");
const {
  buildManagerCoachingBoundary
} = require("../coaching-intelligence/manager-coaching-boundary-contract");

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

const flags = [
  "automaticDecisionAllowed",
  "createsHumanRankingTruth",
  "createsPerformanceLeaderboardTruth",
  "createsPromotionDecisionTruth",
  "createsPunishmentTruth",
  "createsTerminationTruth",
  "createsDisciplinaryActionTruth",
  "createsHrDecisionTruth",
  "createsAdvisorLifecycleTruth",
  "createsRevenueTruth",
  "createsCompensationTruth",
  "createsRevenue",
  "createsCompensation",
  "createsPayoutTruth",
  "createsPrecontractTruth",
  "createsHiringTruth",
  "createsDatabaseWrite",
  "createsFilesystemWrite",
  "createsCacheWrite",
  "createsMigrationWrite",
  "createsSchemaWrite",
  "createsUiRendering",
  "createsAutomatedManagerMessage",
  "createsAutomatedAdvisorMessage"
];

function assertFalseFlags(result) {
  for (const flag of flags) assert.strictEqual(result[flag], false, `${flag} must be false`);
}

const evidence = {
  evidenceRefs: ["E1", "E1"],
  sourceEvidenceIds: ["S1", "S1"],
  sourceOwners: ["MANAGER_OS", "MANAGER_OS"],
  freshness: { status: "FRESH" }
};

console.log("\nFORGE MANAGER COACHING BOUNDARY CONTRACT MASTER TEST v1.0\n");

test("Missing coaching context becomes UNKNOWN, not zero", () => {
  const result = buildManagerCoachingBoundary({ sourceEvidence: evidence, requestedUse: "COACHING_CONTEXT" });
  assert(result.unknownSignals.includes("MISSING_COACHING_CONTEXT"));
  assert(result.missingData.includes("MISSING_COACHING_CONTEXT"));
});

test("Missing dashboard forecast metric context remains UNKNOWN, not zero", () => {
  const result = buildManagerCoachingBoundary({ sourceEvidence: evidence, coachingContext: {}, requestedUse: "COACHING_CONTEXT" });
  assert(result.missingData.includes("MISSING_DASHBOARD_CONTEXT"));
  assert(result.missingData.includes("MISSING_FORECAST_CONTEXT"));
  assert(result.missingData.includes("MISSING_METRICS_CONTEXT"));
});

test("Missing rollups remain UNKNOWN/review context, not poor performance", () => {
  const result = buildManagerCoachingBoundary({
    sourceEvidence: evidence,
    coachingContext: { missingRollups: ["2026-06"] },
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {}
  });
  assert(result.missingRollups.includes("2026-06"));
  assert.strictEqual(result.managerReviewRequired, true);
});

test("Missing evidence requires review", () => {
  const result = buildManagerCoachingBoundary({ coachingContext: {}, dashboardContext: {}, forecastContext: {}, metricsContext: {} });
  assert(result.missingEvidence.includes("MISSING_EVIDENCE"));
});

test("Missing source owner requires review", () => {
  const result = buildManagerCoachingBoundary({
    coachingContext: {},
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {},
    sourceEvidence: { evidenceRefs: ["E1"], sourceEvidenceIds: ["S1"], freshness: { status: "FRESH" } }
  });
  assert(result.missingSourceOwners.includes("MISSING_SOURCE_OWNER"));
});

test("Missing freshness requires review", () => {
  const result = buildManagerCoachingBoundary({
    coachingContext: {},
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {},
    sourceEvidence: { evidenceRefs: ["E1"], sourceEvidenceIds: ["S1"], sourceOwners: ["MANAGER_OS"] }
  });
  assert(result.missingFreshness.includes("MISSING_FRESHNESS"));
});

test("Stale freshness requires review", () => {
  const result = buildManagerCoachingBoundary({
    coachingContext: {},
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {},
    sourceEvidence: { evidenceRefs: ["E1"], sourceEvidenceIds: ["S1"], sourceOwners: ["MANAGER_OS"], freshness: { status: "STALE" } }
  });
  assert(result.staleSignals.includes("STALE_FRESHNESS"));
});

test("Blocked periods remain review-required, not zero", () => {
  const result = buildManagerCoachingBoundary({
    sourceEvidence: evidence,
    coachingContext: { blockedPeriods: ["2026-05"] },
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {}
  });
  assert(result.blockedPeriods.includes("2026-05"));
});

test("Explicit zero values are context warnings only", () => {
  const result = buildManagerCoachingBoundary({
    sourceEvidence: evidence,
    coachingContext: { explicitZeroContext: true, metricKey: "followups" },
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {}
  });
  assert(result.defaultZeroRisks.includes("followups"));
  assertFalseFlags(result);
});

test("Forbidden HR disciplinary and ranking uses are blocked", () => {
  const result = buildManagerCoachingBoundary({
    sourceEvidence: evidence,
    coachingContext: {},
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {},
    requestedUse: "DISCIPLINARY_ACTION"
  });
  assert(result.blockedUses.includes("DISCIPLINARY_ACTION"));
  assert.strictEqual(result.coachingBoundaryDecision, "BLOCK_FORBIDDEN_USE");
});

test("Allowed conversation context uses are allowed", () => {
  const result = buildManagerCoachingBoundary({
    sourceEvidence: evidence,
    coachingContext: {},
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {},
    requestedUse: "CONVERSATION_CONTEXT"
  });
  assert(result.allowedUses.includes("CONVERSATION_CONTEXT"));
});

test("Inputs are not mutated", () => {
  const input = { sourceEvidence: evidence, coachingContext: { explicitZeroContext: true }, dashboardContext: {}, forecastContext: {}, metricsContext: {} };
  const before = JSON.stringify(input);
  buildManagerCoachingBoundary(input);
  assert.strictEqual(JSON.stringify(input), before);
});

test("Evidence source and sourceOwners dedupe", () => {
  const result = buildManagerCoachingBoundary({
    sourceEvidence: evidence,
    coachingContext: evidence,
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {}
  });
  assert.deepStrictEqual(result.evidenceRefs, ["E1"]);
  assert.deepStrictEqual(result.sourceEvidenceIds, ["S1"]);
  assert.deepStrictEqual(result.sourceOwners, ["MANAGER_OS"]);
});

test("No automated messages, no writes, and all truth flags remain false", () => {
  const result = buildManagerCoachingBoundary({
    sourceEvidence: evidence,
    coachingContext: {},
    dashboardContext: {},
    forecastContext: {},
    metricsContext: {}
  });
  assertFalseFlags(result);
});

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${total - fail}`);
console.log(`Fail: ${fail}`);
if (fail > 0) process.exit(1);
