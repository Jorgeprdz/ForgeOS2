"use strict";

const {
  validateConversationBrief
} = require("./conversation-brief/nash-provider-request-contract");

const DRAFT_PROVIDER_IDS = Object.freeze({
  DETERMINISTIC: "DETERMINISTIC",
  OPTIONAL_AI: "OPTIONAL_AI",
});

const DRAFT_PROVIDER_DECISIONS = Object.freeze({
  USE_DETERMINISTIC: "USE_DETERMINISTIC",
  USE_SELECTED_PROVIDER: "USE_SELECTED_PROVIDER",
  FALLBACK_TO_DETERMINISTIC: "FALLBACK_TO_DETERMINISTIC",
  BLOCK_PROVIDER_SELECTION: "BLOCK_PROVIDER_SELECTION",
});

const DRAFT_PROVIDER_RESULTS = Object.freeze({
  DRAFT_CANDIDATE: "DRAFT_CANDIDATE",
  NO_DRAFT: "NO_DRAFT",
});

const REQUIRED_GATES = Object.freeze([
  "contextContract",
  "privacyPolicy",
  "ctaGovernance",
  "safetyValidator",
  "humanApproval",
]);

function normalizeProvider(providerId) {
  const value = String(providerId || DRAFT_PROVIDER_IDS.DETERMINISTIC).trim().toUpperCase();
  return value === DRAFT_PROVIDER_IDS.OPTIONAL_AI ? DRAFT_PROVIDER_IDS.OPTIONAL_AI : DRAFT_PROVIDER_IDS.DETERMINISTIC;
}

function gateSatisfied(value) {
  return value === true || (value && typeof value === "object" && value.satisfied === true);
}

function missingGateCodes(input) {
  return REQUIRED_GATES
    .filter((gate) => !gateSatisfied(input[gate]))
    .map((gate) => `${gate.toUpperCase()}_REQUIRED`);
}

function buildOptionalAiDraftProviderBoundary({
  requestedProvider = DRAFT_PROVIDER_IDS.DETERMINISTIC,
  providerSelectionExplicit = false,
  optionalAiProviderEnabled = false,
  providerResult = null,
  contextContract = null,
  privacyPolicy = null,
  ctaGovernance = null,
  safetyValidator = null,
  humanApproval = null,
  conversationBrief = null,
} = {}) {
  const selectedProvider = normalizeProvider(requestedProvider);
  const missingGates = missingGateCodes({
    contextContract,
    privacyPolicy,
    ctaGovernance,
    safetyValidator,
    humanApproval,
  });
  const errors = missingGates.map((code) => ({ code, severity: "BLOCKING" }));
  const briefValidation = conversationBrief === null ? null : validateConversationBrief(conversationBrief);

  if (briefValidation && !briefValidation.valid) {
    errors.push({ code: briefValidation.code, severity: "BLOCKING" });
  }

  if (selectedProvider !== DRAFT_PROVIDER_IDS.DETERMINISTIC && providerSelectionExplicit !== true) {
    errors.push({ code: "PROVIDER_SELECTION_MUST_BE_EXPLICIT", severity: "BLOCKING" });
  }

  if (selectedProvider === DRAFT_PROVIDER_IDS.OPTIONAL_AI && optionalAiProviderEnabled !== true) {
    errors.push({ code: "OPTIONAL_AI_PROVIDER_NOT_ENABLED", severity: "BLOCKING" });
  }

  const noDraft = providerResult && providerResult.result === DRAFT_PROVIDER_RESULTS.NO_DRAFT;
  const decision = errors.length
    ? DRAFT_PROVIDER_DECISIONS.BLOCK_PROVIDER_SELECTION
    : noDraft
      ? DRAFT_PROVIDER_DECISIONS.FALLBACK_TO_DETERMINISTIC
      : selectedProvider === DRAFT_PROVIDER_IDS.DETERMINISTIC
      ? DRAFT_PROVIDER_DECISIONS.USE_DETERMINISTIC
      : DRAFT_PROVIDER_DECISIONS.USE_SELECTED_PROVIDER;

  return Object.freeze({
    boundaryId: "FORGE_OPTIONAL_AI_DRAFT_PROVIDER_BOUNDARY_067G17N12_V1",
    selectedProvider,
    defaultProvider: DRAFT_PROVIDER_IDS.DETERMINISTIC,
    providerSelectionExplicit: selectedProvider === DRAFT_PROVIDER_IDS.DETERMINISTIC || providerSelectionExplicit === true,
    optionalAiProviderEnabled: optionalAiProviderEnabled === true,
    providerMayReturnNoDraft: true,
    conversationBriefOnly: true,
    acceptsLegacyProspectMessageContext: false,
    conversationBriefValid: briefValidation ? briefValidation.valid : null,
    providerResult: noDraft ? DRAFT_PROVIDER_RESULTS.NO_DRAFT : providerResult?.result || null,
    decision,
    deterministicFallbackRequired: true,
    deterministicFallbackSelected: selectedProvider === DRAFT_PROVIDER_IDS.DETERMINISTIC || noDraft || errors.length > 0,
    errors: Object.freeze(errors),
    requiredGates: REQUIRED_GATES.slice(),
    bypassAllowed: false,
    modifiesContextAdapter: false,
    modifiesDraftAdapterBehavior: false,
    callsExternalProvider: false,
    credentialsRequired: false,
    promptEngineeringIncluded: false,
    providerImplementationIncluded: false,
    persistenceEnabled: false,
    safetyPipelinePreserved: true,
  });
}

module.exports = {
  buildOptionalAiDraftProviderBoundary,
  DRAFT_PROVIDER_IDS,
  DRAFT_PROVIDER_DECISIONS,
  DRAFT_PROVIDER_RESULTS,
  REQUIRED_GATES,
};
