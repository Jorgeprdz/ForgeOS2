"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const surfaceModule = require("../alfred-review-action-packet-static-preview-surface-binding");
const domModule = require("../alfred-review-action-packet-static-preview-dom-surface-binding");

const buildAlfredStaticPreviewSurfaceBinding = surfaceModule.buildAlfredStaticPreviewSurfaceBinding;
const buildAlfredStaticPreviewDomSurfaceBinding = domModule.buildAlfredStaticPreviewDomSurfaceBinding;
const buildDomSurfaceBindingFromSurfaceBinding = domModule.buildDomSurfaceBindingFromSurfaceBinding;
const DOM_SURFACE_SAFE_BOUNDARY = domModule.DOM_SURFACE_SAFE_BOUNDARY;
const DOM_TARGETS = domModule.DOM_TARGETS;
const DOM_STATES = domModule.DOM_STATES;
const DOM_REGIONS = domModule.DOM_REGIONS;

let passed = 0;
function pass(name) {
  passed += 1;
  console.log(`PASS ${passed} - ${name}`);
}

function assertFalseFlags(target) {
  assert.equal(target.previewOnly, true);
  assert.equal(target.reviewOnly, true);
  assert.equal(target.notApproved, true);
  assert.equal(target.notSendable, true);
  assert.equal(target.createsTruth, false);
  assert.equal(target.executesRuntime, false);
  assert.equal(target.sendsMessage, false);
  assert.equal(target.writesCrm, false);
  assert.equal(target.createsCalendarEvent, false);
  assert.equal(target.audioRuntimeEnabled, false);
  assert.equal(target.speechEngineEnabled, false);
  assert.equal(target.providerRuntimeEnabled, false);
  assert.equal(target.liveSearchEnabled, false);
  assert.equal(target.domRuntimeEnabled, false);
  assert.equal(target.uiImplementationEnabled, false);
  assert.equal(target.eventListenersAllowed, false);
  assert.equal(target.browserStorageAllowed, false);
}

function assertDomSafe(dom) {
  assert.equal(dom.source, "ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_DOM_SURFACE_BINDING");
  assert.equal(dom.sourcePhase, "054Y_ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_DOM_SURFACE_BINDING_IMPLEMENTATION");
  assert.equal(dom.finalAuthority, "HUMAN");
  assertFalseFlags(dom.safety);
  assert.equal(dom.domEventBoundary.eventListenersAllowed, false);
  assert.equal(dom.domEventBoundary.browserStorageAllowed, false);
  assert.equal(dom.domEventBoundary.networkCallsAllowed, false);
  assert.equal(dom.domEventBoundary.providerCallsAllowed, false);
  assert.equal(dom.domEventBoundary.sendCallsAllowed, false);
  assert.equal(dom.domEventBoundary.calendarCreateAllowed, false);
  assert.equal(dom.domEventBoundary.crmWriteAllowed, false);
  assert.equal(dom.domEventBoundary.truthMutationAllowed, false);
  assert.equal(dom.domRenderBoundary.mayRenderDom, false);
  assert.equal(dom.domRenderBoundary.mayMutateDom, false);
  assert.equal(dom.domRenderBoundary.mayAttachEventListeners, false);
  assert.equal(dom.domRenderBoundary.mayUseBrowserStorage, false);
  assert.equal(dom.domRenderBoundary.mayCallNetwork, false);
  assert.equal(dom.domRenderBoundary.mayExecuteProviderAction, false);
  assert.equal(dom.domRenderBoundary.mayCreateTruth, false);
  assert.equal(dom.domClassContract.cssMutationAllowed, false);
  assert.equal(dom.domClassContract.htmlMutationAllowed, false);
  assert.equal(dom.domA11yContract.keyboardNavigationPreviewOnly, true);
  assert.equal(dom.domA11yContract.eventListenersAllowed, false);
  assert.ok(Array.isArray(dom.domSlotMap));
  assert.ok(dom.domRegionMap.header || dom.domRegionMap.header !== undefined);
}

function build(input, options = {}) {
  return buildAlfredStaticPreviewDomSurfaceBinding(input, options);
}

{
  const dom = build("/Memoria Cita con Maria sobre PPR el viernes");
  assertDomSafe(dom);
  assert.equal(dom.sourcePacketType, "MEMORY_REVIEW_PACKET");
  assert.ok(dom.domRegionMap.header);
  assert.ok(dom.domTextMap.itemCount > 0);
  pass("/Memoria creates static DOM surface binding with review boundary");
}

{
  const dom = build("/Referido Ana me refiere a Luis para retiro");
  assertDomSafe(dom);
  assert.equal(dom.domEventBoundary.crmWriteAllowed, false);
  assert.equal(dom.domDisabledActionMap.crmWriteDisabled, true);
  pass("/Referido creates DOM metadata without CRM write");
}

{
  const dom = build("/Agenda Agendar con Fernanda el jueves a las 7 pm");
  assertDomSafe(dom);
  assert.equal(dom.domEventBoundary.calendarCreateAllowed, false);
  assert.equal(dom.domReviewNavigationMap.executesRuntime, false);
  pass("/Agenda creates calendar DOM draft metadata without event creation");
}

{
  const dom = build("/Crear evento Junta con Roberto mañana 10 am");
  assertDomSafe(dom);
  assert.equal(dom.domDisabledActionMap.calendarCreateDisabled, true);
  assert.equal(dom.domRenderBoundary.mayCreateCalendarEvent, false);
  pass("/Crear evento remains disabled provider action in DOM surface binding");
}

{
  const dom = build("/Cotizar Vida Mujer para Laura con ahorro");
  assertDomSafe(dom);
  assert.equal(dom.domRenderBoundary.mayApproveArtifact, false);
  pass("/Cotizar creates product intelligence DOM preview only");
}

{
  const dom = build("/Proyectar comisiones y bonos del cierre mensual");
  assertDomSafe(dom);
  assert.equal(dom.domReviewNavigationMap.createsTruth, false);
  assert.equal(dom.sourceSurfaceBinding.interactionPolicy.mayCreateTruth, false);
  pass("/Proyectar keeps compensation and payout truth forbidden in DOM surface");
}

{
  const dom = build("/Presentación Segubeca para mamá con hijo de 6 años");
  assertDomSafe(dom);
  assert.equal(dom.domRenderBoundary.mayApproveArtifact, false);
  assert.equal(dom.domEventBoundary.approvalCallsAllowed, false);
  pass("/Presentación creates sales artifact DOM preview only");
}

{
  const dom = build("/Mejora este mensaje Hola, quiero platicarte de tu retiro");
  assertDomSafe(dom);
  assert.equal(dom.domEventBoundary.sendCallsAllowed, false);
  assert.equal(dom.domDisabledActionMap.sendDisabled, true);
  pass("/Mejora este mensaje creates DOM draft metadata without send");
}

{
  const dom = build("/Follow Dar seguimiento a Mariana la próxima semana");
  assertDomSafe(dom);
  assert.equal(dom.domDisabledActionMap.disabledActionCards.every((card) => card.createsTask === false || card.createsTask === undefined), true);
  pass("/Follow creates follow-up DOM preview without task creation");
}

{
  const dom = build("/Chatbot Contexto para asesor sobre objeción no me alcanza");
  assertDomSafe(dom);
  assert.equal(dom.domRenderBoundary.mayExecuteProviderAction, false);
  assert.equal(dom.domEventBoundary.providerCallsAllowed, false);
  pass("/Chatbot creates DOM context preview without runtime execution");
}

{
  const dom = build("Nota libre sobre cliente interesado en retiro y GMM");
  assertDomSafe(dom);
  assert.equal(dom.domTextMap.liveSearchEnabled, false);
  assert.equal(dom.domTextMap.networkCallsAllowed, false);
  pass("Plain text creates DOM universal index preview without live search");
}

{
  const dom = build("/Memoria Dictado de voz: cliente quiere revisar PPR", {
    surfaceOptions: { staticPreviewOptions: { packetOptions: { voiceTranscriptionPreview: true } } },
  });
  assertDomSafe(dom);
  assert.equal(dom.sourcePacketType, "VOICE_TRANSCRIPTION_REVIEW_PACKET");
  assert.equal(dom.domState, DOM_STATES.VOICE_PREVIEW_ONLY);
  assert.equal(dom.domVoicePreviewMap.visible, true);
  assert.equal(dom.domVoicePreviewMap.audioRuntimeEnabled, false);
  assert.equal(dom.domVoicePreviewMap.speechEngineEnabled, false);
  assert.equal(dom.domVoicePreviewMap.mayRequestMicPermission, false);
  assert.equal(dom.domRegionMap.voicePreview.domRegionId, DOM_REGIONS.VOICE_PREVIEW);
  pass("Voice transcription preview creates DOM voice map without audio runtime");
}

{
  const source = buildAlfredStaticPreviewSurfaceBinding("/Cotizar Juan retiro");
  const before = JSON.stringify(source);
  const dom = buildDomSurfaceBindingFromSurfaceBinding(source);
  assertDomSafe(dom);
  assert.equal(JSON.stringify(source), before);
  pass("buildDomSurfaceBindingFromSurfaceBinding does not mutate source surface binding");
}

{
  const domA = build("/Agenda Cita con Ana jueves 5 pm");
  const domB = build("/Agenda Cita con Ana jueves 5 pm");
  assert.equal(domA.domSurfaceBindingId, domB.domSurfaceBindingId);
  pass("Static DOM surface binding id is deterministic for the same input");
}

{
  const dom = build("/Memoria Cliente quiere Vida Mujer y retiro");
  assert.ok(dom.domRegionMap.header);
  assert.ok(dom.domRegionMap.sections);
  assert.ok(dom.domRegionMap.reviewCta);
  assert.ok(dom.domRegionMap.renderBoundary);
  assert.equal(dom.domRegionMap.header.eventListenersAllowed, false);
  pass("DOM region map preserves static preview regions as metadata");
}

{
  const dom = build("/Memoria Ordenar slots para Alfred");
  const orders = dom.domSlotMap.map((slot) => slot.order);
  const sorted = orders.slice().sort((a, b) => a - b);
  assert.deepEqual(orders, sorted);
  dom.domSlotMap.forEach((slot) => {
    assert.equal(slot.staticContentOnly, true);
    assert.equal(slot.eventListenersAllowed, false);
    assert.equal(slot.executesRuntime, false);
    assert.equal(slot.createsTruth, false);
  });
  pass("DOM slot map is ordered and static only");
}

{
  const dom = build("/Crear evento Reunión con Paty mañana");
  assert.ok(dom.domDisabledActionMap.disabledProviderCtas.length > 0);
  dom.domDisabledActionMap.disabledProviderCtas.forEach((cta) => {
    assert.equal(cta.disabled, true);
    assert.equal(cta.clickable, false);
    assert.equal(cta.providerCallsAllowed, false);
    assert.equal(cta.executesRuntime, false);
  });
  pass("Disabled provider actions stay disabled in DOM metadata");
}

{
  const dom = build("/Memoria Abrir panel local de revisión", {
    domOptions: { domTarget: DOM_TARGETS.ALFRED_REVIEW_PANEL_DOM_SURFACE },
  });
  assert.equal(dom.domTarget, DOM_TARGETS.ALFRED_REVIEW_PANEL_DOM_SURFACE);
  assert.equal(dom.domReviewNavigationMap.uiNavigationOnly, true);
  assert.equal(dom.domReviewNavigationMap.localNavigationMetadataOnly, true);
  assert.equal(dom.domReviewNavigationMap.eventListenersAllowed, false);
  assert.equal(dom.domReviewNavigationMap.executesRuntime, false);
  pass("DOM review navigation map is local metadata only");
}

{
  assertFalseFlags(DOM_SURFACE_SAFE_BOUNDARY);
  assert.equal(DOM_SURFACE_SAFE_BOUNDARY.domSurfaceBindingOnly, true);
  assert.equal(DOM_SURFACE_SAFE_BOUNDARY.browserFacingMetadataOnly, true);
  assert.equal(DOM_SURFACE_SAFE_BOUNDARY.domImplementationAllowed, false);
  assert.equal(DOM_SURFACE_SAFE_BOUNDARY.networkCallsAllowed, false);
  pass("DOM surface safe boundary exposes browser-facing metadata locks");
}

{
  const dom = build("/Bonos Revisar bono bimestral sin crear verdad de compensación");
  assertDomSafe(dom);
  assert.equal(dom.domEventBoundary.truthMutationAllowed, false);
  assert.equal(dom.domRenderBoundary.mayCreateTruth, false);
  pass("/Bonos remains DOM product review preview without truth creation");
}

{
  const dom = build("/Comisiones revisar avance sin crear comisión");
  const serialized = JSON.stringify(dom);
  const dangerous = [
    "createsTruth",
    "executesRuntime",
    "sendsMessage",
    "writesCrm",
    "createsCalendarEvent",
    "audioRuntimeEnabled",
    "speechEngineEnabled",
    "providerRuntimeEnabled",
    "liveSearchEnabled",
    "domRuntimeEnabled",
    "uiImplementationEnabled",
    "eventListenersAllowed",
    "browserStorageAllowed",
    "networkCallsAllowed",
    "providerCallsAllowed",
    "sendCallsAllowed",
    "calendarCreateAllowed",
    "crmWriteAllowed",
    "truthMutationAllowed",
    "mayExecuteProviderAction",
    "mayWriteCrm",
    "mayCreateCalendarEvent",
    "maySendMessage",
    "mayApproveArtifact",
    "mayCreateTruth",
    "mayStartAudioRuntime",
    "mayStartSpeechEngine",
    "mayCallLiveSearch",
  ];
  dangerous.forEach((flag) => {
    assert.doesNotMatch(serialized, new RegExp(`"${flag}":true`));
  });
  const sourceText = fs.readFileSync(path.join(__dirname, "../alfred-review-action-packet-static-preview-dom-surface-binding.js"), "utf8");
  assert.doesNotMatch(sourceText, /document\.|querySelector|addEventListener|innerHTML|outerHTML|insertAdjacentHTML|localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|navigator\.mediaDevices|MediaRecorder|SpeechRecognition|webkitSpeechRecognition/);
  pass("Serialized DOM surface binding contains no forbidden true execution flags or DOM APIs");
}

assert.equal(passed, 21);
console.log(`Alfred Review Action Packet Static Preview DOM Surface Binding PASS ${passed}/21`);
