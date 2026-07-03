"use strict";

const uiModule = require("./alfred-review-action-packet-ui-view-model");

const buildAlfredReviewActionPacketUiViewModel = uiModule.buildAlfredReviewActionPacketUiViewModel;
const buildUiViewModelFromPacket = uiModule.buildUiViewModelFromPacket;

const BASE_SAFE_BOUNDARY = Object.freeze({
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
  createsRevenue: false,
  createsCompensation: false,
  createsPayoutTruth: false,
  audioRuntimeEnabled: false,
  speechEngineEnabled: false,
  providerRuntimeEnabled: false,
  liveSearchEnabled: false,
  domRuntimeEnabled: false,
  uiImplementationEnabled: false,
  staticPreviewOnly: true,
  rendererNeutral: true,
  requiresHumanConfirmation: true,
});

const STATIC_PREVIEW_SAFE_BOUNDARY = Object.freeze({
  ...(uiModule.UI_SAFE_BOUNDARY || BASE_SAFE_BOUNDARY),
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
  createsRevenue: false,
  createsCompensation: false,
  createsPayoutTruth: false,
  audioRuntimeEnabled: false,
  speechEngineEnabled: false,
  providerRuntimeEnabled: false,
  liveSearchEnabled: false,
  domRuntimeEnabled: false,
  uiImplementationEnabled: false,
  staticPreviewOnly: true,
  rendererNeutral: true,
  requiresHumanConfirmation: true,
});

const STATIC_PREVIEW_SLOTS = Object.freeze({
  HEADER: "header",
  STATUS_PILLS: "statusPills",
  SAFETY_BANNER: "safetyBanner",
  SECTIONS: "sections",
  ACTION_CARDS: "actionCards",
  REVIEW_CTA: "reviewCta",
  DISABLED_PROVIDER_CTAS: "disabledProviderCtas",
  RENDER_CONTRACT: "renderContract",
  VOICE_PREVIEW: "voicePreview",
});

const SLOT_ORDER = Object.freeze({
  [STATIC_PREVIEW_SLOTS.HEADER]: 10,
  [STATIC_PREVIEW_SLOTS.STATUS_PILLS]: 20,
  [STATIC_PREVIEW_SLOTS.SAFETY_BANNER]: 30,
  [STATIC_PREVIEW_SLOTS.SECTIONS]: 40,
  [STATIC_PREVIEW_SLOTS.ACTION_CARDS]: 50,
  [STATIC_PREVIEW_SLOTS.REVIEW_CTA]: 60,
  [STATIC_PREVIEW_SLOTS.DISABLED_PROVIDER_CTAS]: 70,
  [STATIC_PREVIEW_SLOTS.RENDER_CONTRACT]: 80,
  [STATIC_PREVIEW_SLOTS.VOICE_PREVIEW]: 90,
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function stableHash(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function makeSafeBoundary(extra = {}) {
  return {
    ...STATIC_PREVIEW_SAFE_BOUNDARY,
    ...extra,
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
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false,
    audioRuntimeEnabled: false,
    speechEngineEnabled: false,
    providerRuntimeEnabled: false,
    liveSearchEnabled: false,
    domRuntimeEnabled: false,
    uiImplementationEnabled: false,
    staticPreviewOnly: true,
    rendererNeutral: true,
    requiresHumanConfirmation: true,
  };
}

function collectText(value, output = []) {
  if (value === null || value === undefined) return output;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = normalizeText(value);
    if (text) output.push(text);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output));
    return output;
  }
  if (isObject(value)) {
    Object.keys(value).sort().forEach((key) => collectText(value[key], output));
  }
  return output;
}

function makeStaticSlotBinding(slotId, label, payload, options = {}) {
  const order = SLOT_ORDER[slotId] || 999;
  const safePayload = clone(payload) || {};
  const bindingId = [
    "alfred-static",
    slotId,
    stableHash({ slotId, label, safePayload }).slice(0, 12),
  ].join("-");

  return {
    bindingId,
    slotId,
    label,
    order,
    bindingType: "STATIC_PREVIEW_SLOT_BINDING",
    staticOnly: true,
    rendererNeutral: true,
    interactive: false,
    emitsEvents: false,
    mutatesState: false,
    payload: safePayload,
    uiNavigationOnly: options.uiNavigationOnly === true,
    safety: makeSafeBoundary(options.safety || {}),
  };
}

function buildLayoutSlots(previewTree) {
  return previewTree.reduce((acc, node) => {
    acc[node.slotId] = {
      bindingId: node.bindingId,
      order: node.order,
      staticOnly: true,
      rendererNeutral: true,
    };
    return acc;
  }, {});
}

function buildTextIndex(viewModel, previewTree) {
  const sourcePacket = viewModel.sourcePacket || {};
  const values = [
    viewModel.source,
    viewModel.sourcePhase,
    viewModel.sourceCommand,
    sourcePacket.packetType,
    sourcePacket.reviewSummary,
    sourcePacket.intentFamily,
    sourcePacket.routeFamily,
    previewTree,
  ];
  const seen = new Set();
  return collectText(values)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 250);
}

function buildRenderContract(viewModel) {
  const source = viewModel.renderContract || {};
  return {
    ...clone(source),
    staticPreviewOnly: true,
    rendererNeutral: true,
    mayRenderStaticPreview: true,
    mayRenderDom: false,
    mayExecuteProviderAction: false,
    mayWriteCrm: false,
    mayCreateCalendarEvent: false,
    maySendMessage: false,
    mayApproveArtifact: false,
    mayCreateTruth: false,
    mayStartAudioRuntime: false,
    mayStartSpeechEngine: false,
    mayCallLiveSearch: false,
  };
}

function buildStaticPreviewBindingFromUiViewModel(uiViewModel, options = {}) {
  if (!isObject(uiViewModel)) {
    throw new TypeError("uiViewModel must be an object");
  }

  const viewModel = clone(uiViewModel);
  const sourcePacket = viewModel.sourcePacket || {};
  const packetType = sourcePacket.packetType || viewModel.packetType || "UNKNOWN_PACKET_TYPE";
  const sourceCommand = viewModel.sourceCommand || sourcePacket.sourceCommand || sourcePacket.normalizedCommand || "plain_text";
  const sourceViewModelId = viewModel.viewModelId || viewModel.uiViewModelId || stableHash(viewModel);
  const renderContract = buildRenderContract(viewModel);
  const safety = makeSafeBoundary(viewModel.safety || viewModel.safetyBanner || {});

  const headerBinding = makeStaticSlotBinding(STATIC_PREVIEW_SLOTS.HEADER, "Command recap", {
    title: "Alfred review preview",
    sourceCommand,
    packetType,
    primaryEntity: sourcePacket.primaryEntity || null,
    intentFamily: sourcePacket.intentFamily || null,
    routeFamily: sourcePacket.routeFamily || null,
    previewOnly: true,
    reviewOnly: true,
  });

  const statusPillsBinding = makeStaticSlotBinding(STATIC_PREVIEW_SLOTS.STATUS_PILLS, "Status pills", {
    items: Array.isArray(viewModel.statusPills) ? clone(viewModel.statusPills) : [],
    previewOnly: true,
    reviewOnly: true,
  });

  const safetyBannerBinding = makeStaticSlotBinding(STATIC_PREVIEW_SLOTS.SAFETY_BANNER, "Safety banner", {
    ...(clone(viewModel.safetyBanner) || {}),
    previewOnly: true,
    reviewOnly: true,
    notApproved: true,
    notSendable: true,
  });

  const sectionsBinding = makeStaticSlotBinding(STATIC_PREVIEW_SLOTS.SECTIONS, "Review sections", {
    sections: Array.isArray(viewModel.sections) ? clone(viewModel.sections) : [],
    previewOnly: true,
    reviewOnly: true,
  });

  const actionCardsBinding = makeStaticSlotBinding(STATIC_PREVIEW_SLOTS.ACTION_CARDS, "Suggested review actions", {
    actionCards: Array.isArray(viewModel.actionCards)
      ? viewModel.actionCards.map((action) => ({
          ...clone(action),
          staticOnly: true,
          reviewOnly: true,
          previewOnly: true,
          notApproved: true,
          notSendable: true,
          executesRuntime: false,
          sendsMessage: false,
          writesCrm: false,
          createsCalendarEvent: false,
          createsTruth: false,
        }))
      : [],
    previewOnly: true,
    reviewOnly: true,
  });

  const reviewCtaBinding = makeStaticSlotBinding(STATIC_PREVIEW_SLOTS.REVIEW_CTA, "Human review CTA", {
    ...(clone(viewModel.reviewCta) || {}),
    staticOnly: true,
    uiNavigationOnly: true,
    executesRuntime: false,
    sendsMessage: false,
    writesCrm: false,
    createsCalendarEvent: false,
    createsTruth: false,
    previewOnly: true,
    reviewOnly: true,
  }, { uiNavigationOnly: true });

  const disabledProviderCtasBinding = makeStaticSlotBinding(STATIC_PREVIEW_SLOTS.DISABLED_PROVIDER_CTAS, "Disabled provider CTAs", {
    disabledProviderCtas: Array.isArray(viewModel.disabledProviderCtas)
      ? viewModel.disabledProviderCtas.map((cta) => ({
          ...clone(cta),
          disabled: true,
          staticOnly: true,
          executesRuntime: false,
          sendsMessage: false,
          writesCrm: false,
          createsCalendarEvent: false,
          createsTruth: false,
        }))
      : [],
    previewOnly: true,
    reviewOnly: true,
  });

  const renderContractBinding = makeStaticSlotBinding(STATIC_PREVIEW_SLOTS.RENDER_CONTRACT, "Render contract", {
    ...renderContract,
    previewOnly: true,
    reviewOnly: true,
  });

  const voice = sourcePacket.voice || {};
  const includeVoicePreview = packetType === "VOICE_TRANSCRIPTION_REVIEW_PACKET" || voice.transcriptionPreviewOnly === true || renderContract.mayRenderVoicePreview === true;
  const voicePreviewBinding = includeVoicePreview
    ? makeStaticSlotBinding(STATIC_PREVIEW_SLOTS.VOICE_PREVIEW, "Voice transcription preview", {
        transcriptionPreviewOnly: true,
        audioRuntimeEnabled: false,
        speechEngineEnabled: false,
        rawTranscriptPreview: sourcePacket.rawInput || viewModel.rawInput || "",
        previewOnly: true,
        reviewOnly: true,
      })
    : null;

  const previewTree = [
    headerBinding,
    statusPillsBinding,
    safetyBannerBinding,
    sectionsBinding,
    actionCardsBinding,
    reviewCtaBinding,
    disabledProviderCtasBinding,
    renderContractBinding,
  ];
  if (voicePreviewBinding) previewTree.push(voicePreviewBinding);
  previewTree.sort((left, right) => left.order - right.order);

  const previewId = [
    "alfred-static-preview",
    stableHash({ sourceViewModelId, packetType, sourceCommand, previewTree }).slice(0, 14),
  ].join("-");

  const bindings = {
    headerBinding,
    statusPillsBinding,
    safetyBannerBinding,
    sectionsBinding,
    actionCardsBinding,
    reviewCtaBinding,
    disabledProviderCtasBinding,
    renderContractBinding,
  };
  if (voicePreviewBinding) bindings.voicePreviewBinding = voicePreviewBinding;

  return {
    previewId,
    source: "ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_BINDING",
    sourcePhase: "054S_ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_BINDING_IMPLEMENTATION",
    sourceViewModelId,
    sourceViewModel: viewModel,
    sourcePacket,
    packetType,
    sourceCommand,
    finalAuthority: "HUMAN",
    staticPreview: {
      previewTree,
      layoutSlots: buildLayoutSlots(previewTree),
      textIndex: buildTextIndex(viewModel, previewTree),
      staticOnly: true,
      rendererNeutral: true,
      previewOnly: true,
      reviewOnly: true,
    },
    bindings,
    safety,
    renderContract,
    boundary: {
      noDomUiImplementation: true,
      noAudioRuntime: true,
      noSpeechEngine: true,
      noSchemas: true,
      noLiveSearch: true,
      noApprovalSendRuntimeTruthMutation: true,
    },
    options: clone(options) || {},
  };
}

function buildAlfredStaticPreviewBinding(input, options = {}) {
  let uiViewModel;
  if (options.uiViewModel) {
    uiViewModel = options.uiViewModel;
  } else if (options.packet) {
    uiViewModel = buildUiViewModelFromPacket(options.packet, options.uiOptions || {});
  } else {
    const uiOptions = clone(options.uiOptions || {});
    if (options.packetOptions) {
      uiOptions.packetOptions = clone(options.packetOptions);
    }
    uiViewModel = buildAlfredReviewActionPacketUiViewModel(input, uiOptions);
  }
  return buildStaticPreviewBindingFromUiViewModel(uiViewModel, options.bindingOptions || {});
}

module.exports = {
  STATIC_PREVIEW_SAFE_BOUNDARY,
  STATIC_PREVIEW_SLOTS,
  buildAlfredStaticPreviewBinding,
  buildStaticPreviewBindingFromUiViewModel,
  stableHash,
};
