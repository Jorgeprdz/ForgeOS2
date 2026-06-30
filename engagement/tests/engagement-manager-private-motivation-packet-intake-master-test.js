"use strict";

const assert = require("assert");
const fs = require("fs");

const {
  buildEngagementManagerPrivateMotivationPacketIntake
} = require("../context-intake/engagement-manager-private-motivation-packet-intake");

console.log("\nFORGE ENGAGEMENT MANAGER PRIVATE MOTIVATION PACKET INTAKE MASTER TEST v1.0\n");

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

const validPacket = {
  packetId: "engagement-private-001",
  evidenceSources: ["manager-external-context-bridge"],
  sourceOwners: ["manager-os"],
  freshness: { status: "FRESH", asOf: "2026-06-29" },
  requestedUses: ["PRIVATE_MOTIVATION_REVIEW_CONTEXT"],
  privateMotivationContext: {
    supportSignals: ["Needs a low-friction next step."],
    frictionSignals: ["Agenda is unclear."],
    energyContext: ["Late-week follow-up may be better."],
    progressContext: ["Recent activity exists."],
    safeStreakContext: ["Streak is context only."],
    languageSamples: ["Offer support context only."]
  }
};

test("Builds private motivation review context only", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket);
  assert.strictEqual(result.decision, "ALLOW");
  assert.strictEqual(result.isContextOnly, true);
  assert.strictEqual(result.createsPrivateMotivationReviewContext, true);
  assert(result.privateMotivationReviewAreas.length >= 4);
});

test("Engagement private motivation intake does not execute engagement runtime", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket);
  assert.strictEqual(result.actionFlags.executesEngagementRuntime, false);
});

test("Engagement private motivation intake does not create private intent or motivation truth", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket);
  assert.strictEqual(result.truthFlags.createsPrivateIntentTruth, false);
  assert.strictEqual(result.truthFlags.createsMotivationTruth, false);
});

test("Engagement private motivation intake does not create emotional burnout or psychological diagnosis", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket);
  assert.strictEqual(result.truthFlags.createsEmotionalDiagnosis, false);
  assert.strictEqual(result.truthFlags.createsBurnoutDiagnosis, false);
  assert.strictEqual(result.truthFlags.createsPsychologicalProfileTruth, false);
});

test("Engagement private motivation intake does not read or write Purpose Vault", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket);
  assert.strictEqual(result.truthFlags.readsPurposeVault, false);
  assert.strictEqual(result.truthFlags.writesPurposeVault, false);
});

test("Engagement private motivation intake does not send messages create drafts tasks or calendar writes", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket);
  assert.strictEqual(result.actionFlags.sendsMessage, false);
  assert.strictEqual(result.actionFlags.createsDraft, false);
  assert.strictEqual(result.actionFlags.createsTask, false);
  assert.strictEqual(result.actionFlags.writesCalendar, false);
});

test("Private motivation areas are evidence review context", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket);
  assert(result.privateMotivationReviewAreas.every((area) => area.isEvidenceReviewContextOnly === true));
});

test("Missing packet remains UNKNOWN, not zero", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake();
  assert.strictEqual(result.status, "UNKNOWN");
  assert.strictEqual(result.decision, "REVIEW");
});

test("Missing and stale context propagate review requirements", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake({
    ...validPacket,
    freshness: { status: "STALE" }
  });
  assert.strictEqual(result.decision, "REVIEW");
});

test("Forbidden uses are blocked", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket, {
    requestedUses: ["MOTIVATION_TRUTH_CREATION"]
  });
  assert.strictEqual(result.decision, "BLOCK");
});

test("Allowed uses are allowed", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket, {
    requestedUses: ["PRIVATE_MOTIVATION_REVIEW_CONTEXT"]
  });
  assert.strictEqual(result.decision, "ALLOW");
});

test("Inputs are not mutated", () => {
  const before = JSON.stringify(validPacket);
  buildEngagementManagerPrivateMotivationPacketIntake(validPacket);
  assert.strictEqual(JSON.stringify(validPacket), before);
});

test("No direct engagement runtime imports", () => {
  const source = fs.readFileSync(
    "engagement/context-intake/engagement-manager-private-motivation-packet-intake.js",
    "utf8"
  );
  const importLines = source.split(/\r?\n/).filter((line) => line.includes("require(") || line.includes(" from "));
  assert(!importLines.some((line) => /engagement-runtime|engagement-core|purpose-vault|motivation-score|burnout-score|psychological-profile/.test(line)));
});

test("All truth and action flags remain false except context markers", () => {
  const result = buildEngagementManagerPrivateMotivationPacketIntake(validPacket);
  assert.strictEqual(result.truthFlags.createsDownstreamTruth, false);
  assert.strictEqual(result.truthFlags.createsHRTruth, false);
  assert.strictEqual(result.truthFlags.createsRevenueTruth, false);
  assert.strictEqual(result.truthFlags.createsCompensationTruth, false);
  assert.strictEqual(result.actionFlags.executesAdapter, false);
});

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${fail}`);

if (fail > 0) process.exit(1);
