import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import {
  buildGeminiDraftProviderResponse,
  GEMINI_FLASH_MODEL_ID,
  validateProviderDraftRequest,
} from "./gemini-provider.mjs";

const FUNCTION_VERSION = "nash-draft-provider-nfast05-brief-only";

const RESULT_STATES = {
  SUCCESS: "SUCCESS",
  NO_DRAFT: "NO_DRAFT",
  ERROR: "ERROR",
} as const;

const PROVIDERS = {
  DETERMINISTIC: "deterministic",
  GEMINI: "gemini",
  OPENAI: "openai",
} as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ResultState = typeof RESULT_STATES[keyof typeof RESULT_STATES];

type ProviderId = typeof PROVIDERS[keyof typeof PROVIDERS];

type ProviderDraftError = {
  code: string;
  message: string;
  retryable: boolean;
};

type ProviderMetadata = {
  providerId: string;
  modelId: string;
  generationMode: string;
  generatedAt: string;
  durationMs?: number;
  functionVersion: string;
  externalProviderEnabled: boolean;
  deterministicFallbackRequired: true;
  briefReference?: string | null;
  briefVersion?: string | null;
};

type ProviderEnvelope = {
  resultState: ResultState;
  draftCandidate: unknown;
  metadata: ProviderMetadata;
  error: ProviderDraftError | null;
  persistencePerformed: false;
  pipelineMutationPerformed: false;
  timelineEventCreated: false;
  nbaExecuted: false;
  taskCreated: false;
  calendarEventCreated: false;
  whatsappOpened: false;
  messageSent: false;
  externalActionPerformed: false;
  humanApprovalRequired: true;
  approved: false;
  sent: false;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function metadata(providerId: string, generationMode: string, startedAt: number): ProviderMetadata {
  return {
    providerId,
    modelId: "not-enabled",
    generationMode,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    functionVersion: FUNCTION_VERSION,
    externalProviderEnabled: false,
    deterministicFallbackRequired: true,
  };
}

function envelope({
  resultState,
  providerId,
  generationMode,
  startedAt,
  error = null,
}: {
  resultState: ResultState;
  providerId: string;
  generationMode: string;
  startedAt: number;
  error?: ProviderDraftError | null;
}): ProviderEnvelope {
  return {
    resultState,
    draftCandidate: null,
    metadata: metadata(providerId, generationMode, startedAt),
    error,
    persistencePerformed: false,
    pipelineMutationPerformed: false,
    timelineEventCreated: false,
    nbaExecuted: false,
    taskCreated: false,
    calendarEventCreated: false,
    whatsappOpened: false,
    messageSent: false,
    externalActionPerformed: false,
    humanApprovalRequired: true,
    approved: false,
    sent: false,
  };
}

function deterministicError(code: string, message: string, retryable = false): ProviderDraftError {
  return { code, message, retryable };
}

function normalizeProvider(value: unknown): string {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : PROVIDERS.DETERMINISTIC;
}

function isSupportedProvider(providerId: string): providerId is ProviderId {
  return providerId === PROVIDERS.DETERMINISTIC ||
    providerId === PROVIDERS.GEMINI ||
    providerId === PROVIDERS.OPENAI;
}

async function buildProviderResponse(body: unknown, startedAt = Date.now()): Promise<ProviderEnvelope> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return envelope({
      resultState: RESULT_STATES.ERROR,
      providerId: PROVIDERS.DETERMINISTIC,
      generationMode: "request_validation",
      startedAt,
      error: deterministicError(
        "REQUEST_INVALID",
        "Request body must be an object containing a deterministic conversationBrief.",
      ),
    });
  }

  const request = body as Record<string, unknown>;
  const providerId = normalizeProvider(request.providerId);

  if (!isSupportedProvider(providerId)) {
    return envelope({
      resultState: RESULT_STATES.ERROR,
      providerId,
      generationMode: "provider_selection",
      startedAt,
      error: deterministicError(
        "UNKNOWN_PROVIDER_ERROR",
        "Provider selection is not supported by the NASH draft provider shell.",
      ),
    });
  }

  const validation = validateProviderDraftRequest(request);
  if (!validation.valid) {
    return envelope({
      resultState: RESULT_STATES.ERROR,
      providerId,
      generationMode: "request_validation",
      startedAt,
      error: deterministicError(
        validation.code,
        validation.message,
      ),
    });
  }

  if (providerId === PROVIDERS.DETERMINISTIC) {
    return envelope({
      resultState: RESULT_STATES.NO_DRAFT,
      providerId,
      generationMode: "local_deterministic_flow_required",
      startedAt,
    });
  }

  if (providerId === PROVIDERS.GEMINI) {
    const providerResponse = await buildGeminiDraftProviderResponse({
      conversationBrief: request.conversationBrief,
      requestMetadata: request.requestMetadata || {},
      env: Deno.env,
      createModel: ({ apiKey }: { apiKey: string; modelId: string }) => {
        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ model: GEMINI_FLASH_MODEL_ID });
      },
      startedAt,
    }) as ProviderEnvelope;
    return {
      ...providerResponse,
      metadata: {
        ...providerResponse.metadata,
        functionVersion: FUNCTION_VERSION,
      },
    };
  }

  return envelope({
    resultState: RESULT_STATES.ERROR,
    providerId,
    generationMode: "external_provider_not_enabled",
    startedAt,
    error: deterministicError(
      "PROVIDER_NOT_ENABLED",
      "External AI draft providers are not enabled in this shell.",
    ),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await req.json();
    return jsonResponse(await buildProviderResponse(body));
  } catch (_error) {
    return jsonResponse(
      await buildProviderResponse(null),
      400,
    );
  }
});
