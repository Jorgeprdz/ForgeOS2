const assert = require('assert');
const {
  buildConnectorExecutorBoundary,
  CONNECTOR_EXECUTOR_STATUSES,
  CONNECTOR_EXECUTOR_DECISIONS,
  CONNECTOR_EXECUTOR_ALLOWED_USES,
  CONNECTOR_EXECUTOR_FORBIDDEN_USES,
} = require('../connector-executor/connector-executor-boundary-contract');

function futureDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function pastDate() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

function validInput(overrides = {}) {
  return {
    connectorExecutorRequestId: 'connector-executor-1',
    connectorExecutionGateRequestId: 'connector-execution-gate-1',
    providerConnectorRequestId: 'provider-connector-1',
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
    providerName: 'MOCK_PROVIDER',
    providerConnectorName: 'MOCK_CONNECTOR',
    connectorExecutorName: 'MOCK_EXECUTOR',
    connectorExecutorMode: 'EXECUTOR_COMMAND_PREP_ONLY',
    channel: 'WHATSAPP',
    idempotencyKey: 'idempotency-1',
    dryRun: false,
    connectorExecutionGateSnapshot: {
      connectorExecutionGateRequestId: 'connector-execution-gate-1',
      providerConnectorRequestId: 'provider-connector-1',
      providerRuntimeRequestId: 'provider-runtime-1',
      sendRequestId: 'send-1',
      approvedForConnectorExecutionHandoff: true,
      approvedForConnectorExecution: false,
      connectorExecutionAllowed: false,
      connectorInvocationAllowed: false,
      externalApiCallAllowed: false,
      providerDispatchAllowed: false,
      sendsMessage: false,
      providerName: 'MOCK_PROVIDER',
      providerConnectorName: 'MOCK_CONNECTOR',
      connectorExecutorName: 'MOCK_EXECUTOR',
      channel: 'WHATSAPP',
      idempotencyKey: 'idempotency-1',
      expiresAt: futureDate(),
      connectorInvocationCandidate: {
        connectorName: 'MOCK_CONNECTOR',
        providerName: 'MOCK_PROVIDER',
        channel: 'WHATSAPP',
        idempotencyKey: 'idempotency-1',
        invocationAllowed: false,
        externalApiCallAllowed: false,
        dispatchAllowed: false,
      },
      warnings: ['execution handoff only'],
    },
    connectorInvocationCandidate: {
      connectorName: 'MOCK_CONNECTOR',
      providerName: 'MOCK_PROVIDER',
      channel: 'WHATSAPP',
      idempotencyKey: 'idempotency-1',
      invocationAllowed: false,
      externalApiCallAllowed: false,
      dispatchAllowed: false,
    },
    finalExecutorConfirmation: {
      confirmed: true,
      confirmedBy: 'advisor-1',
      confirmedAt: new Date().toISOString(),
    },
    executorCapabilitySnapshot: {
      available: true,
      supportedExecutors: ['MOCK_EXECUTOR', 'TWILIO_EXECUTOR'],
      supportedConnectors: ['MOCK_CONNECTOR', 'TWILIO_CONNECTOR'],
      supportedProviders: ['MOCK_PROVIDER', 'TWILIO'],
      supportedChannels: ['WHATSAPP', 'SMS', 'EMAIL'],
    },
    executorPolicySnapshot: {
      reviewed: true,
      allowed: true,
      executorInvocationAllowed: false,
      externalApiCallAllowed: false,
      connectorInvocationAllowed: false,
      providerDispatchAllowed: false,
    },
    credentialReviewSnapshot: {
      reviewed: true,
      credentialsAvailable: true,
      accessApproved: true,
      credentialMaterialExposed: false,
    },
    rateLimitSnapshot: {
      reviewed: true,
      allowed: true,
    },
    retryPolicySnapshot: {
      reviewed: true,
      allowed: true,
    },
    auditTrail: {
      auditTrailId: 'audit-1',
      entries: ['connector-execution-gate-reviewed'],
    },
    sourceEvidence: [
      { id: 'ev1', sourceOwner: 'ConnectorExecutionGate' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'ProviderConnectorBoundary' },
      { sourceEvidenceId: 'ev2', sourceOwner: 'ProviderConnectorBoundary' },
    ],
    requestedUse: 'EXECUTOR_COMMAND_PREP',
    now: new Date().toISOString(),
    ...overrides,
  };
}

function assertNoExecutionFlags(output) {
  assert.strictEqual(output.approvedForExecutorInvocation, false);
  assert.strictEqual(output.executorInvocationAllowed, false);
  assert.strictEqual(output.connectorInvocationAllowed, false);
  assert.strictEqual(output.externalApiCallAllowed, false);
  assert.strictEqual(output.providerDispatchAllowed, false);
  assert.strictEqual(output.sendsMessage, false);
  assert.strictEqual(output.credentialMaterialExposed, false);
  assert.strictEqual(output.retryAllowed, false);
  assert.strictEqual(output.queueExecutionAllowed, false);
  assert.strictEqual(output.scheduledExecutionAllowed, false);
  assert.strictEqual(output.webhookSideEffectAllowed, false);
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
  assert.strictEqual(output.connectorExecutionGateRequired, true);
  assert.strictEqual(output.connectorExecutorAuditRequired, true);
  assert.strictEqual(output.dispatchExecutorRequired, true);
  assert.strictEqual(output.externalDispatchBoundaryRequired, true);
}

const tests = [];

tests.push(['exports constants', () => {
  assert.ok(CONNECTOR_EXECUTOR_ALLOWED_USES.includes('EXECUTOR_COMMAND_PREP'));
  assert.ok(CONNECTOR_EXECUTOR_FORBIDDEN_USES.includes('EXECUTOR_INVOCATION'));
  assert.ok(CONNECTOR_EXECUTOR_STATUSES.APPROVED_FOR_EXECUTOR_COMMAND_PREPARATION);
  assert.ok(CONNECTOR_EXECUTOR_DECISIONS.APPROVE_EXECUTOR_COMMAND_PREPARATION);
}]);

tests.push(['missing Connector Execution Gate snapshot blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ connectorExecutionGateSnapshot: null }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_CONNECTOR_EXECUTION_GATE);
  assertNoExecutionFlags(output);
}]);

tests.push(['missing connector invocation candidate blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ connectorInvocationCandidate: null, connectorExecutionGateSnapshot: { approvedForConnectorExecutionHandoff: true } }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_CONNECTOR_INVOCATION_CANDIDATE);
}]);

tests.push(['missing final executor confirmation blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ finalExecutorConfirmation: null }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_EXECUTOR_CONFIRMATION);
  assert.strictEqual(output.decision, CONNECTOR_EXECUTOR_DECISIONS.REQUEST_EXECUTOR_REVIEW);
}]);

tests.push(['missing connector executor blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ connectorExecutorName: '', connectorExecutionGateSnapshot: { ...validInput().connectorExecutionGateSnapshot, connectorExecutorName: '' } }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_CONNECTOR_EXECUTOR);
}]);

tests.push(['missing executor capability blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ executorCapabilitySnapshot: null }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_EXECUTOR_CAPABILITY);
}]);

tests.push(['missing executor policy blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ executorPolicySnapshot: null }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_EXECUTOR_POLICY);
}]);

tests.push(['missing idempotency key blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({
    idempotencyKey: '',
    connectorExecutionGateSnapshot: { ...validInput().connectorExecutionGateSnapshot, idempotencyKey: '' },
    connectorInvocationCandidate: { ...validInput().connectorInvocationCandidate, idempotencyKey: '' },
  }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_IDEMPOTENCY_KEY);
}]);

tests.push(['missing audit trail blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ auditTrail: null }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_AUDIT_TRAIL);
}]);

tests.push(['missing credential review blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ credentialReviewSnapshot: null }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_CREDENTIAL_REVIEW);
}]);

tests.push(['missing rate-limit review blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ rateLimitSnapshot: null }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_RATE_LIMIT_REVIEW);
}]);

tests.push(['retry without policy blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ retryRequested: true, retryPolicySnapshot: null }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.NEEDS_RETRY_POLICY);
}]);

tests.push(['unsupported connector executor blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ connectorExecutorName: 'UNKNOWN_EXECUTOR' }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.UNSUPPORTED_CONNECTOR_EXECUTOR);
  assert.strictEqual(output.decision, CONNECTOR_EXECUTOR_DECISIONS.NOT_MODELED);
}]);

tests.push(['unsupported connector blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ providerConnectorName: 'UNKNOWN_CONNECTOR' }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.UNSUPPORTED_CONNECTOR);
  assert.strictEqual(output.decision, CONNECTOR_EXECUTOR_DECISIONS.NOT_MODELED);
}]);

tests.push(['unsupported provider blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ providerName: 'UNKNOWN_PROVIDER' }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.UNSUPPORTED_PROVIDER);
  assert.strictEqual(output.decision, CONNECTOR_EXECUTOR_DECISIONS.NOT_MODELED);
}]);

tests.push(['unsupported channel blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ channel: 'TELEGRAM' }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.UNSUPPORTED_CHANNEL);
  assert.strictEqual(output.decision, CONNECTOR_EXECUTOR_DECISIONS.NOT_MODELED);
}]);

tests.push(['expired executor window blocks executor command preparation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ expiresAt: pastDate() }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.EXPIRED_EXECUTOR_WINDOW);
  assert.strictEqual(output.decision, CONNECTOR_EXECUTOR_DECISIONS.EXPIRED);
}]);

tests.push(['external API call remains false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.externalApiCallAllowed, false);
  assertNoExecutionFlags(output);
}]);

tests.push(['connector invocation remains false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.connectorInvocationAllowed, false);
}]);

tests.push(['connector execution remains false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.connectorInvocationAllowed, false);
  assert.strictEqual(output.executorCommandCandidate.connectorInvocationAllowed, false);
}]);

tests.push(['executor invocation remains false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.executorInvocationAllowed, false);
  assert.strictEqual(output.approvedForExecutorInvocation, false);
}]);

tests.push(['provider dispatch remains false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.providerDispatchAllowed, false);
}]);

tests.push(['sends message remains false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.sendsMessage, false);
}]);

tests.push(['credential material exposure remains false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.credentialMaterialExposed, false);
}]);

tests.push(['queue execution remains false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.queueExecutionAllowed, false);
}]);

tests.push(['scheduled execution remains false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.scheduledExecutionAllowed, false);
}]);

tests.push(['webhook side effects remain false', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.webhookSideEffectAllowed, false);
}]);

tests.push(['dry-run can be modeled without invocation', () => {
  const output = buildConnectorExecutorBoundary(validInput({ dryRun: true, requestedUse: 'EXECUTOR_DRY_RUN_PREP' }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.APPROVED_FOR_EXECUTOR_DRY_RUN_ONLY);
  assert.strictEqual(output.decision, CONNECTOR_EXECUTOR_DECISIONS.APPROVE_EXECUTOR_DRY_RUN_ONLY);
  assert.strictEqual(output.executorCommandCandidate.dryRun, true);
  assertNoExecutionFlags(output);
}]);

tests.push(['executor command candidate can be prepared without external call', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.APPROVED_FOR_EXECUTOR_COMMAND_PREPARATION);
  assert.strictEqual(output.approvedForExecutorCommandPreparation, true);
  assert.ok(output.executorCommandCandidate);
  assert.strictEqual(output.executorCommandCandidate.externalApiCallAllowed, false);
  assert.strictEqual(output.executorCommandCandidate.providerDispatchAllowed, false);
}]);

tests.push(['automatic send is blocked', () => {
  const output = buildConnectorExecutorBoundary(validInput({ requestedUse: 'AUTOMATIC_SEND' }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('AUTOMATIC_SEND'));
}]);

tests.push(['silent send is blocked', () => {
  const output = buildConnectorExecutorBoundary(validInput({ requestedUse: 'SILENT_SEND' }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('SILENT_SEND'));
}]);

tests.push(['AI self-send is blocked', () => {
  const output = buildConnectorExecutorBoundary(validInput({ requestedUse: 'AI_SELF_SEND' }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('AI_SELF_SEND'));
}]);

tests.push(['boundary does not create tasks calendar or truth', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assertNoExecutionFlags(output);
}]);

tests.push(['inputs are not mutated', () => {
  const input = validInput();
  const before = JSON.stringify(input);
  buildConnectorExecutorBoundary(input);
  assert.strictEqual(JSON.stringify(input), before);
}]);

tests.push(['forbidden uses are blocked', () => {
  const output = buildConnectorExecutorBoundary(validInput({ requestedUse: 'EXECUTOR_INVOCATION' }));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.BLOCKED);
  assert.ok(output.blockedUses.includes('EXECUTOR_INVOCATION'));
}]);

tests.push(['allowed uses are allowed', () => {
  const output = buildConnectorExecutorBoundary(validInput({
    requestedUse: 'SMS_EXECUTOR_REVIEW',
    channel: 'SMS',
    providerName: 'TWILIO',
    providerConnectorName: 'TWILIO_CONNECTOR',
    connectorExecutorName: 'TWILIO_EXECUTOR',
    executorCapabilitySnapshot: {
      available: true,
      supportedExecutors: ['TWILIO_EXECUTOR'],
      supportedConnectors: ['TWILIO_CONNECTOR'],
      supportedProviders: ['TWILIO'],
      supportedChannels: ['SMS'],
    },
  }));
  assert.ok(output.allowedUses.includes('SMS_EXECUTOR_REVIEW'));
  assert.strictEqual(output.connectorExecutorBoundaryStatus, CONNECTOR_EXECUTOR_STATUSES.APPROVED_FOR_EXECUTOR_COMMAND_PREPARATION);
}]);

tests.push(['evidence/source/sourceOwners dedupe', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.deepStrictEqual(output.evidenceRefs.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceEvidenceIds.sort(), ['ev1', 'ev2'].sort());
  assert.deepStrictEqual(output.sourceOwners.sort(), ['ConnectorExecutionGate', 'ProviderConnectorBoundary'].sort());
}]);

tests.push(['audit is required', () => {
  const output = buildConnectorExecutorBoundary(validInput());
  assert.strictEqual(output.connectorExecutorAuditRequired, true);
  assert.strictEqual(output.dispatchExecutorRequired, true);
  assert.strictEqual(output.externalDispatchBoundaryRequired, true);
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

console.log(`Connector Executor Boundary Contract PASS ${passed}/${tests.length}`);
