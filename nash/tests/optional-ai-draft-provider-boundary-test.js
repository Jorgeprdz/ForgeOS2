"use strict";

const assert = require("node:assert/strict");
const {
  buildDeterministicBrief
} = require("../conversation-brief/nash-deterministic-conversation-brief-boundary-contract");
const {
  buildOptionalAiDraftProviderBoundary,
  DRAFT_PROVIDER_IDS,
  DRAFT_PROVIDER_DECISIONS,
  DRAFT_PROVIDER_RESULTS,
} = require("../optional-ai-draft-provider-boundary.js");

const gates = Object.freeze({
  contextContract: { satisfied: true },
  privacyPolicy: { satisfied: true },
  ctaGovernance: { satisfied: true },
  safetyValidator: { satisfied: true },
  humanApproval: { satisfied: true },
});

const conversationBrief = buildDeterministicBrief({
  projection: {
    projectionType: "CONVERSATION_CONTEXT",
    contextVersion: "ctx-optional-v1",
    prospectReference: "synthetic-prospect-optional",
    sourceOwners: ["NFAST-03_CONVERSATION_CONTEXT", "NFAST-02_PROSPECT_CONTEXT_INTAKE"],
    sourceEvidenceIds: ["optional-ev-001"],
    verifiedFacts: [{
      factId: "fact-001",
      claim: "The prospect asked for a follow-up.",
      sourceOwner: "NFAST-03_CONVERSATION_CONTEXT",
      evidenceIds: ["optional-ev-001"],
      freshness: "CURRENT",
      requiredForObjective: true
    }]
  },
  prospectContextIntake: {
    status: "READY",
    sourceOwners: ["NFAST-02_PROSPECT_CONTEXT_INTAKE"],
    sourceEvidenceIds: ["optional-intake-ev-001"],
    freshness: "CURRENT"
  },
  conversationRequest: {
    objective: { type: "FOLLOW_UP", statement: "Render a follow-up candidate." },
    successCondition: "Advisor can review the follow-up.",
    requestedChannel: "WHATSAPP_REVIEW_ONLY"
  },
  requestMetadata: {
    briefId: "optional-brief-001",
    generatedAt: "2026-07-20T00:00:00.000Z"
  },
  allowedSourceOwners: ["NFAST-03_CONVERSATION_CONTEXT", "NFAST-02_PROSPECT_CONTEXT_INTAKE"]
});

const defaultBoundary = buildOptionalAiDraftProviderBoundary(gates);
assert.equal(defaultBoundary.defaultProvider, DRAFT_PROVIDER_IDS.DETERMINISTIC);
assert.equal(defaultBoundary.selectedProvider, DRAFT_PROVIDER_IDS.DETERMINISTIC);
assert.equal(defaultBoundary.decision, DRAFT_PROVIDER_DECISIONS.USE_DETERMINISTIC);
assert.equal(defaultBoundary.callsExternalProvider, false);
assert.equal(defaultBoundary.providerImplementationIncluded, false);
assert.equal(defaultBoundary.conversationBriefOnly, true);
assert.equal(defaultBoundary.acceptsLegacyProspectMessageContext, false);

const implicitAi = buildOptionalAiDraftProviderBoundary({
  ...gates,
  requestedProvider: DRAFT_PROVIDER_IDS.OPTIONAL_AI,
});
assert.equal(implicitAi.decision, DRAFT_PROVIDER_DECISIONS.BLOCK_PROVIDER_SELECTION);
assert.ok(implicitAi.errors.some((error) => error.code === "PROVIDER_SELECTION_MUST_BE_EXPLICIT"));
assert.ok(implicitAi.errors.some((error) => error.code === "OPTIONAL_AI_PROVIDER_NOT_ENABLED"));

const noDraftFallback = buildOptionalAiDraftProviderBoundary({
  ...gates,
  conversationBrief,
  requestedProvider: DRAFT_PROVIDER_IDS.OPTIONAL_AI,
  providerSelectionExplicit: true,
  optionalAiProviderEnabled: true,
  providerResult: { result: DRAFT_PROVIDER_RESULTS.NO_DRAFT },
});
assert.equal(noDraftFallback.decision, DRAFT_PROVIDER_DECISIONS.FALLBACK_TO_DETERMINISTIC);
assert.equal(noDraftFallback.conversationBriefValid, true);
assert.equal(noDraftFallback.deterministicFallbackRequired, true);
assert.equal(noDraftFallback.deterministicFallbackSelected, true);

const missingGates = buildOptionalAiDraftProviderBoundary({
  contextContract: true,
  privacyPolicy: true,
});
assert.equal(missingGates.decision, DRAFT_PROVIDER_DECISIONS.BLOCK_PROVIDER_SELECTION);
assert.ok(missingGates.errors.some((error) => error.code === "CTAGOVERNANCE_REQUIRED"));
assert.ok(missingGates.errors.some((error) => error.code === "SAFETYVALIDATOR_REQUIRED"));
assert.ok(missingGates.errors.some((error) => error.code === "HUMANAPPROVAL_REQUIRED"));
assert.equal(missingGates.bypassAllowed, false);
assert.equal(missingGates.safetyPipelinePreserved, true);
assert.equal(missingGates.modifiesContextAdapter, false);
assert.equal(missingGates.modifiesDraftAdapterBehavior, false);

const invalidBrief = buildOptionalAiDraftProviderBoundary({
  ...gates,
  conversationBrief: { status: "SUCCESS" },
  requestedProvider: DRAFT_PROVIDER_IDS.OPTIONAL_AI,
  providerSelectionExplicit: true,
  optionalAiProviderEnabled: true,
});
assert.equal(invalidBrief.decision, DRAFT_PROVIDER_DECISIONS.BLOCK_PROVIDER_SELECTION);
assert.ok(invalidBrief.errors.some((error) => error.code === "PROVIDER_NOT_ALLOWED_BY_BRIEF"));

console.log("067G17N12 OPTIONAL AI DRAFT PROVIDER BOUNDARY: PASS");
