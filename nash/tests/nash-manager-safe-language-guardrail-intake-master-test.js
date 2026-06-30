"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  buildNashManagerSafeLanguageGuardrailIntake
} = require("../context-intake/nash-manager-safe-language-guardrail-intake");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function packet(extra = {}) {
  return {
    packetType: "MANAGER_OS_NASH_CONVERSATION_PREP_PACKET",
    evidenceSources: ["manager-external-context-bridge"],
    sourceOwners: ["Manager OS"],
    freshness: "CURRENT",
    languageSamples: ["Can we review what support would help this week?"],
    ...extra
  };
}

function assertFlagsFalse(result) {
  assert.strictEqual(result.autoRewritesMessages, false);
  assert.strictEqual(result.executesNashRuntime, false);
  assert.strictEqual(result.executesNextBestAction, false);
  assert.strictEqual(result.sendsMessages, false);
  assert.strictEqual(result.createsDrafts, false);
  assert.strictEqual(result.createsTasks, false);
  assert.strictEqual(result.createsCalendarEvents, false);
  assert.strictEqual(result.generatesPressureLanguage, false);
  assert.strictEqual(result.manipulatesConversation, false);
  assert.strictEqual(result.infersInventedIntent, false);
  assert.strictEqual(result.truthFlags.createsPressureLanguageTruth, false);
  assert.strictEqual(result.truthFlags.createsManipulationTruth, false);
  assert.strictEqual(result.truthFlags.createsInventedIntentTruth, false);
}

test("Builds safe language guardrail context only", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake({ packet: packet() });
  assert.strictEqual(result.safeLanguageContextOnly, true);
  assert.strictEqual(result.unsafeLanguageFindingsAreReviewContextOnly, true);
});

test("Flags pressure language as review context only", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake({
    packet: packet({ languageSamples: ["You must do this today or you will fall behind."] })
  });
  assert.strictEqual(result.status, "REVIEW_REQUIRED");
  assert(result.unsafeLanguageFindings.some((item) => item.type === "PRESSURE_LANGUAGE"));
  assert.strictEqual(result.truthFlags.createsPressureLanguageTruth, false);
});

test("Flags shame language as review context only", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake({
    packet: packet({ languageSamples: ["This failure should make you feel shame."] })
  });
  assert(result.unsafeLanguageFindings.some((item) => item.type === "SHAME_LANGUAGE"));
});

test("Flags threat language as review context only", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake({
    packet: packet({ languageSamples: ["If you do not comply, there will be punishment."] })
  });
  assert(result.unsafeLanguageFindings.some((item) => item.type === "THREAT_LANGUAGE"));
});

test("Flags manipulation language as review context only", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake({
    packet: packet({ languageSamples: ["Use fear and guilt to make the person act."] })
  });
  assert(result.unsafeLanguageFindings.some((item) => item.type === "MANIPULATION_LANGUAGE"));
});

test("Flags invented intent language as review context only", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake({
    packet: packet({ languageSamples: ["It is obviously hidden intent; seguro no quiere trabajar."] })
  });
  assert(result.unsafeLanguageFindings.some((item) => item.type === "INVENTED_INTENT_LANGUAGE"));
});

test("Safe language does not auto-rewrite or send messages", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake({ packet: packet() });
  assertFlagsFalse(result);
});

test("Missing language samples remains UNKNOWN/review context, not zero", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake({ packet: packet({ languageSamples: [] }) });
  assert.strictEqual(result.status, "REVIEW_REQUIRED");
  assert(result.missing.includes("languageSamples"));
});

test("Forbidden uses are blocked", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake(
    { packet: packet() },
    { requestedUse: "PRESSURE_LANGUAGE" }
  );
  assert.strictEqual(result.status, "BLOCKED");
});

test("Allowed uses are allowed", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake(
    { packet: packet() },
    { requestedUse: "SAFE_LANGUAGE_CONTEXT" }
  );
  assert.notStrictEqual(result.status, "BLOCKED");
});

test("Inputs are not mutated", () => {
  const input = { packet: packet({ nested: { count: 1 } }) };
  const before = JSON.stringify(input);
  const result = buildNashManagerSafeLanguageGuardrailIntake(input);
  result.packet = { changed: true };
  assert.strictEqual(JSON.stringify(input), before);
});

test("No direct Nash runtime message or next-best-action imports", () => {
  const source = fs.readFileSync(path.join(__dirname, "../context-intake/nash-manager-safe-language-guardrail-intake.js"), "utf8");
  assert(!source.includes("nash-core-engine"));
  assert(!source.includes("nash-next-best-action-engine"));
  assert(!source.includes("nash-message-recommendation-engine"));
});

test("All truth and action flags remain false except context markers", () => {
  const result = buildNashManagerSafeLanguageGuardrailIntake({ packet: packet() });
  assertFlagsFalse(result);
});

let pass = 0;
let fail = 0;

console.log("\nFORGE NASH MANAGER SAFE LANGUAGE GUARDRAIL INTAKE MASTER TEST v1.0\n");

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
