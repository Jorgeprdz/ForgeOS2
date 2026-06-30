"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  buildManagerMessagePrompt,
  MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES
} = require("../message-generation/manager-message-prompt-builder");

console.log("\nFORGE MANAGER MESSAGE PROMPT BUILDER MASTER TEST v1.0\n");

function baseInput(overrides = {}) {
  return {
    managerContext: {
      managerId: "MANAGER_001",
      reviewContext: "candidate follow-up",
      contextOnly: true,
      evidenceRefs: ["manager-ref", "shared-ref"],
      sourceEvidenceIds: ["manager-source", "shared-source"],
      sourceOwners: ["MANAGER_OS"],
      freshness: { status: "FRESH" }
    },
    nashConversationContext: {
      nashReadyContextOnly: true,
      questionAreas: ["motivation", "timing"],
      conversationGuardrails: ["no pressure", "no invented intent"],
      evidenceRefs: ["nash-ref", "shared-ref"],
      sourceEvidenceIds: ["nash-source", "shared-source"],
      sourceOwners: ["NASH_CONTEXT_INTAKE"],
      freshness: { status: "FRESH" }
    },
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

function assertInstructionsOnly(result) {
  assert.equal(result.promptInstructions.instructionType, "PROMPT_INSTRUCTIONS_ONLY");
  assert.equal(result.promptInstructions.notFinalMessage, true);
  assert.equal(result.promptInstructions.notDraft, true);
  assert.equal(result.promptInstructions.createsDraft, false);
  assert.equal(result.promptInstructions.sendsMessage, false);
  assert.equal(result.promptInstructions.executesNashRuntime, false);
  assert.equal(result.promptInstructions.executesLlmRuntime, false);
  assert.ok(Array.isArray(result.promptInstructions.prohibitedLanguage));
  assert.ok(result.promptInstructions.prohibitedLanguage.some((item) => item.includes("No ready-to-send message text")));
}

const tests = [
  ["Builder composes boundary output into prompt instructions safely", () => {
    const result = buildManagerMessagePrompt(baseInput());
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.READY_FOR_PROMPT_REVIEW);
    assert.equal(result.promptPurpose, "CANDIDATE_CHECK_IN");
    assertInstructionsOnly(result);
    assertFalseFlags(result);
  }],
  ["Missing manager Nash context becomes needs context not zero", () => {
    const result = buildManagerMessagePrompt(baseInput({ managerContext: null, nashConversationContext: null }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.NEEDS_CONTEXT);
    assert.ok(result.missingContext.includes("managerContext_missing"));
    assertFalseFlags(result);
  }],
  ["Missing evidence requires review", () => {
    const result = buildManagerMessagePrompt(baseInput({ managerContext: {}, nashConversationContext: {}, evidenceRefs: [], sourceEvidenceIds: [], sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.NEEDS_EVIDENCE);
    assert.ok(result.confidenceLimitations.includes("missing_evidence"));
    assertFalseFlags(result);
  }],
  ["Missing source owner requires review", () => {
    const result = buildManagerMessagePrompt(baseInput({ managerContext: {}, nashConversationContext: {}, sourceOwners: [], evidenceRefs: ["e"], sourceEvidenceIds: ["s"], freshness: { status: "FRESH" } }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.NEEDS_SOURCE_OWNER);
    assertFalseFlags(result);
  }],
  ["Missing freshness requires review", () => {
    const result = buildManagerMessagePrompt(baseInput({ managerContext: {}, nashConversationContext: {}, freshness: null, evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: ["MANAGER_OS"] }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.NEEDS_FRESHNESS);
    assertFalseFlags(result);
  }],
  ["Stale freshness requires review", () => {
    const result = buildManagerMessagePrompt(baseInput({ freshness: { status: "STALE" } }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.NEEDS_FRESHNESS);
    assert.ok(result.staleContext.includes("freshness_stale"));
    assertFalseFlags(result);
  }],
  ["Explicit zero values create warnings only", () => {
    const result = buildManagerMessagePrompt(baseInput({ managerContext: { advisorCount: 0, evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: ["MANAGER_OS"], freshness: { status: "FRESH" } } }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.NEEDS_HUMAN_REVIEW);
    assert.ok(result.warnings.some((warning) => warning.includes("explicit_zero")));
    assertFalseFlags(result);
  }],
  ["Forbidden uses are blocked", () => {
    const result = buildManagerMessagePrompt(baseInput({ requestedUse: "LLM_RUNTIME_EXECUTION" }));
    assert.equal(result.promptStatus, MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.BLOCKED);
    assert.ok(result.blockedUses.includes("LLM_RUNTIME_EXECUTION"));
    assertFalseFlags(result);
  }],
  ["Allowed prompt prep uses are allowed", () => {
    const result = buildManagerMessagePrompt(baseInput({ requestedUse: "ADVISOR_SUPPORT_PROMPT_PREP" }));
    assert.ok(result.allowedUses.includes("ADVISOR_SUPPORT_PROMPT_PREP"));
    assert.equal(result.blockedUses.length, 0);
    assertFalseFlags(result);
  }],
  ["Inputs are not mutated", () => {
    const input = baseInput();
    const original = clone(input);
    buildManagerMessagePrompt(input);
    assert.deepEqual(input, original);
  }],
  ["Evidence refs source evidence IDs and source owners dedupe", () => {
    const result = buildManagerMessagePrompt(baseInput());
    assert.equal(result.evidenceRefs.filter((item) => item === "shared-ref").length, 1);
    assert.equal(result.sourceEvidenceIds.filter((item) => item === "shared-source").length, 1);
    assert.equal(result.sourceOwners.filter((item) => item === "MANAGER_OS").length, 1);
    assertFalseFlags(result);
  }],
  ["Prompt instructions are not final message drafts", () => {
    const result = buildManagerMessagePrompt(baseInput());
    assertInstructionsOnly(result);
    assert.equal(JSON.stringify(result.promptInstructions).includes("Hola "), false);
  }],
  ["Human approval is always required", () => {
    const result = buildManagerMessagePrompt(baseInput());
    assert.equal(result.humanApprovalRequired, true);
    assert.equal(result.humanReviewRequired, true);
    assertFalseFlags(result);
  }],
  ["No drafts sends tasks calendars LLM Nash legacy or next best action execution are created", () => {
    assertFalseFlags(buildManagerMessagePrompt(baseInput()));
  }],
  ["No downstream truth flags are created", () => {
    const result = buildManagerMessagePrompt(baseInput());
    assert.equal(result.createsDownstreamTruth, false);
    assert.equal(result.createsManagerJudgmentTruth, false);
    assert.equal(result.createsHumanRankingTruth, false);
    assert.equal(result.createsPromotionDecisionTruth, false);
    assert.equal(result.createsAdvisorLifecycleTruth, false);
    assertFalseFlags(result);
  }],
  ["No forbidden imports exist", () => {
    const files = [
      "../message-generation/manager-message-prompt-builder.js",
      "../message-generation/manager-message-prompt-builder-boundary-contract.js"
    ].map((file) => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");
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
      "fixtures/",
      "runtime/",
      "ui/"
    ].forEach((text) => assert.equal(files.includes(text), false));
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
