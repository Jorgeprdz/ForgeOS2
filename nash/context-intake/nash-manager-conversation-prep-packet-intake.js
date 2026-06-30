"use strict";

const {
  buildNashManagerContextIntakeBoundary,
  NASH_MANAGER_CONTEXT_INTAKE_STATUS,
  _private
} = require("./nash-manager-context-intake-boundary-contract");

const { clone, asArray, unique } = _private;

const NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_STATUS = Object.freeze({
  READY: "READY",
  UNKNOWN: "UNKNOWN",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED"
});

const NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_DECISIONS = Object.freeze({
  READY_FOR_CONVERSATION_PREP_CONTEXT: "READY_FOR_CONVERSATION_PREP_CONTEXT",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED",
  UNKNOWN_CONTEXT: "UNKNOWN_CONTEXT"
});

function getNested(object, path) {
  return path.reduce((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return current[key];
  }, object);
}

function extractConversationPacket(input) {
  const source = input && typeof input === "object" ? input : {};
  const candidate =
    source.managerNashConversationPacket ||
    source.nashConversationPrepPacket ||
    source.packet ||
    getNested(source, ["managerExternalContextBridge", "nashConversationContext"]) ||
    getNested(source, ["managerExternalContextBridge", "nashConversationPacket"]) ||
    getNested(source, ["externalContextBridge", "nashConversationContext"]) ||
    getNested(source, ["externalContextBridge", "nashConversationPacket"]);

  if (candidate && typeof candidate === "object") return clone(candidate);

  const nonControlKeys = Object.keys(source).filter((key) => !["requestedUse", "use"].includes(key));
  if (nonControlKeys.length > 0) return clone(source);

  return {};
}

function buildDecision(status) {
  if (status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED) {
    return NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_DECISIONS.BLOCKED;
  }
  if (status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.UNKNOWN) {
    return NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_DECISIONS.UNKNOWN_CONTEXT;
  }
  if (status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED) {
    return NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_DECISIONS.REVIEW_REQUIRED;
  }
  return NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_DECISIONS.READY_FOR_CONVERSATION_PREP_CONTEXT;
}

function buildNashManagerConversationPrepPacketIntake(input = {}, options = {}) {
  const source = input && typeof input === "object" ? clone(input) : {};
  const packet = extractConversationPacket(source);

  const boundary = buildNashManagerContextIntakeBoundary(
    { packet, requestedUse: options.requestedUse || source.requestedUse || "NASH_CONVERSATION_PREP_INTAKE" },
    options
  );

  const questionAreas = unique([
    packet.suggestedQuestionAreas,
    packet.questionAreas,
    packet.questionsToReview,
    packet.questionsToExplore,
    packet.managerQuestionAreas
  ]);

  const evidenceToReview = unique([
    packet.evidenceToReview,
    packet.evidenceReviewContext,
    packet.managerEvidenceToReview
  ]);

  const conversationGuardrails = unique([
    packet.conversationGuardrails,
    packet.guardrails,
    packet.safeConversationGuardrails,
    "No pressure language.",
    "No invented intent.",
    "No automated message sending."
  ]);

  const missing = unique([
    boundary.missing,
    questionAreas.length === 0 ? ["questionAreas"] : [],
    evidenceToReview.length === 0 ? ["evidenceToReview"] : []
  ]);

  const status =
    boundary.status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED
      ? NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_STATUS.BLOCKED
      : boundary.status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.UNKNOWN
        ? NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_STATUS.UNKNOWN
        : missing.length > 0 || boundary.status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED
          ? NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_STATUS.REVIEW_REQUIRED
          : NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_STATUS.READY;

  return {
    engine: "NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE",
    version: "1.0",
    status,
    decision: buildDecision(status),
    conversationPrepContextOnly: true,
    managerContextIntakeOnly: true,
    packet,
    questionAreas,
    evidenceToReview,
    conversationGuardrails,
    suggestedQuestionAreasAreReviewContextOnly: true,
    createsFinalScript: false,
    createsFinalMessage: false,
    executesNashRuntime: false,
    executesNextBestAction: false,
    sendsMessages: false,
    createsDrafts: false,
    createsTasks: false,
    createsCalendarEvents: false,
    generatesPressureLanguage: false,
    manipulatesConversation: false,
    infersInventedIntent: false,
    evidenceSources: boundary.evidenceSources,
    sourceOwners: boundary.sourceOwners,
    freshness: boundary.freshness,
    warnings: boundary.warnings,
    limitations: boundary.limitations,
    missing,
    unknown: boundary.unknown,
    stale: boundary.stale,
    defaultZeroWarnings: boundary.defaultZeroWarnings,
    blockedPeriods: boundary.blockedPeriods,
    boundary,
    truthFlags: boundary.truthFlags,
    writeFlags: boundary.writeFlags,
    actionFlags: boundary.actionFlags
  };
}

module.exports = {
  NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_STATUS,
  NASH_MANAGER_CONVERSATION_PREP_PACKET_INTAKE_DECISIONS,
  buildNashManagerConversationPrepPacketIntake
};
