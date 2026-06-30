"use strict";

const {
  buildNashManagerContextIntakeBoundary,
  NASH_MANAGER_CONTEXT_INTAKE_STATUS,
  _private
} = require("./nash-manager-context-intake-boundary-contract");

const {
  buildNashManagerConversationPrepPacketIntake
} = require("./nash-manager-conversation-prep-packet-intake");

const {
  buildNashManagerSafeLanguageGuardrailIntake
} = require("./nash-manager-safe-language-guardrail-intake");

const { clone, unique } = _private;

const NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_STATUS = Object.freeze({
  READY: "READY",
  UNKNOWN: "UNKNOWN",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED"
});

const NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_DECISIONS = Object.freeze({
  READY_FOR_NASH_READY_CONTEXT: "READY_FOR_NASH_READY_CONTEXT",
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

function extractNashPacket(input) {
  const source = input && typeof input === "object" ? input : {};
  const candidate =
    source.nashConversationPrepPacket ||
    source.managerNashConversationPacket ||
    source.packet ||
    getNested(source, ["managerExternalContextBridge", "nashConversationContext"]) ||
    getNested(source, ["managerExternalContextBridge", "nashConversationPacket"]) ||
    getNested(source, ["externalContextBridge", "nashConversationContext"]) ||
    getNested(source, ["externalContextBridge", "nashConversationPacket"]) ||
    getNested(source, ["externalContextBridge", "nash"]);

  if (candidate && typeof candidate === "object") return clone(candidate);
  return {};
}

function buildDecision(status) {
  if (status === NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_STATUS.BLOCKED) {
    return NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_DECISIONS.BLOCKED;
  }
  if (status === NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_STATUS.UNKNOWN) {
    return NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_DECISIONS.UNKNOWN_CONTEXT;
  }
  if (status === NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_STATUS.REVIEW_REQUIRED) {
    return NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_DECISIONS.REVIEW_REQUIRED;
  }
  return NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_DECISIONS.READY_FOR_NASH_READY_CONTEXT;
}

function buildNashManagerContextIntake(input = {}, options = {}) {
  const source = input && typeof input === "object" ? clone(input) : {};
  const packet = extractNashPacket(source);

  const boundary = buildNashManagerContextIntakeBoundary(
    { packet, requestedUse: options.requestedUse || source.requestedUse || "MANAGER_CONTEXT_INTAKE" },
    options
  );

  const conversationPrepPacketIntake = buildNashManagerConversationPrepPacketIntake(
    { packet, requestedUse: options.requestedUse || "NASH_CONVERSATION_PREP_INTAKE" },
    options
  );

  const safeLanguageGuardrailIntake = buildNashManagerSafeLanguageGuardrailIntake(
    {
      packet,
      languageSamples: source.languageSamples || packet.languageSamples || packet.suggestedLanguage || [],
      requestedUse: "SAFE_LANGUAGE_CONTEXT"
    },
    options
  );

  const combinedStatus = [
    boundary.status,
    conversationPrepPacketIntake.status,
    safeLanguageGuardrailIntake.status
  ];

  const status = combinedStatus.includes(NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED)
    ? NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_STATUS.BLOCKED
    : combinedStatus.every((item) => item === NASH_MANAGER_CONTEXT_INTAKE_STATUS.UNKNOWN)
      ? NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_STATUS.UNKNOWN
      : combinedStatus.includes(NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED)
        ? NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_STATUS.REVIEW_REQUIRED
        : NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_STATUS.READY;

  return {
    engine: "NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR",
    version: "1.0",
    status,
    decision: buildDecision(status),
    nashReadyContextOnly: true,
    managerContextIntakeOnly: true,
    sanitizedManagerContextOnly: true,
    packet,
    conversationPrepPacketIntake,
    safeLanguageGuardrailIntake,
    nashReadyContext: {
      questionAreas: conversationPrepPacketIntake.questionAreas,
      evidenceToReview: conversationPrepPacketIntake.evidenceToReview,
      conversationGuardrails: conversationPrepPacketIntake.conversationGuardrails,
      unsafeLanguageFindings: safeLanguageGuardrailIntake.unsafeLanguageFindings,
      contextOnly: true,
      executesNashRuntime: false,
      executesNextBestAction: false,
      createsFinalMessage: false
    },
    executiveSummary: {
      summaryType: "NASH_MANAGER_CONTEXT_INTAKE_SUMMARY",
      contextOnly: true,
      notAutomaticDecision: true,
      noRuntimeExecution: true,
      noMessageDraftOrSend: true
    },
    evidenceSources: unique([
      boundary.evidenceSources,
      conversationPrepPacketIntake.evidenceSources,
      safeLanguageGuardrailIntake.evidenceSources
    ]),
    sourceOwners: unique([
      boundary.sourceOwners,
      conversationPrepPacketIntake.sourceOwners,
      safeLanguageGuardrailIntake.sourceOwners
    ]),
    freshness: unique([
      boundary.freshness,
      conversationPrepPacketIntake.freshness,
      safeLanguageGuardrailIntake.freshness
    ]),
    warnings: unique([
      boundary.warnings,
      conversationPrepPacketIntake.warnings,
      safeLanguageGuardrailIntake.warnings
    ]),
    limitations: unique([
      boundary.limitations,
      conversationPrepPacketIntake.limitations,
      safeLanguageGuardrailIntake.limitations
    ]),
    missing: unique([
      boundary.missing,
      conversationPrepPacketIntake.missing,
      safeLanguageGuardrailIntake.missing
    ]),
    unknown: unique([
      boundary.unknown,
      conversationPrepPacketIntake.unknown,
      safeLanguageGuardrailIntake.unknown
    ]),
    stale: unique([
      boundary.stale,
      conversationPrepPacketIntake.stale,
      safeLanguageGuardrailIntake.stale
    ]),
    defaultZeroWarnings: unique([
      boundary.defaultZeroWarnings,
      conversationPrepPacketIntake.defaultZeroWarnings,
      safeLanguageGuardrailIntake.defaultZeroWarnings
    ]),
    blockedPeriods: unique([
      boundary.blockedPeriods,
      conversationPrepPacketIntake.blockedPeriods,
      safeLanguageGuardrailIntake.blockedPeriods
    ]),
    actionsCreated: false,
    writesCreated: false,
    externalExecutionCreated: false,
    downstreamTruthCreated: false,
    executesNashRuntime: false,
    executesNextBestAction: false,
    sendsMessages: false,
    createsDrafts: false,
    createsTasks: false,
    createsCalendarEvents: false,
    generatesPressureLanguage: false,
    manipulatesConversation: false,
    infersInventedIntent: false,
    truthFlags: boundary.truthFlags,
    writeFlags: boundary.writeFlags,
    actionFlags: boundary.actionFlags
  };
}

module.exports = {
  NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_STATUS,
  NASH_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR_DECISIONS,
  buildNashManagerContextIntake
};
