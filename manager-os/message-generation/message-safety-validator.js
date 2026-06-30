"use strict";

const MESSAGE_SAFETY_VALIDATOR_STATUSES = Object.freeze({
  READY_FOR_HUMAN_REVIEW: "READY_FOR_HUMAN_REVIEW",
  NEEDS_REVISION: "NEEDS_REVISION",
  BLOCKED: "BLOCKED",
  NEEDS_DRAFT: "NEEDS_DRAFT",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MESSAGE_SAFETY_VALIDATOR_DECISIONS = Object.freeze({
  MARK_SAFE_FOR_HUMAN_REVIEW_ONLY: "MARK_SAFE_FOR_HUMAN_REVIEW_ONLY",
  REQUEST_REVISION: "REQUEST_REVISION",
  BLOCK_DRAFT_FOR_HUMAN_REVIEW: "BLOCK_DRAFT_FOR_HUMAN_REVIEW",
  COLLECT_DRAFT: "COLLECT_DRAFT",
  COLLECT_EVIDENCE: "COLLECT_EVIDENCE",
  COLLECT_SOURCE_OWNER: "COLLECT_SOURCE_OWNER",
  REFRESH_CONTEXT: "REFRESH_CONTEXT",
  REQUIRE_HUMAN_REVIEW: "REQUIRE_HUMAN_REVIEW",
  NOT_MODELED_FOR_USE: "NOT_MODELED_FOR_USE"
});

const MESSAGE_SAFETY_RISKS = Object.freeze({
  PRESSURE_LANGUAGE: "PRESSURE_LANGUAGE",
  SHAME_LANGUAGE: "SHAME_LANGUAGE",
  MANIPULATION: "MANIPULATION",
  FALSE_URGENCY: "FALSE_URGENCY",
  INVENTED_INTENT: "INVENTED_INTENT",
  UNSUPPORTED_PRODUCT_CLAIM: "UNSUPPORTED_PRODUCT_CLAIM",
  UNSUPPORTED_INCOME_CLAIM: "UNSUPPORTED_INCOME_CLAIM",
  UNSUPPORTED_PROTECTION_DIAGNOSIS: "UNSUPPORTED_PROTECTION_DIAGNOSIS",
  HR_HIRING_PROMOTION_PUNISHMENT: "HR_HIRING_PROMOTION_PUNISHMENT",
  COMPENSATION_REVENUE_PAYOUT_TRUTH: "COMPENSATION_REVENUE_PAYOUT_TRUTH",
  ADVISOR_LIFECYCLE_TRUTH: "ADVISOR_LIFECYCLE_TRUTH",
  MESSAGE_SEND_CLAIM: "MESSAGE_SEND_CLAIM",
  TASK_CALENDAR_EXECUTION_CLAIM: "TASK_CALENDAR_EXECUTION_CLAIM",
  MISSING_EVIDENCE_REFERENCES: "MISSING_EVIDENCE_REFERENCES",
  MISSING_SOURCE_OWNER: "MISSING_SOURCE_OWNER",
  STALE_OR_UNKNOWN_FRESHNESS: "STALE_OR_UNKNOWN_FRESHNESS",
  OUTSIDE_PROMPT_PURPOSE: "OUTSIDE_PROMPT_PURPOSE",
  PRIVATE_MOTIVATION_LEVERAGE: "PRIVATE_MOTIVATION_LEVERAGE",
  FAMILY_CHILDREN_FEAR_LEVERAGE: "FAMILY_CHILDREN_FEAR_LEVERAGE",
  MEDICAL_FINANCIAL_LEGAL_CERTAINTY: "MEDICAL_FINANCIAL_LEGAL_CERTAINTY"
});

const ALLOWED_MESSAGE_SAFETY_VALIDATOR_USES = Object.freeze([
  "SAFETY_REVIEW_PREP",
  "HUMAN_REVIEW_PREP",
  "MESSAGE_REVISION_REVIEW",
  "LLM_DRAFT_INTAKE"
]);

const FORBIDDEN_MESSAGE_SAFETY_VALIDATOR_USES = Object.freeze([
  "LLM_RUNTIME_EXECUTION",
  "GENERATE_DRAFT",
  "AUTO_APPROVE_DRAFT",
  "SEND_MESSAGE",
  "WHATSAPP_SEND",
  "SMS_SEND",
  "CREATE_TASK",
  "CREATE_CALENDAR_EVENT",
  "NASH_RUNTIME_EXECUTION",
  "NEXT_BEST_ACTION_EXECUTION",
  "HUMAN_RANKING",
  "PROMOTION_DECISION",
  "PUNISHMENT",
  "TERMINATION",
  "COMPENSATION",
  "PAYOUT",
  "REVENUE_TRUTH",
  "ADVISOR_LIFECYCLE_TRUTH",
  "HR_DECISION",
  "HIRING_DECISION"
]);

function present(value) {
  return value !== undefined && value !== null && value !== "";
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  if (!present(value)) return [];
  return Array.isArray(value) ? value.filter(present) : [value].filter(present);
}

function unique(values) {
  return [...new Set(asArray(values).flat().filter(present))];
}

function normalizeText(value) {
  return present(value) ? String(value).trim().toUpperCase() : null;
}

function normalizeDraft(value) {
  return present(value)
    ? String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    : "";
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function collectNested(value, field) {
  if (!present(value)) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => collectNested(entry, field));
  if (!isObject(value)) return [];
  return [
    ...asArray(value[field]),
    ...Object.values(value).flatMap((entry) => collectNested(entry, field))
  ];
}

function collectEvidenceRefs(values, direct = {}) {
  return unique([
    ...asArray(direct.evidenceRefs),
    ...asArray(direct.evidenceRef),
    ...values.flatMap((value) => collectNested(value, "evidenceRefs")),
    ...values.flatMap((value) => collectNested(value, "evidenceRef"))
  ]);
}

function collectSourceEvidenceIds(values, direct = {}) {
  return unique([
    ...asArray(direct.sourceEvidenceIds),
    ...asArray(direct.sourceEvidenceId),
    ...values.flatMap((value) => collectNested(value, "sourceEvidenceIds")),
    ...values.flatMap((value) => collectNested(value, "sourceEvidenceId"))
  ]);
}

function collectSourceOwners(values, direct = {}) {
  return unique([
    ...asArray(direct.sourceOwners),
    ...asArray(direct.sourceOwner),
    ...values.flatMap((value) => collectNested(value, "sourceOwners")),
    ...values.flatMap((value) => collectNested(value, "sourceOwner"))
  ]);
}

function resolveFreshness(values, freshness) {
  const candidates = unique([
    freshness,
    ...values.flatMap((value) => collectNested(value, "freshness")),
    ...values.flatMap((value) => collectNested(value, "freshnessStatus")),
    ...values.flatMap((value) => collectNested(value, "generatedAt")),
    ...values.flatMap((value) => collectNested(value, "capturedAt")),
    ...values.flatMap((value) => collectNested(value, "updatedAt"))
  ]);
  const first = freshness || candidates[0] || null;
  const status = normalizeText(isObject(first) ? first.status : first);
  const stale =
    status === "STALE" ||
    status === "EXPIRED" ||
    values.some((value) => isObject(value) && (value.stale === true || normalizeText(value.status) === "STALE"));

  return {
    value: first,
    available: candidates.length > 0,
    stale
  };
}

function resolveUse(requestedUse) {
  const normalized = normalizeText(requestedUse);
  if (!normalized) return { allowedUses: ["SAFETY_REVIEW_PREP"], blockedUses: [], unknownUses: [] };
  if (FORBIDDEN_MESSAGE_SAFETY_VALIDATOR_USES.includes(normalized)) return { allowedUses: [], blockedUses: [normalized], unknownUses: [] };
  if (ALLOWED_MESSAGE_SAFETY_VALIDATOR_USES.includes(normalized)) return { allowedUses: [normalized], blockedUses: [], unknownUses: [] };
  return { allowedUses: [], blockedUses: [normalized], unknownUses: [normalized] };
}

function matchRisk(draft, risk, patterns) {
  return patterns.some((pattern) => pattern.test(draft)) ? [risk] : [];
}

function detectRisks(draftText, draftPurpose) {
  const draft = normalizeDraft(draftText);
  const purpose = normalizeDraft(draftPurpose);
  const risks = [
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.PRESSURE_LANGUAGE, [/tienes que/, /debes hacerlo/, /no puedes dejar pasar/, /ultimatum/, /presion/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.SHAME_LANGUAGE, [/irresponsable/, /te vas a arrepentir/, /mal padre/, /mala madre/, /verguenza/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.MANIPULATION, [/si de verdad/, /demuestra que/, /si te importa/, /usa esto a tu favor/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.FALSE_URGENCY, [/solo hoy/, /ultima oportunidad/, /se acaba hoy/, /ahora o nunca/, /urgente sin falta/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.INVENTED_INTENT, [/se que quieres/, /se que necesitas/, /tu intencion es/, /seguro estas buscando/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.UNSUPPORTED_PRODUCT_CLAIM, [/cubre todo/, /garantizado por el producto/, /mejor seguro/, /beneficio garantizado/, /producto perfecto/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.UNSUPPORTED_INCOME_CLAIM, [/ganaras/, /vas a ganar/, /ingreso garantizado/, /te pagaran/, /\$\s?\d+/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.UNSUPPORTED_PROTECTION_DIAGNOSIS, [/necesitas un seguro/, /estas desprotegido/, /tu familia no esta protegida/, /diagnostico/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.HR_HIRING_PROMOTION_PUNISHMENT, [/estas contratado/, /estas despedido/, /seras promovido/, /te vamos a castigar/, /sancion/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.COMPENSATION_REVENUE_PAYOUT_TRUTH, [/pago garantizado/, /payout/, /compensacion oficial/, /revenue truth/, /ingreso oficial/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.ADVISOR_LIFECYCLE_TRUTH, [/ya eres asesor/, /advisor lifecycle truth/, /precontract oficial/, /quedaste como manager/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.MESSAGE_SEND_CLAIM, [/ya envie/, /se envio/, /mandare este mensaje/, /enviar por whatsapp/, /enviar sms/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.TASK_CALENDAR_EXECUTION_CLAIM, [/cree una tarea/, /agende en calendario/, /calendar event/, /task created/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.PRIVATE_MOTIVATION_LEVERAGE, [/tu miedo/, /tu motivacion privada/, /como me contaste en privado/, /usa su dolor/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.FAMILY_CHILDREN_FEAR_LEVERAGE, [/tus hijos sufriran/, /si mueres tus hijos/, /tu familia quedara en la calle/, /miedo por tus hijos/]),
    ...matchRisk(draft, MESSAGE_SAFETY_RISKS.MEDICAL_FINANCIAL_LEGAL_CERTAINTY, [/cura garantizada/, /legalmente seguro/, /sin riesgo financiero/, /certeza medica/, /100% seguro/])
  ];

  if (purpose && /contratacion|hiring|promocion|promotion|compensacion|payout|revenue/.test(draft) && !new RegExp(purpose).test(draft)) {
    risks.push(MESSAGE_SAFETY_RISKS.OUTSIDE_PROMPT_PURPOSE);
  }

  return unique(risks);
}

function blockedRiskSet() {
  return new Set([
    MESSAGE_SAFETY_RISKS.HR_HIRING_PROMOTION_PUNISHMENT,
    MESSAGE_SAFETY_RISKS.COMPENSATION_REVENUE_PAYOUT_TRUTH,
    MESSAGE_SAFETY_RISKS.ADVISOR_LIFECYCLE_TRUTH,
    MESSAGE_SAFETY_RISKS.MESSAGE_SEND_CLAIM,
    MESSAGE_SAFETY_RISKS.TASK_CALENDAR_EXECUTION_CLAIM,
    MESSAGE_SAFETY_RISKS.MEDICAL_FINANCIAL_LEGAL_CERTAINTY
  ]);
}

function falseFlags() {
  return {
    humanApprovalRequired: true,
    automaticApprovalAllowed: false,
    automaticDecisionAllowed: false,
    safeForSend: false,
    sendsMessage: false,
    createsTask: false,
    createsCalendarEvent: false,
    executesLlmRuntime: false,
    executesNashRuntime: false,
    executesDeliveryAdapter: false,
    executesNextBestAction: false,
    createsDownstreamTruth: false,
    createsManagerJudgmentTruth: false,
    createsHumanRankingTruth: false,
    createsPromotionDecisionTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false,
    createsHRTruth: false,
    createsHiringTruth: false,
    createsMessageSendTruth: false,
    createsTaskTruth: false,
    createsCalendarTruth: false
  };
}

function resolveStatus({
  blockedUses,
  unknownUses,
  draftText,
  evidenceRefs,
  sourceEvidenceIds,
  sourceOwners,
  freshnessContext,
  detectedRisks,
  blockedReasons
}) {
  if (blockedUses.length > 0) {
    return unknownUses.length > 0
      ? MESSAGE_SAFETY_VALIDATOR_STATUSES.NOT_MODELED
      : MESSAGE_SAFETY_VALIDATOR_STATUSES.BLOCKED;
  }
  if (!present(draftText)) return MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_DRAFT;
  if (evidenceRefs.length === 0 && sourceEvidenceIds.length === 0) return MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_EVIDENCE;
  if (sourceOwners.length === 0) return MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_SOURCE_OWNER;
  if (!freshnessContext.available || freshnessContext.stale) return MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_FRESHNESS;
  if (blockedReasons.length > 0) return MESSAGE_SAFETY_VALIDATOR_STATUSES.BLOCKED;
  if (detectedRisks.length > 0) return MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_REVISION;
  return MESSAGE_SAFETY_VALIDATOR_STATUSES.READY_FOR_HUMAN_REVIEW;
}

function resolveDecision(status) {
  if (status === MESSAGE_SAFETY_VALIDATOR_STATUSES.BLOCKED) return MESSAGE_SAFETY_VALIDATOR_DECISIONS.BLOCK_DRAFT_FOR_HUMAN_REVIEW;
  if (status === MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_REVISION) return MESSAGE_SAFETY_VALIDATOR_DECISIONS.REQUEST_REVISION;
  if (status === MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_DRAFT) return MESSAGE_SAFETY_VALIDATOR_DECISIONS.COLLECT_DRAFT;
  if (status === MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_EVIDENCE) return MESSAGE_SAFETY_VALIDATOR_DECISIONS.COLLECT_EVIDENCE;
  if (status === MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_SOURCE_OWNER) return MESSAGE_SAFETY_VALIDATOR_DECISIONS.COLLECT_SOURCE_OWNER;
  if (status === MESSAGE_SAFETY_VALIDATOR_STATUSES.NEEDS_FRESHNESS) return MESSAGE_SAFETY_VALIDATOR_DECISIONS.REFRESH_CONTEXT;
  if (status === MESSAGE_SAFETY_VALIDATOR_STATUSES.NOT_MODELED) return MESSAGE_SAFETY_VALIDATOR_DECISIONS.NOT_MODELED_FOR_USE;
  if (status !== MESSAGE_SAFETY_VALIDATOR_STATUSES.READY_FOR_HUMAN_REVIEW) return MESSAGE_SAFETY_VALIDATOR_DECISIONS.REQUIRE_HUMAN_REVIEW;
  return MESSAGE_SAFETY_VALIDATOR_DECISIONS.MARK_SAFE_FOR_HUMAN_REVIEW_ONLY;
}

function validateMessageDraftSafety({
  draftIntake = null,
  draftText = null,
  draftPurpose = null,
  audienceType = null,
  promptContext = null,
  evidenceRefs = [],
  sourceEvidenceIds = [],
  sourceOwners = [],
  freshness = null,
  period = null,
  requestedUse = null
} = {}) {
  const safeDraftIntake = clone(draftIntake);
  const safePromptContext = clone(promptContext);
  const effectiveDraftText = present(draftText) ? draftText : safeDraftIntake?.draftText || null;
  const effectiveDraftPurpose = present(draftPurpose) ? draftPurpose : safeDraftIntake?.draftPurpose || null;
  const effectiveAudienceType = present(audienceType) ? audienceType : safeDraftIntake?.audienceType || null;
  const values = [safeDraftIntake, safePromptContext, period];
  const collectedEvidenceRefs = collectEvidenceRefs(values, { evidenceRefs });
  const collectedSourceEvidenceIds = collectSourceEvidenceIds(values, { sourceEvidenceIds });
  const collectedSourceOwners = collectSourceOwners(values, { sourceOwners });
  const freshnessContext = resolveFreshness(values, freshness || safeDraftIntake?.freshness || null);
  const { allowedUses, blockedUses, unknownUses } = resolveUse(requestedUse);
  const textRisks = detectRisks(effectiveDraftText, effectiveDraftPurpose);
  const metadataRisks = unique([
    collectedEvidenceRefs.length === 0 && collectedSourceEvidenceIds.length === 0 ? MESSAGE_SAFETY_RISKS.MISSING_EVIDENCE_REFERENCES : null,
    collectedSourceOwners.length === 0 ? MESSAGE_SAFETY_RISKS.MISSING_SOURCE_OWNER : null,
    (!freshnessContext.available || freshnessContext.stale) ? MESSAGE_SAFETY_RISKS.STALE_OR_UNKNOWN_FRESHNESS : null
  ]);
  const detectedRisks = unique([...textRisks, ...metadataRisks]);
  const hardBlockedRisks = blockedRiskSet();
  const blockedReasons = unique([
    ...blockedUses,
    ...textRisks.filter((risk) => hardBlockedRisks.has(risk))
  ]);
  const requiredRevisions = detectedRisks.filter((risk) => !blockedReasons.includes(risk));
  const safetyStatus = resolveStatus({
    blockedUses,
    unknownUses,
    draftText: effectiveDraftText,
    evidenceRefs: collectedEvidenceRefs,
    sourceEvidenceIds: collectedSourceEvidenceIds,
    sourceOwners: collectedSourceOwners,
    freshnessContext,
    detectedRisks: textRisks,
    blockedReasons
  });
  const warnings = unique([
    "draft_is_not_approved_communication",
    "safety_validation_is_not_human_approval",
    "human_approval_required_before_action",
    ...detectedRisks.map((risk) => `detected_${risk.toLowerCase()}`)
  ]);
  const confidenceLimitations = unique([
    "validator_does_not_rewrite_or_approve_messages",
    "safe_for_send_remains_false",
    collectedEvidenceRefs.length === 0 && collectedSourceEvidenceIds.length === 0 ? "missing_evidence_requires_review" : null,
    collectedSourceOwners.length === 0 ? "missing_source_owner_requires_review" : null,
    !freshnessContext.available ? "missing_freshness_requires_review" : null,
    freshnessContext.stale ? "stale_freshness_requires_review" : null
  ]);

  return {
    safetyStatus,
    safetyDecision: resolveDecision(safetyStatus),
    draftText: effectiveDraftText,
    draftPurpose: effectiveDraftPurpose,
    audienceType: effectiveAudienceType,
    promptContext: safePromptContext || safeDraftIntake?.promptContext || null,
    evidenceRefs: collectedEvidenceRefs,
    sourceEvidenceIds: collectedSourceEvidenceIds,
    sourceOwners: collectedSourceOwners,
    freshness: freshnessContext.value,
    period: clone(period || safeDraftIntake?.period || null),
    detectedRisks,
    blockedReasons,
    requiredRevisions,
    missingEvidence: collectedEvidenceRefs.length === 0 && collectedSourceEvidenceIds.length === 0 ? ["draft_evidence_missing"] : [],
    unknownContext: [],
    staleContext: freshnessContext.stale ? ["freshness_stale"] : [],
    warnings,
    confidenceLimitations,
    allowedUses,
    blockedUses,
    safeForHumanReview: safetyStatus === MESSAGE_SAFETY_VALIDATOR_STATUSES.READY_FOR_HUMAN_REVIEW,
    ...falseFlags()
  };
}

module.exports = {
  validateMessageDraftSafety,
  MESSAGE_SAFETY_VALIDATOR_STATUSES,
  MESSAGE_SAFETY_VALIDATOR_DECISIONS,
  MESSAGE_SAFETY_RISKS,
  ALLOWED_MESSAGE_SAFETY_VALIDATOR_USES,
  FORBIDDEN_MESSAGE_SAFETY_VALIDATOR_USES
};
