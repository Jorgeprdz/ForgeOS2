"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ProspectUI = require("../advisor-os/sales-pipeline/productive-prospect-ui.js");

function validate(text, overrides = {}) {
  return ProspectUI.draftSafetyValidator({
    draftText: text,
    draftCandidateSnapshot: { sendsMessage: false, sourceMutable: false },
    humanApproval: { required: true, finalAuthority: "HUMAN" },
    ...overrides,
  });
}

test("067G17N10 allows clean edited draft without rewrite or AI", () => {
  const draft = "Hola, José 😊.\n\nMe gustaría conversar contigo esta semana.";
  const result = validate(draft);
  assert.equal(result.decision, ProspectUI.DRAFT_VALIDATION_DECISIONS.ALLOW_WHATSAPP);
  assert.deepEqual(result.errors, []);
  assert.equal(result.rewritesDraft, false);
  assert.equal(result.generatesDraft, false);
  assert.equal(result.mutatesDraftCandidate, false);
  assert.equal(result.mutatesPipeline, false);
  assert.equal(result.callsAi, false);
});

test("067G17N10 blocks excluded fields and prohibited claims", () => {
  const result = validate("advisorId A1 con producto garantizado y NASAT alto");
  assert.equal(result.decision, "BLOCK_WHATSAPP");
  assert.ok(result.errors.some(error => error.code === "EXCLUDED_FIELD_PRESENT"));
  assert.ok(result.errors.some(error => error.code === "PROHIBITED_CLAIM_PRESENT"));
});

test("067G17N10 blocks invented commitment consent urgency and referral wording", () => {
  const result = validate("Quedamos con cita confirmada. Me autorizaste. Solo hoy. Me dieron tus datos y me dijo que necesitas esto.");
  assert.equal(result.decision, "BLOCK_WHATSAPP");
  assert.ok(result.errors.some(error => error.code === "INVENTED_COMMITMENT_PRESENT"));
  assert.ok(result.errors.some(error => error.code === "INVENTED_CONSENT_PRESENT"));
  assert.ok(result.errors.some(error => error.code === "INVENTED_URGENCY_PRESENT"));
  assert.ok(result.errors.some(error => error.code === "PROHIBITED_REFERRAL_WORDING_PRESENT"));
});

test("067G17N10 blocks missing DraftCandidate and broken human approval path", () => {
  const result = ProspectUI.draftSafetyValidator({
    draftText: "Hola",
    draftCandidateSnapshot: null,
    humanApproval: { required: false, finalAuthority: "SYSTEM" },
  });
  assert.equal(result.decision, "BLOCK_WHATSAPP");
  assert.ok(result.errors.some(error => error.code === "DRAFT_CANDIDATE_RULES_UNSATISFIED"));
  assert.ok(result.errors.some(error => error.code === "HUMAN_APPROVAL_PATH_NOT_PRESERVED"));
});

test("067G17N10 pre-WhatsApp flow calls validator before manual WhatsApp action", () => {
  const source = fs.readFileSync("advisor-os/sales-pipeline/productive-prospect-ui.js", "utf8");
  const clickIndex = source.indexOf('event.target.closest("[data-whatsapp-action]")');
  const validateIndex = source.indexOf("currentDraftSafetyResult()", clickIndex);
  const preventIndex = source.indexOf("event.preventDefault()", validateIndex);
  assert.ok(clickIndex > -1);
  assert.ok(validateIndex > clickIndex);
  assert.ok(preventIndex > validateIndex);
  assert.doesNotMatch(source, /openai|fetch\(|send\(|rewriteDraft|generateDraft/i);
});
