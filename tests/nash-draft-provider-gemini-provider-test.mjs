import assert from "node:assert/strict";
import {
  buildGeminiDraftProviderResponse,
  GEMINI_API_KEY_ENV,
  GEMINI_FLASH_MODEL_ID,
  GEMINI_PROVIDER_ENABLED_ENV,
  GEMINI_PROVIDER_ID,
} from "../supabase/functions/nash-draft-provider/gemini-provider.mjs";

const context = Object.freeze({
  prospectId: "p1",
  displayName: "Marlene",
  allowedFields: ["displayName"],
});

const enabledEnv = Object.freeze({
  [GEMINI_PROVIDER_ENABLED_ENV]: "true",
  [GEMINI_API_KEY_ENV]: "super-secret-key",
});

function modelReturning(text) {
  return () => ({
    generateContent: async () => ({ response: { text: () => text } }),
  });
}

const success = await buildGeminiDraftProviderResponse({
  prospectMessageContext: context,
  env: enabledEnv,
  createModel: modelReturning(JSON.stringify({ draftText: "Hola Marlene, podemos conversar esta semana?" })),
});
assert.equal(success.resultState, "SUCCESS");
assert.equal(success.metadata.providerId, GEMINI_PROVIDER_ID);
assert.equal(success.metadata.modelId, GEMINI_FLASH_MODEL_ID);
assert.equal(success.draftCandidate.rawText, "Hola Marlene, podemos conversar esta semana?");
assert.equal(success.draftCandidate.sendsMessage, false);
assert.equal(success.draftCandidate.notSendable, true);
assert.equal(success.error, null);

const noDraft = await buildGeminiDraftProviderResponse({
  prospectMessageContext: context,
  env: enabledEnv,
  createModel: modelReturning(JSON.stringify({ noDraft: true })),
});
assert.equal(noDraft.resultState, "NO_DRAFT");
assert.equal(noDraft.draftCandidate, null);
assert.equal(noDraft.metadata.deterministicFallbackRequired, true);

const timeout = await buildGeminiDraftProviderResponse({
  prospectMessageContext: context,
  env: enabledEnv,
  timeoutMs: 5,
  createModel: () => ({
    generateContent: () => new Promise((resolve) => setTimeout(() => resolve({ response: { text: () => "{}" } }), 50)),
  }),
});
assert.equal(timeout.resultState, "ERROR");
assert.equal(timeout.error.code, "PROVIDER_TIMEOUT");
assert.equal(timeout.error.retryable, true);
assert.equal(timeout.metadata.deterministicFallbackRequired, true);

const disabled = await buildGeminiDraftProviderResponse({
  prospectMessageContext: context,
  env: {},
  createModel: modelReturning("{}"),
});
assert.equal(disabled.resultState, "ERROR");
assert.equal(disabled.error.code, "PROVIDER_NOT_ENABLED");

const unavailable = await buildGeminiDraftProviderResponse({
  prospectMessageContext: context,
  env: { [GEMINI_PROVIDER_ENABLED_ENV]: "true" },
  createModel: modelReturning("{}"),
});
assert.equal(unavailable.resultState, "ERROR");
assert.equal(unavailable.error.code, "PROVIDER_UNAVAILABLE");
assert.equal(unavailable.error.retryable, true);

const rejectedProvider = await buildGeminiDraftProviderResponse({
  prospectMessageContext: context,
  env: enabledEnv,
  createModel: () => ({
    generateContent: async () => {
      throw new Error("super-secret-key should not leak");
    },
  }),
});
assert.equal(rejectedProvider.resultState, "ERROR");
assert.equal(rejectedProvider.error.code, "PROVIDER_UNAVAILABLE");
assert.equal(rejectedProvider.error.retryable, true);

const malformed = await buildGeminiDraftProviderResponse({
  prospectMessageContext: context,
  env: enabledEnv,
  createModel: modelReturning("not json"),
});
assert.equal(malformed.resultState, "ERROR");
assert.equal(malformed.error.code, "PROVIDER_RETURNED_INVALID_DRAFT_CANDIDATE");
assert.equal(malformed.metadata.deterministicFallbackRequired, true);

const invalidContext = await buildGeminiDraftProviderResponse({
  prospectMessageContext: null,
  env: enabledEnv,
  createModel: modelReturning("{}"),
});
assert.equal(invalidContext.resultState, "ERROR");
assert.equal(invalidContext.error.code, "PROSPECT_MESSAGE_CONTEXT_INVALID");

for (const envelope of [success, noDraft, timeout, disabled, unavailable, rejectedProvider, malformed, invalidContext]) {
  const serialized = JSON.stringify(envelope);
  assert.doesNotMatch(serialized, /super-secret-key|GEMINI_API_KEY|NASH_GEMINI_DRAFT_PROVIDER_ENABLED|contents|parts|prompt|rawProvider/i);
}

console.log("067G17N16 EXPERIMENTAL GEMINI DRAFT PROVIDER: PASS");
