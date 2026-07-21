"use strict";

const assert = require("assert");
const {
  buildNashProspectContextIntakeBoundary,
  NASH_PROSPECT_CONTEXT_INTAKE_STATUS
} = require("../context-intake/nash-prospect-context-intake-boundary-contract");

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function evidence(extra = {}) {
  return { evidenceId: "ev-1", sourceOwner: "PIPELINE", observedAt: "2026-07-20T12:00:00.000Z", ...extra };
}

function fact(value, extra = {}) {
  return {
    value,
    sourceOwner: "PIPELINE",
    evidenceRefs: ["ev-1"],
    verificationStatus: "VERIFIED",
    freshness: { status: "CURRENT", observedAt: "2026-07-20T12:00:00.000Z" },
    ...extra
  };
}

function minimal(extra = {}) {
  return {
    prospectIdentityReference: fact("prospect-ref-1"),
    conversationObjective: fact("FIRST_CONTACT"),
    evidenceReferences: [evidence()],
    sourceOwners: ["PIPELINE"],
    freshness: { status: "CURRENT", evaluatedAt: "2026-07-20T12:00:00.000Z" },
    ...extra
  };
}

test("accepts valid minimal governed context", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal());
  assert.strictEqual(result.status, NASH_PROSPECT_CONTEXT_INTAKE_STATUS.SUCCESS);
  assert.strictEqual(result.knownFacts.length, 2);
});

test("accepts rich context with every governed reference family", () => {
  const input = minimal({
    pipelineStageReference: fact("CONTACTED"),
    relationshipContext: [fact("VERIFIED_REFERRAL")],
    verifiedInteractionFacts: [fact("CALL_COMPLETED")],
    appointmentContext: fact("APPOINTMENT_PENDING"),
    objectionContext: fact("REQUESTED_MORE_TIME"),
    officialNbaReference: fact("nba-ref-1", { sourceOwner: "NBA_AUTHORITY" }),
    productReference: fact("product-ref-1", { sourceOwner: "PRODUCT_INTELLIGENCE" }),
    quoteReference: fact("quote-ref-1", { sourceOwner: "QUOTE_AUTHORITY" }),
    forbiddenClaims: ["DO_NOT_CLAIM_APPOINTMENT_CONFIRMED"],
    safeLanguageGuardrails: ["PRESERVE_UNCERTAINTY"]
  });
  const result = buildNashProspectContextIntakeBoundary(input);
  assert.strictEqual(result.status, "SUCCESS");
  assert.strictEqual(Object.keys(result.acceptedContext).length, 10);
  assert(result.forbiddenClaims.includes("DO_NOT_CLAIM_APPOINTMENT_CONFIRMED"));
});

test("missing required fields remains invalid and explicit", () => {
  const result = buildNashProspectContextIntakeBoundary({ evidenceReferences: [evidence()] });
  assert.strictEqual(result.status, "INVALID_CONTEXT");
  assert(result.missingContext.includes("prospectIdentityReference"));
  assert(result.missingContext.includes("conversationObjective"));
});

test("UNKNOWN remains UNKNOWN", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({ unknownFacts: ["relationshipContext"] }));
  assert(result.unknownFacts.includes("relationshipContext"));
  assert(!result.knownFacts.some((item) => item.field === "relationshipContext"));
});

test("stale evidence is blocked and never becomes a fact", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({
    relationshipContext: fact("OLD_RELATIONSHIP", { freshness: { status: "STALE", observedAt: "2024-01-01T00:00:00.000Z" } })
  }));
  assert.strictEqual(result.status, "BLOCKED_CONTEXT");
  assert(result.blockedContext.some((item) => item.reason === "STALE_EVIDENCE"));
  assert(!result.knownFacts.some((item) => item.field === "relationshipContext"));
});

test("missing evidence is blocked", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({ relationshipContext: { ...fact("REFERRAL"), evidenceRefs: [] } }));
  assert.strictEqual(result.status, "BLOCKED_CONTEXT");
  assert(result.blockedContext.some((item) => item.reason === "MISSING_EVIDENCE"));
});

test("unknown freshness remains unknown and cannot become trusted fact", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({
    relationshipContext: fact("REFERRAL", { freshness: { status: "UNKNOWN" } })
  }));
  assert(result.blockedContext.some((item) => item.reason === "UNKNOWN_FRESHNESS"));
  assert(result.unknownFacts.includes("relationshipContext"));
  assert(!result.knownFacts.some((item) => item.field === "relationshipContext"));
});

test("structured values cannot smuggle unclassified nested context", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({
    relationshipContext: fact({ type: "REFERRAL", internalNotes: "private" })
  }));
  assert(result.blockedContext.some((item) => item.reason === "STRUCTURED_OR_UNSAFE_VALUE"));
  assert.strictEqual(JSON.stringify(result).includes("private"), false);
});

test("invalid source owner is blocked", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({
    relationshipContext: fact("REFERRAL", { sourceOwner: "NASH" }),
    sourceOwners: ["NASH"]
  }));
  assert(result.blockedContext.some((item) => item.reason === "INVALID_SOURCE_OWNER"));
  assert(!result.sourceOwners.includes("NASH"));
});

test("evidence references expose only governed lineage metadata", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({
    evidenceReferences: [evidence({ privateNote: "do not expose" })]
  }));
  assert.deepStrictEqual(Object.keys(result.evidenceReferences[0]), ["evidenceId", "sourceOwner", "observedAt"]);
  assert.strictEqual(JSON.stringify(result).includes("do not expose"), false);
});

test("missing or stale packet freshness cannot be accepted", () => {
  const missing = minimal();
  delete missing.freshness;
  assert.strictEqual(buildNashProspectContextIntakeBoundary(missing).status, "INVALID_CONTEXT");
  const stale = buildNashProspectContextIntakeBoundary(minimal({ freshness: { status: "STALE" } }));
  assert.strictEqual(stale.status, "BLOCKED_CONTEXT");
});

test("unsupported and sensitive fields are rejected", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({ notes: "private", favoriteColor: "blue" }));
  assert.strictEqual(result.status, "BLOCKED_CONTEXT");
  assert(result.blockedContext.some((item) => item.field === "notes" && item.reason === "SENSITIVE_OR_PROHIBITED_FIELD"));
  assert(result.blockedContext.some((item) => item.field === "favoriteColor" && item.reason === "UNSUPPORTED_FIELD"));
  assert.strictEqual(JSON.stringify(result).includes("private"), false);
});

test("raw Pipeline objects are prohibited", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({ rawPipelineObject: { notes: "raw" } }));
  assert(result.blockedContext.some((item) => item.reason === "RAW_PIPELINE_INPUT_PROHIBITED"));
  assert.strictEqual(JSON.stringify(result).includes('"notes":"raw"'), false);
});

test("unverified free text is quarantined without retaining copy", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({
    objectionContext: fact("arbitrary advisor note", { verificationStatus: "UNVERIFIED" })
  }));
  assert(result.blockedContext.some((item) => item.reason === "UNVERIFIED_CONTEXT"));
  assert.strictEqual(JSON.stringify(result).includes("arbitrary advisor note"), false);
  assert(result.unknownFacts.includes("objectionContext"));
});

test("candidate interpretations are explicitly non-factual", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({
    candidateInterpretations: [{ value: "may prefer a call", evidenceRefs: ["ev-1"], factual: true }]
  }));
  assert.strictEqual(result.candidateInterpretations[0].factual, false);
  assert.strictEqual(result.candidateInterpretations[0].verificationStatus, "UNVERIFIED");
  assert.strictEqual(result.candidateInterpretations[0].requiresHumanReview, true);
});

test("forbidden claims and mandatory authority flags propagate", () => {
  const result = buildNashProspectContextIntakeBoundary(minimal({ forbiddenClaims: ["NO_INVENTED_CONSENT"] }));
  assert(result.forbiddenClaims.includes("NO_INVENTED_CONSENT"));
  assert.strictEqual(result.humanApprovalRequired, true);
  assert.strictEqual(result.contextOnly, true);
});

test("forbidden execution uses remain blocked", () => {
  for (const requestedUse of ["MESSAGE_SEND", "DRAFT_CREATE", "NBA_EXECUTE", "TASK_CREATE", "CALENDAR_CREATE", "PROVIDER_CALL", "DATABASE_WRITE", "FILESYSTEM_WRITE"]) {
    const result = buildNashProspectContextIntakeBoundary(minimal({ requestedUse }));
    assert.strictEqual(result.status, "BLOCKED_CONTEXT");
  }
});

test("output is deeply immutable and input remains unchanged", () => {
  const input = minimal();
  const before = JSON.stringify(input);
  const result = buildNashProspectContextIntakeBoundary(input);
  assert(Object.isFrozen(result));
  assert(Object.isFrozen(result.acceptedContext.prospectIdentityReference));
  assert.throws(() => { result.acceptedContext.prospectIdentityReference.value = "changed"; }, TypeError);
  assert.strictEqual(JSON.stringify(input), before);
});

test("repeated execution is deterministic", () => {
  const input = minimal({ unknownFacts: ["appointmentContext"] });
  assert.deepStrictEqual(buildNashProspectContextIntakeBoundary(input), buildNashProspectContextIntakeBoundary(input));
});

let pass = 0;
for (const item of tests) {
  try { item.fn(); pass += 1; console.log(`PASS ${item.name}`); }
  catch (error) { console.error(`FAIL ${item.name}`); console.error(error.stack || error.message); process.exitCode = 1; }
}
console.log(`NFAST-02 boundary: ${pass}/${tests.length} passed`);
