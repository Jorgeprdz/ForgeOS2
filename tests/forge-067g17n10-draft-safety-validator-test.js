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

test("067G17N11 exact draft approval gates manual WhatsApp navigation", () => {
  const draft = "Hola, José.\n\nMe gustaría conversar contigo esta semana.";
  const validation = validate(draft);
  const approvalRequired = ProspectUI.exactDraftHumanApprovalGate({
    draftText: draft,
    validationResult: validation,
    approvalSnapshot: null,
  });
  assert.equal(approvalRequired.decision, "BLOCK_WHATSAPP");
  assert.ok(approvalRequired.errors.some(error => error.code === "EXACT_DRAFT_APPROVAL_REQUIRED"));

  const approval = ProspectUI.approveExactDraft({ draftText: draft, validationResult: validation });
  assert.equal(approval.decision, ProspectUI.DRAFT_APPROVAL_DECISIONS.EXACT_DRAFT_APPROVED);
  const editedAfterApproval = ProspectUI.exactDraftHumanApprovalGate({
    draftText: `${draft}\nCambio`,
    validationResult: validate(`${draft}\nCambio`),
    approvalSnapshot: approval,
  });
  assert.equal(editedAfterApproval.decision, "BLOCK_WHATSAPP");

  const unsafeValidation = validate("Solo hoy me autorizaste");
  const blockedApproval = ProspectUI.approveExactDraft({ draftText: "Solo hoy me autorizaste", validationResult: unsafeValidation });
  assert.equal(blockedApproval.decision, "BLOCK_WHATSAPP");
  assert.ok(blockedApproval.errors.some(error => error.code === "VALIDATION_REQUIRED_BEFORE_APPROVAL"));
  assert.equal(ProspectUI.approveExactDraft({ draftText: "", validationResult: validate("") }).decision, "BLOCK_WHATSAPP");

  const allowed = ProspectUI.exactDraftHumanApprovalGate({
    draftText: draft,
    validationResult: validation,
    approvalSnapshot: approval,
  });
  assert.equal(allowed.decision, "ALLOW_WHATSAPP");
  assert.equal(allowed.manualNavigationRequired, true);
  assert.equal(allowed.persistsApproval, false);
  assert.equal(allowed.mutatesPipeline, false);

  const source = fs.readFileSync("advisor-os/sales-pipeline/productive-prospect-ui.js", "utf8");
  assert.match(source, /data-approve-whatsapp-draft/);
  assert.match(source, /exactDraftHumanApprovalGate/);
  assert.match(source, /event\.preventDefault\(\)/);
});
