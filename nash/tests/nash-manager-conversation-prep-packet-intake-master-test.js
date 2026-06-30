"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  buildNashManagerConversationPrepPacketIntake
} = require("../context-intake/nash-manager-conversation-prep-packet-intake");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function packet(extra = {}) {
  return {
    packetType: "MANAGER_OS_NASH_CONVERSATION_PREP_PACKET",
    suggestedQuestionAreas: ["What evidence should we review?", "What support is needed?"],
    evidenceToReview: ["review-plan-context", "coaching-context"],
    conversationGuardrails: ["No pressure.", "No invented intent."],
    evidenceSources: ["manager-external-context-bridge"],
    sourceOwners: ["Manager OS"],
    freshness: "CURRENT",
    ...extra
  };
}

function assertNoActionTruth(result) {
  assert.strictEqual(result.executesNashRuntime, false);
  assert.strictEqual(result.executesNextBestAction, false);
  assert.strictEqual(result.sendsMessages, false);
  assert.strictEqual(result.createsDrafts, false);
  assert.strictEqual(result.createsTasks, false);
  assert.strictEqual(result.createsCalendarEvents, false);
  assert.strictEqual(result.generatesPressureLanguage, false);
  assert.strictEqual(result.truthFlags.automaticDecisionAllowed, false);
}

test("Builds Nash conversation prep context only", () => {
  const result = buildNashManagerConversationPrepPacketIntake({ packet: packet() });
  assert.strictEqual(result.conversationPrepContextOnly, true);
  assert(result.questionAreas.includes("What evidence should we review?"));
  assert(result.evidenceToReview.includes("review-plan-context"));
});

test("Nash conversation prep intake does not execute Nash runtime", () => {
  const result = buildNashManagerConversationPrepPacketIntake({ packet: packet() });
  assert.strictEqual(result.executesNashRuntime, false);
  assert.strictEqual(result.boundary.actionFlags.executesNashRuntime, false);
});

test("Nash conversation prep intake does not create next-best-action execution", () => {
  const result = buildNashManagerConversationPrepPacketIntake({ packet: packet() });
  assert.strictEqual(result.executesNextBestAction, false);
  assert.strictEqual(result.boundary.actionFlags.executesNextBestAction, false);
});

test("Nash conversation prep intake does not send messages or create drafts", () => {
  const result = buildNashManagerConversationPrepPacketIntake({ packet: packet() });
  assert.strictEqual(result.sendsMessages, false);
  assert.strictEqual(result.createsDrafts, false);
  assert.strictEqual(result.createsFinalMessage, false);
});

test("Nash suggested question areas are evidence review context", () => {
  const result = buildNashManagerConversationPrepPacketIntake({ packet: packet() });
  assert.strictEqual(result.suggestedQuestionAreasAreReviewContextOnly, true);
  assert(result.questionAreas.length >= 2);
});

test("Missing packet remains UNKNOWN, not zero", () => {
  const result = buildNashManagerConversationPrepPacketIntake({});
  assert.strictEqual(result.status, "UNKNOWN");
  assert(result.missing.includes("nashManagerContextPacket"));
});

test("Missing and stale context propagate review requirements", () => {
  const result = buildNashManagerConversationPrepPacketIntake({
    packet: packet({ freshnessStatus: "STALE", suggestedQuestionAreas: [] })
  });
  assert.strictEqual(result.status, "REVIEW_REQUIRED");
  assert(result.stale.includes("nashManagerContextPacket"));
  assert(result.missing.includes("questionAreas"));
});

test("Forbidden uses are blocked", () => {
  const result = buildNashManagerConversationPrepPacketIntake(
    { packet: packet() },
    { requestedUse: "MESSAGE_SEND" }
  );
  assert.strictEqual(result.status, "BLOCKED");
});

test("Allowed uses are allowed", () => {
  const result = buildNashManagerConversationPrepPacketIntake(
    { packet: packet() },
    { requestedUse: "NASH_CONVERSATION_PREP_INTAKE" }
  );
  assert.notStrictEqual(result.status, "BLOCKED");
});

test("Inputs are not mutated", () => {
  const input = { packet: packet({ nested: { count: 1 } }) };
  const before = JSON.stringify(input);
  const result = buildNashManagerConversationPrepPacketIntake(input);
  result.packet.nested.count = 5;
  assert.strictEqual(JSON.stringify(input), before);
});

test("No direct Nash runtime or next-best-action imports", () => {
  const source = fs.readFileSync(path.join(__dirname, "../context-intake/nash-manager-conversation-prep-packet-intake.js"), "utf8");
  assert(!source.includes("nash-core-engine"));
  assert(!source.includes("nash-master-intelligence-engine"));
  assert(!source.includes("nash-next-best-action-engine"));
  assert(!source.includes("nash-message-recommendation-engine"));
});

test("All truth and action flags remain false except context markers", () => {
  const result = buildNashManagerConversationPrepPacketIntake({ packet: packet() });
  assertNoActionTruth(result);
});

let pass = 0;
let fail = 0;

console.log("\nFORGE NASH MANAGER CONVERSATION PREP PACKET INTAKE MASTER TEST v1.0\n");

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
