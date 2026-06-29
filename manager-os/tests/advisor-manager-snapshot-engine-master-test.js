const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  ADVISOR_MANAGER_SNAPSHOT_STATUSES,
  buildAdvisorManagerSnapshot
} = require("../advisor-snapshots/advisor-manager-snapshot-engine");

console.log("\nFORGE ADVISOR MANAGER SNAPSHOT ENGINE MASTER TEST v1.0\n");

const sourceEvidence = {
  evidenceRefs: ["snapshot-evidence-1", "shared-ref"],
  sourceEvidenceIds: ["snapshot-source-1", "shared-source"],
  sourceOwners: ["MANAGER_OS"],
  freshness: {
    status: "FRESH",
    capturedAt: "2026-06-29T12:00:00.000Z"
  },
  generatedAt: "2026-06-29T12:00:00.000Z"
};

const advisor = {
  advisorId: "ADVISOR_001",
  status: "ACTIVE"
};

const manager = {
  managerId: "MANAGER_001"
};

const team = {
  teamId: "TEAM_001",
  advisors: ["ADVISOR_001"]
};

const advisorTrackingBoundary = {
  boundaryStatus: "READY_FOR_MANAGER_REVIEW",
  advisorId: "ADVISOR_001",
  period: { periodId: "2026-06" },
  managerVisibleTrackingContext: [
    {
      contextKey: "advisorTracking",
      value: { status: "ACTIVE_CONTEXT" },
      referenceOnly: true,
      createsTruth: false
    }
  ],
  advisorSignalContractStatus: "READY_FOR_MANAGER_REVIEW",
  defaultZeroRisks: [],
  missingSignals: [],
  unknownSignals: [],
  staleSignals: [],
  evidenceRefs: ["boundary-evidence", "shared-ref"],
  sourceEvidenceIds: ["boundary-source", "shared-source"],
  sourceOwners: ["MANAGER_OS"],
  freshness: { status: "FRESH" },
  confidenceLimitations: [],
  warnings: ["Boundary context only."],
  managerReviewRequired: false,
  humanReviewRequired: false,
  allowedUses: ["MANAGER_REVIEW"],
  blockedUses: [],
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

const activityTimeline = [
  { id: "late", advisorId: "ADVISOR_001", createdAt: "2026-06-03T10:00:00.000Z" },
  { id: "early", advisorId: "ADVISOR_001", createdAt: "2026-06-01T10:00:00.000Z" }
];

const legacyFeed = [
  { id: "event-late", createdAt: "2026-06-04T10:00:00.000Z" },
  { id: "event-early", createdAt: "2026-06-02T10:00:00.000Z" }
];

function baseInput(overrides = {}) {
  return {
    advisor,
    manager,
    team,
    advisorTrackingBoundary,
    advisorPerformance: {
      score: 24,
      evidenceRefs: ["performance-ref"],
      sourceEvidenceIds: ["performance-source"],
      sourceOwners: ["ADVISOR_OS"],
      freshness: { status: "FRESH" }
    },
    advisorMonitor: {
      advisorId: "ADVISOR_001",
      lastManagerContactAt: "2026-06-25T12:00:00.000Z",
      lastManagerAction: "ONE_ON_ONE"
    },
    advisorScore: {
      score: 88,
      evidenceRefs: ["score-ref"],
      sourceEvidenceIds: ["score-source"],
      sourceOwners: ["ADVISOR_OS"]
    },
    advisorAlerts: [{ type: "FOLLOWUP", severity: "INFO" }],
    activityTimeline,
    prospectingSignals: { pipeline: 4 },
    followupSignals: { nextAction: "CALL" },
    referralSignals: { referrals: ["REF_001"] },
    salesDnaSignals: { strongestStage: "FOLLOWUP" },
    legacyActivity: { label: "legacy activity context" },
    legacyDashboard: { widgets: ["activity"] },
    legacyMomentum: { promedio: 20 },
    legacyAlert: [{ type: "pipeline_ok" }],
    legacyCoaching: {
      prioridad: "mantener",
      nextAction: "COACH_FOLLOWUP"
    },
    legacyFeed,
    legacyNotification: { unread: 2 },
    period: { periodId: "2026-06" },
    sourceEvidence,
    requestedUse: "MANAGER_REVIEW",
    ...overrides
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertBoundaries(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsManagerJudgmentTruth, false);
  assert.equal(result.createsHumanRankingTruth, false);
  assert.equal(result.createsPromotionDecisionTruth, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsCompensationTruth, false);
  assert.equal(result.createsRevenue, false);
  assert.equal(result.createsCompensation, false);
  assert.equal(result.createsPayoutTruth, false);
}

const tests = [
  {
    name: "Snapshot builds advisorId, managerId, teamId and period",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput());
      assert.equal(result.advisorId, "ADVISOR_001");
      assert.equal(result.managerId, "MANAGER_001");
      assert.equal(result.teamId, "TEAM_001");
      assert.deepEqual(result.period, { periodId: "2026-06" });
      assertBoundaries(result);
    }
  },
  {
    name: "Snapshot consumes provided advisorTrackingBoundary as protected context",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput());
      assert.equal(result.trackingBoundaryContext.referenceOnly, true);
      assert.equal(result.trackingBoundaryContext.createsTruth, false);
      assert.equal(result.trackingBoundaryContext.value.boundaryStatus, "READY_FOR_MANAGER_REVIEW");
      assertBoundaries(result);
    }
  },
  {
    name: "Snapshot calls Manager Advisor Tracking Boundary when raw advisor context is provided",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({
        advisorTrackingBoundary: null,
        advisorTracking: { status: "ACTIVE_CONTEXT" }
      }));
      assert.equal(result.trackingBoundaryContext.value.boundaryStatus, "READY_FOR_MANAGER_REVIEW");
      assert.ok(result.warnings.some((warning) => warning.includes("Advisor tracking boundary")));
      assertBoundaries(result);
    }
  },
  {
    name: "Snapshot does not directly import Advisor OS",
    run() {
      const file = fs.readFileSync(path.join(__dirname, "../advisor-snapshots/advisor-manager-snapshot-engine.js"), "utf8");
      assert.equal(file.includes("advisor-os/"), false);
      assert.equal(file.includes("require(\"../../advisor-os"), false);
      assertBoundaries(buildAdvisorManagerSnapshot(baseInput()));
    }
  },
  {
    name: "Missing advisor context becomes unknown and review-required, not zero or low performance",
    run() {
      const result = buildAdvisorManagerSnapshot({
        sourceEvidence,
        requestedUse: "MANAGER_REVIEW"
      });
      assert.equal(result.snapshotStatus, ADVISOR_MANAGER_SNAPSHOT_STATUSES.UNKNOWN);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.unknownSignals.includes("advisor_manager_snapshot_context_missing"));
      assertBoundaries(result);
    }
  },
  {
    name: "Missing evidence requires review",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({
        advisorTrackingBoundary: null,
        sourceEvidence: {
          sourceOwners: ["MANAGER_OS"],
          freshness: { status: "FRESH" }
        }
      }));
      assert.equal(result.snapshotStatus, ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_EVIDENCE);
      assert.ok(result.missingEvidence.includes("advisor_manager_snapshot_evidence_missing"));
      assertBoundaries(result);
    }
  },
  {
    name: "Missing source owner requires review",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({
        advisorTrackingBoundary: null,
        sourceEvidence: {
          evidenceRefs: ["evidence-1"],
          sourceEvidenceIds: ["source-1"],
          freshness: { status: "FRESH" }
        }
      }));
      assert.equal(result.snapshotStatus, ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_SOURCE_OWNER);
      assert.ok(result.missingEvidence.includes("advisor_manager_snapshot_source_owner_missing"));
      assertBoundaries(result);
    }
  },
  {
    name: "Missing freshness requires review",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({
        advisorTrackingBoundary: null,
        sourceEvidence: {
          evidenceRefs: ["evidence-1"],
          sourceEvidenceIds: ["source-1"],
          sourceOwners: ["MANAGER_OS"]
        }
      }));
      assert.equal(result.snapshotStatus, ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_FRESHNESS);
      assert.ok(result.staleSignals.includes("advisor_manager_snapshot_freshness_missing"));
      assertBoundaries(result);
    }
  },
  {
    name: "Stale freshness requires review",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({
        advisorTrackingBoundary: null,
        sourceEvidence: {
          evidenceRefs: ["evidence-1"],
          sourceEvidenceIds: ["source-1"],
          sourceOwners: ["MANAGER_OS"],
          freshness: { status: "STALE" }
        }
      }));
      assert.equal(result.snapshotStatus, ADVISOR_MANAGER_SNAPSHOT_STATUSES.NEEDS_FRESHNESS);
      assert.ok(result.staleSignals.includes("advisor_manager_snapshot_freshness_stale"));
      assertBoundaries(result);
    }
  },
  {
    name: "Explicit zero-like values are context warnings and limitations only",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({
        advisorTrackingBoundary: null,
        advisorPerformance: { score: 0 },
        prospectingSignals: { pipeline: 0 },
        legacyMomentum: { puntos: 0 }
      }));
      assert.ok(result.defaultZeroRisks.length >= 3);
      assert.ok(result.confidenceLimitations.some((item) => item.includes("zero_requires_evidence_review")));
      assert.equal(result.createsManagerJudgmentTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Event timeline is sorted without mutating original input",
    run() {
      const input = baseInput();
      const original = clone(input.legacyFeed);
      const result = buildAdvisorManagerSnapshot(input);
      assert.deepEqual(input.legacyFeed, original);
      assert.deepEqual(result.eventTimeline.map((event) => event.id), ["event-early", "event-late"]);
      assertBoundaries(result);
    }
  },
  {
    name: "Activity timeline is sorted without mutating original input",
    run() {
      const input = baseInput();
      const original = clone(input.activityTimeline);
      const result = buildAdvisorManagerSnapshot(input);
      assert.deepEqual(input.activityTimeline, original);
      assert.deepEqual(result.activityTimeline.map((event) => event.id), ["early", "late"]);
      assertBoundaries(result);
    }
  },
  {
    name: "Team context is cloned and not returned as mutable source reference",
    run() {
      const input = baseInput();
      const result = buildAdvisorManagerSnapshot(input);
      assert.notStrictEqual(result.teamContext.value, input.team);
      result.teamContext.value.advisors.push("ADVISOR_999");
      assert.deepEqual(input.team.advisors, ["ADVISOR_001"]);
      assertBoundaries(result);
    }
  },
  {
    name: "Legacy Manager OS context remains review context only",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput());
      assert.equal(result.coachingContext.referenceOnly, true);
      assert.equal(result.feedContext.createsTruth, false);
      assert.ok(result.warnings.some((warning) => warning.includes("review context only")));
      assertBoundaries(result);
    }
  },
  {
    name: "Advisor performance and score context is not recalculated",
    run() {
      const input = baseInput();
      const result = buildAdvisorManagerSnapshot(input);
      assert.deepEqual(result.productionContext.value, input.advisorPerformance);
      assert.deepEqual(result.qualificationContext.value, input.advisorScore);
      assert.equal(result.productionContext.createsTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Forbidden HUMAN_RANKING use is blocked",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({ requestedUse: "HUMAN_RANKING" }));
      assert.equal(result.snapshotStatus, ADVISOR_MANAGER_SNAPSHOT_STATUSES.BLOCKED);
      assert.ok(result.blockedUses.includes("HUMAN_RANKING"));
      assertBoundaries(result);
    }
  },
  {
    name: "Forbidden PROMOTION_DECISION use is blocked",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({ requestedUse: "PROMOTION_DECISION" }));
      assert.ok(result.blockedUses.includes("PROMOTION_DECISION"));
      assertBoundaries(result);
    }
  },
  {
    name: "Forbidden PUNISHMENT use is blocked",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({ requestedUse: "PUNISHMENT" }));
      assert.ok(result.blockedUses.includes("PUNISHMENT"));
      assertBoundaries(result);
    }
  },
  {
    name: "Forbidden COMPENSATION PAYOUT and REVENUE_TRUTH uses are blocked",
    run() {
      ["COMPENSATION", "PAYOUT", "REVENUE_TRUTH"].forEach((requestedUse) => {
        const result = buildAdvisorManagerSnapshot(baseInput({ requestedUse }));
        assert.ok(result.blockedUses.includes(requestedUse));
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Forbidden ADVISOR_LIFECYCLE_TRUTH use is blocked",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput({ requestedUse: "ADVISOR_LIFECYCLE_TRUTH" }));
      assert.ok(result.blockedUses.includes("ADVISOR_LIFECYCLE_TRUTH"));
      assert.equal(result.createsAdvisorLifecycleTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Allowed uses remain allowed",
    run() {
      [
        "MANAGER_REVIEW",
        "COACHING_CONTEXT",
        "ONE_ON_ONE_PREP",
        "TEAM_PATTERN_CONTEXT",
        "METRICS_CONTEXT",
        "FORECAST_CONTEXT",
        "DASHBOARD_CONTEXT",
        "CONVERSATION_CONTEXT",
        "SUPPORT_SIGNAL_REVIEW"
      ].forEach((requestedUse) => {
        const result = buildAdvisorManagerSnapshot(baseInput({ requestedUse }));
        assert.ok(result.allowedUses.includes(requestedUse));
        assert.equal(result.blockedUses.length, 0);
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Snapshot does not create Advisor Lifecycle truth",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput());
      assert.equal(result.createsAdvisorLifecycleTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Snapshot does not create revenue compensation or payout truth",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput());
      assert.equal(result.createsRevenue, false);
      assert.equal(result.createsCompensation, false);
      assert.equal(result.createsCompensationTruth, false);
      assert.equal(result.createsPayoutTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Snapshot does not create ranking promotion punishment or automatic decision truth",
    run() {
      const result = buildAdvisorManagerSnapshot(baseInput());
      assert.equal(result.createsHumanRankingTruth, false);
      assert.equal(result.createsPromotionDecisionTruth, false);
      assert.equal(result.createsManagerJudgmentTruth, false);
      assert.equal(result.automaticDecisionAllowed, false);
      assertBoundaries(result);
    }
  },
  {
    name: "All boundary truth flags remain false",
    run() {
      assertBoundaries(buildAdvisorManagerSnapshot(baseInput()));
    }
  }
];

let passed = 0;
let failed = 0;

tests.forEach((test) => {
  try {
    test.run();
    passed += 1;
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error);
  }
});

console.log("\nResumen:");
console.log(`Total: ${tests.length}`);
console.log(`Pass: ${passed}`);
console.log(`Fail: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
