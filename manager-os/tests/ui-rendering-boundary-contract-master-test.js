const assert = require('assert');
const {
  buildUiRenderingBoundary,
  UI_RENDERING_STATUSES,
  UI_RENDERING_DECISIONS,
  UI_RENDERING_ALLOWED_USES,
  UI_RENDERING_FORBIDDEN_USES,
} = require('../ui-rendering/ui-rendering-boundary-contract');

function futureDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function validInput(overrides = {}) {
  return {
    uiRenderingRequestId: 'ui-rendering-1',
    canonicalTruthRegistryRequestId: 'canonical-registry-1',
    truthPromotionRequestId: 'truth-promotion-1',
    auditPersistenceRequestId: 'audit-persistence-1',
    uiReadModelRequestId: 'ui-read-model-1',
    advisorId: 'advisor-1',
    managerId: 'manager-1',
    personId: 'maria-1',
    personType: 'prospect',
    viewerId: 'advisor-1',
    viewerRole: 'ADVISOR',
    cardType: 'FORGE_ALIVE_CARD',
    canonicalTruthRegistrySnapshot: {
      canonicalTruthRegistryRequestId: 'canonical-registry-1',
      truthPromotionRequestId: 'truth-promotion-1',
      auditPersistenceRequestId: 'audit-persistence-1',
      uiReadModelRequestId: 'ui-read-model-1',
      eligibleForCanonicalTruthEntryPreparation: true,
      approvedForCanonicalTruthWrite: false,
      writesCanonicalTruth: false,
      createsBusinessTruth: false,
      createsMetricTruth: false,
      canonicalTruthEntryCandidate: {
        canonicalKey: 'DELIVERY_SYSTEM:DELIVERY_STATUS:idempotency-1',
        candidateFactType: 'DELIVERY_STATUS',
        candidateFactValue: 'DELIVERED_STATUS',
        candidateFactOwner: 'DELIVERY_SYSTEM',
        idempotencyKey: 'idempotency-1',
        immutableSourceTrace: {
          evidenceRefs: ['ev1', 'ev2'],
          sourceEvidenceIds: ['ev1', 'ev2'],
          sourceOwners: ['CanonicalTruthRegistryBoundary', 'TruthPromotionBoundary'],
        },
        writesCanonicalTruth: false,
        createsBusinessTruth: false,
        createsMetricTruth: false,
      },
      uiPresentationModelCandidate: {
        visibleStatusLabel: 'DELIVERED_STATUS',
        visibleSeverity: 'INFO',
        visibleReasonWhy: 'Provider event is ready for read-only review.',
        visibleNextAction: 'Review before action.',
        rendersUi: false,
        persistsReadModel: false,
        createsDeliveryTruth: false,
      },
      warnings: ['canonical entry candidate only'],
      limitations: ['not canonical truth write'],
    },
    canonicalTruthEntryCandidate: {
      canonicalKey: 'DELIVERY_SYSTEM:DELIVERY_STATUS:idempotency-1',
      candidateFactType: 'DELIVERY_STATUS',
      candidateFactValue: 'DELIVERED_STATUS',
      candidateFactOwner: 'DELIVERY_SYSTEM',
      idempotencyKey: 'idempotency-1',
      immutableSourceTrace: {
        evidenceRefs: ['ev1', 'ev2'],
        sourceEvidenceIds: ['ev1', 'ev2'],
        sourceOwners: ['CanonicalTruthRegistryBoundary', 'TruthPromotionBoundary'],
      },
      writesCanonicalTruth: false,
      createsBusinessTruth: false,
      createsMetricTruth: false,
    },
    uiPresentationModelCandidate: {
      visibleStatusLabel: 'DELIVERED_STATUS',
      visibleSeverity: 'INFO',
      visibleReasonWhy: 'Provider event is ready for read-only review.',
      visibleNextAction: 'Review before action.',
      rendersUi: false,
      persistsReadModel: false,
      createsDeliveryTruth: false,
    },
    forgeAliveCardCandidate: {
      cardType: 'FORGE_ALIVE_CARD',
      readOnly: true,
    },
    visibleStatus: 'DELIVERED_STATUS',
    visibleSeverity: 'INFO',
    visibleReasonWhy: 'Forge can show this safely as review context.',
    visibleNextReviewAction: 'Review evidence before taking action.',
    displayPolicySnapshot: {
      reviewed: true,
      allowed: true,
      approvedForUiRendering: false,
      rendersUi: false,
      createsDashboard: false,
      createsRoute: false,
    },
    safetyPolicySnapshot: {
      reviewed: true,
      allowed: true,
      interactiveActionAllowed: false,
      executesAction: false,
      sendsMessage: false,
      manipulationAllowed: false,
    },
    privacyPolicySnapshot: {
      reviewed: true,
      allowed: true,
      surveillanceAllowed: false,
      exposesRestrictedData: false,
      personalityTruthAllowed: false,
    },
    interactionPolicySnapshot: {
      reviewed: true,
      allowed: true,
      interactiveActionAllowed: false,
      componentExecutionAllowed: false,
      routeCreationAllowed: false,
      crmMutationAllowed: false,
    },
    sourceEvidence: [
      { id: 'ev1', sourceOwner: 'CanonicalTruthRegistryBoundary' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'TruthPromotionBoundary' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'TruthPromotionBoundary' },
    ],
    sourceFreshness: {
      fresh: true,
      asOf: new Date().toISOString(),
    },
    auditTrail: {
      auditTrailId: 'audit-1',
      entries: ['canonical-truth-registry-reviewed'],
    },
    idempotencyKey: 'idempotency-1',
    immutableSourceTrace: {
      evidenceRefs: ['ev1', 'ev2'],
      sourceEvidenceIds: ['ev1', 'ev2'],
      sourceOwners: ['CanonicalTruthRegistryBoundary', 'TruthPromotionBoundary'],
    },
    visibleWarnings: ['visible warning'],
    visibleLimitations: ['visible limitation'],
    warnings: ['ui rendering warning'],
    limitations: ['ui rendering limitation'],
    requestedUse: 'READ_ONLY_RENDER_MODEL_PREP',
    now: new Date().toISOString(),
    expiresAt: futureDate(),
    ...overrides,
  };
}

function assertNoRenderTruthOrActions(output) {
  assert.strictEqual(output.approvedForUiRendering, false);
  assert.strictEqual(output.rendersUi, false);
  assert.strictEqual(output.createsDashboard, false);
  assert.strictEqual(output.createsRoute, false);
  assert.strictEqual(output.executesComponent, false);
  assert.strictEqual(output.componentExecutionAllowed, false);
  assert.strictEqual(output.interactiveActionAllowed, false);
  assert.strictEqual(output.persistsUiState, false);
  assert.strictEqual(output.writesCanonicalTruth, false);
  assert.strictEqual(output.createsBusinessTruth, false);
  assert.strictEqual(output.createsMetricTruth, false);
  assert.strictEqual(output.createsEconomicTruth, false);
  assert.strictEqual(output.createsDeliveryTruth, false);
  assert.strictEqual(output.createsMessageTruth, false);
  assert.strictEqual(output.createsCompensationTruth, false);
  assert.strictEqual(output.createsPayoutTruth, false);
  assert.strictEqual(output.createsRevenueTruth, false);
  assert.strictEqual(output.createsRankingTruth, false);
  assert.strictEqual(output.createsPunishmentTruth, false);
  assert.strictEqual(output.createsHrTruth, false);
  assert.strictEqual(output.createsPersonalityTruth, false);
  assert.strictEqual(output.createsAdvisorLifecycleTruth, false);
  assert.strictEqual(output.createsTask, false);
  assert.strictEqual(output.createsCalendarEvent, false);
  assert.strictEqual(output.mutatesCrm, false);
  assert.strictEqual(output.providerApiCallAllowed, false);
  assert.strictEqual(output.externalApiCallAllowed, false);
  assert.strictEqual(output.executesAction, false);
  assert.strictEqual(output.sendsMessage, false);
}

const tests = [];

tests.push(['missing Canonical Truth Registry snapshot blocks render model candidate preparation', () => {
  assert.ok(UI_RENDERING_ALLOWED_USES.includes('READ_ONLY_RENDER_MODEL_PREP'));
  assert.ok(UI_RENDERING_FORBIDDEN_USES.includes('UI_RENDERING'));
  assert.ok(UI_RENDERING_DECISIONS.APPROVE_READ_ONLY_RENDER_MODEL_CANDIDATE);
  const output = buildUiRenderingBoundary(validInput({ canonicalTruthRegistrySnapshot: null }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_CANONICAL_TRUTH_REGISTRY);
  assertNoRenderTruthOrActions(output);
}]);

tests.push(['missing canonical truth entry candidate blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ canonicalTruthEntryCandidate: null, canonicalTruthRegistrySnapshot: { eligibleForCanonicalTruthEntryPreparation: true } }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_CANONICAL_TRUTH_ENTRY_CANDIDATE);
}]);

tests.push(['missing UI presentation model blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ uiPresentationModelCandidate: null, canonicalTruthRegistrySnapshot: { eligibleForCanonicalTruthEntryPreparation: true, canonicalTruthEntryCandidate: { idempotencyKey: 'idempotency-1' } } }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_UI_PRESENTATION_MODEL);
}]);

tests.push(['missing display policy blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ displayPolicySnapshot: null }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_DISPLAY_POLICY);
}]);

tests.push(['missing safety policy blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ safetyPolicySnapshot: null }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_SAFETY_POLICY);
}]);

tests.push(['missing privacy policy blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ privacyPolicySnapshot: null }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_PRIVACY_POLICY);
}]);

tests.push(['missing interaction policy blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ interactionPolicySnapshot: null }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_INTERACTION_POLICY);
}]);

tests.push(['missing viewer role blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ viewerRole: '' }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_VIEWER_ROLE);
}]);

tests.push(['missing source evidence blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ sourceEvidence: [] }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_SOURCE_EVIDENCE);
}]);

tests.push(['missing source owner blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ sourceEvidence: [{ id: 'ev1' }] }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_SOURCE_OWNER);
}]);

tests.push(['missing source freshness blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ sourceFreshness: null }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_SOURCE_FRESHNESS);
}]);

tests.push(['stale source freshness blocks or requires review', () => {
  const output = buildUiRenderingBoundary(validInput({ sourceFreshness: { stale: true } }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.STALE_SOURCE_FRESHNESS);
}]);

tests.push(['missing idempotency key blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ idempotencyKey: '', canonicalTruthEntryCandidate: { candidateFactValue: 'DELIVERED_STATUS' } }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_IDEMPOTENCY_KEY);
}]);

tests.push(['missing audit trail blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ auditTrail: null }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.NEEDS_AUDIT_TRAIL);
}]);

tests.push(['unsupported viewer role blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ viewerRole: 'VISITOR' }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.UNSUPPORTED_VIEWER_ROLE);
  assert.strictEqual(output.decision, UI_RENDERING_DECISIONS.NOT_MODELED);
}]);

tests.push(['unsupported card type blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ cardType: 'UNKNOWN_CARD' }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.UNSUPPORTED_CARD_TYPE);
  assert.strictEqual(output.decision, UI_RENDERING_DECISIONS.NOT_MODELED);
}]);

tests.push(['expired UI rendering window blocks', () => {
  const output = buildUiRenderingBoundary(validInput({ expiresAt: new Date(Date.now() - 1000).toISOString() }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.EXPIRED_UI_RENDERING_WINDOW);
  assert.strictEqual(output.decision, UI_RENDERING_DECISIONS.EXPIRED);
}]);

tests.push(['read-only render model candidate can be prepared', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.APPROVED_FOR_READ_ONLY_RENDER_MODEL_CANDIDATE);
  assert.strictEqual(output.eligibleForReadOnlyRenderModel, true);
  assert.ok(output.forgeAliveRenderModelCandidate);
}]);

tests.push(['actual UI rendering remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.rendersUi, false);
  assert.strictEqual(output.forgeAliveRenderModelCandidate.rendersUi, false);
}]);

tests.push(['dashboard creation remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.createsDashboard, false);
  assert.strictEqual(output.forgeAliveRenderModelCandidate.createsDashboard, false);
}]);

tests.push(['route component execution remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.createsRoute, false);
  assert.strictEqual(output.executesComponent, false);
  assert.strictEqual(output.forgeAliveRenderModelCandidate.executesComponent, false);
}]);

tests.push(['interactive action remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.interactiveActionAllowed, false);
  assert.strictEqual(output.readOnlyActionCardCandidate.interactiveActionAllowed, false);
}]);

tests.push(['UI state persistence remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.persistsUiState, false);
  assert.strictEqual(output.forgeAliveRenderModelCandidate.persistsUiState, false);
}]);

tests.push(['canonical truth write remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.writesCanonicalTruth, false);
  assert.strictEqual(output.forgeAliveRenderModelCandidate.writesCanonicalTruth, false);
}]);

tests.push(['business metric economic truth creation remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.createsBusinessTruth, false);
  assert.strictEqual(output.createsMetricTruth, false);
  assert.strictEqual(output.createsEconomicTruth, false);
}]);

tests.push(['delivery message truth creation remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.createsDeliveryTruth, false);
  assert.strictEqual(output.createsMessageTruth, false);
}]);

tests.push(['compensation revenue payout truth remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.createsCompensationTruth, false);
  assert.strictEqual(output.createsRevenueTruth, false);
  assert.strictEqual(output.createsPayoutTruth, false);
}]);

tests.push(['ranking punishment HR personality truth remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.createsRankingTruth, false);
  assert.strictEqual(output.createsPunishmentTruth, false);
  assert.strictEqual(output.createsHrTruth, false);
  assert.strictEqual(output.createsPersonalityTruth, false);
}]);

tests.push(['advisor lifecycle truth remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.createsAdvisorLifecycleTruth, false);
}]);

tests.push(['task calendar creation remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.createsTask, false);
  assert.strictEqual(output.createsCalendarEvent, false);
}]);

tests.push(['CRM mutation remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.mutatesCrm, false);
}]);

tests.push(['provider external API calls remain false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.providerApiCallAllowed, false);
  assert.strictEqual(output.externalApiCallAllowed, false);
}]);

tests.push(['send action execution remains false', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.sendsMessage, false);
  assert.strictEqual(output.executesAction, false);
}]);

tests.push(['forbidden uses are blocked', () => {
  const output = buildUiRenderingBoundary(validInput({ requestedUse: 'UI_RENDERING' }));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('UI_RENDERING'));
}]);

tests.push(['allowed uses are allowed', () => {
  const output = buildUiRenderingBoundary(validInput({ requestedUse: 'FORGE_ALIVE_CARD_PREP' }));
  assert.ok(output.allowedUses.includes('FORGE_ALIVE_CARD_PREP'));
  assert.strictEqual(output.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.APPROVED_FOR_READ_ONLY_RENDER_MODEL_CANDIDATE);
}]);

tests.push(['inputs are not mutated', () => {
  const input = validInput();
  const before = JSON.stringify(input);
  buildUiRenderingBoundary(input);
  assert.strictEqual(JSON.stringify(input), before);
}]);

tests.push(['evidence source sourceOwners dedupe', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.deepStrictEqual(output.evidenceRefs.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceEvidenceIds.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceOwners.sort(), ['CanonicalTruthRegistryBoundary', 'TruthPromotionBoundary'].sort());
}]);

tests.push(['warnings and limitations remain visible', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.ok(output.visibleWarnings.includes('visible warning'));
  assert.ok(output.visibleWarnings.includes('ui rendering warning'));
  assert.ok(output.visibleWarnings.includes('canonical entry candidate only'));
  assert.ok(output.visibleLimitations.includes('visible limitation'));
  assert.ok(output.visibleLimitations.includes('ui rendering limitation'));
  assert.ok(output.visibleLimitations.includes('not canonical truth write'));
}]);

tests.push(['immutable source trace remains visible', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.ok(output.forgeAliveRenderModelCandidate.immutableSourceTrace);
  assert.deepStrictEqual(output.forgeAliveRenderModelCandidate.immutableSourceTrace.sourceEvidenceIds.sort(), ['ev1', 'ev2'].sort());
}]);

tests.push(['Forge Alive card candidate is read-only', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.forgeAliveRenderModelCandidate.readOnly, true);
  assert.strictEqual(output.readOnlyActionCardCandidate.readOnly, true);
  assert.strictEqual(output.readOnlyActionCardCandidate.executesAction, false);
}]);

tests.push(['Metric Economic Truth remains separate', () => {
  const output = buildUiRenderingBoundary(validInput());
  assert.strictEqual(output.metricEconomicTruthRemainsSeparate, true);
}]);

tests.push(['explicit zero false values are preserved as display context not missing', () => {
  const zeroOutput = buildUiRenderingBoundary(validInput({ visibleStatus: 0, canonicalTruthEntryCandidate: { idempotencyKey: 'idempotency-1', candidateFactValue: 0 } }));
  assert.strictEqual(zeroOutput.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.APPROVED_FOR_READ_ONLY_RENDER_MODEL_CANDIDATE);
  assert.strictEqual(zeroOutput.forgeAliveRenderModelCandidate.visibleStatus, 0);

  const falseOutput = buildUiRenderingBoundary(validInput({ visibleStatus: false, canonicalTruthEntryCandidate: { idempotencyKey: 'idempotency-1', candidateFactValue: false } }));
  assert.strictEqual(falseOutput.uiRenderingBoundaryStatus, UI_RENDERING_STATUSES.APPROVED_FOR_READ_ONLY_RENDER_MODEL_CANDIDATE);
  assert.strictEqual(falseOutput.forgeAliveRenderModelCandidate.visibleStatus, false);
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

console.log(`UI Rendering Boundary Contract PASS ${passed}/${tests.length}`);
