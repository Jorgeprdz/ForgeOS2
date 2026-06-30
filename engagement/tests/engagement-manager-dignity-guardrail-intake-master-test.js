"use strict";

const assert = require("assert");
const fs = require("fs");

const {
  buildEngagementManagerDignityGuardrailIntake
} = require("../context-intake/engagement-manager-dignity-guardrail-intake");

console.log("\nFORGE ENGAGEMENT MANAGER DIGNITY GUARDRAIL INTAKE MASTER TEST v1.0\n");

let total = 0;
let pass = 0;
let fail = 0;

function test(name, fn) {
  total += 1;
  try {
    fn();
    pass += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    fail += 1;
    console.log(`FAIL ${name}`);
    console.error(error);
  }
}

const basePacket = {
  packetId: "engagement-dignity-001",
  evidenceSources: ["manager-external-context-bridge"],
  sourceOwners: ["manager-os"],
  freshness: { status: "FRESH", asOf: "2026-06-29" },
  requestedUses: ["DIGNITY_REVIEW_CONTEXT"],
  languageSamples: ["Invite with support context only."]
};

function packetWith(sample) {
  return {
    ...basePacket,
    languageSamples: [sample]
  };
}

test("Builds dignity guardrail context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(basePacket);
  assert.strictEqual(result.decision, "ALLOW");
  assert.strictEqual(result.isContextOnly, true);
});

test("Flags manipulation language as review context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(packetWith("Use their fear to push commitment."));
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.dignityFindings.some((finding) => finding.category === "MANIPULATION"));
});

test("Flags shame language as review context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(packetWith("Make them feel guilty for not answering."));
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.dignityFindings.some((finding) => finding.category === "SHAME_MECHANICS"));
});

test("Flags scarcity pressure as review context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(packetWith("Use false urgency and last chance language."));
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.dignityFindings.some((finding) => finding.category === "SCARCITY_PRESSURE"));
});

test("Flags manager leverage as review context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(packetWith("Use your authority as manager leverage."));
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.dignityFindings.some((finding) => finding.category === "MANAGER_LEVERAGE"));
});

test("Flags client manipulation as review context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(packetWith("Use the client against them."));
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.dignityFindings.some((finding) => finding.category === "CLIENT_MANIPULATION"));
});

test("Flags hidden personalization as review context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(packetWith("Use hidden personalization based on personal weakness."));
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.dignityFindings.some((finding) => finding.category === "HIDDEN_PERSONALIZATION"));
});

test("Flags purpose leakage as review context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(packetWith("Use their private purpose from the Purpose Vault."));
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.dignityFindings.some((finding) => finding.category === "PURPOSE_LEAKAGE"));
});

test("Flags private intent claims as review context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(packetWith("They are lazy and lack commitment."));
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.dignityFindings.some((finding) => finding.category === "PRIVATE_INTENT_CLAIM"));
});

test("Flags diagnosis language as review context only", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(packetWith("This is a burnout diagnosis."));
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.dignityFindings.some((finding) => finding.category === "DIAGNOSIS_LANGUAGE"));
});

test("Safe language does not auto-rewrite send task or escalate", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(basePacket);
  assert.strictEqual(result.decision, "ALLOW");
  assert.strictEqual(result.actionFlags.sendsMessage, false);
  assert.strictEqual(result.actionFlags.createsDraft, false);
  assert.strictEqual(result.actionFlags.createsTask, false);
  assert.strictEqual(result.actionFlags.writesCalendar, false);
});

test("Missing language samples remains UNKNOWN/review context, not zero", () => {
  const packet = { ...basePacket, languageSamples: [] };
  const result = buildEngagementManagerDignityGuardrailIntake(packet);
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.missing.includes("languageSamples"));
});

test("Forbidden uses are blocked", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(basePacket, {
    requestedUses: ["HIDDEN_PERSONALIZATION"]
  });
  assert.strictEqual(result.decision, "BLOCK");
});

test("Allowed uses are allowed", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(basePacket, {
    requestedUses: ["DIGNITY_REVIEW_CONTEXT"]
  });
  assert.strictEqual(result.decision, "ALLOW");
});

test("Inputs are not mutated", () => {
  const before = JSON.stringify(basePacket);
  buildEngagementManagerDignityGuardrailIntake(basePacket);
  assert.strictEqual(JSON.stringify(basePacket), before);
});

test("No direct engagement runtime message or task imports", () => {
  const source = fs.readFileSync(
    "engagement/context-intake/engagement-manager-dignity-guardrail-intake.js",
    "utf8"
  );
  const importLines = source.split(/\r?\n/).filter((line) => line.includes("require(") || line.includes(" from "));
  assert(!importLines.some((line) => /engagement-runtime|engagement-core|purpose-vault|gmail|calendar|task-engine/.test(line)));
});

test("All truth and action flags remain false except context markers", () => {
  const result = buildEngagementManagerDignityGuardrailIntake(basePacket);
  assert.strictEqual(result.truthFlags.createsMotivationTruth, false);
  assert.strictEqual(result.truthFlags.createsPrivateIntentTruth, false);
  assert.strictEqual(result.truthFlags.createsDownstreamTruth, false);
  assert.strictEqual(result.actionFlags.executesAdapter, false);
});

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${fail}`);

if (fail > 0) process.exit(1);
