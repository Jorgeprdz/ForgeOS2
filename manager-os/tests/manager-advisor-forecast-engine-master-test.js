const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  calculateManagerAdvisorForecast,
  MANAGER_ADVISOR_FORECAST_STATUSES
} = require("../forecast/manager-advisor-forecast-engine");

console.log("\nFORGE MANAGER ADVISOR FORECAST ENGINE MASTER TEST v1.0\n");

const sourceEvidence = {
  evidenceRefs: ["forecast-ref"],
  sourceEvidenceIds: ["forecast-source"],
  sourceOwners: ["MANAGER_OS"],
  freshness: { status: "FRESH" },
  generatedAt: "2026-06-30T12:00:00.000Z"
};

function baseInput(overrides = {}) {
  return {
    advisorMetricsContext: {
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
      evidenceRefs: ["metrics-ref"],
      sourceEvidenceIds: ["metrics-source"],
      sourceOwners: ["MANAGER_OS"],
      freshness: { status: "FRESH" }
    },
    advisorHistoricalContext: {
      periodRange: { start: "2026-05", end: "2026-06" },
      advisorHistoricalAnalytics: {},
      evidenceRefs: ["hist-ref"],
      sourceEvidenceIds: ["hist-source"],
      sourceOwners: ["MANAGER_OS"]
    },
    historicalStorageBoundaryContext: { periodRollups: [{ periodId: "2026-06", metricValueContext: 2 }] },
    sourceEvidence,
    requestedUse: "FORECAST_CONTEXT",
    periodRange: { start: "2026-05", end: "2026-06" },
    assumptions: ["protected advisor trend only"],
    confidenceLimitations: ["forecast is not truth"],
    ...overrides
  };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function assertTruthFlags(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsRevenueTruth, false);
  assert.equal(result.createsCompensationTruth, false);
  assert.equal(result.createsPayoutTruth, false);
  assert.equal(result.createsPromotionDecisionTruth, false);
  assert.equal(result.createsPunishmentTruth, false);
  assert.equal(result.createsTerminationTruth, false);
  assert.equal(result.createsDatabaseWrite, false);
}

const tests = [
  ["Builds conservative baseline stretch scenarios", () => {
    const result = calculateManagerAdvisorForecast(baseInput());
    assert.ok(result.advisorForecastContext.conservativeScenario);
    assert.ok(result.advisorForecastContext.baselineScenario);
    assert.ok(result.advisorForecastContext.stretchScenario);
    assertTruthFlags(result);
  }],
  ["Activity prospecting followup referral forecasts are context only", () => {
    const result = calculateManagerAdvisorForecast(baseInput());
    const projected = result.advisorForecastContext.baselineScenario.projectedContext;
    assert.equal(projected.advisorActivityForecastContext, 8);
    assert.equal(projected.prospectingForecastContext, 6);
    assert.equal(projected.followupForecastContext, 5);
    assert.equal(projected.referralForecastContext, 2);
    assertTruthFlags(result);
  }],
  ["Appointment and pipeline forecasts are context only", () => {
    const projected = calculateManagerAdvisorForecast(baseInput()).advisorForecastContext.baselineScenario.projectedContext;
    assert.equal(projected.appointmentForecastContext, 3);
    assert.equal(projected.pipelineForecastContext, 4);
  }],
  ["Missing activity does not become zero activity", () => {
    const result = calculateManagerAdvisorForecast(baseInput({ advisorMetricsContext: { advisorMetrics: { pipelineContext: { count: 3 } } } }));
    assert.equal(result.advisorForecastContext.baselineScenario.projectedContext.advisorActivityForecastContext, "UNKNOWN");
    assertTruthFlags(result);
  }],
  ["Missing pipeline does not become low pipeline", () => {
    const result = calculateManagerAdvisorForecast(baseInput({ advisorMetricsContext: { advisorMetrics: { activitySignalCount: 3 } } }));
    assert.equal(result.advisorForecastContext.baselineScenario.projectedContext.pipelineForecastContext, "UNKNOWN");
    assertTruthFlags(result);
  }],
  ["Production forecast does not create revenue truth", () => {
    const result = calculateManagerAdvisorForecast(baseInput());
    assert.equal(result.advisorForecastContext.baselineScenario.projectedContext.productionContextForecast, 3);
    assert.equal(result.createsRevenueTruth, false);
    assertTruthFlags(result);
  }],
  ["Qualification forecast does not create promotion truth", () => {
    const result = calculateManagerAdvisorForecast(baseInput());
    assert.equal(result.advisorForecastContext.baselineScenario.projectedContext.qualificationContextForecast, 2);
    assert.equal(result.createsPromotionDecisionTruth, false);
    assertTruthFlags(result);
  }],
  ["Advisor status qualification forecast does not create Advisor Lifecycle truth", () => {
    const result = calculateManagerAdvisorForecast(baseInput());
    assert.equal(result.createsAdvisorLifecycleTruth, false);
    assertTruthFlags(result);
  }],
  ["Support coaching forecast does not create punishment truth", () => {
    const result = calculateManagerAdvisorForecast(baseInput());
    assert.equal(result.advisorForecastContext.baselineScenario.projectedContext.supportCoachingNeedForecastContext, 3);
    assert.equal(result.createsPunishmentTruth, false);
    assertTruthFlags(result);
  }],
  ["Forecast risk does not create termination truth", () => {
    const result = calculateManagerAdvisorForecast(baseInput());
    assert.equal(result.createsTerminationTruth, false);
    assertTruthFlags(result);
  }],
  ["Missing stale evidence propagates", () => {
    const result = calculateManagerAdvisorForecast(baseInput({ sourceEvidence: {} }));
    assert.ok(result.missingEvidence.length > 0);
    assert.ok(result.staleSignals.length > 0);
    assertTruthFlags(result);
  }],
  ["Forbidden uses are blocked", () => {
    const result = calculateManagerAdvisorForecast(baseInput({ requestedUse: "REVENUE_TRUTH" }));
    assert.equal(result.forecastStatus, MANAGER_ADVISOR_FORECAST_STATUSES.BLOCKED);
    assert.ok(result.blockedUses.includes("REVENUE_TRUTH"));
    assertTruthFlags(result);
  }],
  ["Allowed uses are allowed", () => {
    const result = calculateManagerAdvisorForecast(baseInput({ requestedUse: "COACHING_CONTEXT" }));
    assert.ok(result.allowedUses.includes("COACHING_CONTEXT"));
    assertTruthFlags(result);
  }],
  ["Inputs are not mutated", () => {
    const input = baseInput();
    const original = clone(input);
    calculateManagerAdvisorForecast(input);
    assert.deepEqual(input, original);
  }],
  ["No direct Advisor OS import", () => {
    const file = fs.readFileSync(path.join(__dirname, "../forecast/manager-advisor-forecast-engine.js"), "utf8");
    assert.equal(file.includes("advisor-os"), false);
  }],
  ["No legacy Manager OS import", () => {
    const file = fs.readFileSync(path.join(__dirname, "../forecast/manager-advisor-forecast-engine.js"), "utf8");
    ["team-intelligence", "manager-os/alerts", "manager-os/coaching", "manager-os/feed", "manager-os/notifications"].forEach((text) => assert.equal(file.includes(text), false));
  }],
  ["All truth write flags remain false", () => {
    assertTruthFlags(calculateManagerAdvisorForecast(baseInput()));
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
