"use strict";

const assert = require("node:assert/strict");
const {
  createRemoteDraftProviderClient,
  FUNCTION_NAME,
} = require("../remote-draft-provider-client-boundary.js");

const context = Object.freeze({
  prospectId: "p1",
  allowedFields: ["displayName"],
  displayName: "Marlene",
});

(async () => {
  const calls = [];
  const deterministicClient = createRemoteDraftProviderClient({
    invokeFunction: async (...args) => {
      calls.push(args);
      throw new Error("SHOULD_NOT_CALL_REMOTE");
    },
  });
  const local = await deterministicClient.requestDraft({ providerId: "deterministic", prospectMessageContext: context });
  assert.equal(local.resultState, "NO_DRAFT");
  assert.equal(local.deterministicFallbackSelected, true);
  assert.equal(calls.length, 0);

  const validEnvelope = {
    resultState: "ERROR",
    draftCandidate: null,
    metadata: {
      providerId: "gemini",
      modelId: "not-enabled",
      generationMode: "external_provider_not_enabled",
      generatedAt: "2026-07-20T00:00:00.000Z",
    },
    error: {
      code: "PROVIDER_NOT_ENABLED",
      message: "External AI draft providers are not enabled in this shell.",
      retryable: false,
    },
  };
  const remoteCalls = [];
  const remoteClient = createRemoteDraftProviderClient({
    invokeFunction: async (name, payload) => {
      remoteCalls.push([name, payload]);
      return { data: validEnvelope };
    },
  });
  const remote = await remoteClient.requestDraft({ providerId: "gemini", prospectMessageContext: context });
  assert.equal(remoteCalls.length, 1);
  assert.equal(remoteCalls[0][0], FUNCTION_NAME);
  assert.deepEqual(Object.keys(remoteCalls[0][1].body).sort(), ["prospectMessageContext", "providerId"]);
  assert.equal(remote.resultState, "ERROR");
  assert.equal(remote.error.code, "PROVIDER_NOT_ENABLED");
  assert.equal(remote.deterministicFallbackSelected, true);

  const malformedClient = createRemoteDraftProviderClient({
    invokeFunction: async () => ({ data: { ok: true } }),
  });
  const malformed = await malformedClient.requestDraft({ providerId: "openai", prospectMessageContext: context });
  assert.equal(malformed.resultState, "ERROR");
  assert.equal(malformed.error.code, "UNKNOWN_PROVIDER_ERROR");
  assert.equal(malformed.deterministicFallbackSelected, true);

  const timeoutClient = createRemoteDraftProviderClient({
    timeoutMs: 5,
    invokeFunction: () => new Promise((resolve) => setTimeout(() => resolve({ data: validEnvelope }), 50)),
  });
  const timeout = await timeoutClient.requestDraft({ providerId: "gemini", prospectMessageContext: context });
  assert.equal(timeout.resultState, "ERROR");
  assert.equal(timeout.error.code, "PROVIDER_TIMEOUT");
  assert.equal(timeout.error.retryable, true);
  assert.equal(timeout.deterministicFallbackSelected, true);

  const noDraftClient = createRemoteDraftProviderClient({
    invokeFunction: async () => ({
      data: {
        resultState: "NO_DRAFT",
        draftCandidate: null,
        metadata: {
          providerId: "openai",
          modelId: "not-enabled",
          generationMode: "external_provider_not_enabled",
          generatedAt: "2026-07-20T00:00:00.000Z",
        },
        error: null,
      },
    }),
  });
  const noDraft = await noDraftClient.requestDraft({ providerId: "openai", prospectMessageContext: context });
  assert.equal(noDraft.resultState, "NO_DRAFT");
  assert.equal(noDraft.deterministicFallbackSelected, true);

  const unavailableClient = createRemoteDraftProviderClient({
    invokeFunction: async () => ({ error: { message: "network fail", token: "SECRET" } }),
  });
  const unavailable = await unavailableClient.requestDraft({ providerId: "gemini", prospectMessageContext: context });
  assert.equal(unavailable.error.code, "PROVIDER_UNAVAILABLE");
  assert.doesNotMatch(JSON.stringify(unavailable), /SECRET|token|apikey|apiKey|credential/i);

  assert.equal(remoteClient.defaultProvider, "deterministic");
  assert.equal(remoteClient.externalProviderEnabled, false);

  console.log("067G17N15 REMOTE DRAFT PROVIDER CLIENT BOUNDARY: PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
