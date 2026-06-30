"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  evaluateManagerMessagePromptBuilderBoundary,
  MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES
} = require("../message-generation/manager-message-prompt-builder-boundary-contract");

console.log("\nFORGE MANAGER MESSAGE PROMPT BUILDER BOUNDARY CONTRACT MASTER TEST v1.0\n");

const baseManagerContext = {
  managerId: "MANAGER_001",
  contextOnly: true,
  evidenceRefs: ["manager-ref", "shared-ref"],
  sourceEvidenceIds: ["manager-source", "shared-source"],
  sourceOwners: ["MANAGER_OS"],
  freshness: { status: "FRESH" }
};

const baseNashContext = {
  nashReadyContextOnly: true,
  questionAreas: ["candidate motivation"],
  conversationGuardrails: ["no pressure"],
  evidenceRefs: ["nash-ref", "shared-ref"],
  sourceEvidenceIds: ["nash-source", "shared-source"],
  sourceOwners: ["NASH_CONTEXT_INTAKE"],
  freshness: { status: "FRESH" }
};

function baseInput(overrides = {}) {
  return {
    managerContext: baseManagerContext,
    nashConversationContext: baseNashContext,
    messagePurpose: "CANDIDATE_CHECK_IN",
    audienceType: "CANDIDATE",
    requestedUse: "MANAGER_MESSAGE_PROMPT_PREP",
    evidenceRefs: ["input-ref", "shared-ref"],
    sourceEvidenceIds: ["input-source", "shared-source"],
    sourceOwners: ["MANAGER_OS"],
    freshness: { status: "FRESH" },
    period: { periodId: "2026-06" },
    ...overrides
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertFalseFlags(result) {
  assert.equal(result.humanApprovalRequired, true);
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsDraft, false);
  assert.equal(result.sendsMessage, false);
  assert.equal(result.createsTask, false);
  assert.equal(result.createsCalendarEvent, false);
  assert.equal(result.executesNashRuntime, false);
  assert.equal(result.executesLlmRuntime, false);
  assert.equal(result.executesLegacyNashMessageEngine, false);
  assert.equal(result.executesNextBestAction, false);
  assert.equal(result.createsDownstreamTruth, false);
  assert.equal(result.createsManagerJudgmentTruth, false);
  assert.equal(result.createsHumanRankingTruth, false);
  assert.equal(result.createsPromotionDecisionTruth, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsRevenue, false);
  assert.equal(result.createsCompensation, false);
  assert.equal(result.createsPayoutTruth, false);
}

const tests = [
  ["Missing manager Nash context becomes needs context not zero", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput({ managerContext: null, nashConversationContext: null }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_CONTEXT);
    assert.ok(result.missingContext.includes("managerContext_missing"));
    assert.ok(result.missingContext.includes("nashConversationContext_missing"));
    assertFalseFlags(result);
  }],
  ["Missing evidence requires review", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput({ evidenceRefs: [], sourceEvidenceIds: [], managerContext: {}, nashConversationContext: {}, sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_EVIDENCE);
    assert.ok(result.confidenceLimitations.includes("missing_evidence"));
    assertFalseFlags(result);
  }],
  ["Missing source owner requires review", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput({ managerContext: {}, nashConversationContext: {}, evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: [], freshness: { status: "FRESH" } }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_SOURCE_OWNER);
    assert.ok(result.confidenceLimitations.includes("missing_source_owner"));
    assertFalseFlags(result);
  }],
  ["Missing freshness requires review", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput({ managerContext: {}, nashConversationContext: {}, evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: ["MANAGER_OS"], freshness: null }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_FRESHNESS);
    assert.ok(result.confidenceLimitations.includes("missing_freshness"));
    assertFalseFlags(result);
  }],
  ["Stale freshness requires review", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput({ freshness: { status: "STALE" } }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_FRESHNESS);
    assert.ok(result.staleContext.includes("freshness_stale"));
    assertFalseFlags(result);
  }],
  ["Explicit zero values create warnings only", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput({ managerContext: { candidateCount: 0, evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } } }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.NEEDS_HUMAN_REVIEW);
    assert.ok(result.warnings.some((warning) => warning.includes("explicit_zero")));
    assertFalseFlags(result);
  }],
  ["Forbidden uses are blocked", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput({ requestedUse: "SEND_MESSAGE" }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.BLOCKED);
    assert.ok(result.blockedUses.includes("SEND_MESSAGE"));
    assertFalseFlags(result);
  }],
  ["Allowed prompt prep uses are allowed", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput({ requestedUse: "FOLLOW_UP_PROMPT_PREP" }));
    assert.ok(result.allowedUses.includes("FOLLOW_UP_PROMPT_PREP"));
    assert.equal(result.blockedUses.length, 0);
    assertFalseFlags(result);
  }],
  ["Inputs are not mutated", () => {
    const input = baseInput();
    const original = clone(input);
    evaluateManagerMessagePromptBuilderBoundary(input);
    assert.deepEqual(input, original);
  }],
  ["Evidence refs source evidence IDs and source owners dedupe", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput());
    assert.equal(result.evidenceRefs.filter((item) => item === "shared-ref").length, 1);
    assert.equal(result.sourceEvidenceIds.filter((item) => item === "shared-source").length, 1);
    assert.equal(result.sourceOwners.filter((item) => item === "MANAGER_OS").length, 1);
    assertFalseFlags(result);
  }],
  ["Human approval is always required", () => {
    const result = evaluateManagerMessagePromptBuilderBoundary(baseInput());
    assert.equal(result.humanApprovalRequired, true);
    assert.equal(result.humanReviewRequired, true);
    assertFalseFlags(result);
  }],
  ["No drafts sends tasks calendars runtime or next best action execution are created", () => {
    assertFalseFlags(evaluateManagerMessagePromptBuilderBoundary(baseInput()));
  }],
  ["No forbidden imports exist in boundary contract", () => {
    const file = fs.readFileSync(path.join(__dirname, "../message-generation/manager-message-prompt-builder-boundary-contract.js"), "utf8");
    [
      "nash-core-engine",
      "nash-message-recommendation-engine",
      "nash-next-best-action-engine",
      "openai",
      "whatsapp",
      "sms",
      "compensation/",
      "revenue/",
      "advisor-lifecycle/",
      "product-intelligence/",
      "schemas/",
      "fixtures/"
    ].forEach((text) => assert.equal(file.includes(text), false));
  }]
];

let passed = 0;
let failed = 0;
tests.forEach(([name, run]) => {
  try {
    run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
});
console.log("\nResumen:");
console.log(`Total: ${tests.length}`);
console.log(`Pass: ${passed}`);
console.log(`Fail: ${failed}`);
if (failed > 0) process.exit(1);
