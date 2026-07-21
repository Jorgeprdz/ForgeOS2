"use strict";

const assert = require("node:assert/strict");
const {
  buildDeterministicBrief
} = require("../conversation-brief/nash-deterministic-conversation-brief-boundary-contract");
const {
  PROVIDER_REQUEST_VERSION
} = require("../conversation-brief/nash-provider-request-contract");
const {
  createRemoteDraftProviderClient,
  FUNCTION_NAME,
} = require("../remote-draft-provider-client-boundary.js");

function brief() {
  return buildDeterministicBrief({
    projection: {
      projectionType: "CONVERSATION_CONTEXT",
      contextVersion: "ctx-remote-v1",
      prospectReference: "synthetic-prospect-remote",
      sourceOwners: ["NFAST-03_CONVERSATION_CONTEXT", "NFAST-02_PROSPECT_CONTEXT_INTAKE"],
      sourceEvidenceIds: ["remote-ev-001"],
      verifiedFacts: [{
        factId: "fact-001",
        claim: "The prospect asked for a follow-up.",
        sourceOwner: "NFAST-03_CONVERSATION_CONTEXT",
        evidenceIds: ["remote-ev-001"],
        freshness: "CURRENT",
        requiredForObjective: true
      }]
    },
    prospectContextIntake: {
      status: "READY",
      sourceOwners: ["NFAST-02_PROSPECT_CONTEXT_INTAKE"],
      sourceEvidenceIds: ["remote-intake-ev-001"],
      freshness: "CURRENT"
    },
    conversationRequest: {
      objective: { type: "FOLLOW_UP", statement: "Render a follow-up candidate." },
      successCondition: "Advisor can review the follow-up.",
      requestedChannel: "WHATSAPP_REVIEW_ONLY"
    },
    requestMetadata: {
      briefId: "remote-brief-001",
      generatedAt: "2026-07-20T00:00:00.000Z"
    },
    allowedSourceOwners: ["NFAST-03_CONVERSATION_CONTEXT", "NFAST-02_PROSPECT_CONTEXT_INTAKE"]
  });
}

(async () => {
  const calls = [];
  const deterministicClient = createRemoteDraftProviderClient({
    invokeFunction: async (...args) => {
      calls.push(args);
      throw new Error("SHOULD_NOT_CALL_REMOTE");
    },
  });
  const local = await deterministicClient.requestDraft({ providerId: "deterministic" });
  assert.equal(local.resultState, "NO_DRAFT");
  assert.equal(local.deterministicFallbackSelected, true);
  assert.equal(local.humanApprovalRequired, true);
  assert.equal(local.sent, false);
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
    humanApprovalRequired: true,
    approved: false,
    sent: false,
    externalActionPerformed: false,
  };
  const remoteCalls = [];
  const remoteClient = createRemoteDraftProviderClient({
    invokeFunction: async (name, payload) => {
      remoteCalls.push([name, payload]);
      return { data: validEnvelope };
    },
  });
  const remote = await remoteClient.requestDraft({
    requestVersion: PROVIDER_REQUEST_VERSION,
    providerId: "gemini",
    conversationBrief: brief(),
    requestMetadata: { requestId: "req-remote", locale: "es-MX" }
  });
  assert.equal(remoteCalls.length, 1);
  assert.equal(remoteCalls[0][0], FUNCTION_NAME);
  assert.deepEqual(Object.keys(remoteCalls[0][1].body).sort(), ["conversationBrief", "providerId", "requestMetadata", "requestVersion"]);
  assert.equal(remote.resultState, "ERROR");
  assert.equal(remote.error.code, "PROVIDER_NOT_ENABLED");
  assert.equal(remote.deterministicFallbackSelected, true);
  assert.equal(remote.sent, false);

  const legacy = await remoteClient.requestDraft({ providerId: "gemini", prospectMessageContext: { displayName: "Legacy" } });
  assert.equal(legacy.resultState, "ERROR");
  assert.equal(legacy.error.code, "UNSUPPORTED_TOP_LEVEL_FIELD");

  const invalidBrief = await remoteClient.requestDraft({ providerId: "gemini", conversationBrief: { status: "SUCCESS" } });
  assert.equal(invalidBrief.resultState, "ERROR");
  assert.equal(invalidBrief.error.code, "PROVIDER_NOT_ALLOWED_BY_BRIEF");

  const malformedClient = createRemoteDraftProviderClient({
    invokeFunction: async () => ({ data: { ok: true } }),
  });
  const malformed = await malformedClient.requestDraft({ providerId: "openai", conversationBrief: brief() });
  assert.equal(malformed.resultState, "ERROR");
  assert.equal(malformed.error.code, "UNKNOWN_PROVIDER_ERROR");
  assert.equal(malformed.deterministicFallbackSelected, true);

  const timeoutClient = createRemoteDraftProviderClient({
    timeoutMs: 5,
    invokeFunction: () => new Promise((resolve) => setTimeout(() => resolve({ data: validEnvelope }), 50)),
  });
  const timeout = await timeoutClient.requestDraft({ providerId: "gemini", conversationBrief: brief() });
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
  const noDraft = await noDraftClient.requestDraft({ providerId: "openai", conversationBrief: brief() });
  assert.equal(noDraft.resultState, "NO_DRAFT");
  assert.equal(noDraft.deterministicFallbackSelected, true);

  const unavailableClient = createRemoteDraftProviderClient({
    invokeFunction: async () => ({ error: { message: "network fail", token: "SECRET" } }),
  });
  const unavailable = await unavailableClient.requestDraft({ providerId: "gemini", conversationBrief: brief() });
  assert.equal(unavailable.error.code, "PROVIDER_UNAVAILABLE");
  assert.doesNotMatch(JSON.stringify(unavailable), /SECRET|token|apikey|apiKey|credential/i);

  assert.equal(remoteClient.defaultProvider, "deterministic");
  assert.equal(remoteClient.externalProviderEnabled, false);

  console.log("067G17N15 REMOTE DRAFT PROVIDER CLIENT BOUNDARY: PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
