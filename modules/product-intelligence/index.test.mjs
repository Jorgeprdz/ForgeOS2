import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRODUCT_EVIDENCE_AUTHORITY_LEVELS,
  PRODUCT_EVIDENCE_TYPES,
  ProductTruthError,
  assertProductTruthEnvelope,
  createProductEvidenceRecord,
  createProductTruthEnvelope,
  createProductTruthKey,
  isProductTruthActionable,
  resolveProductEvidence
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

function validEvidence(overrides = {}) {
  return {
    evidenceId: 'EVIDENCE-001',
    sourceId: 'SOURCE-MANUAL-001',
    sourceType: 'OFFICIAL_PRODUCT_MANUAL',
    carrierId: 'SMNYL',
    productId: 'SMNYL-VIDA-001',
    productVersion: '2026.1',
    claimPath: 'benefits.survival',
    claimValue: {
      type: 'PERCENTAGE',
      value: 80
    },
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveTo: null,
    country: 'MX',
    channel: 'ADVISOR',
    ...overrides
  };
}

function validResolutionTarget(overrides = {}) {
  return {
    carrierId: 'SMNYL',
    productId: 'SMNYL-VIDA-001',
    productVersion: '2026.1',
    claimPath: 'benefits.survival',
    effectiveAt: '2026-07-01T00:00:00Z',
    country: 'MX',
    channel: 'ADVISOR',
    ...overrides
  };
}

test('evidence type set is closed and immutable', () => {
  assert.equal(
    Object.isFrozen(PRODUCT_EVIDENCE_TYPES),
    true
  );
  assert.deepEqual(
    PRODUCT_EVIDENCE_TYPES,
    [
      'OFFICIAL_PRODUCT_MANUAL',
      'GENERAL_CONDITIONS',
      'OFFICIAL_CARRIER_DOCUMENTATION',
      'VALIDATED_RULE_PACK',
      'QUOTE_ILLUSTRATION',
      'PRODUCT_BROCHURE',
      'OCR_EXTRACT',
      'HUMAN_CONFIRMATION',
      'INFERENCE'
    ]
  );
});

test('authority levels are deterministic and immutable', () => {
  assert.equal(
    Object.isFrozen(
      PRODUCT_EVIDENCE_AUTHORITY_LEVELS
    ),
    true
  );
  assert.equal(
    PRODUCT_EVIDENCE_AUTHORITY_LEVELS
      .OFFICIAL_PRODUCT_MANUAL,
    1
  );
  assert.equal(
    PRODUCT_EVIDENCE_AUTHORITY_LEVELS
      .QUOTE_ILLUSTRATION,
    2
  );
  assert.equal(
    PRODUCT_EVIDENCE_AUTHORITY_LEVELS
      .OCR_EXTRACT,
    3
  );
  assert.equal(
    PRODUCT_EVIDENCE_AUTHORITY_LEVELS
      .INFERENCE,
    5
  );
});

test('creates a deterministic product evidence record', () => {
  const first =
    createProductEvidenceRecord(
      validEvidence()
    );

  const second =
    createProductEvidenceRecord(
      validEvidence()
    );

  assert.deepEqual(first, second);
  assert.equal(
    first.kind,
    'PRODUCT_EVIDENCE_RECORD'
  );
  assert.equal(first.authorityLevel, 1);
  assert.equal(first.context.country, 'MX');
});

test('rejects an invalid evidence source type', () => {
  assert.throws(
    () =>
      createProductEvidenceRecord(
        validEvidence({
          sourceType: 'RANDOM_SCREENSHOT'
        })
      ),
    error =>
      error instanceof ProductTruthError &&
      error.code === 'SOURCE_TYPE_INVALID'
  );
});

test('rejects an invalid evidence period', () => {
  assert.throws(
    () =>
      createProductEvidenceRecord(
        validEvidence({
          effectiveFrom:
            '2026-05-01T00:00:00Z',
          effectiveTo:
            '2026-04-01T00:00:00Z'
        })
      ),
    error =>
      error instanceof ProductTruthError &&
      error.code ===
        'EFFECTIVE_PERIOD_INVALID'
  );
});

test('product evidence records are deeply immutable', () => {
  const record =
    createProductEvidenceRecord(
      validEvidence()
    );

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    Object.isFrozen(record.claimValue),
    true
  );
  assert.equal(
    Object.isFrozen(record.context),
    true
  );
  assert.equal(
    Object.isFrozen(record.boundaries),
    true
  );
});

test('resolution is deterministic across evidence ordering', () => {
  const manual =
    createProductEvidenceRecord(
      validEvidence()
    );

  const conditions =
    createProductEvidenceRecord(
      validEvidence({
        evidenceId: 'EVIDENCE-002',
        sourceId: 'SOURCE-CONDITIONS-001',
        sourceType: 'GENERAL_CONDITIONS'
      })
    );

  const forward = resolveProductEvidence(
    validResolutionTarget(),
    [manual, conditions]
  );

  const reverse = resolveProductEvidence(
    validResolutionTarget(),
    [conditions, manual]
  );

  assert.deepEqual(forward, reverse);
});

test('official evidence produces VERIFIED resolution', () => {
  const resolution = resolveProductEvidence(
    validResolutionTarget(),
    [validEvidence()]
  );

  assert.equal(
    resolution.evidenceState,
    'VERIFIED'
  );
  assert.equal(resolution.actionable, true);
  assert.deepEqual(
    resolution.prevailingEvidenceIds,
    ['EVIDENCE-001']
  );
});

test('quote-only evidence remains PARTIAL and non-actionable', () => {
  const resolution = resolveProductEvidence(
    validResolutionTarget(),
    [
      validEvidence({
        sourceType: 'QUOTE_ILLUSTRATION'
      })
    ]
  );

  assert.equal(
    resolution.evidenceState,
    'PARTIAL'
  );
  assert.equal(resolution.actionable, false);
});

test('OCR-only evidence remains UNKNOWN and non-actionable', () => {
  const resolution = resolveProductEvidence(
    validResolutionTarget(),
    [
      validEvidence({
        sourceType: 'OCR_EXTRACT'
      })
    ]
  );

  assert.equal(
    resolution.evidenceState,
    'UNKNOWN'
  );
  assert.equal(resolution.actionable, false);
});

for (const sourceType of [
  'PRODUCT_BROCHURE',
  'HUMAN_CONFIRMATION',
  'INFERENCE'
]) {
  test(
    `${sourceType} cannot create VERIFIED truth`,
    () => {
      const resolution =
        resolveProductEvidence(
          validResolutionTarget(),
          [
            validEvidence({
              sourceType
            })
          ]
        );

      assert.equal(
        resolution.evidenceState,
        'UNKNOWN'
      );
      assert.equal(
        resolution.actionable,
        false
      );
    }
  );
}

test('official-versus-OCR contradiction is preserved', () => {
  const resolution = resolveProductEvidence(
    validResolutionTarget(),
    [
      validEvidence(),
      validEvidence({
        evidenceId: 'EVIDENCE-OCR-001',
        sourceId: 'SOURCE-OCR-001',
        sourceType: 'OCR_EXTRACT',
        claimValue: {
          type: 'PERCENTAGE',
          value: 100
        }
      })
    ]
  );

  assert.equal(
    resolution.evidenceState,
    'CONFLICTED'
  );
  assert.equal(resolution.actionable, false);
  assert.deepEqual(
    resolution.prevailingEvidenceIds,
    ['EVIDENCE-001']
  );
  assert.deepEqual(
    resolution.conflicts[0].evidenceIds,
    ['EVIDENCE-001', 'EVIDENCE-OCR-001']
  );
});

test('equal-authority disagreement becomes CONFLICTED', () => {
  const resolution = resolveProductEvidence(
    validResolutionTarget(),
    [
      validEvidence(),
      validEvidence({
        evidenceId: 'EVIDENCE-002',
        sourceId: 'SOURCE-CONDITIONS-001',
        sourceType: 'GENERAL_CONDITIONS',
        claimValue: {
          type: 'PERCENTAGE',
          value: 90
        }
      })
    ]
  );

  assert.equal(
    resolution.evidenceState,
    'CONFLICTED'
  );
  assert.equal(resolution.actionable, false);
  assert.deepEqual(
    resolution.prevailingEvidenceIds,
    ['EVIDENCE-001', 'EVIDENCE-002']
  );
});

test('cross-version evidence is rejected explicitly', () => {
  const resolution = resolveProductEvidence(
    validResolutionTarget(),
    [
      validEvidence({
        productVersion: '2025.4'
      })
    ]
  );

  assert.equal(
    resolution.evidenceState,
    'UNKNOWN'
  );
  assert.deepEqual(
    resolution.rejectedEvidence,
    [{
      evidenceId: 'EVIDENCE-001',
      reason: 'CROSS_VERSION'
    }]
  );
});

test('cross-carrier evidence is rejected explicitly', () => {
  const resolution = resolveProductEvidence(
    validResolutionTarget(),
    [
      validEvidence({
        carrierId: 'OTHER-CARRIER'
      })
    ]
  );

  assert.deepEqual(
    resolution.rejectedEvidence,
    [{
      evidenceId: 'EVIDENCE-001',
      reason: 'CROSS_CARRIER'
    }]
  );
});

test('duplicate evidence IDs are rejected', () => {
  assert.throws(
    () =>
      resolveProductEvidence(
        validResolutionTarget(),
        [
          validEvidence(),
          validEvidence({
            sourceId: 'SOURCE-SECOND-001',
            sourceType:
              'GENERAL_CONDITIONS'
          })
        ]
      ),
    error =>
      error instanceof ProductTruthError &&
      error.code ===
        'PRODUCT_EVIDENCE_DUPLICATE_ID'
  );
});

test('stale evidence cannot silently prevail', () => {
  const resolution = resolveProductEvidence(
    validResolutionTarget(),
    [
      validEvidence({
        effectiveTo:
          '2026-06-01T00:00:00Z'
      })
    ]
  );

  assert.equal(
    resolution.evidenceState,
    'UNKNOWN'
  );
  assert.deepEqual(
    resolution.rejectedEvidence,
    [{
      evidenceId: 'EVIDENCE-001',
      reason: 'STALE'
    }]
  );
});

test('missing evidence remains UNKNOWN', () => {
  const resolution = resolveProductEvidence(
    validResolutionTarget(),
    []
  );

  assert.equal(
    resolution.evidenceState,
    'UNKNOWN'
  );
  assert.equal(resolution.actionable, false);
  assert.deepEqual(
    resolution.applicableEvidenceIds,
    []
  );
  assert.equal(
    Object.isFrozen(resolution),
    true
  );
  assert.equal(
    Object.isFrozen(resolution.boundaries),
    true
  );
});
