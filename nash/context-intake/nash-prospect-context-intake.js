"use strict";

const {
  buildNashProspectContextIntakeBoundary,
  NASH_PROSPECT_CONTEXT_INTAKE_STATUS,
  _private
} = require("./nash-prospect-context-intake-boundary-contract");

const { clone, deepFreeze, noSideEffectFlags } = _private;

function buildNashProspectContextIntake(input = {}, options = {}) {
  const boundary = buildNashProspectContextIntakeBoundary(input, options);

  return deepFreeze({
    engine: "NASH_PROSPECT_CONTEXT_INTAKE",
    version: "1.0",
    status: boundary.status,
    decision: boundary.status === NASH_PROSPECT_CONTEXT_INTAKE_STATUS.SUCCESS
      ? "ACCEPT_GOVERNED_CONTEXT"
      : boundary.status === NASH_PROSPECT_CONTEXT_INTAKE_STATUS.BLOCKED_CONTEXT
        ? "BLOCK_CONTEXT"
        : "REJECT_INVALID_CONTEXT",
    prospectContextIntakeOnly: true,
    modernContextIntakePath: true,
    contextOnly: true,
    humanApprovalRequired: true,
    governedContext: clone(boundary.acceptedContext),
    evidenceReferences: clone(boundary.evidenceReferences),
    sourceOwners: clone(boundary.sourceOwners),
    freshness: clone(boundary.freshness),
    knownFacts: clone(boundary.knownFacts),
    unknownFacts: clone(boundary.unknownFacts),
    missingContext: clone(boundary.missingContext),
    blockedContext: clone(boundary.blockedContext),
    candidateInterpretations: clone(boundary.candidateInterpretations),
    safeLanguageGuardrails: clone(boundary.safeLanguageGuardrails),
    forbiddenClaims: clone(boundary.forbiddenClaims),
    errors: clone(boundary.errors),
    boundary,
    message: null,
    draft: null,
    nextBestAction: null,
    task: null,
    calendarEvent: null,
    providerResult: null,
    sideEffects: noSideEffectFlags()
  });
}

module.exports = {
  buildNashProspectContextIntake
};
