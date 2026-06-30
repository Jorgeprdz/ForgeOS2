const assert = require("assert");

const {
  calculateManagerRecruitmentForecast,
  MANAGER_RECRUITMENT_FORECAST_STATUSES
} = require("../forecast/manager-recruitment-forecast-engine");

console.log("\nFORGE MANAGER RECRUITMENT FORECAST ENGINE MASTER TEST v1.0\n");

const sourceEvidence = {
  evidenceRefs: ["forecast-ref"],
  sourceEvidenceIds: ["forecast-source"],
  sourceOwners: ["MANAGER_OS"],
  freshness: { status: "FRESH" },
  generatedAt: "2026-06-30T12:00:00.000Z"
};

function baseInput(overrides = {}) {
  return {
    recruitmentMetricsContext: {
      recruitmentMetrics: {
        totalCandidateSnapshots: 10,
        initialInterviewsCompleted: 4,
        readyForPrecontractReviewCount: 2,
        pipelineVelocityContext: { eventCount: 12 },
        stageConversionRates: { contactToInitialInterview: { value: 0.5 } },
        reactivatedCandidates: 1,
        reentryReviewCandidates: 1
      },
      evidenceRefs: ["metrics-ref"],
      sourceEvidenceIds: ["metrics-source"],
      sourceOwners: ["MANAGER_OS"],
      freshness: { status: "FRESH" }
    },
    recruitmentHistoricalContext: {
      periodRange: { start: "2026-05", end: "2026-06" },
      recruitmentHistoricalAnalytics: {
        readyForPrecontractReviewTrend: { points: [{ value: 1 }, { value: 2 }] },
        pipelineVelocityContext: { points: [{ value: 9 }, { value: 12 }] }
      },
      evidenceRefs: ["hist-ref"],
      sourceEvidenceIds: ["hist-source"],
      sourceOwners: ["MANAGER_OS"]
    },
    historicalStorageBoundaryContext: { periodRollups: [{ periodId: "2026-06", metricValueContext: 2 }] },
    sourceEvidence,
    requestedUse: "FORECAST_CONTEXT",
    periodRange: { start: "2026-05", end: "2026-06" },
    assumptions: ["protected recruitment trend only"],
    confidenceLimitations: ["forecast is not truth"],
    ...overrides
  };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function assertTruthFlags(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsPrecontractTruth, false);
  assert.equal(result.createsHiringTruth, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsRevenueTruth, false);
  assert.equal(result.createsCompensationTruth, false);
  assert.equal(result.createsPayoutTruth, false);
  assert.equal(result.createsPunishmentTruth, false);
  assert.equal(result.createsPromotionDecisionTruth, false);
  assert.equal(result.createsDatabaseWrite, false);
  assert.equal(result.createsFilesystemWrite, false);
}

const tests = [
  ["Builds conservative baseline stretch scenarios", () => {
    const result = calculateManagerRecruitmentForecast(baseInput());
    assert.ok(result.recruitmentForecastContext.conservativeScenario);
    assert.ok(result.recruitmentForecastContext.baselineScenario);
    assert.ok(result.recruitmentForecastContext.stretchScenario);
    assertTruthFlags(result);
  }],
  ["Candidate pipeline forecast is context only", () => {
    const result = calculateManagerRecruitmentForecast(baseInput());
    assert.equal(result.recruitmentForecastContext.baselineScenario.contextOnly, true);
    assert.equal(result.recruitmentForecastContext.baselineScenario.projectedContext.candidatePipelineForecastContext, 10);
    assertTruthFlags(result);
  }],
  ["Interview completion forecast is context only", () => {
    const result = calculateManagerRecruitmentForecast(baseInput());
    assert.equal(result.recruitmentForecastContext.baselineScenario.projectedContext.interviewCompletionForecastContext, 4);
    assertTruthFlags(result);
  }],
  ["Precontract readiness forecast does not create precontract truth", () => {
    const result = calculateManagerRecruitmentForecast(baseInput());
    assert.equal(result.recruitmentForecastContext.baselineScenario.projectedContext.precontractReadinessForecastContext, 2);
    assert.equal(result.createsPrecontractTruth, false);
    assertTruthFlags(result);
  }],
  ["Recruitment velocity forecast is context only", () => {
    const result = calculateManagerRecruitmentForecast(baseInput());
    assert.equal(result.recruitmentForecastContext.baselineScenario.projectedContext.recruitmentVelocityForecastContext, 12);
    assertTruthFlags(result);
  }],
  ["Conversion forecast is context only", () => {
    const result = calculateManagerRecruitmentForecast(baseInput());
    assert.equal(result.recruitmentForecastContext.baselineScenario.projectedContext.conversionForecastContext, 0.5);
    assertTruthFlags(result);
  }],
  ["Reactivation reentry forecast does not create automatic approval or hiring truth", () => {
    const result = calculateManagerRecruitmentForecast(baseInput());
    assert.equal(result.recruitmentForecastContext.baselineScenario.projectedContext.reactivationReentryForecastContext, 2);
    assert.equal(result.createsAutomaticApprovalTruth, false);
    assert.equal(result.createsHiringTruth, false);
    assertTruthFlags(result);
  }],
  ["Missing historical periods are UNKNOWN, not zero", () => {
    const result = calculateManagerRecruitmentForecast(baseInput({ recruitmentHistoricalContext: { missingPeriods: ["2026-05"] } }));
    assert.equal(result.forecastStatus, MANAGER_RECRUITMENT_FORECAST_STATUSES.UNKNOWN);
    assert.ok(result.unknownSignals.includes("historical_period_context_missing"));
    assertTruthFlags(result);
  }],
  ["Missing rollups are UNKNOWN, not poor performance", () => {
    const result = calculateManagerRecruitmentForecast(baseInput({ historicalStorageBoundaryContext: { periodRollups: [] } }));
    assert.equal(result.forecastStatus, MANAGER_RECRUITMENT_FORECAST_STATUSES.UNKNOWN);
    assert.ok(result.unknownSignals.includes("historical_rollups_missing"));
    assertTruthFlags(result);
  }],
  ["Missing stale evidence propagates", () => {
    const result = calculateManagerRecruitmentForecast(baseInput({ sourceEvidence: {} }));
    assert.ok(result.missingEvidence.length > 0);
    assert.ok(result.staleSignals.length > 0);
    assertTruthFlags(result);
  }],
  ["Forbidden uses are blocked", () => {
    const result = calculateManagerRecruitmentForecast(baseInput({ requestedUse: "PRECONTRACT_TRUTH" }));
    assert.equal(result.forecastStatus, MANAGER_RECRUITMENT_FORECAST_STATUSES.BLOCKED);
    assert.ok(result.blockedUses.includes("PRECONTRACT_TRUTH"));
    assertTruthFlags(result);
  }],
  ["Allowed uses are allowed", () => {
    const result = calculateManagerRecruitmentForecast(baseInput({ requestedUse: "DASHBOARD_CONTEXT" }));
    assert.ok(result.allowedUses.includes("DASHBOARD_CONTEXT"));
    assertTruthFlags(result);
  }],
  ["Inputs are not mutated", () => {
    const input = baseInput();
    const original = clone(input);
    calculateManagerRecruitmentForecast(input);
    assert.deepEqual(input, original);
  }],
  ["All truth write flags remain false", () => {
    assertTruthFlags(calculateManagerRecruitmentForecast(baseInput()));
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
