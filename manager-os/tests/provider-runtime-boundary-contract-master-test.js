const assert = require('assert');
const {
  buildProviderRuntimeBoundary,
  PROVIDER_RUNTIME_STATUSES,
  PROVIDER_RUNTIME_DECISIONS,
  PROVIDER_RUNTIME_ALLOWED_USES,
  PROVIDER_RUNTIME_FORBIDDEN_USES,
} = require('../provider-runtime/provider-runtime-boundary-contract');

function futureDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function pastDate() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

function validInput(overrides = {}) {
  return {
    providerRuntimeRequestId: 'provider-runtime-1',
    sendRequestId: 'send-1',
    deliveryRequestId: 'delivery-1',
    approvalRequestId: 'approval-1',
    advisorId: 'advisor-1',
    managerId: 'manager-1',
    senderId: 'advisor-1',
    senderRole: 'advisor',
    personId: 'maria-1',
    personType: 'prospect',
    channel: 'WHATSAPP',
    providerName: 'MOCK_PROVIDER',
    providerMode: 'PAYLOAD_PREP_ONLY',
    idempotencyKey: 'idempotency-1',
    dryRun: false,
    finalSendText: 'Hola Maria, como vas con lo que platicamos?',
    recipientDestination: '+525512345678',
    approvedArtifactHash: 'hash-approved',
    currentArtifactHash: 'hash-approved',
    sendExecutionGateSnapshot: {
      sendRequestId: 'send-1',
      deliveryRequestId: 'delivery-1',
      approvalRequestId: 'approval-1',
      senderId: 'advisor-1',
      senderRole: 'advisor',
      approvedForProviderHandoff: true,
      approvedForSendExecution: false,
      providerRuntimeCallAllowed: false,
      sendsMessage: false,
      channel: 'WHATSAPP',
      finalSendText: 'Hola Maria, como vas con lo que platicamos?',
      recipientDestination: '+525512345678',
      approvedArtifactHash: 'hash-approved',
      currentArtifactHash: 'hash-approved',
      expiresAt: futureDate(),
      warnings: ['provider handoff only'],
    },
    finalHumanConfirmationSnapshot: {
      confirmed: true,
      confirmedBy: 'advisor-1',
      confirmedAt: new Date().toISOString(),
    },
    safetyValidationSnapshot: {
      status: 'SAFE_FOR_HUMAN_REVIEW',
      safe: true,
    },
    providerCapabilitySnapshot: {
      available: true,
      supportedProviders: ['MOCK_PROVIDER', 'TWILIO'],
      supportedChannels: ['WHATSAPP', 'SMS', 'EMAIL'],
    },
    credentialReviewSnapshot: {
      reviewed: true,
      credentialsAvailable: true,
      accessApproved: true,
    },
    sourceEvidence: [
      { id: 'ev1', sourceOwner: 'SendExecutionGate' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'HumanApprovalGate' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'HumanApprovalGate' },
    ],
    requestedUse: 'PROVIDER_PAYLOAD_PREP',
    now: new Date().toISOString(),
    ...overrides,
  };
}

function assertNoExecutionFlags(output) {
  assert.strictEqual(output.approvedForProviderRuntimeExecution, false);
  assert.strictEqual(output.providerRuntimeCallAllowed, false);
  assert.strictEqual(output.providerDispatchAllowed, false);
  assert.strictEqual(output.sendsMessage, false);
  assert.strictEqual(output.providerCredentialAccessAllowed, false);
  assert.strictEqual(output.retryAllowed, false);
  assert.strictEqual(output.scheduledExecutionAllowed, false);
  assert.strictEqual(output.automaticSendAllowed, false);
  assert.strictEqual(output.silentSendAllowed, false);
  assert.strictEqual(output.createsTask, false);
  assert.strictEqual(output.createsCalendarEvent, false);
  assert.strictEqual(output.createsCompensationTruth, false);
  assert.strictEqual(output.createsPayoutTruth, false);
  assert.strictEqual(output.createsRevenueTruth, false);
  assert.strictEqual(output.createsRankingTruth, false);
  assert.strictEqual(output.createsPunishmentTruth, false);
  assert.strictEqual(output.createsHrTruth, false);
  assert.strictEqual(output.createsPersonalityTruth, false);
  assert.strictEqual(output.humanSendConfirmationRequired, true);
  assert.strictEqual(output.sendExecutionGateRequired, true);
  assert.strictEqual(output.providerAuditRequired, true);
  assert.strictEqual(output.providerConnectorBoundaryRequired, true);
}

const tests = [];

tests.push(['exports constants', () => {
  assert.ok(PROVIDER_RUNTIME_ALLOWED_USES.includes('PROVIDER_PAYLOAD_PREP'));
  assert.ok(PROVIDER_RUNTIME_FORBIDDEN_USES.includes('AUTOMATIC_SEND'));
  assert.ok(PROVIDER_RUNTIME_STATUSES.APPROVED_FOR_PROVIDER_RUNTIME_PREPARATION);
  assert.ok(PROVIDER_RUNTIME_DECISIONS.APPROVE_PROVIDER_RUNTIME_PREPARATION);
}]);

tests.push(['missing Send Execution Gate snapshot blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ sendExecutionGateSnapshot: null }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_SEND_EXECUTION_GATE);
  assertNoExecutionFlags(output);
}]);

tests.push(['missing provider handoff approval blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ sendExecutionGateSnapshot: { approvedForProviderHandoff: false } }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_PROVIDER_HANDOFF);
  assertNoExecutionFlags(output);
}]);

tests.push(['missing final human confirmation blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ finalHumanConfirmationSnapshot: null }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_FINAL_HUMAN_CONFIRMATION);
  assert.strictEqual(output.decision, PROVIDER_RUNTIME_DECISIONS.REQUEST_PROVIDER_RUNTIME_REVIEW);
}]);

tests.push(['missing provider name blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ providerName: '' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_PROVIDER_NAME);
}]);

tests.push(['missing channel blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ channel: '', sendExecutionGateSnapshot: { ...validInput().sendExecutionGateSnapshot, channel: '' } }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_CHANNEL);
}]);

tests.push(['missing recipient destination blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ recipientDestination: '', sendExecutionGateSnapshot: { ...validInput().sendExecutionGateSnapshot, recipientDestination: '' } }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_RECIPIENT_DESTINATION);
}]);

tests.push(['missing artifact hash blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({
    approvedArtifactHash: '',
    currentArtifactHash: '',
    sendExecutionGateSnapshot: { ...validInput().sendExecutionGateSnapshot, approvedArtifactHash: '', currentArtifactHash: '' },
  }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_ARTIFACT_HASH);
}]);

tests.push(['changed artifact requires reapproval', () => {
  const output = buildProviderRuntimeBoundary(validInput({ currentArtifactHash: 'hash-changed' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.ARTIFACT_CHANGED_REAPPROVAL_REQUIRED);
  assert.ok(output.blockedUses.includes('SEND_CHANGED_ARTIFACT_WITHOUT_REAPPROVAL'));
}]);

tests.push(['unsafe safety result blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ safetyValidationSnapshot: { status: 'UNSAFE_BLOCKED', safe: false } }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.UNSAFE_MESSAGE_BLOCKED);
  assert.ok(output.blockedUses.includes('SEND_UNSAFE_MESSAGE'));
}]);

tests.push(['missing idempotency key blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ idempotencyKey: '' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_IDEMPOTENCY_KEY);
}]);

tests.push(['missing provider capability blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ providerCapabilitySnapshot: null }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_PROVIDER_CAPABILITY);
}]);

tests.push(['missing credential review blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ credentialReviewSnapshot: null }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NEEDS_CREDENTIAL_REVIEW);
}]);

tests.push(['unsupported provider blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ providerName: 'UNKNOWN_PROVIDER' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.UNSUPPORTED_PROVIDER);
  assert.strictEqual(output.decision, PROVIDER_RUNTIME_DECISIONS.NOT_MODELED);
}]);

tests.push(['unsupported channel blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ channel: 'TELEGRAM' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.UNSUPPORTED_CHANNEL);
  assert.strictEqual(output.decision, PROVIDER_RUNTIME_DECISIONS.NOT_MODELED);
}]);

tests.push(['expired runtime window blocks provider runtime preparation', () => {
  const output = buildProviderRuntimeBoundary(validInput({ expiresAt: pastDate() }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.EXPIRED_RUNTIME_WINDOW);
  assert.strictEqual(output.decision, PROVIDER_RUNTIME_DECISIONS.EXPIRED);
}]);

tests.push(['automatic send is blocked', () => {
  const output = buildProviderRuntimeBoundary(validInput({ requestedUse: 'AUTOMATIC_SEND' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('AUTOMATIC_SEND'));
}]);

tests.push(['silent send is blocked', () => {
  const output = buildProviderRuntimeBoundary(validInput({ requestedUse: 'SILENT_SEND' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('SILENT_SEND'));
}]);

tests.push(['AI self-send is blocked', () => {
  const output = buildProviderRuntimeBoundary(validInput({ requestedUse: 'AI_SELF_SEND' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('AI_SELF_SEND'));
}]);

tests.push(['scheduled send is blocked', () => {
  const output = buildProviderRuntimeBoundary(validInput({ requestedUse: 'SCHEDULED_SEND' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('SCHEDULED_SEND'));
}]);

tests.push(['retry without policy is blocked', () => {
  const output = buildProviderRuntimeBoundary(validInput({ requestedUse: 'RETRY_WITHOUT_POLICY' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('RETRY_WITHOUT_POLICY'));
}]);

tests.push(['webhook side effect is blocked', () => {
  const output = buildProviderRuntimeBoundary(validInput({ requestedUse: 'WEBHOOK_SIDE_EFFECT' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('WEBHOOK_SIDE_EFFECT'));
}]);

tests.push(['unknown requested use is not modeled', () => {
  const output = buildProviderRuntimeBoundary(validInput({ requestedUse: 'UNKNOWN_PROVIDER_USE' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.NOT_MODELED);
  assert.strictEqual(output.decision, PROVIDER_RUNTIME_DECISIONS.NOT_MODELED);
}]);

tests.push(['allowed use is preserved', () => {
  const output = buildProviderRuntimeBoundary(validInput({
    requestedUse: 'EMAIL_PROVIDER_REVIEW',
    channel: 'EMAIL',
    providerName: 'SENDGRID',
    recipientDestination: 'maria@example.com',
    providerCapabilitySnapshot: {
      available: true,
      supportedProviders: ['SENDGRID'],
      supportedChannels: ['EMAIL'],
    },
  }));
  assert.ok(output.allowedUses.includes('EMAIL_PROVIDER_REVIEW'));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.APPROVED_FOR_PROVIDER_RUNTIME_PREPARATION);
}]);

tests.push(['provider runtime call remains false when preparation approved', () => {
  const output = buildProviderRuntimeBoundary(validInput());
  assert.strictEqual(output.approvedForProviderRuntimePreparation, true);
  assert.strictEqual(output.providerRuntimeCallAllowed, false);
  assert.strictEqual(output.providerDispatchAllowed, false);
  assertNoExecutionFlags(output);
}]);

tests.push(['dry run can be modeled without provider dispatch', () => {
  const output = buildProviderRuntimeBoundary(validInput({ dryRun: true, requestedUse: 'PROVIDER_DRY_RUN_PREP' }));
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.APPROVED_FOR_DRY_RUN_ONLY);
  assert.strictEqual(output.decision, PROVIDER_RUNTIME_DECISIONS.APPROVE_DRY_RUN_ONLY);
  assert.strictEqual(output.providerPayloadCandidate.dryRun, true);
  assert.strictEqual(output.providerPayloadCandidate.dispatchAllowed, false);
  assertNoExecutionFlags(output);
}]);

tests.push(['provider payload preparation is allowed when all gates pass', () => {
  const output = buildProviderRuntimeBoundary(validInput());
  assert.strictEqual(output.providerRuntimeBoundaryStatus, PROVIDER_RUNTIME_STATUSES.APPROVED_FOR_PROVIDER_RUNTIME_PREPARATION);
  assert.ok(output.providerPayloadCandidate);
  assert.strictEqual(output.providerPayloadCandidate.dispatchAllowed, false);
  assert.strictEqual(output.sendsMessage, false);
}]);

tests.push(['boundary does not create tasks calendar or truth', () => {
  const output = buildProviderRuntimeBoundary(validInput());
  assertNoExecutionFlags(output);
}]);

tests.push(['inputs are not mutated', () => {
  const input = validInput();
  const before = JSON.stringify(input);
  buildProviderRuntimeBoundary(input);
  assert.strictEqual(JSON.stringify(input), before);
}]);

tests.push(['evidence/source/sourceOwners dedupe', () => {
  const output = buildProviderRuntimeBoundary(validInput());
  assert.deepStrictEqual(output.evidenceRefs.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceEvidenceIds.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceOwners.sort(), ['HumanApprovalGate', 'SendExecutionGate'].sort());
}]);

tests.push(['audit is required', () => {
  const output = buildProviderRuntimeBoundary(validInput());
  assert.strictEqual(output.providerAuditRequired, true);
  assert.strictEqual(output.providerConnectorBoundaryRequired, true);
  assert.strictEqual(output.humanSendConfirmationRequired, true);
}]);

tests.push(['provider handoff is not provider runtime execution', () => {
  const output = buildProviderRuntimeBoundary(validInput());
  assert.strictEqual(output.approvedForProviderRuntimePreparation, true);
  assert.strictEqual(output.approvedForProviderRuntimeExecution, false);
  assert.strictEqual(output.providerRuntimeCallAllowed, false);
  assert.strictEqual(output.sendsMessage, false);
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

console.log(`Provider Runtime Boundary Contract PASS ${passed}/${tests.length}`);
