"use strict";

const {
  ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS,
  ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES,
  buildEngagementManagerContextIntakeBoundary,
  clonePlain,
  dedupeStrings,
  mergeUnique,
  createFalseTruthFlags,
  createFalseActionFlags
} = require("./engagement-manager-context-intake-boundary-contract");

const {
  buildEngagementManagerPrivateMotivationPacketIntake
} = require("./engagement-manager-private-motivation-packet-intake");

const {
  buildEngagementManagerDignityGuardrailIntake
} = require("./engagement-manager-dignity-guardrail-intake");

function extractSanitizedEngagementPacket(input) {
  const source = clonePlain(input);

  if (source.managerExternalContextBridgePacket) {
    const bridge = source.managerExternalContextBridgePacket;

    return {
      packet:
        bridge.engagementSupportPacket ||
        bridge.engagementSupportContext ||
        bridge.privateEngagementContext ||
        bridge.engagement ||
        {},
      sanitizedPacketSource: "managerExternalContextBridgePacket"
    };
  }

  if (source.externalContextBridgePacket) {
    const bridge = source.externalContextBridgePacket;

    return {
      packet:
        bridge.engagementSupportPacket ||
        bridge.engagementSupportContext ||
        bridge.privateEngagementContext ||
        bridge.engagement ||
        {},
      sanitizedPacketSource: "externalContextBridgePacket"
    };
  }

  if (source.engagementSupportPacket || source.engagementSupportContext || source.privateEngagementContext) {
    return {
      packet:
        source.engagementSupportPacket ||
        source.engagementSupportContext ||
        source.privateEngagementContext,
      sanitizedPacketSource: "directSanitizedEngagementPacket"
    };
  }

  return {
    packet: source,
    sanitizedPacketSource: "directInput"
  };
}

function combineDecisions(parts) {
  if (parts.some((part) => part.decision === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK)) {
    return {
      decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK,
      status: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.BLOCKED
    };
  }

  if (
    parts.some((part) => part.decision === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW) ||
    parts.some((part) => part.status === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.UNKNOWN)
  ) {
    return {
      decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW,
      status: parts.some((part) => part.status === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.UNKNOWN)
        ? ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.UNKNOWN
        : ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.REVIEW_REQUIRED
    };
  }

  return {
    decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.ALLOW,
    status: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.READY
  };
}

function buildEngagementManagerContextIntake(input, options = {}) {
  const original = clonePlain(input);
  const extracted = extractSanitizedEngagementPacket(original);
  const packet = extracted.packet;

  const boundary = buildEngagementManagerContextIntakeBoundary(packet, options);
  const privateMotivationPacket = buildEngagementManagerPrivateMotivationPacketIntake(packet, options);
  const dignityGuardrails = buildEngagementManagerDignityGuardrailIntake(packet, options);

  const combined = combineDecisions([boundary, privateMotivationPacket, dignityGuardrails]);

  const warnings = dedupeStrings([
    ...boundary.warnings,
    ...privateMotivationPacket.warnings,
    ...dignityGuardrails.warnings
  ]);

  const limitations = dedupeStrings([
    ...boundary.limitations,
    ...privateMotivationPacket.limitations,
    ...dignityGuardrails.limitations
  ]);

  const missing = dedupeStrings([
    ...boundary.missing,
    ...privateMotivationPacket.missing,
    ...dignityGuardrails.missing
  ]);

  return {
    kind: "ENGAGEMENT_MANAGER_CONTEXT_INTAKE_ORCHESTRATOR",
    status: combined.status,
    decision: combined.decision,
    sanitizedPacketSource: extracted.sanitizedPacketSource,
    isContextOnly: true,
    isReviewContextOnly: true,
    executiveSummary: "Engagement context prepared for human review only. No private motivation truth, diagnosis, manipulation, message, task, calendar, or downstream decision was created.",
    boundary,
    privateMotivationPacket,
    dignityGuardrails,
    evidenceSources: mergeUnique(
      boundary.evidenceSources,
      privateMotivationPacket.evidenceSources,
      dignityGuardrails.evidenceSources
    ),
    sourceOwners: mergeUnique(
      boundary.sourceOwners,
      privateMotivationPacket.sourceOwners,
      dignityGuardrails.sourceOwners
    ),
    freshness: boundary.freshness,
    warnings,
    limitations,
    missing,
    defaultZeroRisks: mergeUnique(
      boundary.defaultZeroRisks,
      privateMotivationPacket.defaultZeroRisks,
      dignityGuardrails.defaultZeroRisks
    ),
    truthFlags: createFalseTruthFlags(),
    actionFlags: createFalseActionFlags()
  };
}

module.exports = {
  buildEngagementManagerContextIntake,
  extractSanitizedEngagementPacket,
  combineDecisions
};
