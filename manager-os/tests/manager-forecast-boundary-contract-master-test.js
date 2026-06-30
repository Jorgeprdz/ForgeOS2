const assert = require("assert");

const {
  buildManagerForecastBoundary,
  MANAGER_FORECAST_BOUNDARY_STATUSES
} = require("../forecast/manager-forecast-boundary-contract");

console.log("\nFORGE MANAGER FORECAST BOUNDARY CONTRACT MASTER TEST v1.0\n");

const sourceEvidence = {
  evidenceRefs: ["forecast-ref", "shared-ref"],
  sourceEvidenceIds: ["forecast-source", "shared-source"],
  sourceOwners: ["MANAGER_OS"],
  freshness: { status: "FRESH" },
  generatedAt: "2026-06-30T12:00:00.000Z"
};

function baseInput(overrides = {}) {
  return {
    forecastContext: {
      scenario: "baseline",
      assumptions: ["protected historical metrics only"],
      confidenceLimitations: ["scenario confidence is limited"]
    },
    historicalContext: {
      periodRange: { start: "2026-05", end: "2026-06" },
      evidenceRefs: ["hist-ref", "shared-ref"],
      sourceEvidenceIds: ["hist-source", "shared-source"],
      sourceOwners: ["MANAGER_OS"]
    },
    storageBoundaryContext: {
      periodRollups: [{ periodId: "2026-06", metricValueContext: 10 }]
    },
    queryPlanContext: {
      queryPlan: { usePeriodRollups: true }
    },
    sourceEvidence,
    requestedUse: "FORECAST_CONTEXT",
    periodRange: { start: "2026-05", end: "2026-06" },
    assumptions: ["baseline assumes current protected run-rate"],
    confidenceLimitations: ["no payout truth"],
    generatedAt: "2026-06-30T12:30:00.000Z",
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
  ["Missing forecast context becomes UNKNOWN, not zero", () => {
    const result = buildManagerForecastBoundary(baseInput({ forecastContext: null }));
    assert.equal(result.forecastBoundaryStatus, MANAGER_FORECAST_BOUNDARY_STATUSES.UNKNOWN);
    assert.ok(result.missingForecastInputs.includes("forecast_context_missing"));
    assertTruthFlags(result);
  }],
  ["Missing historical periods become UNKNOWN, not zero", () => {
    const result = buildManagerForecastBoundary(baseInput({ historicalContext: { missingPeriods: ["2026-05"] } }));
    assert.equal(result.forecastBoundaryStatus, MANAGER_FORECAST_BOUNDARY_STATUSES.UNKNOWN);
    assert.ok(result.missingHistoricalPeriods.includes("2026-05"));
    assertTruthFlags(result);
  }],
  ["Missing rollups become UNKNOWN, not poor performance", () => {
    const result = buildManagerForecastBoundary(baseInput({ storageBoundaryContext: { periodRollups: [] } }));
    assert.equal(result.forecastBoundaryStatus, MANAGER_FORECAST_BOUNDARY_STATUSES.UNKNOWN);
    assert.ok(result.missingRollups.includes("historical_rollups_missing"));
    assertTruthFlags(result);
  }],
  ["Missing evidence requires review", () => {
    const result = buildManagerForecastBoundary(baseInput({ sourceEvidence: { sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } } }));
    assert.equal(result.forecastBoundaryStatus, MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_EVIDENCE);
    assert.ok(result.missingEvidence.includes("forecast_evidence_missing"));
    assertTruthFlags(result);
  }],
  ["Missing source owner requires review", () => {
    const result = buildManagerForecastBoundary(baseInput({ sourceEvidence: { evidenceRefs: ["e"], sourceEvidenceIds: ["s"], freshness: { status: "FRESH" } } }));
    assert.equal(result.forecastBoundaryStatus, MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_SOURCE_OWNER);
    assert.ok(result.missingEvidence.includes("forecast_source_owner_missing"));
    assertTruthFlags(result);
  }],
  ["Missing freshness requires review", () => {
    const result = buildManagerForecastBoundary(baseInput({ sourceEvidence: { evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: ["MANAGER_OS"] } }));
    assert.equal(result.forecastBoundaryStatus, MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_FRESHNESS);
    assert.ok(result.staleSignals.includes("forecast_freshness_missing"));
    assertTruthFlags(result);
  }],
  ["Stale freshness requires review", () => {
    const result = buildManagerForecastBoundary(baseInput({ sourceEvidence: { evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: ["MANAGER_OS"], freshness: { status: "STALE" } } }));
    assert.equal(result.forecastBoundaryStatus, MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_FRESHNESS);
    assert.ok(result.staleSignals.includes("forecast_freshness_stale"));
    assertTruthFlags(result);
  }],
  ["Blocked periods require review and do not collapse to zero", () => {
    const result = buildManagerForecastBoundary(baseInput({ historicalContext: { periodStatus: "BLOCKED", periodId: "2026-06" } }));
    assert.equal(result.forecastBoundaryStatus, MANAGER_FORECAST_BOUNDARY_STATUSES.NEEDS_HUMAN_REVIEW);
    assert.ok(result.blockedPeriods.includes("2026-06"));
    assertTruthFlags(result);
  }],
  ["Explicit zero values are context warnings only", () => {
    const result = buildManagerForecastBoundary(baseInput({ forecastContext: { value: 0, assumptions: ["zero with evidence"], confidenceLimitations: ["zero requires review"] } }));
    assert.ok(result.defaultZeroRisks.length > 0);
    assert.equal(result.createsRevenueTruth, false);
    assertTruthFlags(result);
  }],
  ["Assumptions and confidenceLimitations are required for scenarios", () => {
    const result = buildManagerForecastBoundary(baseInput({ assumptions: [], confidenceLimitations: [], forecastContext: {} }));
    assert.ok(result.missingEvidence.includes("forecast_assumptions_required"));
    assert.ok(result.missingEvidence.includes("forecast_confidence_limitations_required"));
    assertTruthFlags(result);
  }],
  ["Forbidden uses are blocked", () => {
    const result = buildManagerForecastBoundary(baseInput({ requestedUse: "PAYOUT" }));
    assert.equal(result.forecastBoundaryStatus, MANAGER_FORECAST_BOUNDARY_STATUSES.BLOCKED);
    assert.ok(result.blockedUses.includes("PAYOUT"));
    assertTruthFlags(result);
  }],
  ["Allowed context uses are allowed", () => {
    const result = buildManagerForecastBoundary(baseInput({ requestedUse: "SCENARIO_PLANNING_CONTEXT" }));
    assert.ok(result.allowedUses.includes("SCENARIO_PLANNING_CONTEXT"));
    assert.equal(result.blockedUses.length, 0);
    assertTruthFlags(result);
  }],
  ["Inputs are not mutated", () => {
    const input = baseInput();
    const original = clone(input);
    buildManagerForecastBoundary(input);
    assert.deepEqual(input, original);
  }],
  ["Evidence source and sourceOwners dedupe", () => {
    const result = buildManagerForecastBoundary(baseInput());
    assert.equal(result.evidenceRefs.filter((item) => item === "shared-ref").length, 1);
    assert.equal(result.sourceEvidenceIds.filter((item) => item === "shared-source").length, 1);
    assert.equal(result.sourceOwners.filter((item) => item === "MANAGER_OS").length, 1);
    assertTruthFlags(result);
  }],
  ["No write truth and all truth flags remain false", () => {
    assertTruthFlags(buildManagerForecastBoundary(baseInput()));
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
