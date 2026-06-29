const {
  mapManagerAdvisorTrackingBoundary
} = require("../advisor-tracking/manager-advisor-tracking-boundary-engine");

const ADVISOR_MANAGER_SNAPSHOT_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const ADVISOR_MANAGER_SNAPSHOT_DECISIONS = Object.freeze({
  BUILD_MANAGER_REVIEW_SNAPSHOT: "BUILD_MANAGER_REVIEW_SNAPSHOT",
  USE_ADVISOR_TRACKING_BOUNDARY: "USE_ADVISOR_TRACKING_BOUNDARY",
  COLLECT_SIGNAL_EVIDENCE: "COLLECT_SIGNAL_EVIDENCE",
  COLLECT_SOURCE_OWNER: "COLLECT_SOURCE_OWNER",
  REFRESH_SIGNAL_CONTEXT: "REFRESH_SIGNAL_CONTEXT",
  REQUIRE_HUMAN_REVIEW: "REQUIRE_HUMAN_REVIEW",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE"
});

const RAW_CONTEXT_KEYS = Object.freeze([
  "advisorTracking",
  "advisorPerformance",
  "advisorMonitor",
  "advisorScore",
  "advisorAlerts",
  "activityTimeline",
  "prospectingSignals",
  "followupSignals",
  "referralSignals",
  "salesDnaSignals",
  "legacyActivity",
  "legacyDashboard",
  "legacyMomentum",
  "legacyAlert",
  "legacyCoaching",
  "legacyFeed",
  "legacyNotification"
]);

const ALLOWED_USES = Object.freeze([
  "MANAGER_REVIEW",
  "COACHING_CONTEXT",
  "ONE_ON_ONE_PREP",
  "TEAM_PATTERN_CONTEXT",
  "METRICS_CONTEXT",
  "FORECAST_CONTEXT",
  "DASHBOARD_CONTEXT",
  "CONVERSATION_CONTEXT",
  "SUPPORT_SIGNAL_REVIEW"
]);

const FORBIDDEN_USES = Object.freeze([
  "HUMAN_RANKING",
  "PROMOTION_DECISION",
  "PUNISHMENT",
  "TERMINATION",
  "COMPENSATION",
  "PAYOUT",
  "REVENUE_TRUTH",
  "ADVISOR_LIFECYCLE_TRUTH",
  "AUTOMATIC_DECISION"
]);

const ZERO_RISK_KEYS = Object.freeze([
  "puntos",
  "pipeline",
  "score",
  "count",
  "tasks",
  "policies",
  "diasSinActividad",
  "rate",
  "revenue",
  "production"
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
  return [...new Set(values.filter(present))];
}

function normalizeText(value) {
  return present(value) ? String(value).trim().toUpperCase() : null;
}

function clone(value) {
  if (!present(value)) return value;
  return JSON.parse(JSON.stringify(value));
}

function collectFromValue(value, field) {
  if (!present(value)) return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectFromValue(item, field));
  if (!isObject(value)) return [];
  return [
    ...asArray(value[field]),
    ...Object.values(value).flatMap((entry) => collectFromValue(entry, field))
  ];
}

function collectEvidenceRefs({ sourceEvidence = {}, values = [] } = {}) {
  return unique([
    ...asArray(sourceEvidence.evidenceRefs),
    ...asArray(sourceEvidence.evidenceRef),
    ...values.flatMap((value) => collectFromValue(value, "evidenceRefs")),
    ...values.flatMap((value) => collectFromValue(value, "evidenceRef"))
  ]);
}

function collectSourceEvidenceIds({ sourceEvidence = {}, values = [] } = {}) {
  return unique([
    ...asArray(sourceEvidence.sourceEvidenceIds),
    ...asArray(sourceEvidence.sourceEvidenceId),
    ...values.flatMap((value) => collectFromValue(value, "sourceEvidenceIds")),
    ...values.flatMap((value) => collectFromValue(value, "sourceEvidenceId"))
  ]);
}

function collectSourceOwners({ sourceEvidence = {}, values = [] } = {}) {
  return unique([
    ...asArray(sourceEvidence.sourceOwners),
    ...asArray(sourceEvidence.sourceOwner),
    ...values.flatMap((value) => collectFromValue(value, "sourceOwners")),
    ...values.flatMap((value) => collectFromValue(value, "sourceOwner"))
  ]);
}

function collectFreshnessCandidates({ sourceEvidence = {}, values = [] } = {}) {
  return unique([
    sourceEvidence.freshness,
    sourceEvidence.freshnessStatus,
    sourceEvidence.generatedAt,
    sourceEvidence.capturedAt,
    sourceEvidence.updatedAt,
    ...values.flatMap((value) => collectFromValue(value, "freshness")),
    ...values.flatMap((value) => collectFromValue(value, "freshnessStatus")),
    ...values.flatMap((value) => collectFromValue(value, "generatedAt")),
    ...values.flatMap((value) => collectFromValue(value, "capturedAt")),
    ...values.flatMap((value) => collectFromValue(value, "updatedAt"))
  ]);
}

function resolveFreshness({ sourceEvidence = {}, values = [] } = {}) {
  const candidates = collectFreshnessCandidates({ sourceEvidence, values });
  const explicitFreshness = sourceEvidence.freshness;
  const status = normalizeText(
    isObject(explicitFreshness)
      ? explicitFreshness.status
      : explicitFreshness || sourceEvidence.freshnessStatus
  );
  const stale =
    status === "STALE" ||
    status === "EXPIRED" ||
    sourceEvidence.isFresh === false ||
    values.some((value) => isObject(value) && value.stale === true);

  return {
    value: explicitFreshness || sourceEvidence.freshnessStatus || candidates[0] || null,
    available: candidates.length > 0,
    stale
  };
}

function lowerKeyMatchesRisk(key) {
  const normalized = String(key).toLowerCase();
  return ZERO_RISK_KEYS.some((riskKey) => normalized === riskKey.toLowerCase() || normalized.includes(riskKey.toLowerCase()));
}

function collectZeroRisks(value, path = []) {
  if (!present(value)) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectZeroRisks(entry, [...path, String(index)]));
  }
  if (!isObject(value)) return [];

  return Object.entries(value).flatMap(([key, entryValue]) => {
    const currentPath = [...path, key];
    const directRisk = entryValue === 0 && lowerKeyMatchesRisk(key)
      ? [`${currentPath.join(".")}_zero_requires_evidence_review`]
      : [];
    return [
      ...directRisk,
      ...collectZeroRisks(entryValue, currentPath)
    ];
  });
}

function hasRawContext(input = {}) {
  return RAW_CONTEXT_KEYS.some((key) => present(input[key])) || present(input.team) || present(input.advisor);
}

function hasSnapshotContext(input = {}, trackingBoundary = null) {
  return present(input.advisor) || present(input.team) || present(trackingBoundary) || hasRawContext(input);
}

function resolveUse(requestedUse) {
  const normalized = normalizeText(requestedUse);
  if (!normalized) return { allowedUses: ["MANAGER_REVIEW"], blockedUses: [] };
  if (FORBIDDEN_USES.includes(normalized)) return { allowedUses: [], blockedUses: [normalized] };
  if (ALLOWED_USES.includes(normalized)) return { allowedUses: [normalized], blockedUses: [] };
  return { allowedUses: [], blockedUses: [normalized] };
}

function boundaryFlags() {
  return {
    automaticDecisionAllowed: false,
    createsManagerJudgmentTruth: false,
    createsHumanRankingTruth: false,
    createsPromotionDecisionTruth: false,
    createsAdvisorLifecycleTruth: false,
    createsCompensationTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false
  };
}

function sortTimeline(value = []) {
  return asArray(value)
    .map((entry) => clone(entry))
    .sort((a, b) => {
      const left = Date.parse(a.occurredAt || a.createdAt || a.timestamp || "") || 0;
      const right = Date.parse(b.occurredAt || b.createdAt || b.timestamp || "") || 0;
      return left - right;
    });
}

function sortEvents(value = []) {
  return asArray(value)
    .map((entry) => clone(entry))
    .sort((a, b) => {
      const left = Date.parse(a.occurredAt || a.createdAt || a.timestamp || "") || 0;
      const right = Date.parse(b.occurredAt || b.createdAt || b.timestamp || "") || 0;
      return left - right;
    });
}

function contextEntry(contextKey, value) {
  return {
    contextKey,
    value: clone(value),
    referenceOnly: true,
    createsTruth: false
  };
}

function firstPresent(...values) {
  return values.find(present) || null;
}

function resolveAdvisorId({ advisor = {}, trackingBoundary = {}, advisorMonitor = {}, activityTimeline = [] } = {}) {
  const firstActivity = asArray(activityTimeline).find((activity) => isObject(activity) && present(activity.advisorId)) || {};
  return firstPresent(
    advisor.advisorId,
    advisor.id,
    trackingBoundary.advisorId,
    advisorMonitor.advisorId,
    firstActivity.advisorId
  );
}

function resolveSnapshotStatus({
  blockedUses,
  hasContext,
  evidenceRefs,
  sourceEvidenceIds,
  sourceOwners,
  directEvidenceRefs,
  directSourceEvidenceIds,
  directSourceOwners,
  directFreshness,
  freshness,
  trackingBoundary,
  humanReviewRequired
}) {
  if (blockedUses.length > 0) return ADVISOR_MANAGER_SNAPSHOT_STATUSES.BLOCKED;
  if (!hasContext) return ADVISOR_MANAGER_SNAPSHOT_STATUSES.UNKNOWN;
  if (directEvidenceRefs.length === 0 && directSourceEvidenceIds.length === 0) return ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_EVIDENCE;
  if (directSourceOwners.length === 0) return ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_SOURCE_OWNER;
  if (!directFreshness.available || directFreshness.stale) return ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_FRESHNESS;
  if (evidenceRefs.length === 0 && sourceEvidenceIds.length === 0) return ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_EVIDENCE;
  if (sourceOwners.length === 0) return ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_SOURCE_OWNER;
  if (!freshness.available || freshness.stale) return ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_FRESHNESS;
  if (trackingBoundary && trackingBoundary.boundaryStatus && trackingBoundary.boundaryStatus !== "READY_FOR_MANAGER_REVIEW") {
    return ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_HUMAN_REVIEW;
  }
  if (humanReviewRequired) return ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_HUMAN_REVIEW;
  return ADVISOR_MANAGER_SNAPSHOT_STATUSES.READY_FOR_MANAGER_REVIEW;
}

function buildTrackingBoundary(input = {}) {
  if (present(input.advisorTrackingBoundary)) return clone(input.advisorTrackingBoundary);
  if (!hasRawContext(input)) return null;

  return mapManagerAdvisorTrackingBoundary({
    advisorTracking: input.advisorTracking,
    advisorPerformance: input.advisorPerformance,
    advisorMonitor: input.advisorMonitor,
    advisorScore: input.advisorScore,
    advisorAlerts: input.advisorAlerts,
    activityTimeline: input.activityTimeline,
    prospectingSignals: input.prospectingSignals,
    followupSignals: input.followupSignals,
    referralSignals: input.referralSignals,
    salesDnaSignals: input.salesDnaSignals,
    advisor: input.advisor,
    team: input.team,
    feedEvents: input.legacyFeed,
    legacyMomentum: input.legacyMomentum,
    legacyAlert: input.legacyAlert,
    legacyCoaching: input.legacyCoaching,
    legacyDashboard: input.legacyDashboard,
    legacyActivity: input.legacyActivity,
    legacyNotification: input.legacyNotification,
    period: input.period,
    sourceEvidence: input.sourceEvidence,
    requestedUse: input.requestedUse
  });
}

function buildAdvisorManagerSnapshot(input = {}) {
  const {
    advisor = null,
    manager = null,
    team = null,
    advisorPerformance = null,
    advisorMonitor = null,
    advisorScore = null,
    advisorAlerts = null,
    activityTimeline = null,
    prospectingSignals = null,
    followupSignals = null,
    referralSignals = null,
    salesDnaSignals = null,
    legacyActivity = null,
    legacyDashboard = null,
    legacyMomentum = null,
    legacyAlert = null,
    legacyCoaching = null,
    legacyFeed = null,
    legacyNotification = null,
    period = null,
    sourceEvidence = {},
    requestedUse = null
  } = input;

  const trackingBoundary = buildTrackingBoundary(input);
  const values = [
    advisor,
    manager,
    team,
    trackingBoundary,
    input.advisorTracking,
    advisorPerformance,
    advisorMonitor,
    advisorScore,
    advisorAlerts,
    activityTimeline,
    prospectingSignals,
    followupSignals,
    referralSignals,
    salesDnaSignals,
    legacyActivity,
    legacyDashboard,
    legacyMomentum,
    legacyAlert,
    legacyCoaching,
    legacyFeed,
    legacyNotification
  ].filter(present);
  const evidenceRefs = collectEvidenceRefs({ sourceEvidence, values });
  const sourceEvidenceIds = collectSourceEvidenceIds({ sourceEvidence, values });
  const sourceOwners = collectSourceOwners({ sourceEvidence, values });
  const directEvidenceRefs = collectEvidenceRefs({ sourceEvidence, values: [] });
  const directSourceEvidenceIds = collectSourceEvidenceIds({ sourceEvidence, values: [] });
  const directSourceOwners = collectSourceOwners({ sourceEvidence, values: [] });
  const freshness = resolveFreshness({ sourceEvidence, values });
  const directFreshness = resolveFreshness({ sourceEvidence, values: [] });
  const use = resolveUse(requestedUse);
  const defaultZeroRisks = unique([
    ...values.flatMap((value) => collectZeroRisks(value)),
    ...asArray(trackingBoundary && trackingBoundary.defaultZeroRisks)
  ]);
  const missingEvidence = [];
  const unknownSignals = [];
  const staleSignals = [];
  const confidenceLimitations = [];
  const warnings = [];
  const hasContext = hasSnapshotContext(input, trackingBoundary);

  if (!hasContext) {
    unknownSignals.push("advisor_manager_snapshot_context_missing");
    warnings.push("Advisor manager snapshot context is missing; unknown is not zero and must not become low performance.");
  }

  if (directEvidenceRefs.length === 0 && directSourceEvidenceIds.length === 0) {
    missingEvidence.push("advisor_manager_snapshot_evidence_missing");
    confidenceLimitations.push("missing_snapshot_evidence");
    warnings.push("Advisor manager snapshot evidence is missing; missing evidence is not negative evidence.");
  }

  if (directSourceOwners.length === 0) {
    missingEvidence.push("advisor_manager_snapshot_source_owner_missing");
    confidenceLimitations.push("missing_snapshot_source_owner");
    warnings.push("Advisor manager snapshot source owner is missing.");
  }

  if (!directFreshness.available) {
    staleSignals.push("advisor_manager_snapshot_freshness_missing");
    confidenceLimitations.push("missing_snapshot_freshness");
    warnings.push("Advisor manager snapshot freshness is missing.");
  }

  if (directFreshness.stale) {
    staleSignals.push("advisor_manager_snapshot_freshness_stale");
    confidenceLimitations.push("stale_snapshot_freshness");
    warnings.push("Advisor manager snapshot freshness is stale.");
  }

  if (defaultZeroRisks.length > 0) {
    defaultZeroRisks.forEach((risk) => {
      warnings.push(`${risk}: explicit zero-like advisor value is context only and requires evidence/source/freshness review.`);
      confidenceLimitations.push(risk);
    });
  }

  if (trackingBoundary) {
    warnings.push("Advisor tracking boundary is consumed as protected Manager OS review context.");
  }

  if (trackingBoundary && trackingBoundary.advisorSignalContractStatus) {
    warnings.push("Advisor signal contract context is preserved and not recalculated by AdvisorManagerSnapshot.");
  }

  use.blockedUses.forEach((blockedUse) => {
    warnings.push(`${blockedUse} use is blocked for AdvisorManagerSnapshot.`);
  });

  const managerReviewRequired =
    use.blockedUses.length > 0 ||
    !hasContext ||
    directEvidenceRefs.length === 0 ||
    directSourceEvidenceIds.length === 0 ||
    directSourceOwners.length === 0 ||
    !directFreshness.available ||
    directFreshness.stale ||
    defaultZeroRisks.length > 0 ||
    (trackingBoundary && trackingBoundary.managerReviewRequired === true);
  const humanReviewRequired = managerReviewRequired;
  const activity = sortTimeline(activityTimeline);
  const events = sortEvents(legacyFeed);
  const snapshotStatus = resolveSnapshotStatus({
    blockedUses: use.blockedUses,
    hasContext,
    evidenceRefs,
    sourceEvidenceIds,
    sourceOwners,
    directEvidenceRefs,
    directSourceEvidenceIds,
    directSourceOwners,
    directFreshness,
    freshness,
    trackingBoundary,
    humanReviewRequired
  });

  return {
    snapshotStatus,
    advisorId: resolveAdvisorId({ advisor: advisor || {}, trackingBoundary: trackingBoundary || {}, advisorMonitor: advisorMonitor || {}, activityTimeline: activityTimeline || [] }),
    managerId: manager && (manager.managerId || manager.id) || null,
    teamId: team && (team.teamId || team.id) || null,
    period: period || sourceEvidence.period || (trackingBoundary && trackingBoundary.period) || null,
    snapshotGeneratedAt: sourceEvidence.generatedAt || sourceEvidence.capturedAt || null,
    advisorStatusContext: contextEntry("advisorStatus", advisor),
    activityContext: contextEntry("activity", legacyActivity || activityTimeline),
    pipelineContext: contextEntry("pipeline", prospectingSignals || (trackingBoundary && trackingBoundary.managerVisibleTrackingContext)),
    prospectingContext: contextEntry("prospecting", prospectingSignals),
    followupContext: contextEntry("followup", followupSignals),
    referralContext: contextEntry("referral", referralSignals),
    appointmentContext: contextEntry("appointments", advisorMonitor && advisorMonitor.appointments),
    productionContext: contextEntry("production", advisorPerformance),
    qualificationContext: contextEntry("qualification", advisorScore),
    supportNeedsContext: contextEntry("supportNeeds", advisorAlerts),
    coachingContext: contextEntry("coaching", legacyCoaching),
    alertContext: contextEntry("alerts", legacyAlert || advisorAlerts),
    feedContext: contextEntry("feed", legacyFeed),
    teamContext: contextEntry("team", team),
    trackingBoundaryContext: contextEntry("trackingBoundary", trackingBoundary),
    advisorSignalContractContext: contextEntry("advisorSignalContract", trackingBoundary && trackingBoundary.advisorSignalContractStatus ? trackingBoundary : null),
    activityTimeline: activity,
    eventTimeline: events,
    lastActivityAt: activity.length > 0 ? (activity[activity.length - 1].occurredAt || activity[activity.length - 1].createdAt || activity[activity.length - 1].timestamp || null) : null,
    lastManagerContactAt: advisorMonitor && advisorMonitor.lastManagerContactAt || null,
    lastManagerAction: advisorMonitor && advisorMonitor.lastManagerAction || null,
    nextSuggestedManagerAction: legacyCoaching && (legacyCoaching.nextAction || legacyCoaching.prioridad) || null,
    defaultZeroRisks,
    missingEvidence: unique(missingEvidence),
    unknownSignals: unique([
      ...unknownSignals,
      ...asArray(trackingBoundary && trackingBoundary.unknownSignals)
    ]),
    staleSignals: unique([
      ...staleSignals,
      ...asArray(trackingBoundary && trackingBoundary.staleSignals)
    ]),
    evidenceRefs,
    sourceEvidenceIds,
    sourceOwners,
    freshness: freshness.value,
    confidenceLimitations: unique([
      ...confidenceLimitations,
      ...asArray(trackingBoundary && trackingBoundary.confidenceLimitations)
    ]),
    warnings: unique([
      ...warnings,
      ...asArray(trackingBoundary && trackingBoundary.warnings),
      "AdvisorManagerSnapshot is Manager OS review context only and does not create lifecycle, ranking, promotion, revenue, compensation or payout truth."
    ]),
    managerReviewRequired,
    humanReviewRequired,
    allowedUses: unique(use.allowedUses),
    blockedUses: unique(use.blockedUses),
    ...boundaryFlags()
  };
}

module.exports = {
  ADVISOR_MANAGER_SNAPSHOT_DECISIONS,
  ADVISOR_MANAGER_SNAPSHOT_STATUSES,
  buildAdvisorManagerSnapshot
};
