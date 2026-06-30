"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  buildNashMickNbaReconnection,
  NASH_MICK_NBA_RECONNECTION_STATUSES,
  NBA_REASON_WHY_ALLOWED_USES,
  NBA_REASON_WHY_FORBIDDEN_USES
} = require("../nba/nash-mick-nba-reconnection-engine");

let passCount = 0;

function test(name, fn) {
  fn();
  passCount += 1;
  console.log(`PASS ${passCount} - ${name}`);
}

function strongInput(overrides = {}) {
  return {
    advisorId: "advisor-1",
    managerId: "manager-1",
    personId: "maria-1",
    personType: "prospect",
    period: "2026-Q2",
    relationshipContext: {
      targetPerson: { personId: "maria-1", name: "Maria", personType: "prospect" },
      whyThisPerson: "Maria is a candidate follow-up target with relationship context.",
      evidenceRefs: ["relationship-ref"],
      sourceEvidenceIds: ["relationship-src"],
      sourceOwners: ["relationship-intelligence"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    activityContext: {
      whyNow: "The follow-up cadence is stale relative to the observed review window.",
      evidenceRefs: ["activity-ref"],
      sourceEvidenceIds: ["activity-src"],
      sourceOwners: ["advisor-os"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    followupContext: {
      recommendedAction: "Review a human-approved follow-up with Maria.",
      whyThisAction: "The action could preserve optionality without forcing a sale.",
      evidenceRefs: ["followup-ref"],
      sourceEvidenceIds: ["followup-src"],
      sourceOwners: ["advisor-os"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    nashConversationContext: {
      conversationAngle: "calm relationship-first check-in",
      whyThisMessage: "The message should acknowledge time passed and invite a voluntary response.",
      suggestedMessageInstruction: "Prepare instructions for a calm, human-reviewed check-in.",
      evidenceRefs: ["nash-ref"],
      sourceEvidenceIds: ["nash-src"],
      sourceOwners: ["nash-context-intake"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    nashCombatContext: {
      objectionSupport: "If timing is a concern, acknowledge it without pressure.",
      evidenceRefs: ["combat-ref"],
      sourceEvidenceIds: ["combat-src"],
      sourceOwners: ["nash-context-intake"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    mickBehaviorContext: {
      reasonWhy: "This is a candidate action because follow-up consistency supports voluntary execution.",
      whyNow: "Consistency context suggests review now, not automatic action.",
      whyThisAction: "The behavior pattern supports a reviewed follow-up.",
      evidenceRefs: ["mick-ref", "mick-ref"],
      sourceEvidenceIds: ["mick-src", "mick-src"],
      sourceOwners: ["mick-context-intake", "mick-context-intake"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    goalContext: {
      goal: "support voluntary follow-up discipline",
      evidenceRefs: ["goal-ref"],
      sourceEvidenceIds: ["goal-src"],
      sourceOwners: ["manager-os"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    compensationCandidateContext: {
      candidate: true,
      estimated: true,
      evidenceRefs: ["comp-candidate-ref"],
      sourceEvidenceIds: ["comp-candidate-src"],
      sourceOwners: ["compensation-candidate-context"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    forecastContext: {
      scenario: "candidate",
      evidenceRefs: ["forecast-ref"],
      sourceEvidenceIds: ["forecast-src"],
      sourceOwners: ["forecast-context"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    sourceEvidence: {
      evidenceRefs: ["source-ref"],
      sourceEvidenceIds: ["source-id"],
      sourceOwners: ["source-owner"],
      freshness: { status: "CURRENT", capturedAt: "2026-06-30T10:00:00Z" }
    },
    requestedUse: "FOLLOWUP_REASON_WHY",
    ...overrides
  };
}

function assertFalseFlags(result) {
  assert.strictEqual(result.suggestedMessageDraftAllowed, false);
  assert.strictEqual(result.humanApprovalRequired, true);
  assert.strictEqual(result.automaticExecutionAllowed, false);
  assert.strictEqual(result.createsMessageDraft, false);
  assert.strictEqual(result.sendsMessage, false);
  assert.strictEqual(result.createsTask, false);
  assert.strictEqual(result.createsCalendarEvent, false);
  assert.strictEqual(result.executesNashRuntime, false);
  assert.strictEqual(result.executesMickRuntime, false);
  assert.strictEqual(result.callsLlmRuntime, false);
  assert.strictEqual(result.createsCompensationTruth, false);
  assert.strictEqual(result.createsPayoutTruth, false);
  assert.strictEqual(result.createsRevenueTruth, false);
  assert.strictEqual(result.createsRankingTruth, false);
  assert.strictEqual(result.createsPunishmentTruth, false);
  assert.strictEqual(result.createsHrTruth, false);
  assert.strictEqual(result.createsPromotionTruth, false);
  assert.strictEqual(result.createsAdvisorLifecycleTruth, false);
  assert.strictEqual(result.createsPersonalityTruth, false);
}

test("Engine reconnects protected Nash and Mick context through NBA boundary", () => {
  const result = buildNashMickNbaReconnection(strongInput());
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.READY_FOR_HUMAN_REVIEW);
  assert.strictEqual(result.boundaryContext.contractStatus, "READY_FOR_HUMAN_REVIEW");
  assert.strictEqual(result.recommendedAction, "Review a human-approved follow-up with Maria.");
  assert.strictEqual(result.targetPerson.name, "Maria");
  assert(result.reasonWhy.includes("candidate action"));
  assert(result.whyNow.includes("Consistency"));
  assert(result.whyThisPerson.includes("Maria"));
  assert(result.whyThisAction.includes("behavior pattern"));
  assert(result.whyThisMessage.includes("voluntary"));
  assert.strictEqual(result.conversationAngle, "calm relationship-first check-in");
  assert.strictEqual(result.objectionSupport, "If timing is a concern, acknowledge it without pressure.");
  assertFalseFlags(result);
});

test("Engine calls boundary and exposes boundary context", () => {
  const result = buildNashMickNbaReconnection(strongInput());
  assert(result.boundaryContext);
  assert.strictEqual(result.boundaryContext.recommendedAction, result.recommendedAction);
  assert.strictEqual(result.boundaryContext.suggestedMessageDraftAllowed, false);
});

test("Missing all context remains UNKNOWN, not zero", () => {
  const result = buildNashMickNbaReconnection({ requestedUse: "FOLLOWUP_REASON_WHY" });
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.UNKNOWN);
  assert(result.missingContext.includes("nash_conversation_context_missing"));
  assert(result.missingContext.includes("mick_behavior_context_missing"));
  assertFalseFlags(result);
});

test("Missing Nash context requires Nash context, not runtime execution", () => {
  const result = buildNashMickNbaReconnection(strongInput({ nashConversationContext: null }));
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.NEEDS_NASH_CONTEXT);
  assert(result.missingContext.includes("nash_conversation_context_missing"));
  assert.strictEqual(result.executesNashRuntime, false);
});

test("Missing Mick context requires Mick context, not runtime execution", () => {
  const result = buildNashMickNbaReconnection(strongInput({ mickBehaviorContext: null }));
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.NEEDS_MICK_CONTEXT);
  assert(result.missingContext.includes("mick_behavior_context_missing"));
  assert.strictEqual(result.executesMickRuntime, false);
});

test("Missing evidence propagates from boundary", () => {
  const result = buildNashMickNbaReconnection(strongInput({
    sourceEvidence: {},
    relationshipContext: { targetPerson: { name: "Maria" }, sourceOwners: ["relationship"], freshness: { status: "CURRENT" } },
    activityContext: { whyNow: "candidate timing", sourceOwners: ["activity"], freshness: { status: "CURRENT" } },
    followupContext: { recommendedAction: "Review follow-up", whyThisAction: "candidate action", sourceOwners: ["followup"], freshness: { status: "CURRENT" } },
    nashConversationContext: { conversationAngle: "calm", whyThisMessage: "candidate message", sourceOwners: ["nash"], freshness: { status: "CURRENT" } },
    mickBehaviorContext: { reasonWhy: "candidate reason", sourceOwners: ["mick"], freshness: { status: "CURRENT" } },
    nashCombatContext: null,
    goalContext: null,
    compensationCandidateContext: null,
    forecastContext: null
  }));
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.NEEDS_EVIDENCE);
  assert(result.confidenceLimitations.includes("missing_evidence_requires_review"));
});

test("Missing source owner propagates from boundary", () => {
  const result = buildNashMickNbaReconnection(strongInput({
    sourceEvidence: { evidenceRefs: ["e"], sourceEvidenceIds: ["s"], freshness: { status: "CURRENT" } },
    relationshipContext: { targetPerson: { name: "Maria" }, evidenceRefs: ["e"], sourceEvidenceIds: ["s"], freshness: { status: "CURRENT" } },
    activityContext: { whyNow: "candidate timing", evidenceRefs: ["e"], sourceEvidenceIds: ["s"], freshness: { status: "CURRENT" } },
    followupContext: { recommendedAction: "Review follow-up", whyThisAction: "candidate action", evidenceRefs: ["e"], sourceEvidenceIds: ["s"], freshness: { status: "CURRENT" } },
    nashConversationContext: { conversationAngle: "calm", whyThisMessage: "candidate message", evidenceRefs: ["e"], sourceEvidenceIds: ["s"], freshness: { status: "CURRENT" } },
    mickBehaviorContext: { reasonWhy: "candidate reason", evidenceRefs: ["e"], sourceEvidenceIds: ["s"], freshness: { status: "CURRENT" } },
    nashCombatContext: null,
    goalContext: null,
    compensationCandidateContext: null,
    forecastContext: null
  }));
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.NEEDS_SOURCE_OWNER);
});

test("Stale freshness propagates from boundary", () => {
  const result = buildNashMickNbaReconnection(strongInput({
    sourceEvidence: { evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: ["owner"], freshness: { status: "STALE" } }
  }));
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.NEEDS_FRESHNESS);
  assert(result.staleSignals.includes("freshness_stale"));
});

test("Missing recommended action propagates from boundary", () => {
  const result = buildNashMickNbaReconnection(strongInput({
    followupContext: { whyThisAction: "candidate action", evidenceRefs: ["e"], sourceEvidenceIds: ["s"], sourceOwners: ["owner"], freshness: { status: "CURRENT" } },
    recommendedAction: null
  }));
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.NEEDS_RECOMMENDED_ACTION);
});

test("Explicit zero values remain review context only", () => {
  const result = buildNashMickNbaReconnection(strongInput({
    mickBehaviorContext: {
      reasonWhy: "candidate reason",
      activityCount: 0,
      evidenceRefs: ["mick-ref"],
      sourceEvidenceIds: ["mick-src"],
      sourceOwners: ["mick-context-intake"],
      freshness: { status: "CURRENT" }
    }
  }));
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.NEEDS_HUMAN_REVIEW);
  assert(result.unknownSignals.some((signal) => signal.includes("explicit_zero_context_requires_review")));
  assertFalseFlags(result);
});

test("Forbidden uses are blocked", () => {
  NBA_REASON_WHY_FORBIDDEN_USES.forEach((requestedUse) => {
    const result = buildNashMickNbaReconnection(strongInput({ requestedUse }));
    assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.BLOCKED);
    assert(result.blockedUses.includes(requestedUse));
    assertFalseFlags(result);
  });
});

test("Allowed uses remain allowed", () => {
  NBA_REASON_WHY_ALLOWED_USES.forEach((requestedUse) => {
    const result = buildNashMickNbaReconnection(strongInput({ requestedUse }));
    assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.READY_FOR_HUMAN_REVIEW);
    assert(result.allowedUses.includes(requestedUse));
  });
});

test("Unknown requested use is not silently allowed", () => {
  const result = buildNashMickNbaReconnection(strongInput({ requestedUse: "EXECUTE_NBA_NOW" }));
  assert.strictEqual(result.reconnectionStatus, NASH_MICK_NBA_RECONNECTION_STATUSES.NOT_MODELED);
  assert(result.blockedUses.includes("EXECUTE_NBA_NOW"));
});

test("Inputs are not mutated", () => {
  const input = strongInput();
  const before = JSON.stringify(input);
  buildNashMickNbaReconnection(input);
  assert.strictEqual(JSON.stringify(input), before);
});

test("Evidence refs, source evidence IDs, and source owners dedupe", () => {
  const result = buildNashMickNbaReconnection(strongInput());
  assert.strictEqual(result.evidenceRefs.filter((item) => item === "mick-ref").length, 1);
  assert.strictEqual(result.sourceEvidenceIds.filter((item) => item === "mick-src").length, 1);
  assert.strictEqual(result.sourceOwners.filter((item) => item === "mick-context-intake").length, 1);
});

test("Suggested message instruction remains instruction only", () => {
  const result = buildNashMickNbaReconnection(strongInput());
  assert(result.suggestedMessageInstruction.includes("instructions"));
  assert.strictEqual(result.suggestedMessageDraftAllowed, false);
  assert.strictEqual(result.createsMessageDraft, false);
  assert.strictEqual(result.sendsMessage, false);
});

test("Compensation candidate and forecast context do not create truth", () => {
  const result = buildNashMickNbaReconnection(strongInput());
  assert(result.warnings.includes("compensation_candidate_context_is_not_payout_truth"));
  assert(result.warnings.includes("forecast_context_is_not_payout_truth"));
  assert.strictEqual(result.createsCompensationTruth, false);
  assert.strictEqual(result.createsPayoutTruth, false);
  assert.strictEqual(result.createsRevenueTruth, false);
});

test("No action, runtime, HR, ranking, punishment, lifecycle, or personality truth flags are created", () => {
  const result = buildNashMickNbaReconnection(strongInput());
  assertFalseFlags(result);
});

test("Engine imports only the NBA boundary contract", () => {
  const sourcePath = path.join(__dirname, "../nba/nash-mick-nba-reconnection-engine.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  assert(source.includes('require("./nba-reason-why-boundary-contract")'));
  [
    "nash/",
    "mick/",
    "external-context-bridge",
    "message-generation",
    "advisor-os",
    "compensation",
    "revenue",
    "advisor-lifecycle",
    "product-intelligence",
    "schemas",
    "fixtures",
    "openai",
    "whatsapp",
    "sms",
    "nash-core-engine",
    "nash-next-best-action-engine",
    "nash-message-recommendation-engine"
  ].forEach((term) => assert(!source.includes(`require("${term}`), `forbidden import ${term}`));
});

console.log(`Nash Mick NBA Reconnection Engine master tests PASS ${passCount}/19`);
