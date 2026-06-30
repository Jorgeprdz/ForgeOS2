const assert = require("assert");

const {
  calculateManagerTeamForecast,
  MANAGER_TEAM_FORECAST_STATUSES
} = require("../forecast/manager-team-forecast-engine");

console.log("\nFORGE MANAGER TEAM FORECAST ENGINE MASTER TEST v1.0\n");

const sourceEvidence = {
  evidenceRefs: ["forecast-ref"],
  sourceEvidenceIds: ["forecast-source"],
  sourceOwners: ["MANAGER_OS"],
  freshness: { status: "FRESH" },
  generatedAt: "2026-06-30T12:00:00.000Z"
};

function baseInput(overrides = {}) {
  return {
    teamMetricsContext: {
      teamPatternContext: { count: 4 },
      teamCapacityContext: { count: 5 },
      pipelineContext: { count: 7 },
      activitySignalCount: 12,
      defaultZeroRiskCount: 1,
      evidenceRefs: ["team-ref"],
      sourceEvidenceIds: ["team-source"],
      sourceOwners: ["MANAGER_OS"],
      freshness: { status: "FRESH" }
    },
    teamHistoricalContext: {
      periodRange: { start: "2026-05", end: "2026-06" },
      evidenceRefs: ["hist-ref"],
      sourceEvidenceIds: ["hist-source"],
      sourceOwners: ["MANAGER_OS"]
    },
    historicalStorageBoundaryContext: { periodRollups: [{ periodId: "2026-06", metricValueContext: 2 }] },
    sourceEvidence,
    requestedUse: "FORECAST_CONTEXT",
    periodRange: { start: "2026-05", end: "2026-06" },
    assumptions: ["protected team trend only"],
    confidenceLimitations: ["forecast is not truth"],
    ...overrides
  };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }
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
  assert.equal(result.createsPayoutTruth, false);
  assert.equal(result.createsDatabaseWrite, false);
}

const tests = [
  ["Builds conservative baseline stretch scenarios", () => {
    const result = calculateManagerTeamForecast(baseInput());
    assert.ok(result.teamForecastContext.conservativeScenario);
    assert.ok(result.teamForecastContext.baselineScenario);
    assert.ok(result.teamForecastContext.stretchScenario);
    assertTruthFlags(result);
  }],
  ["Team pattern forecast is context only", () => {
    const result = calculateManagerTeamForecast(baseInput());
    assert.equal(result.teamForecastContext.baselineScenario.projectedContext.teamPatternForecastContext, 4);
    assert.equal(result.teamForecastContext.baselineScenario.contextOnly, true);
    assertTruthFlags(result);
  }],
  ["Team capacity forecast is context only", () => {
    const result = calculateManagerTeamForecast(baseInput());
    assert.equal(result.teamForecastContext.baselineScenario.projectedContext.teamCapacityContext, 5);
    assertTruthFlags(result);
  }],
  ["Team forecast does not create ranking truth", () => {
    const result = calculateManagerTeamForecast(baseInput());
    assert.equal(result.createsHumanRankingTruth, false);
    assertTruthFlags(result);
  }],
  ["Team forecast does not create performance leaderboard truth", () => {
    const result = calculateManagerTeamForecast(baseInput());
    assert.equal(result.createsPerformanceLeaderboardTruth, false);
    assertTruthFlags(result);
  }],
  ["Team forecast does not create promotion punishment termination truth", () => {
    const result = calculateManagerTeamForecast(baseInput());
    assert.equal(result.createsPromotionDecisionTruth, false);
    assert.equal(result.createsPunishmentTruth, false);
    assert.equal(result.createsTerminationTruth, false);
    assertTruthFlags(result);
  }],
  ["Missing team context is UNKNOWN, not zero", () => {
    const result = calculateManagerTeamForecast(baseInput({ teamMetricsContext: null }));
    assert.equal(result.teamForecastContext.baselineScenario.projectedContext.teamPatternForecastContext, "UNKNOWN");
    assertTruthFlags(result);
  }],
  ["Missing stale evidence propagates", () => {
    const result = calculateManagerTeamForecast(baseInput({ sourceEvidence: {} }));
    assert.ok(result.missingEvidence.length > 0);
    assert.ok(result.staleSignals.length > 0);
    assertTruthFlags(result);
  }],
  ["Forbidden uses are blocked", () => {
    const result = calculateManagerTeamForecast(baseInput({ requestedUse: "PERFORMANCE_LEADERBOARD" }));
    assert.equal(result.forecastStatus, MANAGER_TEAM_FORECAST_STATUSES.BLOCKED);
    assert.ok(result.blockedUses.includes("PERFORMANCE_LEADERBOARD"));
    assertTruthFlags(result);
  }],
  ["Allowed uses are allowed", () => {
    const result = calculateManagerTeamForecast(baseInput({ requestedUse: "TEAM_PATTERN_CONTEXT" }));
    assert.ok(result.allowedUses.includes("TEAM_PATTERN_CONTEXT"));
    assertTruthFlags(result);
  }],
  ["Inputs are not mutated", () => {
    const input = baseInput();
    const original = clone(input);
    calculateManagerTeamForecast(input);
    assert.deepEqual(input, original);
  }],
  ["All truth write flags remain false", () => {
    assertTruthFlags(calculateManagerTeamForecast(baseInput()));
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
