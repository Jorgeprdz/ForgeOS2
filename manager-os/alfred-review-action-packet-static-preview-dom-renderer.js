"use strict";

const crypto = require("crypto");

const {
  buildDomSurfaceBindingFromSurfaceBinding,
  DOM_TARGETS,
} = require("./alfred-review-action-packet-static-preview-dom-surface-binding");

const DOM_RENDERER_TARGETS = Object.freeze({
  FORGE_ALIVE_STATIC_PREVIEW_DOM_RENDERER: "FORGE_ALIVE_STATIC_PREVIEW_DOM_RENDERER",
});

const DOM_RENDERER_MODES = Object.freeze({
  INERT_STATIC_RENDER_PLAN: "INERT_STATIC_RENDER_PLAN",
});

const DOM_RENDERER_STATES = Object.freeze({
  PREVIEW_READY: "PREVIEW_READY",
  REVIEW_ONLY: "REVIEW_ONLY",
  VOICE_PREVIEW_ONLY: "VOICE_PREVIEW_ONLY",
  BLOCKED_PROVIDER_ACTION: "BLOCKED_PROVIDER_ACTION",
  RENDER_LOCKED: "RENDER_LOCKED",
});

const DOM_RENDERER_SAFE_BOUNDARY = Object.freeze({
  previewOnly: true,
  reviewOnly: true,
  notApproved: true,
  notSendable: true,
  staticPreviewOnly: true,
  inertRendererOnly: true,
  rendererMetadataOnly: true,
  createsTruth: false,
  executesRuntime: false,
  sendsMessage: false,
  writesCrm: false,
  createsCalendarEvent: false,
  createsTask: false,
  createsRevenueTruth: false,
  createsCompensationTruth: false,
  createsPayoutTruth: false,
  audioRuntimeEnabled: false,
  speechEngineEnabled: false,
  providerRuntimeEnabled: false,
  liveSearchEnabled: false,
  eventListenersEnabled: false,
  browserStorageEnabled: false,
  networkCallsAllowed: false,
  realDomMutationAllowed: false,
  htmlCssJsMutationAllowed: false,
  mayExecuteProviderAction: false,
  mayWriteCrm: false,
  mayCreateCalendarEvent: false,
  mayCreateTask: false,
  maySendMessage: false,
  mayApproveArtifact: false,
  mayCreateTruth: false,
  mayStartAudioRuntime: false,
  mayStartSpeechEngine: false,
  mayCallLiveSearch: false,
  mayRegisterEventListener: false,
  mayUseBrowserStorage: false,
  mayCallNetwork: false,
  mayMutateRealDom: false,
});

function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArrayFromMap(value) {
  if (Array.isArray(value)) return value;
  return Object.values(asRecord(value));
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function safeBoundary(extra = {}) {
  return Object.freeze({ ...DOM_RENDERER_SAFE_BOUNDARY, ...extra });
}

function escapeText(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeRendererTarget(value) {
  if (value && Object.values(DOM_RENDERER_TARGETS).includes(value)) return value;
  return DOM_RENDERER_TARGETS.FORGE_ALIVE_STATIC_PREVIEW_DOM_RENDERER;
}

function normalizeRendererMode(value) {
  if (value && Object.values(DOM_RENDERER_MODES).includes(value)) return value;
  return DOM_RENDERER_MODES.INERT_STATIC_RENDER_PLAN;
}

function resolveRendererState(domSurfaceBinding) {
  const state = firstString(domSurfaceBinding.domState, domSurfaceBinding.rendererState);
  if (/VOICE/i.test(state)) return DOM_RENDERER_STATES.VOICE_PREVIEW_ONLY;
  if (/BLOCKED/i.test(state)) return DOM_RENDERER_STATES.BLOCKED_PROVIDER_ACTION;
  if (/LOCKED/i.test(state)) return DOM_RENDERER_STATES.RENDER_LOCKED;
  if (/REVIEW/i.test(state)) return DOM_RENDERER_STATES.REVIEW_ONLY;
  return DOM_RENDERER_STATES.PREVIEW_READY;
}

function buildRenderRegions(domSurfaceBinding) {
  return asArrayFromMap(domSurfaceBinding.domRegionMap)
    .map((region, index) => {
      const id = firstString(region.renderRegionId, region.domRegionId, region.regionId, `render-region-${index + 1}`);
      return {
        renderRegionId: id,
        sourceDomRegionId: firstString(region.domRegionId, region.regionId, id),
        sourceRegionId: firstString(region.sourceRegionId, region.regionId, id),
        label: firstString(region.label, region.title, id),
        classToken: firstString(region.classToken, region.className, "alfred-render-region"),
        role: firstString(region.role, "region"),
        order: Number.isFinite(region.order) ? region.order : index + 1,
        safety: safeBoundary(),
      };
    })
    .sort((a, b) => a.order - b.order);
}

function buildRenderSlots(domSurfaceBinding, renderRegions) {
  const regionBySource = new Map();
  for (const region of renderRegions) {
    regionBySource.set(region.sourceDomRegionId, region.renderRegionId);
    regionBySource.set(region.sourceRegionId, region.renderRegionId);
  }

  return asArrayFromMap(domSurfaceBinding.domSlotMap)
    .map((slot, index) => {
      const sourceDomRegionId = firstString(slot.domRegionId, slot.regionId, slot.sourceRegionId);
      const renderRegionId = regionBySource.get(sourceDomRegionId) || renderRegions[0]?.renderRegionId || "render-region-1";
      const id = firstString(slot.renderSlotId, slot.domSlotId, slot.slotId, `render-slot-${index + 1}`);
      return {
        renderSlotId: id,
        renderRegionId,
        sourceDomSlotId: firstString(slot.domSlotId, slot.slotId, id),
        sourceSlotId: firstString(slot.sourceSlotId, slot.slotId, id),
        order: Number.isFinite(slot.order) ? slot.order : index + 1,
        slotType: firstString(slot.slotType, slot.type, "static_preview_slot"),
        classToken: firstString(slot.classToken, slot.className, "alfred-render-slot"),
        textKeys: Array.isArray(slot.textKeys) ? slot.textKeys.slice() : [],
        disabled: slot.disabled !== false,
        safety: safeBoundary({ slotPreviewOnly: true }),
      };
    })
    .sort((a, b) => a.order - b.order);
}

function buildRenderText(domSurfaceBinding) {
  const textMap = asRecord(domSurfaceBinding.domTextMap);
  const entries = Object.entries(textMap);
  if (!entries.length) {
    return {
      searchablePreviewOnly: true,
      liveSearchEnabled: false,
      textItems: [],
      safety: safeBoundary({ searchablePreviewOnly: true }),
    };
  }

  return {
    searchablePreviewOnly: true,
    liveSearchEnabled: false,
    textItems: entries.map(([key, value], index) => ({
      textKey: key,
      value: typeof value === "string" ? value : JSON.stringify(value),
      escapedValue: escapeText(typeof value === "string" ? value : JSON.stringify(value)),
      order: index + 1,
    })),
    safety: safeBoundary({ searchablePreviewOnly: true }),
  };
}

function buildRenderClassMap(domSurfaceBinding, renderRegions, renderSlots) {
  const contract = asRecord(domSurfaceBinding.domClassContract);
  const tokens = [
    ...renderRegions.map((region) => region.classToken),
    ...renderSlots.map((slot) => slot.classToken),
    ...asArrayFromMap(contract.allowedClassTokens),
  ].filter(Boolean);

  return {
    classMapPreviewOnly: true,
    mutatesCss: false,
    allowedClassTokens: Array.from(new Set(tokens)),
    sourceClassContract: contract,
    safety: safeBoundary({ mutatesCss: false }),
  };
}

function buildRenderA11yMap(domSurfaceBinding) {
  return {
    staticAccessibilityPreviewOnly: true,
    keyboardNavigationPreviewOnly: true,
    sourceA11yContract: asRecord(domSurfaceBinding.domA11yContract),
    safety: safeBoundary({ keyboardNavigationPreviewOnly: true }),
  };
}

function buildRenderEventBoundary(domSurfaceBinding) {
  return {
    ...asRecord(domSurfaceBinding.domEventBoundary),
    eventListenersEnabled: false,
    browserStorageEnabled: false,
    networkCallsAllowed: false,
    executesRuntime: false,
    mayRegisterEventListener: false,
    mayUseBrowserStorage: false,
    mayCallNetwork: false,
    mayMutateRealDom: false,
    safety: safeBoundary(),
  };
}

function buildDisabledActionPlan(domSurfaceBinding) {
  const actions = asArrayFromMap(domSurfaceBinding.domDisabledActionMap);
  return {
    disabledActionPlanPreviewOnly: true,
    actions: actions.map((action, index) => ({
      actionId: firstString(action.actionId, action.id, `disabled-action-${index + 1}`),
      label: firstString(action.label, action.title, "Disabled provider action"),
      reason: firstString(action.reason, action.status, "review_required"),
      disabled: true,
      executesRuntime: false,
      sendsMessage: false,
      writesCrm: false,
      createsCalendarEvent: false,
      createsTask: false,
      createsTruth: false,
      mayExecuteProviderAction: false,
    })),
    safety: safeBoundary(),
  };
}

function buildReviewNavigationPlan(domSurfaceBinding) {
  return {
    localNavigationPreviewOnly: true,
    sourceReviewNavigationMap: asRecord(domSurfaceBinding.domReviewNavigationMap),
    executesRuntime: false,
    mayApproveArtifact: false,
    createsTruth: false,
    safety: safeBoundary(),
  };
}

function buildVoicePreviewPlan(domSurfaceBinding) {
  return {
    transcriptionPreviewOnly: true,
    sourceVoicePreviewMap: asRecord(domSurfaceBinding.domVoicePreviewMap),
    audioRuntimeEnabled: false,
    speechEngineEnabled: false,
    mayStartAudioRuntime: false,
    mayStartSpeechEngine: false,
    safety: safeBoundary({ transcriptionPreviewOnly: true }),
  };
}

function buildResponsivePlan(domSurfaceBinding) {
  return {
    responsivePlanPreviewOnly: true,
    sourceResponsiveContract: asRecord(domSurfaceBinding.domResponsiveContract),
    targets: ["mobile-portrait", "tablet-landscape", "desktop-landscape"],
    mutatesCss: false,
    safety: safeBoundary({ mutatesCss: false }),
  };
}

function buildVirtualDomPreviewTree(renderRegions, renderSlots, renderText) {
  const slotsByRegion = new Map();
  for (const slot of renderSlots) {
    const list = slotsByRegion.get(slot.renderRegionId) || [];
    list.push(slot);
    slotsByRegion.set(slot.renderRegionId, list);
  }

  const textItems = renderText.textItems || [];
  return {
    nodeType: "static-root",
    inert: true,
    mutatesRealDom: false,
    children: renderRegions.map((region) => ({
      nodeType: "static-region",
      key: region.renderRegionId,
      role: region.role,
      classToken: region.classToken,
      children: (slotsByRegion.get(region.renderRegionId) || []).map((slot) => ({
        nodeType: "static-slot",
        key: slot.renderSlotId,
        classToken: slot.classToken,
        disabled: true,
        text: textItems
          .filter((item) => !slot.textKeys.length || slot.textKeys.includes(item.textKey))
          .map((item) => item.value),
      })),
    })),
  };
}

function buildSanitizedStaticMarkupPreview(rendererTarget, virtualTree) {
  const regionMarkup = (virtualTree.children || [])
    .map((region) => {
      const slotMarkup = (region.children || [])
        .map((slot) => {
          const text = (slot.text || []).map(escapeText).join(" ");
          return `<article data-static-slot="${escapeText(slot.key)}" aria-disabled="true">${text}</article>`;
        })
        .join("");
      return `<section data-static-region="${escapeText(region.key)}" role="${escapeText(region.role)}">${slotMarkup}</section>`;
    })
    .join("");

  return `<div data-static-renderer="${escapeText(rendererTarget)}" data-inert-preview="true">${regionMarkup}</div>`;
}

function buildRenderPlan(rendererTarget, rendererMode, rendererState, renderRegions, renderSlots) {
  return {
    rendererTarget,
    rendererMode,
    rendererState,
    staticPlanOnly: true,
    renderRegionCount: renderRegions.length,
    renderSlotCount: renderSlots.length,
    noRealDomMount: true,
    noEventListeners: true,
    noBrowserStorage: true,
    noNetworkCalls: true,
    safety: safeBoundary(),
  };
}

function buildMountInstructions(rendererTarget) {
  return {
    mountPreviewOnly: true,
    rendererTarget,
    mountSelector: null,
    mayMountIntoRealDom: false,
    mayMutateRealDom: false,
    eventListenersEnabled: false,
    browserStorageEnabled: false,
    networkCallsAllowed: false,
    instructions: [
      "Do not mount automatically.",
      "Do not register event listeners.",
      "Do not write browser storage.",
      "Do not call provider, network, audio, or speech runtime.",
    ],
    safety: safeBoundary(),
  };
}

function buildOutputContract(domSurfaceBinding, virtualTree, markup) {
  return {
    outputPreviewOnly: true,
    sourceDomSurfaceBindingId: domSurfaceBinding.domSurfaceBindingId || null,
    inertObjectTreeOnly: true,
    inertMarkupStringOnly: true,
    sanitizedStaticMarkupPreviewLength: markup.length,
    virtualDomPreviewTreeNodeCount: countTreeNodes(virtualTree),
    createsTruth: false,
    executesRuntime: false,
    networkCallsAllowed: false,
    safety: safeBoundary(),
  };
}

function countTreeNodes(node) {
  if (!node || typeof node !== "object") return 0;
  return 1 + (Array.isArray(node.children) ? node.children.reduce((sum, child) => sum + countTreeNodes(child), 0) : 0);
}

function buildStaticPreviewDomIntegrationBoundary(domSurfaceBinding) {
  return {
    ...asRecord(domSurfaceBinding.staticPreviewIntegrationBoundary),
    staticPreviewDomIntegrationBoundary: true,
    integrationPreviewOnly: true,
    mayMutateHtml: false,
    mayMutateCss: false,
    mayMutateJavaScript: false,
    mayMutateRealDom: false,
    eventListenersEnabled: false,
    browserStorageEnabled: false,
    networkCallsAllowed: false,
    safety: safeBoundary(),
  };
}

function buildDomRendererFromDomSurfaceBinding(domSurfaceBinding, options = {}) {
  const source = domSurfaceBinding && domSurfaceBinding.domSurfaceBindingId
    ? domSurfaceBinding
    : buildDomSurfaceBindingFromSurfaceBinding(domSurfaceBinding || {}, {
        domTarget: DOM_TARGETS.FORGE_ALIVE_STATIC_PREVIEW_DOM_SURFACE,
      });

  const rendererTarget = normalizeRendererTarget(options.rendererTarget);
  const rendererMode = normalizeRendererMode(options.rendererMode);
  const rendererState = resolveRendererState(source);
  const renderRegions = buildRenderRegions(source);
  const renderSlots = buildRenderSlots(source, renderRegions);
  const renderText = buildRenderText(source);
  const renderClassMap = buildRenderClassMap(source, renderRegions, renderSlots);
  const renderA11yMap = buildRenderA11yMap(source);
  const renderEventBoundary = buildRenderEventBoundary(source);
  const renderDisabledActionPlan = buildDisabledActionPlan(source);
  const renderReviewNavigationPlan = buildReviewNavigationPlan(source);
  const renderVoicePreviewPlan = buildVoicePreviewPlan(source);
  const renderResponsivePlan = buildResponsivePlan(source);
  const virtualDomPreviewTree = buildVirtualDomPreviewTree(renderRegions, renderSlots, renderText);
  const sanitizedStaticMarkupPreview = buildSanitizedStaticMarkupPreview(rendererTarget, virtualDomPreviewTree);
  const sourceDomSurfaceBindingId = source.domSurfaceBindingId || stableHash(source);
  const sourceSurfaceBindingId = source.sourceSurfaceBindingId || null;
  const domRendererId = [
    "ALFRED_STATIC_PREVIEW_DOM_RENDERER",
    stableHash({ sourceDomSurfaceBindingId, rendererTarget, rendererMode, virtualDomPreviewTree }).slice(0, 14),
  ].join("_");

  return {
    domRendererId,
    source: "ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_DOM_RENDERER",
    sourcePhase: "055B_ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_DOM_RENDERER_IMPLEMENTATION",
    sourceDomSurfaceBindingId,
    sourceSurfaceBindingId,
    rendererTarget,
    rendererMode,
    rendererState,
    renderPlan: buildRenderPlan(rendererTarget, rendererMode, rendererState, renderRegions, renderSlots),
    renderRegions,
    renderSlots,
    renderText,
    renderClassMap,
    renderA11yMap,
    renderEventBoundary,
    renderDisabledActionPlan,
    renderReviewNavigationPlan,
    renderVoicePreviewPlan,
    renderResponsivePlan,
    renderOutputContract: buildOutputContract(source, virtualDomPreviewTree, sanitizedStaticMarkupPreview),
    virtualDomPreviewTree,
    sanitizedStaticMarkupPreview,
    mountInstructions: buildMountInstructions(rendererTarget),
    staticPreviewDomIntegrationBoundary: buildStaticPreviewDomIntegrationBoundary(source),
    safety: safeBoundary(),
  };
}

module.exports = {
  DOM_RENDERER_SAFE_BOUNDARY,
  DOM_RENDERER_TARGETS,
  DOM_RENDERER_MODES,
  DOM_RENDERER_STATES,
  buildDomRendererFromDomSurfaceBinding,
  buildRenderRegions,
  buildRenderSlots,
  buildRenderText,
};
