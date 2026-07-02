const assert = require("assert");
const {
  PACKET_TYPES,
  buildAlfredReviewActionPacket,
  buildPacketFromAlfredReadModel,
  derivePacketType,
} = require("../alfred-review-action-packet-read-model");
const { buildAlfredReadModel } = require("../alfred-universal-command-memory-read-model");

let passCount = 0;

function pass(name) {
  passCount += 1;
  console.log(`PASS ${passCount} - ${name}`);
}

function assertBoundary(packet) {
  assert.equal(packet.safety.previewOnly, true);
  assert.equal(packet.safety.reviewOnly, true);
  assert.equal(packet.safety.notApproved, true);
  assert.equal(packet.safety.notSendable, true);
  assert.equal(packet.safety.createsTruth, false);
  assert.equal(packet.safety.executesRuntime, false);
  assert.equal(packet.safety.sendsMessage, false);
  assert.equal(packet.safety.writesCrm, false);
  assert.equal(packet.safety.createsCalendarEvent, false);
  assert.equal(packet.safety.createsTask, false);
  assert.equal(packet.safety.audioRuntimeEnabled, false);
  assert.equal(packet.safety.speechEngineEnabled, false);
  assert.equal(packet.safety.liveSearchEnabled, false);
  assert.equal(packet.safety.providerRuntimeEnabled, false);
  assert.equal(packet.confirmationRequired, true);
  assert.equal(packet.finalAuthority, "HUMAN");
  assert.equal(packet.humanReview.finalAuthority, "HUMAN");
  assert.equal(packet.humanReview.approvalStatus, "NOT_APPROVED");
  for (const action of packet.proposedActions) {
    assert.equal(action.executionState, "NOT_EXECUTED");
    assert.equal(action.previewOnly, true);
    assert.equal(action.reviewOnly, true);
    assert.equal(action.notApproved, true);
    assert.equal(action.notSendable, true);
    assert.equal(action.createsTruth, false);
    assert.equal(action.executesRuntime, false);
    assert.equal(action.sendsMessage, false);
    assert.equal(action.writesCrm, false);
    assert.equal(action.createsCalendarEvent, false);
    assert.equal(action.createsTask, false);
  }
}

{
  const packet = buildAlfredReviewActionPacket("/Memoria Hoy vi a Juan. Me dijo que si le interesa retiro, pero quiere revisarlo con su esposa. Me pidio que le hable la proxima semana.");
  assert.equal(packet.packetType, PACKET_TYPES.MEMORY);
  assert.equal(packet.sourceCommand, "/Memoria");
  assert.equal(packet.primaryEntity, "Juan");
  assert.ok(packet.productInterests.includes("retiro"));
  assert.ok(packet.proposedActions.some((action) => action.actionType === "prepare_memory_entry"));
  assertBoundary(packet);
  pass("/Memoria creates MEMORY_REVIEW_PACKET with review boundary");
}

{
  const packet = buildAlfredReviewActionPacket("/Memoria A Lariza le interesa para ella y su novio. Les intereso retiro y Vida Mujer.");
  assert.equal(packet.packetType, PACKET_TYPES.MEMORY);
  assert.equal(packet.primaryEntity, "Lariza");
  assert.ok(packet.productInterests.includes("retiro"));
  assert.ok(packet.productInterests.includes("Vida Mujer"));
  assert.ok(packet.extractedFacts.some((fact) => fact.factType === "memory_signal"));
  assertBoundary(packet);
  pass("Couple/product memory remains review packet only");
}

{
  const packet = buildAlfredReviewActionPacket("/Referido Luis Perez es referido de Giovanni Islas, compañero del trabajo.");
  assert.equal(packet.packetType, PACKET_TYPES.REFERRAL);
  assert.equal(packet.primaryEntity, "Luis Perez");
  assert.equal(packet.referralCandidate.sourceName, "Giovanni Islas");
  assert.equal(packet.referralCandidate.writesCrm, false);
  assert.ok(packet.proposedActions.some((action) => action.actionType === "prepare_referral_record"));
  assertBoundary(packet);
  pass("/Referido creates referral capture packet without CRM write");
}

{
  const packet = buildAlfredReviewActionPacket("/Agenda Tengo cita con Maria el viernes a las 11.");
  assert.equal(packet.packetType, PACKET_TYPES.CALENDAR);
  assert.equal(packet.calendarCandidate.day, "viernes");
  assert.equal(packet.calendarCandidate.time, "11:00");
  assert.equal(packet.calendarCandidate.createsCalendarEvent, false);
  assert.ok(packet.humanReviewQuestions.join(" ").includes("calendar"));
  assertBoundary(packet);
  pass("/Agenda creates calendar draft review packet without event creation");
}

{
  const packet = buildAlfredReviewActionPacket("/Crear evento con Maria el viernes a las 11 para revisar su plan de proteccion.");
  assert.equal(packet.packetType, PACKET_TYPES.CALENDAR);
  assert.ok(packet.proposedActions.some((action) => action.actionType === "prepare_calendar_event"));
  assert.equal(packet.safety.calendarCreateRequiresConfirmation, true);
  assert.equal(packet.calendarCandidate.createsCalendarEvent, false);
  assertBoundary(packet);
  pass("/Crear evento remains draft and confirmation-only");
}

{
  const packet = buildAlfredReviewActionPacket("/Cotizar Lariza y su novio retiro y Vida Mujer.");
  assert.equal(packet.packetType, PACKET_TYPES.PRODUCT);
  assert.ok(packet.productInterests.includes("retiro"));
  assert.ok(packet.productInterests.includes("Vida Mujer"));
  assert.ok(packet.proposedActions.some((action) => action.actionType === "prepare_product_intelligence_artifact"));
  assertBoundary(packet);
  pass("/Cotizar creates product intelligence review packet only");
}

{
  const packet = buildAlfredReviewActionPacket("/Proyectar comision de Juan");
  assert.equal(packet.packetType, PACKET_TYPES.PRODUCT);
  assert.equal(packet.safety.createsCompensationTruth, false);
  assert.equal(packet.safety.createsPayoutTruth, false);
  assert.ok(packet.forbiddenActions.includes("create_commission_truth"));
  assertBoundary(packet);
  pass("/Proyectar does not create compensation or payout truth");
}

{
  const packet = buildAlfredReviewActionPacket("/Presentación de venta para Maria");
  assert.equal(packet.packetType, PACKET_TYPES.PRODUCT);
  assert.ok(packet.reviewSummary.includes("Human review"));
  assertBoundary(packet);
  pass("/Presentación creates sales artifact review packet only");
}

{
  const packet = buildAlfredReviewActionPacket("/Mejora este mensaje Hola Juan te busco para hablar de retiro y ver cuando podemos agendar.");
  assert.equal(packet.packetType, PACKET_TYPES.MESSAGE);
  assert.equal(packet.messageDraftCandidate.sendsMessage, false);
  assert.equal(packet.messageDraftCandidate.notSendable, true);
  assert.equal(packet.safety.sendMessageRequiresConfirmation, true);
  assertBoundary(packet);
  pass("/Mejora este mensaje creates message draft review packet without sending");
}

{
  const packet = buildAlfredReviewActionPacket("/Follow Juan retiro proxima semana");
  assert.equal(packet.packetType, PACKET_TYPES.FOLLOW_UP);
  assert.equal(packet.followUpCandidate.createsTask, false);
  assert.ok(packet.proposedActions.some((action) => action.actionType === "prepare_follow_up"));
  assertBoundary(packet);
  pass("/Follow creates follow-up review packet without task creation");
}

{
  const packet = buildAlfredReviewActionPacket("/Chatbot ayudame a preparar una cita de retiro con Maria");
  assert.equal(packet.packetType, PACKET_TYPES.CHATBOT);
  assert.equal(packet.safety.executesRuntime, false);
  assert.ok(packet.proposedActions.some((action) => action.actionType === "open_review_context"));
  assertBoundary(packet);
  pass("/Chatbot creates context review packet without runtime execution");
}

{
  const packet = buildAlfredReviewActionPacket("Juan retiro próxima semana");
  assert.equal(packet.packetType, PACKET_TYPES.INDEX);
  assert.equal(packet.safety.liveSearchEnabled, false);
  assertBoundary(packet);
  pass("Plain text creates universal index review packet without live search");
}

{
  const packet = buildAlfredReviewActionPacket("/Memoria Tengo cita con Maria el viernes a las 11", { voiceTranscriptionPreview: true });
  assert.equal(packet.packetType, PACKET_TYPES.VOICE);
  assert.equal(packet.voice.transcriptionPreviewOnly, true);
  assert.equal(packet.voice.audioRuntimeEnabled, false);
  assert.equal(packet.voice.speechEngineEnabled, false);
  assertBoundary(packet);
  pass("Voice transcription preview maps to voice review packet without audio runtime");
}

{
  const source = buildAlfredReadModel("/Cotizar Juan retiro");
  const original = JSON.stringify(source);
  const packet = buildPacketFromAlfredReadModel(source);
  assert.equal(packet.packetType, PACKET_TYPES.PRODUCT);
  assert.equal(JSON.stringify(source), original);
  assertBoundary(packet);
  pass("buildPacketFromAlfredReadModel does not mutate source read model");
}

{
  const source = buildAlfredReadModel("/Agenda Tengo cita con Maria");
  const packet = buildPacketFromAlfredReadModel(source);
  assert.equal(derivePacketType(source), PACKET_TYPES.CALENDAR);
  assert.ok(packet.uncertainty.some((item) => item.includes("Calendar")));
  assert.ok(packet.humanReviewQuestions.some((item) => item.includes("incomplete") || item.includes("Confirm")));
  assertBoundary(packet);
  pass("Incomplete calendar packet surfaces uncertainty instead of creating event");
}

{
  const packetA = buildAlfredReviewActionPacket("/Referido Luis Perez es referido de Giovanni Islas");
  const packetB = buildAlfredReviewActionPacket("/Referido Luis Perez es referido de Giovanni Islas");
  assert.equal(packetA.packetId, packetB.packetId);
  assertBoundary(packetA);
  pass("Packet id is deterministic for same input");
}

{
  const packet = buildAlfredReviewActionPacket("/Bonos Juan");
  assert.equal(packet.packetType, PACKET_TYPES.PRODUCT);
  assert.equal(packet.safety.createsRevenueTruth, false);
  assert.equal(packet.safety.createsCompensationTruth, false);
  assert.equal(packet.safety.createsPayoutTruth, false);
  assertBoundary(packet);
  pass("/Bonos remains product/compensation preview without truth creation");
}

{
  const packet = buildAlfredReviewActionPacket("/Comisiones Juan");
  assert.equal(packet.packetType, PACKET_TYPES.PRODUCT);
  assert.ok(packet.forbiddenActions.includes("create_commission_truth"));
  assertBoundary(packet);
  pass("/Comisiones remains review packet with commission truth forbidden");
}

{
  const packet = buildAlfredReviewActionPacket("/Juan");
  assert.equal(packet.packetType, PACKET_TYPES.INDEX);
  assert.equal(packet.confirmationRequired, true);
  assert.equal(packet.humanReview.allowedNextStep, "HUMAN_REVIEW_ONLY");
  assertBoundary(packet);
  pass("Unknown slash command falls to universal index review packet");
}

{
  const serialized = JSON.stringify(buildAlfredReviewActionPacket("/Cotizar Juan retiro"));
  const forbiddenTruePatterns = [
    '"createsTruth":true',
    '"executesRuntime":true',
    '"sendsMessage":true',
    '"writesCrm":true',
    '"createsCalendarEvent":true',
    '"createsTask":true',
    '"createsRevenueTruth":true',
    '"createsCompensationTruth":true',
    '"createsPayoutTruth":true',
    '"audioRuntimeEnabled":true',
    '"speechEngineEnabled":true',
    '"liveSearchEnabled":true',
    '"providerRuntimeEnabled":true',
  ];
  for (const pattern of forbiddenTruePatterns) {
    assert.equal(serialized.includes(pattern), false, pattern);
  }
  pass("Serialized packet contains no forbidden true execution flags");
}

console.log(`Alfred Review Action Packet Read Model PASS ${passCount}/20`);
