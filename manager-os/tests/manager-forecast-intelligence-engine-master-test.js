const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  buildManagerForecastIntelligence,
  MANAGER_FORECAST_INTELLIGENCE_STATUSES
} = require("../forecast/manager-forecast-intelligence-engine");

console.log("\nFORGE MANAGER FORECAST INTELLIGENCE ENGINE MASTER TEST v1.0\n");

const sourceEvidence = {
  evidenceRefs: ["forecast-ref", "shared-ref"],
  sourceEvidenceIds: ["forecast-source", "shared-source"],
  sourceOwners: ["MANAGER_OS"],
  freshness: { status: "FRESH" },
  generatedAt: "2026-06-30T12:00:00.000Z"
};

function baseInput(overrides = {}) {
  return {
    managerMetricsContext: {
      recruitmentMetrics: {
        totalCandidateSnapshots: 10,
        initialInterviewsCompleted: 4,
        readyForPrecontractReviewCount: 2,
        pipelineVelocityContext: { eventCount: 12 },
        stageConversionRates: { contactToInitialInterview: { value: 0.5 } },
        reactivatedCandidates: 1,
        reentryReviewCandidates: 1
      },
      advisorMetrics: {
        activitySignalCount: 8,
        prospectingSignalCount: 6,
        followupSignalCount: 5,
        referralSignalCount: 2,
        appointmentContext: { count: 3 },
        pipelineContext: { count: 4 },
        productionContext: { count: 3 },
        qualificationContext: { count: 2 },
        supportNeedsContext: { count: 1 },
        coachingNeedsContext: { count: 2 }
      },
      teamMetricsContext: {
        teamPatternContext: { count: 4 },
        teamCapacityContext: { count: 5 },
        pipelineContext: { count: 7 },
        activitySignalCount: 12
      },
      evidenceRefs: ["metrics-ref", "shared-ref"],
      sourceEvidenceIds: ["metrics-source", "shared-source"],
      sourceOwners: ["MANAGER_OS"],
      freshness: { status: "FRESH" }
    },
    historicalAnalyticsContext: {
      periodRange: { start: "2026-05", end: "2026-06" },
      recruitmentHistoricalAnalytics: {},
      advisorHistoricalAnalytics: {},
      teamHistoricalContext: { managerMetricsPeriods: 2, teamMetricsPeriods: 2 },
      evidenceRefs: ["hist-ref", "shared-ref"],
      sourceEvidenceIds: ["hist-source", "shared-source"],
      sourceOwners: ["MANAGER_OS"],
      freshness: { status: "FRESH" }
    },
    historicalStorageBoundaryContext: { periodRollups: [{ periodId: "2026-06", metricValueContext: 2 }] },
    historicalRollupContext: { evidenceRefs: ["rollup-ref"], sourceEvidenceIds: ["rollup-source"], sourceOwners: ["MANAGER_OS"] },
    historicalQueryPlanContext: { queryPlan: { usePeriodRollups: true } },
    sourceEvidence,
    requestedUse: "FORECAST_CONTEXT",
    periodRange: { start: "2026-05", end: "2026-06" },
    assumptions: ["protected context only"],
    confidenceLimitations: ["scenario confidence only"],
    ...overrides
  };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function readForecastFiles() {
  return [
    "manager-forecast-boundary-contract.js",
    "manager-recruitment-forecast-engine.js",
    "manager-advisor-forecast-engine.js",
    "manager-team-forecast-engine.js",
    "manager-forecast-intelligence-engine.js"
  ].map((fileName) => fs.readFileSync(path.join(__dirname, "../forecast", fileName), "utf8")).join("\n");
}
function assertTruthFlags(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsHumanRankingTruth, false);
  assert.equal(result.createsPerformanceLeaderboardTruth, false);
  assert.equal(result.createsPromotionDecisionTruth, false);
  assert.equal(result.createsPunishmentTruth, false);
  assert.equal(result.createsTerminationTruth, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsRevenueTruth, false);
  assert.equal(result.createsCompensationTruth, false);
  assert.equal(result.createsRevenue, false);
  assert.equal(result.createsCompensation, false);
  assert.equal(result.createsPayoutTruth, false);
  assert.equal(result.createsPrecontractTruth, false);
  assert.equal(result.createsHiringTruth, false);
  assert.equal(result.createsDatabaseWrite, false);
  assert.equal(result.createsFilesystemWrite, false);
  assert.equal(result.createsCacheWrite, false);
  assert.equal(result.createsMigrationWrite, false);
  assert.equal(result.createsSchemaWrite, false);
}

const tests = [
  ["Combines recruitment advisor and team forecast context", () => {
    const result = buildManagerForecastIntelligence(baseInput());
    assert.ok(result.recruitmentForecastContext.baselineScenario);
    assert.ok(result.advisorForecastContext.baselineScenario);
    assert.ok(result.teamForecastContext.baselineScenario);
    assertTruthFlags(result);
  }],
  ["Uses protected metrics historical storage query-plan context only", () => {
    const result = buildManagerForecastIntelligence(baseInput());
    assert.ok(result.warnings.some((warning) => warning.includes("protected metrics")));
    assert.equal(result.boundaryContext.createsRevenueTruth, false);
    assertTruthFlags(result);
  }],
  ["Does not mutate inputs", () => {
    const input = baseInput();
    const original = clone(input);
    buildManagerForecastIntelligence(input);
    assert.deepEqual(input, original);
  }],
  ["Merges and dedupes evidence source sourceOwners", () => {
    const result = buildManagerForecastIntelligence(baseInput());
    assert.equal(result.evidenceRefs.filter((item) => item === "shared-ref").length, 1);
    assert.equal(result.sourceEvidenceIds.filter((item) => item === "shared-source").length, 1);
    assert.equal(result.sourceOwners.filter((item) => item === "MANAGER_OS").length, 1);
    assertTruthFlags(result);
  }],
  ["Propagates warnings limitations missing unknown stale defaultZero risks", () => {
    const result = buildManagerForecastIntelligence(baseInput({
      sourceEvidence: {},
      historicalAnalyticsContext: { missingPeriods: ["2026-05"], defaultZeroRisks: ["forecast.zero_requires_evidence_review"] }
    }));
    assert.ok(result.missingEvidence.length > 0);
    assert.ok(result.unknownSignals.length > 0);
    assert.ok(result.staleSignals.length > 0);
    assert.ok(result.defaultZeroRisks.includes("forecast.zero_requires_evidence_review"));
    assert.ok(result.confidenceLimitations.length > 0);
    assertTruthFlags(result);
  }],
  ["Blocks forbidden uses", () => {
    const result = buildManagerForecastIntelligence(baseInput({ requestedUse: "AUTOMATIC_DECISION" }));
    assert.equal(result.forecastStatus, MANAGER_FORECAST_INTELLIGENCE_STATUSES.BLOCKED);
    assert.ok(result.blockedUses.includes("AUTOMATIC_DECISION"));
    assertTruthFlags(result);
  }],
  ["Allows context uses", () => {
    const result = buildManagerForecastIntelligence(baseInput({ requestedUse: "SCENARIO_PLANNING_CONTEXT" }));
    assert.ok(result.allowedUses.includes("SCENARIO_PLANNING_CONTEXT"));
    assertTruthFlags(result);
  }],
  ["Creates no downstream or write truth", () => {
    assertTruthFlags(buildManagerForecastIntelligence(baseInput()));
  }],
  ["No direct Advisor OS import", () => {
    assert.equal(readForecastFiles().includes("advisor-os"), false);
  }],
  ["No legacy Manager OS import", () => {
    const files = readForecastFiles();
    ["team-intelligence", "manager-os/alerts", "manager-os/coaching", "manager-os/feed", "manager-os/notifications"].forEach((text) => assert.equal(files.includes(text), false));
  }],
  ["No compensation revenue payout advisor lifecycle product imports", () => {
    const files = readForecastFiles();
    ["compensation/", "revenue/", "payout/", "advisor-lifecycle/", "product-intelligence/"].forEach((text) => assert.equal(files.includes(text), false));
  }],
  ["No fs database cache imports in forecast engines", () => {
    const files = readForecastFiles();
    ["require(\"fs\")", "require('fs')", "require(\"node:fs\")", "require('node:fs')", "sqlite", "postgres", "redis", "cache"].forEach((text) => assert.equal(files.includes(text), false));
  }]
];

let passed = 0;
let failed = 0;
tests.forEach(([name, run]) => {
  try { run(); passed += 1; console.log(`PASS ${name}`); } catch (error) { failed += 1; console.error(`FAIL ${name}`); console.error(error); }
});
console.log("\nResumen:");
console.log(`Total: ${tests.length}`);
console.log(`Pass: ${passed}`);
console.log(`Fail: ${failed}`);
if (failed > 0) process.exit(1);
