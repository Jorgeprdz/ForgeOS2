"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { buildNashProspectContextIntake } = require("../context-intake/nash-prospect-context-intake");

function input() {
  const timestamp = "2026-07-20T12:00:00.000Z";
  const entry = (value) => ({
    value,
    sourceOwner: "PIPELINE",
    evidenceRefs: ["ev-1"],
    verificationStatus: "VERIFIED",
    freshness: { status: "CURRENT", observedAt: timestamp }
  });
  return {
    prospectIdentityReference: entry("prospect-ref-1"),
    conversationObjective: entry("FOLLOW_UP"),
    evidenceReferences: [{ evidenceId: "ev-1", sourceOwner: "PIPELINE", observedAt: timestamp }],
    sourceOwners: ["PIPELINE"],
    freshness: { status: "CURRENT", evaluatedAt: timestamp },
    unknownFacts: ["quoteReference"],
    forbiddenClaims: ["NO_INVENTED_QUOTE"]
  };
}

const first = buildNashProspectContextIntake(input());
const second = buildNashProspectContextIntake(input());

assert.strictEqual(first.status, "SUCCESS");
assert.strictEqual(first.decision, "ACCEPT_GOVERNED_CONTEXT");
assert.strictEqual(first.prospectContextIntakeOnly, true);
assert.strictEqual(first.modernContextIntakePath, true);
assert.strictEqual(first.contextOnly, true);
assert.strictEqual(first.humanApprovalRequired, true);
assert.strictEqual(first.message, null);
assert.strictEqual(first.draft, null);
assert.strictEqual(first.nextBestAction, null);
assert.strictEqual(first.task, null);
assert.strictEqual(first.calendarEvent, null);
assert.strictEqual(first.providerResult, null);
assert.deepStrictEqual(first, second);
assert(Object.isFrozen(first));
for (const [name, value] of Object.entries(first.sideEffects)) {
  assert.strictEqual(value, false, `side effect must be false: ${name}`);
}

const sources = [
  "../context-intake/nash-prospect-context-intake-boundary-contract.js",
  "../context-intake/nash-prospect-context-intake.js"
].map((file) => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");

for (const forbiddenImport of [
  "advisor-os/",
  "supabase/",
  "nash-core-engine",
  "nash-master-intelligence-engine",
  "nash-next-best-action-engine",
  "nash-message-recommendation-engine",
  "remote-draft-provider",
  "gemini-provider"
]) {
  assert(!sources.includes(forbiddenImport), `forbidden runtime import: ${forbiddenImport}`);
}

for (const forbiddenApi of ["fetch(", "writeFile", "appendFile", "localStorage", "sessionStorage", ".click(", "window.open", "setTimeout", "setInterval"]) {
  assert(!sources.includes(forbiddenApi), `forbidden side-effect API: ${forbiddenApi}`);
}

console.log("PASS NFAST-02 governed prospect context intake has no runtime execution or side effects");
