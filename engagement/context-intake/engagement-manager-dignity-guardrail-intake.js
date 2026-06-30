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

const DIGNITY_GUARDRAIL_PATTERNS = Object.freeze([
  {
    category: "MANIPULATION",
    pattern: /\b(manipulat|exploit|use their fear|control their decision|push their emotion)\b/i
  },
  {
    category: "SHAME_MECHANICS",
    pattern: /\b(shame|embarrass|make them feel guilty|guilt trip|humiliate)\b/i
  },
  {
    category: "SCARCITY_PRESSURE",
    pattern: /\b(false urgency|scarcity|last chance|only today|limited time pressure|fear of missing out)\b/i
  },
  {
    category: "MANAGER_LEVERAGE",
    pattern: /\b(manager leverage|use your authority|pressure from manager|because I am your manager)\b/i
  },
  {
    category: "CLIENT_MANIPULATION",
    pattern: /\b(client manipulation|use the client against|make the client pressure)\b/i
  },
  {
    category: "HIDDEN_PERSONALIZATION",
    pattern: /\b(hidden personalization|secretly personalize|private data leverage|personal weakness)\b/i
  },
  {
    category: "PURPOSE_LEAKAGE",
    pattern: /\b(purpose vault|private purpose|use their purpose|deep personal why)\b/i
  },
  {
    category: "PRIVATE_INTENT_CLAIM",
    pattern: /\b(they do not care|they are lazy|they lack commitment|they secretly want|their real intention)\b/i
  },
  {
    category: "DIAGNOSIS_LANGUAGE",
    pattern: /\b(burnout diagnosis|emotional diagnosis|psychological profile|mental diagnosis)\b/i
  },
  {
    category: "PRESSURE_MECHANICS",
    pattern: /\b(pressure|force|push them hard|corner them|make them answer)\b/i
  }
]);

function extractLanguageSamples(packet) {
  const input = clonePlain(packet);
  const context =
    input.privateMotivationContext ||
    input.privateMotivationPacket ||
    input.engagementSupportContext ||
    input.engagementSupportPacket ||
    input.engagementContext ||
    input;

  return mergeUnique(
    input.languageSamples,
    input.messageSamples,
    input.communicationSamples,
    input.guardrailSamples,
    context.languageSamples,
    context.messageSamples,
    context.communicationSamples,
    context.guardrailSamples
  );
}

function scanDignityGuardrails(languageSamples) {
  const findings = [];

  for (const sample of normalizeStrings(languageSamples)) {
    for (const rule of DIGNITY_GUARDRAIL_PATTERNS) {
      if (rule.pattern.test(sample)) {
        findings.push({
          category: rule.category,
          sample,
          isReviewContextOnly: true,
          createsTruth: false,
          createsAction: false
        });
      }
    }
  }

  return findings;
}

function buildEngagementManagerDignityGuardrailIntake(packet, options = {}) {
  const input = clonePlain(packet);
  const boundary = buildEngagementManagerContextIntakeBoundary(input, options);
  const languageSamples = extractLanguageSamples(input);
  const dignityFindings = scanDignityGuardrails(languageSamples);

  const warnings = [...boundary.warnings];
  const missing = [...boundary.missing];
  const limitations = [...boundary.limitations];

  if (languageSamples.length === 0) {
    warnings.push("Missing language samples remain UNKNOWN and require dignity review.");
    missing.push("languageSamples");
  }

  if (dignityFindings.length > 0) {
    warnings.push("Potential dignity risk language is review context only and must not become action.");
    limitations.push("dignity_guardrail_review_required");
  }

  let decision = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.ALLOW;
  let status = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.READY;

  if (boundary.decision === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK) {
    decision = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.BLOCK;
    status = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.BLOCKED;
  } else if (
    boundary.decision === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW ||
    languageSamples.length === 0 ||
    dignityFindings.length > 0
  ) {
    decision = ENGAGEMENT_MANAGER_CONTEXT_INTAKE_DECISIONS.REVIEW;
    status = boundary.status === ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.UNKNOWN
      ? ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.UNKNOWN
      : ENGAGEMENT_MANAGER_CONTEXT_INTAKE_STATUSES.REVIEW_REQUIRED;
  }

  return {
    kind: "ENGAGEMENT_MANAGER_DIGNITY_GUARDRAIL_INTAKE",
    status,
    decision,
    isContextOnly: true,
    isReviewContextOnly: true,
    languageSamples,
    dignityFindings,
    evidenceSources: boundary.evidenceSources,
    sourceOwners: boundary.sourceOwners,
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
  buildEngagementManagerDignityGuardrailIntake,
  scanDignityGuardrails,
  extractLanguageSamples
};
