import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ProductTruthError,
  assertProductTruthEnvelope,
  createProductTruthEnvelope,
  isProductTruthActionable
} from './index.mjs';

function validInput(overrides = {}) {
  return {
    productId: 'SMNYL-VIDA-001',
    carrierId: 'SMNYL',
    productName: 'Seguro de Vida',
    evidenceState: 'VERIFIED',
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveTo: null,
    sourceIds: ['SOURCE-PRODUCT-PACK-001'],
    facts: {
      category: 'LIFE',
      currency: 'MXN'
    },
    unknownFields: [],
    conflicts: [],
    ...overrides
  };
}

test('creates a verified actionable product truth envelope', () => {
  const envelope = createProductTruthEnvelope(validInput());

  assert.equal(envelope.schemaVersion, 1);
  assert.equal(envelope.kind, 'PRODUCT_TRUTH_ENVELOPE');
  assert.equal(envelope.evidenceState, 'VERIFIED');
  assert.equal(envelope.actionable, true);
  assert.equal(
    envelope.boundaries.owner,
    'PRODUCT_INTELLIGENCE'
  );
});

test('unknown evidence remains non-actionable', () => {
  const envelope = createProductTruthEnvelope(
    validInput({
      evidenceState: 'UNKNOWN',
      unknownFields: ['premiumRules']
    })
  );

  assert.equal(envelope.actionable, false);
});

test('conflicted evidence requires explicit conflicts', () => {
  assert.throws(
    () =>
      createProductTruthEnvelope(
        validInput({
          evidenceState: 'CONFLICTED',
          conflicts: []
        })
      ),
    error =>
      error instanceof ProductTruthError &&
      error.code ===
        'CONFLICTED_STATE_REQUIRES_CONFLICTS'
  );
});

test('verified evidence cannot hide unknown fields', () => {
  assert.throws(
    () =>
      createProductTruthEnvelope(
        validInput({
          unknownFields: ['commissionRule']
        })
      ),
    error =>
      error instanceof ProductTruthError &&
      error.code ===
        'VERIFIED_STATE_HAS_UNRESOLVED_GAPS'
  );
});

test('rejects an invalid effective period', () => {
  assert.throws(
    () =>
      createProductTruthEnvelope(
        validInput({
          effectiveFrom: '2026-02-01T00:00:00Z',
          effectiveTo: '2026-01-01T00:00:00Z'
        })
      ),
    error =>
      error instanceof ProductTruthError &&
      error.code === 'EFFECTIVE_PERIOD_INVALID'
  );
});

test('asserts a valid envelope', () => {
  const envelope = createProductTruthEnvelope(validInput());

  assert.equal(
    assertProductTruthEnvelope(envelope),
    true
  );
});

test('reports actionability from the validated envelope', () => {
  const envelope = createProductTruthEnvelope(
    validInput({
      evidenceState: 'STALE'
    })
  );

  assert.equal(
    isProductTruthActionable(envelope),
    false
  );
});

test('output is immutable', () => {
  const envelope = createProductTruthEnvelope(validInput());

  assert.equal(Object.isFrozen(envelope), true);
  assert.equal(Object.isFrozen(envelope.facts), true);
  assert.equal(Object.isFrozen(envelope.boundaries), true);
});
