"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  buildManagerCoachingIntelligence
} = require("../coaching-intelligence/manager-coaching-intelligence-engine");

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
    "createsAdvisorLifecycleTruth",
    "createsRevenueTruth",
    "createsCompensationTruth",
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
  ].forEach((flag) => assert.strictEqual(result[flag], false, `${flag} must be false`));
}

const evidence = {
  evidenceRefs: ["E1", "E1"],
  sourceEvidenceIds: ["S1", "S1"],
  sourceOwners: ["MANAGER_OS", "MANAGER_OS"],
  freshness: { status: "FRESH" }
};

console.log("\nFORGE MANAGER COACHING INTELLIGENCE ENGINE MASTER TEST v1.0\n");

test("Combines recruitment advisor and team coaching context", () => {
  const result = buildManagerCoachingIntelligence({
    sourceEvidence: evidence,
    managerMetricsContext: {},
    dashboardIntelligenceContext: {},
    forecastIntelligenceContext: {},
    historicalAnalyticsContext: {}
  });
  assert(result.recruitmentCoaching);
  assert(result.advisorCoaching);
  assert(result.teamCoaching);
});

test("Uses protected metrics historical storage query plan forecast dashboard context only", () => {
  const result = buildManagerCoachingIntelligence({
    sourceEvidence: evidence,
    managerMetricsContext: { evidenceRefs: ["E2"], sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } },
    historicalAnalyticsContext: { evidenceRefs: ["E3"], sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } },
    historicalStorageBoundaryContext: { evidenceRefs: ["E4"], sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } },
    historicalQueryPlanContext: { evidenceRefs: ["E5"], sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } },
    forecastIntelligenceContext: { evidenceRefs: ["E6"], sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } },
    dashboardIntelligenceContext: { evidenceRefs: ["E7"], sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } }
  });
  assert(result.evidenceRefs.includes("E1"));
});

test("Does not mutate inputs", () => {
  const input = { sourceEvidence: evidence, managerMetricsContext: {}, dashboardIntelligenceContext: {}, forecastIntelligenceContext: {}, historicalAnalyticsContext: {} };
  const before = JSON.stringify(input);
  buildManagerCoachingIntelligence(input);
  assert.strictEqual(JSON.stringify(input), before);
});

test("Merges and dedupes evidence source owners", () => {
  const result = buildManagerCoachingIntelligence({
    sourceEvidence: evidence,
    managerMetricsContext: evidence,
    dashboardIntelligenceContext: evidence,
    forecastIntelligenceContext: evidence,
    historicalAnalyticsContext: evidence
  });
  assert.deepStrictEqual(result.evidenceRefs, ["E1"]);
  assert.deepStrictEqual(result.sourceEvidenceIds, ["S1"]);
  assert.deepStrictEqual(result.sourceOwners, ["MANAGER_OS"]);
});

test("Propagates warnings limitations missing unknown stale defaultZero risks", () => {
  const result = buildManagerCoachingIntelligence({
    sourceEvidence: { evidenceRefs: ["E1"], sourceEvidenceIds: ["S1"], sourceOwners: ["MANAGER_OS"], freshness: { status: "STALE" } },
    managerMetricsContext: { defaultZeroRisks: ["followups"] },
    dashboardIntelligenceContext: { missingRollups: ["2026-06"] },
    forecastIntelligenceContext: {},
    historicalAnalyticsContext: {}
  });
  assert(result.boundary.staleSignals.includes("STALE_FRESHNESS"));
  assert(result.warnings.length > 0);
});

test("Blocks forbidden uses", () => {
  const result = buildManagerCoachingIntelligence({
    sourceEvidence: evidence,
    managerMetricsContext: {},
    dashboardIntelligenceContext: {},
    forecastIntelligenceContext: {},
    historicalAnalyticsContext: {},
    requestedUse: "HR_DECISION"
  });
  assert.strictEqual(result.coachingIntelligenceDecision, "BLOCK_FORBIDDEN_USE");
});

test("Allows coaching context uses", () => {
  const result = buildManagerCoachingIntelligence({
    sourceEvidence: evidence,
    managerMetricsContext: {},
    dashboardIntelligenceContext: {},
    forecastIntelligenceContext: {},
    historicalAnalyticsContext: {},
    requestedUse: "COACHING_CONTEXT"
  });
  assert(result.boundary.allowedUses.includes("COACHING_CONTEXT"));
});

test("Executive coaching summary is review context, not automatic decision", () => {
  const result = buildManagerCoachingIntelligence({
    sourceEvidence: evidence,
    managerMetricsContext: {},
    dashboardIntelligenceContext: {},
    forecastIntelligenceContext: {},
    historicalAnalyticsContext: {}
  });
  assert.strictEqual(result.executiveCoachingSummary.contextOnly, true);
  assert.strictEqual(result.executiveCoachingSummary.automaticDecisionAllowed, false);
  assert.strictEqual(result.executiveCoachingSummary.sendsAutomatedMessages, false);
});

test("Creates no downstream truth, no writes, and no automated messages", () => {
  const result = buildManagerCoachingIntelligence({
    sourceEvidence: evidence,
    managerMetricsContext: {},
    dashboardIntelligenceContext: {},
    forecastIntelligenceContext: {},
    historicalAnalyticsContext: {}
  });
  assertFalseFlags(result);
});

test("No direct Advisor OS import", () => {
  const source = fs.readFileSync(path.join(__dirname, "../coaching-intelligence/manager-coaching-intelligence-engine.js"), "utf8");
  assert(!/require\(["'][^"']*advisor-os/i.test(source));
});

test("No legacy Manager OS coaching dashboard momentum report import", () => {
  const source = fs.readFileSync(path.join(__dirname, "../coaching-intelligence/manager-coaching-intelligence-engine.js"), "utf8");
  assert(!/require\(["'][^"']*manager-os\/(coaching|dashboard|momentum|report)/i.test(source));
});

test("No compensation revenue payout lifecycle product imports", () => {
  const source = fs.readFileSync(path.join(__dirname, "../coaching-intelligence/manager-coaching-intelligence-engine.js"), "utf8");
  assert(!/require\(["'][^"']*(compensation|revenue|payout|advisor-lifecycle|product-intelligence)/i.test(source));
});

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${total - fail}`);
console.log(`Fail: ${fail}`);
if (fail > 0) process.exit(1);
