"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  buildGenesisBetaLoopOrchestrator,
  GENESIS_BETA_LOOP_STATUSES,
  GENESIS_BETA_LOOP_DECISIONS,
} = require("../genesis-beta-loop/genesis-beta-loop-orchestrator-boundary-contract");

let passed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function adapters() {
  return {
    nashMickNba: () => ({ reasonWhy: "Retomar porque la ventana puede enfriarse." }),
    promptBuilder: () => ({ promptInstruction: "Mensaje ligero sin presion." }),
    draftIntake: (input) => ({ draftText: input.draftText, safeForSend: false }),
    safetyValidator: () => ({ safeForHumanReview: true, safeForSend: false }),
    humanApprovalGate: (input) => ({
      approvalGateStatus: input.action === "APPROVE"
        ? "APPROVED_FOR_DELIVERY_PREPARATION"
        : "READY_FOR_HUMAN_REVIEW",
    }),
    deliveryAdapter: (input) => ({
      status: "DELIVERY_CANDIDATE_PREPARED",
      channel: input.channel,
      sendsMessage: false,
    }),
  };
}

function validInput() {
  return {
    protectedContext: { managerId: "jorge", prospectName: "Maria" },
    nashContext: { angle: "follow-up" },
    mickContext: { lastContactDaysAgo: 15 },
    draftText: "Hola Maria, te escribo para retomar nuestra conversacion sin presion.",
    humanApproval: { reviewer: "Jorge", action: "APPROVE", artifactHash: "hash-123" },
    delivery: { channel: "whatsapp", recipientDestination: "+525500000000" },
    evidenceRefs: ["ev-1", "ev-1"],
    sourceOwners: ["manager-context", "manager-context"],
    freshness: "FRESH",
  };
}

test("full loop prepares delivery candidate without sending", () => {
  const out = buildGenesisBetaLoopOrchestrator(validInput(), adapters());
  assert.strictEqual(out.status, GENESIS_BETA_LOOP_STATUSES.DELIVERY_CANDIDATE_PREPARED);
  assert.strictEqual(out.decision, GENESIS_BETA_LOOP_DECISIONS.PREPARE_DELIVERY_CANDIDATE);
  assert.strictEqual(out.sendsMessage, false);
  assert.strictEqual(out.executesSend, false);
  assert.strictEqual(out.stages.deliveryCandidate.sendsMessage, false);
});

test("missing draft blocks later draft/safety/delivery path", () => {
  const input = validInput();
  delete input.draftText;
  const out = buildGenesisBetaLoopOrchestrator(input, adapters());
  assert.strictEqual(out.status, GENESIS_BETA_LOOP_STATUSES.NEEDS_DRAFT);
  assert.ok(out.blockedStages.includes("DRAFT_REQUIRED"));
  assert.strictEqual(out.stages.draftIntake, null);
  assert.strictEqual(out.stages.safetyValidator, null);
});

test("missing human approval blocks delivery", () => {
  const input = validInput();
  delete input.humanApproval;
  const out = buildGenesisBetaLoopOrchestrator(input, adapters());
  assert.strictEqual(out.status, GENESIS_BETA_LOOP_STATUSES.NEEDS_HUMAN_APPROVAL);
  assert.ok(out.blockedStages.includes("HUMAN_APPROVAL_REQUIRED"));
  assert.strictEqual(out.stages.deliveryCandidate, null);
});

test("non-approved human gate blocks delivery", () => {
  const input = validInput();
  input.humanApproval.action = "REQUEST_CHANGES";
  const out = buildGenesisBetaLoopOrchestrator(input, adapters());
  assert.strictEqual(out.status, GENESIS_BETA_LOOP_STATUSES.NEEDS_HUMAN_APPROVAL);
  assert.ok(out.blockedStages.includes("APPROVED_FOR_DELIVERY_PREPARATION_REQUIRED"));
  assert.strictEqual(out.stages.deliveryCandidate, null);
});

test("inputs are not mutated", () => {
  const input = validInput();
  const before = JSON.stringify(input);
  buildGenesisBetaLoopOrchestrator(input, adapters());
  assert.strictEqual(JSON.stringify(input), before);
});

test("dedupes evidence and source owners", () => {
  const out = buildGenesisBetaLoopOrchestrator(validInput(), adapters());
  assert.deepStrictEqual(out.evidenceRefs, ["ev-1"]);
  assert.deepStrictEqual(out.sourceOwners, ["manager-context"]);
});

test("all prohibited flags remain false", () => {
  const out = buildGenesisBetaLoopOrchestrator(validInput(), adapters());
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
});

test("boundaries remain explicit", () => {
  const out = buildGenesisBetaLoopOrchestrator(validInput(), adapters());
  assert.strictEqual(out.humanApprovalRequired, true);
  assert.strictEqual(out.deliveryCandidateOnly, true);
  assert.strictEqual(out.sendExecutionRequiredSeparately, true);
  assert.ok(out.boundaries.includes("Delivery candidate is not send"));
  assert.ok(out.boundaries.includes("Send Execution Gate remains separate"));
});

test("missing adapters become warnings, not runtime execution", () => {
  const out = buildGenesisBetaLoopOrchestrator(validInput(), {});
  assert.ok(out.warnings.length >= 1);
  assert.strictEqual(out.sendsMessage, false);
  assert.strictEqual(out.executesProviderRuntime, false);
});

test("engine avoids forbidden runtime imports", () => {
  const source = fs.readFileSync(path.join(__dirname, "../genesis-beta-loop/genesis-beta-loop-orchestrator-boundary-contract.js"), "utf8");
  assert.ok(!/require\(['"](fs|child_process|http|https|net|dns|axios)['"]\)/.test(source));
  assert.ok(!/fetch\(|XMLHttpRequest|navigator\.sendBeacon|serviceWorker/.test(source));
  assert.ok(!source.includes("send-execution"));
});

for (const { name, fn } of tests) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`FAIL - ${name}`);
    console.error(error);
    process.exit(1);
  }
}
console.log(`Genesis Beta Loop Orchestrator Boundary Contract PASS ${passed}/${tests.length}`);
