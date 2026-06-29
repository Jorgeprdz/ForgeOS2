const {
  ALLOWED_MANAGER_ADVISOR_SIGNAL_USES,
  FORBIDDEN_MANAGER_ADVISOR_SIGNAL_USES,
  mapAdvisorOsSignalsForManager
} = require("../advisor-signals/manager-advisor-signal-consumer-contract");

const MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES = Object.freeze({
  READY_FOR_MANAGER_REVIEW: "READY_FOR_MANAGER_REVIEW",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  NEEDS_SOURCE_OWNER: "NEEDS_SOURCE_OWNER",
  NEEDS_FRESHNESS: "NEEDS_FRESHNESS",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  NOT_MODELED: "NOT_MODELED"
});

const MANAGER_ADVISOR_TRACKING_BOUNDARY_DECISIONS = Object.freeze({
  CONSUME_AS_MANAGER_REVIEW_CONTEXT: "CONSUME_AS_MANAGER_REVIEW_CONTEXT",
  COLLECT_SIGNAL_EVIDENCE: "COLLECT_SIGNAL_EVIDENCE",
  COLLECT_SOURCE_OWNER: "COLLECT_SOURCE_OWNER",
  REFRESH_SIGNAL_CONTEXT: "REFRESH_SIGNAL_CONTEXT",
  REQUIRE_HUMAN_REVIEW: "REQUIRE_HUMAN_REVIEW",
  BLOCK_FORBIDDEN_USE: "BLOCK_FORBIDDEN_USE",
  USE_ADVISOR_SIGNAL_CONTRACT: "USE_ADVISOR_SIGNAL_CONTRACT"
});

const ADVISOR_SIGNAL_KEYS = Object.freeze([
  "advisorPerformance",
  "advisorMonitor",
  "advisorScore",
  "advisorAlerts",
  "activityTimeline",
  "prospectingSignals",
  "followupSignals",
  "referralSignals",
  "salesDnaSignals"
]);

const LEGACY_CONTEXT_KEYS = Object.freeze([
  "advisorTracking",
  "legacyMomentum",
  "legacyAlert",
  "legacyCoaching",
  "legacyDashboard",
  "legacyActivity",
  "legacyStructure",
  "legacyNotification"
]);

const ZERO_RISK_KEYS = Object.freeze([
  "puntos",
  "pipeline",
  "score",
  "count",
  "tasks",
  "policies",
  "diasSinActividad",
  "rate"
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

function hasSignalInputs(input = {}) {
  return ADVISOR_SIGNAL_KEYS.some((key) => present(input[key]));
}

function hasManagerVisibleContext(input = {}) {
  return [
    ...ADVISOR_SIGNAL_KEYS,
    ...LEGACY_CONTEXT_KEYS,
    "advisor",
    "team",
    "feedEvents"
  ].some((key) => present(input[key]));
}

function resolveAdvisorId({ advisor = {}, advisorMonitor = {}, activityTimeline = [] } = {}) {
  const firstActivity = asArray(activityTimeline).find((activity) => isObject(activity) && present(activity.advisorId)) || {};
  return advisor.advisorId || advisor.id || advisorMonitor.advisorId || firstActivity.advisorId || null;
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

function buildLegacyContext(input = {}) {
  return LEGACY_CONTEXT_KEYS
    .filter((key) => present(input[key]))
    .map((key) => ({
      contextKey: key,
      value: clone(input[key]),
      referenceOnly: true,
      createsTruth: false
    }));
}

function buildManagerVisibleTrackingContext({ input, advisorSignalContract }) {
  const context = [];

  if (advisorSignalContract) {
    context.push({
      contextKey: "advisorSignalContract",
      value: clone(advisorSignalContract),
      referenceOnly: true,
      createsTruth: false
    });
  }

  buildLegacyContext(input).forEach((entry) => context.push(entry));

  return context;
}

function buildSafeFeedEvents(feedEvents) {
  return asArray(feedEvents)
    .map((event) => clone(event))
    .sort((a, b) => {
      const left = Number(a && a.createdAt ? a.createdAt : 0);
      const right = Number(b && b.createdAt ? b.createdAt : 0);
      return right - left;
    });
}

function buildSafeTeamSnapshot(team, advisor) {
  if (!present(team) && !present(advisor)) return null;
  return {
    team: present(team) ? clone(team) : null,
    advisor: present(advisor) ? clone(advisor) : null,
    referenceOnly: true,
    createsTruth: false
  };
}

function resolveUse(requestedUse) {
  const normalizedRequestedUse = normalizeText(requestedUse);
  if (!normalizedRequestedUse) {
    return {
      allowedUses: ["MANAGER_REVIEW"],
      blockedUses: []
    };
  }

  if (FORBIDDEN_MANAGER_ADVISOR_SIGNAL_USES.includes(normalizedRequestedUse)) {
    return {
      allowedUses: [],
      blockedUses: [normalizedRequestedUse]
    };
  }

  if (ALLOWED_MANAGER_ADVISOR_SIGNAL_USES.includes(normalizedRequestedUse)) {
    return {
      allowedUses: [normalizedRequestedUse],
      blockedUses: []
    };
  }

  return {
    allowedUses: [],
    blockedUses: [normalizedRequestedUse]
  };
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

function resolveBoundaryStatus({
  blockedUses,
  hasContext,
  evidenceRefs,
  sourceEvidenceIds,
  sourceOwners,
  freshness,
  humanReviewRequired
}) {
  if (blockedUses.length > 0) return MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.BLOCKED;
  if (!hasContext) return MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.UNKNOWN;
  if (evidenceRefs.length === 0 && sourceEvidenceIds.length === 0) {
    return MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_EVIDENCE;
  }
  if (sourceOwners.length === 0) return MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_SOURCE_OWNER;
  if (!freshness.available || freshness.stale) return MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_FRESHNESS;
  if (humanReviewRequired) return MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_HUMAN_REVIEW;
  return MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.READY_FOR_MANAGER_REVIEW;
}

function mapManagerAdvisorTrackingBoundary(input = {}) {
  const {
    advisorTracking = null,
    advisorPerformance = null,
    advisorMonitor = null,
    advisorScore = null,
    advisorAlerts = null,
    activityTimeline = null,
    prospectingSignals = null,
    followupSignals = null,
    referralSignals = null,
    salesDnaSignals = null,
    advisor = null,
    team = null,
    feedEvents = null,
    legacyMomentum = null,
    legacyAlert = null,
    legacyCoaching = null,
    legacyDashboard = null,
    legacyActivity = null,
    legacyStructure = null,
    legacyNotification = null,
    period = null,
    sourceEvidence = {},
    requestedUse = null
  } = input;

  const advisorSignalContract = hasSignalInputs(input)
    ? mapAdvisorOsSignalsForManager({
      advisorPerformance,
      advisorMonitor,
      advisorScore,
      advisorAlerts,
      activityTimeline,
      prospectingSignals,
      followupSignals,
      referralSignals,
      salesDnaSignals,
      advisor: advisor || {},
      period,
      sourceEvidence,
      requestedUse
    })
    : null;

  const values = [
    advisorTracking,
    advisorPerformance,
    advisorMonitor,
    advisorScore,
    advisorAlerts,
    activityTimeline,
    prospectingSignals,
    followupSignals,
    referralSignals,
    salesDnaSignals,
    advisor,
    team,
    feedEvents,
    legacyMomentum,
    legacyAlert,
    legacyCoaching,
    legacyDashboard,
    legacyActivity,
    legacyStructure,
    legacyNotification,
    advisorSignalContract
  ].filter(present);

  const evidenceRefs = unique([
    ...collectEvidenceRefs({ sourceEvidence, values }),
    ...asArray(advisorSignalContract && advisorSignalContract.evidenceRefs)
  ]);
  const sourceEvidenceIds = unique([
    ...collectSourceEvidenceIds({ sourceEvidence, values }),
    ...asArray(advisorSignalContract && advisorSignalContract.sourceEvidenceIds)
  ]);
  const sourceOwners = unique([
    ...collectSourceOwners({ sourceEvidence, values }),
    ...asArray(advisorSignalContract && advisorSignalContract.sourceOwners)
  ]);
  const freshness = resolveFreshness({ sourceEvidence, values });
  const use = resolveUse(requestedUse);
  const defaultZeroRisks = unique(values.flatMap((value) => collectZeroRisks(value)));
  const mutationRisks = [];
  const warnings = [];
  const confidenceLimitations = [];
  const missingSignals = [];
  const unknownSignals = [];
  const staleSignals = [];
  const legacyContext = buildLegacyContext({
    advisorTracking,
    legacyMomentum,
    legacyAlert,
    legacyCoaching,
    legacyDashboard,
    legacyActivity,
    legacyStructure,
    legacyNotification
  });

  if (!hasManagerVisibleContext(input)) {
    unknownSignals.push("manager_advisor_tracking_context_missing");
    warnings.push("Manager advisor tracking context is missing; do not infer zero momentum or low performance.");
  }

  if (!present(advisorTracking) && !advisorSignalContract && legacyContext.length === 0) {
    missingSignals.push("advisor_tracking_signal_missing");
  }

  if (evidenceRefs.length === 0 && sourceEvidenceIds.length === 0) {
    warnings.push("Manager advisor tracking evidence is missing; context requires manager/human review.");
    confidenceLimitations.push("missing_tracking_evidence");
  }

  if (sourceOwners.length === 0) {
    warnings.push("Manager advisor tracking source owner is missing.");
    confidenceLimitations.push("missing_tracking_source_owner");
  }

  if (!freshness.available) {
    staleSignals.push("tracking_freshness_missing");
    warnings.push("Manager advisor tracking freshness is missing.");
    confidenceLimitations.push("missing_tracking_freshness");
  }

  if (freshness.stale) {
    staleSignals.push("tracking_freshness_stale");
    warnings.push("Manager advisor tracking freshness is stale.");
    confidenceLimitations.push("stale_tracking_freshness");
  }

  if (defaultZeroRisks.length > 0) {
    defaultZeroRisks.forEach((risk) => {
      warnings.push(`${risk}: explicit zero-like legacy value is context only and requires evidence/source/freshness review.`);
      confidenceLimitations.push(risk);
    });
  }

  if (present(feedEvents)) {
    mutationRisks.push("feed_events_sorted_copy_only");
  }

  if (present(team)) {
    mutationRisks.push("team_snapshot_copy_only");
  }

  if (use.blockedUses.length > 0) {
    use.blockedUses.forEach((blockedUse) => {
      warnings.push(`${blockedUse} use is blocked for Manager OS advisor tracking boundary.`);
    });
  }

  if (advisorSignalContract) {
    warnings.push("Advisor OS-like signals were routed through Manager OS Advisor Signal Consumer Contract.");
  }

  if (legacyContext.length > 0) {
    warnings.push("Legacy Manager OS tracking outputs are preserved as review context only and do not create truth.");
  }

  const managerReviewRequired =
    use.blockedUses.length > 0 ||
    defaultZeroRisks.length > 0 ||
    evidenceRefs.length === 0 ||
    sourceEvidenceIds.length === 0 ||
    sourceOwners.length === 0 ||
    !freshness.available ||
    freshness.stale ||
    missingSignals.length > 0 ||
    unknownSignals.length > 0 ||
    (advisorSignalContract && advisorSignalContract.managerReviewRequired === true);
  const humanReviewRequired = managerReviewRequired;
  const boundaryStatus = resolveBoundaryStatus({
    blockedUses: use.blockedUses,
    hasContext: hasManagerVisibleContext(input),
    evidenceRefs,
    sourceEvidenceIds,
    sourceOwners,
    freshness,
    humanReviewRequired
  });

  return {
    boundaryStatus,
    advisorId: resolveAdvisorId({ advisor: advisor || {}, advisorMonitor: advisorMonitor || {}, activityTimeline: activityTimeline || [] }),
    period: period || sourceEvidence.period || (advisorSignalContract && advisorSignalContract.period) || null,
    managerVisibleTrackingContext: buildManagerVisibleTrackingContext({ input, advisorSignalContract }),
    legacyContext,
    safeFeedEvents: buildSafeFeedEvents(feedEvents),
    safeTeamSnapshot: buildSafeTeamSnapshot(team, advisor),
    missingSignals: unique([
      ...missingSignals,
      ...asArray(advisorSignalContract && advisorSignalContract.missingSignals)
    ]),
    unknownSignals: unique([
      ...unknownSignals,
      ...asArray(advisorSignalContract && advisorSignalContract.unknownSignals)
    ]),
    staleSignals: unique([
      ...staleSignals,
      ...asArray(advisorSignalContract && advisorSignalContract.staleSignals)
    ]),
    defaultZeroRisks,
    mutationRisks: unique(mutationRisks),
    evidenceRefs,
    sourceEvidenceIds,
    sourceOwners,
    freshness: freshness.value,
    confidenceLimitations: unique([
      ...confidenceLimitations,
      ...asArray(advisorSignalContract && advisorSignalContract.confidenceLimitations)
    ]),
    warnings: unique([
      ...warnings,
      ...asArray(advisorSignalContract && advisorSignalContract.warnings),
      "Manager advisor tracking boundary is review context only and does not create Manager OS judgment truth."
    ]),
    managerReviewRequired,
    humanReviewRequired,
    allowedUses: unique(use.allowedUses),
    blockedUses: unique(use.blockedUses),
    advisorSignalContractStatus: advisorSignalContract ? advisorSignalContract.contractStatus : null,
    ...boundaryFlags()
  };
}

module.exports = {
  MANAGER_ADVISOR_TRACKING_BOUNDARY_DECISIONS,
  MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES,
  mapManagerAdvisorTrackingBoundary
};
