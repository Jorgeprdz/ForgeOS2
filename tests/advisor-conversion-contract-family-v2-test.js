const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas/advisor-conversion-contract-family-v2.schema.json'), 'utf8'));
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures/recruitment/advisor-conversion-contract-family-v2-valid.json'), 'utf8'));

const contractMap = {
  request: 'advisorConversionRequest',
  eligibilitySnapshot: 'advisorConversionEligibilitySnapshot',
  reviewDecision: 'advisorConversionReviewDecision',
  identityAllocationReceipt: 'advisorIdentityAllocationReceipt',
  record: 'advisorConversionRecord',
  receipt: 'advisorConversionReceipt',
  failure: 'advisorConversionFailure',
  cancellation: 'advisorConversionCancellation',
  correction: 'advisorConversionCorrection',
  event: 'advisorConversionEvent'
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveRef(ref) {
  assert.match(ref, /^#\/\$defs\//, `Only local $defs references are allowed in 067G3A: ${ref}`);
  return schema.$defs[ref.slice('#/$defs/'.length)];
}

function isType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  return typeof value === type;
}

function validateNode(node, value, location = '$') {
  const errors = [];
  if (!node) return [`${location}: schema node missing`];
  if (node.$ref) errors.push(...validateNode(resolveRef(node.$ref), value, location));
  if (node.allOf) node.allOf.forEach(part => errors.push(...validateNode(part, value, location)));
  if (node.const !== undefined && value !== node.const) errors.push(`${location}: must equal ${JSON.stringify(node.const)}`);
  if (node.enum && !node.enum.includes(value)) errors.push(`${location}: value is not allowlisted`);

  if (node.type) {
    const allowed = Array.isArray(node.type) ? node.type : [node.type];
    if (!allowed.some(type => isType(value, type))) {
      errors.push(`${location}: expected ${allowed.join('|')}`);
      return errors;
    }
  }

  if (typeof value === 'string') {
    if (node.minLength && value.length < node.minLength) errors.push(`${location}: string is empty`);
    if (node.format === 'date-time' && Number.isNaN(Date.parse(value))) errors.push(`${location}: invalid date-time`);
  }

  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems) errors.push(`${location}: requires at least ${node.minItems} items`);
    if (node.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) errors.push(`${location}: items must be unique`);
    if (node.items) value.forEach((item, index) => errors.push(...validateNode(node.items, item, `${location}[${index}]`)));
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    (node.required || []).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push(`${location}.${key}: required`);
    });
    if (node.additionalProperties === false && node.properties) {
      Object.keys(value).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(node.properties, key)) errors.push(`${location}.${key}: additional property forbidden`);
      });
    }
    Object.entries(node.properties || {}).forEach(([key, child]) => {
      if (Object.prototype.hasOwnProperty.call(value, key)) errors.push(...validateNode(child, value[key], `${location}.${key}`));
    });
  }

  if (node.if) {
    const conditionMatches = validateNode(node.if, value, location).length === 0;
    if (conditionMatches && node.then) errors.push(...validateNode(node.then, value, location));
    if (!conditionMatches && node.else) errors.push(...validateNode(node.else, value, location));
  }
  return errors;
}

function validateContract(definitionName, value) {
  return validateNode(schema.$defs[definitionName], value);
}

function expectValid(definitionName, value, label) {
  assert.deepEqual(validateContract(definitionName, value), [], label);
}

function expectInvalid(definitionName, value, label) {
  assert.ok(validateContract(definitionName, value).length > 0, label);
}

function canonicalPayloadHash(value) {
  function sortObject(input) {
    if (Array.isArray(input)) return input.map(sortObject);
    if (!input || typeof input !== 'object') return input;
    return Object.keys(input).sort().reduce((result, key) => {
      result[key] = sortObject(input[key]);
      return result;
    }, {});
  }
  return crypto.createHash('sha256').update(JSON.stringify(sortObject(value))).digest('hex');
}

function evaluateContractIdempotency({ prior, request, receipt = null, allocation = null }) {
  const hash = canonicalPayloadHash(request);
  const byIdempotency = prior.find(entry => entry.idempotencyKey === request.idempotencyKey);
  if (byIdempotency && byIdempotency.payloadHash !== hash) return { result: 'REJECT_IDEMPOTENCY_PAYLOAD_CONFLICT' };
  const byIntent = prior.find(entry => entry.conversionIntentKey === request.conversionIntentKey && entry.receipt);
  if (byIntent && allocation && byIntent.advisorId !== allocation.advisorId) return { result: 'BLOCK_IDENTITY_REVIEW' };
  if (byIntent) return { result: 'RETURN_EXISTING_RECEIPT', receipt: byIntent.receipt };
  return { result: 'ACCEPT_NEW_CONTRACT_INTENT', receipt };
}

assert.equal(fixture.fixtureType, 'SYNTHETIC_CONTRACT_VALIDATION_ONLY');
Object.entries(contractMap).forEach(([fixtureKey, definitionName]) => {
  expectValid(definitionName, fixture[fixtureKey], `${fixtureKey} must satisfy ${definitionName}`);
});

// Identity separation.
assert.equal(Object.prototype.hasOwnProperty.call(fixture.request, 'advisorId'), false, 'advisorId must be absent from the initial request');
assert.notEqual(fixture.identityAllocationReceipt.advisorId, fixture.identityAllocationReceipt.candidateId, 'candidateId cannot substitute advisorId');
assert.equal(fixture.receipt.advisorId, fixture.identityAllocationReceipt.advisorId, 'advisorId must originate from the allocation receipt');
const expectedIntent = [fixture.request.recruitIdentityId, fixture.request.applicationId, fixture.request.candidateId, fixture.request.targetLifecycleAuthority].join('|');
assert.equal(fixture.request.conversionIntentKey, expectedIntent, 'conversionIntentKey must use the ratified identity lineage');

const requestWithAdvisor = clone(fixture.request);
requestWithAdvisor.advisorId = 'FORBIDDEN_ADVISOR_ID';
expectInvalid('advisorConversionRequest', requestWithAdvisor, 'request must reject advisorId');

// Human approval.
const approvalWithoutConfirmation = clone(fixture.reviewDecision);
approvalWithoutConfirmation.humanDecisionConfirmed = false;
expectInvalid('advisorConversionReviewDecision', approvalWithoutConfirmation, 'approval without confirmed human decision must fail');

const aiReviewer = clone(fixture.reviewDecision);
aiReviewer.reviewerActor.actorType = 'AI';
expectInvalid('advisorConversionReviewDecision', aiReviewer, 'AI reviewer must fail');

const approvalWithoutAuthority = clone(fixture.reviewDecision);
delete approvalWithoutAuthority.reviewAuthority;
expectInvalid('advisorConversionReviewDecision', approvalWithoutAuthority, 'approval without authority must fail');

const approvalWithoutEvidence = clone(fixture.reviewDecision);
approvalWithoutEvidence.evidenceReviewed = [];
expectInvalid('advisorConversionReviewDecision', approvalWithoutEvidence, 'approval without evidence must fail');

// Idempotency and identity collision.
const completed = [{
  idempotencyKey: fixture.request.idempotencyKey,
  conversionIntentKey: fixture.request.conversionIntentKey,
  payloadHash: canonicalPayloadHash(fixture.request),
  advisorId: fixture.receipt.advisorId,
  receipt: fixture.receipt
}];
assert.equal(evaluateContractIdempotency({ prior: completed, request: fixture.request }).result, 'RETURN_EXISTING_RECEIPT');

const changedPayload = clone(fixture.request);
changedPayload.requestReasonCode = 'CHANGED_PAYLOAD';
assert.equal(evaluateContractIdempotency({ prior: completed, request: changedPayload }).result, 'REJECT_IDEMPOTENCY_PAYLOAD_CONFLICT');

const conflictingAllocation = clone(fixture.identityAllocationReceipt);
conflictingAllocation.advisorId = 'ADVISOR_CONFLICT_DEMO_002';
assert.equal(evaluateContractIdempotency({ prior: completed, request: fixture.request, allocation: conflictingAllocation }).result, 'BLOCK_IDENTITY_REVIEW');

// Privacy allowlist and closed payloads.
['project200Contacts', 'nasat', 'managerPrivateNotes', 'prospectData', 'salesPipelineState'].forEach(field => {
  const unsafe = clone(fixture.request);
  unsafe[field] = field === 'project200Contacts' ? [{ name: 'FORBIDDEN' }] : 'FORBIDDEN';
  expectInvalid('advisorConversionRequest', unsafe, `${field} must be rejected`);
});
const arbitrary = clone(fixture.receipt);
arbitrary.unbounded = true;
expectInvalid('advisorConversionReceipt', arbitrary, 'arbitrary receipt properties must be rejected');

// Lifecycle separation.
assert.equal(fixture.record.conversionCompletedImpliesActive, false);
assert.equal(fixture.receipt.conversionCompletedImpliesActive, false);
assert.equal(Object.prototype.hasOwnProperty.call(fixture.receipt, 'activationEffectiveAt'), false, 'conversion must not infer activationEffectiveAt');
assert.equal(Object.prototype.hasOwnProperty.call(fixture.receipt, 'salesPipelineEligible'), false, 'conversion must not contain Sales Pipeline eligibility');
assert.equal(Object.prototype.hasOwnProperty.call(fixture.receipt, 'project200HandoffEligible'), false, 'conversion must not contain Project 200 eligibility');

// Failure, cancellation and correction.
assert.equal(fixture.failure.conversionRequestId, fixture.request.conversionRequestId, 'failure preserves request identity');
assert.equal(fixture.cancellation.auditHistoryPreserved, true, 'cancellation preserves audit history');
const completedCancellation = clone(fixture.cancellation);
completedCancellation.previousState = 'COMPLETED';
expectInvalid('advisorConversionCancellation', completedCancellation, 'completed conversion cannot be cancelled');

const originalReceipt = JSON.stringify(fixture.receipt);
assert.equal(fixture.correction.originalRecordReference, fixture.receipt.conversionReceiptId);
assert.equal(fixture.correction.appendOnly, true);
assert.equal(JSON.stringify(fixture.receipt), originalReceipt, 'correction fixture must not mutate historical receipt');
const silentReplacement = clone(fixture.correction);
silentReplacement.appendOnly = false;
expectInvalid('advisorConversionCorrection', silentReplacement, 'silent replacement must fail');

// Events are constrained and require lineage, causation and correlation.
const activationEvent = clone(fixture.event);
activationEvent.eventType = 'ADVISOR_ACTIVATED';
expectInvalid('advisorConversionEvent', activationEvent, 'activation event is outside 067G3A');
const lineageMissing = clone(fixture.event);
delete lineageMissing.applicationId;
expectInvalid('advisorConversionEvent', lineageMissing, 'event requires identity lineage');
const correlationMissing = clone(fixture.event);
delete correlationMissing.correlationId;
expectInvalid('advisorConversionEvent', correlationMissing, 'event requires correlation');

// V1 remains explicitly deprecated and fixture-only compatible.
const legacySchema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas/advisor-conversion.schema.json'), 'utf8'));
assert.equal(legacySchema.deprecated, true);
assert.match(legacySchema.$comment, /Successor:/);

console.log('067G3A ADVISOR CONVERSION CONTRACT FAMILY V2: PASS');
console.log('Contracts validated: 10');
console.log('Runtime writer created: NO');
console.log('Advisor activated: NO');
