"use strict";

const {
  ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS,
  ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES,
  buildEngagementManagerContextIntakeBoundary,
  clonePlain,
  normalizeStrings,
  dedupeStrings,
  mergeUnique,
  createFalseTruthFlags,
  createFalseActionFlags
} = require("./engagement-manager-context-intake-boundary-contract");

function unwrapPrivateMotivationPacket(packet) {
  const input = clonePlain(packet);

  return (
    input.privateMotivationContext ||
    input.privateMotivationPacket ||
    input.engagementSupportContext ||
    input.engagementSupportPacket ||
    input.engagementContext ||
    input
  );
}

function normalizeAreaItems(areaName, value) {
  const items = Array.isArray(value) ? value : value ? [value] : [];

  return items
    .map((item) => {
      if (typeof item === "string") {
        return {
          area: areaName,
          label: item,
          isEvidenceReviewContextOnly: true
        };
      }

      if (item && typeof item === "object") {
        return {
          area: areaName,
          label: item.label || item.name || item.type || areaName,
          context: item.context || item.note || item.description || null,
          confidence: item.confidence || "REVIEW_CONTEXT_ONLY",
          isEvidenceReviewContextOnly: true
        };
      }

      return null;
    })
    .filter(Boolean);
}

function collectPrivateMotivationReviewAreas(context) {
  return [
    ...normalizeAreaItems("SUPPORT_SIGNAL", context.supportSignals || context.supportContext || context.support),
    ...normalizeAreaItems("FRICTION_SIGNAL", context.frictionSignals || context.frictionContext || context.friction),
    ...normalizeAreaItems("ENERGY_CONTEXT", context.energyContext || context.energySignals),
    ...normalizeAreaItems("PROGRESS_CONTEXT", context.progressContext || context.progressSignals),
    ...normalizeAreaItems("SAFE_STREAK_CONTEXT", context.safeStreakContext || context.streakContext),
    ...normalizeAreaItems("COMMITMENT_CONTEXT", context.commitmentContext || context.commitmentSignals),
    ...normalizeAreaItems("DIGNITY_CONTEXT", context.dignityContext || context.dignitySignals),
    ...normalizeAreaItems("HUMAN_REVIEW_NOTE", context.humanReviewNotes || context.reviewNotes)
  ];
}

function combineDecision(boundaryDecision, hasMissingAreas) {
  if (boundaryDecision === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK) {
    return {
      decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK,
      status: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.BLOCKED
    };
  }

  if (boundaryDecision === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW || hasMissingAreas) {
    return {
      decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW,
      status: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.REVIEW_REQUIRED
    };
  }

  return {
    decision: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.ALLOW,
    status: ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.READY
  };
}

function buildEngagementManagerPrivateMotivationPacketIntake(packet, options = {}) {
  const input = clonePlain(packet);
  const boundary = buildEngagementManagerContextIntakeBoundary(input, options);
  const context = unwrapPrivateMotivationPacket(input);
  const privateMotivationReviewAreas = collectPrivateMotivationReviewAreas(context);

  const warnings = [...boundary.warnings];
  const missing = [...boundary.missing];
  const limitations = [...boundary.limitations];

  if (privateMotivationReviewAreas.length === 0) {
    warnings.push("Missing private motivation review areas remain UNKNOWN and require human review.");
    missing.push("privateMotivationReviewAreas");
  }

  const combined = combineDecision(boundary.decision, privateMotivationReviewAreas.length === 0);

  return {
    kind: "ENGAGEMENT_MANAGER_PRIVATE_MOTIVATION_PACKET_INTAKE",
    status: boundary.status === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.UNKNOWN
      ? ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.UNKNOWN
      : combined.status,
    decision: combined.decision,
    isContextOnly: true,
    isReviewContextOnly: true,
    createsPrivateMotivationReviewContext: true,
    privateMotivationReviewAreas,
    evidenceSources: mergeUnique(boundary.evidenceSources, context.evidenceSources),
    sourceOwners: mergeUnique(boundary.sourceOwners, context.sourceOwners),
    freshness: boundary.freshness,
    missing: dedupeStrings(missing),
    warnings: dedupeStrings(warnings),
    limitations: dedupeStrings(limitations),
    defaultZeroRisks: boundary.defaultZeroRisks,
    boundary,
    truthFlags: createFalseTruthFlags(),
    actionFlags: createFalseActionFlags()
  };
}

module.exports = {
  buildEngagementManagerPrivateMotivationPacketIntake,
  collectPrivateMotivationReviewAreas,
  unwrapPrivateMotivationPacket
};
