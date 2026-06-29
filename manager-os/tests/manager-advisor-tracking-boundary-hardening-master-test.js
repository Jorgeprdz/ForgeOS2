const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES,
  mapManagerAdvisorTrackingBoundary
} = require("../advisor-tracking/manager-advisor-tracking-boundary-engine");

console.log("\nFORGE MANAGER ADVISOR TRACKING BOUNDARY HARDENING MASTER TEST v1.0\n");

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

const sourceEvidence = {
  evidenceRefs: ["tracking-evidence-1", "shared-ref"],
  sourceEvidenceIds: ["tracking-source-1", "shared-source"],
  sourceOwners: ["MANAGER_OS"],
  freshness: {
    status: "FRESH",
    capturedAt: "2026-06-29T12:00:00.000Z"
  }
};

const strongInput = {
  advisor: {
    id: "ADVISOR_001",
    name: "Advisor One"
  },
  advisorTracking: {
    status: "ACTIVE_CONTEXT",
    evidenceRefs: ["tracking-context-ref"],
    sourceEvidenceIds: ["tracking-context-source"],
    sourceOwners: ["MANAGER_OS"]
  },
  advisorPerformance: {
    score: 22,
    evidenceRefs: ["performance-ref"],
    sourceEvidenceIds: ["performance-source"],
    sourceOwners: ["ADVISOR_OS"],
    freshness: { status: "FRESH" }
  },
  advisorMonitor: {
    advisorId: "ADVISOR_001",
    pendingTasks: 3,
    generatedAt: "2026-06-29T12:00:00.000Z"
  },
  advisorScore: 40,
  advisorAlerts: [{ type: "TASKS", severity: "INFO" }],
  activityTimeline: [{ advisorId: "ADVISOR_001", createdAt: 20 }],
  prospectingSignals: { pipeline: 4 },
  followupSignals: { nextAction: "CALL" },
  referralSignals: { referrals: ["REF_001"] },
  salesDnaSignals: { strongestStage: "FOLLOWUP" },
  team: {
    id: "TEAM_001",
    advisors: ["ADVISOR_001"]
  },
  feedEvents: [
    { id: "old", createdAt: 1 },
    { id: "new", createdAt: 2 }
  ],
  legacyMomentum: {
    promedio: 20,
    nivel: "fuerte"
  },
  legacyAlert: [{ type: "pipeline_ok" }],
  legacyCoaching: {
    prioridad: "mantener",
    mensaje: "Buen ritmo operativo."
  },
  period: {
    periodId: "2026-06"
  },
  sourceEvidence,
  requestedUse: "MANAGER_REVIEW"
};

const tests = [
  {
    name: "Missing puntos does not become zero truth",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        advisor: { id: "ADVISOR_002" },
        legacyMomentum: { nivel: "legacy_context_without_points" },
        sourceEvidence
      });

      assert.equal(result.createsManagerJudgmentTruth, false);
      assert.equal(result.defaultZeroRisks.some((risk) => risk.includes("puntos")), false);
      assert.ok(result.warnings.some((warning) => warning.includes("review context only")));
      assertBoundaries(result);
    }
  },
  {
    name: "Missing pipeline does not create low-pipeline truth",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        advisor: { id: "ADVISOR_003" },
        legacyCoaching: {
          prioridad: "mantener",
          mensaje: "Legacy output preserved."
        },
        sourceEvidence
      });

      assert.equal(result.createsManagerJudgmentTruth, false);
      assert.equal(result.defaultZeroRisks.some((risk) => risk.includes("pipeline")), false);
      assert.ok(result.legacyContext.length > 0);
      assertBoundaries(result);
    }
  },
  {
    name: "Explicit legacy zero values trigger review-required warnings",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        advisorTracking: {
          puntos: 0,
          pipeline: 0,
          score: 0,
          count: 0,
          tasks: 0,
          policies: 0,
          diasSinActividad: 0,
          rate: 0
        },
        sourceEvidence
      });

      assert.equal(result.managerReviewRequired, true);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.defaultZeroRisks.length >= 8);
      assert.ok(result.warnings.some((warning) => warning.includes("zero-like legacy value")));
      assertBoundaries(result);
    }
  },
  {
    name: "Missing evidence requires manager and human review",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        advisorTracking: { status: "ACTIVE_CONTEXT" },
        sourceEvidence: {
          sourceOwners: ["MANAGER_OS"],
          freshness: { status: "FRESH" }
        }
      });

      assert.equal(result.boundaryStatus, MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_EVIDENCE);
      assert.equal(result.managerReviewRequired, true);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.confidenceLimitations.includes("missing_tracking_evidence"));
      assertBoundaries(result);
    }
  },
  {
    name: "Missing source owner requires manager and human review",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        advisorTracking: { status: "ACTIVE_CONTEXT" },
        sourceEvidence: {
          evidenceRefs: ["evidence-1"],
          sourceEvidenceIds: ["source-1"],
          freshness: { status: "FRESH" }
        }
      });

      assert.equal(result.boundaryStatus, MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_SOURCE_OWNER);
      assert.equal(result.managerReviewRequired, true);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.confidenceLimitations.includes("missing_tracking_source_owner"));
      assertBoundaries(result);
    }
  },
  {
    name: "Missing freshness requires manager and human review",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        advisorTracking: { status: "ACTIVE_CONTEXT" },
        sourceEvidence: {
          evidenceRefs: ["evidence-1"],
          sourceEvidenceIds: ["source-1"],
          sourceOwners: ["MANAGER_OS"]
        }
      });

      assert.equal(result.boundaryStatus, MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_FRESHNESS);
      assert.equal(result.managerReviewRequired, true);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.staleSignals.includes("tracking_freshness_missing"));
      assertBoundaries(result);
    }
  },
  {
    name: "Stale freshness requires review",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        advisorTracking: { status: "ACTIVE_CONTEXT" },
        sourceEvidence: {
          evidenceRefs: ["evidence-1"],
          sourceEvidenceIds: ["source-1"],
          sourceOwners: ["MANAGER_OS"],
          freshness: { status: "STALE" }
        }
      });

      assert.equal(result.boundaryStatus, MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_FRESHNESS);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.staleSignals.includes("tracking_freshness_stale"));
      assertBoundaries(result);
    }
  },
  {
    name: "Forbidden requested uses are blocked",
    run() {
      [
        "PUNISHMENT",
        "HUMAN_RANKING",
        "PROMOTION_DECISION",
        "TERMINATION",
        "COMPENSATION",
        "PAYOUT",
        "ADVISOR_LIFECYCLE_TRUTH",
        "REVENUE_TRUTH"
      ].forEach((requestedUse) => {
        const result = mapManagerAdvisorTrackingBoundary({
          ...strongInput,
          requestedUse
        });

        assert.equal(result.boundaryStatus, MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.BLOCKED);
        assert.ok(result.blockedUses.includes(requestedUse));
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Allowed coaching and review uses remain allowed",
    run() {
      [
        "MANAGER_REVIEW",
        "COACHING_CONTEXT",
        "TEAM_PATTERN_CONTEXT",
        "ONE_ON_ONE_PREP",
        "SUPPORT_SIGNAL_REVIEW"
      ].forEach((requestedUse) => {
        const result = mapManagerAdvisorTrackingBoundary({
          ...strongInput,
          requestedUse
        });

        assert.ok(result.allowedUses.includes(requestedUse));
        assert.equal(result.blockedUses.length, 0);
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Advisor signal inputs are routed through existing advisor signal consumer contract",
    run() {
      const result = mapManagerAdvisorTrackingBoundary(strongInput);

      assert.equal(result.advisorSignalContractStatus, "READY_FOR_MANAGER_REVIEW");
      assert.ok(result.managerVisibleTrackingContext.some((context) => context.contextKey === "advisorSignalContract"));
      assert.ok(result.warnings.some((warning) => warning.includes("routed through Manager OS Advisor Signal Consumer Contract")));
      assertBoundaries(result);
    }
  },
  {
    name: "No direct Advisor OS import is required",
    run() {
      const enginePath = path.join(__dirname, "../advisor-tracking/manager-advisor-tracking-boundary-engine.js");
      const source = fs.readFileSync(enginePath, "utf8");

      assert.equal(/require\(["'][^"']*advisor-os/.test(source), false);
      assert.equal(/from ["'][^"']*advisor-os/.test(source), false);
    }
  },
  {
    name: "Feed event sorting does not mutate original input",
    run() {
      const input = clone(strongInput);
      const before = clone(input.feedEvents);
      const result = mapManagerAdvisorTrackingBoundary(input);

      assert.deepEqual(input.feedEvents, before);
      assert.deepEqual(result.safeFeedEvents.map((event) => event.id), ["new", "old"]);
      assert.ok(result.mutationRisks.includes("feed_events_sorted_copy_only"));
      assertBoundaries(result);
    }
  },
  {
    name: "Team snapshot creation does not mutate original input",
    run() {
      const input = clone(strongInput);
      const before = clone(input.team);
      const result = mapManagerAdvisorTrackingBoundary(input);

      result.safeTeamSnapshot.team.advisors.push("MUTATION_ATTEMPT");

      assert.deepEqual(input.team, before);
      assert.deepEqual(input.team.advisors, ["ADVISOR_001"]);
      assert.ok(result.mutationRisks.includes("team_snapshot_copy_only"));
      assertBoundaries(result);
    }
  },
  {
    name: "Raw legacy context remains context-only",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        legacyDashboard: {
          advisors: [{ id: "ADVISOR_001" }],
          metrics: { score: 0 }
        },
        sourceEvidence
      });

      assert.ok(result.legacyContext.length > 0);
      assert.equal(result.legacyContext[0].referenceOnly, true);
      assert.equal(result.legacyContext[0].createsTruth, false);
      assert.ok(result.defaultZeroRisks.some((risk) => risk.includes("score")));
      assertBoundaries(result);
    }
  },
  {
    name: "Boundary flags always remain false",
    run() {
      const result = mapManagerAdvisorTrackingBoundary(strongInput);
      assertBoundaries(result);
    }
  },
  {
    name: "Missing advisor and team arrays do not create zero momentum",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({});

      assert.ok([
        MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.UNKNOWN,
        MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_EVIDENCE,
        MANAGER_ADVISOR_TRACKING_BOUNDARY_STATUSES.NEEDS_HUMAN_REVIEW
      ].includes(result.boundaryStatus));
      assert.equal(result.defaultZeroRisks.length, 0);
      assert.ok(result.unknownSignals.includes("manager_advisor_tracking_context_missing"));
      assertBoundaries(result);
    }
  },
  {
    name: "Empty feed returns empty safeFeedEvents without mutation",
    run() {
      const feedEvents = [];
      const result = mapManagerAdvisorTrackingBoundary({
        advisorTracking: { status: "ACTIVE_CONTEXT" },
        feedEvents,
        sourceEvidence
      });

      assert.deepEqual(feedEvents, []);
      assert.deepEqual(result.safeFeedEvents, []);
      assertBoundaries(result);
    }
  },
  {
    name: "Duplicate evidence refs and source owners are deduped",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        advisorTracking: {
          evidenceRefs: ["shared-ref", "tracking-ref"],
          sourceEvidenceIds: ["shared-source", "tracking-source"],
          sourceOwners: ["MANAGER_OS"]
        },
        sourceEvidence
      });

      assert.equal(result.evidenceRefs.filter((ref) => ref === "shared-ref").length, 1);
      assert.equal(result.sourceEvidenceIds.filter((ref) => ref === "shared-source").length, 1);
      assert.equal(result.sourceOwners.filter((owner) => owner === "MANAGER_OS").length, 1);
      assertBoundaries(result);
    }
  },
  {
    name: "Legacy mantener coaching without evidence still requires review",
    run() {
      const result = mapManagerAdvisorTrackingBoundary({
        legacyCoaching: {
          prioridad: "mantener",
          mensaje: "Buen ritmo operativo."
        }
      });

      assert.equal(result.managerReviewRequired, true);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.confidenceLimitations.includes("missing_tracking_evidence"));
      assertBoundaries(result);
    }
  }
];

let pass = 0;

tests.forEach((test) => {
  try {
    test.run();
    pass += 1;
    console.log(`PASS ${test.name}`);
  } catch (error) {
    console.log(`FAIL ${test.name}`);
    console.log(error);
  }
});

console.log("\nResumen:");
console.log(`Total: ${tests.length}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${tests.length - pass}`);

if (pass !== tests.length) {
  process.exitCode = 1;
}
