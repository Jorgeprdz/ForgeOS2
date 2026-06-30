"use strict";

const {
  buildNashManagerContextIntakeBoundary,
  NASH_MANAGER_CONTEXT_INTAKE_STATUS,
  _private
} = require("./nash-manager-context-intake-boundary-contract");

const { clone, asArray, unique } = _private;

const NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_STATUS = Object.freeze({
  READY: "READY",
  UNKNOWN: "UNKNOWN",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED"
});

const NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_DECISIONS = Object.freeze({
  READY_FOR_SAFE_LANGUAGE_CONTEXT: "READY_FOR_SAFE_LANGUAGE_CONTEXT",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED",
  UNKNOWN_CONTEXT: "UNKNOWN_CONTEXT"
});

const UNSAFE_LANGUAGE_PATTERNS = Object.freeze([
  {
    type: "PRESSURE_LANGUAGE",
    pattern: /(pressure|urgent|must|have to|obligat|apúrate|apurate|si no|no tienes opción|no tienes opcion|te vas a quedar)/i
  },
  {
    type: "SHAME_LANGUAGE",
    pattern: /(shame|ashamed|vergüenza|verguenza|debería darte pena|deberia darte pena|fracaso|flojo|irresponsable)/i
  },
  {
    type: "THREAT_LANGUAGE",
    pattern: /(threat|amenaza|castigo|punishment|punish|te saco|termina|termination|if you do not|if you don.t|si no.*entonces|si no)/i
  },
  {
    type: "MANIPULATION_LANGUAGE",
    pattern: /(manipulat|culpa|guilt|miedo|fear|aprovechar|explotar|presionar)/i
  },
  {
    type: "INVENTED_INTENT_LANGUAGE",
    pattern: /(invented intent|hidden intent|obviously|seguro.*quiere|se nota que|seguro.*no quiere)/i
  }
]);

function buildDecision(status) {
  if (status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED) {
    return NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_DECISIONS.BLOCKED;
  }
  if (status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.UNKNOWN) {
    return NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_DECISIONS.UNKNOWN_CONTEXT;
  }
  if (status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED) {
    return NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_DECISIONS.REVIEW_REQUIRED;
  }
  return NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_DECISIONS.READY_FOR_SAFE_LANGUAGE_CONTEXT;
}

function collectLanguageSamples(source, packet) {
  return unique([
    source.languageSamples,
    source.candidateLanguage,
    source.suggestedLanguage,
    source.managerLanguageToReview,
    packet.languageSamples,
    packet.candidateLanguage,
    packet.suggestedLanguage,
    packet.managerLanguageToReview
  ]);
}

function detectUnsafeLanguage(languageSamples) {
  const findings = [];

  for (const sample of asArray(languageSamples)) {
    const text = String(sample);
    for (const rule of UNSAFE_LANGUAGE_PATTERNS) {
      if (rule.pattern.test(text)) {
        findings.push({
          type: rule.type,
          sample,
          reviewContextOnly: true,
          createsPressureTruth: false,
          createsManipulationTruth: false,
          createsInventedIntentTruth: false
        });
      }
    }
  }

  return findings;
}

function buildNashManagerSafeLanguageGuardrailIntake(input = {}, options = {}) {
  const source = input && typeof input === "object" ? clone(input) : {};
  const packet = source.packet && typeof source.packet === "object" ? clone(source.packet) : clone(source);

  const boundary = buildNashManagerContextIntakeBoundary(
    { packet, requestedUse: options.requestedUse || source.requestedUse || "SAFE_LANGUAGE_CONTEXT" },
    options
  );

  const languageSamples = collectLanguageSamples(source, packet);
  const unsafeLanguageFindings = detectUnsafeLanguage(languageSamples);

  const missing = unique([
    boundary.missing,
    languageSamples.length === 0 ? ["languageSamples"] : []
  ]);

  const status =
    boundary.status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.BLOCKED
      ? NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_STATUS.BLOCKED
      : boundary.status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.UNKNOWN && languageSamples.length === 0
        ? NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_STATUS.UNKNOWN
        : unsafeLanguageFindings.length > 0 || missing.length > 0 || boundary.status === NASH_MANAGER_CONTEXT_INTAKE_STATUS.REVIEW_REQUIRED
          ? NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_STATUS.REVIEW_REQUIRED
          : NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_STATUS.READY;

  return {
    engine: "NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_INTAKE",
    version: "1.0",
    status,
    decision: buildDecision(status),
    safeLanguageContextOnly: true,
    languageSamples,
    unsafeLanguageFindings,
    unsafeLanguageFindingsAreReviewContextOnly: true,
    autoRewritesMessages: false,
    createsFinalScript: false,
    createsFinalMessage: false,
    executesNashRuntime: false,
    executesNextBestAction: false,
    sendsMessages: false,
    createsDrafts: false,
    createsTasks: false,
    createsCalendarEvents: false,
    generatesPressureLanguage: false,
    manipulatesConversation: false,
    infersInventedIntent: false,
    evidenceSources: boundary.evidenceSources,
    sourceOwners: boundary.sourceOwners,
    freshness: boundary.freshness,
    warnings: unique([
      boundary.warnings,
      unsafeLanguageFindings.length > 0 ? ["Unsafe language signals require human review."] : []
    ]),
    limitations: boundary.limitations,
    missing,
    unknown: boundary.unknown,
    stale: boundary.stale,
    defaultZeroWarnings: boundary.defaultZeroWarnings,
    blockedPeriods: boundary.blockedPeriods,
    boundary,
    truthFlags: boundary.truthFlags,
    writeFlags: boundary.writeFlags,
    actionFlags: boundary.actionFlags
  };
}

module.exports = {
  NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_STATUS,
  NASH_MANAGER_SAFE_LANGUAGE_GUARDRAIL_DECISIONS,
  UNSAFE_LANGUAGE_PATTERNS,
  buildNashManagerSafeLanguageGuardrailIntake
};
