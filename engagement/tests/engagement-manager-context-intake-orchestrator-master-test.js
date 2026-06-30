"use strict";

const assert = require("assert");
const fs = require("fs");

const {
  buildEngagementManagerContextIntake
} = require("../context-intake/engagement-manager-context-intake-orchestrator");

console.log("\nFORGE ENGAGEMENT MANAGER CONTEXT INTAKE ORCHESTRATOR MASTER TEST v1.0\n");

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

const sanitizedPacket = {
  packetId: "engagement-orchestrator-001",
  evidenceSources: ["manager-external-context-bridge", "manager-external-context-bridge"],
  sourceOwners: ["manager-os", "manager-os"],
  freshness: { status: "FRESH", asOf: "2026-06-29" },
  requestedUses: ["ENGAGEMENT_SUPPORT_CONTEXT_INTAKE"],
  privateMotivationContext: {
    supportSignals: ["Needs clarity and a simple next step."],
    frictionSignals: ["Timing uncertainty."],
    energyContext: ["Late day response pattern is context only."],
    progressContext: ["Recent movement exists."],
    safeStreakContext: ["Streak is support context only."],
    languageSamples: ["Invite with support context only."]
  }
};

const validInput = {
  managerExternalContextBridgePacket: {
    engagementSupportPacket: sanitizedPacket
  }
};

test("Combines packet validation private motivation intake and dignity guardrails", () => {
  const result = buildEngagementManagerContextIntake(validInput);
  assert.strictEqual(result.decision, "ALLOW");
  assert.strictEqual(result.boundary.kind, "ENGAGEMENT_MANAGER_CONTEXT_INTAKE_BOUNDARY");
  assert.strictEqual(result.privateMotivationPacket.kind, "ENGAGEMENT_MANAGER_PRIVATE_MOTIVATION_PACKET_INTAKE");
  assert.strictEqual(result.dignityGuardrails.kind, "ENGAGEMENT_MANAGER_DIGNITY_GUARDRAIL_INTAKE");
});

test("Uses Manager OS External Context Bridge sanitized packet only", () => {
  const result = buildEngagementManagerContextIntake(validInput);
  assert.strictEqual(result.sanitizedPacketSource, "managerExternalContextBridgePacket");
});

test("Does not mutate inputs", () => {
  const before = JSON.stringify(validInput);
  buildEngagementManagerContextIntake(validInput);
  assert.strictEqual(JSON.stringify(validInput), before);
});

test("Merges and dedupes evidence source owners", () => {
  const result = buildEngagementManagerContextIntake(validInput);
  assert.deepStrictEqual(result.evidenceSources, ["manager-external-context-bridge"]);
  assert.deepStrictEqual(result.sourceOwners, ["manager-os"]);
});

test("Propagates warnings limitations missing unknown stale and defaultZero risks", () => {
  const input = {
    managerExternalContextBridgePacket: {
      engagementSupportPacket: {
        ...sanitizedPacket,
        freshness: { status: "STALE" },
        blockedPeriods: ["holiday-week"],
        supportContext: { count: 0 },
        privateMotivationContext: {
          supportSignals: [],
          languageSamples: ["Use false urgency to force response."]
        }
      }
    }
  };

  const result = buildEngagementManagerContextIntake(input);
  assert.strictEqual(result.decision, "REVIEW");
  assert(result.warnings.length > 0);
  assert(result.limitations.length > 0);
  assert(result.defaultZeroRisks.length > 0);
});

test("Blocks forbidden uses", () => {
  const result = buildEngagementManagerContextIntake(validInput, {
    requestedUses: ["MOTIVATION_TRUTH_CREATION"]
  });
  assert.strictEqual(result.decision, "BLOCK");
});

test("Allows intake context uses", () => {
  const result = buildEngagementManagerContextIntake(validInput, {
    requestedUses: ["ENGAGEMENT_SUPPORT_CONTEXT_INTAKE"]
  });
  assert.strictEqual(result.decision, "ALLOW");
});

test("Executive summary is context only, not automatic decision", () => {
  const result = buildEngagementManagerContextIntake(validInput);
  assert(result.executiveSummary.includes("human review only"));
  assert.strictEqual(result.truthFlags.automaticDecisionAllowed, false);
});

test("Creates no messages drafts tasks calendar events writes or external executions", () => {
  const result = buildEngagementManagerContextIntake(validInput);
  assert.strictEqual(result.actionFlags.sendsMessage, false);
  assert.strictEqual(result.actionFlags.createsDraft, false);
  assert.strictEqual(result.actionFlags.createsTask, false);
  assert.strictEqual(result.actionFlags.writesCalendar, false);
  assert.strictEqual(result.actionFlags.executesAdapter, false);
});

test("No direct Advisor OS or raw Manager OS imports", () => {
  const source = fs.readFileSync(
    "engagement/context-intake/engagement-manager-context-intake-orchestrator.js",
    "utf8"
  );
  const importLines = source.split(/\r?\n/).filter((line) => line.includes("require(") || line.includes(" from "));
  assert(!importLines.some((line) => /advisor-os|manager-os/.test(line)));
});

test("No direct engagement runtime Purpose Vault scoring or diagnosis imports", () => {
  const source = fs.readFileSync(
    "engagement/context-intake/engagement-manager-context-intake-orchestrator.js",
    "utf8"
  );
  const importLines = source.split(/\r?\n/).filter((line) => line.includes("require(") || line.includes(" from "));
  assert(!importLines.some((line) => /engagement-runtime|engagement-core|purpose-vault|motivation-score|emotional-score|burnout-score|psychological-profile/.test(line)));
});

test("No compensation revenue payout lifecycle product imports", () => {
  const source = fs.readFileSync(
    "engagement/context-intake/engagement-manager-context-intake-orchestrator.js",
    "utf8"
  );
  const importLines = source.split(/\r?\n/).filter((line) => line.includes("require(") || line.includes(" from "));
  assert(!importLines.some((line) => /compensation|revenue|payout|advisor-lifecycle|product-intelligence/.test(line)));
});

test("All truth write and action flags remain false", () => {
  const result = buildEngagementManagerContextIntake(validInput);
  assert.strictEqual(result.truthFlags.createsPrivateIntentTruth, false);
  assert.strictEqual(result.truthFlags.createsMotivationTruth, false);
  assert.strictEqual(result.truthFlags.createsEmotionalDiagnosis, false);
  assert.strictEqual(result.truthFlags.createsBurnoutDiagnosis, false);
  assert.strictEqual(result.truthFlags.createsPsychologicalProfileTruth, false);
  assert.strictEqual(result.truthFlags.createsDownstreamTruth, false);
});

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${fail}`);

if (fail > 0) process.exit(1);
