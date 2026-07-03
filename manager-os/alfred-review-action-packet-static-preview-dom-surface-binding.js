"use strict";

const surfaceModule = require("./alfred-review-action-packet-static-preview-surface-binding");

const SURFACE_SAFE_BOUNDARY = surfaceModule.SURFACE_SAFE_BOUNDARY || {};
const SURFACE_TARGETS = surfaceModule.SURFACE_TARGETS || {};
const SURFACE_STATES = surfaceModule.SURFACE_STATES || {};
const SURFACE_REGIONS = surfaceModule.SURFACE_REGIONS || {};
const buildAlfredStaticPreviewSurfaceBinding = surfaceModule.buildAlfredStaticPreviewSurfaceBinding;
const buildSurfaceBindingFromStaticPreviewBinding = surfaceModule.buildSurfaceBindingFromStaticPreviewBinding;
const surfaceStableHash = surfaceModule.stableHash;

const BASE_DOM_SURFACE_SAFE_BOUNDARY = Object.freeze({
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
  htmlCssJsMutationAllowed: false,
  htmlMutationAllowed: false,
  cssMutationAllowed: false,
  jsMutationAllowed: false,
  eventListenersEnabled: false,
  eventListenersAllowed: false,
  browserStorageEnabled: false,
  browserStorageAllowed: false,
  networkCallsAllowed: false,
  providerCallsAllowed: false,
  approvalCallsAllowed: false,
  sendCallsAllowed: false,
  calendarCreateAllowed: false,
  crmWriteAllowed: false,
  truthMutationAllowed: false,
  localApiEnabled: false,
  domImplementationAllowed: false,
  domSurfaceBindingOnly: true,
  browserFacingMetadataOnly: true,
  staticPreviewOnly: true,
  surfaceBindingOnly: true,
  rendererNeutral: true,
  requiresHumanConfirmation: true,
});

const DOM_SURFACE_SAFE_BOUNDARY = Object.freeze({
  ...SURFACE_SAFE_BOUNDARY,
  ...BASE_DOM_SURFACE_SAFE_BOUNDARY,
});

const DOM_TARGETS = Object.freeze({
  FORGE_ALIVE_STATIC_PREVIEW_DOM_SURFACE: "FORGE_ALIVE_STATIC_PREVIEW_DOM_SURFACE",
  ALFRED_COMMAND_COCKPIT_DOM_SURFACE: "ALFRED_COMMAND_COCKPIT_DOM_SURFACE",
  ALFRED_REVIEW_PANEL_DOM_SURFACE: "ALFRED_REVIEW_PANEL_DOM_SURFACE",
  ALFRED_MOBILE_BOTTOM_SHEET_DOM_SURFACE: "ALFRED_MOBILE_BOTTOM_SHEET_DOM_SURFACE",
  ALFRED_VOICE_PREVIEW_DOM_SURFACE: "ALFRED_VOICE_PREVIEW_DOM_SURFACE",
});

const DOM_STATES = Object.freeze({
  IDLE: "DOM_SURFACE_IDLE",
  PREVIEW_READY: "DOM_SURFACE_PREVIEW_READY",
  NEEDS_CLARIFICATION: "DOM_SURFACE_NEEDS_CLARIFICATION",
  REVIEW_ONLY: "DOM_SURFACE_REVIEW_ONLY",
  BLOCKED_PROVIDER_ACTION: "DOM_SURFACE_BLOCKED_PROVIDER_ACTION",
  VOICE_PREVIEW_ONLY: "DOM_SURFACE_VOICE_PREVIEW_ONLY",
  RENDER_LOCKED: "DOM_SURFACE_RENDER_LOCKED",
});

const DOM_REGIONS = Object.freeze({
  HEADER: "dom.alfred.header",
  STATUS_PILLS: "dom.alfred.statusPills",
  SAFETY_BANNER: "dom.alfred.safetyBanner",
  SECTIONS: "dom.alfred.sections",
  ACTION_CARDS: "dom.alfred.actionCards",
  REVIEW_CTA: "dom.alfred.reviewCta",
  DISABLED_PROVIDER_CTAS: "dom.alfred.disabledProviderCtas",
  VOICE_PREVIEW: "dom.alfred.voicePreview",
  RENDER_BOUNDARY: "dom.alfred.renderBoundary",
});

const SURFACE_TO_DOM_REGION = Object.freeze({
  [SURFACE_REGIONS.HEADER || "surface.header"]: DOM_REGIONS.HEADER,
  [SURFACE_REGIONS.STATUS || "surface.status"]: DOM_REGIONS.STATUS_PILLS,
  [SURFACE_REGIONS.SAFETY || "surface.safety"]: DOM_REGIONS.SAFETY_BANNER,
  [SURFACE_REGIONS.BODY || "surface.body"]: DOM_REGIONS.SECTIONS,
  [SURFACE_REGIONS.ACTIONS || "surface.actions"]: DOM_REGIONS.ACTION_CARDS,
  [SURFACE_REGIONS.REVIEW || "surface.review"]: DOM_REGIONS.REVIEW_CTA,
  [SURFACE_REGIONS.DISABLED_PROVIDERS || "surface.disabledProviders"]: DOM_REGIONS.DISABLED_PROVIDER_CTAS,
  [SURFACE_REGIONS.VOICE || "surface.voice"]: DOM_REGIONS.VOICE_PREVIEW,
  [SURFACE_REGIONS.RENDER_BOUNDARY || "surface.renderBoundary"]: DOM_REGIONS.RENDER_BOUNDARY,
});

const DOM_REGION_CLASS_TOKENS = Object.freeze({
  [DOM_REGIONS.HEADER]: "alfred-preview-region-header",
  [DOM_REGIONS.STATUS_PILLS]: "alfred-preview-region-status-pills",
  [DOM_REGIONS.SAFETY_BANNER]: "alfred-preview-region-safety-banner",
  [DOM_REGIONS.SECTIONS]: "alfred-preview-region-sections",
  [DOM_REGIONS.ACTION_CARDS]: "alfred-preview-region-action-cards",
  [DOM_REGIONS.REVIEW_CTA]: "alfred-preview-region-review-cta",
  [DOM_REGIONS.DISABLED_PROVIDER_CTAS]: "alfred-preview-region-disabled-provider-ctas",
  [DOM_REGIONS.VOICE_PREVIEW]: "alfred-preview-region-voice-preview",
  [DOM_REGIONS.RENDER_BOUNDARY]: "alfred-preview-region-render-boundary",
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function stableHash(value) {
  if (typeof surfaceStableHash === "function") return surfaceStableHash(value);
  const text = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function makeSafeBoundary(extra = {}) {
  return {
    ...DOM_SURFACE_SAFE_BOUNDARY,
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
    htmlCssJsMutationAllowed: false,
    htmlMutationAllowed: false,
    cssMutationAllowed: false,
    jsMutationAllowed: false,
    eventListenersEnabled: false,
    eventListenersAllowed: false,
    browserStorageEnabled: false,
    browserStorageAllowed: false,
    networkCallsAllowed: false,
    providerCallsAllowed: false,
    approvalCallsAllowed: false,
    sendCallsAllowed: false,
    calendarCreateAllowed: false,
    crmWriteAllowed: false,
    truthMutationAllowed: false,
    localApiEnabled: false,
    domImplementationAllowed: false,
    domSurfaceBindingOnly: true,
    browserFacingMetadataOnly: true,
    staticPreviewOnly: true,
    surfaceBindingOnly: true,
    rendererNeutral: true,
    requiresHumanConfirmation: true,
  };
}

function normalizeDomTarget(value) {
  if (value && Object.values(DOM_TARGETS).includes(value)) return value;
  return DOM_TARGETS.FORGE_ALIVE_STATIC_PREVIEW_DOM_SURFACE;
}

function resolveDomState(surfaceBinding) {
  const state = surfaceBinding.surfaceState;
  if (state === SURFACE_STATES.VOICE_PREVIEW_ONLY) return DOM_STATES.VOICE_PREVIEW_ONLY;
  if (state === SURFACE_STATES.NEEDS_CLARIFICATION) return DOM_STATES.NEEDS_CLARIFICATION;
  if (state === SURFACE_STATES.BLOCKED_PROVIDER_ACTION) return DOM_STATES.BLOCKED_PROVIDER_ACTION;
  if (state === SURFACE_STATES.RENDER_LOCKED) return DOM_STATES.RENDER_LOCKED;
  if (state === SURFACE_STATES.IDLE) return DOM_STATES.IDLE;
  if (state === SURFACE_STATES.REVIEW_ONLY) return DOM_STATES.REVIEW_ONLY;
  return DOM_STATES.PREVIEW_READY;
}

function getRegionLabel(domRegionId) {
  return String(domRegionId || "dom.alfred.region")
    .replace("dom.alfred.", "Alfred ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function buildDomRegionMap(surfaceBinding) {
  const sourceRegions = surfaceBinding.surfaceRegions || {};
  const entries = Object.keys(sourceRegions).map((key) => sourceRegions[key]).filter(isObject);
  return entries
    .sort((left, right) => (left.order || 999) - (right.order || 999))
    .reduce((acc, region) => {
      const domRegionId = SURFACE_TO_DOM_REGION[region.regionId] || `dom.alfred.${String(region.regionId || "unknown").replace(/[^a-zA-Z0-9]+/g, "-")}`;
      const mapKey = domRegionId.replace("dom.alfred.", "").replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
      acc[mapKey] = {
        domRegionId,
        sourceRegionId: region.regionId || null,
        sourceSurfaceRegionBindingId: region.bindingId || null,
        sourceSlotBindingId: region.sourceSlotBindingId || null,
        sourceSlotId: region.sourceSlotId || null,
        order: region.order || 999,
        visible: region.visible !== false,
        classToken: DOM_REGION_CLASS_TOKENS[domRegionId] || "alfred-preview-region-generic",
        ariaRole: "region",
        ariaLabel: getRegionLabel(domRegionId),
        staticContentOnly: true,
        browserFacingMetadataOnly: true,
        mayRenderStaticContent: true,
        mayRenderDom: false,
        mayMutateDom: false,
        mayAttachEventListeners: false,
        eventListenersAllowed: false,
        htmlMutationAllowed: false,
        cssMutationAllowed: false,
        jsMutationAllowed: false,
        executesRuntime: false,
        createsTruth: false,
        payload: clone(region.payload || {}),
        safety: makeSafeBoundary(region.safety || {}),
      };
      return acc;
    }, {});
}

function findDomRegionBySurfaceRegion(domRegionMap, sourceRegionId) {
  return Object.values(domRegionMap).find((item) => item.sourceRegionId === sourceRegionId) || null;
}

function buildDomSlotMap(surfaceBinding, domRegionMap) {
  const slots = Array.isArray(surfaceBinding.slotBindings) ? surfaceBinding.slotBindings : [];
  return slots
    .slice()
    .sort((left, right) => (left.order || 999) - (right.order || 999))
    .map((slot) => {
      const domRegion = findDomRegionBySurfaceRegion(domRegionMap, slot.regionId);
      return {
        slotId: slot.sourceSlotId || slot.regionId || null,
        sourceRegionId: slot.regionId || null,
        sourceSurfaceRegionBindingId: slot.surfaceRegionBindingId || null,
        sourceSlotBindingId: slot.sourceSlotBindingId || null,
        domRegionId: domRegion ? domRegion.domRegionId : null,
        order: slot.order || 999,
        visible: domRegion ? domRegion.visible !== false : true,
        staticContentOnly: true,
        browserFacingMetadataOnly: true,
        eventListenersAllowed: false,
        htmlMutationAllowed: false,
        cssMutationAllowed: false,
        jsMutationAllowed: false,
        executesRuntime: false,
        createsTruth: false,
        safety: makeSafeBoundary(slot.safety || {}),
      };
    });
}

function buildDomTextMap(surfaceBinding) {
  const source = surfaceBinding.textIndexBinding || {};
  const items = Array.isArray(source.items) ? clone(source.items) : [];
  return {
    sourceTextIndexBindingId: source.bindingId || null,
    itemCount: items.length,
    items,
    searchablePreviewOnly: true,
    browserFacingMetadataOnly: true,
    liveSearchEnabled: false,
    providerRuntimeEnabled: false,
    executesRuntime: false,
    networkCallsAllowed: false,
    providerCallsAllowed: false,
    safety: makeSafeBoundary(),
  };
}

function buildDomClassContract(domTarget, domRegionMap) {
  return {
    domTarget,
    rootClass: "alfred-static-preview-dom-surface",
    regionClassPrefix: "alfred-preview-region-",
    allowedClassTokens: Object.values(domRegionMap).map((region) => region.classToken).filter(Boolean),
    classMutationAllowed: false,
    inlineStyleMutationAllowed: false,
    htmlMutationAllowed: false,
    cssMutationAllowed: false,
    jsMutationAllowed: false,
    staticClassMetadataOnly: true,
    safety: makeSafeBoundary(),
  };
}

function buildDomA11yContract(surfaceBinding) {
  return {
    ariaRole: "region",
    ariaLabel: "Alfred static review preview",
    ariaLiveMode: surfaceBinding.surfaceState === SURFACE_STATES.VOICE_PREVIEW_ONLY ? "polite" : "off",
    keyboardNavigationPreviewOnly: true,
    focusManagementAllowed: false,
    focusTrapAllowed: false,
    mayMoveFocus: false,
    mayAttachKeyboardHandlers: false,
    eventListenersAllowed: false,
    browserFacingMetadataOnly: true,
    safety: makeSafeBoundary({ keyboardNavigationPreviewOnly: true }),
  };
}

function buildDomEventBoundary() {
  return {
    domImplementationAllowed: false,
    htmlMutationAllowed: false,
    cssMutationAllowed: false,
    jsMutationAllowed: false,
    eventListenersAllowed: false,
    browserStorageAllowed: false,
    networkCallsAllowed: false,
    providerCallsAllowed: false,
    approvalCallsAllowed: false,
    sendCallsAllowed: false,
    calendarCreateAllowed: false,
    crmWriteAllowed: false,
    truthMutationAllowed: false,
    audioRuntimeEnabled: false,
    speechEngineEnabled: false,
    liveSearchEnabled: false,
    mayStartAudioRuntime: false,
    mayStartSpeechEngine: false,
    mayCallLiveSearch: false,
    safety: makeSafeBoundary(),
  };
}

function buildDomDisabledActionMap(surfaceBinding) {
  const source = surfaceBinding.disabledActionPolicy || {};
  const disabledProviderCtas = Array.isArray(source.disabledProviderCtas) ? source.disabledProviderCtas : [];
  const disabledActionCards = Array.isArray(source.disabledActionCards) ? source.disabledActionCards : [];
  const mapDisabled = (item) => ({
    ...clone(item),
    disabled: true,
    clickable: false,
    staticContentOnly: true,
    browserFacingMetadataOnly: true,
    eventListenersAllowed: false,
    providerCallsAllowed: false,
    sendCallsAllowed: false,
    calendarCreateAllowed: false,
    crmWriteAllowed: false,
    truthMutationAllowed: false,
    executesRuntime: false,
    sendsMessage: false,
    writesCrm: false,
    createsCalendarEvent: false,
    createsTask: false,
    createsTruth: false,
    mayExecuteProviderAction: false,
    maySendMessage: false,
    mayCreateCalendarEvent: false,
    mayWriteCrm: false,
    mayCreateTruth: false,
  });
  return {
    disabledProviderCtas: disabledProviderCtas.map(mapDisabled),
    disabledActionCards: disabledActionCards.map(mapDisabled),
    providerActionsDisabled: true,
    sendDisabled: true,
    calendarCreateDisabled: true,
    crmWriteDisabled: true,
    approvalDisabled: true,
    audioRuntimeDisabled: true,
    speechEngineDisabled: true,
    liveSearchDisabled: true,
    browserFacingMetadataOnly: true,
    safety: makeSafeBoundary(),
  };
}

function buildDomReviewNavigationMap(surfaceBinding, domTarget) {
  const source = surfaceBinding.reviewNavigationPolicy || {};
  return {
    domTarget,
    canDescribeLocalReviewPanel: true,
    canOpenLocalReviewPanel: source.canOpenLocalReviewPanel !== false,
    uiNavigationOnly: true,
    localNavigationMetadataOnly: true,
    routeHint: source.routeHint || "alfred/review/static-preview-dom-surface",
    sourceCommand: surfaceBinding.sourceCommand || source.sourceCommand || null,
    sourcePacketType: surfaceBinding.sourcePacketType || source.sourcePacketType || null,
    requiresHumanReview: true,
    eventListenersAllowed: false,
    executesRuntime: false,
    sendsMessage: false,
    writesCrm: false,
    createsCalendarEvent: false,
    createsTruth: false,
    mayApproveArtifact: false,
    safety: makeSafeBoundary({ uiNavigationOnly: true }),
  };
}

function buildDomVoicePreviewMap(surfaceBinding) {
  const source = surfaceBinding.voiceSurfacePolicy || {};
  const visible = source.visible === true;
  return {
    visible,
    domRegionId: visible ? DOM_REGIONS.VOICE_PREVIEW : null,
    transcriptionPreviewOnly: true,
    mayDisplayTranscript: visible,
    rawTranscriptPreview: visible ? (source.rawTranscriptPreview || "") : "",
    mayRequestMicPermission: false,
    mayRecordAudio: false,
    mayStoreAudioBlob: false,
    mayInvokeSpeechEngine: false,
    mayStartAudioRuntime: false,
    mayStartSpeechEngine: false,
    audioRuntimeEnabled: false,
    speechEngineEnabled: false,
    providerRuntimeEnabled: false,
    eventListenersAllowed: false,
    browserFacingMetadataOnly: true,
    safety: makeSafeBoundary({ transcriptionPreviewOnly: true }),
  };
}

function buildDomResponsiveContract(surfaceBinding, domTarget) {
  const source = surfaceBinding.responsivePolicy || {};
  return {
    domTarget,
    allowedDomTargets: Object.values(DOM_TARGETS),
    sourceSurfaceTarget: surfaceBinding.surfaceTarget || null,
    mobileBottomSheetAllowed: source.mobileBottomSheetAllowed !== false,
    desktopSidePanelAllowed: source.desktopSidePanelAllowed !== false,
    commandCockpitAllowed: true,
    voiceTranscriptPreviewAllowed: true,
    responsiveMetadataOnly: true,
    resizeListenersAllowed: false,
    mediaQueryMutationAllowed: false,
    htmlMutationAllowed: false,
    cssMutationAllowed: false,
    jsMutationAllowed: false,
    domRuntimeEnabled: false,
    safety: makeSafeBoundary(),
  };
}

function buildDomRenderBoundary(surfaceBinding) {
  const source = surfaceBinding.renderBoundary || {};
  return {
    ...clone(source),
    staticPreviewOnly: true,
    surfaceBindingOnly: true,
    domSurfaceBindingOnly: true,
    browserFacingMetadataOnly: true,
    mayRenderStaticPreview: true,
    mayDescribeDomTarget: true,
    mayRenderDom: false,
    mayMutateDom: false,
    mayAttachEventListeners: false,
    mayUseBrowserStorage: false,
    mayCallNetwork: false,
    mayCallLocalApi: false,
    mayExecuteProviderAction: false,
    mayWriteCrm: false,
    mayCreateCalendarEvent: false,
    maySendMessage: false,
    mayApproveArtifact: false,
    mayCreateTruth: false,
    mayStartAudioRuntime: false,
    mayStartSpeechEngine: false,
    mayCallLiveSearch: false,
    htmlMutationAllowed: false,
    cssMutationAllowed: false,
    jsMutationAllowed: false,
    eventListenersAllowed: false,
    browserStorageAllowed: false,
    networkCallsAllowed: false,
    providerCallsAllowed: false,
    approvalCallsAllowed: false,
    sendCallsAllowed: false,
    calendarCreateAllowed: false,
    crmWriteAllowed: false,
    truthMutationAllowed: false,
    safety: makeSafeBoundary(),
  };
}

function buildStaticPreviewIntegrationBoundary(surfaceBinding) {
  return {
    sourceSurfaceBindingId: surfaceBinding.surfaceBindingId || null,
    requiresStaticPreviewHost: true,
    staticPreviewHostMutationAllowed: false,
    staticPreviewHtmlEditAllowed: false,
    staticPreviewCssEditAllowed: false,
    staticPreviewJavascriptEditAllowed: false,
    requiresFutureExplicitDomAdapter: true,
    preserves054FCommandCockpitBase: true,
    rejects054GLowerFillTuning: true,
    preservesAlfredReviewOnlyBoundary: true,
    noApprovalSendRuntimeTruthMutation: true,
    safety: makeSafeBoundary(),
  };
}

function buildDomSurfaceBindingFromSurfaceBinding(surfaceBinding, options = {}) {
  if (!isObject(surfaceBinding)) {
    throw new TypeError("surfaceBinding must be an object");
  }

  const surface = clone(surfaceBinding);
  const domTarget = normalizeDomTarget(options.domTarget);
  const domMountMode = options.domMountMode || "STATIC_PREVIEW_DOM_SURFACE_METADATA";
  const domState = resolveDomState(surface);
  const domRegionMap = buildDomRegionMap(surface);
  const domSlotMap = buildDomSlotMap(surface, domRegionMap);
  const sourceSurfaceBindingId = surface.surfaceBindingId || stableHash(surface);
  const sourceSurfaceTarget = surface.surfaceTarget || SURFACE_TARGETS.FORGE_ALIVE_STATIC_PREVIEW_SURFACE || "FORGE_ALIVE_STATIC_PREVIEW_SURFACE";

  const domSurfaceBindingId = [
    "alfred-dom-surface",
    stableHash({ sourceSurfaceBindingId, domTarget, domMountMode, domSlotMap }).slice(0, 14),
  ].join("-");

  const safety = makeSafeBoundary(surface.safety || {});

  return {
    domSurfaceBindingId,
    source: "ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_DOM_SURFACE_BINDING",
    sourcePhase: "054Y_ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_DOM_SURFACE_BINDING_IMPLEMENTATION",
    sourceSurfaceBindingId,
    sourceSurfaceTarget,
    sourceCommand: surface.sourceCommand || null,
    sourcePacketType: surface.sourcePacketType || null,
    domTarget,
    domMountMode,
    domState,
    domRegionMap,
    domSlotMap,
    domTextMap: buildDomTextMap(surface),
    domClassContract: buildDomClassContract(domTarget, domRegionMap),
    domA11yContract: buildDomA11yContract(surface),
    domEventBoundary: buildDomEventBoundary(),
    domDisabledActionMap: buildDomDisabledActionMap(surface),
    domReviewNavigationMap: buildDomReviewNavigationMap(surface, domTarget),
    domVoicePreviewMap: buildDomVoicePreviewMap(surface),
    domResponsiveContract: buildDomResponsiveContract(surface, domTarget),
    domRenderBoundary: buildDomRenderBoundary(surface),
    staticPreviewIntegrationBoundary: buildStaticPreviewIntegrationBoundary(surface),
    sourceSurfaceBinding: surface,
    safety,
    finalAuthority: "HUMAN",
  };
}

function buildAlfredStaticPreviewDomSurfaceBinding(input, options = {}) {
  let surfaceBinding;
  if (options.surfaceBinding) {
    surfaceBinding = options.surfaceBinding;
  } else if (options.staticPreviewBinding) {
    surfaceBinding = buildSurfaceBindingFromStaticPreviewBinding(options.staticPreviewBinding, options.surfaceOptions || {});
  } else {
    surfaceBinding = buildAlfredStaticPreviewSurfaceBinding(input, options.surfaceOptions || {});
  }
  return buildDomSurfaceBindingFromSurfaceBinding(surfaceBinding, options.domOptions || options);
}

module.exports = {
  DOM_SURFACE_SAFE_BOUNDARY,
  DOM_TARGETS,
  DOM_STATES,
  DOM_REGIONS,
  buildAlfredStaticPreviewDomSurfaceBinding,
  buildDomSurfaceBindingFromSurfaceBinding,
  stableHash,
};
