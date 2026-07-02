const {
  SAFE_FLAGS,
  buildAlfredReadModel,
} = require("./alfred-universal-command-memory-read-model");

const PACKET_TYPES = Object.freeze({
  MEMORY: "MEMORY_REVIEW_PACKET",
  REFERRAL: "REFERRAL_CAPTURE_REVIEW_PACKET",
  CALENDAR: "CALENDAR_EVENT_DRAFT_REVIEW_PACKET",
  PRODUCT: "PRODUCT_INTELLIGENCE_REVIEW_PACKET",
  MESSAGE: "MESSAGE_DRAFT_REVIEW_PACKET",
  FOLLOW_UP: "FOLLOW_UP_REVIEW_PACKET",
  INDEX: "UNIVERSAL_INDEX_REVIEW_PACKET",
  CHATBOT: "CHATBOT_CONTEXT_REVIEW_PACKET",
  VOICE: "VOICE_TRANSCRIPTION_REVIEW_PACKET",
});

const PACKET_TYPE_BY_INTENT = Object.freeze({
  memory_capture_prep: PACKET_TYPES.MEMORY,
  referral_capture_prep: PACKET_TYPES.REFERRAL,
  calendar_event_prep: PACKET_TYPES.CALENDAR,
  quote_prep: PACKET_TYPES.PRODUCT,
  projection_prep: PACKET_TYPES.PRODUCT,
  sales_presentation_prep: PACKET_TYPES.PRODUCT,
  proposal_prep: PACKET_TYPES.PRODUCT,
  commission_preview: PACKET_TYPES.PRODUCT,
  bonus_preview: PACKET_TYPES.PRODUCT,
  message_draft_prep: PACKET_TYPES.MESSAGE,
  follow_up_search: PACKET_TYPES.FOLLOW_UP,
  universal_index_search: PACKET_TYPES.INDEX,
  chatbot_entry: PACKET_TYPES.CHATBOT,
});

const FORBIDDEN_ACTIONS = Object.freeze([
  "approve_without_human",
  "send_message",
  "write_crm",
  "create_calendar_event",
  "create_task",
  "create_revenue_truth",
  "create_commission_truth",
  "create_payout_truth",
  "execute_audio_runtime",
  "execute_speech_engine",
  "call_live_search",
  "call_provider_runtime",
]);

const ACTION_LABELS = Object.freeze({
  prepare_memory_entry: "Prepare memory entry for human review",
  prepare_referral_record: "Prepare referral capture for human review",
  prepare_calendar_event: "Prepare calendar event draft for human review",
  prepare_message_draft: "Prepare message draft for human review",
  prepare_product_intelligence_artifact: "Prepare product intelligence artifact for human review",
  prepare_follow_up: "Prepare follow-up candidate for human review",
  search_universal_index: "Prepare universal index result for human review",
  open_review_context: "Open review context without execution",
});

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function stableHash(value) {
  const text = normalizeText(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function firstNonEmpty(values) {
  return values.find((value) => normalizeText(value).length > 0) || "";
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function derivePacketType(alfredModel, options = {}) {
  if (options.voiceTranscriptionPreview === true) {
    return PACKET_TYPES.VOICE;
  }
  return PACKET_TYPE_BY_INTENT[alfredModel.intent] || PACKET_TYPES.INDEX;
}

function derivePrimaryEntity(extracted) {
  const people = toArray(extracted.people);
  const referral = extracted.referral || {};
  return firstNonEmpty([
    referral.referralName,
    people[0],
    referral.sourceName,
  ]) || "REQUIRES_HUMAN_REVIEW";
}

function deriveRelatedEntities(extracted) {
  const people = toArray(extracted.people);
  const referral = extracted.referral || {};
  const related = [];

  for (const person of people.slice(1)) {
    related.push({ type: "person_candidate", value: person, reviewRequired: true });
  }
  if (referral.sourceName) {
    related.push({ type: "referral_source", value: referral.sourceName, reviewRequired: true });
  }
  if (referral.relationship) {
    related.push({ type: "relationship_context", value: referral.relationship, reviewRequired: true });
  }

  return related;
}

function deriveExtractedFacts(alfredModel) {
  const extracted = alfredModel.extracted || {};
  const facts = [];

  for (const person of toArray(extracted.people)) {
    facts.push({ factType: "person_candidate", value: person, reviewRequired: true });
  }
  for (const product of toArray(extracted.products)) {
    facts.push({ factType: "product_interest", value: product, reviewRequired: true });
  }

  const referral = extracted.referral || {};
  if (referral.referralName) {
    facts.push({ factType: "referral_candidate", value: referral.referralName, reviewRequired: true });
  }
  if (referral.sourceName) {
    facts.push({ factType: "referral_source", value: referral.sourceName, reviewRequired: true });
  }
  if (referral.relationship) {
    facts.push({ factType: "referral_relationship", value: referral.relationship, reviewRequired: true });
  }

  const calendar = extracted.calendar || {};
  if (calendar.day) {
    facts.push({ factType: "calendar_day_candidate", value: calendar.day, reviewRequired: true });
  }
  if (calendar.time) {
    facts.push({ factType: "calendar_time_candidate", value: calendar.time, reviewRequired: true });
  }

  for (const signal of toArray(extracted.signals)) {
    facts.push({ factType: "memory_signal", value: signal, reviewRequired: true });
  }

  if (!facts.length) {
    facts.push({ factType: "unstructured_query", value: alfredModel.query || alfredModel.rawInput, reviewRequired: true });
  }

  return facts;
}

function deriveUncertainty(alfredModel, packetType) {
  const extracted = alfredModel.extracted || {};
  const referral = extracted.referral || {};
  const calendar = extracted.calendar || {};
  const people = toArray(extracted.people);
  const products = toArray(extracted.products);
  const uncertainty = [];

  if (!people.length && packetType !== PACKET_TYPES.INDEX && packetType !== PACKET_TYPES.CHATBOT) {
    uncertainty.push("Primary person or business object requires confirmation.");
  }
  if (packetType === PACKET_TYPES.CALENDAR && !calendar.day) {
    uncertainty.push("Calendar day/date requires confirmation.");
  }
  if (packetType === PACKET_TYPES.CALENDAR && !calendar.time) {
    uncertainty.push("Calendar time requires confirmation.");
  }
  if (packetType === PACKET_TYPES.CALENDAR && calendar.day && !/\d{4}/.test(String(calendar.day))) {
    uncertainty.push("Calendar year and exact date require confirmation.");
  }
  if (packetType === PACKET_TYPES.REFERRAL && !referral.sourceName) {
    uncertainty.push("Referral source requires confirmation.");
  }
  if (packetType === PACKET_TYPES.PRODUCT && !products.length) {
    uncertainty.push("Product interest requires confirmation.");
  }
  if (packetType === PACKET_TYPES.MESSAGE) {
    uncertainty.push("Message content must be reviewed before any delivery preparation.");
  }
  if (packetType === PACKET_TYPES.VOICE) {
    uncertainty.push("Voice transcription is preview-only and must be reviewed before memory preparation.");
  }

  if (!uncertainty.length) {
    uncertainty.push("All extracted fields remain reviewable candidates, not source truth.");
  }

  return uncertainty;
}

function deriveHumanReviewQuestions(alfredModel, packetType) {
  const extracted = alfredModel.extracted || {};
  const calendar = extracted.calendar || {};
  const referral = extracted.referral || {};
  const questions = [];

  if (packetType === PACKET_TYPES.CALENDAR) {
    questions.push("Confirm the exact calendar date, time, duration, title, and attendee context.");
  }
  if (packetType === PACKET_TYPES.REFERRAL) {
    questions.push("Confirm referral name, source, relationship, and consent/context before contact preparation.");
  }
  if (packetType === PACKET_TYPES.MEMORY) {
    questions.push("Confirm that the memory summary reflects the conversation accurately.");
  }
  if (packetType === PACKET_TYPES.PRODUCT) {
    questions.push("Confirm product interest, client context, and whether a review artifact should be prepared.");
  }
  if (packetType === PACKET_TYPES.MESSAGE) {
    questions.push("Confirm tone, recipient, and content before delivery preparation.");
  }
  if (packetType === PACKET_TYPES.FOLLOW_UP) {
    questions.push("Confirm follow-up timing, channel, and objective.");
  }
  if (packetType === PACKET_TYPES.CHATBOT || packetType === PACKET_TYPES.INDEX) {
    questions.push("Confirm the intended route before opening any downstream review surface.");
  }
  if (calendar.eventCandidate && (!calendar.day || !calendar.time)) {
    questions.push("Calendar candidate is incomplete and must not become an event yet.");
  }
  if (referral.hasReferralSignal && !referral.sourceName) {
    questions.push("Referral signal exists, but source is incomplete.");
  }

  return Array.from(new Set(questions));
}

function buildProposedActions(alfredModel) {
  const actions = toArray(alfredModel.candidateActions);
  const normalizedActions = actions.length ? actions : ["open_review_context"];

  return normalizedActions.map((actionType, index) => ({
    actionId: `ALFRED_ACTION_${String(index + 1).padStart(2, "0")}`,
    actionType,
    label: ACTION_LABELS[actionType] || "Prepare review action",
    status: "PREPARED_FOR_HUMAN_REVIEW",
    executionState: "NOT_EXECUTED",
    requiresHumanConfirmation: true,
    previewOnly: true,
    reviewOnly: true,
    notApproved: true,
    notSendable: true,
    createsTruth: false,
    executesRuntime: false,
    sendsMessage: false,
    writesCrm: false,
    createsCalendarEvent: false,
    createsTask: false,
    createsRevenueTruth: false,
    createsCompensationTruth: false,
    createsPayoutTruth: false,
  }));
}

function buildReviewSummary(alfredModel, packetType, primaryEntity) {
  const command = alfredModel.command || "/Index";
  const route = packetType.replace(/_/g, " ").toLowerCase();
  const entity = primaryEntity === "REQUIRES_HUMAN_REVIEW" ? "an unresolved candidate" : primaryEntity;
  return `Alfred prepared a ${route} from ${command} for ${entity}. Human review is required before any write, send, calendar, CRM, or truth action.`;
}

function buildAlfredReviewActionPacket(input, options = {}) {
  const sourceModel = options.alfredReadModel
    ? cloneJson(options.alfredReadModel)
    : buildAlfredReadModel(input, options.alfredOptions || {});

  return buildPacketFromAlfredReadModel(sourceModel, options);
}

function buildPacketFromAlfredReadModel(alfredModel, options = {}) {
  const model = cloneJson(alfredModel);
  const extracted = model.extracted || {};
  const packetType = derivePacketType(model, options);
  const primaryEntity = derivePrimaryEntity(extracted);
  const relatedEntities = deriveRelatedEntities(extracted);
  const productInterests = toArray(extracted.products);
  const calendarCandidate = extracted.calendar || { eventCandidate: false };
  const referralCandidate = extracted.referral || {};
  const proposedActions = buildProposedActions(model);
  const uncertainty = deriveUncertainty(model, packetType);
  const humanReviewQuestions = deriveHumanReviewQuestions(model, packetType);
  const packetId = `ALFRED_REVIEW_PACKET_${stableHash([
    packetType,
    model.command,
    model.intent,
    model.rawInput,
  ].join("|"))}`;

  return {
    packetId,
    packetType,
    source: "ALFRED_REVIEW_ACTION_PACKET_READ_MODEL",
    sourcePhase: "054M_ALFRED_REVIEW_ACTION_PACKET_READ_MODEL_IMPLEMENTATION",
    sourceReadModel: model.source || "ALFRED_UNIVERSAL_COMMAND_MEMORY_READ_MODEL",
    rawInput: model.rawInput || "",
    sourceCommand: model.command || "/Index",
    normalizedCommand: model.command || "/Index",
    intentFamily: model.intent || "universal_index_search",
    routeFamily: model.family || "ALFRED_INDEX",
    primaryEntity,
    relatedEntities,
    productInterests,
    calendarCandidate: {
      ...calendarCandidate,
      reviewRequired: true,
      createsCalendarEvent: false,
    },
    referralCandidate: {
      ...referralCandidate,
      reviewRequired: true,
      writesCrm: false,
    },
    messageDraftCandidate: {
      rawText: packetType === PACKET_TYPES.MESSAGE ? model.query : "",
      reviewRequired: packetType === PACKET_TYPES.MESSAGE,
      sendsMessage: false,
      notSendable: true,
    },
    followUpCandidate: {
      reviewRequired: toArray(model.candidateActions).includes("prepare_follow_up") || packetType === PACKET_TYPES.FOLLOW_UP,
      createsTask: false,
    },
    extractedFacts: deriveExtractedFacts(model),
    uncertainty,
    reviewSummary: buildReviewSummary(model, packetType, primaryEntity),
    proposedActions,
    forbiddenActions: FORBIDDEN_ACTIONS.slice(),
    humanReviewQuestions,
    confirmationRequired: true,
    humanReview: {
      required: true,
      finalAuthority: "HUMAN",
      approvalStatus: "NOT_APPROVED",
      allowedNextStep: "HUMAN_REVIEW_ONLY",
    },
    voice: {
      voiceCaptureSupportedByContract: true,
      transcriptionPreviewOnly: true,
      audioRuntimeEnabled: false,
      speechEngineEnabled: false,
      transcriptionRequiresReview: true,
    },
    safety: {
      ...SAFE_FLAGS,
      liveSearchEnabled: false,
      providerRuntimeEnabled: false,
      memoryWriteRequiresReview: true,
      calendarCreateRequiresConfirmation: true,
      crmWriteRequiresConfirmation: true,
      sendMessageRequiresConfirmation: true,
      transcriptionPreviewOnly: true,
    },
    finalAuthority: "HUMAN",
  };
}

module.exports = {
  PACKET_TYPES,
  FORBIDDEN_ACTIONS,
  buildAlfredReviewActionPacket,
  buildPacketFromAlfredReadModel,
  derivePacketType,
};
