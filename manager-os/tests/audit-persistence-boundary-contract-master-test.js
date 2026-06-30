const assert = require('assert');
const {
  buildAuditPersistenceBoundary,
  AUDIT_PERSISTENCE_STATUSES,
  AUDIT_PERSISTENCE_DECISIONS,
  AUDIT_PERSISTENCE_ALLOWED_USES,
  AUDIT_PERSISTENCE_FORBIDDEN_USES,
} = require('../audit-persistence/audit-persistence-boundary-contract');

function futureDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function validInput(overrides = {}) {
  return {
    auditPersistenceRequestId: 'audit-persistence-1',
    uiReadModelRequestId: 'ui-read-model-1',
    providerWebhookBoundaryRequestId: 'provider-webhook-1',
    externalDispatchRequestId: 'external-dispatch-1',
    advisorId: 'advisor-1',
    managerId: 'manager-1',
    personId: 'maria-1',
    personType: 'prospect',
    actorId: 'advisor-1',
    actorRole: 'ADVISOR',
    uiReadModelSnapshot: {
      uiReadModelRequestId: 'ui-read-model-1',
      providerWebhookBoundaryRequestId: 'provider-webhook-1',
      externalDispatchRequestId: 'external-dispatch-1',
      approvedForReadOnlyPresentationModel: true,
      approvedForUiRendering: false,
      rendersUi: false,
      persistsReadModel: false,
      createsDeliveryTruth: false,
      createsMessageTruth: false,
      uiPresentationModelCandidate: {
        visibleStatusLabel: 'DELIVERED_STATUS',
        visibleSeverity: 'INFO',
        approvedForUiRendering: false,
        rendersUi: false,
        persistsReadModel: false,
        createsDeliveryTruth: false,
      },
      warnings: ['read model candidate only'],
      limitations: ['not truth'],
    },
    uiPresentationModelCandidate: {
      visibleStatusLabel: 'DELIVERED_STATUS',
      visibleSeverity: 'INFO',
      approvedForUiRendering: false,
      rendersUi: false,
      persistsReadModel: false,
      createsDeliveryTruth: false,
    },
    auditEventCandidate: {
      eventType: 'UI_READ_MODEL_REVIEWED',
      boundary: 'UI_READ_MODEL',
      occurredAt: new Date().toISOString(),
      createsBusinessTruth: false,
    },
    persistenceRecordCandidate: {
      recordType: 'UI_READ_MODEL_AUDIT',
      idempotencyKey: 'idempotency-1',
      writesFile: false,
      writesDatabase: false,
      createsBusinessTruth: false,
    },
    recordType: 'UI_READ_MODEL_AUDIT',
    retentionPolicySnapshot: {
      reviewed: true,
      allowed: true,
      retentionClass: 'AUDIT_CANDIDATE',
      persistsRecord: false,
      writesFile: false,
      writesDatabase: false,
    },
    persistencePolicySnapshot: {
      reviewed: true,
      allowed: true,
      approvedForPersistenceWrite: false,
      persistsRecord: false,
      writesFile: false,
      writesDatabase: false,
      createsBusinessTruth: false,
    },
    immutabilityPolicySnapshot: {
      reviewed: true,
      allowed: true,
      immutableCandidate: true,
      mutableRecordAllowed: false,
      crmMutationAllowed: false,
    },
    privacyPolicySnapshot: {
      reviewed: true,
      allowed: true,
      exposesRestrictedData: false,
      surveillanceAllowed: false,
    },
    idempotencyKey: 'idempotency-1',
    sourceEvidence: [
      { id: 'ev1', sourceOwner: 'UIReadModelBoundary' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'ProviderWebhookBoundary' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'ProviderWebhookBoundary' },
    ],
    sourceFreshness: {
      fresh: true,
      asOf: new Date().toISOString(),
    },
    auditTrail: {
      auditTrailId: 'audit-1',
      entries: ['ui-read-model-reviewed'],
    },
    warnings: ['audit warning'],
    limitations: ['audit limitation'],
    requestedUse: 'PERSISTENCE_CANDIDATE_PREP',
    now: new Date().toISOString(),
    expiresAt: futureDate(),
    ...overrides,
  };
}

function assertNoWritesTruthOrActions(output) {
  assert.strictEqual(output.approvedForPersistenceWrite, false);
  assert.strictEqual(output.persistsRecord, false);
  assert.strictEqual(output.writesFile, false);
  assert.strictEqual(output.writesDatabase, false);
  assert.strictEqual(output.mutatesCrm, false);
  assert.strictEqual(output.createsBusinessTruth, false);
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
  assert.strictEqual(output.rendersUi, false);
  assert.strictEqual(output.executesAction, false);
  assert.strictEqual(output.sendsMessage, false);
  assert.strictEqual(output.providerApiCallAllowed, false);
  assert.strictEqual(output.externalApiCallAllowed, false);
}

const tests = [];

tests.push(['exports constants', () => {
  assert.ok(AUDIT_PERSISTENCE_ALLOWED_USES.includes('PERSISTENCE_CANDIDATE_PREP'));
  assert.ok(AUDIT_PERSISTENCE_FORBIDDEN_USES.includes('PERSISTENCE_WRITE'));
  assert.ok(AUDIT_PERSISTENCE_STATUSES.APPROVED_FOR_PERSISTENCE_CANDIDATE_PREPARATION);
  assert.ok(AUDIT_PERSISTENCE_DECISIONS.APPROVE_PERSISTENCE_CANDIDATE_PREPARATION);
}]);

tests.push(['missing UI Read Model snapshot blocks persistence candidate preparation', () => {
  const output = buildAuditPersistenceBoundary(validInput({ uiReadModelSnapshot: null }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_UI_READ_MODEL);
  assertNoWritesTruthOrActions(output);
}]);

tests.push(['missing presentation model candidate blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ uiPresentationModelCandidate: null, uiReadModelSnapshot: { approvedForReadOnlyPresentationModel: true } }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_PRESENTATION_MODEL_CANDIDATE);
}]);

tests.push(['missing audit event candidate blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ auditEventCandidate: null }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_AUDIT_EVENT_CANDIDATE);
}]);

tests.push(['missing persistence record candidate blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ persistenceRecordCandidate: null }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_PERSISTENCE_RECORD_CANDIDATE);
}]);

tests.push(['missing retention policy blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ retentionPolicySnapshot: null }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_RETENTION_POLICY);
}]);

tests.push(['missing persistence policy blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ persistencePolicySnapshot: null }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_PERSISTENCE_POLICY);
}]);

tests.push(['missing immutability policy blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ immutabilityPolicySnapshot: null }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_IMMUTABILITY_POLICY);
}]);

tests.push(['missing privacy policy blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ privacyPolicySnapshot: null }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_PRIVACY_POLICY);
}]);

tests.push(['missing idempotency key blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ idempotencyKey: '', persistenceRecordCandidate: { recordType: 'UI_READ_MODEL_AUDIT' } }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_IDEMPOTENCY_KEY);
}]);

tests.push(['missing source evidence blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ sourceEvidence: [] }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_SOURCE_EVIDENCE);
}]);

tests.push(['missing source owner blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ sourceEvidence: [{ id: 'ev1' }] }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_SOURCE_OWNER);
}]);

tests.push(['missing source freshness blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ sourceFreshness: null }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_SOURCE_FRESHNESS);
}]);

tests.push(['stale source freshness blocks or requires review', () => {
  const output = buildAuditPersistenceBoundary(validInput({ sourceFreshness: { stale: true } }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.STALE_SOURCE_FRESHNESS);
}]);

tests.push(['missing audit trail blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ auditTrail: null }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.NEEDS_AUDIT_TRAIL);
}]);

tests.push(['unsupported actor role blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ actorRole: 'VISITOR' }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.UNSUPPORTED_ACTOR_ROLE);
  assert.strictEqual(output.decision, AUDIT_PERSISTENCE_DECISIONS.NOT_MODELED);
}]);

tests.push(['unsupported record type blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ recordType: 'UNKNOWN_RECORD' }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.UNSUPPORTED_RECORD_TYPE);
  assert.strictEqual(output.decision, AUDIT_PERSISTENCE_DECISIONS.NOT_MODELED);
}]);

tests.push(['expired persistence window blocks', () => {
  const output = buildAuditPersistenceBoundary(validInput({ expiresAt: new Date(Date.now() - 1000).toISOString() }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.EXPIRED_PERSISTENCE_WINDOW);
  assert.strictEqual(output.decision, AUDIT_PERSISTENCE_DECISIONS.EXPIRED);
}]);

tests.push(['audit persistence candidate can be prepared', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.APPROVED_FOR_PERSISTENCE_CANDIDATE_PREPARATION);
  assert.strictEqual(output.approvedForPersistenceCandidatePreparation, true);
  assert.ok(output.auditPersistenceRecordCandidate);
}]);

tests.push(['actual persistence write remains false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.approvedForPersistenceWrite, false);
  assert.strictEqual(output.persistenceWriteCandidate, null);
  assert.strictEqual(output.auditPersistenceRecordCandidate.approvedForPersistenceWrite, false);
}]);

tests.push(['file database writes remain false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.writesFile, false);
  assert.strictEqual(output.writesDatabase, false);
  assert.strictEqual(output.auditPersistenceRecordCandidate.writesFile, false);
  assert.strictEqual(output.auditPersistenceRecordCandidate.writesDatabase, false);
}]);

tests.push(['CRM mutation remains false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.mutatesCrm, false);
}]);

tests.push(['business truth creation remains false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.createsBusinessTruth, false);
  assert.strictEqual(output.auditPersistenceRecordCandidate.createsBusinessTruth, false);
}]);

tests.push(['delivery message truth creation remains false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.createsDeliveryTruth, false);
  assert.strictEqual(output.createsMessageTruth, false);
}]);

tests.push(['task calendar creation remains false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.createsTask, false);
  assert.strictEqual(output.createsCalendarEvent, false);
}]);

tests.push(['UI rendering remains false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.rendersUi, false);
}]);

tests.push(['provider external API calls remain false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.providerApiCallAllowed, false);
  assert.strictEqual(output.externalApiCallAllowed, false);
}]);

tests.push(['send action execution remains false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.sendsMessage, false);
  assert.strictEqual(output.executesAction, false);
}]);

tests.push(['compensation revenue payout truth remains false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.createsCompensationTruth, false);
  assert.strictEqual(output.createsRevenueTruth, false);
  assert.strictEqual(output.createsPayoutTruth, false);
}]);

tests.push(['ranking punishment HR personality truth remains false', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.createsRankingTruth, false);
  assert.strictEqual(output.createsPunishmentTruth, false);
  assert.strictEqual(output.createsHrTruth, false);
  assert.strictEqual(output.createsPersonalityTruth, false);
}]);

tests.push(['forbidden uses are blocked', () => {
  const output = buildAuditPersistenceBoundary(validInput({ requestedUse: 'DATABASE_WRITE' }));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('DATABASE_WRITE'));
}]);

tests.push(['allowed uses are allowed', () => {
  const output = buildAuditPersistenceBoundary(validInput({ requestedUse: 'EVIDENCE_CHAIN_PREP' }));
  assert.ok(output.allowedUses.includes('EVIDENCE_CHAIN_PREP'));
  assert.strictEqual(output.auditPersistenceStatus, AUDIT_PERSISTENCE_STATUSES.APPROVED_FOR_PERSISTENCE_CANDIDATE_PREPARATION);
}]);

tests.push(['inputs are not mutated', () => {
  const input = validInput();
  const before = JSON.stringify(input);
  buildAuditPersistenceBoundary(input);
  assert.strictEqual(JSON.stringify(input), before);
}]);

tests.push(['evidence source sourceOwners dedupe', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.deepStrictEqual(output.evidenceRefs.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceEvidenceIds.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceOwners.sort(), ['UIReadModelBoundary', 'ProviderWebhookBoundary'].sort());
  assert.ok(output.warnings.includes('audit warning'));
  assert.ok(output.warnings.includes('read model candidate only'));
  assert.ok(output.limitations.includes('audit limitation'));
  assert.ok(output.limitations.includes('not truth'));
}]);

tests.push(['retention immutability privacy remain policy snapshots only', () => {
  const output = buildAuditPersistenceBoundary(validInput());
  assert.strictEqual(output.auditPersistenceRecordCandidate.retentionPolicySnapshotOnly, true);
  assert.strictEqual(output.auditPersistenceRecordCandidate.immutabilityPolicySnapshotOnly, true);
  assert.strictEqual(output.auditPersistenceRecordCandidate.privacyPolicySnapshotOnly, true);
  assertNoWritesTruthOrActions(output);
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

console.log(`Audit Persistence Boundary Contract PASS ${passed}/${tests.length}`);
