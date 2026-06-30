const assert = require('assert');
const {
  buildUiReadModelBoundary,
  UI_READ_MODEL_STATUSES,
  UI_READ_MODEL_DECISIONS,
  UI_READ_MODEL_ALLOWED_USES,
  UI_READ_MODEL_FORBIDDEN_USES,
} = require('../ui-read-model/ui-read-model-boundary-contract');

function futureDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function validInput(overrides = {}) {
  return {
    uiReadModelRequestId: 'ui-read-model-1',
    providerWebhookBoundaryRequestId: 'provider-webhook-1',
    externalDispatchRequestId: 'external-dispatch-1',
    sendRequestId: 'send-1',
    advisorId: 'advisor-1',
    managerId: 'manager-1',
    personId: 'maria-1',
    personType: 'prospect',
    roleViewing: 'ADVISOR',
    providerWebhookSnapshot: {
      providerWebhookBoundaryRequestId: 'provider-webhook-1',
      externalDispatchRequestId: 'external-dispatch-1',
      sendRequestId: 'send-1',
      approvedForWebhookIntakeReview: true,
      approvedForWebhookSideEffects: false,
      webhookSideEffectAllowed: false,
      externalApiCallAllowed: false,
      providerApiCallAllowed: false,
      createsDeliveryTruth: false,
      createsMessageTruth: false,
      providerEventType: 'DELIVERED_STATUS',
      providerMessageRef: 'provider-message-1',
      providerEventReadModelCandidate: {
        providerName: 'MOCK_PROVIDER',
        channel: 'WHATSAPP',
        providerMessageRef: 'provider-message-1',
        providerEventType: 'DELIVERED_STATUS',
        createsDeliveryTruth: false,
        createsMessageTruth: false,
      },
      warnings: ['provider event candidate only'],
      limitations: ['not delivery truth'],
    },
    providerEventReadModelCandidate: {
      providerName: 'MOCK_PROVIDER',
      channel: 'WHATSAPP',
      providerMessageRef: 'provider-message-1',
      providerEventType: 'DELIVERED_STATUS',
      createsDeliveryTruth: false,
      createsMessageTruth: false,
    },
    statusLabel: 'DELIVERED_STATUS',
    statusSeverity: 'INFO',
    recommendedVisibleAction: 'Review delivery status with context',
    reasonWhySummary: 'Provider event candidate is visible but not truth.',
    displayPolicySnapshot: {
      reviewed: true,
      allowed: true,
      rendersUi: false,
      dashboardCreationAllowed: false,
    },
    readModelPolicySnapshot: {
      reviewed: true,
      allowed: true,
      persistsReadModel: false,
      persistenceWriteAllowed: false,
      createsDeliveryTruth: false,
      createsMessageTruth: false,
    },
    visibilityPolicySnapshot: {
      reviewed: true,
      allowed: true,
      allowedRoles: ['ADVISOR', 'MANAGER'],
    },
    sourceEvidence: [
      { id: 'ev1', sourceOwner: 'ProviderWebhookBoundary' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'ExternalDispatchBoundary' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'ExternalDispatchBoundary' },
    ],
    sourceFreshness: {
      fresh: true,
      asOf: new Date().toISOString(),
    },
    auditTrail: {
      auditTrailId: 'audit-1',
      entries: ['provider-webhook-reviewed'],
    },
    warnings: ['display warning'],
    limitations: ['display limitation'],
    requestedUse: 'READ_ONLY_PRESENTATION_MODEL_PREP',
    now: new Date().toISOString(),
    expiresAt: futureDate(),
    ...overrides,
  };
}

function assertNoSideEffects(output) {
  assert.strictEqual(output.approvedForUiRendering, false);
  assert.strictEqual(output.rendersUi, false);
  assert.strictEqual(output.persistsReadModel, false);
  assert.strictEqual(output.createsDeliveryTruth, false);
  assert.strictEqual(output.createsMessageTruth, false);
  assert.strictEqual(output.createsTask, false);
  assert.strictEqual(output.createsCalendarEvent, false);
  assert.strictEqual(output.createsCompensationTruth, false);
  assert.strictEqual(output.createsPayoutTruth, false);
  assert.strictEqual(output.createsRevenueTruth, false);
  assert.strictEqual(output.createsRankingTruth, false);
  assert.strictEqual(output.createsPunishmentTruth, false);
  assert.strictEqual(output.createsHrTruth, false);
  assert.strictEqual(output.createsPersonalityTruth, false);
  assert.strictEqual(output.executesAction, false);
  assert.strictEqual(output.sendsMessage, false);
  assert.strictEqual(output.providerApiCallAllowed, false);
  assert.strictEqual(output.externalApiCallAllowed, false);
  assert.strictEqual(output.crmMutationAllowed, false);
  assert.strictEqual(output.automaticFollowUpAllowed, false);
  assert.strictEqual(output.automaticRetryAllowed, false);
}

const tests = [];

tests.push(['exports constants', () => {
  assert.ok(UI_READ_MODEL_ALLOWED_USES.includes('READ_ONLY_PRESENTATION_MODEL_PREP'));
  assert.ok(UI_READ_MODEL_FORBIDDEN_USES.includes('UI_RENDERING'));
  assert.ok(UI_READ_MODEL_STATUSES.APPROVED_FOR_READ_ONLY_PRESENTATION_MODEL);
  assert.ok(UI_READ_MODEL_DECISIONS.APPROVE_READ_ONLY_PRESENTATION_MODEL);
}]);

tests.push(['missing Provider Webhook snapshot blocks presentation model preparation', () => {
  const output = buildUiReadModelBoundary(validInput({ providerWebhookSnapshot: null }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.NEEDS_PROVIDER_WEBHOOK);
  assertNoSideEffects(output);
}]);

tests.push(['missing provider event read model candidate blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ providerEventReadModelCandidate: null, providerWebhookSnapshot: { approvedForWebhookIntakeReview: true } }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.NEEDS_PROVIDER_EVENT_READ_MODEL);
}]);

tests.push(['missing display policy blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ displayPolicySnapshot: null }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.NEEDS_DISPLAY_POLICY);
}]);

tests.push(['missing read model policy blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ readModelPolicySnapshot: null }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.NEEDS_READ_MODEL_POLICY);
}]);

tests.push(['missing visibility policy blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ visibilityPolicySnapshot: null }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.NEEDS_VISIBILITY_POLICY);
}]);

tests.push(['missing source evidence blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ sourceEvidence: [] }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.NEEDS_SOURCE_EVIDENCE);
}]);

tests.push(['missing source owner blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ sourceEvidence: [{ id: 'ev1' }] }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.NEEDS_SOURCE_OWNER);
}]);

tests.push(['missing source freshness blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ sourceFreshness: null }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.NEEDS_SOURCE_FRESHNESS);
}]);

tests.push(['stale source freshness blocks or requires review', () => {
  const output = buildUiReadModelBoundary(validInput({ sourceFreshness: { stale: true } }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.STALE_SOURCE_FRESHNESS);
}]);

tests.push(['missing audit trail blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ auditTrail: null }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.NEEDS_AUDIT_TRAIL);
}]);

tests.push(['unsupported viewer role blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ roleViewing: 'VISITOR' }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.UNSUPPORTED_VIEWER_ROLE);
  assert.strictEqual(output.decision, UI_READ_MODEL_DECISIONS.NOT_MODELED);
}]);

tests.push(['unsupported status blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ statusLabel: 'UNKNOWN_STATUS' }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.UNSUPPORTED_STATUS);
  assert.strictEqual(output.decision, UI_READ_MODEL_DECISIONS.NOT_MODELED);
}]);

tests.push(['expired read model window blocks', () => {
  const output = buildUiReadModelBoundary(validInput({ expiresAt: new Date(Date.now() - 1000).toISOString() }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.EXPIRED_READ_MODEL_WINDOW);
  assert.strictEqual(output.decision, UI_READ_MODEL_DECISIONS.EXPIRED);
}]);

tests.push(['UI presentation model candidate can be prepared', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.APPROVED_FOR_READ_ONLY_PRESENTATION_MODEL);
  assert.strictEqual(output.approvedForReadOnlyPresentationModel, true);
  assert.ok(output.uiPresentationModelCandidate);
}]);

tests.push(['actual UI rendering remains false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.rendersUi, false);
  assert.strictEqual(output.uiPresentationModelCandidate.rendersUi, false);
}]);

tests.push(['read model persistence remains false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.persistsReadModel, false);
  assert.strictEqual(output.uiPresentationModelCandidate.persistsReadModel, false);
}]);

tests.push(['delivery truth creation remains false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.createsDeliveryTruth, false);
  assert.strictEqual(output.uiPresentationModelCandidate.createsDeliveryTruth, false);
}]);

tests.push(['message truth creation remains false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.createsMessageTruth, false);
  assert.strictEqual(output.uiPresentationModelCandidate.createsMessageTruth, false);
}]);

tests.push(['task calendar creation remains false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.createsTask, false);
  assert.strictEqual(output.createsCalendarEvent, false);
}]);

tests.push(['CRM mutation remains false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.crmMutationAllowed, false);
}]);

tests.push(['provider and external API calls remain false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.providerApiCallAllowed, false);
  assert.strictEqual(output.externalApiCallAllowed, false);
}]);

tests.push(['automatic follow-up and retry remain false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.automaticFollowUpAllowed, false);
  assert.strictEqual(output.automaticRetryAllowed, false);
}]);

tests.push(['send execution remains false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.sendsMessage, false);
  assert.strictEqual(output.executesAction, false);
}]);

tests.push(['compensation revenue payout truth remains false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.createsCompensationTruth, false);
  assert.strictEqual(output.createsRevenueTruth, false);
  assert.strictEqual(output.createsPayoutTruth, false);
}]);

tests.push(['ranking punishment HR personality truth remains false', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.strictEqual(output.createsRankingTruth, false);
  assert.strictEqual(output.createsPunishmentTruth, false);
  assert.strictEqual(output.createsHrTruth, false);
  assert.strictEqual(output.createsPersonalityTruth, false);
}]);

tests.push(['forbidden uses are blocked', () => {
  const output = buildUiReadModelBoundary(validInput({ requestedUse: 'UI_RENDERING' }));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('UI_RENDERING'));
}]);

tests.push(['allowed uses are allowed', () => {
  const output = buildUiReadModelBoundary(validInput({ requestedUse: 'ADVISOR_ACTION_CARD_PREP' }));
  assert.ok(output.allowedUses.includes('ADVISOR_ACTION_CARD_PREP'));
  assert.strictEqual(output.uiReadModelStatus, UI_READ_MODEL_STATUSES.APPROVED_FOR_READ_ONLY_PRESENTATION_MODEL);
}]);

tests.push(['inputs are not mutated', () => {
  const input = validInput();
  const before = JSON.stringify(input);
  buildUiReadModelBoundary(input);
  assert.strictEqual(JSON.stringify(input), before);
}]);

tests.push(['evidence source sourceOwners dedupe and warnings limitations visible', () => {
  const output = buildUiReadModelBoundary(validInput());
  assert.deepStrictEqual(output.evidenceRefs.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceEvidenceIds.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceOwners.sort(), ['ProviderWebhookBoundary', 'ExternalDispatchBoundary'].sort());
  assert.ok(output.visibleWarnings.includes('display warning'));
  assert.ok(output.visibleWarnings.includes('provider event candidate only'));
  assert.ok(output.visibleLimitations.includes('display limitation'));
  assert.ok(output.visibleLimitations.includes('not delivery truth'));
}]);

let passed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

console.log(`UI Read Model Boundary Contract PASS ${passed}/${tests.length}`);
