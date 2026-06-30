"use strict";

const assert = require("assert");

const {
  buildNashManagerContextIntakeBoundary,
  NASH_MANAGER_CONTEXT_INTAKE_STATUS,
  NASH_MANAGER_CONTEXT_INTAKE_ALLOWED_USES,
  NASH_MANAGER_CONTEXT_INTAKE_FORBIDDEN_USES
} = require("../context-intake/nash-manager-context-intake-boundary-contract");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function basePacket(extra = {}) {
  return {
    packetType: "MANAGER_OS_NASH_CONVERSATION_PREP_PACKET",
    suggestedQuestionAreas: ["follow-up context"],
    evidenceToReview: ["review plan evidence"],
    evidenceSources: ["manager-external-context-bridge", "manager-external-context-bridge"],
    sourceOwners: ["Manager OS", "Manager OS"],
    freshness: "CURRENT",
    ...extra
  };
}

function assertAllFlagsFalse(result) {
  for (const [key, value] of Object.entries(result.truthFlags)) {
    assert.strictEqual(value, false, `truth flag should be false: ${key}`);
  }
  for (const [key, value] of Object.entries(result.writeFlags)) {
    assert.strictEqual(value, false, `write flag should be false: ${key}`);
  }
  for (const [key, value] of Object.entries(result.actionFlags)) {
    assert.strictEqual(value, false, `action flag should be false: ${key}`);
  }
}

test("Missing Nash manager context packet becomes UNKNOWN, not zero", () => {
  const result = buildNashManagerContextIntakeBoundary({});
  assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.UNKNOWN);
  assert(result.missing.includes("nashManagerContextPacket"));
  assert(result.unknown.includes("nashManagerContextPacket"));
});

test("Missing evidence requires review", () => {
  const result = buildNashManagerContextIntakeBoundary({ packet: basePacket({ evidenceSources: [] }) });
  assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED);
  assert(result.missing.includes("evidence"));
});

test("Missing source owner requires review", () => {
  const result = buildNashManagerContextIntakeBoundary({ packet: basePacket({ sourceOwners: [] }) });
  assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED);
  assert(result.missing.includes("sourceOwner"));
});

test("Missing freshness requires review", () => {
  const result = buildNashManagerContextIntakeBoundary({ packet: basePacket({ freshness: undefined }) });
  assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED);
  assert(result.missing.includes("freshness"));
});

test("Stale packet requires review", () => {
  const result = buildNashManagerContextIntakeBoundary({ packet: basePacket({ freshnessStatus: "STALE" }) });
  assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED);
  assert(result.stale.includes("nashManagerContextPacket"));
});

test("Blocked periods remain review-required, not zero", () => {
  const result = buildNashManagerContextIntakeBoundary({ packet: basePacket({ blockedPeriods: ["blocked-cycle"] }) });
  assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED);
  assert(result.blockedPeriods.includes("nashManagerContextPacket"));
});

test("Explicit zero values are context warnings only", () => {
  const result = buildNashManagerContextIntakeBoundary({ packet: basePacket({ missedFollowups: 0 }) });
  assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED);
  assert(result.defaultZeroWarnings.some((item) => item.includes("missedFollowups")));
  assert.strictEqual(result.truthFlags.createsPunishmentTruth, false);
});

test("Forbidden Nash runtime execution use is blocked", () => {
  const result = buildNashManagerContextIntakeBoundary({ packet: basePacket(), requestedUse: "NASH_RUNTIME_EXECUTION" });
  assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED);
  assert.strictEqual(result.forbiddenUseBlocked, true);
});

test("Forbidden Nash next-best-action execution use is blocked", () => {
  const result = buildNashManagerContextIntakeBoundary({ packet: basePacket(), requestedUse: "NASH_NEXT_BEST_ACTION_EXECUTION" });
  assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED);
  assert.strictEqual(result.actionFlags.executesNextBestAction, false);
});

test("Forbidden message draft task and calendar uses are blocked", () => {
  for (const requestedUse of ["MESSAGE_SEND", "DRAFT_CREATE", "TASK_CREATE", "CALENDAR_WRITE"]) {
    const result = buildNashManagerContextIntakeBoundary({ packet: basePacket(), requestedUse });
    assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED);
  }
});

test("Forbidden pressure manipulation and invented-intent uses are blocked", () => {
  for (const requestedUse of ["PRESSURE_LANGUAGE", "MANIPULATION", "INVENTED_INTENT"]) {
    const result = buildNashManagerContextIntakeBoundary({ packet: basePacket(), requestedUse });
    assert.strictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED);
  }
});

test("Allowed intake uses are allowed", () => {
  for (const requestedUse of NASH_MANAGER_CONTEXT_INTAKE_ALLOWED_USES) {
    const result = buildNashManagerContextIntakeBoundary({ packet: basePacket(), requestedUse });
    assert.notStrictEqual(result.status, NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED);
    assert.strictEqual(result.allowedUse, true);
  }
});

test("Inputs are not mutated", () => {
  const input = { packet: basePacket({ nested: { count: 1 } }) };
  const before = JSON.stringify(input);
  const result = buildNashManagerContextIntakeBoundary(input);
  result.packet.nested.count = 9;
  assert.strictEqual(JSON.stringify(input), before);
});

test("Evidence source and sourceOwners dedupe", () => {
  const result = buildNashManagerContextIntakeBoundary({
    packet: basePacket({
      evidenceSources: ["bridge", "bridge", "review-plan"],
      sourceOwners: ["Manager OS", "Manager OS", "Nash Intake"]
    })
  });
  assert.deepStrictEqual(result.evidenceSources, ["bridge", "review-plan"]);
  assert.deepStrictEqual(result.sourceOwners, ["Manager OS", "Nash Intake"]);
});

test("No actions writes executions or downstream truth flags remain false", () => {
  const result = buildNashManagerContextIntakeBoundary({ packet: basePacket() });
  assertAllFlagsFalse(result);
  assert.strictEqual(result.boundary.executesNashRuntime, false);
  assert.strictEqual(result.boundary.executesNextBestAction, false);
  assert.strictEqual(result.boundary.sendsMessages, false);
  assert.strictEqual(result.boundary.createsDrafts, false);
});

let pass = 0;
let fail = 0;

console.log("\nFORGE NASH MANAGER CONTEXT INTAKE BOUNDARY CONTRACT MASTER TEST v1.0\n");

for (const item of tests) {
  try {
    item.fn();
    pass += 1;
    console.log(`PASS ${item.name}`);
  } catch (error) {
    fail += 1;
    console.log(`FAIL ${item.name}`);
    console.error(error.stack || error.message);
  }
}

console.log("\nResumen:");
console.log(`Total: ${tests.length}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${fail}`);

if (fail > 0) process.exit(1);
