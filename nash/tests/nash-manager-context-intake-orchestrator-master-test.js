"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  buildNashManagerContextIntake
} = require("../context-intake/nash-manager-context-intake-orchestrator");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function bridgeInput(extraPacket = {}, extraInput = {}) {
  return {
    managerExternalContextBridge: {
      nashConversationContext: {
        packetType: "MANAGER_OS_NASH_CONVERSATION_PREP_PACKET",
        suggestedQuestionAreas: ["What evidence should we review?", "What support is needed?"],
        evidenceToReview: ["review-plan-context", "coaching-context"],
        conversationGuardrails: ["No pressure language.", "No invented intent."],
        languageSamples: ["Can we review what support would help this week?"],
        evidenceSources: ["manager-external-context-bridge", "manager-external-context-bridge"],
        sourceOwners: ["Manager OS", "Manager OS"],
        freshness: "CURRENT",
        ...extraPacket
      }
    },
    ...extraInput
  };
}

function assertNoActions(result) {
  assert.strictEqual(result.actionsCreated, false);
  assert.strictEqual(result.writesCreated, false);
  assert.strictEqual(result.externalExecutionCreated, false);
  assert.strictEqual(result.downstreamTruthCreated, false);
  assert.strictEqual(result.executesNashRuntime, false);
  assert.strictEqual(result.executesNextBestAction, false);
  assert.strictEqual(result.sendsMessages, false);
  assert.strictEqual(result.createsDrafts, false);
  assert.strictEqual(result.createsTasks, false);
  assert.strictEqual(result.createsCalendarEvents, false);
  assert.strictEqual(result.generatesPressureLanguage, false);
  assert.strictEqual(result.manipulatesConversation, false);
  assert.strictEqual(result.infersInventedIntent, false);
}

test("Combines packet validation question-area intake and safe-language guardrails", () => {
  const result = buildNashManagerContextIntake(bridgeInput());
  assert.strictEqual(result.nashReadyContextOnly, true);
  assert(result.conversationPrepPacketIntake.questionAreas.length >= 2);
  assert(Array.isArray(result.safeLanguageGuardrailIntake.unsafeLanguageFindings));
});

test("Uses Manager OS External Context Bridge sanitized packet only", () => {
  const result = buildNashManagerContextIntake(bridgeInput());
  assert.strictEqual(result.sanitizedManagerContextOnly, true);
  assert.strictEqual(result.packet.packetType, "MANAGER_OS_NASH_CONVERSATION_PREP_PACKET");
});

test("Does not mutate inputs", () => {
  const input = bridgeInput({ nested: { count: 1 } });
  const before = JSON.stringify(input);
  const result = buildNashManagerContextIntake(input);
  result.packet.nested.count = 8;
  assert.strictEqual(JSON.stringify(input), before);
});

test("Merges and dedupes evidence source owners", () => {
  const result = buildNashManagerContextIntake(bridgeInput({
    evidenceSources: ["bridge", "bridge", "review-plan"],
    sourceOwners: ["Manager OS", "Manager OS", "Nash Intake"]
  }));
  assert.deepStrictEqual(result.evidenceSources, ["bridge", "review-plan"]);
  assert.deepStrictEqual(result.sourceOwners, ["Manager OS", "Nash Intake"]);
});

test("Propagates warnings limitations missing unknown stale and defaultZero risks", () => {
  const result = buildNashManagerContextIntake(bridgeInput({
    warnings: ["warning-a"],
    limitations: ["limitation-a"],
    freshnessStatus: "STALE",
    missedFollowups: 0,
    suggestedQuestionAreas: []
  }));
  assert(result.warnings.includes("warning-a"));
  assert(result.limitations.includes("limitation-a"));
  assert(result.stale.includes("nashManagerContextPacket"));
  assert(result.defaultZeroWarnings.some((item) => item.includes("missedFollowups")));
  assert(result.missing.includes("questionAreas"));
});

test("Blocks forbidden uses", () => {
  const result = buildNashManagerContextIntake(bridgeInput(), { requestedUse: "NASH_RUNTIME_EXECUTION" });
  assert.strictEqual(result.status, "BLOCKED");
  assert.strictEqual(result.executesNashRuntime, false);
});

test("Allows intake context uses", () => {
  const result = buildNashManagerContextIntake(bridgeInput(), { requestedUse: "MANAGER_CONTEXT_INTAKE" });
  assert.notStrictEqual(result.status, "BLOCKED");
});

test("Executive summary is context only, not automatic decision", () => {
  const result = buildNashManagerContextIntake(bridgeInput());
  assert.strictEqual(result.executiveSummary.contextOnly, true);
  assert.strictEqual(result.executiveSummary.notAutomaticDecision, true);
  assert.strictEqual(result.truthFlags.automaticDecisionAllowed, false);
});

test("Creates no messages drafts tasks calendar events writes or external executions", () => {
  const result = buildNashManagerContextIntake(bridgeInput());
  assertNoActions(result);
});

test("No direct Advisor OS or raw Manager OS imports", () => {
  const files = [
    "../context-intake/nash-manager-context-intake-orchestrator.js",
    "../context-intake/nash-manager-conversation-prep-packet-intake.js",
    "../context-intake/nash-manager-safe-language-guardrail-intake.js",
    "../context-intake/nash-manager-context-intake-boundary-contract.js"
  ];

  const source = files.map((file) => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");
  assert(!source.includes("advisor-os/"));
  assert(!source.includes("manager-os/"));
});

test("No direct Nash runtime message recommendation or next-best-action imports", () => {
  const files = [
    "../context-intake/nash-manager-context-intake-orchestrator.js",
    "../context-intake/nash-manager-conversation-prep-packet-intake.js",
    "../context-intake/nash-manager-safe-language-guardrail-intake.js"
  ];

  const source = files.map((file) => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");
  assert(!source.includes("nash-core-engine"));
  assert(!source.includes("nash-master-intelligence-engine"));
  assert(!source.includes("nash-next-best-action-engine"));
  assert(!source.includes("nash-message-recommendation-engine"));
});

test("No compensation revenue payout lifecycle product imports", () => {
  const source = fs.readFileSync(path.join(__dirname, "../context-intake/nash-manager-context-intake-orchestrator.js"), "utf8");
  assert(!source.includes("compensation/"));
  assert(!source.includes("revenue/"));
  assert(!source.includes("payout"));
  assert(!source.includes("advisor-lifecycle"));
  assert(!source.includes("product-intelligence"));
});

test("All truth write and action flags remain false", () => {
  const result = buildNashManagerContextIntake(bridgeInput());
  for (const value of Object.values(result.truthFlags)) assert.strictEqual(value, false);
  for (const value of Object.values(result.writeFlags)) assert.strictEqual(value, false);
  for (const value of Object.values(result.actionFlags)) assert.strictEqual(value, false);
});

let pass = 0;
let fail = 0;

console.log("\nFORGE NASH MANAGER CONTEXT INTAKE ORCHESTRATOR MASTER TEST v1.0\n");

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
