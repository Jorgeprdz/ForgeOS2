import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ProductTruthError,
  assertProductTruthEnvelope,
  createProductTruthEnvelope,
  createProductTruthKey,
  isProductTruthActionable
} from './index.mjs';

function validInput(overrides = {}) {
  return {
    productId: 'SMNYL-VIDA-001',
    carrierId: 'SMNYL',
    productName: 'Seguro de Vida',
    productVersion: '2026.1',
    productFamily: 'LIFE',
    evidenceState: 'VERIFIED',
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveTo: null,
    rulePackId: 'RP-SMNYL-VIDA-2026-1',
    currency: 'MXN',
    country: 'MX',
    channel: 'ADVISOR',
    sourceIds: [
      'SOURCE-PRODUCT-PACK-001'
    ],
    facts: {
      category: 'LIFE',
      currency: 'MXN'
    },
    unknownFields: [],
    conflicts: [],
    ...overrides
  };
}

test(
  'creates a version-aware actionable envelope',
  () => {
    const envelope =
      createProductTruthEnvelope(validInput());

    assert.equal(envelope.schemaVersion, 2);
    assert.equal(envelope.actionable, true);
    assert.equal(
      envelope.productVersion,
      '2026.1'
    );
    assert.equal(
      envelope.productFamily,
      'LIFE'
    );
    assert.equal(
      envelope.versionContext.country,
      'MX'
    );
  }
);

test('creates a deterministic truth key', () => {
  const first =
    createProductTruthEnvelope(validInput());

  const second =
    createProductTruthEnvelope(validInput());

  assert.equal(first.truthKey, second.truthKey);

  assert.equal(
    first.truthKey,
    createProductTruthKey(first)
  );
});

test(
  'different product versions have different truth keys',
  () => {
    const current =
      createProductTruthEnvelope(validInput());

    const historical =
      createProductTruthEnvelope(
        validInput({
          productVersion: '2025.4',
          effectiveFrom:
            '2025-01-01T00:00:00Z'
        })
      );

    assert.notEqual(
      current.truthKey,
      historical.truthKey
    );
  }
);

test('requires product version', () => {
  assert.throws(
    () =>
      createProductTruthEnvelope(
        validInput({
          productVersion: ''
        })
      ),
    error =>
      error instanceof ProductTruthError &&
      error.code ===
        'PRODUCT_VERSION_REQUIRED'
  );
});

test('requires product family', () => {
  assert.throws(
    () =>
      createProductTruthEnvelope(
        validInput({
          productFamily: ''
        })
      ),
    error =>
      error instanceof ProductTruthError &&
      error.code ===
        'PRODUCT_FAMILY_REQUIRED'
  );
});

test('unknown evidence remains non-actionable', () => {
  const envelope =
    createProductTruthEnvelope(
      validInput({
        evidenceState: 'UNKNOWN',
        unknownFields: ['premiumRules']
      })
    );

  assert.equal(envelope.actionable, false);
});

test(
  'conflicted evidence requires explicit conflicts',
  () => {
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
  }
);

test(
  'verified evidence cannot hide unknown fields',
  () => {
    assert.throws(
      () =>
        createProductTruthEnvelope(
          validInput({
            unknownFields: [
              'commissionRule'
            ]
          })
        ),
      error =>
        error instanceof ProductTruthError &&
        error.code ===
          'VERIFIED_STATE_HAS_UNRESOLVED_GAPS'
    );
  }
);

test('rejects an invalid effective period', () => {
  assert.throws(
    () =>
      createProductTruthEnvelope(
        validInput({
          effectiveFrom:
            '2026-02-01T00:00:00Z',
          effectiveTo:
            '2026-01-01T00:00:00Z'
        })
      ),
    error =>
      error instanceof ProductTruthError &&
      error.code ===
        'EFFECTIVE_PERIOD_INVALID'
  );
});

test('asserts a valid envelope', () => {
  const envelope =
    createProductTruthEnvelope(validInput());

  assert.equal(
    assertProductTruthEnvelope(envelope),
    true
  );
});

test(
  'reports actionability from validated truth',
  () => {
    const envelope =
      createProductTruthEnvelope(
        validInput({
          evidenceState: 'STALE'
        })
      );

    assert.equal(
      isProductTruthActionable(envelope),
      false
    );
  }
);

test('output is deeply immutable', () => {
  const envelope =
    createProductTruthEnvelope(validInput());

  assert.equal(Object.isFrozen(envelope), true);
  assert.equal(
    Object.isFrozen(envelope.versionContext),
    true
  );
  assert.equal(
    Object.isFrozen(envelope.boundaries),
    true
  );
});
