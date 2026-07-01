"use strict";

const assert = require("assert");

const {
  buildGenesisBetaLoopRealResponse,
  buildGenesisBetaLoopRealResponseTables,
  inspectGenesisBetaLoopRealAdapters,
} = require("../genesis-beta-loop/genesis-beta-loop-real-adapter-wiring");

const {
  buildJorgeMariaFollowup15DaysFixture,
} = require("../genesis-beta-loop/fixtures/jorge-maria-followup-15-days.fixture");

const {
  buildAndresJuanBonusProximityFixture,
  buildLupitaMariaCarGoalFixture,
} = require("../genesis-beta-loop/fixtures/genesis-beta-loop-additional-scenarios.fixture");

let passed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const requiredStages = [
  "nashMickNba",
  "promptBuilder",
  "draftIntake",
  "safetyValidator",
  "humanApprovalGate",
  "deliveryAdapter",
];

function scenarios() {
  return [
    buildJorgeMariaFollowup15DaysFixture(),
    buildAndresJuanBonusProximityFixture(),
    buildLupitaMariaCarGoalFixture(),
  ];
}

function assertFalseFlags(out) {
  [
    "automaticExecutionAllowed",
    "sendsMessage",
    "executesSend",
    "executesProviderRuntime",
    "executesLlmRuntime",
    "createsTask",
    "createsCalendarEvent",
    "createsCrmWrite",
    "createsRevenueTruth",
    "createsCompensationTruth",
    "createsPayoutTruth",
    "createsLifecycleTruth",
    "createsHrTruth",
    "createsRankingTruth",
    "createsPunishmentTruth",
    "createsPersonalityTruth",
  ].forEach((flag) => assert.strictEqual(out[flag], false, flag));
}

test("real adapter modules load and expose callable functions", () => {
  const diagnostics = inspectGenesisBetaLoopRealAdapters();
  for (const stage of requiredStages) {
    assert.ok(diagnostics[stage], stage);
    assert.strictEqual(diagnostics[stage].moduleLoaded, true, stage);
    assert.strictEqual(diagnostics[stage].functionFound, true, stage);
  }
});

test("real response can be built for all Genesis scenario fixtures", () => {
  for (const fixture of scenarios()) {
    const response = buildGenesisBetaLoopRealResponse(fixture);
    assert.strictEqual(response.scenarioId, fixture.scenarioId);
    assert.ok(response.output.status);
    assert.ok(response.output.stages);
    assertFalseFlags(response.output);
  }
});

test("real response table output is markdown and includes stages", () => {
  const table = buildGenesisBetaLoopRealResponseTables(buildJorgeMariaFollowup15DaysFixture());
  assert.ok(table.includes("| Field | Value |"));
  assert.ok(table.includes("| Adapter | Real module status |"));
  assert.ok(table.includes("| Stage | Real output |"));
  assert.ok(table.includes("nashMickNba"));
  assert.ok(table.includes("promptBuilder"));
  assert.ok(table.includes("humanApprovalGate"));
});

test("real wiring preserves delivery candidate and send separation", () => {
  const response = buildGenesisBetaLoopRealResponse(buildJorgeMariaFollowup15DaysFixture());
  assert.strictEqual(response.output.humanApprovalRequired, true);
  assert.strictEqual(response.output.deliveryCandidateOnly, true);
  assert.strictEqual(response.output.sendExecutionRequiredSeparately, true);
  assert.strictEqual(response.output.sendsMessage, false);
  assert.strictEqual(response.output.executesSend, false);
});

for (const { name, fn } of tests) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error("FAIL - " + name);
    console.error(error);
    process.exit(1);
  }
}
console.log("Genesis Beta Loop Real Adapter Wiring PASS " + passed + "/" + tests.length);
