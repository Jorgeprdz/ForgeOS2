"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  intakeLlmDraftForSafetyReview,
  LLM_DRAFT_INTAKE_STATUSES,
  ALLOWED_LLM_DRAFT_INTAKE_USES,
  FORBIDDEN_LLM_DRAFT_INTAKE_USES
} = require("../message-generation/llm-draft-intake-boundary-contract");

let passCount = 0;

function test(name, fn) {
  fn();
  passCount += 1;
  console.log(`PASS ${passCount} - ${name}`);
}

function strongInput(overrides = {}) {
  return {
    draftText: "Hola, te comparto una idea para revisar con calma.",
    draftPurpose: "FOLLOW_UP",
    audienceType: "PROSPECT",
    promptContext: {
      promptInstructions: { instructionType: "PROMPT_INSTRUCTIONS_ONLY" },
      evidenceRefs: ["prompt-ref"],
      sourceEvidenceIds: ["prompt-src"],
      sourceOwners: ["manager-os"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-29T12:00:00Z" }
    },
    evidenceRefs: ["draft-ref", "draft-ref"],
    sourceEvidenceIds: ["draft-src", "draft-src"],
    sourceOwners: ["message-boundary", "message-boundary"],
    freshness: { status: "CURRENT", capturedAt: "2026-06-29T12:00:00Z" },
    requestedUse: "LLM_DRAFT_INTAKE",
    ...overrides
  };
}

function assertFalseTruthFlags(result) {
  assert.strictEqual(result.humanApprovalRequired, true);
  assert.strictEqual(result.humanReviewRequired, true);
  assert.strictEqual(result.automaticDecisionAllowed, false);
  assert.strictEqual(result.draftIsApprovedCommunication, false);
  assert.strictEqual(result.safetyValidationIsHumanApproval, false);
  assert.strictEqual(result.createsDraft, false);
  assert.strictEqual(result.sendsMessage, false);
  assert.strictEqual(result.createsTask, false);
  assert.strictEqual(result.createsCalendarEvent, false);
  assert.strictEqual(result.executesLlmRuntime, false);
  assert.strictEqual(result.executesNashRuntime, false);
  assert.strictEqual(result.executesDeliveryAdapter, false);
  assert.strictEqual(result.executesNextBestAction, false);
  assert.strictEqual(result.createsDownstreamTruth, false);
}

test("Missing draft becomes NEEDS_DRAFT, not empty safe message", () => {
  const result = intakeLlmDraftForSafetyReview(strongInput({ draftText: null }));
  assert.strictEqual(result.intakeStatus, LLM_DRAFT_INTAKE_STATUSES.NEEDS_DRAFT);
  assert.strictEqual(result.draftText, null);
  assertFalseTruthFlags(result);
});

test("Missing prompt context requires review", () => {
  const result = intakeLlmDraftForSafetyReview(strongInput({ promptContext: null }));
  assert.strictEqual(result.intakeStatus, LLM_DRAFT_INTAKE_STATUSES.NEEDS_PROMPT_CONTEXT);
  assert(result.missingContext.includes("prompt_context_missing"));
});

test("Missing evidence requires review", () => {
  const result = intakeLlmDraftForSafetyReview(strongInput({
    promptContext: { sourceOwners: ["manager-os"], freshness: { status: "CURRENT" } },
    evidenceRefs: [],
    sourceEvidenceIds: []
  }));
  assert.strictEqual(result.intakeStatus, LLM_DRAFT_INTAKE_STATUSES.NEEDS_EVIDENCE);
  assert(result.confidenceLimitations.includes("missing_evidence_requires_review"));
});

test("Missing source owner requires review", () => {
  const result = intakeLlmDraftForSafetyReview(strongInput({
    promptContext: { evidenceRefs: ["e"], sourceEvidenceIds: ["s"], freshness: { status: "CURRENT" } },
    sourceOwners: []
  }));
  assert.strictEqual(result.intakeStatus, LLM_DRAFT_INTAKE_STATUSES.NEEDS_SOURCE_OWNER);
});

test("Missing freshness requires review", () => {
  const result = intakeLlmDraftForSafetyReview(strongInput({
    promptContext: { evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: ["owner"] },
    freshness: null
  }));
  assert.strictEqual(result.intakeStatus, LLM_DRAFT_INTAKE_STATUSES.NEEDS_FRESHNESS);
});

test("Stale freshness requires review", () => {
  const result = intakeLlmDraftForSafetyReview(strongInput({ freshness: { status: "STALE" } }));
  assert.strictEqual(result.intakeStatus, LLM_DRAFT_INTAKE_STATUSES.NEEDS_FRESHNESS);
  assert(result.staleContext.includes("freshness_stale"));
});

test("Forbidden uses are blocked", () => {
  FORBIDDEN_LLM_DRAFT_INTAKE_USES.forEach((requestedUse) => {
    const result = intakeLlmDraftForSafetyReview(strongInput({ requestedUse }));
    assert.strictEqual(result.intakeStatus, LLM_DRAFT_INTAKE_STATUSES.BLOCKED);
    assert(result.blockedUses.includes(requestedUse));
    assertFalseTruthFlags(result);
  });
});

test("Allowed intake uses are allowed", () => {
  ALLOWED_LLM_DRAFT_INTAKE_USES.forEach((requestedUse) => {
    const result = intakeLlmDraftForSafetyReview(strongInput({ requestedUse }));
    assert.strictEqual(result.intakeStatus, LLM_DRAFT_INTAKE_STATUSES.READY_FOR_SAFETY_REVIEW);
    assert(result.allowedUses.includes(requestedUse));
  });
});

test("Inputs are not mutated", () => {
  const input = strongInput();
  const before = JSON.stringify(input);
  intakeLlmDraftForSafetyReview(input);
  assert.strictEqual(JSON.stringify(input), before);
});

test("Evidence refs, source evidence IDs, and source owners dedupe", () => {
  const result = intakeLlmDraftForSafetyReview(strongInput());
  assert.strictEqual(result.evidenceRefs.filter((item) => item === "draft-ref").length, 1);
  assert.strictEqual(result.sourceEvidenceIds.filter((item) => item === "draft-src").length, 1);
  assert.strictEqual(result.sourceOwners.filter((item) => item === "message-boundary").length, 1);
});

test("Draft is not approved communication", () => {
  const result = intakeLlmDraftForSafetyReview(strongInput());
  assert.strictEqual(result.draftIsApprovedCommunication, false);
  assert(result.warnings.includes("draft_is_not_approved_communication"));
});

test("Draft intake does not execute runtime, delivery, actions, or downstream truth", () => {
  const result = intakeLlmDraftForSafetyReview(strongInput());
  assertFalseTruthFlags(result);
});

test("No forbidden imports exist", () => {
  const sourcePath = path.join(__dirname, "../message-generation/llm-draft-intake-boundary-contract.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  [
    "openai",
    "nash-core-engine",
    "nash-message-recommendation-engine",
    "nash-next-best-action-engine",
    "whatsapp",
    "sms",
    "compensation",
    "revenue",
    "advisor-lifecycle",
    "product-intelligence",
    "schemas",
    "fixtures"
  ].forEach((term) => assert(!source.includes(`require("${term}`), `forbidden import ${term}`));
});

console.log(`LLM Draft Intake Boundary Contract master tests PASS ${passCount}/13`);
