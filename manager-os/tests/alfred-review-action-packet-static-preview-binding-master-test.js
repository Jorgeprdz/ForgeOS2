"use strict";

const assert = require("assert");

const {
  STATIC_PREVIEW_SAFE_BOUNDARY,
  STATIC_PREVIEW_SLOTS,
  buildAlfredStaticPreviewBinding,
  buildStaticPreviewBindingFromUiViewModel,
} = require("../alfred-review-action-packet-static-preview-binding");

const {
  buildAlfredReviewActionPacketUiViewModel,
} = require("../alfred-review-action-packet-ui-view-model");

let passed = 0;
function pass(message) {
  passed += 1;
  console.log(`PASS ${passed} - ${message}`);
}

function assertSafeBoundary(target) {
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
}

function assertRenderContract(target) {
  assert.equal(target.staticPreviewOnly, true);
  assert.equal(target.rendererNeutral, true);
  assert.equal(target.mayRenderDom, false);
  assert.equal(target.mayExecuteProviderAction, false);
  assert.equal(target.mayWriteCrm, false);
  assert.equal(target.mayCreateCalendarEvent, false);
  assert.equal(target.maySendMessage, false);
  assert.equal(target.mayApproveArtifact, false);
  assert.equal(target.mayCreateTruth, false);
  assert.equal(target.mayStartAudioRuntime, false);
  assert.equal(target.mayStartSpeechEngine, false);
  assert.equal(target.mayCallLiveSearch, false);
}

function assertStaticPreview(preview, expectedPacketType) {
  assert.equal(preview.source, "ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_BINDING");
  assert.equal(preview.sourcePhase, "054S_ALFRED_REVIEW_ACTION_PACKET_STATIC_PREVIEW_BINDING_IMPLEMENTATION");
  assert.equal(preview.finalAuthority, "HUMAN");
  assert.equal(preview.packetType, expectedPacketType);
  assert.ok(preview.previewId.startsWith("alfred-static-preview-"));
  assert.ok(Array.isArray(preview.staticPreview.previewTree));
  assert.ok(preview.staticPreview.previewTree.length >= 8);
  assert.ok(preview.staticPreview.layoutSlots[STATIC_PREVIEW_SLOTS.HEADER]);
  assert.ok(preview.staticPreview.layoutSlots[STATIC_PREVIEW_SLOTS.STATUS_PILLS]);
  assert.ok(preview.staticPreview.layoutSlots[STATIC_PREVIEW_SLOTS.SAFETY_BANNER]);
  assert.ok(preview.staticPreview.layoutSlots[STATIC_PREVIEW_SLOTS.SECTIONS]);
  assert.ok(preview.staticPreview.layoutSlots[STATIC_PREVIEW_SLOTS.ACTION_CARDS]);
  assert.ok(preview.staticPreview.layoutSlots[STATIC_PREVIEW_SLOTS.REVIEW_CTA]);
  assert.ok(preview.staticPreview.layoutSlots[STATIC_PREVIEW_SLOTS.DISABLED_PROVIDER_CTAS]);
  assert.ok(preview.staticPreview.layoutSlots[STATIC_PREVIEW_SLOTS.RENDER_CONTRACT]);
  assert.ok(preview.bindings.headerBinding);
  assert.ok(preview.bindings.statusPillsBinding);
  assert.ok(preview.bindings.safetyBannerBinding);
  assert.ok(preview.bindings.sectionsBinding);
  assert.ok(preview.bindings.actionCardsBinding);
  assert.ok(preview.bindings.reviewCtaBinding);
  assert.ok(preview.bindings.disabledProviderCtasBinding);
  assert.ok(preview.bindings.renderContractBinding);
  assertSafeBoundary(preview.safety);
  assertRenderContract(preview.renderContract);
  preview.staticPreview.previewTree.forEach((node) => {
    assert.equal(node.staticOnly, true);
    assert.equal(node.rendererNeutral, true);
    assert.equal(node.interactive, false);
    assert.equal(node.emitsEvents, false);
    assert.equal(node.mutatesState, false);
    assertSafeBoundary(node.safety);
  });
}

{
  const preview = buildAlfredStaticPreviewBinding("/Memoria Hoy vi a Juan. Me dijo que si le interesa retiro, pero quiere revisarlo con su esposa. Me pidio que le hable la proxima semana.");
  assertStaticPreview(preview, "MEMORY_REVIEW_PACKET");
  assert.equal(preview.sourceCommand, "/Memoria");
  assert.ok(preview.staticPreview.textIndex.some((item) => item.includes("MEMORY_REVIEW_PACKET")));
  pass("/Memoria creates static preview binding with review boundary");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Referido Luis Perez es referido de Giovanni Islas, compañero del trabajo.");
  assertStaticPreview(preview, "REFERRAL_CAPTURE_REVIEW_PACKET");
  assert.equal(preview.renderContract.mayWriteCrm, false);
  pass("/Referido creates static referral preview without CRM write");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Agenda Tengo cita con Maria el viernes a las 11.");
  assertStaticPreview(preview, "CALENDAR_EVENT_DRAFT_REVIEW_PACKET");
  assert.equal(preview.renderContract.mayCreateCalendarEvent, false);
  pass("/Agenda creates static calendar draft preview without event creation");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Crear evento con Maria el viernes a las 11 para revisar su plan de proteccion.");
  assertStaticPreview(preview, "CALENDAR_EVENT_DRAFT_REVIEW_PACKET");
  assert.ok(preview.bindings.disabledProviderCtasBinding.payload.disabledProviderCtas.some((cta) => cta.disabled === true));
  pass("/Crear evento remains disabled provider CTA in static preview");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Cotizar Lariza y su novio retiro y Vida Mujer.");
  assertStaticPreview(preview, "PRODUCT_INTELLIGENCE_REVIEW_PACKET");
  assert.equal(preview.renderContract.mayApproveArtifact, false);
  pass("/Cotizar creates product intelligence static preview only");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Proyectar comision de Juan");
  assertStaticPreview(preview, "PRODUCT_INTELLIGENCE_REVIEW_PACKET");
  assert.equal(preview.renderContract.mayCreateTruth, false);
  assert.equal(preview.safety.createsCompensation, false);
  pass("/Proyectar keeps compensation and payout truth forbidden in static preview");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Presentación de venta para Maria");
  assertStaticPreview(preview, "PRODUCT_INTELLIGENCE_REVIEW_PACKET");
  assert.equal(preview.sourceCommand, "/Presentación");
  pass("/Presentación creates sales artifact static preview only");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Mejora este mensaje Hola Juan te busco para hablar de retiro y ver cuando podemos agendar.");
  assertStaticPreview(preview, "MESSAGE_DRAFT_REVIEW_PACKET");
  assert.equal(preview.renderContract.maySendMessage, false);
  pass("/Mejora este mensaje creates static draft preview without send");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Follow Juan retiro proxima semana");
  assertStaticPreview(preview, "FOLLOW_UP_REVIEW_PACKET");
  assert.equal(preview.safety.createsTask, false);
  pass("/Follow creates static follow-up preview without task creation");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Chatbot ayudame a preparar una cita de retiro con Maria");
  assertStaticPreview(preview, "CHATBOT_CONTEXT_REVIEW_PACKET");
  assert.equal(preview.renderContract.mayExecuteProviderAction, false);
  pass("/Chatbot creates static context preview without runtime execution");
}

{
  const preview = buildAlfredStaticPreviewBinding("Juan retiro proxima semana");
  assertStaticPreview(preview, "UNIVERSAL_INDEX_REVIEW_PACKET");
  assert.equal(preview.renderContract.mayCallLiveSearch, false);
  pass("Plain text creates static universal index preview without live search");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Memoria Tengo cita con Maria el viernes a las 11", { packetOptions: { voiceTranscriptionPreview: true } });
  assertStaticPreview(preview, "VOICE_TRANSCRIPTION_REVIEW_PACKET");
  assert.ok(preview.bindings.voicePreviewBinding);
  assert.ok(preview.staticPreview.layoutSlots[STATIC_PREVIEW_SLOTS.VOICE_PREVIEW]);
  assert.equal(preview.bindings.voicePreviewBinding.payload.audioRuntimeEnabled, false);
  assert.equal(preview.bindings.voicePreviewBinding.payload.speechEngineEnabled, false);
  pass("Voice transcription preview creates static voice slot without audio runtime");
}

{
  const vm = buildAlfredReviewActionPacketUiViewModel("/Cotizar Juan retiro");
  const before = JSON.stringify(vm);
  const preview = buildStaticPreviewBindingFromUiViewModel(vm);
  assert.equal(JSON.stringify(vm), before);
  assert.equal(preview.sourceViewModel.source, "ALFRED_REVIEW_ACTION_PACKET_UI_VIEW_MODEL");
  pass("buildStaticPreviewBindingFromUiViewModel does not mutate source view model");
}

{
  const a = buildAlfredStaticPreviewBinding("/Referido Luis Perez es referido de Giovanni Islas");
  const b = buildAlfredStaticPreviewBinding("/Referido Luis Perez es referido de Giovanni Islas");
  assert.equal(a.previewId, b.previewId);
  pass("Static preview id is deterministic for the same input");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Agenda Tengo cita con Maria el viernes a las 11.");
  preview.bindings.disabledProviderCtasBinding.payload.disabledProviderCtas.forEach((cta) => {
    assert.equal(cta.disabled, true);
    assert.equal(cta.executesRuntime, false);
    assert.equal(cta.createsCalendarEvent, false);
  });
  pass("Disabled provider CTAs stay disabled in static preview binding");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Memoria Hoy vi a Juan retiro");
  assert.equal(preview.bindings.reviewCtaBinding.payload.uiNavigationOnly, true);
  assert.equal(preview.bindings.reviewCtaBinding.payload.executesRuntime, false);
  assert.equal(preview.bindings.reviewCtaBinding.uiNavigationOnly, true);
  assert.equal(preview.bindings.reviewCtaBinding.interactive, false);
  pass("Review CTA is exposed as static UI navigation only");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Cotizar Juan retiro");
  const orders = preview.staticPreview.previewTree.map((node) => node.order);
  const sorted = [...orders].sort((left, right) => left - right);
  assert.deepEqual(orders, sorted);
  assert.ok(preview.bindings.sectionsBinding.payload.sections.length > 0);
  pass("Static preview tree is ordered and includes sections");
}

{
  assertSafeBoundary(STATIC_PREVIEW_SAFE_BOUNDARY);
  assert.equal(STATIC_PREVIEW_SAFE_BOUNDARY.staticPreviewOnly, true);
  assert.equal(STATIC_PREVIEW_SAFE_BOUNDARY.rendererNeutral, true);
  assert.equal(STATIC_PREVIEW_SAFE_BOUNDARY.domRuntimeEnabled, false);
  pass("Static preview safe boundary exposes renderer-neutral locks");
}

{
  const preview = buildAlfredStaticPreviewBinding("/Bonos Juan");
  assertStaticPreview(preview, "PRODUCT_INTELLIGENCE_REVIEW_PACKET");
  assert.equal(preview.renderContract.mayCreateTruth, false);
  pass("/Bonos remains static product review preview without truth creation");
}

{
  const serialized = JSON.stringify(buildAlfredStaticPreviewBinding("/Comisiones Juan"));
  [
    "createsTruth",
    "executesRuntime",
    "sendsMessage",
    "writesCrm",
    "createsCalendarEvent",
    "audioRuntimeEnabled",
    "speechEngineEnabled",
    "providerRuntimeEnabled",
    "liveSearchEnabled",
    "mayExecuteProviderAction",
    "mayWriteCrm",
    "mayCreateCalendarEvent",
    "maySendMessage",
    "mayApproveArtifact",
    "mayCreateTruth",
    "mayStartAudioRuntime",
    "mayStartSpeechEngine",
    "mayCallLiveSearch"
  ].forEach((flag) => {
    assert.ok(!serialized.includes(`"${flag}":true`), `${flag} must not be true`);
  });
  pass("Serialized static preview binding contains no forbidden true execution flags");
}

console.log(`Alfred Review Action Packet Static Preview Binding PASS ${passed}/20`);
assert.equal(passed, 20);
