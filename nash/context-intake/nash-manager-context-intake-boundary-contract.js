"use strict";

const NASH_MANAGER_CONTEXT_INTAKE_STATUS = Object.freeze({
  READY: "READY",
  UNKNOWN: "UNKNOWN",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED"
});

const NASH_MANAGER_CONTEXT_INTAKE_DECISIONS = Object.freeze({
  READY_FOR_NASH_CONTEXT_INTAKE: "READY_FOR_NASH_CONTEXT_INTAKE",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE",
  UNKNOWN_CONTEXT: "UNKNOWN_CONTEXT"
});

const NASH_MANAGER_CONTEXT_INTAKE_ALLOWED_USES = Object.freeze([
  "NASH_CONVERSATION_PREP_INTAKE",
  "MANAGER_CONTEXT_INTAKE",
  "SAFE_LANGUAGE_CONTEXT",
  "QUESTION_AREA_CONTEXT",
  "EVIDENCE_REVIEW_CONTEXT",
  "COACHING_CONTEXT",
  "HUMAN_REVIEW_CONTEXT"
]);

const NASH_MANAGER_CONTEXT_INTAKE_FORBIDDEN_USES = Object.freeze([
  "NASH_RUNTIME_EXECUTION",
  "NASH_NEXT_BEST_ACTION_EXECUTION",
  "MESSAGE_SEND",
  "EMAIL_SEND",
  "DRAFT_CREATE",
  "TASK_CREATE",
  "CALENDAR_WRITE",
  "PRESSURE_LANGUAGE",
  "MANIPULATION",
  "INVENTED_INTENT",
  "HUMAN_RANKING",
  "PERFORMANCE_LEADERBOARD",
  "PROMOTION_DECISION",
  "PUNISHMENT",
  "TERMINATION",
  "DISCIPLINARY_ACTION",
  "HR_DECISION",
  "COMPENSATION",
  "PAYOUT",
  "REVENUE_TRUTH",
  "ADVISOR_LIFECYCLE_TRUTH",
  "AUTOMATIC_DECISION",
  "PRECONTRACT_TRUTH",
  "HIRING_TRUTH",
  "DATABASE_WRITE",
  "FILESYSTEM_WRITE",
  "CACHE_WRITE",
  "MIGRATION_WRITE",
  "SCHEMA_WRITE",
  "UI_RENDERING"
]);

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null && item !== "");
  return [value].filter((item) => item !== "");
}

function unique(values) {
  return [...new Set(asArray(values).flatMap((value) => asArray(value)))];
}

function falseTruthFlags() {
  return {
    automaticDecisionAllowed: false,
    createsNashRuntimeExecutionTruth: false,
    createsNextBestActionExecutionTruth: false,
    createsMessageTruth: false,
    createsDraftTruth: false,
    createsTaskTruth: false,
    createsCalendarTruth: false,
    createsPressureLanguageTruth: false,
    createsManipulationTruth: false,
    createsInventedIntentTruth: false,
    createsHrTruth: false,
    createsDisciplinaryTruth: false,
    createsRankingTruth: false,
    createsPromotionTruth: false,
    createsPunishmentTruth: false,
    createsTerminationTruth: false,
    createsCompensationTruth: false,
    createsRevenueTruth: false,
    createsPayoutTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsPrecontractTruth: false,
    createsHiringTruth: false
  };
}

function falseWriteFlags() {
  return {
    writesToDatabase: false,
    writesToFilesystem: false,
    writesToCache: false,
    writesToSchema: false,
    writesToMigration: false,
    rendersUi: false
  };
}

function falseActionFlags() {
  return {
    executesNashRuntime: false,
    executesNextBestAction: false,
    sendsMessages: false,
    sendsEmails: false,
    createsDrafts: false,
    createsTasks: false,
    createsCalendarEvents: false,
    generatesPressureLanguage: false,
    manipulatesConversation: false,
    infersInventedIntent: false
  };
}

function getNested(object, path) {
  return path.reduce((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return current[key];
  }, object);
}

function extractPacket(input) {
  const source = input && typeof input === "object" ? input : {};
  const candidate =
    source.managerNashConversationPacket ||
    source.nashConversationPrepPacket ||
    source.externalContextPacket ||
    source.managerExternalContextPacket ||
    getNested(source, ["managerExternalContextBridge", "nashConversationContext"]) ||
    getNested(source, ["managerExternalContextBridge", "nashConversationPacket"]) ||
    getNested(source, ["externalContextBridge", "nashConversationContext"]) ||
    getNested(source, ["externalContextBridge", "nashConversationPacket"]) ||
    source.packet;

  if (candidate && typeof candidate === "object") {
    return clone(candidate);
  }

  const nonControlKeys = Object.keys(source).filter((key) => !["requestedUse", "use"].includes(key));
  if (nonControlKeys.length > 0) {
    return clone(source);
  }

  return {};
}

function collectEvidence(packet, source) {
  const evidence = packet.evidence && typeof packet.evidence === "object" ? packet.evidence : {};
  const sourceEvidence = source.evidence && typeof source.evidence === "object" ? source.evidence : {};

  const evidenceSources = unique([
    packet.evidenceSources,
    packet.evidenceSource,
    evidence.sources,
    evidence.source,
    source.evidenceSources,
    source.evidenceSource,
    sourceEvidence.sources,
    sourceEvidence.source
  ]);

  const sourceOwners = unique([
    packet.sourceOwners,
    packet.sourceOwner,
    evidence.sourceOwners,
    evidence.sourceOwner,
    source.sourceOwners,
    source.sourceOwner,
    sourceEvidence.sourceOwners,
    sourceEvidence.sourceOwner
  ]);

  const freshness = unique([
    packet.freshness,
    packet.freshnessStatus,
    evidence.freshness,
    evidence.freshnessStatus,
    source.freshness,
    source.freshnessStatus,
    sourceEvidence.freshness,
    sourceEvidence.freshnessStatus
  ]);

  return { evidenceSources, sourceOwners, freshness };
}

function isStale(packet) {
  const evidence = packet.evidence && typeof packet.evidence === "object" ? packet.evidence : {};
  return (
    packet.stale === true ||
    packet.freshnessStatus === "STALE" ||
    packet.freshness === "STALE" ||
    evidence.stale === true ||
    evidence.freshnessStatus === "STALE" ||
    evidence.freshness === "STALE"
  );
}

function hasBlockedPeriod(packet) {
  return (
    packet.blocked === true ||
    packet.blockedPeriod === true ||
    packet.periodBlocked === true ||
    asArray(packet.blockedPeriods).length > 0 ||
    asArray(packet.blockedReasons).length > 0
  );
}

function collectWarnings(packet, source) {
  return unique([
    packet.warnings,
    packet.warning,
    source.warnings,
    source.warning
  ]);
}

function collectLimitations(packet, source) {
  return unique([
    packet.limitations,
    packet.confidenceLimitations,
    source.limitations,
    source.confidenceLimitations
  ]);
}

function collectContextArray(packet, source, key) {
  return unique([
    packet[key],
    source[key]
  ]);
}

function findExplicitZeroValues(value, prefix = "", depth = 0) {
  if (depth > 4 || value === null || value === undefined) return [];
  if (typeof value === "number" && value === 0) return [prefix || "value"];
  if (Array.isArray(value)) {
    if (value.length === 0 && prefix) return [`${prefix}:EMPTY_ARRAY`];
    return value.flatMap((item, index) => findExplicitZeroValues(item, `${prefix}[${index}]`, depth + 1));
  }
  if (typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) => {
    if (["truthFlags", "writeFlags", "actionFlags"].includes(key)) return [];
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return findExplicitZeroValues(item, nextPrefix, depth + 1);
  });
}

function buildManagerContextIntakeDecision(status, forbiddenUseBlocked) {
  if (forbiddenUseBlocked) return NASH_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK_FORBIDDEN_USE;
  if (status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.UNKNOWN) return NASH_MANAGER_CONTEXT_INTAKE_DECISIONS.UNKNOWN_CONTEXT;
  if (status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED) return NASH_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW_REQUIRED;
  return NASH_MANAGER_CONTEXT_INTAKE_DECISIONS.READY_FOR_NASH_CONTEXT_INTAKE;
}

function buildNashManagerContextIntakeBoundary(input = {}, options = {}) {
  const source = input && typeof input === "object" ? clone(input) : {};
  const packet = extractPacket(source);
  const requestedUse = options.requestedUse || source.requestedUse || source.use || packet.requestedUse || "NASH_CONVERSATION_PREP_INTAKE";

  const allowedUse = NASH_MANAGER_CONTEXT_INTAKE_ALLOWED_USES.includes(requestedUse);
  const forbiddenUseBlocked = NASH_MANAGER_CONTEXT_INTAKE_FORBIDDEN_USES.includes(requestedUse);

  const evidence = collectEvidence(packet, source);
  const warnings = collectWarnings(packet, source);
  const limitations = collectLimitations(packet, source);
  const missing = [];
  const unknown = [];
  const stale = [];
  const defaultZeroWarnings = findExplicitZeroValues(packet);
  const blockedPeriods = [];

  if (Object.keys(packet).length === 0) {
    missing.push("nashManagerContextPacket");
    unknown.push("nashManagerContextPacket");
  }

  if (evidence.evidenceSources.length === 0) missing.push("evidence");
  if (evidence.sourceOwners.length === 0) missing.push("sourceOwner");
  if (evidence.freshness.length === 0) missing.push("freshness");

  if (isStale(packet)) stale.push("nashManagerContextPacket");
  if (hasBlockedPeriod(packet)) blockedPeriods.push("nashManagerContextPacket");

  const explicitMissing = unique([
    missing,
    collectContextArray(packet, source, "missing"),
    collectContextArray(packet, source, "missingContext")
  ]);

  const explicitUnknown = unique([
    unknown,
    collectContextArray(packet, source, "unknown"),
    collectContextArray(packet, source, "unknownContext")
  ]);

  const explicitStale = unique([
    stale,
    collectContextArray(packet, source, "stale"),
    collectContextArray(packet, source, "staleContext")
  ]);

  let status = NASH_MANAGER_CONTEXT_INTAKE_STATUS.READY;

  if (forbiddenUseBlocked) {
    status = NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED;
  } else if (Object.keys(packet).length === 0) {
    status = NASH_MANAGER_CONTEXT_INTAKE_STATUS.UNKNOWN;
  } else if (
    explicitMissing.length > 0 ||
    explicitUnknown.length > 0 ||
    explicitStale.length > 0 ||
    blockedPeriods.length > 0 ||
    defaultZeroWarnings.length > 0 ||
    !allowedUse
  ) {
    status = NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED;
  }

  return {
    engine: "NASH_MANAGER_CONTEXT_INTAKE_BOUNDARY_CONTRACT",
    version: "1.0",
    status,
    decision: buildManagerContextIntakeDecision(status, forbiddenUseBlocked),
    requestedUse,
    allowedUse,
    forbiddenUseBlocked,
    sanitizedPacketOnly: true,
    contextOnly: true,
    packet,
    evidenceSources: evidence.evidenceSources,
    sourceOwners: evidence.sourceOwners,
    freshness: evidence.freshness,
    warnings,
    limitations,
    missing: explicitMissing,
    unknown: explicitUnknown,
    stale: explicitStale,
    defaultZeroWarnings: unique(defaultZeroWarnings),
    blockedPeriods: unique(blockedPeriods),
    boundary: {
      nashManagerContextIntakeIsIntakeOnly: true,
      consumesSanitizedManagerExternalContextBridgePacketsOnly: true,
      executesNashRuntime: false,
      executesNextBestAction: false,
      sendsMessages: false,
      createsDrafts: false,
      createsTasks: false,
      createsCalendarEvents: false,
      generatesPressureLanguage: false,
      manipulatesConversation: false,
      infersInventedIntent: false
    },
    truthFlags: falseTruthFlags(),
    writeFlags: falseWriteFlags(),
    actionFlags: falseActionFlags()
  };
}

module.exports = {
  NASH_MANAGER_CONTEXT_INTAKE_STATUS,
  NASH_MANAGER_CONTEXT_INTAKE_DECISIONS,
  NASH_MANAGER_CONTEXT_INTAKE_ALLOWED_USES,
  NASH_MANAGER_CONTEXT_INTAKE_FORBIDDEN_USES,
  buildNashManagerContextIntakeBoundary,
  _private: {
    clone,
    asArray,
    unique,
    falseTruthFlags,
    falseWriteFlags,
    falseActionFlags
  }
};
