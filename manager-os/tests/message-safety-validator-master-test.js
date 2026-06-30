"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  validateMessageDraftSafety,
  MESSAGE_SAFETY_VALIDATOR_STATUSES,
  MESSAGE_SAFETY_RISKS,
  ALLOWED_MESSAGE_SAFETY_VALIDATOR_USES,
  FORBIDDEN_MESSAGE_SAFETY_VALIDATOR_USES
} = require("../message-generation/message-safety-validator");

let passCount = 0;

function test(name, fn) {
  fn();
  passCount += 1;
  console.log(`PASS ${passCount} - ${name}`);
}

function strongInput(overrides = {}) {
  return {
    draftText: "Hola, te escribo para revisar si tiene sentido conversar esta semana.",
    draftPurpose: "FOLLOW_UP",
    audienceType: "PROSPECT",
    evidenceRefs: ["draft-ref", "draft-ref"],
    sourceEvidenceIds: ["draft-src", "draft-src"],
    sourceOwners: ["message-boundary", "message-boundary"],
    freshness: { status: "CURRENT", capturedAt: "2026-06-29T12:00:00Z" },
    requestedUse: "SAFETY_REVIEW_PREP",
    ...overrides
  };
}

function assertFalseTruthFlags(result) {
  assert.strictEqual(result.humanApprovalRequired, true);
  assert.strictEqual(result.automaticApprovalAllowed, false);
  assert.strictEqual(result.automaticDecisionAllowed, false);
  assert.strictEqual(result.safeForSend, false);
  assert.strictEqual(result.sendsMessage, false);
  assert.strictEqual(result.createsTask, false);
  assert.strictEqual(result.createsCalendarEvent, false);
  assert.strictEqual(result.executesLlmRuntime, false);
  assert.strictEqual(result.executesDeliveryAdapter, false);
  assert.strictEqual(result.createsDownstreamTruth, false);
  assert.strictEqual(result.createsHumanRankingTruth, false);
  assert.strictEqual(result.createsPromotionDecisionTruth, false);
  assert.strictEqual(result.createsAdvisorLifecycleTruth, false);
  assert.strictEqual(result.createsRevenue, false);
  assert.strictEqual(result.createsCompensation, false);
  assert.strictEqual(result.createsPayoutTruth, false);
}

test("Safe draft becomes READY_FOR_HUMAN_REVIEW, never safeForSend", () => {
  const result = validateMessageDraftSafety(strongInput());
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.READY_FOR_HUMAN_REVIEW);
  assert.strictEqual(result.safeForHumanReview, true);
  assert.strictEqual(result.safeForSend, false);
});

test("Pressure language requires revision or block", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Tienes que contestar hoy." }));
  assert(result.detectedRisks.includes(MESSAGE_SAFETY_RISKS.PRESSURE_LANGUAGE));
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_REVISION);
});

test("Shame language requires revision or block", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Seria irresponsable no revisar esto." }));
  assert(result.detectedRisks.includes(MESSAGE_SAFETY_RISKS.SHAME_LANGUAGE));
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_REVISION);
});

test("Manipulation requires revision or block", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Si de verdad te importa tu familia, responde." }));
  assert(result.detectedRisks.includes(MESSAGE_SAFETY_RISKS.MANIPULATION));
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_REVISION);
});

test("False urgency requires revision or block", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Solo hoy puedes tomar esta oportunidad." }));
  assert(result.detectedRisks.includes(MESSAGE_SAFETY_RISKS.FALSE_URGENCY));
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_REVISION);
});

test("Invented intent requires revision or block", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Se que quieres comprar un seguro." }));
  assert(result.detectedRisks.includes(MESSAGE_SAFETY_RISKS.INVENTED_INTENT));
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_REVISION);
});

test("Unsupported product income and protection claims require revision or block", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Este producto cubre todo, ganaras $1000 y necesitas un seguro." }));
  assert(result.detectedRisks.includes(MESSAGE_SAFETY_RISKS.UNSUPPORTED_PRODUCT_CLAIM));
  assert(result.detectedRisks.includes(MESSAGE_SAFETY_RISKS.UNSUPPORTED_INCOME_CLAIM));
  assert(result.detectedRisks.includes(MESSAGE_SAFETY_RISKS.UNSUPPORTED_PROTECTION_DIAGNOSIS));
});

test("HR hiring promotion punishment language is blocked", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Estas contratado y seras promovido." }));
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.BLOCKED);
  assert(result.blockedReasons.includes(MESSAGE_SAFETY_RISKS.HR_HIRING_PROMOTION_PUNISHMENT));
});

test("Compensation revenue payout lifecycle truth claims are blocked", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Tu pago garantizado es oficial y ya eres asesor." }));
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.BLOCKED);
  assert(result.blockedReasons.includes(MESSAGE_SAFETY_RISKS.COMPENSATION_REVENUE_PAYOUT_TRUTH));
  assert(result.blockedReasons.includes(MESSAGE_SAFETY_RISKS.ADVISOR_LIFECYCLE_TRUTH));
});

test("Family children fear leverage requires revision or block", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Si mueres tus hijos sufriran." }));
  assert(result.detectedRisks.includes(MESSAGE_SAFETY_RISKS.FAMILY_CHILDREN_FEAR_LEVERAGE));
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_REVISION);
});

test("Medical financial legal certainty claims require revision or block", () => {
  const result = validateMessageDraftSafety(strongInput({ draftText: "Esto es 100% seguro y legalmente seguro." }));
  assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.BLOCKED);
  assert(result.blockedReasons.includes(MESSAGE_SAFETY_RISKS.MEDICAL_FINANCIAL_LEGAL_CERTAINTY));
});

test("Missing evidence source freshness requires review", () => {
  const missingEvidence = validateMessageDraftSafety(strongInput({ evidenceRefs: [], sourceEvidenceIds: [] }));
  assert.strictEqual(missingEvidence.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_EVIDENCE);
  const missingOwner = validateMessageDraftSafety(strongInput({ sourceOwners: [] }));
  assert.strictEqual(missingOwner.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_SOURCE_OWNER);
  const missingFreshness = validateMessageDraftSafety(strongInput({ freshness: null }));
  assert.strictEqual(missingFreshness.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_FRESHNESS);
  const staleFreshness = validateMessageDraftSafety(strongInput({ freshness: { status: "STALE" } }));
  assert.strictEqual(staleFreshness.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_FRESHNESS);
});

test("Forbidden uses are blocked", () => {
  FORBIDDEN_MESSAGE_SAFETY_VALIDATOR_USES.forEach((requestedUse) => {
    const result = validateMessageDraftSafety(strongInput({ requestedUse }));
    assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.BLOCKED);
    assert(result.blockedUses.includes(requestedUse));
  });
});

test("Allowed uses are allowed", () => {
  ALLOWED_MESSAGE_SAFETY_VALIDATOR_USES.forEach((requestedUse) => {
    const result = validateMessageDraftSafety(strongInput({ requestedUse }));
    assert.strictEqual(result.safetyStatus, MESSAGE_SAFETY_VALIDATOR_STATUSES.READY_FOR_HUMAN_REVIEW);
    assert(result.allowedUses.includes(requestedUse));
  });
});

test("Inputs are not mutated", () => {
  const input = strongInput();
  const before = JSON.stringify(input);
  validateMessageDraftSafety(input);
  assert.strictEqual(JSON.stringify(input), before);
});

test("Validator does not rewrite and approve automatically", () => {
  const result = validateMessageDraftSafety(strongInput());
  assert.strictEqual(result.draftText, strongInput().draftText);
  assert.strictEqual(result.automaticApprovalAllowed, false);
  assert.strictEqual(result.humanApprovalRequired, true);
});

test("safeForSend remains false", () => {
  const result = validateMessageDraftSafety(strongInput());
  assert.strictEqual(result.safeForSend, false);
});

test("All action truth and write flags remain false", () => {
  const result = validateMessageDraftSafety(strongInput());
  assertFalseTruthFlags(result);
});

test("No forbidden imports exist", () => {
  const sourcePath = path.join(__dirname, "../message-generation/message-safety-validator.js");
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

console.log(`Message Safety Validator master tests PASS ${passCount}/19`);
