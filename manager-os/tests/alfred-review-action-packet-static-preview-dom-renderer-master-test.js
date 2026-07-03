"use strict";

const assert = require("assert");

const { buildAlfredReadModel } = require("../alfred-universal-command-memory-read-model");
const { buildPacketFromAlfredReadModel } = require("../alfred-review-action-packet-read-model");
const { buildUiViewModelFromPacket } = require("../alfred-review-action-packet-ui-view-model");
const { buildStaticPreviewBindingFromUiViewModel } = require("../alfred-review-action-packet-static-preview-binding");
const { buildSurfaceBindingFromStaticPreviewBinding } = require("../alfred-review-action-packet-static-preview-surface-binding");
const { buildDomSurfaceBindingFromSurfaceBinding } = require("../alfred-review-action-packet-static-preview-dom-surface-binding");
const {
  DOM_RENDERER_SAFE_BOUNDARY,
  DOM_RENDERER_TARGETS,
  DOM_RENDERER_MODES,
  buildDomRendererFromDomSurfaceBinding,
} = require("../alfred-review-action-packet-static-preview-dom-renderer");

let passCount = 0;
const expectedPasses = 22;

function pass(name) {
  passCount += 1;
  console.log(`PASS ${passCount} - ${name}`);
}

function buildRenderer(input, options = {}) {
  const readModel = buildAlfredReadModel(input, options.readModelOptions || {});
  const packet = buildPacketFromAlfredReadModel(readModel, options.packetOptions || {});
  const ui = buildUiViewModelFromPacket(packet, options.uiOptions || {});
  const staticPreview = buildStaticPreviewBindingFromUiViewModel(ui, options.staticPreviewOptions || {});
  const surface = buildSurfaceBindingFromStaticPreviewBinding(staticPreview, options.surfaceOptions || {});
  const domSurface = buildDomSurfaceBindingFromSurfaceBinding(surface, options.domSurfaceOptions || {});
  return {
    readModel,
    packet,
    ui,
    staticPreview,
    surface,
    domSurface,
    renderer: buildDomRendererFromDomSurfaceBinding(domSurface, options.rendererOptions || {}),
  };
}

function assertCoreSafety(renderer) {
  assert.equal(renderer.safety.previewOnly, true);
  assert.equal(renderer.safety.reviewOnly, true);
  assert.equal(renderer.safety.notApproved, true);
  assert.equal(renderer.safety.notSendable, true);
  assert.equal(renderer.safety.createsTruth, false);
  assert.equal(renderer.safety.executesRuntime, false);
  assert.equal(renderer.safety.sendsMessage, false);
  assert.equal(renderer.safety.writesCrm, false);
  assert.equal(renderer.safety.createsCalendarEvent, false);
  assert.equal(renderer.safety.createsTask, false);
  assert.equal(renderer.safety.audioRuntimeEnabled, false);
  assert.equal(renderer.safety.speechEngineEnabled, false);
  assert.equal(renderer.safety.providerRuntimeEnabled, false);
  assert.equal(renderer.safety.liveSearchEnabled, false);
  assert.equal(renderer.safety.eventListenersEnabled, false);
  assert.equal(renderer.safety.browserStorageEnabled, false);
  assert.equal(renderer.safety.networkCallsAllowed, false);
  assert.equal(renderer.safety.mayMutateRealDom, false);
}

{
  const { renderer } = buildRenderer("/Memoria Hoy vi a Juan, le interesa retiro y quiere que le hable el martes.");
  assert.equal(renderer.source, "ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_DOM_RENDERER");
  assert.equal(renderer.rendererMode, DOM_RENDERER_MODES.INERT_STATIC_RENDER_PLAN);
  assert.equal(renderer.rendererTarget, DOM_RENDERER_TARGETS.FORGE_ALIVE_STATIC_PREVIEW_DOM_RENDERER);
  assertCoreSafety(renderer);
  pass("/Memoria creates inert static DOM renderer with review boundary");
}

{
  const { renderer } = buildRenderer("/Referido Luis Perez es referido de Giovanni Islas compañero del trabajo");
  assert.equal(renderer.renderDisabledActionPlan.safety.writesCrm, false);
  assert.equal(renderer.safety.mayWriteCrm, false);
  assert.ok(renderer.renderRegions.length >= 1);
  pass("/Referido renders referral plan without CRM write");
}

{
  const { renderer } = buildRenderer("/Agenda Tengo cita con Maria el viernes a las 11");
  assert.equal(renderer.renderDisabledActionPlan.safety.createsCalendarEvent, false);
  assert.equal(renderer.safety.mayCreateCalendarEvent, false);
  pass("/Agenda renders calendar draft plan without event creation");
}

{
  const { renderer } = buildRenderer("/Crear evento con Maria el viernes a las 11");
  assert.equal(renderer.renderEventBoundary.eventListenersEnabled, false);
  assert.equal(renderer.mountInstructions.mayMountIntoRealDom, false);
  pass("/Crear evento remains inert renderer metadata only");
}

{
  const { renderer } = buildRenderer("/Cotizar Lariza y su novio retiro y Vida Mujer");
  assert.equal(renderer.safety.createsRevenueTruth, false);
  assert.equal(renderer.renderOutputContract.outputPreviewOnly, true);
  pass("/Cotizar renders product intelligence preview only");
}

{
  const { renderer } = buildRenderer("/Proyectar comision de Juan");
  assert.equal(renderer.safety.createsCompensationTruth, false);
  assert.equal(renderer.safety.createsPayoutTruth, false);
  pass("/Proyectar keeps compensation and payout truth forbidden");
}

{
  const { renderer } = buildRenderer("/Presentacion de venta para Maria");
  assert.ok(renderer.sanitizedStaticMarkupPreview.includes("data-static-renderer"));
  assert.equal(renderer.renderOutputContract.inertMarkupStringOnly, true);
  pass("/Presentacion creates inert markup preview string only");
}

{
  const { renderer } = buildRenderer("/Mejora este mensaje Hola Maria te busco para hablar de retiro");
  assert.equal(renderer.safety.sendsMessage, false);
  assert.equal(renderer.safety.maySendMessage, false);
  pass("/Mejora este mensaje renders draft preview without send");
}

{
  const { renderer } = buildRenderer("/Follow Juan ultimo contacto hace 76 dias");
  assert.equal(renderer.safety.createsTask, false);
  assert.equal(renderer.safety.mayCreateTask, false);
  pass("/Follow renders follow-up preview without task creation");
}

{
  const { renderer } = buildRenderer("/Chatbot explica este caso");
  assert.equal(renderer.safety.executesRuntime, false);
  assert.equal(renderer.safety.providerRuntimeEnabled, false);
  pass("/Chatbot renders context preview without runtime execution");
}

{
  const { renderer } = buildRenderer("Juan Orozco poliza ABC");
  assert.equal(renderer.safety.liveSearchEnabled, false);
  assert.equal(renderer.safety.networkCallsAllowed, false);
  assert.equal(renderer.renderText.searchablePreviewOnly, true);
  pass("Plain text renders static searchable preview without live search");
}

{
  const { renderer } = buildRenderer("/Memoria nota dictada por voz para Juan");
  assert.equal(renderer.renderVoicePreviewPlan.transcriptionPreviewOnly, true);
  assert.equal(renderer.renderVoicePreviewPlan.audioRuntimeEnabled, false);
  assert.equal(renderer.renderVoicePreviewPlan.speechEngineEnabled, false);
  pass("Voice preview plan remains transcription preview without audio runtime");
}

{
  const { domSurface } = buildRenderer("/Memoria Hoy vi a Juan.");
  const before = JSON.stringify(domSurface);
  buildDomRendererFromDomSurfaceBinding(domSurface);
  assert.equal(JSON.stringify(domSurface), before);
  pass("buildDomRendererFromDomSurfaceBinding does not mutate source DOM surface binding");
}

{
  const a = buildRenderer("/Memoria Hoy vi a Juan.").renderer;
  const b = buildRenderer("/Memoria Hoy vi a Juan.").renderer;
  assert.equal(a.domRendererId, b.domRendererId);
  pass("Static DOM renderer id is deterministic for the same input");
}

{
  const { renderer } = buildRenderer("/Memoria Hoy vi a Juan.");
  assert.ok(Array.isArray(renderer.renderRegions));
  assert.ok(Array.isArray(renderer.renderSlots));
  assert.ok(renderer.renderPlan.renderRegionCount >= 1);
  assert.ok(renderer.renderPlan.renderSlotCount >= 1);
  pass("Renderer maps DOM regions and slots into ordered render plan");
}

{
  const { renderer } = buildRenderer("/Memoria Hoy vi a Juan.");
  assert.equal(renderer.virtualDomPreviewTree.nodeType, "static-root");
  assert.equal(renderer.virtualDomPreviewTree.inert, true);
  assert.equal(renderer.virtualDomPreviewTree.mutatesRealDom, false);
  pass("virtualDomPreviewTree is inert object metadata only");
}

{
  const { renderer } = buildRenderer("/Memoria <script>alert(1)</script> Juan");
  assert.ok(!renderer.sanitizedStaticMarkupPreview.includes("<script>"));
  assert.ok(renderer.sanitizedStaticMarkupPreview.includes("&lt;script&gt;") || renderer.sanitizedStaticMarkupPreview.includes("data-static-renderer"));
  pass("sanitizedStaticMarkupPreview escapes unsafe text");
}

{
  const { renderer } = buildRenderer("/Memoria Hoy vi a Juan.");
  assert.equal(renderer.mountInstructions.mountPreviewOnly, true);
  assert.equal(renderer.mountInstructions.mountSelector, null);
  assert.equal(renderer.mountInstructions.mayMutateRealDom, false);
  pass("mountInstructions are explicit no-op preview instructions");
}

{
  const { renderer } = buildRenderer("/Memoria Hoy vi a Juan.");
  assert.equal(renderer.renderClassMap.mutatesCss, false);
  assert.equal(renderer.renderA11yMap.keyboardNavigationPreviewOnly, true);
  assert.equal(renderer.renderResponsivePlan.responsivePlanPreviewOnly, true);
  pass("class, a11y, and responsive maps are static preview metadata only");
}

{
  const { renderer } = buildRenderer("/Memoria Hoy vi a Juan.");
  assert.equal(renderer.staticPreviewDomIntegrationBoundary.integrationPreviewOnly, true);
  assert.equal(renderer.staticPreviewDomIntegrationBoundary.mayMutateHtml, false);
  assert.equal(renderer.staticPreviewDomIntegrationBoundary.mayMutateCss, false);
  assert.equal(renderer.staticPreviewDomIntegrationBoundary.mayMutateJavaScript, false);
  pass("static preview DOM integration boundary forbids HTML/CSS/JS mutation");
}

{
  assert.equal(DOM_RENDERER_SAFE_BOUNDARY.eventListenersEnabled, false);
  assert.equal(DOM_RENDERER_SAFE_BOUNDARY.browserStorageEnabled, false);
  assert.equal(DOM_RENDERER_SAFE_BOUNDARY.networkCallsAllowed, false);
  assert.equal(DOM_RENDERER_SAFE_BOUNDARY.realDomMutationAllowed, false);
  pass("DOM renderer safe boundary exposes browser-facing locks");
}

{
  const serialized = JSON.stringify(buildRenderer("/Comisiones Juan").renderer);
  const forbiddenTrueFlags = [
    "createsTruth\":true",
    "executesRuntime\":true",
    "sendsMessage\":true",
    "writesCrm\":true",
    "createsCalendarEvent\":true",
    "createsTask\":true",
    "createsCompensationTruth\":true",
    "createsPayoutTruth\":true",
    "audioRuntimeEnabled\":true",
    "speechEngineEnabled\":true",
    "providerRuntimeEnabled\":true",
    "liveSearchEnabled\":true",
    "eventListenersEnabled\":true",
    "browserStorageEnabled\":true",
    "networkCallsAllowed\":true",
    "mayMutateRealDom\":true",
  ];
  for (const token of forbiddenTrueFlags) {
    assert.ok(!serialized.includes(token), token);
  }
  const forbiddenApiTokens = [
    ["doc", "ument."],
    ["win", "dow."],
    ["query", "Selector"],
    ["inner", "HTML"],
    ["add", "Event", "Listener"],
    ["local", "Storage"],
    ["session", "Storage"],
    ["fet", "ch("],
    ["XML", "Http", "Request"],
    ["navigator", ".media", "Devices"],
    ["Speech", "Recognition"],
  ].map((parts) => parts.join(""));
  for (const token of forbiddenApiTokens) {
    assert.ok(!serialized.includes(token), token);
  }
  pass("Serialized renderer contains no forbidden true execution flags or DOM APIs");
}

assert.equal(passCount, expectedPasses);
console.log(`Alfred Review Action Packet Static Preview DOM Renderer PASS ${passCount}/${expectedPasses}`);
