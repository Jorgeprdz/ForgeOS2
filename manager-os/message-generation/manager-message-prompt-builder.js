"use strict";

const {
  evaluateManagerMessagePromptBuilderBoundary,
  MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES,
  ALLOWED_MANAGER_MESSAGE_PROMPT_USES,
  FORBIDDEN_MANAGER_MESSAGE_PROMPT_USES
} = require("./manager-message-prompt-builder-boundary-contract");

const MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES = Object.freeze({
  READY_FOR_PROMPT_REVIEW: "READY_FOR_PROMPT_REVIEW",
  NEEDS_CONTEXT: "NEEDS_CONTEXT",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MANAGER_MESSAGE_PROMPT_BUILDER_DECISIONS = Object.freeze({
  RETURN_PROMPT_INSTRUCTIONS: "RETURN_PROMPT_INSTRUCTIONS",
  REQUIRE_CONTEXT_REVIEW: "REQUIRE_CONTEXT_REVIEW",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE"
});

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value.filter((item) => item !== undefined && item !== null && item !== "") : [value].filter((item) => item !== undefined && item !== null && item !== "");
}

function unique(values) {
  return [...new Set(asArray(values).flat().filter((item) => item !== undefined && item !== null && item !== ""))];
}

function falseFlags() {
  return {
    humanApprovalRequired: true,
    automaticDecisionAllowed: false,
    createsDraft: false,
    sendsMessage: false,
    createsTask: false,
    createsCalendarEvent: false,
    executesNashRuntime: false,
    executesLlmRuntime: false,
    executesLegacyNashMessageEngine: false,
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

function summarizeAudience(audienceType) {
  if (!audienceType) return "UNKNOWN_AUDIENCE_CONTEXT";
  return String(audienceType).trim().toUpperCase();
}

function buildPromptInstructions({
  managerContext,
  nashConversationContext,
  messagePurpose,
  audienceType,
  boundary
}) {
  return {
    instructionType: "PROMPT_INSTRUCTIONS_ONLY",
    contextOnly: true,
    notFinalMessage: true,
    notDraft: true,
    communicationGoal: messagePurpose || "REVIEW_CONTEXT_BEFORE_COMMUNICATION",
    audienceContext: {
      audienceType: summarizeAudience(audienceType),
      managerContextAvailable: !!managerContext,
      nashConversationContextAvailable: !!nashConversationContext,
      contextOnly: true
    },
    evidenceBoundaries: {
      evidenceRefs: boundary.evidenceRefs,
      sourceEvidenceIds: boundary.sourceEvidenceIds,
      sourceOwners: boundary.sourceOwners,
      freshness: boundary.freshness,
      missingContext: boundary.missingContext,
      unknownContext: boundary.unknownContext,
      staleContext: boundary.staleContext,
      missingEvidenceIsNotNegativeEvidence: true,
      unknownIsNotZero: true,
      blockedIsNotZero: true
    },
    toneGuidance: [
      "Use respectful, non-pressuring language.",
      "Ask for human review before any external communication.",
      "Do not imply approval, rejection, hiring, promotion, punishment, compensation, revenue or payout truth."
    ],
    prohibitedLanguage: [
      "No ready-to-send message text.",
      "No WhatsApp or SMS delivery instruction.",
      "No task or calendar creation instruction.",
      "No next-best-action execution instruction.",
      "No HR, hiring, ranking, promotion, punishment or termination language.",
      "No invented facts or source-free claims."
    ],
    requiredDisclaimers: [
      "Prompt is not draft.",
      "Draft is not approved communication.",
      "Nash support is not Nash runtime execution.",
      "Human approval is mandatory before action."
    ],
    askStyle: "Prepare questions or framing instructions only; do not write final message copy.",
    followupStyle: "Prepare follow-up guidance only; do not create a sendable follow-up draft.",
    humanApprovalReminder: "A manager must approve any future draft before any delivery adapter or external action.",
    blockedInstructionTypes: [
      "FINAL_WHATSAPP_MESSAGE",
      "FINAL_SMS_MESSAGE",
      "READY_TO_SEND_DRAFT",
      "TASK_CREATION",
      "CALENDAR_CREATION",
      "NEXT_BEST_ACTION_EXECUTION"
    ],
    createsDraft: false,
    sendsMessage: false,
    executesNashRuntime: false,
    executesLlmRuntime: false
  };
}

function resolveDecision(promptStatus) {
  if (promptStatus === MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.BLOCKED || promptStatus === MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.NOT_MODELED) {
    return MANAGER_MESSAGE_PROMPT_BUILDER_DECISIONS.BLOCK_FORBIDDEN_USE;
  }
  if (promptStatus !== MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES.READY_FOR_PROMPT_REVIEW) {
    return MANAGER_MESSAGE_PROMPT_BUILDER_DECISIONS.REQUIRE_CONTEXT_REVIEW;
  }
  return MANAGER_MESSAGE_PROMPT_BUILDER_DECISIONS.RETURN_PROMPT_INSTRUCTIONS;
}

function buildManagerMessagePrompt({
  managerContext = null,
  nashConversationContext = null,
  messagePurpose = null,
  audienceType = null,
  requestedUse = null,
  evidenceRefs = [],
  sourceEvidenceIds = [],
  sourceOwners = [],
  freshness = null,
  period = null
} = {}) {
  const safeManagerContext = clone(managerContext);
  const safeNashContext = clone(nashConversationContext);
  const boundary = evaluateManagerMessagePromptBuilderBoundary({
    managerContext: safeManagerContext,
    nashConversationContext: safeNashContext,
    messagePurpose,
    audienceType,
    requestedUse,
    evidenceRefs,
    sourceEvidenceIds,
    sourceOwners,
    freshness,
    period
  });
  const promptStatus = boundary.promptStatus || MANAGER_MESSAGE_PROMPT_BUILDER_BOUNDARY_STATUSES.UNKNOWN;
  const promptInstructions = buildPromptInstructions({
    managerContext: safeManagerContext,
    nashConversationContext: safeNashContext,
    messagePurpose,
    audienceType,
    boundary
  });

  return {
    promptStatus,
    promptDecision: resolveDecision(promptStatus),
    promptPurpose: messagePurpose || null,
    audienceType: audienceType || null,
    promptInstructions,
    boundaryContext: boundary,
    evidenceRefs: unique(boundary.evidenceRefs),
    sourceEvidenceIds: unique(boundary.sourceEvidenceIds),
    sourceOwners: unique(boundary.sourceOwners),
    freshness: boundary.freshness,
    period: clone(period),
    missingContext: unique(boundary.missingContext),
    unknownContext: unique(boundary.unknownContext),
    staleContext: unique(boundary.staleContext),
    warnings: unique(boundary.warnings),
    confidenceLimitations: unique(boundary.confidenceLimitations),
    allowedUses: unique(boundary.allowedUses),
    blockedUses: unique(boundary.blockedUses),
    managerReviewRequired: boundary.managerReviewRequired,
    humanReviewRequired: true,
    ...falseFlags()
  };
}

module.exports = {
  buildManagerMessagePrompt,
  MANAGER_MESSAGE_PROMPT_BUILDER_STATUSES,
  MANAGER_MESSAGE_PROMPT_BUILDER_DECISIONS,
  ALLOWED_MANAGER_MESSAGE_PROMPT_USES,
  FORBIDDEN_MANAGER_MESSAGE_PROMPT_USES
};
