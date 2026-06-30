"use strict";

const assert = require("assert");

const {
  ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS,
  ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES,
  buildEngagementManagerContextIntakeBoundary
} = require("../context-intake/engagement-manager-context-intake-boundary-contract");

console.log("\nFORGE ENGAGEMENT MANAGER CONTEXT INTAKE BOUNDARY CONTRACT MASTER TEST v1.0\n");

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
  packetId: "engagement-001",
  evidenceSources: ["manager-external-context-bridge", "manager-external-context-bridge"],
  sourceOwners: ["manager-os", "manager-os"],
  freshness: { status: "FRESH", asOf: "2026-06-29" },
  supportSignals: ["Needs meeting clarity."],
  frictionSignals: ["Follow-up timing is unclear."],
  languageSamples: ["Invite with support context only."],
  requestedUses: ["ENGAGEMENT_SUPPORT_CONTEXT_INTAKE"]
};

test("Missing Engagement manager context packet becomes UNKNOWN, not zero", () => {
  const result = buildEngagementManagerContextIntakeBoundary();
  assert.strictEqual(result.status, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.UNKNOWN);
  assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW);
  assert(result.missing.includes("engagementManagerContextPacket"));
});

test("Missing evidence requires review", () => {
  const packet = { ...validPacket, evidenceSources: [] };
  const result = buildEngagementManagerContextIntakeBoundary(packet);
  assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW);
  assert(result.missing.includes("evidenceSources"));
});

test("Missing source owner requires review", () => {
  const packet = { ...validPacket, sourceOwners: [] };
  const result = buildEngagementManagerContextIntakeBoundary(packet);
  assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW);
  assert(result.missing.includes("sourceOwners"));
});

test("Missing freshness requires review", () => {
  const packet = { ...validPacket };
  delete packet.freshness;
  const result = buildEngagementManagerContextIntakeBoundary(packet);
  assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW);
  assert.strictEqual(result.freshness.status, "UNKNOWN");
});

test("Stale packet requires review", () => {
  const packet = { ...validPacket, freshness: { status: "STALE" } };
  const result = buildEngagementManagerContextIntakeBoundary(packet);
  assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW);
});

test("Blocked periods remain review-required, not zero", () => {
  const packet = { ...validPacket, blockedPeriods: ["holiday-week"] };
  const result = buildEngagementManagerContextIntakeBoundary(packet);
  assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW);
  assert(result.limitations.includes("blocked_period_context_present"));
});

test("Explicit zero values are context warnings only", () => {
  const packet = { ...validPacket, supportContext: { energySignalCount: 0 } };
  const result = buildEngagementManagerContextIntakeBoundary(packet);
  assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW);
  assert(result.defaultZeroRisks.includes("supportContext.energySignalCount"));
  assert.strictEqual(result.truthFlags.createsMotivationTruth, false);
});

test("Forbidden engagement runtime execution use is blocked", () => {
  const result = buildEngagementManagerContextIntakeBoundary(validPacket, {
    requestedUses: ["ENGAGEMENT_RUNTIME_EXECUTION"]
  });
  assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK);
});

test("Forbidden private intent motivation diagnosis and Purpose Vault uses are blocked", () => {
  for (const use of [
    "PRIVATE_INTENT_TRUTH",
    "MOTIVATION_TRUTH_CREATION",
    "EMOTIONAL_DIAGNOSIS",
    "BURNOUT_DIAGNOSIS",
    "PSYCHOLOGICAL_PROFILE_TRUTH",
    "PURPOSE_VAULT_READ"
  ]) {
    const result = buildEngagementManagerContextIntakeBoundary(validPacket, { requestedUses: [use] });
    assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK);
  }
});

test("Forbidden manipulation message task calendar and HR uses are blocked", () => {
  for (const use of [
    "MANIPULATION",
    "SHAME_MECHANICS",
    "SCARCITY_PRESSURE",
    "MESSAGE_SEND",
    "DRAFT_CREATE",
    "TASK_CREATE",
    "CALENDAR_WRITE",
    "HR_DECISION",
    "HUMAN_RANKING"
  ]) {
    const result = buildEngagementManagerContextIntakeBoundary(validPacket, { requestedUses: [use] });
    assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK);
  }
});

test("Allowed intake uses are allowed", () => {
  const result = buildEngagementManagerContextIntakeBoundary(validPacket, {
    requestedUses: ["ENGAGEMENT_SUPPORT_CONTEXT_INTAKE"]
  });
  assert.strictEqual(result.decision, ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.ALLOW);
});

test("Inputs are not mutated", () => {
  const before = JSON.stringify(validPacket);
  buildEngagementManagerContextIntakeBoundary(validPacket);
  assert.strictEqual(JSON.stringify(validPacket), before);
});

test("Evidence source and sourceOwners dedupe", () => {
  const result = buildEngagementManagerContextIntakeBoundary(validPacket);
  assert.deepStrictEqual(result.evidenceSources, ["manager-external-context-bridge"]);
  assert.deepStrictEqual(result.sourceOwners, ["manager-os"]);
});

test("No actions writes executions or downstream truth flags remain false", () => {
  const result = buildEngagementManagerContextIntakeBoundary(validPacket);
  assert.strictEqual(result.truthFlags.automaticDecisionAllowed, false);
  assert.strictEqual(result.truthFlags.createsPrivateIntentTruth, false);
  assert.strictEqual(result.truthFlags.createsMotivationTruth, false);
  assert.strictEqual(result.truthFlags.createsDownstreamTruth, false);
  assert.strictEqual(result.actionFlags.executesEngagementRuntime, false);
  assert.strictEqual(result.actionFlags.sendsMessage, false);
  assert.strictEqual(result.actionFlags.createsDraft, false);
  assert.strictEqual(result.actionFlags.createsTask, false);
  assert.strictEqual(result.actionFlags.writesCalendar, false);
});

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${fail}`);

if (fail > 0) process.exit(1);
