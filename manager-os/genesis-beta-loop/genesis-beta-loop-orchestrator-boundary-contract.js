"use strict";

/**
 * Genesis Beta Loop Orchestrator Boundary Contract.
 *
 * Connects safe stage outputs only:
 * Protected Context -> Nash/Mick NBA -> Prompt Builder -> LLM Draft Intake
 * -> Message Safety Validator -> Human Approval Gate -> Delivery Candidate.
 *
 * It never sends, executes provider/runtime/LLM, writes CRM/tasks/calendar,
 * or creates revenue/compensation/payout/lifecycle/HR/ranking truth.
 */

const STAGES = Object.freeze({
  NBA: "NASH_MICK_NBA",
  PROMPT: "PROMPT_BUILDER",
  DRAFT: "LLM_DRAFT_INTAKE",
  SAFETY: "MESSAGE_SAFETY_VALIDATOR",
  APPROVAL: "HUMAN_APPROVAL_GATE",
  DELIVERY: "DELIVERY_CANDIDATE",
});

const STATUSES = Object.freeze({
  NEEDS_DRAFT: "NEEDS_DRAFT",
  NEEDS_HUMAN_APPROVAL: "NEEDS_HUMAN_APPROVAL",
  READY_FOR_DELIVERY_CANDIDATE: "READY_FOR_DELIVERY_CANDIDATE",
  DELIVERY_CANDIDATE_PREPARED: "DELIVERY_CANDIDATE_PREPARED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
});

const DECISIONS = Object.freeze({
  WAIT_FOR_DRAFT: "WAIT_FOR_DRAFT",
  REQUEST_HUMAN_APPROVAL: "REQUEST_HUMAN_APPROVAL",
  PREPARE_DELIVERY_CANDIDATE: "PREPARE_DELIVERY_CANDIDATE",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
});

const FALSE_FLAGS = Object.freeze({
  automaticExecutionAllowed: false,
  sendsMessage: false,
  executesSend: false,
  executesProviderRuntime: false,
  executesLlmRuntime: false,
  createsTask: false,
  createsCalendarEvent: false,
  createsCrmWrite: false,
  createsRevenueTruth: false,
  createsCompensationTruth: false,
  createsPayoutTruth: false,
  createsLifecycleTruth: false,
  createsHrTruth: false,
  createsRankingTruth: false,
  createsPunishmentTruth: false,
  createsPersonalityTruth: false,
});

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function callStage(name, fn, payload, warnings) {
  if (typeof fn !== "function") {
    warnings.push(`${name}: missing adapter`);
    return { status: "REVIEW_REQUIRED", missingAdapter: name };
  }

  try {
    const result = fn(payload);
    return result && typeof result === "object" ? result : { value: result };
  } catch (error) {
    warnings.push(`${name}: adapter error: ${error.message}`);
    return { status: "REVIEW_REQUIRED", adapterError: error.message };
  }
}

function approvalAllowsDelivery(approval) {
  const text = JSON.stringify(approval || {});
  return text.includes("APPROVED_FOR_DELIVERY_PREPARATION") ||
    text.includes("APPROVE_FOR_DELIVERY_PREPARATION");
}

function buildGenesisBetaLoopOrchestrator(input = {}, adapters = {}) {
  const before = clone(input);
  const warnings = [];
  const blockedStages = [];

  const evidenceRefs = unique(input.evidenceRefs || []);
  const sourceOwners = unique(input.sourceOwners || []);
  const freshness = input.freshness || "UNKNOWN";

  const stages = {
    nashMickNba: callStage(STAGES.NBA, adapters.nashMickNba, {
      protectedContext: input.protectedContext,
      nashContext: input.nashContext,
      mickContext: input.mickContext,
      evidenceRefs,
      sourceOwners,
      freshness,
    }, warnings),

    promptBuilder: null,
    draftIntake: null,
    safetyValidator: null,
    humanApprovalGate: null,
    deliveryCandidate: null,
  };

  stages.promptBuilder = callStage(STAGES.PROMPT, adapters.promptBuilder, {
    protectedContext: input.protectedContext,
    nbaReasonWhy: stages.nashMickNba,
    evidenceRefs,
    sourceOwners,
    freshness,
  }, warnings);

  if (!input.draftText) {
    blockedStages.push("DRAFT_REQUIRED");
  } else {
    stages.draftIntake = callStage(STAGES.DRAFT, adapters.draftIntake, {
      draftText: input.draftText,
      promptContext: stages.promptBuilder,
      evidenceRefs,
      sourceOwners,
      freshness,
    }, warnings);

    stages.safetyValidator = callStage(STAGES.SAFETY, adapters.safetyValidator, {
      draftText: input.draftText,
      draftContext: stages.draftIntake,
      evidenceRefs,
      sourceOwners,
      freshness,
    }, warnings);
  }

  if (!input.humanApproval) {
    blockedStages.push("HUMAN_APPROVAL_REQUIRED");
  } else {
    stages.humanApprovalGate = callStage(STAGES.APPROVAL, adapters.humanApprovalGate, {
      ...input.humanApproval,
      artifact: input.humanApproval.artifact || input.draftText,
      safetyValidation: input.humanApproval.safetyValidation || stages.safetyValidator,
      evidenceRefs,
      sourceOwners,
      freshness,
    }, warnings);
  }

  if (!approvalAllowsDelivery(stages.humanApprovalGate)) {
    blockedStages.push("APPROVED_FOR_DELIVERY_PREPARATION_REQUIRED");
  } else {
    stages.deliveryCandidate = callStage(STAGES.DELIVERY, adapters.deliveryAdapter, {
      approvedArtifact: input.draftText,
      humanApproval: stages.humanApprovalGate,
      channel: (input.delivery && input.delivery.channel) || input.channel || "whatsapp",
      recipientDestination: input.delivery && input.delivery.recipientDestination,
      evidenceRefs,
      sourceOwners,
      freshness,
    }, warnings);
  }

  let status = STATUSES.DELIVERY_CANDIDATE_PREPARED;
  let decision = DECISIONS.PREPARE_DELIVERY_CANDIDATE;

  if (blockedStages.includes("DRAFT_REQUIRED")) {
    status = STATUSES.NEEDS_DRAFT;
    decision = DECISIONS.WAIT_FOR_DRAFT;
  } else if (blockedStages.includes("HUMAN_APPROVAL_REQUIRED") ||
    blockedStages.includes("APPROVED_FOR_DELIVERY_PREPARATION_REQUIRED")) {
    status = STATUSES.NEEDS_HUMAN_APPROVAL;
    decision = DECISIONS.REQUEST_HUMAN_APPROVAL;
  } else if (!stages.deliveryCandidate || stages.deliveryCandidate.missingAdapter) {
    status = STATUSES.READY_FOR_DELIVERY_CANDIDATE;
    decision = DECISIONS.PREPARE_DELIVERY_CANDIDATE;
  }

  const output = {
    status,
    decision,
    stages,
    blockedStages: unique(blockedStages),
    warnings: unique(warnings),
    evidenceRefs,
    sourceOwners,
    freshness,
    humanApprovalRequired: true,
    deliveryCandidateOnly: true,
    sendExecutionRequiredSeparately: true,
    boundaries: [
      "Forge decides; AI explains",
      "Prompt is not draft",
      "Draft is not approved communication",
      "Safety validation is not human approval",
      "Human approval unlocks delivery preparation only",
      "Delivery candidate is not send",
      "Send Execution Gate remains separate",
      "Link generation is not message send",
    ],
    ...FALSE_FLAGS,
  };

  if (JSON.stringify(before) !== JSON.stringify(input)) {
    throw new Error("Genesis Beta Loop Orchestrator mutated input");
  }

  return output;
}

module.exports = {
  buildGenesisBetaLoopOrchestrator,
  GENESIS_BETA_LOOP_STAGES: STAGES,
  GENESIS_BETA_LOOP_STATUSES: STATUSES,
  GENESIS_BETA_LOOP_DECISIONS: DECISIONS,
};
