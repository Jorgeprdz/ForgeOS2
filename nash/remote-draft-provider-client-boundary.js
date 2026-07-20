"use strict";

const FUNCTION_NAME = "nash-draft-provider";
const DEFAULT_PROVIDER = "deterministic";
const SUPPORTED_REMOTE_PROVIDERS = Object.freeze(["gemini", "openai"]);
const RESULT_STATES = Object.freeze({
  SUCCESS: "SUCCESS",
  NO_DRAFT: "NO_DRAFT",
  ERROR: "ERROR",
});

function nowIso() {
  return new Date().toISOString();
}

function normalizeProvider(providerId) {
  return String(providerId || DEFAULT_PROVIDER).trim().toLowerCase() || DEFAULT_PROVIDER;
}

function metadata(providerId, generationMode, startedAt) {
  return {
    providerId,
    modelId: "client-boundary",
    generationMode,
    generatedAt: nowIso(),
    durationMs: Date.now() - startedAt,
    deterministicFallbackRequired: true,
    externalProviderEnabled: false,
  };
}

function errorEnvelope(providerId, code, message, retryable, generationMode, startedAt) {
  return {
    resultState: RESULT_STATES.ERROR,
    draftCandidate: null,
    metadata: metadata(providerId, generationMode, startedAt),
    error: { code, message, retryable },
    deterministicFallbackRequired: true,
    deterministicFallbackSelected: true,
  };
}

function noDraftEnvelope(providerId, generationMode, startedAt) {
  return {
    resultState: RESULT_STATES.NO_DRAFT,
    draftCandidate: null,
    metadata: metadata(providerId, generationMode, startedAt),
    error: null,
    deterministicFallbackRequired: true,
    deterministicFallbackSelected: true,
  };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isN13Envelope(value) {
  if (!isObject(value)) return false;
  if (!Object.values(RESULT_STATES).includes(value.resultState)) return false;
  if (!isObject(value.metadata)) return false;
  if (typeof value.metadata.providerId !== "string") return false;
  if (typeof value.metadata.modelId !== "string") return false;
  if (typeof value.metadata.generationMode !== "string") return false;
  if (typeof value.metadata.generatedAt !== "string") return false;
  if (value.resultState === RESULT_STATES.SUCCESS) return isObject(value.draftCandidate) && value.error === null;
  if (value.resultState === RESULT_STATES.NO_DRAFT) return value.draftCandidate === null && value.error === null;
  return value.draftCandidate === null && isObject(value.error) && typeof value.error.code === "string" && typeof value.error.message === "string" && typeof value.error.retryable === "boolean";
}

function normalizeEnvelope(value, providerId, startedAt) {
  if (!isN13Envelope(value)) {
    return errorEnvelope(
      providerId,
      "UNKNOWN_PROVIDER_ERROR",
      "NASH draft provider returned an invalid N13 envelope.",
      false,
      "invalid_response",
      startedAt,
    );
  }
  return Object.freeze({
    ...value,
    deterministicFallbackRequired: value.resultState !== RESULT_STATES.SUCCESS,
    deterministicFallbackSelected: value.resultState !== RESULT_STATES.SUCCESS,
  });
}

function withTimeout(promise, timeoutMs, providerId, startedAt) {
  let timer = null;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      resolve(errorEnvelope(
        providerId,
        "PROVIDER_TIMEOUT",
        "NASH draft provider request timed out.",
        true,
        "timeout",
        startedAt,
      ));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function createRemoteDraftProviderClient({
  invokeFunction,
  timeoutMs = 5000,
} = {}) {
  if (typeof invokeFunction !== "function") throw new Error("REMOTE_DRAFT_PROVIDER_INVOKE_REQUIRED");

  async function requestDraft({ providerId = DEFAULT_PROVIDER, prospectMessageContext = null } = {}) {
    const startedAt = Date.now();
    const selectedProvider = normalizeProvider(providerId);

    if (selectedProvider === DEFAULT_PROVIDER) {
      return noDraftEnvelope(DEFAULT_PROVIDER, "local_deterministic_flow_required", startedAt);
    }

    if (!SUPPORTED_REMOTE_PROVIDERS.includes(selectedProvider)) {
      return errorEnvelope(
        selectedProvider,
        "UNKNOWN_PROVIDER_ERROR",
        "Provider selection is not supported by the remote draft provider client boundary.",
        false,
        "provider_selection",
        startedAt,
      );
    }

    if (!isObject(prospectMessageContext)) {
      return errorEnvelope(
        selectedProvider,
        "PROSPECT_MESSAGE_CONTEXT_INVALID",
        "prospectMessageContext must be a non-array object.",
        false,
        "request_validation",
        startedAt,
      );
    }

    const remoteCall = Promise.resolve()
      .then(() => invokeFunction(FUNCTION_NAME, {
        body: {
          providerId: selectedProvider,
          prospectMessageContext,
        },
      }))
      .then((response) => {
        if (response && response.error) {
          return errorEnvelope(
            selectedProvider,
            "PROVIDER_UNAVAILABLE",
            "NASH draft provider function is unavailable.",
            true,
            "function_unavailable",
            startedAt,
          );
        }
        return normalizeEnvelope(response?.data ?? response, selectedProvider, startedAt);
      })
      .catch(() => errorEnvelope(
        selectedProvider,
        "PROVIDER_UNAVAILABLE",
        "NASH draft provider function is unavailable.",
        true,
        "network_error",
        startedAt,
      ));

    return withTimeout(remoteCall, timeoutMs, selectedProvider, startedAt);
  }

  return Object.freeze({
    functionName: FUNCTION_NAME,
    defaultProvider: DEFAULT_PROVIDER,
    externalProviderEnabled: false,
    requestDraft,
  });
}

module.exports = {
  createRemoteDraftProviderClient,
  FUNCTION_NAME,
  DEFAULT_PROVIDER,
  RESULT_STATES,
};
